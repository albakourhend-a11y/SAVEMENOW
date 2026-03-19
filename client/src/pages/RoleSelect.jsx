import { useNavigate } from "react-router-dom";
// ✅ REPLACE WITH
export default function RoleSelect() {
  const navigate = useNavigate();
  const roles = [
    {
      key: "citizen",
      icon: "🆘",
      title: "Citizen",
      desc: "Request emergency help immediately",
      color: "#e11d48",
      bg: "rgba(225,29,72,.10)",
      border: "rgba(225,29,72,.30)",
    },
    {
      key: "driver",
      icon: "🚑",
      title: "Driver",
      desc: "Respond to emergency dispatch calls",
      color: "#0ea5e9",
      bg: "rgba(14,165,233,.10)",
      border: "rgba(14,165,233,.30)",
    },
    {
      key: "admin",
      icon: "🛡️",
      title: "System Admin",
      desc: "Monitor and manage all operations",
      color: "#7c3aed",
      bg: "rgba(124,58,237,.10)",
      border: "rgba(124,58,237,.30)",
    },
  ];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.badge}>🚨 EMERGENCY RESPONSE SYSTEM</div>
        <h1 style={styles.title}>SAVE ME NOW</h1>
        <p style={styles.subtitle}>
          Select your role to access the system
        </p>
      </div>

      {/* Role Cards */}
      <div style={styles.grid}>
        {roles.map((r) => (
          <button
            key={r.key}
            // ✅ REPLACE WITH
onClick={() => navigate(`/register/${r.key}`)}
            style={{
              ...styles.card,
              background: r.bg,
              border: `1px solid ${r.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 40px ${r.border}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={styles.icon}>{r.icon}</div>
            <div style={{ ...styles.roleTitle, color: r.color }}>{r.title}</div>
            <div style={styles.roleDesc}>{r.desc}</div>
            <div style={{ ...styles.enterBtn, background: r.color }}>
              Enter as {r.title} →
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p style={styles.footer}>
        🔒 Secure access · Use only for real emergencies
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: 48,
  },
  badge: {
    display: "inline-block",
    background: "rgba(225,29,72,.15)",
    border: "1px solid rgba(225,29,72,.3)",
    color: "#fb7185",
    borderRadius: 999,
    padding: "6px 16px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    color: "#e8eefc",
    fontSize: 48,
    fontWeight: 900,
    margin: "0 0 12px 0",
    letterSpacing: 2,
  },
  subtitle: {
    color: "#9fb0d0",
    fontSize: 16,
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
    maxWidth: 900,
    width: "100%",
  },
  card: {
    borderRadius: 20,
    padding: 32,
    cursor: "pointer",
    textAlign: "center",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: 800,
  },
  roleDesc: {
    color: "#9fb0d0",
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  enterBtn: {
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 700,
    fontSize: 13,
    marginTop: 8,
    width: "100%",
  },
  footer: {
    color: "#4a5568",
    fontSize: 12,
    marginTop: 40,
  },
};