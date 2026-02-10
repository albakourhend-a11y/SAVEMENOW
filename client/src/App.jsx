import { useState } from "react";
import RoleSelect from "./pages/RoleSelect";
import CitizenPage from "./pages/CitizenPage";
import DriverPage from "./pages/DriverPage";
import AdminPage from "./pages/AdminPage";

function App() {
  const [role, setRole] = useState(null);

  if (!role) return <RoleSelect setRole={setRole} />;

  if (role === "citizen") return <CitizenPage />;
  if (role === "driver") return <DriverPage />;
  if (role === "admin") return <AdminPage />;
}

export default App;
