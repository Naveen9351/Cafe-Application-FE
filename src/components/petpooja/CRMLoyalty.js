import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Award, Search, Plus, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './CRMLoyalty.module.css';

export default function CRMLoyalty({ tenantId }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API}/petpooja/customers`, {
        headers: { 'x-auth-token': token }
      });
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Error loading CRM customer directory");
    }
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/petpooja/customers`, newCustomer, {
        headers: { 'x-auth-token': token }
      });
      toast.success("Customer Profile Registered!");
      setNewCustomer({ name: '', phone: '', email: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to register customer");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          <div className={styles.iconWrap}>
            <Users size={22} />
          </div>
          <span>CRM & Loyalty Engine</span>
        </h2>
      </div>

      <div className={styles.gridTwoCol}>
        {/* Customer Directory Table */}
        <div className={styles.card}>
          <div>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Loyal Customers Directory</h3>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search name/phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Customer Name</th>
                    <th className={styles.th}>Phone</th>
                    <th className={styles.th}>Total Visits</th>
                    <th className={styles.th}>Loyalty Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(cust => (
                    <tr key={cust._id} className={styles.trHover}>
                      <td className={styles.td} style={{ fontWeight: '700' }}>{cust.name}</td>
                      <td className={styles.td}>{cust.phone}</td>
                      <td className={styles.td}>{cust.totalVisits || 1} visits</td>
                      <td className={styles.td}>
                        <span className={styles.pointsBadge}>
                          <Award size={13} /> {cust.loyaltyPoints} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem 0', color: '#8c7d70' }}>
                        No customer profiles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Register Customer Form */}
        <div className={styles.card}>
          <div>
            <h3 className={styles.cardTitle} style={{ marginBottom: '1.25rem' }}>
              <Plus size={18} color="#c67c4e" /> Register Profile
            </h3>

            <form onSubmit={handleRegisterCustomer}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 9876543210"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address (Optional)</label>
                <input 
                  type="email" 
                  placeholder="rahul@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className={styles.input}
                />
              </div>

              <button className={styles.submitBtn}>
                Save Customer Profile
              </button>
            </form>
          </div>

          <div className={styles.infoBanner}>
            <Gift size={24} color="#c67c4e" style={{ flexShrink: 0 }} />
            <p className={styles.infoText}>
              Customers automatically earn <strong>1 Loyalty Point per ₹100 spent</strong> during POS Checkout! Points can be redeemed on future visits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
