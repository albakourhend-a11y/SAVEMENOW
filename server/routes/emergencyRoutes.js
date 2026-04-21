const express = require("express");
const jwt = require("jsonwebtoken");
const vehicles = require("../data/vehicles");
const getDistance = require("../utils/distance");
const EmergencyRequest = require("../models/EmergencyRequest");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "savemenow_secret";

// ── Extract user from JWT (optional — no error if missing) ───────────────────
function getUserFromToken(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return null;
    const token = auth.split(" ")[1];
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ── Reverse geocode lat/lng → human-readable address via Nominatim ────────────
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "SAVEMENOW-emergency-app" },
    });
    const data = await res.json();
    const a = data.address || {};
    const name = a.road || a.neighbourhood || a.suburb || a.city_district || data.display_name?.split(",")[0];
    if (name) return name;
  } catch (err) {
    console.warn("Reverse geocode failed:", err.message);
  }
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

// ── OSRM real road routing ────────────────────────────────────────────────────
async function getRoadETA(lat1, lng1, lat2, lng2) {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.length > 0) {
      const coords = data.routes[0].geometry?.coordinates || [];
      const route = coords.map(([lng, lat]) => ({ lat, lng }));
      return {
        etaMinutes: Math.ceil(data.routes[0].duration / 60),
        distanceKm: (data.routes[0].distance / 1000).toFixed(2),
        route,
        source: "OSRM",
      };
    }
  } catch (err) {
    console.warn("⚠️  OSRM unavailable:", err.message);
  }
  const dist = getDistance(lat1, lng1, lat2, lng2);
  return {
    etaMinutes: Math.ceil((dist / 60) * 60),
    distanceKm: dist.toFixed(2),
    route: [],
    source: "Haversine",
  };
}

// POST /emergency/request
router.post("/request", async (req, res) => {
  const { lat, lng, emergencyType, caller, location } = req.body;
  const user = getUserFromToken(req);

  // Duplicate check
  const duplicate = await EmergencyRequest.findOne({
    type: emergencyType,
    status: { $in: ["Pending", "IN_PROGRESS"] },
  }).then(existing => {
    if (!existing) return null;
    const dist = getDistance(lat, lng, existing.lat, existing.lng);
    return dist < 0.2 ? existing : null;
  });

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate emergency request already exists", request: duplicate });
  }

  const available = vehicles.filter(v => v.status === "FREE");
  if (!available.length) return res.status(400).json({ message: "No vehicles available" });

  let nearest = available[0];
  let minDist = getDistance(lat, lng, nearest.lat, nearest.lng);
  available.forEach(v => {
    const d = getDistance(lat, lng, v.lat, v.lng);
    if (d < minDist) { minDist = d; nearest = v; }
  });

  nearest.status = "BUSY";

  const severityMap = { Fire: "Critical", Medical: "High", Police: "Medium" };
  const resolvedLocation = location || await reverseGeocode(lat, lng);

  const newRequest = await EmergencyRequest.create({
    caller:    user?.name || caller || "Unknown caller",
    userId:    user?.id || null,
    location:  resolvedLocation,
    type:      emergencyType,
    severity:  severityMap[emergencyType] || "Medium",
    lat,
    lng,
    status:    "Pending",
    vehicleId: nearest.id,
  });

  const eta = await getRoadETA(lat, lng, nearest.lat, nearest.lng);

  res.json({
    message:         "Emergency assigned",
    vehicle:         nearest,
    request:         newRequest,
    etaMinutes:      eta.etaMinutes,
    distance:        `${eta.distanceKm} km`,
    etaSource:       eta.source,
    route:           eta.route,
    vehicleLocation: { lat: nearest.lat, lng: nearest.lng },
  });
});

// GET /emergency — all requests (admin/driver) or own requests (citizen)
router.get("/", async (req, res) => {
  const user = getUserFromToken(req);
  const query = (user?.role === "citizen" && user?.id)
    ? { userId: user.id }
    : {};
  const requests = await EmergencyRequest.find(query).sort({ createdAt: -1 });
  res.json(requests);
});

// GET /emergency/all — admin always gets all
router.get("/all", async (req, res) => {
  const requests = await EmergencyRequest.find().sort({ createdAt: -1 });
  res.json(requests);
});

// PUT /emergency/:id — update status
router.put("/:id", async (req, res) => {
  const request = await EmergencyRequest.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!request) return res.status(404).json({ error: "Request not found" });
  res.json(request);
});

// PATCH /emergency/:id/reassign
router.patch("/:id/reassign", async (req, res) => {
  const request = await EmergencyRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });

  const newVehicle = vehicles.find(v => v.id == req.body.vehicleId);
  if (!newVehicle) return res.status(404).json({ error: "Vehicle not found" });
  if (newVehicle.status !== "FREE") return res.status(400).json({ error: "Vehicle is not available" });

  const oldVehicle = vehicles.find(v => v.id === request.vehicleId);
  if (oldVehicle) oldVehicle.status = "FREE";

  newVehicle.status = "BUSY";
  request.vehicleId = newVehicle.id;
  await request.save();

  res.json({ request, vehicle: newVehicle });
});

module.exports = router;
