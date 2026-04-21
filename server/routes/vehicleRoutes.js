const express = require("express");
const vehicles = require("../data/vehicles");

const router = express.Router();

const INACTIVITY_TIMEOUT_MS = 60_000;

// ── Demo: simulate vehicle movement on the server every 4 seconds ─────────────
const DEMO_ROUTES = {
  1: [ // Ambulance — wide Hamra→Sanayeh loop
    { lat: 33.8938, lng: 35.5018 }, { lat: 33.8960, lng: 35.5050 },
    { lat: 33.8985, lng: 35.5080 }, { lat: 33.9010, lng: 35.5060 },
    { lat: 33.9025, lng: 35.5030 }, { lat: 33.9010, lng: 35.5000 },
    { lat: 33.8985, lng: 35.4970 }, { lat: 33.8960, lng: 35.4990 },
  ],
  2: [ // Fire Truck — Verdun→Tallet el Khayat loop
    { lat: 33.8820, lng: 35.4900 }, { lat: 33.8860, lng: 35.4940 },
    { lat: 33.8900, lng: 35.4980 }, { lat: 33.8940, lng: 35.4960 },
    { lat: 33.8960, lng: 35.4920 }, { lat: 33.8930, lng: 35.4880 },
    { lat: 33.8890, lng: 35.4860 }, { lat: 33.8850, lng: 35.4880 },
  ],
  3: [ // Police Car — Achrafieh→Gemmayzeh loop
    { lat: 33.8890, lng: 35.5120 }, { lat: 33.8920, lng: 35.5160 },
    { lat: 33.8950, lng: 35.5200 }, { lat: 33.8980, lng: 35.5180 },
    { lat: 33.8970, lng: 35.5140 }, { lat: 33.8940, lng: 35.5100 },
    { lat: 33.8910, lng: 35.5080 }, { lat: 33.8900, lng: 35.5100 },
  ],
  4: [ // Rescue Jeep — Badaro→Mar Mikhael loop
    { lat: 33.8830, lng: 35.5050 }, { lat: 33.8860, lng: 35.5090 },
    { lat: 33.8890, lng: 35.5130 }, { lat: 33.8920, lng: 35.5110 },
    { lat: 33.8910, lng: 35.5070 }, { lat: 33.8880, lng: 35.5040 },
    { lat: 33.8850, lng: 35.5020 }, { lat: 33.8840, lng: 35.5035 },
  ],
};
const demoSteps = { 1: 0, 2: 0, 3: 0, 4: 0 };

setInterval(() => {
  vehicles.forEach((v) => {
    const route = DEMO_ROUTES[v.id];
    if (!route) return;
    const pt = route[demoSteps[v.id] % route.length];
    demoSteps[v.id]++;
    v.lat = pt.lat;
    v.lng = pt.lng;
  });
}, 4_000);

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

// PATCH /vehicle/:id/heartbeat — driver pings to stay active, optionally with GPS coords
router.patch("/:id/heartbeat", (req, res) => {
  const vehicle = vehicles.find((v) => v.id == req.params.id);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  vehicle.lastSeen = Date.now();

  const { lat, lng } = req.body;
  if (lat != null && lng != null) {
    vehicle.lat = lat;
    vehicle.lng = lng;
  }

  // If driver reconnects after being marked unavailable, set back to FREE
  if (vehicle.status === "UNAVAILABLE") {
    vehicle.status = "FREE";
    console.log(`✅ Vehicle #${vehicle.id} (${vehicle.type}) back ONLINE`);
  }

  res.json({ ok: true, lastSeen: vehicle.lastSeen, status: vehicle.status });
});

module.exports = router;
