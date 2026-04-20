const express = require("express");
const vehicles = require("../data/vehicles");

const router = express.Router();

const INACTIVITY_TIMEOUT_MS = 60_000; // 60 seconds without heartbeat → UNAVAILABLE

// ── Auto-detect inactive vehicles every 30 seconds ───────────────────────────
setInterval(() => {
  const now = Date.now();
  vehicles.forEach((v) => {
    // Only check vehicles that have ever sent a heartbeat
    if (v.lastSeen === null) return;

    const inactive = now - v.lastSeen > INACTIVITY_TIMEOUT_MS;

    if (inactive && v.status !== "UNAVAILABLE") {
      console.log(`⚠️  Vehicle #${v.id} (${v.type}) marked UNAVAILABLE — no heartbeat for 60s`);
      v.status = "UNAVAILABLE";
    }
  });
}, 30_000);

// GET /vehicle — list all vehicles
router.get("/", (req, res) => {
  res.json(vehicles);
});

// PATCH /vehicle/:id/status — manually update status
router.patch("/:id/status", (req, res) => {
  const vehicle = vehicles.find((v) => v.id == req.params.id);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  vehicle.status = req.body.status;
  vehicle.lastSeen = Date.now(); // treat status update as a heartbeat too
  res.json(vehicle);
});

// PATCH /vehicle/:id/heartbeat — driver pings to stay active
router.patch("/:id/heartbeat", (req, res) => {
  const vehicle = vehicles.find((v) => v.id == req.params.id);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  vehicle.lastSeen = Date.now();

  // If driver reconnects after being marked unavailable, set back to FREE
  if (vehicle.status === "UNAVAILABLE") {
    vehicle.status = "FREE";
    console.log(`✅ Vehicle #${vehicle.id} (${vehicle.type}) back ONLINE`);
  }

  res.json({ ok: true, lastSeen: vehicle.lastSeen, status: vehicle.status });
});

module.exports = router;
