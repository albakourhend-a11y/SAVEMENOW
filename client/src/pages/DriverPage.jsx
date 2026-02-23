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

  if (!vehicle) return <h2 style={{ color: "#e8eefc", textAlign: "center" }}>Loading driver...</h2>;

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Driver Dashboard</h1>

      <h3 style={{
        textAlign: "center",
        color: status === "FREE" ? "#28a745" : "#dc3545"
      }}>
        Status: {status === "FREE" ? "✅ Available" : "🚨 Busy"}
      </h3>

      <button
        onClick={toggleStatus}
        style={{
          ...styles.dangerBtn,
          background: status === "FREE" ? "#e11d48" : "#28a745"
        }}
      >
        {status === "FREE" ? "Go Busy" : "Go Available"}
      </button>

      {status === "BUSY" && (
        <div style={styles.emergencyCard}>
          <h2 style={{ color: "#e11d48" }}>🚨 Emergency Assigned!</h2>
          <p><strong>Type:</strong> {vehicle.assignedEmergency?.type || "Unknown"}</p>
          <p><strong>Location:</strong> {vehicle.assignedEmergency?.location || "Unknown"}</p>
          <p><strong>Caller:</strong> {vehicle.assignedEmergency?.caller || "Unknown"}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "#e8eefc",
    padding: 24,
    fontFamily: "Arial, sans-serif",
    maxWidth: 600,
    margin: "0 auto",
  },
  h1: { textAlign: "center", marginBottom: 20 },
  dangerBtn: {
    display: "block",
    width: "100%",
    padding: "14px 16px",
    marginTop: 20,
    fontSize: "16px",
    fontWeight: "bold",
    color: "white",
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    letterSpacing: ".5px",
  },
  emergencyCard: {
    marginTop: 30,
    padding: 20,
    background: "rgba(225,29,72,.12)",
    border: "1px solid rgba(225,29,72,.25)",
    borderRadius: 14,
  },
};

