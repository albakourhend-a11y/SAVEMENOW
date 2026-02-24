import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <h1>SaveMeNow</h1>
      <p>Emergency response at your fingertips</p>
      <div className="button-group">
        <button className="btn btn-green" onClick={() => navigate('/role-select')}>
          Login / Signup
        </button>
        <button className="btn btn-red" onClick={() => alert('Save Me clicked – redirect to emergency request')}>
          Save Me !!
        </button>
      </div>
    </div>
  );
};

export default LandingPage;