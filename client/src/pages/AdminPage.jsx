import { useEffect, useState } from "react";
import axios from "axios";
import Map from "../components/Map";

const API = import.meta.env.VITE_API_URL;

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function SeverityBadge({ severity, severityStyle, statusPill }) {
  if (!severity) return null;
  const s = severityStyle[severity] || severityStyle.Medium;
  const icon = severity === "Critical" ? "🔴" : severity === "High" ? "🟠" : "🟡";
  return (
    <span style={{ ...statusPill, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {icon} {severity}
    </span>
  );
}

export default function AdminPage() {
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reassignId, setReassignId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [logOpen, setLogOpen] = useState(false);

  useEffect(() => {
    const fetchAll = () => {
      axios.get(`${API}/vehicle`).then(res => setVehicles(res.data)).catch(() => {});
      axios.get(`${API}/emergency/all`).then(res => setRequests(res.data)).catch(() => {});
    };
    fetchAll();
    const interval = setInterval(fetchAll, 4_000);
    return () => clearInterval(interval);
  }, []);

  const markers = vehicles.map(v => ({ lat: v.lat, lng: v.lng, status: v.status, type: v.type }));
  const freeCount = vehicles.filter(v => v.status === "FREE").length;
  const busyCount = vehicles.filter(v => v.status !== "FREE").length;
  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const inProgressCount = requests.filter(r => r.status === "IN_PROGRESS").length;
  const typeIcons = { Ambulance: "🚑", "Fire Truck": "🚒", "Police Car": "🚓", "Rescue Jeep": "🚙" };
  const severityStyle = {
    Critical: { bg: "rgba(225,29,72,.20)", color: "#fb7185", border: "rgba(225,29,72,.4)" },
    High:     { bg: "rgba(249,115,22,.20)", color: "#fb923c", border: "rgba(249,115,22,.4)" },
    Medium:   { bg: "rgba(251,191,36,.20)", color: "#fbbf24", border: "rgba(251,191,36,.4)" },
  };

  const updateRequest = (id, status) => {
    axios.put(`${API}/emergency/${id}`, { status })
      .then(res => setRequests(prev => prev.map(r => r.id === id ? res.data : r)));
  };

  const overrideVehicleStatus = (id, newStatus) => {
    axios.patch(`${API}/vehicle/${id}/status`, { status: newStatus })
      .then(res => setVehicles(prev => prev.map(v => v.id === id ? res.data : v)))
      .catch(() => {});
  };

  const reassign = (requestId) => {
    if (!selectedVehicle) return;
    axios.patch(`${API}/emergency/${requestId}/reassign`, { vehicleId: Number(selectedVehicle) })
      .then(res => {
        setRequests(prev => prev.map(r => r.id === requestId ? res.data.request : r));
        setReassignId(null);
        setSelectedVehicle("");
      })
      .catch(err => alert(err.response?.data?.error || "Reassign failed"));
  };

  if (!vehicles.length) return (
    <div style={styles.page}>
      <div style={styles.loadingCard}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>Loading...</div>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.badge}>ADMIN CONTROL CENTER</div>
          <h1 style={styles.title}>System Admin Dashboard</h1>
          <p style={styles.subtitle}>Real-time emergency dispatch monitoring</p>
        </div>
      </div>
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
      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Vehicle Map</h2>
        <div style={styles.mapWrap}>
          <Map center={{ lat: 33.8938, lng: 35.5018 }} markers={markers} />
        </div>
      </section>
      <div style={styles.bottomGrid}>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Vehicle Status</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vehicles.map(v => (
              <div key={v.id} style={styles.vehicleRow}>
                <div style={styles.vehicleLeft}>
                  <span style={{ fontSize: 20 }}>{typeIcons[v.type] || "🚘"}</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{v.type}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    ...styles.statusPill,
                    background: v.status === "FREE" ? "rgba(34,197,94,.15)" : "rgba(225,29,72,.15)",
                    color: v.status === "FREE" ? "#4ade80" : "#fb7185",
                    border: v.status === "FREE" ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(225,29,72,.3)",
                  }}>
                    {v.status === "FREE" ? "Available" : "Busy"}
                  </span>
                  <button
                    style={{
                      ...styles.btnOverride,
                      background: v.status === "FREE" ? "rgba(225,29,72,.12)" : "rgba(34,197,94,.12)",
                      border: v.status === "FREE" ? "1px solid rgba(225,29,72,.3)" : "1px solid rgba(34,197,94,.3)",
                      color: v.status === "FREE" ? "#fb7185" : "#4ade80",
                    }}
                    onClick={() => overrideVehicleStatus(v.id, v.status === "FREE" ? "BUSY" : "FREE")}
                  >
                    {v.status === "FREE" ? "Force Busy" : "Force Free"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Emergency Requests Queue</h2>
          {requests.filter(r => r.status !== "RESOLVED" && r.status !== "REJECTED").length === 0 ? (
            <div style={styles.emptyState}><p style={{ color: "#9fb0d0" }}>No active requests.</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {requests.filter(r => r.status !== "RESOLVED" && r.status !== "REJECTED").map(r => (
                <div key={r.id} style={styles.requestCard}>
                  <div style={styles.requestTop}>
                    <span style={styles.requestType}>{r.type}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <SeverityBadge severity={r.severity} severityStyle={severityStyle} statusPill={styles.statusPill} />
                      <span style={styles.statusPill}>{r.status}</span>
                    </div>
                  </div>
                  <p style={styles.requestInfo}>{r.location} - {r.caller}</p>
                  {r.time && (
                    <p style={{ color: "#6b7fa3", fontSize: 11, margin: "-8px 0 10px 0" }}>
                      🕐 {timeAgo(r.time)}
                    </p>
                  )}
                  <div style={styles.actionRow}>
                    <button style={styles.btnWarning} onClick={() => updateRequest(r.id, "IN_PROGRESS")}>Mark In Progress</button>
                    <button style={styles.btnSuccess} onClick={() => updateRequest(r.id, "RESOLVED")}>Resolve</button>
                    <button style={styles.btnReassign} onClick={() => { setReassignId(reassignId === r.id ? null : r.id); setSelectedVehicle(""); }}>
                      🔄 Reassign
                    </button>
                  </div>
                  {reassignId === r.id && (
                    <div style={styles.reassignBox}>
                      <select
                        value={selectedVehicle}
                        onChange={e => setSelectedVehicle(e.target.value)}
                        style={styles.select}
                      >
                        <option value="">Select a vehicle...</option>
                        {vehicles.filter(v => v.status === "FREE").map(v => (
                          <option key={v.id} value={v.id}>{typeIcons[v.type] || "🚘"} {v.type} (#{v.id})</option>
                        ))}
                      </select>
                      <button style={styles.btnConfirm} onClick={() => reassign(r.id)}>Confirm</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Incident Log */}
      <section style={{ ...styles.card, marginTop: 0 }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
          onClick={() => setLogOpen(o => !o)}
        >
          <h2 style={{ ...styles.sectionTitle, margin: 0 }}>📋 Incident Log</h2>
          <span style={{ color: "#9fb0d0", fontSize: 13 }}>
            {requests.filter(r => r.status === "RESOLVED" || r.status === "REJECTED").length} closed &nbsp;
            {logOpen ? "▲ Hide" : "▼ Show"}
          </span>
        </div>

        {logOpen && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {requests.filter(r => r.status === "RESOLVED" || r.status === "REJECTED").length === 0 ? (
              <p style={{ color: "#9fb0d0", fontSize: 13 }}>No closed incidents yet.</p>
            ) : (
              requests.filter(r => r.status === "RESOLVED" || r.status === "REJECTED").map(r => (
                <div key={r.id} style={styles.logRow}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      ...styles.statusPill,
                      background: r.status === "RESOLVED" ? "rgba(34,197,94,.12)" : "rgba(225,29,72,.12)",
                      color: r.status === "RESOLVED" ? "#4ade80" : "#fb7185",
                      border: r.status === "RESOLVED" ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(225,29,72,.3)",
                    }}>{r.status}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.type}</span>
                    <span style={{ color: "#9fb0d0", fontSize: 13 }}>— {r.location}</span>
                  </div>
                  <span style={{ color: "#9fb0d0", fontSize: 12 }}>
                    {r.time ? new Date(r.time).toLocaleString() : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0b1220", color: "#e8eefc", padding: 24, fontFamily: "Arial, sans-serif" },
  loadingCard: { maxWidth: 300, margin: "200px auto", textAlign: "center" },
  header: { maxWidth: 1200, margin: "0 auto 24px auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  badge: { display: "inline-block", background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.3)", color: "#a78bfa", borderRadius: 999, padding: "4px 14px", fontSize: 11, fontWeight: 700, marginBottom: 10 },
  title: { margin: "0 0 4px 0", fontSize: 32, fontWeight: 900 },
  subtitle: { color: "#9fb0d0", margin: 0, fontSize: 14 },
  statsRow: { maxWidth: 1200, margin: "0 auto 24px auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 },
  statCard: { borderRadius: 16, padding: "20px 24px", textAlign: "center" },
  statValue: { fontSize: 36, fontWeight: 900, marginBottom: 4 },
  statLabel: { color: "#9fb0d0", fontSize: 12, fontWeight: 600 },
  card: { maxWidth: 1200, margin: "0 auto 20px auto", border: "1px solid rgba(255,255,255,.10)", background: "#111a2e", borderRadius: 16, padding: 20 },
  mapWrap: { borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.10)", marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 800, margin: "0 0 16px 0" },
  bottomGrid: { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 },
  vehicleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" },
  vehicleLeft: { display: "flex", alignItems: "center", gap: 10 },
  statusPill: { borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700 },
  emptyState: { textAlign: "center", padding: "30px 0" },
  requestCard: { borderRadius: 12, padding: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.10)" },
  requestTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  requestType: { fontWeight: 800, fontSize: 15 },
  requestInfo: { color: "#9fb0d0", fontSize: 13, margin: "0 0 12px 0" },
  actionRow: { display: "flex", gap: 10 },
  btnWarning: { background: "rgba(251,191,36,.15)", border: "1px solid rgba(251,191,36,.3)", color: "#fbbf24", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnSuccess: { background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.3)", color: "#4ade80", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  btnReassign: { background: "rgba(14,165,233,.15)", border: "1px solid rgba(14,165,233,.3)", color: "#38bdf8", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  reassignBox: { marginTop: 10, display: "flex", gap: 8, alignItems: "center" },
  select: { flex: 1, background: "#0b1220", border: "1px solid rgba(255,255,255,.15)", color: "#e8eefc", borderRadius: 8, padding: "8px 10px", fontSize: 13 },
  btnConfirm: { background: "rgba(124,58,237,.20)", border: "1px solid rgba(124,58,237,.4)", color: "#a78bfa", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  logRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" },
  btnOverride: { borderRadius: 7, padding: "5px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: 0.5 },
};
