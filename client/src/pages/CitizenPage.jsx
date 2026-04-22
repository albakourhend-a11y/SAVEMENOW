import Map from "../components/Map";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const CSS = `
  @keyframes cp-fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes cp-critical-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(225,29,72,.6), 0 4px 20px rgba(225,29,72,.4); }
    50% { box-shadow: 0 0 0 14px rgba(225,29,72,0), 0 4px 32px rgba(225,29,72,.6); }
  }
  @keyframes cp-urgent-glow {
    0%, 100% { box-shadow: 0 4px 20px rgba(249,115,22,.25); }
    50% { box-shadow: 0 4px 28px rgba(249,115,22,.5); }
  }
  @keyframes cp-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes cp-eta-pop {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes cp-modal-in {
    from { opacity: 0; transform: translateY(30px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cp-star-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.35); }
    100% { transform: scale(1); }
  }
  .cp-star-pop { animation: cp-star-pop 0.25s ease; }
  .cp-star { cursor: pointer; transition: transform 0.15s; font-size: 36px; line-height: 1; }
  .cp-star:hover { transform: scale(1.2); }
  .cp-critical-btn { animation: cp-critical-pulse 1.8s ease-in-out infinite; }
  .cp-urgent-btn { animation: cp-urgent-glow 2s ease-in-out infinite; }
  .cp-modal-in { animation: cp-modal-in 0.35s cubic-bezier(0.175,0.885,0.32,1.275); }
  .cp-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: white;
    border-radius: 50%;
    display: inline-block;
    animation: cp-spin .7s linear infinite;
    margin-right: 8px;
    vertical-align: middle;
  }
  .cp-eta-value { animation: cp-eta-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
`;

function injectCSS(id, css) {
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}

const EMERGENCY_TYPES = [
  { key: "Medical", icon: "🩺", title: "Medical", desc: "Ambulance / urgent health help", color: "#0ea5e9", bg: "rgba(14,165,233,.12)", border: "rgba(14,165,233,.3)" },
  { key: "Fire",    icon: "🔥", title: "Fire",    desc: "Fire, smoke, gas leak, explosion", color: "#f97316", bg: "rgba(249,115,22,.12)", border: "rgba(249,115,22,.3)" },
  { key: "Police",  icon: "🚓", title: "Police",  desc: "Threat, robbery, violence, danger", color: "#7c3aed", bg: "rgba(124,58,237,.12)", border: "rgba(124,58,237,.3)" },
];

const PRIORITY_LEVELS = [
  { key: "Normal",   label: "Normal",   icon: "🟢", color: "#22c55e", bg: "rgba(34,197,94,.12)",  border: "rgba(34,197,94,.3)",  desc: "Standard response" },
  { key: "Urgent",   label: "Urgent",   icon: "🟠", color: "#f97316", bg: "rgba(249,115,22,.12)", border: "rgba(249,115,22,.3)", desc: "Respond quickly" },
  { key: "Critical", label: "Critical", icon: "🔴", color: "#e11d48", bg: "rgba(225,29,72,.15)",  border: "rgba(225,29,72,.4)",  desc: "Life-threatening" },
];

export default function CitizenPage({ guest = false }) {
  const [type, setType]                     = useState("Medical");
  const [priority, setPriority]             = useState("Normal");
  const [status, setStatus]                 = useState({ state: "idle", msg: "" });
  const [etaMinutes, setEtaMinutes]         = useState(null);
  const [distance, setDistance]             = useState(null);
  const [vehicleRoute, setVehicleRoute]     = useState([]);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState("");
  const [requestId, setRequestId]           = useState(null);
  const [requestStatus, setRequestStatus]   = useState(null);
  const [myRequests, setMyRequests]         = useState([]);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [showRating, setShowRating]         = useState(false);
  const [rating, setRating]                 = useState(0);
  const [hoverRating, setHoverRating]       = useState(0);
  const [ratingComment, setRatingComment]   = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const prevStatusRef = useRef(null);

  // ── Inject CSS + initial load ─────────────────────────────────────────────
  useEffect(() => {
    injectCSS("cp-css", CSS);
    const token = localStorage.getItem("token");
    axios.get(`${import.meta.env.VITE_API_URL}/emergency`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => setMyRequests(Array.isArray(res.data) ? res.data.slice(-5).reverse() : []))
      .catch(() => {});
  }, []);

  // ── Poll request status every 5s when a request is active ─────────────────
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
          // Trigger rating modal when driver resolves the request
          if (req.status === "RESOLVED") {
            setShowRating(true);
          }
        }
      } catch {}
    };
    const interval = setInterval(poll, 5_000);
    return () => clearInterval(interval);
  }, [requestId]);

  const selected     = useMemo(() => EMERGENCY_TYPES.find(t => t.key === type), [type]);
  const selectedPrio = useMemo(() => PRIORITY_LEVELS.find(p => p.key === priority), [priority]);
  const disabled     = status.state === "locating" || status.state === "sending";

  const sendEmergency = () => {
    setEtaMinutes(null);
    setDistance(null);
    setVehicleRoute([]);
    setVehicleLocation(null);
    setStatus({ state: "locating", msg: "Getting your location…" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStatus({ state: "sending", msg: "Dispatching emergency services…" });

        const token = localStorage.getItem("token");
        axios
          .post(`${import.meta.env.VITE_API_URL}/emergency/request`, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            emergencyType: type,
            priority,
            location: manualLocation.trim() || undefined,
          }, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
          .then((res) => {
            const eta          = res?.data?.etaMinutes;
            const dist         = res?.data?.distance;
            const route        = res?.data?.route;
            const vehicleCoords = res?.data?.vehicleLocation;
            const loc          = res?.data?.request?.location;

            if (Number.isFinite(eta)) setEtaMinutes(eta);
            if (dist) setDistance(dist);
            if (Array.isArray(route)) setVehicleRoute(route);
            if (vehicleCoords) setVehicleLocation(vehicleCoords);
            if (loc && !manualLocation.trim()) setManualLocation(loc);

            setStatus({ state: "success", msg: "Help is on the way! Stay on the line." });

            if (res?.data?.request?._id) {
              setRequestId(res.data.request._id);
              setMyRequests(prev => [res.data.request, ...prev]);
            }
          })
          .catch((err) => {
            const st = err?.response?.status;
            const serverMsg = err?.response?.data?.message || "";
            if (st === 409) {
              setStatus({ state: "error", msg: "An active request already exists for this area. Help is already dispatched!" });
            } else if (st === 400 && serverMsg.toLowerCase().includes("no vehicles")) {
              setStatus({ state: "error", msg: "⚠️ No vehicles are available right now. Please call emergency services directly." });
            } else if (!err?.response) {
              setStatus({ state: "error", msg: "Cannot reach the server. Please check your internet connection or try again." });
            } else {
              setStatus({ state: "error", msg: `Request failed: ${serverMsg || "Unknown error. Please try again."}` });
            }
          });
      },
      (err) => {
        setStatus({
          state: "error",
          msg: err.code === 1
            ? "Location permission denied. Please enable GPS and try again."
            : "Couldn't get your location. Please try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitRating = async () => {
    if (!rating) return;
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/emergency/${requestId}/rate`, {
        rating,
        comment: ratingComment.trim(),
      });
    } catch {}
    setRatingSubmitted(true);
    // If guest, show register prompt after short delay
    if (guest) {
      setTimeout(() => {
        setShowRating(false);
        setShowRegisterPrompt(true);
      }, 2000);
    }
  };

  const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];
  const RATING_COLORS = ["", "#e11d48", "#f97316", "#fbbf24", "#22c55e", "#4ade80"];

  const btnClass = priority === "Critical" ? "cp-critical-btn" : priority === "Urgent" ? "cp-urgent-btn" : "";
  const btnBg    = disabled ? "#374151" : priority === "Critical" ? "#e11d48" : priority === "Urgent" ? "#f97316" : "#e11d48";

  const activeRequests = myRequests.filter(r => {
    const s = String(r.status || "").toUpperCase();
    return s !== "RESOLVED" && s !== "REJECTED";
  });

  return (
    <div style={styles.page}>

      {/* Guest mode banner */}
      {guest && (
        <div style={styles.guestBanner}>
          <span style={styles.guestIcon}>👤</span>
          <div style={styles.guestText}>
            <strong style={{ color: "#fbbf24" }}>Guest Access</strong>
            <span style={{ color: "#9fb0d0", marginLeft: 8, fontSize: 12 }}>
              You're using the emergency portal without an account. Your request will still be dispatched.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.badge}>🆘 EMERGENCY PORTAL</div>
          <h1 style={styles.h1}>Citizen Emergency Request</h1>
          <p style={styles.muted}>Select emergency type and priority — we'll dispatch the nearest unit.</p>
        </div>
        <div style={{ ...styles.activePill, borderColor: selectedPrio?.border, background: selectedPrio?.bg }}>
          <span>{selectedPrio?.icon}</span>
          <b style={{ color: selectedPrio?.color, marginLeft: 6 }}>{selectedPrio?.label}</b>
          <span style={{ color: "#9fb0d0", fontSize: 11, marginLeft: 4 }}>Priority</span>
        </div>
      </header>

      {/* My Active Requests */}
      {activeRequests.length > 0 && (
        <div style={styles.historySection}>
          <h2 style={{ ...styles.h2, marginBottom: 12 }}>📋 My Active Requests</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeRequests.map(r => {
              const s = String(r.status || "").toUpperCase();
              const color  = s === "IN_PROGRESS" ? "#38bdf8" : s === "REJECTED" ? "#fb7185" : "#fbbf24";
              const bg     = s === "IN_PROGRESS" ? "rgba(14,165,233,.10)" : s === "REJECTED" ? "rgba(225,29,72,.10)" : "rgba(251,191,36,.10)";
              const border = s === "IN_PROGRESS" ? "rgba(14,165,233,.25)" : s === "REJECTED" ? "rgba(225,29,72,.25)" : "rgba(251,191,36,.25)";
              return (
                <div key={r._id || r.id} style={{ ...styles.historyCard, background: bg, border: `1px solid ${border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.type}{r.location ? ` — ${r.location}` : ""}</span>
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
        {/* Left: Map + ETA */}
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
              <div style={styles.routeTitle}>🗺️ Emergency Vehicle En Route</div>
              <div style={styles.routeText}>Live route shown on the map. Stay at your location.</div>
            </div>
          )}

          <div style={{
            ...styles.etaCard,
            borderColor: etaMinutes !== null ? "rgba(34,197,94,.4)" : "rgba(255,255,255,.08)",
            background: etaMinutes !== null ? "rgba(34,197,94,.07)" : "rgba(255,255,255,.03)",
          }}>
            <div style={styles.etaHeader}>
              <span style={styles.etaLabel}>🕐 Estimated Arrival (ETA)</span>
              {etaMinutes !== null && <span style={styles.etaLive}>● LIVE</span>}
            </div>
            {etaMinutes === null ? (
              <div style={styles.etaMuted}>
                {status.state === "success" ? "ETA unavailable." : "Send a request to see ETA."}
              </div>
            ) : (
              <>
                <div style={styles.etaRow}>
                  <div className="cp-eta-value" style={styles.etaValue}>~{etaMinutes} min{etaMinutes !== 1 ? "s" : ""}</div>
                  {distance && <div style={styles.etaDist}>📍 {distance} away</div>}
                </div>
                <div style={styles.etaSub}>🚨 Stay calm — help is on the way. Keep your phone on.</div>
              </>
            )}
          </div>
        </section>

        {/* Right: Controls */}
        <section style={styles.card}>

          {/* Priority Selector */}
          <h2 style={styles.h2}>⚡ Priority Level</h2>
          <p style={styles.muted}>How urgent is your situation?</p>
          <div style={styles.priorityRow}>
            {PRIORITY_LEVELS.map(p => {
              const active = p.key === priority;
              return (
                <button
                  key={p.key}
                  onClick={() => setPriority(p.key)}
                  style={{
                    ...styles.priorityBtn,
                    background: active ? p.bg : "rgba(255,255,255,.03)",
                    border: active ? `1.5px solid ${p.border}` : "1.5px solid rgba(255,255,255,.08)",
                    color: active ? p.color : "#9fb0d0",
                    fontWeight: active ? 800 : 500,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <span>{p.label}</span>
                  {active && <span style={{ fontSize: 10, opacity: 0.7, display: "block", marginTop: 2 }}>{p.desc}</span>}
                </button>
              );
            })}
          </div>

          <div style={styles.divider} />

          {/* Emergency Type */}
          <h2 style={styles.h2}>🚨 Emergency Type</h2>
          <p style={styles.muted}>What kind of help do you need?</p>
          <div style={styles.typeGrid}>
            {EMERGENCY_TYPES.map((t) => {
              const active = t.key === type;
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  style={{
                    ...styles.typeBtn,
                    background: active ? t.bg : "rgba(255,255,255,.03)",
                    border: active ? `1.5px solid ${t.border}` : "1.5px solid rgba(255,255,255,.08)",
                    outline: active ? `2px solid ${t.border}` : "none",
                  }}
                >
                  <div style={styles.typeTop}>
                    <span style={styles.typeIcon}>{t.icon}</span>
                    <span style={{ ...styles.typeTitle, color: active ? t.color : "#e8eefc" }}>{t.title}</span>
                    {active && <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />}
                  </div>
                  <div style={styles.typeDesc}>{t.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Status Banner */}
          {status.state !== "idle" && (
            <div style={{
              ...styles.banner,
              ...(status.state === "success" ? styles.bannerSuccess
                : status.state === "error" ? styles.bannerError
                : styles.bannerInfo),
            }}>
              {(status.state === "locating" || status.state === "sending") && <span className="cp-spinner" />}
              {status.state === "success" && "✅ "}
              {status.state === "error" && "❌ "}
              {status.msg}
            </div>
          )}

          {/* Live Request Status Banner */}
          {requestStatus && requestStatus !== "Pending" && (
            <div style={{
              ...styles.banner,
              background: requestStatus === "RESOLVED" ? "rgba(34,197,94,.15)" : requestStatus === "IN_PROGRESS" ? "rgba(14,165,233,.15)" : "rgba(225,29,72,.15)",
              color: requestStatus === "RESOLVED" ? "#4ade80" : requestStatus === "IN_PROGRESS" ? "#38bdf8" : "#fb7185",
              borderColor: requestStatus === "RESOLVED" ? "rgba(34,197,94,.3)" : requestStatus === "IN_PROGRESS" ? "rgba(14,165,233,.3)" : "rgba(225,29,72,.3)",
            }}>
              {requestStatus === "IN_PROGRESS" && "🚨 Help is on the way — vehicle is en route!"}
              {requestStatus === "RESOLVED"    && "✅ Emergency resolved. Stay safe!"}
              {requestStatus === "REJECTED"    && "❌ Request was rejected. Please call 112."}
            </div>
          )}

          {/* Request Button */}
          <button
            className={disabled ? "" : btnClass}
            onClick={sendEmergency}
            disabled={disabled}
            style={{
              ...styles.dangerBtn,
              background: btnBg,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.65 : 1,
            }}
          >
            {status.state === "locating" ? "📡 LOCATING…"
              : status.state === "sending" ? "📤 DISPATCHING…"
              : priority === "Critical" ? "🔴 REQUEST CRITICAL HELP"
              : priority === "Urgent" ? "🟠 REQUEST URGENT HELP"
              : "🆘 REQUEST HELP"}
          </button>

          {status.state === "success" && (
            <button
              style={styles.resetBtn}
              onClick={() => {
                setStatus({ state: "idle", msg: "" });
                setEtaMinutes(null);
                setDistance(null);
                setVehicleRoute([]);
                setVehicleLocation(null);
                setPriority("Normal");
              }}
            >
              ↩ Send another request
            </button>
          )}

          <p style={{ ...styles.muted, fontSize: 11, marginTop: 8, textAlign: "center" }}>
            🔒 Use only for real emergencies · GPS required
          </p>
        </section>
      </div>

      {/* Rating modal — shown when driver marks request RESOLVED */}
      {showRating && (
        <div style={styles.modalOverlay}>
          <div className="cp-modal-in" style={styles.modal}>
            {!ratingSubmitted ? (
              <>
                <div style={styles.modalIcon}>⭐</div>
                <h2 style={styles.modalTitle}>How was your experience?</h2>
                <p style={styles.modalDesc}>
                  Your emergency has been resolved. Help us improve by rating the response.
                </p>

                {/* Stars */}
                <div style={styles.starsRow}>
                  {[1,2,3,4,5].map(n => (
                    <span
                      key={n}
                      className="cp-star"
                      style={{ color: n <= (hoverRating || rating) ? "#fbbf24" : "rgba(255,255,255,.15)" }}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {(hoverRating || rating) > 0 && (
                  <div style={{ ...styles.ratingLabel, color: RATING_COLORS[hoverRating || rating] }}>
                    {RATING_LABELS[hoverRating || rating]}
                  </div>
                )}

                <textarea
                  style={styles.ratingTextarea}
                  placeholder="Any comments? (optional)"
                  value={ratingComment}
                  onChange={e => setRatingComment(e.target.value)}
                  rows={3}
                />

                <div style={styles.modalActions}>
                  <button
                    style={{
                      ...styles.registerBtn,
                      background: rating ? "#e11d48" : "#374151",
                      cursor: rating ? "pointer" : "not-allowed",
                      opacity: rating ? 1 : 0.6,
                      textDecoration: "none",
                      display: "block",
                      border: "none",
                      width: "100%",
                      fontSize: 15,
                      fontWeight: 900,
                      color: "white",
                      borderRadius: 14,
                      padding: "14px 20px",
                    }}
                    onClick={submitRating}
                    disabled={!rating}
                  >
                    Submit Rating
                  </button>
                  <button
                    style={styles.dismissBtn}
                    onClick={() => {
                      setShowRating(false);
                      if (guest) setShowRegisterPrompt(true);
                    }}
                  >
                    Skip
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 56, marginBottom: 14 }}>🙏</div>
                <h2 style={styles.modalTitle}>Thank you!</h2>
                <p style={styles.modalDesc}>
                  Your feedback helps us improve emergency response for everyone.
                  {guest && " Redirecting you in a moment…"}
                </p>
                <div style={styles.ratingThanksRow}>
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ fontSize: 28, color: n <= rating ? "#fbbf24" : "rgba(255,255,255,.12)" }}>★</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Registration prompt modal — shown after guest request is resolved */}
      {showRegisterPrompt && (
        <div style={styles.modalOverlay}>
          <div className="cp-modal-in" style={styles.modal}>
            <div style={styles.modalIcon}>🎉</div>
            <h2 style={styles.modalTitle}>Help is on the way!</h2>
            <p style={styles.modalDesc}>
              Your emergency has been dispatched successfully. To track your request, get real-time updates, and access future help faster — create a free account.
            </p>

            <div style={styles.modalBenefits}>
              {[
                { icon: "📍", text: "Track the vehicle on the map in real time" },
                { icon: "🔔", text: "Get status updates on your request" },
                { icon: "⚡", text: "One-tap SOS for future emergencies" },
              ].map(b => (
                <div key={b.text} style={styles.benefitRow}>
                  <span style={styles.benefitIcon}>{b.icon}</span>
                  <span style={styles.benefitText}>{b.text}</span>
                </div>
              ))}
            </div>

            <div style={styles.modalActions}>
              <a href="/register/citizen" style={styles.registerBtn}>
                Create Free Account →
              </a>
              <button
                style={styles.dismissBtn}
                onClick={() => setShowRegisterPrompt(false)}
              >
                Maybe later
              </button>
            </div>

            <p style={styles.modalNote}>
              🔒 Your emergency request has already been sent — creating an account is optional.
            </p>
          </div>
        </div>
      )}
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
  header: {
    maxWidth: 1100,
    margin: "0 auto 16px auto",
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
    fontWeight: 800,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  h1: { margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: 0.3 },
  h2: { margin: "0 0 4px 0", fontSize: 15, fontWeight: 800, letterSpacing: 0.2 },
  muted: { margin: "4px 0 0 0", color: "#9fb0d0", fontSize: 12, lineHeight: 1.5 },
  activePill: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid",
    padding: "8px 16px",
    borderRadius: 999,
    fontSize: 13,
    whiteSpace: "nowrap",
    height: "fit-content",
    gap: 4,
  },
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
  grid: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.25fr .75fr",
    gap: 14,
  },
  card: {
    border: "1px solid rgba(255,255,255,.08)",
    background: "#111a2e",
    borderRadius: 18,
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 0,
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
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.08)",
  },
  routeCard: {
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    border: "1px solid rgba(59,130,246,.2)",
    background: "rgba(59,130,246,.07)",
  },
  routeTitle: { fontSize: 12, color: "#93c5fd", marginBottom: 4, fontWeight: 700 },
  routeText:  { fontSize: 12, color: "#cbd5e1" },
  etaCard: {
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
    border: "1px solid",
    transition: "all 0.35s ease",
  },
  etaHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  etaLabel:  { fontSize: 12, color: "#9fb0d0", fontWeight: 600 },
  etaLive:   { fontSize: 10, color: "#4ade80", fontWeight: 800, letterSpacing: 1 },
  etaRow:    { display: "flex", alignItems: "baseline", gap: 14, marginBottom: 6 },
  etaValue:  { fontSize: 32, fontWeight: 900, color: "#4ade80", lineHeight: 1 },
  etaDist:   { fontSize: 13, color: "#9fb0d0" },
  etaMuted:  { fontSize: 12, color: "#9fb0d0" },
  etaSub:    { fontSize: 11, color: "#4ade80", fontWeight: 600 },
  divider: {
    height: 1,
    background: "rgba(255,255,255,.06)",
    margin: "16px 0",
  },
  priorityRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    margin: "10px 0 0 0",
  },
  priorityBtn: {
    borderRadius: 10,
    padding: "10px 8px",
    cursor: "pointer",
    textAlign: "center",
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    transition: "all 0.18s ease",
  },
  typeGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    margin: "10px 0 14px",
  },
  typeBtn: {
    textAlign: "left",
    color: "#e8eefc",
    borderRadius: 12,
    padding: "12px 14px",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  typeTop:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 4 },
  typeIcon:  { fontSize: 20 },
  typeTitle: { fontWeight: 700, fontSize: 14 },
  typeDesc:  { color: "#9fb0d0", fontSize: 12 },
  banner: {
    borderRadius: 10,
    padding: "10px 14px",
    border: "1px solid rgba(255,255,255,.08)",
    marginBottom: 12,
    fontSize: 13,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
  },
  bannerInfo:    { background: "rgba(59,130,246,.1)",  color: "#93c5fd", borderColor: "rgba(59,130,246,.2)" },
  bannerSuccess: { background: "rgba(34,197,94,.1)",   color: "#4ade80", borderColor: "rgba(34,197,94,.2)" },
  bannerError:   { background: "rgba(225,29,72,.1)",   color: "#fb7185", borderColor: "rgba(225,29,72,.2)" },
  dangerBtn: {
    width: "100%",
    border: "none",
    borderRadius: 14,
    color: "white",
    padding: "15px 16px",
    fontWeight: 900,
    letterSpacing: "0.8px",
    fontSize: 14,
    transition: "opacity 0.2s, transform 0.1s",
  },
  resetBtn: {
    width: "100%",
    border: "1px solid rgba(255,255,255,.1)",
    background: "transparent",
    color: "#9fb0d0",
    borderRadius: 10,
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: 13,
    marginTop: 8,
    fontWeight: 600,
  },

  /* Guest banner */
  guestBanner: {
    maxWidth: 1100,
    margin: "0 auto 14px auto",
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(251,191,36,.07)",
    border: "1px solid rgba(251,191,36,.25)",
    borderRadius: 12,
    padding: "10px 16px",
  },
  guestIcon: { fontSize: 20 },
  guestText: { fontSize: 13 },

  /* Modals */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 24,
  },
  modal: {
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 24,
    padding: "36px 32px",
    maxWidth: 440,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 24px 80px rgba(0,0,0,.6)",
  },
  modalIcon:  { fontSize: 52, marginBottom: 14 },
  modalTitle: { margin: "0 0 12px", fontSize: 22, fontWeight: 900, color: "#e8eefc" },
  modalDesc:  { color: "#9fb0d0", fontSize: 14, lineHeight: 1.7, margin: "0 0 20px" },
  modalBenefits: {
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 14,
    padding: "14px 16px",
    marginBottom: 24,
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  benefitRow:  { display: "flex", alignItems: "center", gap: 10 },
  benefitIcon: { fontSize: 18, flexShrink: 0 },
  benefitText: { color: "#cbd5e1", fontSize: 13 },
  modalActions: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 },
  registerBtn: {
    display: "block",
    background: "#e11d48",
    color: "white",
    borderRadius: 14,
    padding: "14px 20px",
    fontWeight: 900,
    fontSize: 15,
    textDecoration: "none",
    letterSpacing: 0.3,
  },
  dismissBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,.1)",
    color: "#9fb0d0",
    borderRadius: 12,
    padding: "12px 20px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },
  modalNote: {
    color: "#4a5568",
    fontSize: 11,
    margin: 0,
    lineHeight: 1.5,
  },

  /* Rating modal */
  starsRow: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    margin: "4px 0 10px",
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: 800,
    marginBottom: 14,
    letterSpacing: 0.3,
    transition: "color 0.2s",
  },
  ratingTextarea: {
    width: "100%",
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 12,
    color: "#e8eefc",
    padding: "10px 14px",
    fontSize: 13,
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.5,
    marginBottom: 18,
    boxSizing: "border-box",
  },
  ratingThanksRow: {
    display: "flex",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
};
