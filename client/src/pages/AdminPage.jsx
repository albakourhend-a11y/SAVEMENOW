import { useEffect, useState } from "react";
import axios from "axios";
import Map from "../components/Map";

const API = import.meta.env.VITE_API_URL;

const CSS = `
  @keyframes ap-fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes ap-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes ap-spin {
    to { transform: rotate(360deg); }
  }
  .ap-live-dot { animation: ap-blink 1.5s ease-in-out infinite; }
  .ap-fade { animation: ap-fadeIn 0.35s ease; }
  .ap-refresh-spin { animation: ap-spin 1s linear; }
`;

function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

const TYPE_ICONS    = { Ambulance: "🚑", "Fire Truck": "🚒", "Police Car": "🚓", "Rescue Jeep": "🚙" };
const EMERG_ICONS   = { Medical: "🩺", Fire: "🔥", Police: "🚓" };
const PRIO_CONFIG   = {
  Critical: { color: "#e11d48", bg: "rgba(225,29,72,.15)", border: "rgba(225,29,72,.4)", label: "Critical" },
  Urgent:   { color: "#f97316", bg: "rgba(249,115,22,.12)", border: "rgba(249,115,22,.3)", label: "Urgent"   },
  Normal:   { color: "#22c55e", bg: "rgba(34,197,94,.10)", border: "rgba(34,197,94,.25)", label: "Normal"    },
};

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AdminPage() {
  const [vehicles, setVehicles]           = useState([]);
  const [requests, setRequests]           = useState([]);
  const [reassignId, setReassignId]       = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [lastRefresh, setLastRefresh]     = useState(Date.now());
  const [spinning, setSpinning]           = useState(false);

  useEffect(() => { injectCSS("ap-css", CSS); }, []);

  useEffect(() => {
    const fetchAll = () => {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      axios.get(`${API}/vehicle`).then(res => setVehicles(res.data)).catch(() => {});
      axios.get(`${API}/emergency`, { headers }).then(res => {
        setRequests(Array.isArray(res.data) ? res.data : []);
        setLastRefresh(Date.now());
      }).catch(() => {});
    };
    fetchAll();
    const interval = setInterval(fetchAll, 4_000);
    return () => clearInterval(interval);
  }, []);

  const markers       = vehicles.map(v => ({ lat: v.lat, lng: v.lng, status: v.status, type: v.type }));
  const freeCount     = vehicles.filter(v => v.status === "FREE").length;
  const busyCount     = vehicles.filter(v => v.status !== "FREE").length;
  const activeReqs    = requests.filter(r => r.status !== "RESOLVED" && r.status !== "REJECTED");
  const pendingCount  = activeReqs.filter(r => r.status === "Pending").length;
  const inProgCount   = activeReqs.filter(r => r.status === "IN_PROGRESS").length;
  const criticalCount = activeReqs.filter(r => r.priority === "Critical").length;

  const sortedRequests = [...activeReqs].sort((a, b) => {
    const pOrder = { Critical: 0, Urgent: 1, Normal: 2 };
    return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const updateRequest = (id, status) => {
    axios.put(`${API}/emergency/${id}`, { status }, { headers: getAuthHeader() })
      .then(res => setRequests(prev => prev.map(r => String(r._id) === String(id) ? res.data : r)))
      .catch(err => alert(`Failed to update: ${err.response?.data?.error || err.message}`));
  };

  const forceVehicleStatus = (vehicleId, newStatus) => {
    axios.patch(`${API}/vehicle/${vehicleId}/status`, { status: newStatus })
      .then(() => setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status: newStatus } : v)))
      .catch(() => {});
  };

  const reassign = (requestId) => {
    if (!selectedVehicle) return;
    axios.patch(`${API}/emergency/${requestId}/reassign`, { vehicleId: Number(selectedVehicle) }, { headers: getAuthHeader() })
      .then(res => {
        setRequests(prev => prev.map(r => String(r._id) === String(requestId) ? res.data.request : r));
        setReassignId(null);
        setSelectedVehicle("");
      })
      .catch(err => alert(err.response?.data?.error || "Reassign failed"));
  };

  if (!vehicles.length) return (
    <div style={styles.page}>
      <div style={styles.loadingCard}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
        <p style={{ color: "#9fb0d0" }}>Loading admin data…</p>
      </div>
    </div>
  );

  return (
    <div className="ap-fade" style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badge}>🛡️ ADMIN CONTROL CENTER</div>
          <h1 style={styles.title}>System Admin Dashboard</h1>
          <p style={styles.subtitle}>Real-time emergency dispatch monitoring</p>
        </div>
        <div style={styles.liveIndicator}>
          <div className="ap-live-dot" style={styles.liveDot} />
          <span style={styles.liveLabel}>LIVE</span>
          <span style={styles.liveTime}>Updated {timeAgo(lastRefresh)}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: "Available Vehicles", value: freeCount,     color: "#22c55e", bg: "rgba(34,197,94,.09)",  border: "rgba(34,197,94,.2)",  icon: "🚗" },
          { label: "Busy Vehicles",      value: busyCount,     color: "#e11d48", bg: "rgba(225,29,72,.09)",  border: "rgba(225,29,72,.2)",  icon: "🚨" },
          { label: "Pending Requests",   value: pendingCount,  color: "#fbbf24", bg: "rgba(251,191,36,.09)", border: "rgba(251,191,36,.2)", icon: "⏳" },
          { label: "In Progress",        value: inProgCount,   color: "#0ea5e9", bg: "rgba(14,165,233,.09)", border: "rgba(14,165,233,.2)", icon: "📡" },
          { label: "Critical Alerts",    value: criticalCount, color: "#e11d48", bg: "rgba(225,29,72,.09)",  border: "rgba(225,29,72,.2)",  icon: "🔴" },
        ].map(s => (
          <div key={s.label} style={{ ...styles.statCard, background: s.bg, border: `1px solid ${s.border}` }}>
            <div style={styles.statIcon}>{s.icon}</div>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Map */}
      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.sectionTitle}>🗺️ Live Vehicle Map</h2>
          <div style={styles.mapLegend}>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#22c55e" }} /> Free</span>
            <span style={styles.legendItem}><span style={{ ...styles.legendDot, background: "#e11d48" }} /> Busy</span>
          </div>
        </div>
        <div style={styles.mapWrap}>
          <Map center={{ lat: 33.8938, lng: 35.5018 }} markers={markers} />
        </div>
      </section>

      <div style={styles.bottomGrid}>

        {/* Vehicle Status */}
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>🚗 Vehicle Status</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {vehicles.map(v => (
              <div key={v.id} style={styles.vehicleRow}>
                <div style={styles.vehicleLeft}>
                  <span style={{ fontSize: 22 }}>{TYPE_ICONS[v.type] || "🚘"}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{v.type}</div>
                    <div style={{ color: "#6b7fa3", fontSize: 11 }}>ID #{v.id}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    ...styles.statusPill,
                    background: v.status === "FREE" ? "rgba(34,197,94,.12)" : "rgba(225,29,72,.12)",
                    color: v.status === "FREE" ? "#4ade80" : "#fb7185",
                    border: v.status === "FREE" ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(225,29,72,.3)",
                  }}>
                    {v.status === "FREE" ? "● Available" : "● Busy"}
                  </span>
                  <button
                    style={{
                      ...styles.forceBtn,
                      background: v.status === "FREE" ? "rgba(225,29,72,.12)" : "rgba(34,197,94,.12)",
                      border: v.status === "FREE" ? "1px solid rgba(225,29,72,.3)" : "1px solid rgba(34,197,94,.3)",
                      color: v.status === "FREE" ? "#fb7185" : "#4ade80",
                    }}
                    onClick={() => forceVehicleStatus(v.id, v.status === "FREE" ? "BUSY" : "FREE")}
                  >
                    Force {v.status === "FREE" ? "Busy" : "Available"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Request Queue */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>📋 Emergency Queue</h2>
            {criticalCount > 0 && (
              <span style={styles.criticalBadge}>🔴 {criticalCount} Critical</span>
            )}
          </div>

          {sortedRequests.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <p style={{ color: "#9fb0d0", margin: 0 }}>No active requests.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sortedRequests.map(r => {
                const prioConf = PRIO_CONFIG[r.priority] || PRIO_CONFIG.Normal;
                const isActive = r.status === "IN_PROGRESS";
                return (
                  <div key={String(r._id)} style={{
                    ...styles.requestCard,
                    borderColor: r.priority === "Critical" ? "rgba(225,29,72,.3)"
                      : r.priority === "Urgent" ? "rgba(249,115,22,.25)"
                      : "rgba(255,255,255,.08)",
                  }}>
                    <div style={styles.requestTop}>
                      <div style={styles.requestLeft}>
                        <span style={styles.requestTypeIcon}>{EMERG_ICONS[r.type] || "🆘"}</span>
                        <span style={styles.requestType}>{r.type}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {r.priority && (
                          <span style={{
                            ...styles.prioBadge,
                            background: prioConf.bg,
                            color: prioConf.color,
                            border: `1px solid ${prioConf.border}`,
                          }}>
                            {prioConf.label}
                          </span>
                        )}
                        <span style={{
                          ...styles.statusBadge,
                          background: isActive ? "rgba(34,197,94,.12)" : "rgba(251,191,36,.12)",
                          color: isActive ? "#4ade80" : "#fbbf24",
                          border: isActive ? "1px solid rgba(34,197,94,.25)" : "1px solid rgba(251,191,36,.25)",
                        }}>
                          {r.status}
                        </span>
                      </div>
                    </div>

                    <div style={styles.requestMeta}>
                      <span>📍 {r.location || "GPS location"}</span>
                      <span>·</span>
                      <span>👤 {r.caller || "Anonymous"}</span>
                      {r.createdAt && (
                        <>
                          <span>·</span>
                          <span style={{ color: "#6b7fa3" }}>🕐 {timeAgo(r.createdAt)}</span>
                        </>
                      )}
                    </div>

                    <div style={styles.actionRow}>
                      <button style={styles.btnWarning}   onClick={() => updateRequest(r._id, "IN_PROGRESS")}>▶ In Progress</button>
                      <button style={styles.btnSuccess}   onClick={() => updateRequest(r._id, "RESOLVED")}>✓ Resolve</button>
                      <button style={styles.btnReassign}  onClick={() => { setReassignId(reassignId === String(r._id) ? null : String(r._id)); setSelectedVehicle(""); }}>
                        ↺ Reassign
                      </button>
                    </div>

                    {reassignId === String(r._id) && (
                      <div style={styles.reassignBox}>
                        <select
                          value={selectedVehicle}
                          onChange={e => setSelectedVehicle(e.target.value)}
                          style={styles.select}
                        >
                          <option value="">Select free vehicle…</option>
                          {vehicles.filter(v => v.status === "FREE").map(v => (
                            <option key={v.id} value={v.id}>{TYPE_ICONS[v.type] || "🚘"} {v.type} (#{v.id})</option>
                          ))}
                        </select>
                        <button style={styles.btnConfirm} onClick={() => reassign(r._id)}>Confirm</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* History / Incident Log */}
      {requests.filter(r => r.status === "RESOLVED" || r.status === "REJECTED").length > 0 && (
        <section style={{ ...styles.card, marginTop: 0 }}>
          <div style={styles.cardHeader}>
            <h2 style={styles.sectionTitle}>🗂️ Incident Log</h2>
            <span style={styles.queueCount}>
              {requests.filter(r => r.status === "RESOLVED" || r.status === "REJECTED").length} closed
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {requests
              .filter(r => r.status === "RESOLVED" || r.status === "REJECTED")
              .slice().reverse()
              .map(r => {
                const isResolved = r.status === "RESOLVED";
                return (
                  <div key={String(r._id)} style={styles.historyCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                      <span style={{
                        ...styles.statusBadge,
                        background: isResolved ? "rgba(34,197,94,.10)" : "rgba(225,29,72,.10)",
                        color: isResolved ? "#4ade80" : "#fb7185",
                        border: isResolved ? "1px solid rgba(34,197,94,.2)" : "1px solid rgba(225,29,72,.2)",
                        flexShrink: 0,
                      }}>
                        {isResolved ? "RESOLVED" : "REJECTED"}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{r.type}</span>
                      <span style={{ color: "#6b7fa3", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        — {r.location || "GPS"} · {r.caller || "Anonymous"}
                      </span>
                    </div>
                    {r.createdAt && (
                      <span style={{ color: "#4a5568", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#0b1220", color: "#e8eefc", padding: "20px 20px 40px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  loadingCard: { maxWidth: 280, margin: "160px auto", textAlign: "center" },
  header: { maxWidth: 1200, margin: "0 auto 22px auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 },
  badge: { display: "inline-block", background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.3)", color: "#a78bfa", borderRadius: 999, padding: "4px 14px", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 10 },
  title:    { margin: "0 0 4px 0", fontSize: 28, fontWeight: 900 },
  subtitle: { color: "#9fb0d0", margin: 0, fontSize: 13 },
  liveIndicator: { display: "flex", alignItems: "center", gap: 8, background: "#111a2e", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "10px 16px" },
  liveDot:   { width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 },
  liveLabel: { color: "#4ade80", fontWeight: 800, fontSize: 12, letterSpacing: 1 },
  liveTime:  { color: "#6b7fa3", fontSize: 11 },
  statsRow: { maxWidth: 1200, margin: "0 auto 20px auto", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 },
  statCard:  { borderRadius: 14, padding: "18px 16px", textAlign: "center" },
  statIcon:  { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 30, fontWeight: 900, marginBottom: 4 },
  statLabel: { color: "#9fb0d0", fontSize: 11, fontWeight: 600 },
  card:  { maxWidth: 1200, margin: "0 auto 18px auto", border: "1px solid rgba(255,255,255,.08)", background: "#111a2e", borderRadius: 16, padding: 18 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  mapWrap:   { borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.07)" },
  mapLegend: { display: "flex", gap: 14 },
  legendItem:{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9fb0d0" },
  legendDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 800, margin: 0 },
  bottomGrid: { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 18 },
  vehicleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)" },
  vehicleLeft: { display: "flex", alignItems: "center", gap: 12 },
  statusPill: { borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 700 },
  criticalBadge: { background: "rgba(225,29,72,.15)", border: "1px solid rgba(225,29,72,.35)", color: "#fb7185", borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 800 },
  emptyState: { textAlign: "center", padding: "40px 0" },
  requestCard: { borderRadius: 12, padding: "14px 16px", background: "rgba(255,255,255,.03)", border: "1px solid" },
  requestTop:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  requestLeft: { display: "flex", alignItems: "center", gap: 8 },
  requestTypeIcon: { fontSize: 18 },
  requestType: { fontWeight: 800, fontSize: 15 },
  prioBadge:   { borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 800, letterSpacing: 0.5 },
  statusBadge: { borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 800 },
  requestMeta: { display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#9fb0d0", marginBottom: 12 },
  actionRow:   { display: "flex", gap: 8, flexWrap: "wrap" },
  btnWarning:  { background: "rgba(251,191,36,.10)", border: "1px solid rgba(251,191,36,.25)", color: "#fbbf24", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  btnSuccess:  { background: "rgba(34,197,94,.10)",  border: "1px solid rgba(34,197,94,.25)",  color: "#4ade80", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  btnReassign: { background: "rgba(14,165,233,.10)", border: "1px solid rgba(14,165,233,.25)", color: "#38bdf8", borderRadius: 8, padding: "7px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  reassignBox: { marginTop: 10, display: "flex", gap: 8, alignItems: "center" },
  select: { flex: 1, background: "#0b1220", border: "1px solid rgba(255,255,255,.12)", color: "#e8eefc", borderRadius: 8, padding: "8px 10px", fontSize: 12 },
  btnConfirm:  { background: "rgba(124,58,237,.15)", border: "1px solid rgba(124,58,237,.35)", color: "#a78bfa", borderRadius: 8, padding: "8px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  forceBtn:    { borderRadius: 8, padding: "5px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" },
  queueCount:  { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "#9fb0d0", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 700 },
  historyCard: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 14px", borderRadius: 10, background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)" },
};
