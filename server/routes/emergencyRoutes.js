const express = require("express");
const vehicles = require("../data/vehicles");
const getDistance = require("../utils/distance");

// ✅ Add MongoDB models
const Emergency = require("../models/Emergency");
const Vehicle = require("../models/Vehicle");

const router = express.Router();

// Temporary in-memory emergency requests list
let requests = [
  { id: 1, caller: "John Doe", location: "Main Street", type: "Fire", time: new Date(), status: "Pending" }
];

// Create new emergency request and assign nearest vehicle
router.post("/request", (req, res) => {
  const { lat, lng, emergencyType, caller, location } = req.body;

  const available = vehicles.filter(v => v.status === "FREE");

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

  // Add request to queue
  const newRequest = {
    id: requests.length + 1,
    caller,
    location,
    type: emergencyType,
    time: new Date(),
    status: "Pending"
  };
  requests.push(newRequest);

  res.json({
    message: "Emergency assigned",
    vehicle: nearest,
    request: newRequest
  });
});

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
