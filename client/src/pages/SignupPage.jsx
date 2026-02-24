import { Link } from 'react-router-dom';
import './SignupPage.css';

const SignupPage = () => {
  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2>Sign Up for SaveMeNow</h2>
        <p>This page is under construction. Please check back later.</p>
        <Link to="/login" className="back-link">← Back to Login</Link>
      </div>
    </div>
  );
};

export default SignupPage;