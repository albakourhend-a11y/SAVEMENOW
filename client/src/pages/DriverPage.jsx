import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

// Sprint-2 fallback so you can demo even if Citizen/Geolocation isn't working
const MOCK_EMERGENCY = {
  id: 9999,
  type: "Medical",
  location: "Hamra, Beirut",
  caller: "Anonymous",
  status: "Pending",
};

export default function DriverPage() {
  const [vehicle, setVehicle] = useState(null);
  const [status, setStatus] = useState("FREE");
  const [requests, setRequests] = useState([]);
  const [serverOk, setServerOk] = useState(true);

  const vehicleId = 1;

  // Initial fetch
  useEffect(() => {
    const load = async () => {
      try {
        const [vehRes, reqRes] = await Promise.all([
          axios.get(`${API}/vehicle`),
          axios.get(`${API}/emergency`),
        ]);

        const v = vehRes.data.find((v) => v.id === vehicleId);
        setVehicle(v);
        setStatus(v?.status ?? "FREE");
        setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
        setServerOk(true);
      } catch (e) {
        console.warn("Backend not reachable, using mock emergency.", e);
        setServerOk(false);

        setVehicle({ id: vehicleId, status: "FREE", type: "Ambulance" });
        setStatus("FREE");
        setRequests([MOCK_EMERGENCY]);
      }
    };

    load();
  }, []);

  // Pick latest non-resolved request
  const assignedRequest = useMemo(() => {
    const pending = requests.filter((r) => {
      const s = String(r.status || "").toUpperCase();
      return s !== "RESOLVED" && s !== "REJECTED";
    });
    return pending.length ? pending[pending.length - 1] : null;
  }, [requests]);

  const updateVehicleStatus = async (newStatus) => {
    setStatus(newStatus);
    if (!serverOk) return;

    try {
      await axios.patch(`${API}/vehicle/${vehicleId}/status`, {
        status: newStatus,
      });
    } catch (e) {
      console.error("Failed to update vehicle status:", e);
    }
  };

  const updateEmergencyStatus = async (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    if (!serverOk || id === MOCK_EMERGENCY.id) return;

    try {
      const res = await axios.put(`${API}/emergency/${id}`, {
        status: newStatus,
      });

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? res.data : r))
      );
    } catch (e) {
      console.error("Failed to update emergency status:", e);
    }
  };

  const acceptEmergency = async () => {
    if (!assignedRequest) return;
    await updateEmergencyStatus(assignedRequest.id, "IN_PROGRESS");
    await updateVehicleStatus("BUSY");
  };

  const rejectEmergency = async () => {
    if (!assignedRequest) return;
    await updateEmergencyStatus(assignedRequest.id, "REJECTED");
    await updateVehicleStatus("FREE");
  };

  const toggleStatus = () => {
    const newStatus = status === "FREE" ? "BUSY" : "FREE";
    updateVehicleStatus(newStatus);
  };

  if (!vehicle) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Loading driver...</h2>
        <button
          onClick={() => {
            setVehicle({ id: 1, status: "FREE", type: "Ambulance" });
            setStatus("FREE");
            setRequests([MOCK_EMERGENCY]);
            setServerOk(false);
          }}
        >
          Load Demo Driver (Mock)
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Driver Dashboard</h1>

      {!serverOk && (
        <p style={{ color: "#b45309" }}>
          ⚠️ Backend not reachable — showing mock emergency for Sprint 2 demo.
        </p>
      )}

      <h3>Status: {status}</h3>

      <button onClick={toggleStatus}>
        Go {status === "FREE" ? "Busy" : "Available"}
      </button>

      <hr style={{ margin: "20px 0" }} />

      <h2>Assigned Emergency</h2>

      {!assignedRequest ? (
        <p>No pending emergencies right now.</p>
      ) : (
        <div
          style={{
            border: "1px solid #ddd",
            padding: 16,
            borderRadius: 10,
            maxWidth: 520,
          }}
        >
          <p><strong>Type:</strong> {assignedRequest.type}</p>
          <p><strong>Location:</strong> {assignedRequest.location}</p>
          <p><strong>Caller:</strong> {assignedRequest.caller}</p>
          <p><strong>Status:</strong> {assignedRequest.status}</p>

          {String(assignedRequest.status || "").toUpperCase() ===
          "IN_PROGRESS" ? (
            <p style={{ marginTop: 10, fontWeight: 600 }}>
              ✅ Accepted — en route
            </p>
          ) : (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={acceptEmergency}>Accept</button>
              <button onClick={rejectEmergency}>Reject</button>
            </div>
          )}

          <p style={{ marginTop: 10, opacity: 0.75 }}>
            Accept/Reject updates emergency + vehicle status so the system can
            react accordingly.
          </p>
        </div>
      )}

      {assignedRequest && (
        <h2 style={{ color: "red", marginTop: 20 }}>
          🚨 Emergency Assigned!
        </h2>
      )}
    </div>
  );
}
