import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "${import.meta.env.VITE_API_URL}";

const MOCK_EMERGENCY = {
  id: 9999,
  type: "Medical",
  location: "Hamra, Beirut",
  caller: "Anonymous",
  status: "Pending",
};

export default function DriverPage() {
  const [vehicle, setVehicle] = useState(null);
  const [status, setStatus] = useState("FREE");
  const [requests, setRequests] = useState([]);
  const [serverOk, setServerOk] = useState(true);

  const vehicleId = 1;

  useEffect(() => {
    const load = async () => {
      try {
        const [vehRes, reqRes] = await Promise.all([
          axios.get(`${API}/vehicle`),
          axios.get(`${API}/emergency`),
        ]);
        const v = vehRes.data.find((v) => v.id === vehicleId);
        setVehicle(v);
        setStatus(v?.status ?? "FREE");
        setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
        setServerOk(true);
      } catch (e) {
        setServerOk(false);
        setVehicle({ id: vehicleId, status: "FREE", type: "Ambulance" });
        setStatus("FREE");
        setRequests([MOCK_EMERGENCY]);
      }
    };
    load();
  }, []);

  const assignedRequest = useMemo(() => {
    const pending = requests.filter((r) => {
      const s = String(r.status || "").toUpperCase();
      return s !== "RESOLVED" && s !== "REJECTED";
    });
    return pending.length ? pending[pending.length - 1] : null;
  }, [requests]);

  const updateVehicleStatus = async (newStatus) => {
    setStatus(newStatus);
    if (!serverOk) return;
    try {
      await axios.patch(`${API}/vehicle/${vehicleId}/status`, { status: newStatus });
    } catch (e) {
      console.error("Failed to update vehicle status:", e);
    }
  };

  const updateEmergencyStatus = async (id, newStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    if (!serverOk || id === MOCK_EMERGENCY.id) return;
    try {
      const res = await axios.put(`${API}/emergency/${id}`, { status: newStatus });
      setRequests((prev) => prev.map((r) => (r.id === id ? res.data : r)));
    } catch (e) {
      console.error("Failed to update emergency status:", e);
    }
  };

  const acceptEmergency = async () => {
    if (!assignedRequest) return;
    await updateEmergencyStatus(assignedRequest.id, "IN_PROGRESS");
    await updateVehicleStatus("BUSY");
  };

  const rejectEmergency = async () => {
    if (!assignedRequest) return;
    await updateEmergencyStatus(assignedRequest.id, "REJECTED");
    await updateVehicleStatus("FREE");
  };

  const toggleStatus = () => {
    updateVehicleStatus(status === "FREE" ? "BUSY" : "FREE");
  };

  const typeIcons = {
    Medical: "🚑", Fire: "🔥", Police: "🚓", default: "🆘"
  };

  if (!vehicle) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={{ color: "#e8eefc" }}>Loading driver...</h2>
          <button
            style={{ ...styles.btnPrimary, background: "#0ea5e9", marginTop: 16 }}
            onClick={() => {
              setVehicle({ id: 1, status: "FREE", type: "Ambulance" });
              setStatus("FREE");
              setRequests([MOCK_EMERGENCY]);
              setServerOk(false);
            }}
          >
            Load Demo Driver
          </button>
        </div>
      </div>
    );
  }

  const isInProgress =
    String(assignedRequest?.status || "").toUpperCase() === "IN_PROGRESS";

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badge}>🚑 DRIVER PORTAL</div>
          <h1 style={styles.title}>Driver Dashboard</h1>
          <p style={styles.subtitle}>
            Vehicle #{vehicleId} · {vehicle.type}
          </p>
        </div>

        {/* Status Toggle */}
        <div style={styles.statusBox}>
          <div style={{
            ...styles.statusDot,
            background: status === "FREE" ? "#22c55e" : "#e11d48"
          }}/>
          <span style={{
            ...styles.statusText,
            color: status === "FREE" ? "#22c55e" : "#e11d48"
          }}>
            {status}
          </span>
          <button
            onClick={toggleStatus}
            style={{
              ...styles.toggleBtn,
              background: status === "FREE"
                ? "rgba(225,29,72,.15)"
                : "rgba(34,197,94,.15)",
              border: status === "FREE"
                ? "1px solid rgba(225,29,72,.3)"
                : "1px solid rgba(34,197,94,.3)",
              color: status === "FREE" ? "#fb7185" : "#4ade80",
            }}
          >
            Go {status === "FREE" ? "Busy" : "Available"}
          </button>
        </div>
      </div>

      {!serverOk && (
        <div style={styles.warning}>
          ⚠️ Backend not reachable — showing mock emergency for demo.
        </div>
      )}

      {/* Emergency Card */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🚨 Assigned Emergency</h2>

        {!assignedRequest ? (
          <div style={styles.emptyCard}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ color: "#9fb0d0", fontSize: 16 }}>
              No pending emergencies right now.
            </p>
          </div>
        ) : (
          <div style={{
            ...styles.emergencyCard,
            borderColor: isInProgress
              ? "rgba(34,197,94,.4)"
              : "rgba(225,29,72,.4)",
            background: isInProgress
              ? "rgba(34,197,94,.06)"
              : "rgba(225,29,72,.06)",
          }}>
            {/* Alert banner */}
            {!isInProgress && (
              <div style={styles.alertBanner}>
                🚨 NEW EMERGENCY — RESPONSE REQUIRED
              </div>
            )}

            <div style={styles.emergencyGrid}>
              <div style={styles.emergencyItem}>
                <span style={styles.emergencyLabel}>Type</span>
                <span style={styles.emergencyValue}>
                  {typeIcons[assignedRequest.type] || typeIcons.default}{" "}
                  {assignedRequest.type}
                </span>
              </div>
              <div style={styles.emergencyItem}>
                <span style={styles.emergencyLabel}>Location</span>
                <span style={styles.emergencyValue}>
                  📍 {assignedRequest.location || "Unknown"}
                </span>
              </div>
              <div style={styles.emergencyItem}>
                <span style={styles.emergencyLabel}>Caller</span>
                <span style={styles.emergencyValue}>
                  👤 {assignedRequest.caller || "Anonymous"}
                </span>
              </div>
              <div style={styles.emergencyItem}>
                <span style={styles.emergencyLabel}>Status</span>
                <span style={{
                  ...styles.statusPill,
                  background: isInProgress
                    ? "rgba(34,197,94,.15)"
                    : "rgba(251,191,36,.15)",
                  color: isInProgress ? "#4ade80" : "#fbbf24",
                  border: isInProgress
                    ? "1px solid rgba(34,197,94,.3)"
                    : "1px solid rgba(251,191,36,.3)",
                }}>
                  {assignedRequest.status}
                </span>
              </div>
            </div>

            {isInProgress ? (
              <div style={styles.enRoute}>
                ✅ Accepted — en route to location
              </div>
            ) : (
              <div style={styles.actionRow}>
                <button
                  onClick={acceptEmergency}
                  style={styles.acceptBtn}
                >
                  ✅ Accept & Respond
                </button>
                <button
                  onClick={rejectEmergency}
                  style={styles.rejectBtn}
                >
                  ❌ Reject
                </button>
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
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  header: {
    maxWidth: 900,
    margin: "0 auto 24px auto",
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
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 14,
    padding: "12px 16px",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  statusText: {
    fontWeight: 800,
    fontSize: 16,
  },
  toggleBtn: {
    borderRadius: 8,
    padding: "6px 14px",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    marginLeft: 8,
  },
  warning: {
    maxWidth: 900,
    margin: "0 auto 16px auto",
    background: "rgba(251,191,36,.10)",
    border: "1px solid rgba(251,191,36,.3)",
    color: "#fbbf24",
    borderRadius: 12,
    padding: "10px 16px",
    fontSize: 13,
  },
  section: {
    maxWidth: 900,
    margin: "0 auto",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 16,
  },
  emptyCard: {
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 16,
    padding: 40,
    textAlign: "center",
  },
  emergencyCard: {
    border: "1px solid",
    borderRadius: 16,
    overflow: "hidden",
  },
  alertBanner: {
    background: "rgba(225,29,72,.15)",
    color: "#fb7185",
    padding: "10px 20px",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 1,
    textAlign: "center",
  },
  emergencyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    padding: 24,
  },
  emergencyItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  emergencyLabel: {
    color: "#9fb0d0",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  emergencyValue: {
    fontSize: 16,
    fontWeight: 600,
  },
  statusPill: {
    display: "inline-block",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 700,
    width: "fit-content",
  },
  enRoute: {
    background: "rgba(34,197,94,.10)",
    color: "#4ade80",
    padding: "14px 24px",
    fontWeight: 700,
    fontSize: 15,
    borderTop: "1px solid rgba(34,197,94,.2)",
  },
  actionRow: {
    display: "flex",
    gap: 12,
    padding: "16px 24px",
    borderTop: "1px solid rgba(255,255,255,.06)",
  },
  acceptBtn: {
    flex: 1,
    background: "rgba(34,197,94,.15)",
    border: "1px solid rgba(34,197,94,.3)",
    color: "#4ade80",
    borderRadius: 10,
    padding: "12px 16px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  rejectBtn: {
    flex: 1,
    background: "rgba(225,29,72,.15)",
    border: "1px solid rgba(225,29,72,.3)",
    color: "#fb7185",
    borderRadius: 10,
    padding: "12px 16px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  btnPrimary: {
    border: "none",
    borderRadius: 10,
    color: "white",
    padding: "12px 20px",
    fontWeight: 700,
    cursor: "pointer",
  },
  card: {
    maxWidth: 400,
    margin: "100px auto",
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 16,
    padding: 32,
    textAlign: "center",
  },
};
