import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CSS = `
  @keyframes cb-slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes cb-bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-5px); }
  }
  @keyframes cb-pulse {
    0%   { box-shadow: 0 4px 20px rgba(204,0,0,.45), 0 0 0 0 rgba(225,29,72,.5); }
    70%  { box-shadow: 0 4px 28px rgba(204,0,0,.6),  0 0 0 12px rgba(225,29,72,0); }
    100% { box-shadow: 0 4px 20px rgba(204,0,0,.45), 0 0 0 0 rgba(225,29,72,0); }
  }
  @keyframes cb-ring {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.9); opacity: 0; }
  }
  @keyframes cb-float {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-4px); }
  }
  @keyframes cb-online {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.4; }
  }
  @keyframes cb-msgIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  #cb-bubble {
    position: fixed !important;
    bottom: 28px !important;
    right: 24px !important;
    height: 52px !important;
    padding: 0 20px !important;
    border-radius: 999px !important;
    background: linear-gradient(135deg, #b91c1c 0%, #e11d48 60%, #ff4d6d 100%) !important;
    border: none !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 9px !important;
    z-index: 2147483647 !important;
    animation: cb-pulse 2.6s ease-out infinite, cb-float 3.5s ease-in-out infinite;
    transition: transform .18s, box-shadow .18s;
    box-sizing: border-box !important;
    box-shadow: 0 6px 28px rgba(204,0,0,.5) !important;
  }
  #cb-bubble:hover {
    transform: scale(1.06) translateY(-2px) !important;
    box-shadow: 0 10px 36px rgba(204,0,0,.65) !important;
  }
  #cb-bubble-ring {
    position: fixed !important;
    bottom: 28px !important;
    right: 24px !important;
    height: 52px !important;
    width: 52px !important;
    border-radius: 999px !important;
    border: 2px solid rgba(225,29,72,.6) !important;
    z-index: 2147483646 !important;
    pointer-events: none !important;
    animation: cb-ring 2.6s ease-out infinite !important;
  }
  #cb-bubble-label {
    color: white !important;
    font-weight: 800 !important;
    font-size: 14px !important;
    letter-spacing: 0.3px !important;
    font-family: 'Inter', -apple-system, sans-serif !important;
    white-space: nowrap !important;
  }

  #cb-window {
    position: fixed !important;
    bottom: 96px !important;
    right: 24px !important;
    width: 360px !important;
    max-height: 540px !important;
    display: flex !important;
    flex-direction: column !important;
    background: #12161f !important;
    border: 1px solid rgba(255,255,255,.10) !important;
    border-radius: 20px !important;
    box-shadow: 0 16px 64px rgba(0,0,0,.75) !important;
    z-index: 2147483646 !important;
    overflow: hidden !important;
    animation: cb-slideUp .2s ease;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  }

  .cb-msg { animation: cb-msgIn 0.2s ease; }

  #cb-messages::-webkit-scrollbar { width: 4px; }
  #cb-messages::-webkit-scrollbar-track { background: transparent; }
  #cb-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }

  .cb-chip {
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.12);
    color: #9fb0d0;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: background .15s, color .15s;
    white-space: nowrap;
    font-family: inherit;
  }
  .cb-chip:hover {
    background: rgba(204,0,0,.15);
    border-color: rgba(204,0,0,.35);
    color: #fb7185;
  }

  .cb-online-dot { animation: cb-online 2s ease-in-out infinite; }
  .cb-dot-1 { display:inline-block;width:7px;height:7px;border-radius:50%;background:#555;margin:0 2px;animation:cb-bounce 1.2s infinite 0s; }
  .cb-dot-2 { display:inline-block;width:7px;height:7px;border-radius:50%;background:#555;margin:0 2px;animation:cb-bounce 1.2s infinite 0.2s; }
  .cb-dot-3 { display:inline-block;width:7px;height:7px;border-radius:50%;background:#555;margin:0 2px;animation:cb-bounce 1.2s infinite 0.4s; }
`;

function injectCSS() {
  if (document.getElementById("cb-css")) return;
  const el = document.createElement("style");
  el.id = "cb-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

const ROLE_LABELS = { citizen: "Citizen Mode", driver: "Responder Mode", admin: "Admin Mode" };

const WELCOME_TEXT = {
  citizen: "Hi there! I'm Sama 🌟, your emergency assistant. I'm here to help you stay calm and safe. Ask me about first aid, what to do in an emergency, or anything else.",
  driver:  "Hey! 💪 I'm Sama, your on-duty assistant. Need quick guidance on a call? Ask away — I've got your back.",
  admin:   "Hi! 📊 I'm Sama, your system assistant. Ask me about managing resources, reading system status, or best practices.",
};

const QUICK_CHIPS = {
  citizen: ["What to do in a fire?", "CPR instructions", "Panic attack help", "I'm in danger"],
  driver:  ["Priority response tips", "En route protocols", "Dispatch checklist", "Emergency codes"],
  admin:   ["How to reassign units?", "Vehicle priority rules", "Response time benchmarks", "Status definitions"],
};

export default function ChatBot({ role }) {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef             = useRef(null);
  const inputRef              = useRef(null);

  useEffect(() => { injectCSS(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 80); }
  }, [open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    const next = [...msgs, { role: "user", content: msg }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/chat`, { messages: next, role: role || "default" });
      setMsgs(p => [...p, { role: "assistant", content: data.reply }]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "⚠️ Couldn't reach the AI right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const canSend = input.trim().length > 0 && !loading;
  const chips = QUICK_CHIPS[role] || QUICK_CHIPS.citizen;

  return createPortal(
    <>
      {open && (
        <div id="cb-window">
          {/* Header */}
          <div style={headerStyles.wrap}>
            <div style={headerStyles.left}>
              <div style={headerStyles.avatar}>🚨</div>
              <div>
                <div style={headerStyles.name}>Sama — SAVEMENOW AI</div>
                <div style={headerStyles.sub}>
                  <span className="cb-online-dot" style={headerStyles.onlineDot} />
                  {ROLE_LABELS[role] || "Emergency Help"} · Online
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {msgs.length > 0 && (
                <button style={headerStyles.iconBtn} onClick={() => setMsgs([])} title="Clear chat">
                  🗑
                </button>
              )}
              <button style={headerStyles.iconBtn} onClick={() => setOpen(false)} title="Close">
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div id="cb-messages" style={msgStyles.wrap}>
            {msgs.length === 0 && (
              <div style={msgStyles.welcome}>
                <div style={msgStyles.welcomeAvatar}>🛡️</div>
                <strong style={msgStyles.welcomeName}>Hi, I'm Sama!</strong>
                <p style={msgStyles.welcomeText}>{WELCOME_TEXT[role] || "Ask me anything about emergencies."}</p>

                {/* Quick chips */}
                <div style={msgStyles.chipsWrap}>
                  {chips.map(c => (
                    <button key={c} className="cb-chip" onClick={() => send(c)}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div className="cb-msg" key={i} style={m.role === "user" ? msgStyles.rowUser : msgStyles.rowBot}>
                {m.role === "assistant" && <div style={msgStyles.botAvatar}>🛡️</div>}
                <div style={m.role === "user" ? msgStyles.bubbleUser : msgStyles.bubbleBot}>
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={msgStyles.rowBot}>
                <div style={msgStyles.botAvatar}>🛡️</div>
                <div style={{ ...msgStyles.bubbleBot, padding: "12px 16px" }}>
                  <span className="cb-dot-1" /><span className="cb-dot-2" /><span className="cb-dot-3" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={inputStyles.wrap}>
            <textarea
              ref={inputRef}
              style={inputStyles.textarea}
              rows={1}
              placeholder="Ask anything… (Enter to send)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button
              style={{
                ...inputStyles.sendBtn,
                background: canSend ? "linear-gradient(135deg,#cc0000,#ff3333)" : "rgba(255,255,255,.06)",
                cursor: canSend ? "pointer" : "not-allowed",
              }}
              onClick={() => send()}
              disabled={!canSend}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Pulse ring (only when closed) */}
      {!open && <div id="cb-bubble-ring" />}

      {/* Bubble */}
      <button id="cb-bubble" onClick={() => setOpen(o => !o)}>
        {open ? (
          /* Close X */
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
            <path d="M2 2l14 14M16 2L2 16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <>
            {/* Sama star icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,.18)"/>
              <path d="M12 4l1.8 5.4H19l-4.6 3.4 1.8 5.4L12 15l-4.2 3.2 1.8-5.4L5 9.4h5.2L12 4z"
                fill="white"/>
            </svg>
            <span id="cb-bubble-label">
              {unread > 0 ? `Sama (${unread})` : "Ask Sama"}
            </span>
          </>
        )}
      </button>
    </>,
    document.body
  );
}

const headerStyles = {
  wrap: {
    background: "linear-gradient(135deg, #1a0000, #2d0000)",
    borderBottom: "1px solid rgba(225,29,72,.2)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexShrink: 0,
  },
  left:   { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    fontSize: 18,
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "rgba(225,29,72,.25)",
    border: "1px solid rgba(225,29,72,.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  name:   { color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.2 },
  sub:    { color: "rgba(255,255,255,.55)", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", flexShrink: 0 },
  iconBtn: { background: "rgba(255,255,255,.08)", border: "none", color: "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 14, padding: "5px 8px", borderRadius: 8, transition: "background .15s" },
};

const msgStyles = {
  wrap:    { flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 },
  welcome: { textAlign: "center", padding: "20px 12px 8px" },
  welcomeAvatar: { fontSize: 42, marginBottom: 10 },
  welcomeName: { display: "block", color: "#e8eefc", fontWeight: 800, fontSize: 16, marginBottom: 8 },
  welcomeText: { color: "#9fb0d0", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" },
  chipsWrap: { display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  rowUser:   { display: "flex", justifyContent: "flex-end" },
  rowBot:    { display: "flex", justifyContent: "flex-start", gap: 8, alignItems: "flex-end" },
  botAvatar: { fontSize: 16, width: 28, height: 28, borderRadius: "50%", background: "rgba(225,29,72,.15)", border: "1px solid rgba(225,29,72,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bubbleUser: { maxWidth: "78%", padding: "10px 14px", borderRadius: "18px 18px 4px 18px", background: "linear-gradient(135deg,#cc0000,#e11d48)", color: "#fff", fontSize: 13, lineHeight: 1.55, wordBreak: "break-word", whiteSpace: "pre-wrap" },
  bubbleBot:  { maxWidth: "78%", padding: "10px 14px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.09)", color: "#e8eefc", fontSize: 13, lineHeight: 1.55, wordBreak: "break-word", whiteSpace: "pre-wrap" },
};

const inputStyles = {
  wrap: { borderTop: "1px solid rgba(255,255,255,.07)", padding: "12px 12px", display: "flex", gap: 8, alignItems: "flex-end", background: "#12161f", flexShrink: 0 },
  textarea: { flex: 1, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.10)", borderRadius: 14, color: "#e8eefc", padding: "10px 13px", fontSize: 13, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.4, maxHeight: 90, overflowY: "auto", transition: "border-color .15s" },
  sendBtn: { width: 38, height: 38, borderRadius: "50%", flexShrink: 0, border: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff", transition: "background .18s" },
};
