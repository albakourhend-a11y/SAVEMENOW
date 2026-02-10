const express = require("express");
const vehicles = require("../data/vehicles");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(vehicles);
});

router.patch("/:id/status", (req, res) => {
  const vehicle = vehicles.find(v => v.id == req.params.id);
  vehicle.status = req.body.status;
  res.json(vehicle);
});

module.exports = router;
