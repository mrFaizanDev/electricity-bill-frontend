import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both User ID and Password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res.success) {
        if (res.user.role === 'admin') {
          navigate('/');
        } else {
          navigate('/records');
        }
      } else {
        setError(res.message || 'Invalid User ID or Password.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">⚡</div>
          <h2>Electricity Bill System</h2>
          <p className="login-subtitle">
            Sign in with your assigned ID and Password
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">User ID / Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your User ID"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In 🔐'}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-note">
            🔒 <strong>Restricted Access:</strong> Only registered users can access this portal. User IDs and passwords are provided directly by store management.
          </p>
        </div>
      </div>
    </div>
  );
}
