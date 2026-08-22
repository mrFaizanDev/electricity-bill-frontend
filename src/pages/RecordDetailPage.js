import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function RecordDetailPage() {
  const { id } = useParams();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef();

  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBill = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.bills.getById(id);
        if (res.success && res.bill) {
          setBill(res.bill);
        } else {
          setError('Bill record not found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to load bill details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBill();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this bill record?')) {
      return;
    }
    try {
      const res = await api.bills.delete(id);
      if (res.success) {
        navigate('/records');
      }
    } catch (err) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading bill details...</p>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-danger">{error || 'Bill not found'}</div>
          <Link to="/records" className="btn btn-primary">
            ⬅ Back to Records List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Top action bar (hidden during print) */}
      <div className="detail-top-nav no-print">
        <button className="btn btn-outline" onClick={() => navigate('/records')}>
          ⬅ Back to All Records
        </button>

        <div className="top-nav-actions">
          <button className="btn printBtn" onClick={handlePrint}>
            🖨️ Print / Download Bill
          </button>
          {isAdmin && (
            <button className="btn delete-danger-btn" onClick={handleDelete}>
              🗑️ Delete Record
            </button>
          )}
        </div>
      </div>

      {/* Bill Invoice Card */}
      <div ref={printRef} className="card printArea invoice-card">
        {/* Invoice Header */}
        <div className="invoice-header">
          <div className="invoice-brand">
            <div className="brand-logo-circle">⚡</div>
            <div>
              <h1 className="invoice-title">Electricity Bill Statement</h1>
              <p className="invoice-subtitle">Commercial & Shop Sub-Meter Division</p>
            </div>
          </div>

          <div className="invoice-meta">
            <div className="meta-item">
              <span className="meta-label">Billing Period:</span>
              <strong className="meta-value">{bill.billingPeriod}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Date Generated:</span>
              <span className="meta-value">
                {new Date(bill.billDate || bill.createdAt).toLocaleDateString(
                  'en-GB',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }
                )}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Invoice ID:</span>
              <span className="meta-value">#{bill._id.slice(-8).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Master Meter Overview Grid */}
        <div className="meter-overview-grid">
          <div className="overview-box">
            <span className="overview-label">Total Main Bill</span>
            <span className="overview-val">₹{bill.totalBill?.toLocaleString('en-IN')}</span>
          </div>
          <div className="overview-box">
            <span className="overview-label">Total Main Units</span>
            <span className="overview-val">{bill.totalUnits} kWh</span>
          </div>
          <div className="overview-box">
            <span className="overview-label">Unit Rate</span>
            <span className="overview-val">₹{bill.unitPrice} / kWh</span>
          </div>
          <div className="overview-box">
            <span className="overview-label">Meter Charges Share</span>
            <span className="overview-val">₹{bill.perMeterCharge || 0} / shop</span>
          </div>
          {bill.sanctionLoad > 0 && (
            <div className="overview-box">
              <span className="overview-label">Sanction Load</span>
              <span className="overview-val">{bill.sanctionLoad} kW</span>
            </div>
          )}
          {bill.billedDemand > 0 && (
            <div className="overview-box">
              <span className="overview-label">Billed Demand</span>
              <span className="overview-val">{bill.billedDemand} kW</span>
            </div>
          )}
        </div>

        {/* Sub-Meters Breakdown Table */}
        <div className="table-responsive">
          <table className="table invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Shop / Tenant</th>
                <th>Previous Reading</th>
                <th>Current Reading</th>
                <th>Units (kWh)</th>
                <th>Unit Amt (₹)</th>
                <th>Meter Fixed (₹)</th>
                <th>Total Payable (₹)</th>
              </tr>
            </thead>
            <tbody>
              {bill.rows?.map((row, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.old}</td>
                  <td>{row.current}</td>
                  <td>{row.units}</td>
                  <td>₹{row.unitAmount?.toFixed(2)}</td>
                  <td>₹{row.meterShare}</td>
                  <td>
                    <span className="invoice-total-badge">₹{row.total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grand Total and Footer */}
        <div className="invoice-bottom-flex">
          <div className="invoice-notes-block">
            {bill.notes && (
              <div className="invoice-notes">
                <strong>Notes / Instructions:</strong>
                <p>{bill.notes}</p>
              </div>
            )}
            <div className="generated-by-tag">
              Recorded by: {bill.createdByName || 'Management'}
            </div>
          </div>

          <div className="invoice-grand-total-box">
            <span className="grand-label">Grand Total Payable</span>
            <h2 className="grand-amount">₹{bill.grandTotal?.toLocaleString('en-IN')}</h2>
            <small className="roundoff-note">* Amounts rounded off as per standard calculation</small>
          </div>
        </div>

        {/* Printable Footer Stamp */}
        <div className="invoice-print-footer">
          <hr />
          <p>This is a computer-generated electricity bill statement. Generated on {new Date().toLocaleDateString('en-GB')}.</p>
        </div>
      </div>
    </div>
  );
}
