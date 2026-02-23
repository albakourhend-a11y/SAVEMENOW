import { useEffect, useState } from "react";
import axios from "axios";

export default function DriverPage() {
  const [vehicle, setVehicle] = useState(null);
  const [status, setStatus] = useState("FREE");
  const vehicleId = 1;

  useEffect(() => {
    axios.get("http://localhost:5000/vehicle")
      .then(res => {
        const v = res.data.find(v => v.id === vehicleId);
        setVehicle(v);
        setStatus(v.status);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get("http://localhost:5000/vehicle")
        .then(res => {
          const v = res.data.find(v => v.id === vehicleId);
          setVehicle(v);
        });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleStatus = () => {
    const newStatus = status === "FREE" ? "BUSY" : "FREE";
    axios.patch(`http://localhost:5000/vehicle/${vehicleId}/status`, {
      status: newStatus
    }).then(() => setStatus(newStatus));
  };

  if (!vehicle) return <h2>Loading driver...</h2>;

  return (
    <div style={{
      padding: 40,
      maxWidth: 600,
      margin: "0 auto",
      border: "1px solid #ddd",
      borderRadius: 10,
      backgroundColor: "#fafafa"
    }}>
      <h1 style={{ textAlign: "center" }}>Driver Dashboard</h1>

      <h3 style={{
        textAlign: "center",
        color: status === "FREE" ? "green" : "red"
      }}>
        Status: {status === "FREE" ? "✅ Available" : "🚨 Busy"}
      </h3>

      <button
        onClick={toggleStatus}
        style={{
          display: "block",
          width: "100%",
          padding: "12px",
          marginTop: 20,
          fontSize: "16px",
          fontWeight: "bold",
          backgroundColor: status === "FREE" ? "#d9534f" : "#5cb85c",
          color: "white",
          border: "none",
          borderRadius: 5,
          cursor: "pointer"
        }}
      >
        {status === "FREE" ? "Go Busy" : "Go Available"}
      </button>

      {status === "BUSY" && (
        <div style={{
          marginTop: 30,
          padding: 20,
          backgroundColor: "#ffe5e5",
          border: "1px solid #ff0000",
          borderRadius: 8
        }}>
          <h2 style={{ color: "red" }}>🚨 Emergency Assigned!</h2>
          <p><strong>Type:</strong> {vehicle.assignedEmergency?.type || "Unknown"}</p>
          <p><strong>Location:</strong> {vehicle.assignedEmergency?.location || "Unknown"}</p>
          <p><strong>Caller:</strong> {vehicle.assignedEmergency?.caller || "Unknown"}</p>
        </div>
      )}
    </div>
  );
}
