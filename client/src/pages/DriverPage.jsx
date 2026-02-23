import { useEffect, useState } from "react";
import axios from "axios";

export default function DriverPage() {
  const [vehicle, setVehicle] = useState(null);
  const [status, setStatus] = useState("FREE");

  // Fake driver = vehicle 1
  const vehicleId = 1;

  useEffect(() => {
    axios.get("http://localhost:5000/vehicle")
      .then(res => {
        const v = res.data.find(v => v.id === vehicleId);
        setVehicle(v);
        setStatus(v.status);
      });
  }, []);

  // Poll for emergencies
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
    <div style={{ padding: 40 }}>
      <h1>Driver Dashboard</h1>

      <h3>Status: {status}</h3>

      <button onClick={toggleStatus}>
        Go {status === "FREE" ? "Busy" : "Available"}
      </button>

      {status === "BUSY" && (
        <h2 style={{ color: "red" }}>🚨 Emergency Assigned!</h2>
      )}
    </div>
  );
}
