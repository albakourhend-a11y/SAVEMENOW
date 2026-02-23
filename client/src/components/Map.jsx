import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { useState, useEffect } from "react";

export default function Map({ center, markers }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY" // replace with your key
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

  if (!isLoaded) return <h2>Loading map...</h2>;

  return (
    <GoogleMap
      zoom={15}
      center={center || location} // use center from props if provided, fallback to user location
      mapContainerStyle={{ width: "100%", height: "400px" }}
    >
      {/* Show user location marker if available */}
      {location && <Marker position={location} />}

      {/* Show vehicle markers passed from AdminPage */}
      {markers && markers.map((m, idx) => (
        <Marker
          key={idx}
          position={{ lat: m.lat, lng: m.lng }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: m.status === "FREE" ? "green" : "red",
            fillOpacity: 0.8,
            strokeWeight: 1,
          }}
        />
      ))}
    </GoogleMap>
  );
}
