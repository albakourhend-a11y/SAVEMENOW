import { useEffect, useState } from "react";
import axios from "axios";
import Map from "../components/Map";

export default function AdminPage() {
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignedVehicle, setAssignedVehicle] = useState(null);

  useEffect(() => {
    // Fetch vehicles
    axios.get("http://localhost:5000/vehicle")
      .then(res => setVehicles(res.data))
      .catch(err => console.error("Error fetching vehicles:", err));

    // Fetch emergency requests
    axios.get("http://localhost:5000/emergency")
      .then(res => setRequests(res.data))
      .catch(err => console.error("Error fetching requests:", err));

    // ✅ Poll every 5 seconds for live updates
    const interval = setInterval(() => {
      axios.get("http://localhost:5000/vehicle")
        .then(res => setVehicles(res.data))
        .catch(err => console.error("Error fetching vehicles:", err));

      axios.get("http://localhost:5000/emergency")
        .then(res => setRequests(res.data))
        .catch(err => console.error("Error fetching requests:", err));
    }, 5000);

    return () => clearInterval(interval);
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

      {/* Map with vehicle markers and emergencies */}
      <Map
        center={{ lat: 33.8938, lng: 35.5018 }}
        markers={markers}
        emergencies={requests}
        assignedVehicle={assignedVehicle}
      />

      {/* Vehicle Status section */}
      <div style={{ marginTop: 20 }}>
        <h2>Vehicle Status</h2>
        {vehicles.map(v => (
          <div key={v._id} style={{ marginBottom: 10 }}>
            <strong>{v.type}</strong> —
            Status: {v.status === "FREE" ? "✅ Available" : "🚨 Busy"}
            <button
              style={{ marginLeft: 10 }}
              onClick={() => setAssignedVehicle(v)}
            >
              Assign
            </button>
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
            <div key={r._id} style={{ marginBottom: 10 }}>
              <strong>{r.type}</strong> — {r.location}  
              <br />
              Caller: {r.caller} | Status: {r.status}
              <button
                style={{ marginLeft: 10 }}
                onClick={() => {
                  axios.put(`http://localhost:5000/emergency/${r._id}`, { status: "IN_PROGRESS" })
                    .then(res => {
                      setRequests(prev =>
                        prev.map(req => req._id === r._id ? res.data : req)
                      );
                    })
                    .catch(err => console.error("Error updating request:", err));
                }}
              >
                Mark In Progress
              </button>
              <button
                style={{ marginLeft: 10 }}
                onClick={() => {
                  axios.put(`http://localhost:5000/emergency/${r._id}`, { status: "RESOLVED" })
                    .then(res => {
                      setRequests(prev =>
                        prev.map(req => req._id === r._id ? res.data : req)
                      );
                    })
                    .catch(err => console.error("Error resolving request:", err));
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
