import React, { useState, useEffect } from 'react';
import { BookOpen, Search, CheckCircle, Clock, AlertCircle, Check, X, Phone, User } from 'lucide-react';
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
  const [isSettling, setIsSettling] = useState(false);

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
      if (res.data && res.data.success) {
        setRecords(res.data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch khata records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettle = (rec) => {
    setSelectedRecord(rec);
    setSettleAmount(rec.remainingAmount);
    setSettleMethod('Cash');
  };

  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      setIsSettling(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/khata/${selectedRecord._id}/settle`, {
        amount: Number(settleAmount),
        paymentMethod: settleMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedRecord(null);
      fetchKhataRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to settle khata record.');
    } finally {
      setIsSettling(false);
    }
  };

  // Metrics
  const totalBorrowed = records.reduce((acc, r) => acc + (r.borrowAmount || 0), 0);
  const totalPaid = records.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
  const totalOutstanding = records
    .filter(r => r.status !== 'settled')
    .reduce((acc, r) => acc + (r.remainingAmount || 0), 0);

  // Filtered List
  const filteredRecords = records.filter(rec => {
    const matchesSearch =
      (rec.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.customerPhone || '').includes(searchQuery);
    
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return rec.status === 'pending' || rec.status === 'partial';
    if (statusFilter === 'settled') return rec.status === 'settled';
    return true;
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>
            <BookOpen size={26} color="#d97706" />
            Customer Khata & Borrow (Udhari) Ledger
          </h2>
          <p>Track daily customer credit, record partial settlements, and recover outstanding cafe balances.</p>
        </div>

        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchBar}
        />
      </div>

      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <h4>₹{totalOutstanding.toLocaleString()}</h4>
            <span>Total Outstanding Dues</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <h4>₹{totalPaid.toLocaleString()}</h4>
            <span>Recovered / Paid Amount</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <BookOpen size={24} />
          </div>
          <div className={styles.statInfo}>
            <h4>₹{totalBorrowed.toLocaleString()}</h4>
            <span>Total Credit Extended</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'pending', 'settled'].map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setStatusFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: statusFilter === f ? '1px solid #d97706' : '1px solid #e2e8f0',
              background: statusFilter === f ? '#d97706' : '#ffffff',
              color: statusFilter === f ? '#ffffff' : '#475569',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {f === 'all' ? 'All Customers' : f === 'pending' ? 'Pending Dues' : 'Fully Settled'}
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
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
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
                filteredRecords.map((rec) => (
                  <tr key={rec._id}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={14} color="#64748b" />
                        {rec.customerName}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: '0.8rem' }}>
                        <Phone size={12} />
                        {rec.customerPhone}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{rec.totalBillAmount}</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>₹{rec.paidAmount}</td>
                    <td style={{ color: rec.remainingAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 800 }}>
                      ₹{rec.remainingAmount}
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${rec.status === 'settled' ? styles.statusSettled : (rec.status === 'partial' ? styles.statusPartial : styles.statusPending)}`}>
                        {rec.status === 'settled' ? 'Settled' : (rec.status === 'partial' ? 'Partial Due' : 'Pending Due')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {rec.remainingAmount > 0 ? (
                        <button
                          type="button"
                          className={styles.settleBtn}
                          onClick={() => handleOpenSettle(rec)}
                        >
                          Settle Dues
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                          ✓ Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                ))
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
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
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
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{selectedRecord.customerName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedRecord.customerPhone}</div>
                <div style={{ marginTop: 8, fontSize: '0.9rem', fontWeight: 800, color: '#dc2626' }}>
                  Current Outstanding Due: ₹{selectedRecord.remainingAmount}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Settlement Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedRecord.remainingAmount}
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
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
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#16a34a', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                >
                  {isSettling ? 'Recording...' : `Confirm Payment (₹${settleAmount})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
