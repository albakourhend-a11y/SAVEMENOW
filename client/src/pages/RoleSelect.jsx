import { useNavigate } from 'react-router-dom';
import './RoleSelect.css';

const RoleSelect = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    navigate('/login', { state: { selectedRole: role } });
  };

  return (
    <div className="role-container">
      <h2>Select Your Role</h2>
      <p>Choose how you want to use SaveMeNow</p>
      <div className="role-buttons">
        <button className="role-btn citizen" onClick={() => handleRoleSelect('citizen')}>
          Citizen
        </button>
        <button className="role-btn driver" onClick={() => handleRoleSelect('driver')}>
          Driver
        </button>
        <button className="role-btn admin" onClick={() => handleRoleSelect('admin')}>
          Admin
        </button>
      </div>
    </div>
  );
};

export default RoleSelect;