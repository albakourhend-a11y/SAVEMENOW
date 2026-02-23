import { GoogleMap, useLoadScript, Marker, Polyline } from "@react-google-maps/api";
import { useState, useEffect } from "react";

export default function Map({ vehicles = [], emergencies = [], assignedVehicle }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "YOUR_API_KEY"
  });

  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    });
  }, []);

  if (!isLoaded || !location) return <h2>Loading map...</h2>;

  return (
    <GoogleMap
      zoom={15}
      center={location}
      mapContainerStyle={{ width: "100%", height: "400px" }}
    >
      {/* Dispatcher’s own location */}
      <Marker position={location} />

      {/* Vehicle markers */}
      {vehicles.map((v, idx) => (
        <Marker
          key={idx}
          position={{ lat: v.lat, lng: v.lng }}
          label={v.status === "BUSY" ? "🚨" : "✅"}
        />
      ))}

      {/* Polyline from assigned vehicle to emergency */}
      {emergencies.map((e, idx) => (
        <Polyline
          key={idx}
          path={[
            { lat: assignedVehicle.lat, lng: assignedVehicle.lng },
            { lat: e.lat, lng: e.lng }
          ]}
          options={{ strokeColor: "blue", strokeWeight: 4 }}
        />
      ))}
    </GoogleMap>
  );
}
