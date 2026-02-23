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
      <header style={styles.header}>
        <h1 style={styles.h1}>Driver Dashboard</h1>
        <div style={styles.pill}>
          Vehicle: <b style={{ marginLeft: 6 }}>{vehicle.type}</b>
        </div>
      </header>

      <section style={styles.card}>
        <h2 style={styles.h2}>Current Status</h2>
        <p style={{
          ...styles.statusText,
          color: status === "FREE" ? "#28a745" : "#dc3545"
        }}>
          {status === "FREE" ? "✅ Available" : "🚨 Busy"}
        </p>

        <button
          onClick={toggleStatus}
          style={{
            ...styles.actionBtn,
            background: status === "FREE" ? "#e11d48" : "#28a745"
          }}
        >
          {status === "FREE" ? "Go Busy" : "Go Available"}
        </button>
      </section>

      {status === "BUSY" && (
        <section style={styles.card}>
          <h2 style={styles.h2}>🚨 Emergency Assigned!</h2>
          <p><strong>Type:</strong> {vehicle.assignedEmergency?.type || "Unknown"}</p>
          <p><strong>Location:</strong> {vehicle.assignedEmergency?.location || "Unknown"}</p>
          <p><strong>Caller:</strong> {vehicle.assignedEmergency?.caller || "Unknown"}</p>
        </section>
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
    maxWidth: 700,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  h1: { margin: 0, fontSize: 26 },
  h2: { marginBottom: 12, fontSize: 18 },
  pill: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.06)",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  card: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "#111a2e",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
    marginBottom: 20,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  actionBtn: {
    width: "100%",
    border: "none",
    borderRadius: 14,
    color: "white",
    padding: "14px 16px",
    fontWeight: 800,
    letterSpacing: ".5px",
    cursor: "pointer",
    fontSize: 16,
  },
};

