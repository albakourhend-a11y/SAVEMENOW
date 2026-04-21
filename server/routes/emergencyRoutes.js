const express = require("express");
const vehicles = require("../data/vehicles");
const getDistance = require("../utils/distance");

const router = express.Router();

const speedMap = {
  "Ambulance":   60,
  "Fire Truck":  50,
  "Police Car":  70,
  "Rescue Jeep": 60,
};

// Temporary in-memory emergency requests list
let requests = [
  {
    id: 1,
    caller: "John Doe",
    location: "Main Street",
    type: "Fire",
    lat: 33.8938,
    lng: 35.5018,
    time: new Date(),
    status: "Pending",
  },
];

// ── OSRM real road routing (free, no API key) ─────────────────────────────────
async function getRoadETA(lat1, lng1, lat2, lng2) {
  try {
    // OSRM uses longitude,latitude order
    const url = `http://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();

    if (data.code === "Ok" && data.routes?.length > 0) {
      const durationSec = data.routes[0].duration;   // seconds
      const distanceKm  = data.routes[0].distance / 1000; // km
      return {
        etaMinutes: Math.ceil(durationSec / 60),
        distanceKm: distanceKm.toFixed(2),
        source: "OSRM",
      };
    }
  } catch (err) {
    console.warn("⚠️  OSRM unavailable, falling back to straight-line ETA:", err.message);
  }

  // Fallback: straight-line Haversine + average speed
  const dist = getDistance(lat1, lng1, lat2, lng2);
  return {
    etaMinutes: Math.ceil((dist / 60) * 60),
    distanceKm: dist.toFixed(2),
    source: "Haversine",
  };
}

// POST /emergency/request — create new emergency & assign nearest vehicle
router.post("/request", async (req, res) => {
  const { lat, lng, emergencyType, caller, location } = req.body;

  // 1) Prevent duplicate active requests (same type + within 200m)
  const duplicate = requests.find((r) => {
    const active = r.status === "Pending" || r.status === "IN_PROGRESS";
    const sameType = r.type === emergencyType;
    const closeEnough =
      typeof r.lat === "number" &&
      typeof r.lng === "number" &&
      getDistance(lat, lng, r.lat, r.lng) < 0.2;
    return active && sameType && closeEnough;
  });

  if (duplicate) {
    return res.status(409).json({
      message: "Duplicate emergency request already exists",
      request: duplicate,
    });
  }

  // 2) Only assign FREE vehicles (BUSY and UNAVAILABLE are excluded)
  const available = vehicles.filter((v) => v.status === "FREE");

  if (!available.length) {
    return res.status(400).json({ message: "No vehicles available" });
  }

  // 3) Find nearest vehicle using straight-line distance
  let nearest = available[0];
  let minDist = getDistance(lat, lng, nearest.lat, nearest.lng);

  available.forEach((v) => {
    const d = getDistance(lat, lng, v.lat, v.lng);
    if (d < minDist) { minDist = d; nearest = v; }
  });

  nearest.status = "BUSY";

  const severityMap = { Fire: "Critical", Medical: "High", Police: "Medium" };

  const newRequest = {
    id:        requests.length + 1,
    caller:    caller   || "Unknown caller",
    location:  location || "Current GPS location",
    type:      emergencyType,
    severity:  severityMap[emergencyType] || "Medium",
    lat,
    lng,
    time:      new Date(),
    status:    "Pending",
    vehicleId: nearest.id,
  };

  requests.push(newRequest);

  // 4) Get real road ETA via OSRM (falls back to Haversine if offline)
  const eta = await getRoadETA(lat, lng, nearest.lat, nearest.lng);

  res.json({
    message:    "Emergency assigned",
    vehicle:    nearest,
    request:    newRequest,
    etaMinutes: eta.etaMinutes,
    distance:   `${eta.distanceKm} km`,
    etaSource:  eta.source,   // "OSRM" or "Haversine"
  });
});

// GET /emergency — list all requests
router.get("/", (req, res) => {
  res.json(requests);
});

// PUT /emergency/:id — update status
router.put("/:id", (req, res) => {
  const request = requests.find((r) => r.id == req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });

  request.status = req.body.status;
  res.json(request);
});

// PATCH /emergency/:id/reassign — reassign to a different vehicle
router.patch("/:id/reassign", (req, res) => {
  const request = requests.find((r) => r.id == req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });

  const newVehicle = vehicles.find((v) => v.id == req.body.vehicleId);
  if (!newVehicle) return res.status(404).json({ error: "Vehicle not found" });
  if (newVehicle.status !== "FREE") return res.status(400).json({ error: "Vehicle is not available" });

  // Free the old vehicle
  const oldVehicle = vehicles.find((v) => v.id === request.vehicleId);
  if (oldVehicle) oldVehicle.status = "FREE";

  // Assign the new vehicle
  newVehicle.status = "BUSY";
  request.vehicleId = newVehicle.id;

  res.json({ request, vehicle: newVehicle });
});

module.exports = router;
