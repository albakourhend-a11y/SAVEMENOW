import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CSS = `
  @keyframes sos-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,72,.5), 0 4px 24px rgba(225,29,72,.3); }
    50% { box-shadow: 0 0 0 12px rgba(225,29,72,0), 0 4px 32px rgba(225,29,72,.5); }
  }
  @keyframes badge-glow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes rs-fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .rs-sos-btn {
    animation: sos-pulse 2s ease-in-out infinite;
  }
  .rs-sos-dot {
    animation: badge-glow 1.5s ease-in-out infinite;
  }
  .rs-card {
    transition: transform 0.22s ease, box-shadow 0.22s ease !important;
  }
  .rs-card:hover {
    transform: translateY(-6px) scale(1.01) !important;
  }
  .rs-page { animation: rs-fadeIn 0.4s ease; }
`;

function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

export default function RoleSelect() {
  const navigate = useNavigate();

  useEffect(() => { injectCSS("rs-css", CSS); }, []);

  const roles = [
    {
      key: "citizen",
      icon: "🆘",
      title: "Citizen",
      desc: "Request emergency help immediately",
      color: "#e11d48",
      bg: "linear-gradient(135deg, rgba(225,29,72,.12), rgba(225,29,72,.06))",
      border: "rgba(225,29,72,.35)",
      glow: "rgba(225,29,72,.2)",
    },
    {
      key: "driver",
      icon: "🚑",
      title: "Driver",
      desc: "Respond to emergency dispatch calls",
      color: "#0ea5e9",
      bg: "linear-gradient(135deg, rgba(14,165,233,.12), rgba(14,165,233,.06))",
      border: "rgba(14,165,233,.35)",
      glow: "rgba(14,165,233,.2)",
    },
    {
      key: "admin",
      icon: "🛡️",
      title: "System Admin",
      desc: "Monitor and manage all operations",
      color: "#7c3aed",
      bg: "linear-gradient(135deg, rgba(124,58,237,.12), rgba(124,58,237,.06))",
      border: "rgba(124,58,237,.35)",
      glow: "rgba(124,58,237,.2)",
    },
  ];

  return (
    <div className="rs-page" style={styles.page}>

      {/* Quick SOS Strip */}
      <div style={styles.sosBanner}>
        <div style={styles.sosDot} className="rs-sos-dot" />
        <span style={styles.sosLabel}>LIVE EMERGENCY LINE</span>
        <span style={styles.sosSep}>·</span>
        <span style={styles.sosText}>Life at risk right now? Skip the login.</span>
        <button
          className="rs-sos-btn"
          style={styles.sosBtn}
          onClick={() => navigate("/sos")}
        >
          🆘 INSTANT SOS ACCESS
        </button>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.badge}>🚨 EMERGENCY RESPONSE SYSTEM</div>
        <h1 style={styles.title}>SAVE ME NOW</h1>
        <p style={styles.subtitle}>Select your role to access the system</p>
      </div>

      {/* Role Cards */}
      <div style={styles.grid}>
        {roles.map((r) => (
          <div key={r.key} style={styles.cardWrapper}>
            <button
              className="rs-card"
              onClick={() => navigate(`/register/${r.key}`)}
              style={{
                ...styles.card,
                background: r.bg,
                border: `1px solid ${r.border}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 16px 48px ${r.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={styles.iconWrap}>
                <div style={styles.icon}>{r.icon}</div>
              </div>
              <div style={{ ...styles.roleTitle, color: r.color }}>{r.title}</div>
              <div style={styles.roleDesc}>{r.desc}</div>
              <div style={{ ...styles.enterBtn, background: r.color }}>
                Enter as {r.title} →
              </div>
            </button>
            <button
              style={styles.loginLink}
              onClick={() => navigate(`/login/${r.key}`)}
            >
              Already registered? <span style={{ color: "#e8eefc" }}>Log in</span>
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span>🔒 Secure access</span>
        <span style={styles.footerDot}>·</span>
        <span>Use only for real emergencies</span>
        <span style={styles.footerDot}>·</span>
        <span>24/7 Operations</span>
      </div>
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
    padding: "24px 24px 40px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  sosBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(225,29,72,.08)",
    border: "1px solid rgba(225,29,72,.3)",
    borderRadius: 14,
    padding: "12px 20px",
    maxWidth: 860,
    width: "100%",
    marginBottom: 52,
    flexWrap: "wrap",
  },
  sosDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#e11d48",
    flexShrink: 0,
  },
  sosLabel: {
    color: "#fb7185",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    flexShrink: 0,
  },
  sosSep: {
    color: "rgba(255,255,255,.2)",
    flexShrink: 0,
  },
  sosText: {
    color: "#9fb0d0",
    fontSize: 13,
    flex: 1,
    minWidth: 140,
  },
  sosBtn: {
    background: "#e11d48",
    border: "none",
    color: "white",
    borderRadius: 10,
    padding: "10px 22px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  header: {
    textAlign: "center",
    marginBottom: 44,
  },
  badge: {
    display: "inline-block",
    background: "rgba(225,29,72,.15)",
    border: "1px solid rgba(225,29,72,.3)",
    color: "#fb7185",
    borderRadius: 999,
    padding: "6px 18px",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    marginBottom: 18,
  },
  title: {
    color: "#e8eefc",
    fontSize: 54,
    fontWeight: 900,
    margin: "0 0 14px 0",
    letterSpacing: 3,
    textShadow: "0 0 60px rgba(225,29,72,.3)",
  },
  subtitle: {
    color: "#9fb0d0",
    fontSize: 16,
    margin: 0,
    fontWeight: 400,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
    maxWidth: 860,
    width: "100%",
  },
  cardWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: "32px 24px",
    cursor: "pointer",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    transition: "transform 0.22s ease, box-shadow 0.22s ease",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(255,255,255,.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  icon: {
    fontSize: 36,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: 0.3,
  },
  roleDesc: {
    color: "#9fb0d0",
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  enterBtn: {
    color: "white",
    borderRadius: 12,
    padding: "11px 20px",
    fontWeight: 700,
    fontSize: 13,
    marginTop: 8,
    width: "100%",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  loginLink: {
    background: "transparent",
    border: "none",
    color: "#6b7fa3",
    fontSize: 12,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
    transition: "color 0.15s",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#4a5568",
    fontSize: 12,
    marginTop: 44,
  },
  footerDot: {
    color: "rgba(255,255,255,.1)",
  },
};
