const express = require("express");
const vehicles = require("../data/vehicles"); // keep this for testing
const Vehicle = require("../models/Vehicle"); // ✅ add MongoDB model

const router = express.Router();

// ✅ Get all vehicles (from DB)
router.get("/", async (req, res) => {
  try {
    const dbVehicles = await Vehicle.find();
    // If DB is empty, fall back to in-memory list
    res.json(dbVehicles.length ? dbVehicles : vehicles);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// ✅ Update vehicle status
router.patch("/:id/status", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!vehicle) {
      // fallback: update in-memory list
      const memVehicle = vehicles.find(v => v.id == req.params.id);
      if (memVehicle) {
        memVehicle.status = req.body.status;
        return res.json(memVehicle);
      }
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: "Failed to update vehicle status" });
  }
});

// ✅ Update vehicle location
router.put("/:id/location", async (req, res) => {
  const { lat, lng } = req.body;
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { lat, lng },
      { new: true }
    );

    if (!vehicle) {
      // fallback: update in-memory list
      const memVehicle = vehicles.find(v => v.id == req.params.id);
      if (memVehicle) {
        memVehicle.lat = lat;
        memVehicle.lng = lng;
        return res.json(memVehicle);
      }
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: "Failed to update vehicle location" });
  }
});

module.exports = router;
