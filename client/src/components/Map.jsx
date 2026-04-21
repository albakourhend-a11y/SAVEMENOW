import { GoogleMap, useLoadScript, Marker, Polyline } from "@react-google-maps/api";
import { useState, useEffect, useRef, useCallback } from "react";

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
  const mapRef = useRef(null);

  useEffect(() => {
    if (center) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, [center]);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Fit map to show full route when route or vehicleLocation arrives
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    const points = [...route];
    if (vehicleLocation) points.push(vehicleLocation);
    if (location) points.push(location);
    if (points.length < 2) return;

    const bounds = new window.google.maps.LatLngBounds();
    points.forEach(p => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 60);
  }, [route, vehicleLocation, location]);

  const mapCenter = center || location;
  if (!isLoaded || !mapCenter) return <h2>Loading map...</h2>;

  return (
    <GoogleMap
      zoom={15}
      center={mapCenter}
      mapContainerStyle={{ width: "100%", height: "400px" }}
      onLoad={onLoad}
    >
      {!center && location && (
        <Marker position={location} label={{ text: "You", color: "white", fontWeight: "bold", fontSize: "11px" }} />
      )}

      {markers.map((marker, index) => (
        <Marker
          key={`vehicle-${index}-${marker.lat.toFixed(5)}-${marker.lng.toFixed(5)}`}
          position={{ lat: marker.lat, lng: marker.lng }}
        />
      ))}

      {vehicleLocation && (
        <Marker
          position={vehicleLocation}
          icon={{ url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
          label={{ text: "🚑", fontSize: "18px" }}
        />
      )}

      {route.length > 0 && (
        <Polyline
          path={route}
          options={{ strokeColor: "#2563eb", strokeOpacity: 0.9, strokeWeight: 5 }}
        />
      )}
    </GoogleMap>
  );
}