const express = require("express");
const vehicles = require("../data/vehicles");
const getDistance = require("../utils/distance");

const router = express.Router();

router.post("/request", (req, res) => {
  const { lat, lng, emergencyType } = req.body;

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

  res.json({
    message: "Emergency assigned",
    vehicle: nearest
  });
});

module.exports = router;
