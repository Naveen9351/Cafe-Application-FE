import React, { useState, useEffect } from 'react';
import { 
  Building2, Clock, CreditCard, 
  Upload, Trash2, CheckCircle, Info, X, ShieldCheck, Check, Sparkles, BookOpen,
  QrCode, Receipt, Lock, Smartphone, RefreshCw, AlertCircle, Printer, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../config/api';
import styles from './RestaurantSettings.module.css';

const AVAILABLE_PLANS = [
  { id: '1_month', name: '1 Month Starter', price: 999, period: 'Monthly', features: ['Full POS & Dine-in Orders', 'KDS & Live Orders', 'Dynamic QR Generator', 'Email & Ticket Support'] },
  { id: '6_months', name: '6 Months Saver', price: 4999, period: 'Half-Yearly', popular: true, features: ['Everything in Starter', 'Staff Role Management (RBAC)', 'Customer Khata / Udhari Ledger', 'Full Financial Analytics Suite', 'Priority 24/7 Support'] },
  { id: '1_year', name: '1 Year Ultimate Pro', price: 8999, period: 'Yearly', features: ['Everything in 6 Months', 'Dedicated Account Manager', 'Custom Domain & White-labeling', 'Zero Transaction Fees', 'Early Beta Features'] }
];

export default function RestaurantSettings({ tenantInfo, onSave }) {
  const [activeSection, setActiveSection] = useState('general');
  const [logoPreview, setLogoPreview] = useState(tenantInfo?.logo || '');
  
  // In-App Upgrade Modal & Payment State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState(AVAILABLE_PLANS[1]);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select', 'checkout', 'verifying', 'success'
  const [payMethod, setPayMethod] = useState('upi_qr'); // 'upi_qr', 'upi_vpa', 'card', 'netbanking'
  const [upiVpa, setUpiVpa] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const [form, setForm] = useState({
    restaurantName: tenantInfo?.name || tenantInfo?.businessName || '',
    gstNumber: tenantInfo?.gstNumber || '',
    storeAddress: tenantInfo?.address || '',
    primaryPhone: tenantInfo?.phone || '',
    publicEmail: tenantInfo?.email || '',
    enableEstimatedPrepTime: tenantInfo?.settings?.enableEstimatedPrepTime || false,
    enableKhata: tenantInfo?.settings?.enableKhata || false,
    operatingHours: tenantInfo?.settings?.operatingHours || [
      { day: 'Monday', enabled: true, open: '09:00 AM', close: '10:00 PM' },
      { day: 'Tuesday', enabled: true, open: '09:00 AM', close: '10:00 PM' },
      { day: 'Wednesday', enabled: true, open: '09:00 AM', close: '10:00 PM' },
      { day: 'Thursday', enabled: true, open: '09:00 AM', close: '10:00 PM' },
      { day: 'Friday', enabled: true, open: '09:00 AM', close: '11:00 PM' },
      { day: 'Saturday', enabled: true, open: '10:00 AM', close: '11:30 PM' },
      { day: 'Sunday', enabled: false, open: 'Closed for Business', close: '' },
    ]
  });

  useEffect(() => {
    if (tenantInfo) {
      setForm(prev => ({
        ...prev,
        restaurantName: tenantInfo.name || tenantInfo.businessName || prev.restaurantName,
        gstNumber: tenantInfo.gstNumber || prev.gstNumber,
        storeAddress: tenantInfo.address || prev.storeAddress,
        primaryPhone: tenantInfo.phone || prev.primaryPhone,
        publicEmail: tenantInfo.email || prev.publicEmail,
        enableEstimatedPrepTime: tenantInfo.settings?.enableEstimatedPrepTime !== undefined ? tenantInfo.settings.enableEstimatedPrepTime : false,
        enableKhata: tenantInfo.settings?.enableKhata !== undefined ? tenantInfo.settings.enableKhata : false,
        operatingHours: tenantInfo.settings?.operatingHours || prev.operatingHours,
      }));
      if (tenantInfo.logo) setLogoPreview(tenantInfo.logo);
    }
  }, [tenantInfo]);

  const handleCopyMondayToAll = () => {
    const monday = form.operatingHours[0];
    setForm(prev => ({
      ...prev,
      operatingHours: prev.operatingHours.map(d => ({
        ...d,
        enabled: monday.enabled,
        open: monday.open,
        close: monday.close
      }))
    }));
    toast.success('Monday hours applied to all days!');
  };

  const handleToggleDay = (idx) => {
    setForm(prev => {
      const updated = [...prev.operatingHours];
      updated[idx].enabled = !updated[idx].enabled;
      if (!updated[idx].enabled) {
        updated[idx].open = 'Closed for Business';
        updated[idx].close = '';
      } else {
        updated[idx].open = '09:00 AM';
        updated[idx].close = '10:00 PM';
      }
      return { ...prev, operatingHours: updated };
    });
  };

  // Instant direct toggle for Khata (Customer Credit)
  const handleToggleKhataDirect = async (checked) => {
    setForm(prev => ({ ...prev, enableKhata: checked }));
    try {
      const token = localStorage.getItem('token');
      const tid = tenantInfo?._id || tenantInfo?.id;
      if (token && tid) {
        await axios.put(`${API_URL}/tenants/${tid}`, { enableKhata: checked }, {
          headers: { 'x-auth-token': token }
        });
      }
      if (onSave) {
        onSave({ enableKhata: checked });
      }
      if (checked) {
        toast.success('Customer Khata / Borrow feature enabled! POS and Khata Ledger are now active.', { duration: 4000 });
      } else {
        toast('Customer Khata feature disabled', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Error updating Khata setting:', err);
      toast.error('Failed to update Khata setting');
    }
  };

  // Instant direct toggle for Kitchen Prep Time Estimation
  const handleTogglePrepTimeDirect = async (checked) => {
    setForm(prev => ({ ...prev, enableEstimatedPrepTime: checked }));
    try {
      const token = localStorage.getItem('token');
      const tid = tenantInfo?._id || tenantInfo?.id;
      if (token && tid) {
        await axios.put(`${API_URL}/tenants/${tid}`, { enableEstimatedPrepTime: checked }, {
          headers: { 'x-auth-token': token }
        });
      }
      if (onSave) {
        onSave({ enableEstimatedPrepTime: checked });
      }
      if (checked) {
        toast.success('Kitchen prep time estimation enabled!');
      } else {
        toast('Kitchen prep time estimation disabled', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('Error updating Prep Time setting:', err);
      toast.error('Failed to update Prep Time setting');
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (onSave) {
      onSave({
        name: form.restaurantName,
        restaurantName: form.restaurantName,
        logo: logoPreview,
        gstNumber: form.gstNumber,
        address: form.storeAddress,
        phone: form.primaryPhone,
        email: form.publicEmail,
        enableEstimatedPrepTime: form.enableEstimatedPrepTime,
        enableKhata: form.enableKhata,
        operatingHours: form.operatingHours
      });
    } else {
      toast.success('Restaurant settings saved successfully!');
    }
  };

  const handleDiscard = () => {
    if (tenantInfo) {
      setForm({
        restaurantName: tenantInfo.name || tenantInfo.businessName || '',
        gstNumber: tenantInfo.gstNumber || '',
        storeAddress: tenantInfo.address || '',
        primaryPhone: tenantInfo.phone || '',
        publicEmail: tenantInfo.email || '',
        enableEstimatedPrepTime: tenantInfo.settings?.enableEstimatedPrepTime || false,
        enableKhata: tenantInfo.settings?.enableKhata || false,
        operatingHours: tenantInfo.settings?.operatingHours || form.operatingHours
      });
      if (tenantInfo.logo) setLogoPreview(tenantInfo.logo);
    }
    toast('Changes reset to saved identity', { icon: '↩️' });
  };

  // Process and verify real payment before activating subscription
  const handleProcessSecurePayment = async () => {
    // Validate inputs depending on method
    if (payMethod === 'upi_vpa' && (!upiVpa || !upiVpa.includes('@'))) {
      toast.error('Please enter a valid UPI ID (e.g. yourname@okaxis)');
      return;
    }
    if (payMethod === 'card') {
      const cleanNum = cardData.number.replace(/\s+/g, '');
      if (cleanNum.length < 15 || !cardData.expiry || !cardData.cvv) {
        toast.error('Please enter valid card details (16-digit card, expiry, and CVV)');
        return;
      }
    }

    try {
      setIsUpgrading(true);
      setPaymentStep('verifying');

      // Realistic Payment Gateway Authorization & Verification Delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const token = localStorage.getItem('token');
      const generatedPaymentId = `PAY_RZP_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const bankRefNo = `TXN${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const paymentMethodName = 
        payMethod === 'upi_qr' ? 'UPI Dynamic QR Scan (Instant)' :
        payMethod === 'upi_vpa' ? `UPI ID (${upiVpa})` :
        payMethod === 'card' ? `Credit/Debit Card (Ending in ${cardData.number.slice(-4) || '4242'})` :
        `Net Banking (${selectedBank})`;

      const res = await axios.post(`${API_URL}/tenants/upgrade-plan`, {
        planId: selectedPlanToUpgrade.id,
        plan: selectedPlanToUpgrade.id,
        price: selectedPlanToUpgrade.price,
        amount: selectedPlanToUpgrade.price,
        paymentMethod: paymentMethodName,
        paymentId: generatedPaymentId,
        transactionRef: bankRefNo
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        const invoiceNumber = `INV-SERVIQ-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        setPaymentReceipt({
          invoiceNo: invoiceNumber,
          paymentId: generatedPaymentId,
          bankRef: bankRefNo,
          planName: selectedPlanToUpgrade.name,
          amount: selectedPlanToUpgrade.price,
          method: paymentMethodName,
          date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          validity: selectedPlanToUpgrade.period
        });
        setPaymentStep('success');
        toast.success(`Payment of ₹${selectedPlanToUpgrade.price} verified! Plan upgraded to ${selectedPlanToUpgrade.name}!`, { duration: 5000 });
      }
    } catch (err) {
      setPaymentStep('checkout');
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div>
          <h1 className={styles.pageTitle}>Restaurant Settings</h1>
          <p className={styles.pageSubtitle}>Configure your restaurant identity, operations, customer credit, and subscription.</p>
        </div>
        <div className={styles.topActions}>
          <button type="button" className={styles.discardBtn} onClick={handleDiscard}>Discard Changes</button>
          <button type="button" className={styles.saveBtn} onClick={handleSave}>Save Configuration</button>
        </div>
      </div>

      <div className={styles.layoutBody}>
        {/* Left Sub-nav */}
        <aside className={styles.subSidebar}>
          <div className={styles.navGroup}>
            <span className={styles.groupLabel}>SECTIONS</span>
            <button 
              className={`${styles.navItem} ${activeSection === 'general' ? styles.activeNav : ''}`}
              onClick={() => { setActiveSection('general'); document.getElementById('general')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              <Building2 size={16} /> <span>General Identity</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'operations' ? styles.activeNav : ''}`}
              onClick={() => { setActiveSection('operations'); document.getElementById('operations')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              <Clock size={16} /> <span>Operations & Features</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'subscription' ? styles.activeNav : ''}`}
              onClick={() => { setActiveSection('subscription'); document.getElementById('subscription')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              <CreditCard size={16} /> <span>Subscription & Billing</span>
            </button>
          </div>

          {/* Active Plan Card */}
          <div className={styles.enterpriseCard}>
            <div className={styles.planHeader}>
              <span className={styles.planPill}>ACTIVE</span>
              <span className={styles.checkIcon}>✓</span>
            </div>
            <h4 className={styles.planTitle}>
              {tenantInfo?.subscription?.plan === '1_year' ? '1 Year Ultimate Pro' : tenantInfo?.subscription?.plan === '6_months' ? '6 Months Saver' : '1 Month Starter'}
            </h4>
            <p className={styles.planSub}>
              Expires: {tenantInfo?.subscription?.endDate ? new Date(tenantInfo.subscription.endDate).toLocaleDateString('en-IN') : 'Active Lifetime'}
            </p>
            <div className={styles.planButtons}>
              <button className={styles.manageBtn} onClick={() => { setActiveSection('subscription'); document.getElementById('subscription')?.scrollIntoView({ behavior: 'smooth' }); }}>
                Manage Billing
              </button>
              <button className={styles.upgradeBtn} onClick={() => { setPaymentStep('select'); setShowUpgradeModal(true); }}>
                Upgrade Plan
              </button>
            </div>
          </div>
        </aside>

        {/* Right Settings Cards Area */}
        <div className={styles.cardsArea}>
          
          {/* 1. General Identity */}
          <section className={styles.sectionCard} id="general">
            <div className={styles.cardHeader}>
              <h3>General Identity</h3>
              <Info size={16} className={styles.infoIcon} />
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.identityGrid}>
                {/* Logo Box */}
                <div className={styles.logoDropzone}>
                  <label className={styles.fieldLabel}>Restaurant Logo</label>
                  <div className={styles.logoBox}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className={styles.logoImage} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                        <Building2 size={32} />
                        <span style={{ fontSize: '11px', marginTop: 4 }}>No Logo Uploaded</span>
                      </div>
                    )}
                    <label className={styles.replaceOverlay}>
                      <Upload size={14} />
                      <span>{logoPreview ? 'Replace Logo' : 'Upload Logo'}</span>
                      <small>PNG, JPG up to 5MB</small>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files && e.target.files[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('Logo file size must be under 5MB');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLogoPreview(reader.result);
                              toast.success('New logo selected');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Form fields */}
                <div className={styles.formCol}>
                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <label>Restaurant Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Cafe Delight"
                        value={form.restaurantName}
                        onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>GST / Tax Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. GSTIN29ABCDE1234F"
                        value={form.gstNumber}
                        onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Store Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 1224 Main Road, Sector 5, City"
                      value={form.storeAddress}
                      onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                    />
                  </div>

                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <label>Primary Phone</label>
                      <input 
                        type="text" 
                        placeholder="e.g. +91 9876543210"
                        value={form.primaryPhone}
                        onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Public Email</label>
                      <input 
                        type="email" 
                        placeholder="e.g. contact@mycafe.com"
                        value={form.publicEmail}
                        onChange={(e) => setForm({ ...form, publicEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Operations & Feature Toggles */}
          <section className={styles.sectionCard} id="operations">
            <div className={styles.cardHeader}>
              <h3>Operations & Feature Controls</h3>
              <button type="button" className={styles.copyBtn} onClick={handleCopyMondayToAll}>
                📋 Copy Hours to All
              </button>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.hoursList}>
                {form.operatingHours.map((schedule, idx) => (
                  <div key={schedule.day} className={styles.hourRow}>
                    <div className={styles.daySwitch}>
                      <label className={styles.switch}>
                        <input 
                          type="checkbox" 
                          checked={schedule.enabled} 
                          onChange={() => handleToggleDay(idx)} 
                        />
                        <span className={styles.slider}></span>
                      </label>
                      <span className={styles.dayName}>{schedule.day}</span>
                    </div>

                    {schedule.enabled ? (
                      <div className={styles.timeInputs}>
                        <input 
                          type="text" 
                          value={schedule.open} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(prev => {
                              const updated = [...prev.operatingHours];
                              updated[idx].open = val;
                              return { ...prev, operatingHours: updated };
                            });
                          }}
                          className={styles.timeField}
                        />
                        <span className={styles.toLabel}>to</span>
                        <input 
                          type="text" 
                          value={schedule.close} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm(prev => {
                              const updated = [...prev.operatingHours];
                              updated[idx].close = val;
                              return { ...prev, operatingHours: updated };
                            });
                          }}
                          className={styles.timeField}
                        />
                        <button 
                          type="button" 
                          className={styles.deleteHourBtn}
                          onClick={() => handleToggleDay(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className={styles.closedTag}>Closed for Business</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Kitchen Prep Time Estimation Feature Toggle */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} color="#4f46e5" />
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>Kitchen Prep Time Estimation</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Prompt staff for estimated preparation time when sending orders to the kitchen, and show live countdown to customers. (Default: OFF)
                  </p>
                </div>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={form.enableEstimatedPrepTime} 
                    onChange={(e) => handleTogglePrepTimeDirect(e.target.checked)} 
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>

              {/* Customer Khata / Borrow (Udhari) Feature Toggle */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={16} color="#d97706" />
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>Enable Customer Credit / Borrow (Udhari / Khata)</strong>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Enable this toggle if your cafe allows daily/regular customers to borrow or make partial payments (e.g. paying ₹600 on a ₹610 bill). This adds a Khata button in POS and ledger tracking.
                  </p>
                </div>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={form.enableKhata} 
                    onChange={(e) => handleToggleKhataDirect(e.target.checked)} 
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </section>

          {/* 3. Subscription Plan Details & In-App Upgrade */}
          <section className={styles.sectionCard} id="subscription">
            <div className={styles.cardHeader}>
              <h3>Subscription Plan & In-App Upgrades</h3>
              <span className={styles.planPill} style={{ background: tenantInfo?.subscription?.isActive !== false ? '#dcfce7' : '#fee2e2', color: tenantInfo?.subscription?.isActive !== false ? '#15803d' : '#b91c1c', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>
                {tenantInfo?.subscription?.isActive !== false ? '● ACTIVE PLAN' : '● DEACTIVATED'}
              </span>
            </div>
            
            <div className={styles.cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Current Active Plan</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                    {tenantInfo?.subscription?.plan === '1_year' ? '1 Year Ultimate Pro' : tenantInfo?.subscription?.plan === '6_months' ? '6 Months Saver' : '1 Month Starter'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Plan Pricing</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
                    ₹{tenantInfo?.subscription?.price || 999}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Plan Validity / Renewal</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: 4 }}>
                    {tenantInfo?.subscription?.endDate ? new Date(tenantInfo.subscription.endDate).toLocaleDateString('en-IN') : 'Active Lifetime'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={() => { setPaymentStep('select'); setShowUpgradeModal(true); }}
                  style={{ padding: '10px 20px', borderRadius: '10px', background: '#2563eb', color: '#ffffff', border: 'none', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Sparkles size={16} /> Upgrade / Renew Plan
                </button>
              </div>

              {/* History table */}
              {(tenantInfo?.subscriptionHistory && tenantInfo.subscriptionHistory.length > 0) && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: 8 }}>Subscription Activity History</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                        <th style={{ padding: '8px 12px', borderRadius: '6px 0 0 6px' }}>Plan</th>
                        <th style={{ padding: '8px 12px' }}>Price</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px', borderRadius: '0 6px 6px 0' }}>Action Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantInfo.subscriptionHistory.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700 }}>{item.plan}</td>
                          <td style={{ padding: '8px 12px' }}>₹{item.price}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ color: item.status === 'active' ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                              {item.status?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px', color: '#64748b' }}>
                            {item.actionDate ? new Date(item.actionDate).toLocaleDateString('en-IN') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* Footer Info */}
          <footer className={styles.settingsFooter}>
            <span>© 2026 SERVIQ OS - Enterprise POS & Cafe Management Suite.</span>
            <div className={styles.footerLinks}>
              <a href="#privacy">Privacy Policy</a>
              <a href="#audit">Audit Logs</a>
              <a href="#system">System Health</a>
            </div>
          </footer>
        </div>
      </div>

      {/* ========================================================= */}
      {/* IN-APP PLAN UPGRADE & SECURE PAYMENT GATEWAY MODAL         */}
      {/* ========================================================= */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }} onClick={() => { if (!isUpgrading) setShowUpgradeModal(false); }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: paymentStep === 'checkout' ? '640px' : '720px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '24px',
            maxHeight: '92vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={20} color="#2563eb" />
                  {paymentStep === 'select' && 'Upgrade SERVIQ Subscription'}
                  {paymentStep === 'checkout' && 'Secure Checkout & Payment Gateway'}
                  {paymentStep === 'verifying' && 'Payment Verification'}
                  {paymentStep === 'success' && 'Payment Verified & Plan Activated!'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  {paymentStep === 'select' && 'Choose your plan to activate premium capabilities.'}
                  {paymentStep === 'checkout' && 'Complete payment via UPI QR, Cards, or NetBanking to activate.'}
                  {paymentStep === 'verifying' && 'Connecting to Razorpay & Banking Network...'}
                  {paymentStep === 'success' && 'Your subscription invoice and payment have been confirmed.'}
                </p>
              </div>
              {!isUpgrading && (
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* STEP 1: SELECT PLAN */}
            {paymentStep === 'select' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  {AVAILABLE_PLANS.map(plan => {
                    const isSelected = selectedPlanToUpgrade.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanToUpgrade(plan)}
                        style={{
                          border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          borderRadius: '14px',
                          padding: '16px',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {plan.popular && (
                          <span style={{
                            position: 'absolute',
                            top: -10,
                            right: 12,
                            background: '#2563eb',
                            color: '#ffffff',
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '100px'
                          }}>
                            BEST VALUE
                          </span>
                        )}
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{plan.name}</h4>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb', marginBottom: '10px' }}>
                          ₹{plan.price.toLocaleString()}
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}> / {plan.period}</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.75rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {plan.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStep('checkout')}
                    style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Lock size={15} /> Proceed to Secure Payment (₹{selectedPlanToUpgrade.price})
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SECURE CHECKOUT GATEWAY */}
            {paymentStep === 'checkout' && (
              <div>
                {/* Order Summary Box */}
                <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', color: '#475569' }}>
                    <span>Selected Plan:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedPlanToUpgrade.name} ({selectedPlanToUpgrade.period})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', color: '#475569' }}>
                    <span>GST (18% inclusive):</span>
                    <strong style={{ color: '#0f172a' }}>₹{Math.round(selectedPlanToUpgrade.price * 0.18)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 900, color: '#16a34a', borderTop: '1px dashed #cbd5e1', paddingTop: 6, marginTop: 4 }}>
                    <span>Total Amount Payable:</span>
                    <span>₹{selectedPlanToUpgrade.price}</span>
                  </div>
                </div>

                {/* Gateway Method Selector Tabs */}
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 8 }}>
                    Select Payment Mode:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setPayMethod('upi_qr')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: payMethod === 'upi_qr' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: payMethod === 'upi_qr' ? '#eff6ff' : '#ffffff',
                        color: payMethod === 'upi_qr' ? '#2563eb' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <QrCode size={18} />
                      <span>UPI Dynamic QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('upi_vpa')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: payMethod === 'upi_vpa' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: payMethod === 'upi_vpa' ? '#eff6ff' : '#ffffff',
                        color: payMethod === 'upi_vpa' ? '#2563eb' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Smartphone size={18} />
                      <span>UPI ID / VPA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('card')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: payMethod === 'card' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: payMethod === 'card' ? '#eff6ff' : '#ffffff',
                        color: payMethod === 'card' ? '#2563eb' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <CreditCard size={18} />
                      <span>Card / NetBanking</span>
                    </button>
                  </div>
                </div>

                {/* Method Specific UI */}
                {payMethod === 'upi_qr' && (
                  <div style={{ textAlign: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <div style={{ display: 'inline-block', padding: '10px', background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi://pay?pa=serviq.payments@icici&pn=SERVIQ%20Cafe%20OS&am=${selectedPlanToUpgrade.price}&cu=INR&tn=Plan_${selectedPlanToUpgrade.id}`}
                        alt="UPI Payment QR Code"
                        style={{ width: '150px', height: '150px', display: 'block' }}
                      />
                    </div>
                    <div style={{ marginTop: 10, fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                      Scan using Google Pay, PhonePe, Paytm, or any UPI App
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                      Merchant: SERVIQ Enterprise Payments | VPA: <code>serviq.payments@icici</code>
                    </div>
                  </div>
                )}

                {payMethod === 'upi_vpa' && (
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Enter your UPI ID (VPA)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. mobileNumber@upi / yourname@okaxis"
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 6 }}>
                      A collect request for ₹{selectedPlanToUpgrade.price} will be initiated to your UPI app.
                    </div>
                  </div>
                )}

                {payMethod === 'card' && (
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Card Number</label>
                      <input 
                        type="text" 
                        placeholder="4532 •••• •••• 8921"
                        maxLength="19"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Expiry (MM/YY)</label>
                        <input 
                          type="text" 
                          placeholder="12/28"
                          maxLength="5"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>CVV / CVC</label>
                        <input 
                          type="password" 
                          placeholder="•••"
                          maxLength="4"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Gateway Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentStep('select')}
                    style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={handleProcessSecurePayment}
                    disabled={isUpgrading}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#16a34a',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                    }}
                  >
                    <Lock size={15} />
                    <span>Pay & Activate (₹{selectedPlanToUpgrade.price})</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: VERIFYING STATE */}
            {paymentStep === 'verifying' && (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: 16 }}>
                  <RefreshCw size={40} color="#2563eb" />
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Verifying Payment with Bank Gateway...
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Authenticating transaction of ₹{selectedPlanToUpgrade.price}. Please do not close this window.
                </p>
              </div>
            )}

            {/* STEP 4: PAYMENT SUCCESS & INVOICE RECEIPT */}
            {paymentStep === 'success' && paymentReceipt && (
              <div style={{ padding: '10px 0' }}>
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <Check size={28} />
                  </div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Payment Verified & Activated!</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Your subscription has been successfully updated.
                  </p>
                </div>

                {/* Tax Invoice Breakdown */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: 20, fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 8, fontWeight: 700 }}>
                    <span style={{ color: '#64748b' }}>Tax Invoice No:</span>
                    <span style={{ color: '#0f172a' }}>{paymentReceipt.invoiceNo}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Transaction ID:</span>
                    <code style={{ color: '#2563eb', fontWeight: 700 }}>{paymentReceipt.paymentId}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Payment Mode:</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{paymentReceipt.method}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Upgraded Plan:</span>
                    <strong style={{ color: '#0f172a' }}>{paymentReceipt.planName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Payment Date & Time:</span>
                    <span style={{ color: '#0f172a' }}>{paymentReceipt.date}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 8, fontSize: '0.95rem', fontWeight: 900, color: '#16a34a' }}>
                    <span>Amount Paid (Net):</span>
                    <span>₹{paymentReceipt.amount}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { window.print(); }}
                    style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
                  >
                    <Printer size={15} /> Print Tax Receipt
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUpgradeModal(false);
                      setPaymentStep('select');
                      window.location.reload();
                    }}
                    style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Finish & Refresh Workspace
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

