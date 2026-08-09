import React, { useState } from 'react';
import axios from 'axios';
import { Share2, Smartphone, Send, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './OnlineAggregators.module.css';

export default function OnlineAggregators({ tenantId }) {
  const [platform, setPlatform] = useState('Zomato');
  const [itemName, setItemName] = useState('');
  const [qty, setQty] = useState(1);
  const [custName, setCustName] = useState('Mock Customer');
  const [custPhone, setCustPhone] = useState('9876543210');

  const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

  const triggerMockOrder = async () => {
    if (!itemName) return toast.error("Enter food item name");
    const token = localStorage.getItem('token');
    
    const payload = {
      platform,
      customerName: custName,
      customerPhone: custPhone,
      items: [
        { name: itemName, quantity: qty }
      ]
    };

    try {
      await axios.post(`${API}/petpooja/aggregator-webhook-mock`, payload, {
        headers: { 'x-auth-token': token }
      });
      toast.success(`Simulated Swiggy/Zomato order incoming! Check your KOT screen.`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error triggering mock order");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Aggregators Simulator (Swiggy / Zomato)</h2>
        <p className={styles.titleDesc}>Simulate and test incoming food delivery aggregator orders.</p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Webhook Emulator</h3>
        <p className={styles.subtitle}>
          This portal simulates the Petpooja aggregator API. Clicking Simulate Order sends a webhook payload to the backend server, placing an online order and notifying the restaurant in real-time.
        </p>

        <div className={styles.formGrid}>
          <div>
            <label className={styles.label}>Select Platform</label>
            <div className={styles.platformContainer}>
              <button 
                type="button" 
                onClick={() => setPlatform('Zomato')}
                className={`${styles.platformBtn} ${platform === 'Zomato' ? styles.platformBtnActive : ''}`}
              >
                Zomato
              </button>
              <button 
                type="button" 
                onClick={() => setPlatform('Swiggy')}
                className={`${styles.platformBtn} ${platform === 'Swiggy' ? styles.platformBtnActive : ''}`}
              >
                Swiggy
              </button>
            </div>
          </div>

          <div>
            <label className={styles.label}>
              Dish Name
              <span className={styles.labelNote}>(Must match Menu Item exactly for stock deduction)</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. Chai, Burger, Pizza"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.inputRow}>
            <div>
              <label className={styles.label}>Qty</label>
              <input 
                type="number" 
                min="1"
                value={qty}
                onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                className={styles.input}
                style={{ textAlign: 'center', fontWeight: '700' }}
              />
            </div>
            <div>
              <label className={styles.label}>Customer Name</label>
              <input 
                type="text" 
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Customer Phone</label>
              <input 
                type="text" 
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <button onClick={triggerMockOrder} className={styles.submitBtn}>
            <Send size={16} />
            <span>Simulate Incoming Webhook Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}
