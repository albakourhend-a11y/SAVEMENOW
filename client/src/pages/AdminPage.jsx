import { useEffect, useState } from "react";
import axios from "axios";
import Map from "../components/Map";

export default function AdminPage() {
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Fetch vehicles
    axios.get("http://localhost:5000/vehicle")
      .then(res => setVehicles(res.data));

    // Fetch emergency requests
    axios.get("http://localhost:5000/emergency")
      .then(res => setRequests(res.data));
  }, []);

  if (!vehicles.length) return <h2>Loading vehicles...</h2>;

  // 👉 Include status and type so Map can use them
  const markers = vehicles.map(v => ({
    lat: v.lat,
    lng: v.lng,
    status: v.status,
    type: v.type
  }));

  return (
    <div style={{ padding: 20 }}>
      <h1>System Admin Dashboard</h1>

      {/* Map with vehicle markers */}
      <Map
        center={{ lat: 33.8938, lng: 35.5018 }}
        markers={markers}
      />

      {/* Vehicle Status section */}
      <div style={{ marginTop: 20 }}>
        <h2>Vehicle Status</h2>
        {vehicles.map(v => (
          <div key={v.id} style={{ marginBottom: 10 }}>
            <strong>{v.type}</strong> —
            Status: {v.status === "FREE" ? "✅ Available" : "🚨 Busy"}
          </div>
        ))}
      </div>

      {/* Emergency Requests Queue section */}
      <div style={{ marginTop: 40 }}>
        <h2>Emergency Requests Queue</h2>
        {requests.length === 0 ? (
          <p>No requests yet.</p>
        ) : (
          requests.map(r => (
            <div key={r.id} style={{ marginBottom: 10 }}>
              <strong>{r.type}</strong> — {r.location}  
              <br />
              Caller: {r.caller} | Status: {r.status}
              <button
                style={{ marginLeft: 10 }}
                onClick={() => {
                  axios.put(`http://localhost:5000/emergency/${r.id}`, { status: "IN_PROGRESS" })
                    .then(res => {
                      setRequests(prev =>
                        prev.map(req => req.id === r.id ? res.data : req)
                      );
                    });
                }}
              >
                Mark In Progress
              </button>
              <button
                style={{ marginLeft: 10 }}
                onClick={() => {
                  axios.put(`http://localhost:5000/emergency/${r.id}`, { status: "RESOLVED" })
                    .then(res => {
                      setRequests(prev =>
                        prev.map(req => req.id === r.id ? res.data : req)
                      );
                    });
                }}
              >
                Resolve
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
