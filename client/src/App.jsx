import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoleSelect from './pages/RoleSelect';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CitizenPage from './pages/CitizenPage';
import DriverPage from './pages/DriverPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/role-select" element={<RoleSelect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/citizen" element={<CitizenPage />} />
        <Route path="/driver" element={<DriverPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;