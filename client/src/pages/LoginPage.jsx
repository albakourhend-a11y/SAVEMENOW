import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

      const { token, role: userRole, name } = res.data;

      if (userRole !== role) {
        setError(`This account is not a ${role}. Please select the correct role.`);
        setLoading(false);
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
      localStorage.setItem("name", name);
      navigate(`/${role}`);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
    setLoading(false);
  };

  const roleColors = {
    admin: "#7c3aed",
    driver: "#0ea5e9",
    citizen: "#e11d48",
  };
  const color = roleColors[role] || "#e11d48";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ ...styles.title, color }}>
          {role?.charAt(0).toUpperCase() + role?.slice(1)} Login
        </h1>
        <p style={styles.subtitle}>Sign in to access the {role} dashboard</p>

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
            placeholder="Enter your password"
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ ...styles.btn, background: color, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <p style={styles.switch}>
          Don't have an account?{" "}
          <span onClick={() => navigate(`/register/${role}`)} style={{ ...styles.link, color }}>
            Register
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
  field: {
    marginBottom: 18,
  },
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
    letterSpacing: ".5px",
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