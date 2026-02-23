const express = require("express");
const getDistance = require("../utils/distance");

// ✅ Add MongoDB models
const Emergency = require("../models/Emergency");
const Vehicle = require("../models/Vehicle");

const router = express.Router();

// Temporary in-memory emergency requests list (you can keep this for testing)
let requests = [
  { id: 1, caller: "John Doe", location: "Main Street", type: "Fire", time: new Date(), status: "Pending" }
];

// ✅ Create new emergency request and assign nearest vehicle
router.post("/request", async (req, res) => {
  const { lat, lng, emergencyType, caller, location } = req.body;

  try {
    // Find available vehicles in DB
    const available = await Vehicle.find({ status: "FREE" });
    if (!available.length) {
      return res.status(400).json({ message: "No vehicles available" });
    }

    // Find nearest vehicle
    let nearest = available[0];
    let minDist = getDistance(lat, lng, nearest.lat, nearest.lng);

    available.forEach(v => {
      const d = getDistance(lat, lng, v.lat, v.lng);
      if (d < minDist) {
        minDist = d;
        nearest = v;
      }
    });

    // Mark vehicle as BUSY
    nearest.status = "BUSY";
    await nearest.save();

    // Save emergency request in DB
    const newRequest = new Emergency({
      caller,
      location,
      type: emergencyType,
      lat,
      lng,
      time: new Date(),
      status: "Pending"
    });
    await newRequest.save();

    // Also push to in-memory list (optional, for testing)
    requests.push({
      id: requests.length + 1,
      caller,
      location,
      type: emergencyType,
      time: new Date(),
      status: "Pending"
    });

    res.json({
      message: "Emergency assigned",
      vehicle: nearest,
      request: newRequest
    });
  } catch (err) {
    console.error("❌ Error creating emergency request:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

// ✅ Get all emergency requests
router.get("/", async (req, res) => {
  try {
    const requests = await Emergency.find();
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// ✅ Update request status
router.put("/:id", async (req, res) => {
  try {
    const request = await Emergency.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: "Failed to update request" });
  }
});

module.exports = router;
