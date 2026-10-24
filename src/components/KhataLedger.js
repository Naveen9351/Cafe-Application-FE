import React, { useState, useEffect } from 'react';
import { BookOpen, Search, CheckCircle, AlertCircle, Check, X, Phone, User, Plus, RefreshCw, Calendar, ArrowUpRight } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';
import styles from './KhataLedger.module.css';

export default function KhataLedger() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'settled'

  // Settlement Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('Cash');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // New Khata Entry Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newTotalBill, setNewTotalBill] = useState('');
  const [newPaidAmount, setNewPaidAmount] = useState('0');
  const [newNotes, setNewNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchKhataRecords();
  }, []);

  const fetchKhataRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/khata`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      if (Array.isArray(data)) {
        setRecords(data);
      } else if (data && Array.isArray(data.records)) {
        setRecords(data.records);
      } else if (data && Array.isArray(data.data)) {
        setRecords(data.data);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to fetch khata records:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg, isError = false) => {
    setActionMessage({ text: msg, isError });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleOpenSettle = (rec) => {
    const due = Number(rec.borrowAmount !== undefined ? rec.borrowAmount : (rec.remainingAmount || 0));
    setSelectedRecord(rec);
    setSettleAmount(due);
    setSettleMethod('Cash');
    setSettleNotes('');
  };

  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      setIsSettling(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/khata/${selectedRecord._id}/settle`, {
        amountReceived: Number(settleAmount),
        amount: Number(settleAmount),
        paymentMethod: settleMethod.toLowerCase(),
        notes: settleNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRecord(null);
      showFeedback(res.data?.message || 'Payment recorded successfully!');
      fetchKhataRecords();
    } catch (err) {
      showFeedback(err.response?.data?.error || err.response?.data?.message || 'Failed to settle khata record.', true);
    } finally {
      setIsSettling(false);
    }
  };

  const handleCreateKhata = async (e) => {
    e.preventDefault();
    const bill = Number(newTotalBill);
    const paid = Number(newPaidAmount) || 0;
    const borrow = Math.max(0, bill - paid);

    if (!newCustomerName.trim()) {
      alert('Please enter a valid customer name.');
      return;
    }
    const cleanPhone = newCustomerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 4) {
      alert('Please enter a valid phone number.');
      return;
    }

    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/khata`, {
        customerName: newCustomerName.trim(),
        customerPhone: cleanPhone,
        totalBill: bill,
        paidAmount: paid,
        borrowAmount: borrow,
        notes: newNotes.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewTotalBill('');
      setNewPaidAmount('0');
      setNewNotes('');
      showFeedback(res.data?.message || 'Khata entry recorded successfully!');
      fetchKhataRecords();
    } catch (err) {
      showFeedback(err.response?.data?.error || err.response?.data?.message || 'Failed to create khata entry.', true);
    } finally {
      setIsCreating(false);
    }
  };

  // Metrics
  const totalBorrowed = records.reduce((acc, r) => {
    const bill = Number(r.totalBill !== undefined ? r.totalBill : r.totalBillAmount) ||
      ((Number(r.borrowAmount) || 0) + (Number(r.paidAmount) || 0));
    return acc + bill;
  }, 0);

  const totalPaid = records.reduce((acc, r) => acc + (Number(r.paidAmount) || 0), 0);

  const totalOutstanding = records
    .filter(r => r.status !== 'settled')
    .reduce((acc, r) => acc + (Number(r.borrowAmount !== undefined ? r.borrowAmount : r.remainingAmount) || 0), 0);

  // Filtered List
  const filteredRecords = records.filter(rec => {
    const name = (rec.customerName || '').toLowerCase();
    const phone = String(rec.customerPhone || '');
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || name.includes(query) || phone.includes(query);

    if (!matchesSearch) return false;
    const due = Number(rec.borrowAmount !== undefined ? rec.borrowAmount : (rec.remainingAmount || 0));
    const isSettled = rec.status === 'settled' || due <= 0;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return !isSettled;
    if (statusFilter === 'settled') return isSettled;
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Toast Notification Banner */}
      {actionMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 10000,
          background: actionMessage.isError ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          fontSize: '0.85rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {actionMessage.isError ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>
            <BookOpen size={20} color="#2563eb" />
            Customer Khata & Borrow
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchBar}
              style={{ paddingLeft: 34 }}
            />
          </div>

          <button
            type="button"
            onClick={() => fetchKhataRecords()}
            className={styles.refreshBtn}
            title="Refresh records"
          >
            <RefreshCw size={15} />
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className={styles.addRecordBtn}
          >
            <Plus size={16} />
            <span>New Khata Entry</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertCircle size={18} />
          </div>
          <div className={styles.statInfo}>
            <h4>₹{totalOutstanding.toLocaleString()}</h4>
            <span>Total Outstanding Dues</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle size={18} />
          </div>
          <div className={styles.statInfo}>
            <h4>₹{totalPaid.toLocaleString()}</h4>
            <span>Recovered / Paid Amount</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <BookOpen size={18} />
          </div>
          <div className={styles.statInfo}>
            <h4>₹{totalBorrowed.toLocaleString()}</h4>
            <span>Total Credit Extended</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: 'All Customers', count: records.length },
          { key: 'pending', label: 'Pending Dues', count: records.filter(r => (Number(r.borrowAmount !== undefined ? r.borrowAmount : r.remainingAmount) || 0) > 0).length },
          { key: 'settled', label: 'Fully Settled', count: records.filter(r => (Number(r.borrowAmount !== undefined ? r.borrowAmount : r.remainingAmount) || 0) <= 0).length }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: statusFilter === tab.key ? '1px solid #2563eb' : '1px solid #e2e8f0',
              background: statusFilter === tab.key ? '#2563eb' : '#ffffff',
              color: statusFilter === tab.key ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <span>{tab.label}</span>
            <span style={{
              background: statusFilter === tab.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: '0.7rem'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Records Table */}
      <div className={styles.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.khataTable}>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Total Bill</th>
                <th>Initial Paid</th>
                <th>Remaining Due</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                    <RefreshCw size={18} className={styles.spin} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Loading Khata ledger...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No customer borrow records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const remainingDue = Number(rec.borrowAmount !== undefined ? rec.borrowAmount : (rec.remainingAmount || 0));
                  const bill = Number(rec.totalBill !== undefined ? rec.totalBill : rec.totalBillAmount) ||
                    ((Number(rec.paidAmount) || 0) + remainingDue);
                  const isSettled = rec.status === 'settled' || remainingDue <= 0;
                  const isPartial = rec.status === 'partially_settled' || rec.status === 'partial' || (Number(rec.paidAmount) > 0 && remainingDue > 0);

                  return (
                    <tr key={rec._id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#475569',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {(rec.customerName || 'C')[0].toUpperCase()}
                          </div>
                          <div>
                            <div>{rec.customerName}</div>
                            {rec.notes && <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>{rec.notes}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: '0.8rem' }}>
                          <Phone size={12} color="#94a3b8" />
                          {rec.customerPhone || 'N/A'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#1e293b' }}>
                        ₹{bill.toLocaleString()}
                      </td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>
                        ₹{Number(rec.paidAmount || 0).toLocaleString()}
                      </td>
                      <td style={{ color: remainingDue > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                        ₹{remainingDue.toLocaleString()}
                      </td>
                      <td>
                        <span className={`${styles.statusPill} ${isSettled ? styles.statusSettled : (isPartial ? styles.statusPartial : styles.statusPending)}`}>
                          {isSettled ? 'Settled' : (isPartial ? 'Partial Due' : 'Pending Due')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {remainingDue > 0 ? (
                          <button
                            type="button"
                            className={styles.settleBtn}
                            onClick={() => handleOpenSettle(rec)}
                          >
                            Settle Dues
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Check size={14} /> Cleared
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Due Modal */}
      {selectedRecord && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRecord(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Settle Customer Due
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{selectedRecord.customerName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedRecord.customerPhone}</div>
                <div style={{ marginTop: 8, fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
                  Current Outstanding Due: ₹{Number(selectedRecord.borrowAmount !== undefined ? selectedRecord.borrowAmount : (selectedRecord.remainingAmount || 0)).toLocaleString()}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Settlement Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={Number(selectedRecord.borrowAmount !== undefined ? selectedRecord.borrowAmount : (selectedRecord.remainingAmount || 0))}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Payment Method *
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Cash', 'UPI', 'Card'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettleMethod(m)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 8,
                        border: settleMethod === m ? '2px solid #16a34a' : '1px solid #cbd5e1',
                        background: settleMethod === m ? '#f0fdf4' : '#ffffff',
                        color: settleMethod === m ? '#16a34a' : '#475569',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Payment Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via GPay / In-person settlement"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#16a34a', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isSettling ? 'Recording...' : `Confirm Payment (₹${settleAmount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Khata Entry Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                New Customer Khata / Borrow Entry
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateKhata}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Customer Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  required
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Total Bill (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    required
                    value={newTotalBill}
                    onChange={(e) => setNewTotalBill(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                    Initial Paid (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newPaidAmount}
                    onChange={(e) => setNewPaidAmount(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Calculated Remaining Due */}
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, marginBottom: 14, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Remaining Due (Borrow):</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626' }}>
                  ₹{Math.max(0, (Number(newTotalBill) || 0) - (Number(newPaidAmount) || 0)).toLocaleString()}
                </span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regular patron, promised payment on Monday"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {isCreating ? 'Recording...' : 'Save Khata Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
