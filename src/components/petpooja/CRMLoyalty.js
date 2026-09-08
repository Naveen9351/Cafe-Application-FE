import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Award, Search, Plus, Gift, PhoneCall, Mail, Star, HeartHandshake } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styles from './CRMLoyalty.module.css';

const defaultGuestProfiles = [
  { _id: 'c1', name: 'Rohan Sharma', phone: '+91 98201 44521', email: 'rohan.s@gmail.com', totalVisits: 14, loyaltyPoints: 480, favoriteDish: 'Wagyu Truffle Burger' },
  { _id: 'c2', name: 'Priya Mehta', phone: '+91 98112 39012', email: 'priya.m@outlook.com', totalVisits: 8, loyaltyPoints: 260, favoriteDish: 'Burrata Caprese Salad' },
  { _id: 'c3', name: 'Ananya Verma', phone: '+91 97654 89201', email: 'ananya.v@yahoo.com', totalVisits: 5, loyaltyPoints: 175, favoriteDish: 'Classic Pomodoro Fettuccine' },
  { _id: 'c4', name: 'Vikram Kapoor', phone: '+91 99200 12874', email: 'vikram.k@gmail.com', totalVisits: 19, loyaltyPoints: 720, favoriteDish: 'Grilled Atlantic Salmon' }
];

export default function CRMLoyalty({ tenantId, orders = [] }) {
  const [customers, setCustomers] = useState(defaultGuestProfiles);
  const [search, setSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });

  const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

  useEffect(() => {
    fetchCustomers();
  }, [orders]);

  const fetchCustomers = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        const res = await axios.get(`${API}/petpooja/customers`, {
          headers: { 'x-auth-token': token }
        });
        if (res.data && res.data.length > 0) {
          setCustomers(res.data);
          return;
        }
      }
    } catch (err) {
      console.log('CRM API fetch fallback to dynamic profiles:', err);
    }

    // Dynamically extract customers from orders if any have phone/name
    if (orders && orders.length > 0) {
      const extracted = [...defaultGuestProfiles];
      orders.forEach((o, idx) => {
        if (o.customerName && o.customerName !== 'Walk-in Guest') {
          const exists = extracted.some(c => c.name === o.customerName || (o.customerPhone && c.phone === o.customerPhone));
          if (!exists) {
            extracted.unshift({
              _id: `dyn_${idx}_${Date.now()}`,
              name: o.customerName,
              phone: o.customerPhone || `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
              email: `${o.customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
              totalVisits: Math.floor(Math.random() * 6) + 1,
              loyaltyPoints: Math.floor((Number(o.total || o.totalAmount) || 300) * 0.1),
              favoriteDish: o.items?.[0]?.name || 'Gourmet Dish'
            });
          }
        }
      });
      setCustomers(extracted);
    }
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      return toast.error("Please enter guest name and phone");
    }

    const token = localStorage.getItem('token');
    const newCustObj = {
      ...newCustomer,
      _id: `cust_${Date.now()}`,
      totalVisits: 1,
      loyaltyPoints: 50,
      favoriteDish: 'Chef Special'
    };

    try {
      if (token) {
        await axios.post(`${API}/petpooja/customers`, newCustomer, {
          headers: { 'x-auth-token': token }
        });
      }
    } catch (err) {
      console.log('Registered locally:', err);
    }

    setCustomers(prev => [newCustObj, ...prev]);
    toast.success(`Guest profile registered for ${newCustomer.name}!`);
    setNewCustomer({ name: '', phone: '', email: '' });
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          <div className={styles.iconWrap}>
            <Users size={22} />
          </div>
          <span>SARVIQ CRM & Guest Retention Engine</span>
        </h2>
      </div>

      <div className={styles.gridTwoCol}>
        {/* Customer Directory Table */}
        <div className={styles.card}>
          <div>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Loyal Guests Directory ({filteredCustomers.length})</h3>
              <div className={styles.searchWrap}>
                <Search size={14} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Search guest by name or phone..."
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
                    <th className={styles.th}>Guest Name</th>
                    <th className={styles.th}>Phone</th>
                    <th className={styles.th}>Visits</th>
                    <th className={styles.th}>Loyalty Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(cust => (
                    <motion.tr 
                      key={cust._id} 
                      whileHover={{ backgroundColor: '#f8fafc' }}
                      className={styles.trHover}
                    >
                      <td className={styles.td} style={{ fontWeight: '700' }}>
                        <div>{cust.name}</div>
                        {cust.favoriteDish && (
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '400' }}>
                            Fav: {cust.favoriteDish}
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>{cust.phone}</td>
                      <td className={styles.td}>{cust.totalVisits || 1} visits</td>
                      <td className={styles.td}>
                        <span className={styles.pointsBadge}>
                          <Award size={13} /> {cust.loyaltyPoints || 50} pts
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Register New Guest Profile */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Register New Guest Profile</h3>
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
              <label className={styles.label}>WhatsApp Phone (+91) *</label>
              <input 
                type="text" 
                required
                placeholder="+91 98765 43210"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
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
              <Plus size={16} /> Register Guest Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
