require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Import route files
const emergencyRoutes = require("./routes/emergencyRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();

// ✅ Connect to MongoDB
//console.log("MONGO_URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Register routes
app.use("/emergency", emergencyRoutes);
app.use("/vehicle", vehicleRoutes);

// ✅ Use dynamic PORT (important for Render)
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}); 
