import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import RoleSelect from "./pages/RoleSelect";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import CitizenPage from "./pages/CitizenPage";
import DriverPage from "./pages/DriverPage";
import AdminPage from "./pages/AdminPage";
import ChatBot from "./components/ChatBot";

const PROTECTED_PATHS = ["/citizen", "/driver", "/admin"];

function ChatBotOverlay() {
  const location = useLocation();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  if (!token || !PROTECTED_PATHS.includes(location.pathname)) return null;
  return <ChatBot role={role} />;
}

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/" />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RoleSelect />} />
        <Route path="/register/:role" element={<RegisterPage />} />
        <Route path="/login/:role" element={<LoginPage />} />

        {/* Protected routes */}
        <Route path="/citizen" element={
          <ProtectedRoute allowedRole="citizen">
            <CitizenPage />
          </ProtectedRoute>
        } />
        <Route path="/driver" element={
          <ProtectedRoute allowedRole="driver">
            <DriverPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminPage />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ChatBotOverlay />
    </BrowserRouter>
  );
}
