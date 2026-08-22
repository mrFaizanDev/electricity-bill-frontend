import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function RecordsPage() {
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const initialLoadRef = useRef(true);

  // Fetch dashboard stats once on mount or when records change
  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await api.bills.getStats();
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch {
      // Ignore stats error gracefully
    }
  }, []);

  // Fetch bills list (supports debounced search query)
  const fetchBillsList = useCallback(async (query = '') => {
    setSearchLoading(true);
    setError('');
    try {
      const res = await api.bills.getAll(query);
      if (res.success) {
        setBills(res.bills || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load billing records.');
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  }, []);

  // Initial load: Fetch stats and all bills once
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchBillsList(''), fetchStats()]);
      initialLoadRef.current = false;
    };
    loadInitialData();
  }, [fetchBillsList, fetchStats]);

  // Debounced search: Only fires 350ms after user stops typing
  useEffect(() => {
    // Skip on first initial render since loadInitialData already ran
    if (initialLoadRef.current) return;

    const timer = setTimeout(() => {
      fetchBillsList(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search, fetchBillsList]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this billing record?')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await api.bills.delete(id);
      if (res.success) {
        setBills((prev) => prev.filter((b) => b._id !== id));
        fetchStats(); // Update stats after deletion
      }
    } catch (err) {
      alert(err.message || 'Failed to delete record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card records-card">
        <div className="card-header-flex">
          <div>
            <h2 className="heading">📋 Previous Electricity Bills</h2>
            <p className="subHeading">History of past generated shop bills and meter records</p>
          </div>
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              ➕ Calculate New Bill
            </button>
          )}
        </div>

        {/* Dashboard Stats */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Saved Bills</span>
              <h3 className="stat-value">{stats.totalRecords || bills.length}</h3>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Billed Units</span>
              <h3 className="stat-value">{stats.totalUnitsConsumed?.toLocaleString('en-IN') || 0} kWh</h3>
            </div>
            <div className="stat-card stat-card-highlight">
              <span className="stat-label">Cumulative Billed Amount</span>
              <h3 className="stat-value">₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}</h3>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="search-bar-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search records by billing period, shop name, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searchLoading && <span className="search-spinner" title="Searching...">⚡</span>}
          {search && (
            <button className="clear-search-btn" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Records Table / List */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading records from database...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No Billing Records Found</h3>
            <p>
              {search
                ? `No bills match your search criteria "${search}".`
                : 'No electricity bills have been recorded yet.'}
            </p>
            {isAdmin && !search && (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/')}
              >
                ⚡ Generate First Bill
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table records-table">
              <thead>
                <tr>
                  <th>Billing Period</th>
                  <th>Date Saved</th>
                  <th>Total Units</th>
                  <th>Unit Rate</th>
                  <th>Shops</th>
                  <th>Grand Total</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill._id}>
                    <td>
                      <strong className="period-title">{bill.billingPeriod}</strong>
                      {bill.notes && <div className="note-text">{bill.notes}</div>}
                    </td>
                    <td>
                      {new Date(bill.billDate || bill.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td>{bill.totalUnits} kWh</td>
                    <td>₹{bill.unitPrice}</td>
                    <td>
                      <span className="badge-count">
                        {bill.rows?.length || 0} Sub-meters
                      </span>
                    </td>
                    <td>
                      <strong className="amount-text">
                        ₹{bill.grandTotal?.toLocaleString('en-IN')}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons-group">
                        <button
                          className="btn-action view-btn"
                          onClick={() => navigate(`/records/${bill._id}`)}
                          title="View Bill Details"
                        >
                          👁️ View
                        </button>
                        {isAdmin && (
                          <button
                            className="btn-action delete-btn"
                            onClick={() => handleDelete(bill._id)}
                            disabled={deleteLoading}
                            title="Delete Record"
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
  );
}
