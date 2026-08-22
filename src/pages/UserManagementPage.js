import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New user form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [formLoading, setFormLoading] = useState(false);

  // Reset user password modal state
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const { user: currentAdmin } = useAuth();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.auth.getUsers();
      if (res.success) {
        setUsers(res.users || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim() || !password) {
      setError('Please provide both User ID and Password.');
      return;
    }

    setFormLoading(true);
    try {
      const res = await api.auth.createUser({
        username: username.trim(),
        password,
        name: name.trim(),
        role,
      });

      if (res.success) {
        setSuccessMsg(
          `User '${username.trim()}' created successfully! You can now share ID: "${username.trim()}" & Password with them.`
        );
        setUsername('');
        setPassword('');
        setName('');
        setRole('user');
        fetchUsers();
      }
    } catch (err) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userIdentifier) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${userIdentifier}"? They will lose login access immediately.`
      )
    ) {
      return;
    }

    try {
      const res = await api.auth.deleteUser(userId);
      if (res.success) {
        setUsers(users.filter((u) => u._id !== userId));
        setSuccessMsg(`User '${userIdentifier}' was deleted.`);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const openResetModal = (user) => {
    setResetModalUser(user);
    setResetNewPassword('');
    setResetError('');
    setResetSuccess('');
  };

  const closeResetModal = () => {
    setResetModalUser(null);
    setResetNewPassword('');
    setResetError('');
    setResetSuccess('');
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetNewPassword) {
      setResetError('Please enter a new password.');
      return;
    }

    if (resetNewPassword.length < 4) {
      setResetError('Password must be at least 4 characters long.');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.auth.resetUserPassword(
        resetModalUser._id,
        resetNewPassword
      );
      if (res.success) {
        setResetSuccess(
          `Password for '${resetModalUser.username}' was updated successfully! ✅`
        );
        setSuccessMsg(
          `Password for user '${resetModalUser.username}' was reset.`
        );
        setTimeout(() => {
          closeResetModal();
        }, 1500);
      } else {
        setResetError(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setResetError(err.message || 'Failed to reset user password.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card user-mgmt-card">
        <div className="card-header-flex">
          <div>
            <h2 className="heading">👥 User Access Management</h2>
            <p className="subHeading">
              Create IDs & Passwords for shop members to view billing records
            </p>
          </div>
        </div>

        {successMsg && <div className="alert alert-success">✅ {successMsg}</div>}
        {error && <div className="alert alert-danger">❌ {error}</div>}

        <div className="user-mgmt-layout">
          {/* Create User Form */}
          <div className="create-user-section">
            <h3 className="section-title">➕ Create New User Account</h3>
            <p className="section-desc">
              Create credentials to give to shop owners/tenants. Normal users can view previous records and invoice details, but cannot calculate or edit bills.
            </p>

            <form onSubmit={handleCreateUser} className="create-user-form">
              <div className="form-group">
                <label>User ID / Username *</label>
                <input
                  type="text"
                  placeholder="e.g. shop1, tenant_rahul, shop_a"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input
                  type="text"
                  placeholder="Assign password (e.g. pass123)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Shop / Display Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Medical Store"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Access Role</label>
                <select
                  className="custom-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">Standard Access (View Billing Records)</option>
                  <option value="admin">Full Access (Manage, Calculate & Edit)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary create-btn"
                disabled={formLoading}
              >
                {formLoading ? 'Creating User...' : '➕ Create User Credentials'}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="users-list-section">
            <h3 className="section-title">
              Authorized Users ({users.length})
            </h3>
            <p className="section-desc">
              Active accounts allowed to sign into the system
            </p>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <p>No users found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table users-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name / Shop</th>
                      <th>Role</th>
                      <th>Created</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <code>{u.username}</code>
                        </td>
                        <td>{u.name || u.username}</td>
                        <td>
                          <span className={`role-tag role-${u.role}`}>
                            {u.role === 'admin' ? 'Full Access' : 'Standard'}
                          </span>
                        </td>
                        <td>
                          {new Date(u.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="action-buttons-group">
                            <button
                              className="btn-action reset-pwd-btn"
                              onClick={() => openResetModal(u)}
                              title={`Reset password for ${u.username}`}
                            >
                              🔑 Reset
                            </button>
                            {u._id === currentAdmin?.id || u.username === currentAdmin?.username ? (
                              <span className="current-user-tag">(You)</span>
                            ) : (
                              <button
                                className="btn-action delete-btn"
                                onClick={() => handleDeleteUser(u._id, u.username)}
                                title="Delete User"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset User Password Modal */}
      {resetModalUser && (
        <div className="modal-overlay" onClick={closeResetModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>🔑 Reset User Password</h3>
              <button
                className="modal-close-btn"
                onClick={closeResetModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="modal-form">
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#475569' }}>
                Set a new password for{' '}
                <strong>
                  {resetModalUser.name
                    ? `${resetModalUser.name} (${resetModalUser.username})`
                    : resetModalUser.username}
                </strong>
                :
              </p>

              {resetSuccess && (
                <div className="alert alert-success">{resetSuccess}</div>
              )}
              {resetError && (
                <div className="alert alert-danger">{resetError}</div>
              )}

              <div className="form-group">
                <label>New Password (min 4 characters) *</label>
                <input
                  type="text"
                  placeholder="Enter new password (e.g. pass123)"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeResetModal}
                  disabled={resetLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Resetting...' : '🔑 Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
