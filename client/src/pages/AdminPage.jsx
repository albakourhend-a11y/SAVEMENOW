import { useEffect, useState } from "react";
import axios from "axios";
import Map from "../components/Map";

export default function AdminPage() {
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/vehicle")
      .then(res => setVehicles(res.data))
      .catch(err => console.error("Error fetching vehicles:", err));

    axios.get("http://localhost:5000/emergency")
      .then(res => setRequests(res.data))
      .catch(err => console.error("Error fetching requests:", err));
  }, []);

  if (!vehicles.length) return <h2 style={{ textAlign: "center", color: "#f5f5f5" }}>Loading vehicles...</h2>;

  const markers = vehicles.map(v => ({
    lat: v.lat,
    lng: v.lng,
    status: v.status,
    type: v.type
  }));

  return (
    <div style={{
      padding: 40,
      maxWidth: 1000,
      margin: "0 auto",
      backgroundColor: "#121212",
      fontFamily: "Arial, sans-serif",
      color: "#f5f5f5"
    }}>
      <h1 style={{ textAlign: "center", marginBottom: 30, color: "#ffffff" }}>🛠 System Admin Dashboard</h1>

      {/* Map Section */}
      <div style={{
        border: "1px solid #333",
        borderRadius: 10,
        padding: 20,
        backgroundColor: "#1e1e1e",
        boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
        marginBottom: 30
      }}>
        <h2 style={{ marginBottom: 15, color: "#ffffff" }}>📍 Vehicle Map</h2>
        <Map center={{ lat: 33.8938, lng: 35.5018 }} markers={markers} />
      </div>

      {/* Vehicle Status Section */}
      <div style={{
        padding: 20,
        border: "1px solid #333",
        borderRadius: 10,
        backgroundColor: "#1e1e1e",
        boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
        marginBottom: 30
      }}>
        <h2 style={{ marginBottom: 20, color: "#ffffff" }}>🚗 Vehicle Status</h2>
        {vehicles.map(v => (
          <div key={v.id} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 6,
            backgroundColor: "#2a2a2a"
          }}>
            <strong>{v.type}</strong>
            <span style={{
              padding: "4px 10px",
              borderRadius: 20,
              fontWeight: "bold",
              color: "white",
              backgroundColor: v.status === "FREE" ? "#28a745" : "#dc3545"
            }}>
              {v.status === "FREE" ? "Available" : "Busy"}
            </span>
          </div>
        ))}
      </div>

      {/* Emergency Requests Section */}
      <div style={{
        padding: 20,
        border: "1px solid #333",
        borderRadius: 10,
        backgroundColor: "#1e1e1e",
        boxShadow: "0 2px 6px rgba(0,0,0,0.6)"
      }}>
        <h2 style={{ marginBottom: 20, color: "#ffffff" }}>📋 Emergency Requests Queue</h2>
        {requests.length === 0 ? (
          <p>No requests yet.</p>
        ) : (
          requests.map(r => (
            <div key={r.id} style={{
              marginBottom: 15,
              padding: 15,
              border: "1px solid #444",
              borderRadius: 8,
              backgroundColor: "#2a2a2a"
            }}>
              <strong>{r.type}</strong> — {r.location}<br />
              Caller: {r.caller} | Status: {r.status}
              <div style={{ marginTop: 10 }}>
                <button
                  style={{
                    marginRight: 10,
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: 5,
                    backgroundColor: "#ffc107",
                    color: "black",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    axios.put(`http://localhost:5000/emergency/${r.id}`, { status: "IN_PROGRESS" })
                      .then(res => {
                        setRequests(prev => prev.map(req => req.id === r.id ? res.data : req));
                      });
                  }}
                >
                  Mark In Progress
                </button>
                <button
                  style={{
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: 5,
                    backgroundColor: "#28a745",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    axios.put(`http://localhost:5000/emergency/${r.id}`, { status: "RESOLVED" })
                      .then(res => {
                        setRequests(prev => prev.map(req => req.id === r.id ? res.data : req));
                      });
                  }}
                >
                  Resolve
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

