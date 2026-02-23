import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ✅ Fix default marker icon issue in React + Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default function Map({ center, markers }) {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, []);

  const defaultCenter = center || { lat: 33.8938, lng: 35.5018 };

  return (
    <MapContainer
      center={location || defaultCenter}
      zoom={15}
      style={{ width: "100%", height: "400px" }}
    >
      {/* OpenStreetMap tiles */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />

      {/* User location marker */}
      {location && (
        <Marker position={[location.lat, location.lng]}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {/* Vehicle markers from AdminPage */}
      {markers &&
        markers.map((m, idx) => (
          <Marker key={idx} position={[m.lat, m.lng]}>
            <Popup>
              <strong>{m.type}</strong>
              <br />
              Status: {m.status}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
