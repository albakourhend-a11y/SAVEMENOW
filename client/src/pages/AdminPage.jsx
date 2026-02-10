import { useEffect, useState } from "react";
import axios from "axios";
import Map from "../components/Map";


export default function AdminPage() {
const [vehicles, setVehicles] = useState([]);


useEffect(() => {
axios
.get("http://localhost:5000/vehicle")
.then(res => setVehicles(res.data));
}, []);


if (!vehicles.length) return <h2>Loading vehicles...</h2>;


const markers = vehicles.map(v => ({
lat: v.lat,
lng: v.lng
}));
return (
<div style={{ padding: 20 }}>
<h1>System Admin Dashboard</h1>


<Map
center={{ lat: 33.8938, lng: 35.5018 }}
markers={markers}
/>


<div style={{ marginTop: 20 }}>
<h2>Vehicle Status</h2>
{vehicles.map(v => (
<div key={v.id} style={{ marginBottom: 10 }}>
<strong>{v.type}</strong> —
Status: {v.status === "FREE" ? "✅ Available" : "🚨 Busy"}
</div>
))}
</div>
</div>
);
}