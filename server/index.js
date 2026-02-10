const express = require("express");
const cors = require("cors");

const emergencyRoutes = require("./routes/emergencyRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/emergency", emergencyRoutes);
app.use("/vehicle", vehicleRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
