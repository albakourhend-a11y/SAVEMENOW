import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import axios from "axios";

export default function RegisterPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleColors = {
    admin: "#7c3aed",
    driver: "#0ea5e9",
    citizen: "#e11d48",
  };
  const color = roleColors[role] || "#e11d48";

  const handleRegister = async () => {
    setError("");
    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("${import.meta.env.VITE_API_URL}/auth/register", {
        name,
        email,
        password,
        role,
      });
    navigate(`/login/${role}`); // go to login after registering
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Try again.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ ...styles.title, color }}>
          {role?.charAt(0).toUpperCase() + role?.slice(1)} Register
        </h1>
        <p style={styles.subtitle}>Create your {role} account</p>

        <div style={styles.field}>
          <label style={styles.label}>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{ ...styles.btn, background: color, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Registering…" : "Create Account"}
        </button>

        <p style={styles.switch}>
          Already have an account?{" "}
          <span onClick={() => navigate(`/login/${role}`)} style={{ ...styles.link, color }}>
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  card: {
    background: "#111a2e",
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 20,
    padding: 40,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,.4)",
  },
  title: {
    margin: "0 0 8px 0",
    fontSize: 28,
    fontWeight: 800,
  },
  subtitle: {
    color: "#9fb0d0",
    margin: "0 0 28px 0",
    fontSize: 14,
  },
  field: { marginBottom: 18 },
  label: {
    display: "block",
    color: "#9fb0d0",
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.06)",
    color: "#e8eefc",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  error: {
    background: "rgba(225,29,72,.12)",
    border: "1px solid rgba(225,29,72,.3)",
    color: "#fb7185",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 16,
  },
  btn: {
    width: "100%",
    border: "none",
    borderRadius: 12,
    color: "white",
    padding: "14px 16px",
    fontWeight: 800,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 8,
  },
  switch: {
    textAlign: "center",
    color: "#9fb0d0",
    fontSize: 13,
    marginTop: 16,
  },
  link: {
    cursor: "pointer",
    fontWeight: 700,
    textDecoration: "underline",
  },
};
