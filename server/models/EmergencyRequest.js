const mongoose = require("mongoose");

const emergencyRequestSchema = new mongoose.Schema({
  caller:        { type: String, default: "Unknown caller" },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  location:      { type: String, default: "Unknown location" },
  type:          { type: String, required: true },
  severity:      { type: String, enum: ["Critical", "High", "Medium"], default: "Medium" },
  priority:      { type: String, enum: ["Normal", "Urgent", "Critical"], default: "Normal" },
  lat:           { type: Number, required: true },
  lng:           { type: Number, required: true },
  status:        { type: String, default: "Pending" },
  vehicleId:     { type: Number, default: null },
  rating:        { type: Number, min: 1, max: 5, default: null },
  ratingComment: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("EmergencyRequest", emergencyRequestSchema);
