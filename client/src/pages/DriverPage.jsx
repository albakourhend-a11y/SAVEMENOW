import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const CSS = `
  @keyframes dp-fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes dp-alert-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,72,.4); }
    50% { box-shadow: 0 0 0 10px rgba(225,29,72,0); }
  }
  @keyframes dp-dot-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  @keyframes dp-spin {
    to { transform: rotate(360deg); }
  }
  .dp-alert-card { animation: dp-alert-pulse 2s ease-in-out infinite; }
  .dp-blink { animation: dp-dot-blink 1.4s ease-in-out infinite; }
  .dp-fade { animation: dp-fadeIn 0.35s ease; }
`;

function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

const MOCK_EMERGENCY = {
  id: 9999,
  type: "Medical",
  location: "Hamra, Beirut",
  caller: "Anonymous",
  status: "Pending",
};

const TYPE_ICONS   = { Medical: "🚑", Fire: "🔥", Police: "🚓", default: "🆘" };
const TYPE_COLORS  = { Medical: "#0ea5e9", Fire: "#f97316", Police: "#7c3aed", default: "#e11d48" };
const PRIO_CONFIG  = {
  Critical: { color: "#e11d48", bg: "rgba(225,29,72,.15)", border: "rgba(225,29,72,.4)", label: "🔴 CRITICAL" },
  Urgent:   { color: "#f97316", bg: "rgba(249,115,22,.12)", border: "rgba(249,115,22,.3)", label: "🟠 URGENT" },
  Normal:   { color: "#22c55e", bg: "rgba(34,197,94,.10)", border: "rgba(34,197,94,.25)", label: "🟢 NORMAL" },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function DriverPage() {
  const [vehicle, setVehicle]     = useState(null);
  const [status, setStatus]       = useState("FREE");
  const [requests, setRequests]   = useState([]);
  const [serverOk, setServerOk]   = useState(true);
  const [now, setNow]             = useState(Date.now());

  const vehicleId = 1;

  useEffect(() => {
    injectCSS("dp-css", CSS);
    const tick = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [vehRes, reqRes] = await Promise.all([
          axios.get(`${API}/vehicle`),
          axios.get(`${API}/emergency/all`),
        ]);
        const v = vehRes.data.find(v => v.id === vehicleId);
        setVehicle(v);
        setStatus(v?.status ?? "FREE");
        setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
        setServerOk(true);
      } catch {
        setServerOk(false);
        setVehicle({ id: vehicleId, status: "FREE", type: "Ambulance" });
        setStatus("FREE");
        setRequests([MOCK_EMERGENCY]);
      }
    };
    load();
  }, []);

  // Heartbeat + GPS simulation
  useEffect(() => {
    const DEMO_PATH = [
      { lat: 33.8938, lng: 35.5018 }, { lat: 33.8945, lng: 35.5030 },
      { lat: 33.8952, lng: 35.5045 }, { lat: 33.8960, lng: 35.5060 },
      { lat: 33.8968, lng: 35.5075 }, { lat: 33.8975, lng: 35.5090 },
      { lat: 33.8968, lng: 35.5075 }, { lat: 33.8960, lng: 35.5060 },
    ];
    let step = 0, lastReal = null;

    const sendHeartbeat = (lat, lng) =>
      axios.patch(`${API}/vehicle/${vehicleId}/heartbeat`, { lat, lng }).catch(() => {});

    const tick = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          ({ coords: { latitude, longitude } }) => {
            if (lastReal && Math.abs(latitude - lastReal.lat) < 0.0001 && Math.abs(longitude - lastReal.lng) < 0.0001) {
              const pt = DEMO_PATH[step++ % DEMO_PATH.length];
              sendHeartbeat(pt.lat, pt.lng);
            } else {
              lastReal = { lat: latitude, lng: longitude };
              sendHeartbeat(latitude, longitude);
            }
          },
          () => {
            const pt = DEMO_PATH[step++ % DEMO_PATH.length];
            sendHeartbeat(pt.lat, pt.lng);
          }
        );
      } else {
        const pt = DEMO_PATH[step++ % DEMO_PATH.length];
        sendHeartbeat(pt.lat, pt.lng);
      }
    };
    tick();
    const interval = setInterval(tick, 5_000);
    return () => clearInterval(interval);
  }, []);

  const assignedRequest = useMemo(() => {
    const active = requests.filter(r => {
      const s = String(r.status || "").toUpperCase();
      const isActive = s !== "RESOLVED" && s !== "REJECTED";
      const isMyVehicle = r.vehicleId === vehicleId || r.vehicleId == null;
      return isActive && isMyVehicle;
    });
    return active.length ? active[active.length - 1] : null;
  }, [requests]);

  const updateVehicleStatus = async (newStatus) => {
    setStatus(newStatus);
    if (!serverOk) return;
    try { await axios.patch(`${API}/vehicle/${vehicleId}/status`, { status: newStatus }); } catch {}
  };

  const updateEmergencyStatus = async (id, newStatus) => {
    setRequests(prev => prev.map(r => String(r._id || r.id) === String(id) ? { ...r, status: newStatus } : r));
    if (!serverOk || id === MOCK_EMERGENCY.id) return;
    try {
      const res = await axios.put(`${API}/emergency/${id}`, { status: newStatus });
      setRequests(prev => prev.map(r => String(r._id || r.id) === String(id) ? res.data : r));
    } catch {}
  };

  const acceptEmergency = async (id) => {
    await updateEmergencyStatus(id, "IN_PROGRESS");
    await updateVehicleStatus("BUSY");
  };

  const rejectEmergency = async (id) => {
    await updateEmergencyStatus(id, "REJECTED");
    await updateVehicleStatus("FREE");
  };

  const markArrived = async () => {
    if (!assignedRequest) return;
    await updateEmergencyStatus(assignedRequest._id || assignedRequest.id, "RESOLVED");
    await updateVehicleStatus("FREE");
  };

  if (!vehicle) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚑</div>
          <h2 style={{ color: "#e8eefc", margin: "0 0 16px" }}>Loading driver data…</h2>
          <button
            style={styles.demoBtn}
            onClick={() => {
              setVehicle({ id: 1, status: "FREE", type: "Ambulance" });
              setStatus("FREE");
              setRequests([MOCK_EMERGENCY]);
              setServerOk(false);
            }}
          >
            Load Demo Mode
          </button>
        </div>
      </div>
    );
  }

  const isInProgress = String(assignedRequest?.status || "").toUpperCase() === "IN_PROGRESS";
  const isResolved   = String(assignedRequest?.status || "").toUpperCase() === "RESOLVED";
  const typeColor    = TYPE_COLORS[assignedRequest?.type] || TYPE_COLORS.default;
  const prioConfig   = PRIO_CONFIG[assignedRequest?.priority] || PRIO_CONFIG.Normal;

  return (
    <div className="dp-fade" style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badge}>🚑 DRIVER PORTAL</div>
          <h1 style={styles.title}>Driver Dashboard</h1>
          <p style={styles.subtitle}>Vehicle #{vehicleId} · {vehicle.type}</p>
        </div>
        <div style={styles.statusBox}>
          <div style={{ ...styles.statusDot, background: status === "FREE" ? "#22c55e" : "#e11d48" }} className="dp-blink" />
          <span style={{ ...styles.statusText, color: status === "FREE" ? "#22c55e" : "#e11d48" }}>{status}</span>
          <button
            onClick={() => updateVehicleStatus(status === "FREE" ? "BUSY" : "FREE")}
            style={{
              ...styles.toggleBtn,
              background: status === "FREE" ? "rgba(225,29,72,.12)" : "rgba(34,197,94,.12)",
              border: status === "FREE" ? "1px solid rgba(225,29,72,.3)" : "1px solid rgba(34,197,94,.3)",
              color: status === "FREE" ? "#fb7185" : "#4ade80",
            }}
          >
            Go {status === "FREE" ? "Busy" : "Available"}
          </button>
        </div>
      </div>

      {!serverOk && (
        <div style={styles.warningBanner}>
          ⚠️ Backend offline — showing mock emergency for demo.
        </div>
      )}

      {/* Stats row */}
      <div style={styles.statsRow}>
        {[
          { icon: "📡", label: "GPS Signal", value: "Active", color: "#22c55e" },
          { icon: "🚗", label: "Vehicle Type", value: vehicle.type, color: "#0ea5e9" },
          { icon: "🆔", label: "Vehicle ID", value: `#${vehicleId}`, color: "#a78bfa" },
          { icon: "📋", label: "Queue", value: `${requests.filter(r => !["RESOLVED","REJECTED"].includes(String(r.status || "").toUpperCase())).length} active`, color: "#fbbf24" },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <span style={styles.statIcon}>{s.icon}</span>
            <div>
              <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Emergency Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🚨 Assigned Emergency</h2>

        {!assignedRequest ? (
          <div style={styles.emptyCard}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
            <div style={styles.emptyTitle}>All Clear</div>
            <p style={styles.emptyDesc}>No pending emergencies at the moment. Stay on standby.</p>
            <div style={styles.emptyPill}>● Monitoring for new requests…</div>
          </div>
        ) : (
          <div
            className={!isInProgress && !isResolved ? "dp-alert-card" : ""}
            style={{
              ...styles.emergencyCard,
              borderColor: isInProgress ? "rgba(34,197,94,.4)" : isResolved ? "rgba(255,255,255,.1)" : "rgba(225,29,72,.45)",
              background: isInProgress ? "rgba(34,197,94,.05)" : isResolved ? "rgba(255,255,255,.02)" : "rgba(225,29,72,.05)",
            }}
          >
            {/* Alert banner */}
            {!isInProgress && !isResolved && (
              <div style={styles.alertBanner}>
                <span className="dp-blink" style={{ marginRight: 6 }}>🔴</span>
                NEW EMERGENCY — RESPONSE REQUIRED
              </div>
            )}
            {isInProgress && (
              <div style={styles.progressBanner}>
                ✅ EN ROUTE — Help is on the way
              </div>
            )}

            <div style={styles.emergencyBody}>
              {/* Left: details */}
              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>TYPE</span>
                  <span style={{ ...styles.detailValue, color: typeColor }}>
                    {TYPE_ICONS[assignedRequest.type] || TYPE_ICONS.default} {assignedRequest.type}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>LOCATION</span>
                  <span style={styles.detailValue}>📍 {assignedRequest.location || "Unknown"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>CALLER</span>
                  <span style={styles.detailValue}>👤 {assignedRequest.caller || "Anonymous"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>STATUS</span>
                  <span style={{
                    ...styles.statusPill,
                    background: isInProgress ? "rgba(34,197,94,.15)" : "rgba(251,191,36,.15)",
                    color: isInProgress ? "#4ade80" : "#fbbf24",
                    border: isInProgress ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(251,191,36,.3)",
                  }}>
                    {assignedRequest.status}
                  </span>
                </div>
                {assignedRequest.priority && (
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>PRIORITY</span>
                    <span style={{
                      ...styles.statusPill,
                      background: prioConfig.bg,
                      color: prioConfig.color,
                      border: `1px solid ${prioConfig.border}`,
                    }}>
                      {prioConfig.label}
                    </span>
                  </div>
                )}
                {(assignedRequest.createdAt || assignedRequest.time) && (
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>RECEIVED</span>
                    <span style={{ ...styles.detailValue, color: "#9fb0d0" }}>
                      🕐 {timeAgo(assignedRequest.createdAt || assignedRequest.time)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action area */}
            {isInProgress ? (
              <div style={styles.actionRow}>
                <button onClick={markArrived} style={styles.arrivedBtn}>
                  🏁 Mark as Arrived & Complete
                </button>
              </div>
            ) : !isResolved ? (
              <div style={styles.actionRow}>
                <button onClick={() => acceptEmergency(assignedRequest._id || assignedRequest.id)} style={styles.acceptBtn}>✅ Accept & Respond</button>
                <button onClick={() => rejectEmergency(assignedRequest._id || assignedRequest.id)} style={styles.rejectBtn}>❌ Reject</button>
              </div>
            ) : (
              <div style={styles.resolvedBanner}>
                🏁 Request resolved — vehicle now FREE
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    color: "#e8eefc",
    padding: "20px 20px 40px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  loadingCard: {
    maxWidth: 360,
    margin: "120px auto",
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 20,
    padding: 40,
    textAlign: "center",
  },
  demoBtn: {
    background: "#0ea5e9",
    border: "none",
    color: "white",
    borderRadius: 10,
    padding: "12px 24px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  header: {
    maxWidth: 900,
    margin: "0 auto 20px auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
  },
  badge: {
    display: "inline-block",
    background: "rgba(14,165,233,.15)",
    border: "1px solid rgba(14,165,233,.3)",
    color: "#38bdf8",
    borderRadius: 999,
    padding: "4px 14px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title:    { margin: "0 0 4px 0", fontSize: 28, fontWeight: 900 },
  subtitle: { color: "#9fb0d0", margin: 0, fontSize: 13 },
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 14,
    padding: "12px 18px",
  },
  statusDot:  { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  statusText: { fontWeight: 800, fontSize: 15, letterSpacing: 0.5 },
  toggleBtn: {
    borderRadius: 8,
    padding: "7px 16px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  warningBanner: {
    maxWidth: 900,
    margin: "0 auto 14px auto",
    background: "rgba(251,191,36,.08)",
    border: "1px solid rgba(251,191,36,.25)",
    color: "#fbbf24",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
  },
  statsRow: {
    maxWidth: 900,
    margin: "0 auto 20px auto",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  statCard: {
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  statIcon:  { fontSize: 22 },
  statValue: { fontSize: 14, fontWeight: 800 },
  statLabel: { fontSize: 11, color: "#9fb0d0", marginTop: 2 },
  section:      { maxWidth: 900, margin: "0 auto" },
  sectionTitle: { fontSize: 18, fontWeight: 800, marginBottom: 14 },
  emptyCard: {
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 18,
    padding: "60px 40px",
    textAlign: "center",
  },
  emptyTitle: { fontSize: 22, fontWeight: 800, color: "#e8eefc", marginBottom: 8 },
  emptyDesc:  { color: "#9fb0d0", fontSize: 14, marginBottom: 20 },
  emptyPill: {
    display: "inline-block",
    background: "rgba(34,197,94,.08)",
    border: "1px solid rgba(34,197,94,.2)",
    color: "#4ade80",
    borderRadius: 999,
    padding: "6px 16px",
    fontSize: 12,
    fontWeight: 600,
  },
  emergencyCard: {
    border: "1px solid",
    borderRadius: 18,
    overflow: "hidden",
    transition: "border-color 0.3s",
  },
  alertBanner: {
    background: "rgba(225,29,72,.12)",
    color: "#fb7185",
    padding: "11px 20px",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 1.5,
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressBanner: {
    background: "rgba(34,197,94,.10)",
    color: "#4ade80",
    padding: "11px 20px",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 1,
    textAlign: "center",
  },
  emergencyBody: {
    padding: "20px 24px",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px 24px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  detailLabel: {
    color: "#9fb0d0",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  detailValue: { fontSize: 15, fontWeight: 600 },
  statusPill: {
    display: "inline-block",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 11,
    fontWeight: 800,
    width: "fit-content",
    letterSpacing: 0.5,
  },
  actionRow: {
    display: "flex",
    gap: 12,
    padding: "16px 24px",
    borderTop: "1px solid rgba(255,255,255,.06)",
  },
  acceptBtn: {
    flex: 1,
    background: "rgba(34,197,94,.12)",
    border: "1px solid rgba(34,197,94,.3)",
    color: "#4ade80",
    borderRadius: 12,
    padding: "14px 16px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    transition: "background 0.18s",
  },
  rejectBtn: {
    flex: 1,
    background: "rgba(225,29,72,.12)",
    border: "1px solid rgba(225,29,72,.3)",
    color: "#fb7185",
    borderRadius: 12,
    padding: "14px 16px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  arrivedBtn: {
    flex: 1,
    background: "rgba(124,58,237,.15)",
    border: "1px solid rgba(124,58,237,.35)",
    color: "#a78bfa",
    borderRadius: 12,
    padding: "14px 16px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  resolvedBanner: {
    background: "rgba(124,58,237,.08)",
    color: "#a78bfa",
    padding: "14px 24px",
    fontWeight: 700,
    fontSize: 14,
    borderTop: "1px solid rgba(124,58,237,.15)",
  },
};
