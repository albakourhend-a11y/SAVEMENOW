const express = require("express");
const cors = require("cors");

// Import route files
const emergencyRoutes = require("./routes/emergencyRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Register routes
app.use("/emergency", emergencyRoutes);
app.use("/vehicle", vehicleRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
