import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Award, Search, Plus, PhoneCall, Mail, Star, 
  CheckCircle2, XCircle, Calendar, ArrowUpDown, Filter, 
  Receipt, Clock, ChevronRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CRMLoyalty.module.css';
import { API_URL as API } from '../../config/api';

export default function CRMLoyalty({ tenantId, orders = [] }) {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all'); // 'all', 'verified', 'unverified'
  const [tierFilter, setTierFilter] = useState('all'); // 'all', 'vip', 'regular', 'new'
  const [sortBy, setSortBy] = useState('highest_spend'); // 'highest_spend', 'recent_visit', 'total_visits'
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    fetchCustomers();
  }, [orders]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      if (token) {
        const res = await axios.get(`${API}/petpooja/customers`, {
          headers: { 'x-auth-token': token }
        });
        if (res.data && Array.isArray(res.data)) {
          setCustomers(res.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log('CRM API fetch error, deriving from active orders:', err);
    }

    // Derive from actual orders if API fails or backend returns empty
    if (orders && orders.length > 0) {
      const custMap = new Map();
      orders.forEach((o) => {
        const phone = o.customerPhone || o.customerDetails?.phone;
        const name = o.customerName || o.customerDetails?.name || 'Guest Diner';
        if (phone || (name && name !== 'Walk-in Guest')) {
          const key = phone || name;
          const orderTotal = Number(o.settledAmount || o.finalAmount || o.totalAmount || o.total || 0);
          const orderDate = new Date(o.createdAt || Date.now());

          if (!custMap.has(key)) {
            custMap.set(key, {
              _id: `cust_${key.replace(/\D/g, '') || Date.now()}`,
              name: name,
              phone: phone || 'Not Provided',
              email: o.customerDetails?.email || '',
              isPhoneVerified: Boolean(o.isPhoneVerified || o.customerDetails?.isPhoneVerified),
              firstVisit: orderDate,
              lastVisit: orderDate,
              totalVisits: 1,
              lifetimeSpend: orderTotal,
              aov: orderTotal,
              orders: [o]
            });
          } else {
            const existing = custMap.get(key);
            existing.totalVisits += 1;
            existing.lifetimeSpend += orderTotal;
            existing.aov = Math.round(existing.lifetimeSpend / existing.totalVisits);
            if (orderDate < new Date(existing.firstVisit)) existing.firstVisit = orderDate;
            if (orderDate > new Date(existing.lastVisit)) existing.lastVisit = orderDate;
            if (o.isPhoneVerified || o.customerDetails?.isPhoneVerified) existing.isPhoneVerified = true;
            existing.orders.push(o);
          }
        }
      });

      const derived = Array.from(custMap.values()).map(c => ({
        ...c,
        tier: c.lifetimeSpend >= 2500 ? 'VIP' : c.totalVisits >= 3 ? 'Regular' : 'New'
      }));
      setCustomers(derived);
    } else {
      setCustomers([]);
    }
    setIsLoading(false);
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      return toast.error("Please enter guest name and phone number");
    }

    const cleanPhone = newCustomer.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return toast.error("Please enter a valid 10-digit phone number");
    }

    const token = localStorage.getItem('token');
    const newCustObj = {
      ...newCustomer,
      _id: `cust_${Date.now()}`,
      isPhoneVerified: true,
      firstVisit: new Date(),
      lastVisit: new Date(),
      totalVisits: 1,
      lifetimeSpend: 0,
      aov: 0,
      tier: 'New',
      orders: []
    };

    try {
      if (token) {
        await axios.post(`${API}/petpooja/customers`, newCustomer, {
          headers: { 'x-auth-token': token }
        });
      }
    } catch (err) {
      console.log('Customer registered locally:', err);
    }

    setCustomers(prev => [newCustObj, ...prev]);
    toast.success(`Guest profile registered for ${newCustomer.name}!`);
    setNewCustomer({ name: '', phone: '', email: '' });
  };

  // Filtering & Sorting
  const filteredCustomers = customers
    .filter(c => {
      const matchesName = (c.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesPhone = phoneSearch ? (c.phone || '').includes(phoneSearch) : true;
      
      let matchesVerification = true;
      if (verificationFilter === 'verified') matchesVerification = Boolean(c.isPhoneVerified);
      if (verificationFilter === 'unverified') matchesVerification = !Boolean(c.isPhoneVerified);

      let matchesTier = true;
      if (tierFilter !== 'all') {
        matchesTier = (c.tier || '').toLowerCase() === tierFilter.toLowerCase();
      }

      return matchesName && matchesPhone && matchesVerification && matchesTier;
    })
    .sort((a, b) => {
      if (sortBy === 'highest_spend') {
        return (b.lifetimeSpend || 0) - (a.lifetimeSpend || 0);
      }
      if (sortBy === 'recent_visit') {
        return new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0);
      }
      if (sortBy === 'total_visits') {
        return (b.totalVisits || 0) - (a.totalVisits || 0);
      }
      return 0;
    });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>
            <div className={styles.iconWrap}>
              <Users size={22} />
            </div>
            <span>ServiQ Customer Directory & CRM</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Live profile directory generated directly from actual customer orders and visit records.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        backgroundColor: '#ffffff',
        padding: '1rem',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {/* Name Search */}
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Phone Search */}
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <PhoneCall size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by mobile number..."
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.55rem 0.75rem 0.55rem 2.2rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Verification Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Verification:</span>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              backgroundColor: '#f8fafc',
              outline: 'none'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>

        {/* Tier Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Tier:</span>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              backgroundColor: '#f8fafc',
              outline: 'none'
            }}
          >
            <option value="all">All Tiers</option>
            <option value="vip">VIP Only</option>
            <option value="regular">Regular</option>
            <option value="new">New</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b' }}>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              backgroundColor: '#f8fafc',
              outline: 'none',
              fontWeight: '600'
            }}
          >
            <option value="highest_spend">Highest Lifetime Spend</option>
            <option value="recent_visit">Most Recent Visit</option>
            <option value="total_visits">Total Visits</option>
          </select>
        </div>
      </div>

      <div className={styles.gridTwoCol}>
        {/* Customer Directory Table */}
        <div className={styles.card} style={{ flex: 1 }}>
          <div>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                Customer Profiles ({filteredCustomers.length})
              </h3>
            </div>

            <div className={styles.tableWrapper} style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th className={styles.th} style={{ padding: '0.75rem' }}>Full Name</th>
                    <th className={styles.th} style={{ padding: '0.75rem' }}>Mobile Number</th>
                    <th className={styles.th} style={{ padding: '0.75rem' }}>Status</th>
                    <th className={styles.th} style={{ padding: '0.75rem' }}>First Visit</th>
                    <th className={styles.th} style={{ padding: '0.75rem' }}>Last Visit</th>
                    <th className={styles.th} style={{ padding: '0.75rem' }}>Total Visits</th>
                    <th className={styles.th} style={{ padding: '0.75rem' }}>Lifetime Spend</th>
                    <th className={styles.th} style={{ padding: '0.75rem' }}>AOV</th>
                    <th className={styles.th} style={{ padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        No customer profiles match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(cust => (
                      <motion.tr 
                        key={cust._id || cust.phone} 
                        whileHover={{ backgroundColor: '#f8fafc' }}
                        className={styles.trHover}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                      >
                        <td className={styles.td} style={{ padding: '0.75rem', fontWeight: '800', color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{cust.name}</span>
                            {cust.tier === 'VIP' && (
                              <span style={{ fontSize: '0.65rem', backgroundColor: '#fef08a', color: '#854d0e', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                VIP
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={styles.td} style={{ padding: '0.75rem', color: '#334155', fontWeight: '600' }}>
                          {cust.phone}
                        </td>
                        <td className={styles.td} style={{ padding: '0.75rem' }}>
                          {cust.isPhoneVerified ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: '800' }}>
                              <CheckCircle2 size={12} /> Verified
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', backgroundColor: '#fee2e2', padding: '3px 8px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: '800' }}>
                              <XCircle size={12} /> Unverified
                            </span>
                          )}
                        </td>
                        <td className={styles.td} style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                          {formatDate(cust.firstVisit)}
                        </td>
                        <td className={styles.td} style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                          {formatDate(cust.lastVisit)}
                        </td>
                        <td className={styles.td} style={{ padding: '0.75rem', fontWeight: '800', textAlign: 'center' }}>
                          {cust.totalVisits || 1}
                        </td>
                        <td className={styles.td} style={{ padding: '0.75rem', fontWeight: '900', color: '#e05c5c' }}>
                          ₹{cust.lifetimeSpend || 0}
                        </td>
                        <td className={styles.td} style={{ padding: '0.75rem', fontWeight: '700', color: '#0f172a' }}>
                          ₹{cust.aov || 0}
                        </td>
                        <td className={styles.td} style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            style={{
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              color: '#334155'
                            }}
                          >
                            View Orders
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Register New Guest Profile Form */}
        <div className={styles.card} style={{ alignSelf: 'flex-start' }}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Add Customer Record</h3>
          </div>

          <form onSubmit={handleRegisterCustomer} className={styles.formStack}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Rahul Kapoor"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Mobile Number (10 Digits) *</label>
              <input 
                type="tel" 
                required
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value.replace(/\D/g, '') })}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address (Optional)</label>
              <input 
                type="email" 
                placeholder="rahul@domain.com"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                className={styles.input}
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              <Plus size={16} /> Register Profile
            </button>
          </form>
        </div>
      </div>

      {/* Customer Orders Breakdown Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                maxWidth: '650px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                padding: '1.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                    {selectedCustomer.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                    <span>📞 {selectedCustomer.phone}</span>
                    <span>•</span>
                    <span>{selectedCustomer.isPhoneVerified ? '✅ Phone Verified' : '❌ Unverified'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Metrics Summary Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>TOTAL VISITS</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>{selectedCustomer.totalVisits}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>LIFETIME SPEND</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#e05c5c' }}>₹{selectedCustomer.lifetimeSpend}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>AVG ORDER VALUE</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>₹{selectedCustomer.aov}</div>
                </div>
              </div>

              {/* Order History List */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.75rem' }}>
                Order History ({selectedCustomer.orders?.length || 0})
              </h4>

              {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No past order records found for this guest.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedCustomer.orders.map((ord, idx) => (
                    <div
                      key={ord._id || idx}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div>
                          <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a' }}>
                            Order #{ord.orderNumber || ord._id?.slice(-6) || idx + 1}
                          </span>
                          <span style={{ marginLeft: '8px', fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            Table {ord.tableNumber || 'Takeaway'}
                          </span>
                        </div>
                        <span style={{ fontWeight: '900', color: '#e05c5c', fontSize: '0.95rem' }}>
                          ₹{ord.settledAmount || ord.finalAmount || ord.totalAmount || ord.total || 0}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        {formatDate(ord.createdAt)} • Status: <strong style={{ textTransform: 'capitalize' }}>{ord.status || 'completed'}</strong>
                      </div>

                      {/* Items list */}
                      {ord.items && ord.items.length > 0 && (
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem' }}>
                          {ord.items.map((it, itIdx) => (
                            <div key={itIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>{it.quantity}x {it.name || it.item?.name}</span>
                              <span style={{ fontWeight: '700' }}>₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
