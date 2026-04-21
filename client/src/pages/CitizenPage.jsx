import Map from "../components/Map";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const EMERGENCY_TYPES = [
  { key: "Medical", icon: "🩺", title: "Medical", desc: "Ambulance / urgent health help", color: "#0ea5e9", bg: "rgba(14,165,233,.12)", border: "rgba(14,165,233,.3)" },
  { key: "Fire", icon: "🔥", title: "Fire", desc: "Fire, smoke, gas leak, explosion risk", color: "#f97316", bg: "rgba(249,115,22,.12)", border: "rgba(249,115,22,.3)" },
  { key: "Police", icon: "🚓", title: "Police", desc: "Threat, robbery, violence, danger", color: "#7c3aed", bg: "rgba(124,58,237,.12)", border: "rgba(124,58,237,.3)" },
];

export default function CitizenPage() {
  const [type, setType] = useState("Medical");
  const [status, setStatus] = useState({ state: "idle", msg: "" });
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [distance, setDistance] = useState(null);
  const [vehicleRoute, setVehicleRoute] = useState([]);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState("");
  const [requestId, setRequestId] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const prevStatusRef = useRef(null);

  const selected = useMemo(
    () => EMERGENCY_TYPES.find((t) => t.key === type),
    [type]
  );

  // ── Load citizen's request history on mount ──────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get(`${import.meta.env.VITE_API_URL}/emergency`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (Array.isArray(res.data)) setMyRequests(res.data);
    }).catch(() => {});
  }, []);

  // ── Poll request status every 5s and notify citizen of changes ──────────
  useEffect(() => {
    if (!requestId) return;
    const poll = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/emergency`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (Array.isArray(res.data)) setMyRequests(res.data);
        const req = res.data.find(r => String(r._id) === String(requestId));
        if (!req) return;
        if (req.status !== prevStatusRef.current) {
          prevStatusRef.current = req.status;
          setRequestStatus(req.status);
        }
      } catch {}
    };
    const interval = setInterval(poll, 5_000);
    return () => clearInterval(interval);
  }, [requestId]);

  const disabled = status.state === "locating" || status.state === "sending";

  const sendEmergency = () => {
    setEtaMinutes(null);
    setDistance(null);
    setVehicleRoute([]);
    setVehicleLocation(null);
    setStatus({ state: "locating", msg: "Getting your location…" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus({ state: "sending", msg: "Sending emergency request…" });

        const token = localStorage.getItem("token");
        axios
          .post(`${import.meta.env.VITE_API_URL}/emergency/request`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            emergencyType: type,
            location: manualLocation.trim() || undefined,
          }, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
          .then((res) => {
            const eta = res?.data?.etaMinutes;
            const dist = res?.data?.distance;
            const route = res?.data?.route;
            const vehicleCoords = res?.data?.vehicleLocation;
            const loc = res?.data?.request?.location;

            if (Number.isFinite(eta)) setEtaMinutes(eta);
            if (dist) setDistance(dist);
            if (Array.isArray(route)) setVehicleRoute(route);
            if (vehicleCoords) setVehicleLocation(vehicleCoords);
            if (loc && !manualLocation.trim()) setManualLocation(loc);
            if (res?.data?.request?._id) {
              setRequestId(res.data.request._id);
              setMyRequests(prev => [res.data.request, ...prev]);
            }

            setStatus({ state: "success", msg: "Request sent! Help is on the way." });
          })
          .catch((err) => {
            if (err?.response?.status === 409) {
              setStatus({
                state: "error",
                msg: "A similar emergency request is already active. Please wait for the assigned team.",
              });
            } else {
              setStatus({
                state: "error",
                msg: "Couldn't send request. Is the backend running on port 5000?",
              });
            }
          });
      },
      (err) => {
        setStatus({
          state: "error",
          msg:
            err.code === 1
              ? "Location permission denied. Enable it and try again."
              : "Couldn't get your location. Try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.badge}>🆘 EMERGENCY PORTAL</div>
          <h1 style={styles.h1}>Citizen Emergency Request</h1>
          <p style={styles.muted}>
            Select the emergency type and request help. We'll use your current GPS location.
          </p>
        </div>
        <div style={{ ...styles.pill, borderColor: selected?.border, background: selected?.bg }}>
          <span>{selected?.icon}</span>
          <b style={{ marginLeft: 6, color: selected?.color }}>{selected?.title}</b>
        </div>
      </header>

      {myRequests.length > 0 && (
        <div style={styles.historySection}>
          <h2 style={{ ...styles.h2, marginBottom: 12 }}>📋 My Requests</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myRequests.map(r => {
              const s = String(r.status || "").toUpperCase();
              const color = s === "RESOLVED" ? "#4ade80" : s === "IN_PROGRESS" ? "#38bdf8" : s === "REJECTED" ? "#fb7185" : "#fbbf24";
              const bg = s === "RESOLVED" ? "rgba(34,197,94,.10)" : s === "IN_PROGRESS" ? "rgba(14,165,233,.10)" : s === "REJECTED" ? "rgba(225,29,72,.10)" : "rgba(251,191,36,.10)";
              const border = s === "RESOLVED" ? "rgba(34,197,94,.25)" : s === "IN_PROGRESS" ? "rgba(14,165,233,.25)" : s === "REJECTED" ? "rgba(225,29,72,.25)" : "rgba(251,191,36,.25)";
              return (
                <div key={r._id} style={{ ...styles.historyCard, background: bg, border: `1px solid ${border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.type} — {r.location}</span>
                    <span style={{ color, fontWeight: 700, fontSize: 12, background: bg, border: `1px solid ${border}`, borderRadius: 999, padding: "3px 10px" }}>{r.status}</span>
                  </div>
                  {r.createdAt && (
                    <div style={{ color: "#9fb0d0", fontSize: 12, marginTop: 4 }}>
                      {new Date(r.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {/* Map Section */}
        <section style={styles.card}>
          <h2 style={styles.h2}>📍 Your Location</h2>
          <p style={styles.muted}>Your GPS location is used to dispatch the nearest vehicle.</p>
          <input
            type="text"
            placeholder="📍 Confirm or type your location (e.g. Hamra Street, Beirut)"
            value={manualLocation}
            onChange={e => setManualLocation(e.target.value)}
            style={styles.locationInput}
          />

          <div style={styles.mapWrap}>
            <Map route={vehicleRoute} vehicleLocation={vehicleLocation} />
          </div>

          {vehicleRoute.length > 0 && (
            <div style={styles.routeCard}>
              <div style={styles.routeTitle}>🗺️ Emergency Vehicle Route</div>
              <div style={styles.routeText}>
                The full route of the assigned emergency vehicle is now displayed on the map.
              </div>
            </div>
          )}

          {/* ETA Card */}
          <div
            style={{
              ...styles.etaCard,
              borderColor: etaMinutes !== null ? "rgba(34,197,94,.4)" : "rgba(255,255,255,.10)",
              background: etaMinutes !== null ? "rgba(34,197,94,.08)" : "rgba(255,255,255,.04)",
            }}
          >
            <div style={styles.etaTitle}>🕐 Estimated Arrival (ETA)</div>
            {etaMinutes === null ? (
              <div style={styles.etaValueMuted}>
                {status.state === "success"
                  ? "ETA not available from backend."
                  : "Send a request to see ETA."}
              </div>
            ) : (
              <div style={styles.etaRow}>
                <div style={styles.etaValue}>
                  ~{etaMinutes} min{etaMinutes === 1 ? "" : "s"}
                </div>
                {distance && <div style={styles.etaDistance}>📍 {distance} away</div>}
              </div>
            )}
            {etaMinutes !== null && (
              <div style={styles.etaSubtext}>
                🚨 Help is on the way — stay calm and stay on the line
              </div>
            )}
          </div>
        </section>

        {/* Controls */}
        <section style={styles.card}>
          <h2 style={styles.h2}>🚨 Emergency Type</h2>
          <p style={styles.muted}>Select the type of emergency you are facing.</p>

          <div style={styles.typeGrid}>
            {EMERGENCY_TYPES.map((t) => {
              const active = t.key === type;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  style={{
                    ...styles.typeBtn,
                    background: active ? t.bg : "rgba(255,255,255,.04)",
                    border: active ? `1px solid ${t.border}` : "1px solid rgba(255,255,255,.10)",
                    outline: active ? `2px solid ${t.border}` : "none",
                  }}
                >
                  <div style={styles.typeTop}>
                    <span style={styles.typeIcon}>{t.icon}</span>
                    <span style={{ ...styles.typeTitle, color: active ? t.color : "#e8eefc" }}>
                      {t.title}
                    </span>
                  </div>
                  <div style={styles.typeDesc}>{t.desc}</div>
                </button>
              );
            })}
          </div>

          {status.state !== "idle" && (
            <div style={{ ...styles.banner, ...(status.state === "success" ? styles.bannerSuccess : status.state === "error" ? styles.bannerError : styles.bannerInfo) }}>
              {status.state === "locating" && "📡 "}
              {status.state === "sending" && "📤 "}
              {status.state === "success" && "✅ "}
              {status.state === "error" && "❌ "}
              {status.msg}
            </div>
          )}

          {requestStatus && requestStatus !== "Pending" && (
            <div style={{
              ...styles.banner,
              background: requestStatus === "RESOLVED" ? "rgba(34,197,94,.15)" : requestStatus === "IN_PROGRESS" ? "rgba(14,165,233,.15)" : "rgba(225,29,72,.15)",
              color: requestStatus === "RESOLVED" ? "#4ade80" : requestStatus === "IN_PROGRESS" ? "#38bdf8" : "#fb7185",
              border: `1px solid ${requestStatus === "RESOLVED" ? "rgba(34,197,94,.3)" : requestStatus === "IN_PROGRESS" ? "rgba(14,165,233,.3)" : "rgba(225,29,72,.3)"}`,
            }}>
              {requestStatus === "IN_PROGRESS" && "🚨 Help is on the way — vehicle is en route!"}
              {requestStatus === "RESOLVED" && "✅ Emergency resolved. Stay safe!"}
              {requestStatus === "REJECTED" && "❌ Request was rejected. Please call 112."}
            </div>
          )}

          <button
            type="button"
            onClick={sendEmergency}
            disabled={disabled}
            style={{
              ...styles.dangerBtn,
              background: disabled ? "#555" : "#e11d48",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.7 : 1,
            }}
          >
            {status.state === "locating"
              ? "📡 LOCATING…"
              : status.state === "sending"
                ? "📤 SENDING…"
                : "🆘 REQUEST HELP"}
          </button>

          <p style={{ ...styles.muted, fontSize: 12, marginTop: 10, textAlign: "center" }}>
            🔒 Use only for real emergencies.
          </p>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "#e8eefc",
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  header: {
    maxWidth: 1100,
    margin: "0 auto 18px auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    background: "rgba(225,29,72,.15)",
    border: "1px solid rgba(225,29,72,.3)",
    color: "#fb7185",
    borderRadius: 999,
    padding: "4px 14px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 10,
  },
  h1: { margin: 0, fontSize: 28, fontWeight: 900 },
  h2: { margin: "0 0 6px 0", fontSize: 18, fontWeight: 800 },
  muted: { margin: "6px 0 0 0", color: "#9fb0d0", fontSize: 13 },
  pill: {
    border: "1px solid",
    padding: "10px 16px",
    borderRadius: 999,
    fontSize: 14,
    whiteSpace: "nowrap",
    height: "fit-content",
    display: "flex",
    alignItems: "center",
  },
  grid: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.2fr .8fr",
    gap: 16,
  },
  card: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "#111a2e",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
  },
  locationInput: {
    width: "100%",
    marginTop: 10,
    background: "#0b1220",
    border: "1px solid rgba(255,255,255,.15)",
    borderRadius: 10,
    color: "#e8eefc",
    padding: "10px 14px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  mapWrap: {
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.10)",
  },
  routeCard: {
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    border: "1px solid rgba(59,130,246,.25)",
    background: "rgba(59,130,246,.08)",
  },
  routeTitle: {
    fontSize: 13,
    color: "#93c5fd",
    marginBottom: 6,
    fontWeight: 700,
  },
  routeText: {
    fontSize: 13,
    color: "#cbd5e1",
  },
  etaCard: {
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
    border: "1px solid",
    transition: "all 0.3s",
  },
  etaTitle: { fontSize: 13, color: "#9fb0d0", marginBottom: 8, fontWeight: 600 },
  etaRow: { display: "flex", alignItems: "center", gap: 16, marginBottom: 6 },
  etaValue: { fontSize: 28, fontWeight: 900, color: "#4ade80" },
  etaDistance: { fontSize: 13, color: "#9fb0d0" },
  etaValueMuted: { fontSize: 13, color: "#9fb0d0" },
  etaSubtext: {
    fontSize: 12,
    color: "#4ade80",
    marginTop: 6,
    fontWeight: 600,
  },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
    margin: "12px 0 14px",
  },
  typeBtn: {
    textAlign: "left",
    color: "#e8eefc",
    borderRadius: 14,
    padding: 14,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  typeTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  typeIcon: { fontSize: 22 },
  typeTitle: { fontWeight: 700, fontSize: 15 },
  typeDesc: { color: "#9fb0d0", fontSize: 13 },
  banner: {
    borderRadius: 12,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,.10)",
    marginBottom: 12,
    fontSize: 14,
    fontWeight: 600,
  },
  bannerInfo: { background: "rgba(59,130,246,.12)", color: "#93c5fd" },
  bannerSuccess: { background: "rgba(34,197,94,.12)", color: "#4ade80" },
  bannerError: { background: "rgba(225,29,72,.12)", color: "#fb7185" },
  historySection: {
    maxWidth: 1100,
    margin: "0 auto 16px auto",
    border: "1px solid rgba(255,255,255,.10)",
    background: "#111a2e",
    borderRadius: 16,
    padding: 16,
  },
  historyCard: {
    borderRadius: 10,
    padding: "10px 14px",
  },
  dangerBtn: {
    width: "100%",
    border: "none",
    borderRadius: 14,
    color: "white",
    padding: "16px 16px",
    fontWeight: 900,
    letterSpacing: "1px",
    fontSize: 15,
    transition: "all 0.2s",
  },
};