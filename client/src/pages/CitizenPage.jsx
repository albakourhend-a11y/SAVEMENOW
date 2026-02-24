import Map from "../components/Map";
import { useMemo, useState } from "react";
import axios from "axios";

const EMERGENCY_TYPES = [
  { key: "Medical", icon: "🩺", title: "Medical", desc: "Ambulance / urgent health help" },
  { key: "Fire", icon: "🔥", title: "Fire", desc: "Fire, smoke, gas leak, explosion risk" },
  { key: "Police", icon: "🚓", title: "Police", desc: "Threat, robbery, violence, danger" },
];

export default function CitizenPage() {
  const [type, setType] = useState("Medical");
  const [status, setStatus] = useState({ state: "idle", msg: "" }); // idle | locating | sending | success | error
  const [etaMinutes, setEtaMinutes] = useState(null);

  const selected = useMemo(
    () => EMERGENCY_TYPES.find((t) => t.key === type),
    [type]
  );

  const disabled = status.state === "locating" || status.state === "sending";

  const sendEmergency = () => {
    setEtaMinutes(null);
    setStatus({ state: "locating", msg: "Getting your location…" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus({ state: "sending", msg: "Sending emergency request…" });

        axios
          .post("http://localhost:5000/emergency/request", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            emergencyType: type,
          })
          .then((res) => {
            const eta = res?.data?.etaMinutes;
            if (Number.isFinite(eta)) setEtaMinutes(eta);

            setStatus({
              state: "success",
              msg: `Request sent (${type}).`,
            });
          })
          .catch(() => {
            setStatus({
              state: "error",
              msg: "Couldn’t send request. Is the backend running on port 5000?",
            });
          });
      },
      (err) => {
        setStatus({
          state: "error",
          msg:
            err.code === 1
              ? "Location permission denied. Enable it and try again."
              : "Couldn’t get your location. Try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.h1}>Citizen Emergency Request</h1>
          <p style={styles.muted}>
            Select the emergency type and request help. We’ll use your current GPS location.
          </p>
        </div>

        <div style={styles.pill}>
          Selected: <span style={{ marginLeft: 6 }}>{selected?.icon}</span>{" "}
          <b style={{ marginLeft: 6 }}>{selected?.title}</b>
        </div>
      </header>

      <div style={styles.grid}>
        {/* Map */}
        <section style={styles.card}>
          <h2 style={styles.h2}>Your location</h2>
          <p style={styles.muted}>Your GPS location is used to dispatch the nearest vehicle.</p>

          <div style={styles.mapWrap}>
            <Map />
          </div>

          {/* ETA card */}
          <div style={styles.etaCard}>
            <div style={styles.etaTitle}>Estimated arrival (ETA)</div>
            {etaMinutes === null ? (
              <div style={styles.etaValueMuted}>
                {status.state === "success"
                  ? "ETA not available (backend didn’t return etaMinutes)."
                  : "Send a request to see ETA."}
              </div>
            ) : (
              <div style={styles.etaValue}>
                ~{etaMinutes} minute{etaMinutes === 1 ? "" : "s"}
              </div>
            )}
          </div>
        </section>

        {/* Controls */}
        <section style={styles.card}>
          <h2 style={styles.h2}>Emergency type</h2>

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
                    ...(active ? styles.typeBtnActive : null),
                  }}
                >
                  <div style={styles.typeTop}>
                    <span style={styles.typeIcon}>{t.icon}</span>
                    <span style={styles.typeTitle}>{t.title}</span>
                  </div>
                  <div style={styles.typeDesc}>{t.desc}</div>
                </button>
              );
            })}
          </div>

          {status.state !== "idle" && (
            <div
              style={{
                ...styles.banner,
                ...(status.state === "success"
                  ? styles.bannerSuccess
                  : status.state === "error"
                  ? styles.bannerError
                  : styles.bannerInfo),
              }}
            >
              {status.msg}
            </div>
          )}

          <button
            type="button"
            onClick={sendEmergency}
            disabled={disabled}
            style={{
              ...styles.dangerBtn,
              ...(disabled ? styles.dangerBtnDisabled : null),
            }}
          >
            {disabled ? "SENDING…" : "REQUEST HELP"}
          </button>

          <p style={{ ...styles.muted, fontSize: 12, marginTop: 10 }}>
            Use only for real emergencies.
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
  h1: { margin: 0, fontSize: 28 },
  h2: { margin: "0 0 6px 0", fontSize: 18 },
  muted: { margin: "6px 0 0 0", color: "#9fb0d0" },
  pill: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.06)",
    padding: "10px 12px",
    borderRadius: 999,
    fontSize: 14,
    whiteSpace: "nowrap",
    height: "fit-content",
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
  mapWrap: {
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.10)",
  },

  etaCard: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.04)",
  },
  etaTitle: { fontSize: 13, color: "#9fb0d0", marginBottom: 6 },
  etaValue: { fontSize: 22, fontWeight: 800 },
  etaValueMuted: { fontSize: 13, color: "#9fb0d0" },

  typeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
    margin: "10px 0 14px",
  },
  typeBtn: {
    textAlign: "left",
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.04)",
    color: "#e8eefc",
    borderRadius: 14,
    padding: 12,
    cursor: "pointer",
  },
  typeBtnActive: {
    outline: "2px solid rgba(225,29,72,.65)",
    background: "rgba(225,29,72,.12)",
  },
  typeTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  typeIcon: { fontSize: 20 },
  typeTitle: { fontWeight: 700 },
  typeDesc: { color: "#9fb0d0", fontSize: 13 },

  banner: {
    borderRadius: 12,
    padding: "10px 12px",
    border: "1px solid rgba(255,255,255,.10)",
    marginBottom: 12,
    fontSize: 14,
  },
  bannerInfo: { background: "rgba(59,130,246,.12)" },
  bannerSuccess: { background: "rgba(34,197,94,.12)" },
  bannerError: { background: "rgba(225,29,72,.12)" },

  dangerBtn: {
    width: "100%",
    border: "none",
    borderRadius: 14,
    background: "#e11d48",
    color: "white",
    padding: "14px 16px",
    fontWeight: 800,
    letterSpacing: ".5px",
    cursor: "pointer",
  },
  dangerBtnDisabled: { opacity: 0.7, cursor: "not-allowed" },
};