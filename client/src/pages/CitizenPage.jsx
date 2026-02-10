import Map from "../components/Map";
import { useState } from "react";
import axios from "axios";

export default function CitizenPage() {
  const [type, setType] = useState("Medical");

  const sendEmergency = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      axios.post("http://localhost:5000/emergency/request", {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        emergencyType: type
      }).then(res => alert("Help is on the way"));
    });
  };

  return (
    <>
        <Map />
      <select onChange={e => setType(e.target.value)}>
        <option>Medical</option>
        <option>Fire</option>
        <option>Police</option>
      </select>

      <button
        onClick={sendEmergency}
        style={{ background: "red", color: "white", padding: 20 }}
      >
        REQUEST HELP
      </button>
    </>
  );
}
