import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!currentPassword || !newPassword) {
      setPwdError('Please enter both your current and new password.');
      return;
    }

    if (newPassword.length < 4) {
      setPwdError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation do not match.');
      return;
    }

    setPwdLoading(true);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPwdSuccess('Password updated successfully! ✅');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPwdSuccess('');
        }, 1800);
      } else {
        setPwdError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setPwdError(err.message || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPwdError('');
    setPwdSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <div
            className="navbar-brand"
            onClick={() => navigate(isAdmin ? '/' : '/records')}
          >
            <span className="navbar-icon">⚡</span>
            <div className="navbar-titles">
              <span className="navbar-title">Electricity Bill System</span>
              <span className="navbar-subtitle">Shop Billing & Records</span>
            </div>
          </div>

          <nav className="navbar-links">
            {isAdmin && (
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
                end
              >
                ⚡ Calculator
              </NavLink>
            )}

            <NavLink
              to="/records"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              📋 Records List
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                👥 Users
              </NavLink>
            )}
          </nav>

          <div className="navbar-user">
            <div className="user-badge" title={`Signed in as ${user?.username}`}>
              <span className="user-avatar-icon">👤</span>
              <span className="user-name">{user?.name || user?.username}</span>
            </div>

            <button
              className="nav-action-btn"
              onClick={() => setShowPasswordModal(true)}
              title="Change Password"
            >
              🔑 Password
            </button>

            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Sign Out"
            >
              Logout ↪
            </button>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={closePasswordModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>🔑 Change Account Password</h3>
              <button
                className="modal-close-btn"
                onClick={closePasswordModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="modal-form">
              {pwdSuccess && (
                <div className="alert alert-success">{pwdSuccess}</div>
              )}
              {pwdError && (
                <div className="alert alert-danger">{pwdError}</div>
              )}

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password (min 4 chars)</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closePasswordModal}
                  disabled={pwdLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={pwdLoading}
                >
                  {pwdLoading ? 'Updating...' : 'Update Password 🔐'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
