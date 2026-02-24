import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const selectedRole = location.state?.selectedRole || 'citizen';

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(validateEmail(value) ? '' : 'Please enter a valid email address.');
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError(validatePassword(value) ? '' : 'Password must be at least 6 characters.');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid) setEmailError('Please enter a valid email address.');
    if (!isPasswordValid) setPasswordError('Password must be at least 6 characters.');

    if (isEmailValid && isPasswordValid) {
      setIsLoading(true);
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => {
        setIsLoading(false);
        navigate(`/${selectedRole}`);
      }, 1500);
    }
  };

  const isFormValid = validateEmail(email) && validatePassword(password);

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login to SaveMeNow</h2>
        <p className="role-indicator">Logging in as: <strong>{selectedRole}</strong></p>

        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            className={emailError ? 'error' : ''}
            placeholder="you@example.com"
            required
            autoFocus
          />
          {emailError && <span className="error-text">{emailError}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={handlePasswordChange}
              className={passwordError ? 'error' : ''}
              placeholder="••••••"
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {passwordError && <span className="error-text">{passwordError}</span>}
        </div>

        <div className="forgot-password">
          <a href="/forgot-password">Forgot password?</a>
        </div>

        <button
          type="submit"
          className="login-button"
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>

        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;