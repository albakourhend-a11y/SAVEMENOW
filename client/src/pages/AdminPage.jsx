import { useEffect, useState } from "react";
import axios from "axios";
import Map from "../components/Map";

export default function AdminPage() {
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/vehicle").then(res => setVehicles(res.data));
    axios.get("http://localhost:5000/emergency").then(res => setRequests(res.data));
  }, []);

  if (!vehicles.length) return (
    <div style={styles.page}>
      <div style={styles.loadingCard}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
        <h2 style={{ color: "#e8eefc", margin: 0 }}>Loading dashboard...</h2>
      </div>
    </div>
  );

  const markers = vehicles.map(v => ({ lat: v.lat, lng: v.lng, status: v.status, type: v.type }));

  const freeCount = vehicles.filter(v => v.status === "FREE").length;
  const busyCount = vehicles.filter(v => v.status !== "FREE").length;
  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const inProgressCount = requests.filter(r => r.status === "IN_PROGRESS").length;

  const typeIcons = { Ambulance: "🚑", "Fire Truck": "🚒", "Police Car": "🚓", "Rescue Jeep": "🚙" };

  const updateRequest = (id, status) => {
    axios.put(`http://localhost:5000/emergency/${id}`, { status })
      .then(res => setRequests(prev => prev.map(r => r.id === id ? res.data : r)));
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badge}>🛡️ ADMIN CONTROL CENTER</div>
          <h1 style={styles.title}>System Admin Dashboard</h1>
          <p style={styles.subtitle}>Real-time emergency dispatch monitoring</p>
        </div>
        <div style={styles.timeBox}>
          <span style={styles.timeDot} />
          <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 13 }}>LIVE</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        {[
          { label: "Available Vehicles", value: freeCount, color: "#22c55e", bg: "rgba(34,197,94,.10)", border: "rgba(34,197,94,.25)" },
          { label: "Busy Vehicles", value: busyCount, color: "#e11d48", bg: "rgba(225,29,72,.10)", border: "rgba(225,29,72,.25)" },
          { label: "Pending Requests", value: pendingCount, color: "#fbbf24", bg: "rgba(251,191,36,.10)", border: "rgba(251,191,36,.25)" },
          { label: "In Progress", value: inProgressCount, color: "#0ea5e9", bg: "rgba(14,165,233,.10)", border: "rgba(14,165,233,.25)" },
        ].map((s) => (
          <div key={s.label} style={{ ...styles.statCard, background: s.bg, border: `1px solid ${s.border}` }}>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>📍 Vehicle Map</h2>
        <div style={styles.mapWrap}>
          <Map center={{ lat: 33.8938, lng: 35.5018 }} markers={markers} />
        </div>
      </section>

      {/* Bottom Grid */}
      <div style={styles.bottomGrid}>
        {/* Vehicle Status */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>🚗 Vehicle Status</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vehicles.map(v => (
              <div key={v.id} style={styles.vehicleRow}>
                <div style={styles.vehicleLeft}>
                  <span style={{ fontSize: 20 }}>{typeIcons[v.type] || "🚘"}</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{v.type}</span>
                </div>
                <span style={{
                  ...styles.statusPill,
                  background: v.status === "FREE" ? "rgba(34,197,94,.15)" : "rgba(225,29,72,.15)",
                  color: v.status === "FREE" ? "#4ade80" : "#fb7185",
                  border: v.status === "FREE" ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(225,29,72,.3)",
                }}>
                  {v.status === "FREE" ? "✅ Available" : "🔴 Busy"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Emergency Queue */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>📋 Emergency Requests Queue</h2>
          {requests.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
              <p style={{ color: "#9fb0d0" }}>No requests yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {requests.map(r => {
                const isPending = r.status === "Pending";
                const isInProgress = r.status === "IN_PROGRESS";
                return (
                  <div key={r.id} style={{
                    ...styles.requestCard,
                    borderColor: isPending
                      ? "rgba(251,191,36,.3)"
                      : isInProgress
                      ? "rgba(14,165,233,.3)"
                      : "rgba(34,197,94,.3)",
                  }}>
                    <div style={styles.requestTop}>
                      <span style={styles.requestType}>
                        {r.type === "Fire" ? "🔥" : r.type === "Medical" ? "🚑" : "🚓"} {r.type}
                      </span>
                      <span style={{
                        ...styles.statusPill,
                        background: isPending
                          ? "rgba(251,191,36,.15)"
                          : isInProgress
                          ? "rgba(14,165,233,.15)"
                          : "rgba(34,197,94,.15)",
                        color: isPending ? "#fbbf24" : isInProgress ? "#38bdf8" : "#4ade80",
                        border: isPending
                          ? "1px solid rgba(251,191,36,.3)"
                          : isInProgress
                          ? "1px solid rgba(14,165,233,.3)"
                          : "1px solid rgba(34,197,94,.3)",
                      }}>
                        {r.status}
                      </span>
                    </div>
                    <p style={styles.requestInfo}>
                      📍 {r.location || "Unknown"} · 👤 {r.caller || "Anonymous"}
                    </p>
                    <div style={styles.actionRow}>
                      <button
                        style={styles.btnWarning}
                        onClick={() => updateRequest(r.id, "IN_PROGRESS")}
                      >
                        ⚡ Mark In Progress
                      </button>
                      <button
                        style={styles.btnSuccess}
                        onClick={() => updateRequest(r.id, "RESOLVED")}
                      >
                        ✅ Resolve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
  loadingCard: {
    maxWidth: 300,
    margin: "200px auto",
    textAlign: "center",
  },
  header: {
    maxWidth: 1200,
    margin: "0 auto 24px auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
  },
  badge: {
    display: "inline-block",
    background: "rgba(124,58,237,.15)",
    border: "1px solid rgba(124,58,237,.3)",
    color: "#a78bfa",
    borderRadius: 999,
    padding: "4px 14px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 10,
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: 32,
    fontWeight: 900,
  },
  subtitle: {
    color: "#9fb0d0",
    margin: 0,
    fontSize: 14,
  },
  timeBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(34,197,94,.10)",
    border: "1px solid rgba(34,197,94,.25)",
    borderRadius: 12,
    padding: "10px 16px",
  },
  timeDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 6px #4ade80",
  },
  statsRow: {
    maxWidth: 1200,
    margin: "0 auto 24px auto",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  statCard: {
    borderRadius: 16,
    padding: "20px 24px",
    textAlign: "center",
  },
  statValue: {
    fontSize: 36,
    fontWeight: 900,
    marginBottom: 4,
  },
  statLabel: {
    color: "#9fb0d0",
    fontSize: 12,
    fontWeight: 600,
  },
  card: {
    maxWidth: 1200,
    margin: "0 auto 20px auto",
    border: "1px solid rgba(255,255,255,.10)",
    background: "#111a2e",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
  },
  mapWrap: {
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.10)",
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    margin: "0 0 16px 0",
  },
  bottomGrid: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: 20,
  },
  vehicleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: 10,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.06)",
  },
  vehicleLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  statusPill: {
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 700,
  },
  emptyState: {
    textAlign: "center",
    padding: "30px 0",
  },
  requestCard: {
    borderRadius: 12,
    padding: 16,
    background: "rgba(255,255,255,.04)",
    border: "1px solid",
  },
  requestTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  requestType: {
    fontWeight: 800,
    fontSize: 15,
  },
  requestInfo: {
    color: "#9fb0d0",
    fontSize: 13,
    margin: "0 0 12px 0",
  },
  actionRow: {
    display: "flex",
    gap: 10,
  },
  btnWarning: {
    background: "rgba(251,191,36,.15)",
    border: "1px solid rgba(251,191,36,.3)",
    color: "#fbbf24",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  btnSuccess: {
    background: "rgba(34,197,94,.15)",
    border: "1px solid rgba(34,197,94,.3)",
    color: "#4ade80",
    borderRadius: 8,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
};
