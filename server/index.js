require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Import route files
const emergencyRoutes = require("./routes/emergencyRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");

// Import Vehicle model
const Vehicle = require("./models/Vehicle");

const app = express();

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Register routes
app.use("/emergency", emergencyRoutes);
app.use("/vehicle", vehicleRoutes);

// ✅ New route: update vehicle location
app.put("/vehicle/:id/location", async (req, res) => {
  const { lat, lng } = req.body;
  const vehicleId = req.params.id;

  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { lat, lng },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json(vehicle);
  } catch (err) {
    console.error("❌ Error updating vehicle location:", err);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// ✅ Use dynamic PORT (important for Render)
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
