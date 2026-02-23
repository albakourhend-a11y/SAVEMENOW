import { useEffect, useState } from "react";
import axios from "axios";
import Map from "../components/Map";

export default function AdminPage() {
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/vehicle").then(res => setVehicles(res.data));
    axios.get("http://localhost:5000/emergency").then(res => setRequests(res.data));
  }, []);

  if (!vehicles.length) return <h2 style={{ textAlign: "center", color: "#e8eefc" }}>Loading vehicles...</h2>;

  const markers = vehicles.map(v => ({
    lat: v.lat,
    lng: v.lng,
    status: v.status,
    type: v.type
  }));

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>🛠 System Admin Dashboard</h1>

      {/* Map */}
      <section style={styles.card}>
        <h2 style={styles.h2}>📍 Vehicle Map</h2>
        <Map center={{ lat: 33.8938, lng: 35.5018 }} markers={markers} />
      </section>

      {/* Vehicle Status */}
      <section style={styles.card}>
        <h2 style={styles.h2}>🚗 Vehicle Status</h2>
        {vehicles.map(v => (
          <div key={v.id} style={styles.row}>
            <strong>{v.type}</strong>
            <span style={{
              ...styles.badge,
              background: v.status === "FREE" ? "#28a745" : "#dc3545"
            }}>
              {v.status === "FREE" ? "Available" : "Busy"}
            </span>
          </div>
        ))}
      </section>

      {/* Emergency Requests */}
      <section style={styles.card}>
        <h2 style={styles.h2}>📋 Emergency Requests Queue</h2>
        {requests.length === 0 ? (
          <p style={styles.muted}>No requests yet.</p>
        ) : (
          requests.map(r => (
            <div key={r.id} style={styles.requestCard}>
              <strong>{r.type}</strong> — {r.location}<br />
              Caller: {r.caller} | Status: {r.status}
              <div style={{ marginTop: 10 }}>
                <button
                  style={{ ...styles.btn, background: "#ffc107", color: "black" }}
                  onClick={() => axios.put(`http://localhost:5000/emergency/${r.id}`, { status: "IN_PROGRESS" })
                    .then(res => setRequests(prev => prev.map(req => req.id === r.id ? res.data : req)))}
                >
                  Mark In Progress
                </button>
                <button
                  style={{ ...styles.btn, background: "#28a745", color: "white" }}
                  onClick={() => axios.put(`http://localhost:5000/emergency/${r.id}`, { status: "RESOLVED" })
                    .then(res => setRequests(prev => prev.map(req => req.id === r.id ? res.data : req)))}
                >
                  Resolve
                </button>
              </div>
            </div>
          ))
        )}
      </section>
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
  },
  h1: { textAlign: "center", marginBottom: 24 },
  h2: { marginBottom: 12 },
  muted: { color: "#9fb0d0" },
  card: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "#111a2e",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
    marginBottom: 20,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 8,
    background: "rgba(255,255,255,.04)",
    marginBottom: 8,
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 999,
    fontWeight: "bold",
    color: "white",
  },
  requestCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.10)",
  },
  btn: {
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: 10,
  },
};



