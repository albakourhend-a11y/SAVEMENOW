import { GoogleMap, useLoadScript, Marker, Polyline } from "@react-google-maps/api";
import { useState, useEffect } from "react";

export default function Map({
  center = null,
  markers = [],
  route = [],
  vehicleLocation = null
}) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyDCYZfeDTpwYRF24B_cYjlDXO82lG-t1QQ"
  });

  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (center) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
    });
  }, [center]);

  const mapCenter = center || location;

  if (!isLoaded || !mapCenter) return <h2>Loading map...</h2>;

  return (
    <GoogleMap
      zoom={15}
      center={mapCenter}
      mapContainerStyle={{ width: "100%", height: "400px" }}
    >
      {!center && location && <Marker position={location} />}

      {markers.map((marker, index) => (
        <Marker
          key={index}
          position={{ lat: marker.lat, lng: marker.lng }}
        />
      ))}

      {vehicleLocation && <Marker position={vehicleLocation} />}

      {route.length > 0 && (
        <Polyline
          path={route}
          options={{
            strokeColor: "#2563eb",
            strokeOpacity: 0.9,
            strokeWeight: 5
          }}
        />
      )}
    </GoogleMap>
  );
}