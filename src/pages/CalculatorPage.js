import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

const defaultRows = [
  { name: 'Zain', current: '', old: '' },
  { name: 'Danish', current: '', old: '' },
  { name: 'Faizan', current: '', old: '' },
];

export default function CalculatorPage() {
  const [rows, setRows] = useState(defaultRows);
  const [totalBill, setTotalBill] = useState('');
  const [totalUnits, setTotalUnits] = useState('');
  const [meterCharge, setMeterCharge] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [sanctionLoad, setSanctionLoad] = useState('');
  const [billedDemand, setBilledDemand] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState([]);
  const [isCalculated, setIsCalculated] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [saveError, setSaveError] = useState('');

  const printRef = useRef();
  const resultsRef = useRef();
  const navigate = useNavigate();

  const getDateRange = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const format = (d) =>
      d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

    return `${format(prevMonthStart)} - ${format(currentMonthStart)}`;
  };

  const [billingPeriod, setBillingPeriod] = useState(getDateRange());

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setIsCalculated(false);
    setIsSaved(false);
    setSaveSuccess(null);
    setSaveError('');
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
    setIsCalculated(false);
    setIsSaved(false);
    setSaveSuccess(null);
    setSaveError('');
  };

  const addRow = () => {
    setRows([...rows, { name: `Tenant ${rows.length + 1}`, current: '', old: '' }]);
    setIsCalculated(false);
    setIsSaved(false);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) {
      alert('At least one sub-meter row is required.');
      return;
    }
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
    setIsCalculated(false);
    setIsSaved(false);
  };

  // Helper to auto-calculate unit price from total bill and total units
  const autoComputeUnitPrice = () => {
    const bill = parseFloat(totalBill);
    const units = parseFloat(totalUnits);
    if (bill > 0 && units > 0) {
      const calculatedRate = (bill / units).toFixed(2);
      setUnitPrice(calculatedRate);
      setIsCalculated(false);
      setIsSaved(false);
    }
  };

  const calculate = () => {
    const rate = parseFloat(unitPrice);
    if (isNaN(rate) || rate <= 0) {
      alert('Please enter a valid Unit Price before calculating.');
      return;
    }

    const totalMeterCharge = meterCharge
      ? meterCharge
          .split(',')
          .map((val) => parseFloat(val.trim()) || 0)
          .reduce((sum, val) => sum + val, 0)
      : 0;

    const perMeterCharge =
      rows.length > 0 ? Math.round(totalMeterCharge / rows.length) : 0;

    const calculated = rows.map((row) => {
      const current = parseFloat(row.current) || 0;
      const old = parseFloat(row.old) || 0;
      const units = Math.max(0, +(current - old).toFixed(2));
      const unitAmount = +(units * rate).toFixed(2);
      const total = units === 0 ? perMeterCharge : Math.floor(unitAmount + perMeterCharge);

      return {
        name: row.name?.trim() || 'Unnamed',
        current,
        old,
        units,
        unitAmount,
        meterShare: perMeterCharge,
        total,
      };
    });

    setResult(calculated);
    setIsCalculated(true);
    setIsSaved(false);
    setSaveSuccess(null);
    setSaveError('');

    // Smooth scroll down to results
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const grandTotal = Math.floor(result.reduce((sum, r) => sum + (r.total || 0), 0));

  const handleSaveToDatabase = async () => {
    if (!isCalculated || result.length === 0) {
      alert('Please calculate the bill before saving.');
      return;
    }

    if (saveLoading || isSaved) return;

    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess(null);

    const totalMeterCharge = meterCharge
      ? meterCharge
          .split(',')
          .map((val) => parseFloat(val.trim()) || 0)
          .reduce((sum, val) => sum + val, 0)
      : 0;

    const perMeterCharge =
      rows.length > 0 ? Math.round(totalMeterCharge / rows.length) : 0;

    const payload = {
      billingPeriod: billingPeriod.trim(),
      totalBill: parseFloat(totalBill) || 0,
      totalUnits: parseFloat(totalUnits) || 0,
      meterCharge: meterCharge.trim(),
      totalMeterCharge,
      perMeterCharge,
      unitPrice: parseFloat(unitPrice) || 0,
      sanctionLoad: parseFloat(sanctionLoad) || 0,
      billedDemand: parseFloat(billedDemand) || 0,
      rows: result,
      grandTotal,
      notes: notes.trim(),
    };

    try {
      const response = await api.bills.create(payload);
      if (response.success && response.bill) {
        setIsSaved(true);
        setSaveSuccess({
          message: 'Bill record saved successfully into database! ✅',
          billId: response.bill._id,
        });
      } else {
        setSaveError(response.message || 'Failed to save bill record.');
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to save bill to database.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container">
      <div className="card calculator-card">
        <div className="card-header-flex">
          <div>
            <h2 className="heading">⚡ Electricity Bill Calculator</h2>
            <div className="period-badge-wrap">
              <span className="period-label">Billing Period:</span>
              <input
                type="text"
                className="period-input"
                value={billingPeriod}
                onChange={handleInputChange(setBillingPeriod)}
                placeholder="e.g. 1 Jan 2026 - 1 Feb 2026"
              />
            </div>
          </div>
        </div>

        {/* Input Controls */}
        <div className="grid">
          <div className="form-group">
            <label>Total Main Bill (₹)</label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={totalBill}
              onChange={handleInputChange(setTotalBill)}
            />
          </div>

          <div className="form-group">
            <label>Total Main Units (kWh)</label>
            <input
              type="number"
              placeholder="e.g. 1500"
              value={totalUnits}
              onChange={handleInputChange(setTotalUnits)}
            />
          </div>

          <div className="form-group">
            <label>Meter Charges (comma separated)</label>
            <input
              placeholder="e.g. 50, -20, 30"
              value={meterCharge}
              onChange={handleInputChange(setMeterCharge)}
            />
          </div>

          <div className="form-group">
            <div className="label-with-action">
              <label>Unit Price / Rate (₹/unit)</label>
              {totalBill && totalUnits && (
                <button
                  type="button"
                  className="quick-fill-link"
                  onClick={autoComputeUnitPrice}
                >
                  ⚡ Auto-Calculate Rate
                </button>
              )}
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 10.50"
              value={unitPrice}
              onChange={handleInputChange(setUnitPrice)}
            />
          </div>

          <div className="form-group">
            <label>Sanction Load (kW)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 2"
              value={sanctionLoad}
              onChange={handleInputChange(setSanctionLoad)}
            />
          </div>

          <div className="form-group">
            <label>Billed Demand (Load) (kW)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 1.50"
              value={billedDemand}
              onChange={handleInputChange(setBilledDemand)}
            />
          </div>
        </div>

        {/* Sub Meter Table */}
        <div className="section-header">
          <h3>Sub-Meter Readings</h3>
          <span className="section-hint">Enter previous and latest meter readings for each shop/tenant</span>
        </div>

        <table className="table input-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Tenant / Shop Name</th>
              <th style={{ width: '25%' }}>Current Reading</th>
              <th style={{ width: '25%' }}>Old Reading</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>
                  <input
                    placeholder="Tenant/Shop Name"
                    value={row.name}
                    onChange={(e) => handleRowChange(i, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Current"
                    value={row.current}
                    onChange={(e) => handleRowChange(i, 'current', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="Old"
                    value={row.old}
                    onChange={(e) => handleRowChange(i, 'old', e.target.value)}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    className="delete-row-btn"
                    onClick={() => removeRow(i)}
                    title="Remove Sub-Meter"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="calculator-actions">
          <button className="btn addBtn" onClick={addRow}>
            ➕ Add Sub-Meter Row
          </button>
          <button className="btn calcBtn" onClick={calculate}>
            ⚡ Calculate Bill Breakdown
          </button>
        </div>

        {/* Additional Notes */}
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Notes / Remarks (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Generator charges included, due date by 10th"
            value={notes}
            onChange={handleInputChange(setNotes)}
          />
        </div>

        {/* Results Section */}
        {result.length > 0 && isCalculated && (
          <div ref={resultsRef} className="results-wrapper" style={{ marginTop: '28px' }}>
            <div ref={printRef} className="printArea results-container">
              <div className="results-header">
                <div>
                  <h3 className="results-title">📊 Calculated Bill Breakdown</h3>
                  <p className="results-period">{billingPeriod}</p>
                </div>
                <div className="rate-info-box">
                  <span>Unit Rate: <strong>₹{unitPrice}</strong></span>
                  <span>Meter Share: <strong>₹{result[0]?.meterShare || 0}</strong> / meter</span>
                </div>
              </div>

              <table className="table resultTable">
                <thead>
                  <tr>
                    <th>Shop / Name</th>
                    <th>Units Consumed</th>
                    <th>Current Reading</th>
                    <th>Old Reading</th>
                    <th>Unit Amt (₹)</th>
                    <th>Meter Charge (₹)</th>
                    <th>Total (Round Off)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <strong>{r.name}</strong>
                      </td>
                      <td>{r.units} kWh</td>
                      <td>{r.current}</td>
                      <td>{r.old}</td>
                      <td>₹{r.unitAmount.toFixed(2)}</td>
                      <td>₹{r.meterShare}</td>
                      <td>
                        <span className="tenant-total-pill">₹{r.total}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="results-summary">
                <div className="summary-details">
                  <p>Total Sub-Meters: <strong>{result.length}</strong></p>
                  {notes && <p>Remarks: <em>{notes}</em></p>}
                </div>
                <div className="grand-total-card">
                  <span className="grand-total-label">Grand Total Amount</span>
                  <h2 className="grand-total-val">₹{grandTotal.toLocaleString('en-IN')}</h2>
                </div>
              </div>

              {/* Status alerts rendered right in the results area */}
              {saveSuccess && (
                <div className="alert alert-success" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{saveSuccess.message}</strong>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => navigate(`/records/${saveSuccess.billId}`)}
                  >
                    View Record Details ➔
                  </button>
                </div>
              )}

              {saveError && (
                <div className="alert alert-danger" style={{ marginTop: '16px' }}>
                  ❌ {saveError}
                </div>
              )}

              <div className="result-buttons" style={{ marginTop: '16px' }}>
                <button
                  className={`btn ${isSaved ? 'btn-saved-success' : 'saveBtn'}`}
                  onClick={handleSaveToDatabase}
                  disabled={saveLoading || isSaved}
                >
                  {saveLoading
                    ? '💾 Saving to Database...'
                    : isSaved
                    ? '✅ Saved in Database'
                    : '💾 Save Record to Database'}
                </button>

                {isSaved && saveSuccess?.billId && (
                  <button
                    className="btn btn-outline"
                    onClick={() => navigate(`/records/${saveSuccess.billId}`)}
                  >
                    👁️ View Saved Record
                  </button>
                )}

                <button className="btn printBtn" onClick={handlePrint}>
                  🖨️ Download / Print Bill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
