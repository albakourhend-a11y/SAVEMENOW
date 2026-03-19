const express = require("express");
const vehicles = require("../data/vehicles");
const getDistance = require("../utils/distance");

const router = express.Router();

const speedMap = {
  "Ambulance": 60,
  "Fire Truck": 50,
  "Police Car": 70,
  "Rescue Jeep": 60,
};

// Temporary in-memory emergency requests list
let requests = [
  { id: 1, caller: "John Doe", location: "Main Street", type: "Fire", time: new Date(), status: "Pending" }
];

// Create new emergency request and assign nearest vehicle
router.post("/request", (req, res) => {
  const { lat, lng, emergencyType, caller, location } = req.body;

  const available = vehicles.filter(v => v.status === "FREE");
  console.log("Available vehicles:", available.length, "| All vehicles:", vehicles.map(v => v.status));

  if (!available.length) {
    return res.status(400).json({ message: "No vehicles available" });
  }

  let nearest = available[0];
  let minDist = getDistance(lat, lng, nearest.lat, nearest.lng);

  available.forEach(v => {
    const d = getDistance(lat, lng, v.lat, v.lng);
    if (d < minDist) {
      minDist = d;
      nearest = v;
    }
  });

  nearest.status = "BUSY";

  const newRequest = {
    id: requests.length + 1,
    caller,
    location,
    type: emergencyType,
    time: new Date(),
    status: "Pending"
  };
  requests.push(newRequest);

  const speedKmH = speedMap[nearest.type] || 60;
  const etaMinutes = Math.ceil((minDist / speedKmH) * 60);

  res.json({
    message: "Emergency assigned",
    vehicle: nearest,
    request: newRequest,
    etaMinutes: etaMinutes,
    distance: `${minDist.toFixed(2)} km`,
  });
}); // ← THIS WAS MISSING ✅

// Get all emergency requests
router.get("/", (req, res) => {
  res.json(requests);
});

// Update request status
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const request = requests.find(r => r.id == id);
  if (request) {
    request.status = status;
    res.json(request);
  } else {
    res.status(404).json({ error: "Request not found" });
  }
});

module.exports = router;