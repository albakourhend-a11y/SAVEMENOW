import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─── CSS injected once into <head> ─────────────────────────────────────── */
const CSS = `
  @keyframes smChatSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes smChatBounce {
    0%, 80%, 100% { transform: translateY(0); }
    40%           { transform: translateY(-5px); }
  }
  @keyframes smChatPulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(204,0,0,.55); }
    50%      { box-shadow: 0 4px 32px rgba(204,0,0,.85); }
  }
  #sm-chat-bubble {
    position: fixed !important;
    bottom: 24px !important;
    right: 24px !important;
    width: 58px !important;
    height: 58px !important;
    border-radius: 50% !important;
    background: linear-gradient(135deg,#cc0000,#ff4444) !important;
    border: none !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 24px !important;
    z-index: 2147483647 !important;
    animation: smChatPulse 2.4s ease-in-out infinite;
    transition: transform .18s;
  }
  #sm-chat-bubble:hover { transform: scale(1.1); }

  #sm-chat-window {
    position: fixed !important;
    bottom: 96px !important;
    right: 24px !important;
    width: 350px !important;
    max-height: 510px !important;
    display: flex !important;
    flex-direction: column !important;
    background: #1a1a1a !important;
    border: 1px solid #333 !important;
    border-radius: 16px !important;
    box-shadow: 0 8px 40px rgba(0,0,0,.7) !important;
    z-index: 2147483646 !important;
    overflow: hidden !important;
    animation: smChatSlideUp .22s ease;
  }
  #sm-chat-messages::-webkit-scrollbar { width: 4px; }
  #sm-chat-messages::-webkit-scrollbar-track { background: transparent; }
  #sm-chat-messages::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
`;

function injectCSS() {
  if (document.getElementById("sm-chat-css")) return;
  const el = document.createElement("style");
  el.id = "sm-chat-css";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ─── Role helpers ───────────────────────────────────────────────────────── */
const ROLE_LABELS = { citizen: "Citizen Mode", driver: "Responder Mode", admin: "Admin Mode" };
const WELCOME_TEXT = {
  citizen: "Hey there! 💙 I'm Sama, your emergency assistant. I'm here to help you stay calm and safe. Ask me anything — first aid tips, what to do in an emergency, or anything else!",
  driver:  "Hey! 💪 I'm Sama, your on-duty assistant. Need quick guidance on a situation? Ask away — I've got your back!",
  admin:   "Hi there! 📊 I'm Sama, your system assistant. Need help managing resources or understanding system status? Just ask!",
};

/* ─── Inline styles ──────────────────────────────────────────────────────── */
const s = {
  header: { background: "linear-gradient(135deg,#cc0000,#ff4444)", padding: "13px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexShrink: 0 },
  headerLeft:  { display: "flex", alignItems: "center", gap: 10 },
  avatar:      { fontSize: 20, width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.2 },
  headerSub:   { color: "rgba(255,255,255,.8)", fontSize: 11 },
  iconBtn:     { background: "transparent", border: "none", color: "rgba(255,255,255,.8)", cursor: "pointer", fontSize: 16, padding: "3px 5px", borderRadius: 4 },
  messages:    { flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 10 },
  welcome:     { textAlign: "center", padding: "18px 12px", color: "#888", fontSize: 13, lineHeight: 1.6 },
  welcomeIcon: { fontSize: 30, marginBottom: 6 },
  welcomeTitle:{ color: "#ddd", display: "block", fontWeight: 700, marginBottom: 6, fontSize: 14 },
  rowUser:     { display: "flex", justifyContent: "flex-end" },
  rowBot:      { display: "flex", justifyContent: "flex-start" },
  bubbleUser:  { maxWidth: "80%", padding: "9px 13px", borderRadius: "16px 16px 4px 16px", background: "linear-gradient(135deg,#cc0000,#ff4444)", color: "#fff", fontSize: 13, lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" },
  bubbleBot:   { maxWidth: "80%", padding: "9px 13px", borderRadius: "16px 16px 16px 4px", background: "#2a2a2a", border: "1px solid #3a3a3a", color: "#eee", fontSize: 13, lineHeight: 1.5, wordBreak: "break-word", whiteSpace: "pre-wrap" },
  dot: (d)  => ({ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#888", margin: "0 2px", animation: `smChatBounce 1.2s infinite ${d}` }),
  inputArea:   { borderTop: "1px solid #2a2a2a", padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-end", background: "#1a1a1a", flexShrink: 0 },
  textarea:    { flex: 1, background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: 12, color: "#fff", padding: "9px 12px", fontSize: 13, resize: "none", outline: "none", fontFamily: "Arial,sans-serif", lineHeight: 1.4, maxHeight: 90, overflowY: "auto" },
  sendBtn: (d) => ({ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: d ? "#444" : "linear-gradient(135deg,#cc0000,#ff4444)", border: "none", cursor: d ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#fff" }),
  badge:       { position: "absolute", top: -3, right: -3, background: "#ff9800", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" },
};

/* ─── Component ──────────────────────────────────────────────────────────── */
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

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/chat`, { messages: next, role: role || "default" });
      setMsgs((p) => [...p, { role: "assistant", content: data.reply }]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: "⚠️ Couldn't reach the AI right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const canSend = input.trim().length > 0 && !loading;

  return createPortal(
    <>
      {open && (
        <div id="sm-chat-window">
          <div style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.avatar}>🚨</div>
              <div>
                <div style={s.headerTitle}>Sama 🌟 — SAVEMENOW Assistant</div>
                <div style={s.headerSub}>{ROLE_LABELS[role] || "Emergency Help"} · Always here for you</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {msgs.length > 0 && <button style={s.iconBtn} onClick={() => setMsgs([])} title="Clear">🗑</button>}
              <button style={s.iconBtn} onClick={() => setOpen(false)} title="Close">✕</button>
            </div>
          </div>

          <div id="sm-chat-messages" style={s.messages}>
            {msgs.length === 0 && (
              <div style={s.welcome}>
                <div style={s.welcomeIcon}>🛡️</div>
                <strong style={s.welcomeTitle}>How can I help?</strong>
                {WELCOME_TEXT[role] || "Ask me anything about emergency procedures or SAVEMENOW."}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} style={m.role === "user" ? s.rowUser : s.rowBot}>
                <div style={m.role === "user" ? s.bubbleUser : s.bubbleBot}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div style={s.rowBot}>
                <div style={{ ...s.bubbleBot, padding: "11px 14px" }}>
                  <span style={s.dot("0s")} /><span style={s.dot("0.2s")} /><span style={s.dot("0.4s")} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={s.inputArea}>
            <textarea ref={inputRef} style={s.textarea} rows={1}
              placeholder="Type a message… (Enter to send)"
              value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
            />
            <button style={s.sendBtn(!canSend)} onClick={send} disabled={!canSend}>➤</button>
          </div>
        </div>
      )}

      <button id="sm-chat-bubble" onClick={() => setOpen((o) => !o)} style={{ position: "relative" }}>
        {open ? "✕" : "💬"}
        {!open && unread > 0 && <span style={s.badge}>{unread}</span>}
      </button>
    </>,
    document.body
  );
}
