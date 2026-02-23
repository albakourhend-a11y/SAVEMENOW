import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { useState, useEffect } from "react";

export default function Map() {

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "AIzaSyDCYZfeDTpwYRF24B_cYjlDXO82lG-t1QQ"
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
      <Marker position={location} />
    </GoogleMap>
  );
}