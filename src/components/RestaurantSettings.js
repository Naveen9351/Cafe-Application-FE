import React, { useState, useEffect } from 'react';
import { 
  Building2, Clock, CreditCard, 
  Upload, Trash2, CheckCircle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './RestaurantSettings.module.css';

export default function RestaurantSettings({ tenantInfo, onSave }) {
  const [activeSection, setActiveSection] = useState('general');
  const [logoPreview, setLogoPreview] = useState(tenantInfo?.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200');
  
  const [form, setForm] = useState({
    restaurantName: tenantInfo?.name || tenantInfo?.businessName || 'Deepak\'s Cafe & Bistro',
    gstNumber: tenantInfo?.gstNumber || 'GSTIN29ABCDE1234F',
    storeAddress: tenantInfo?.address || '1224 Culinary Heights, Bangalore, India',
    primaryPhone: tenantInfo?.phone || '+91 96801 32562',
    publicEmail: tenantInfo?.email || 'contact@serviq.ai',
    enableEstimatedPrepTime: tenantInfo?.settings?.enableEstimatedPrepTime || false,
    operatingHours: [
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
        operatingHours: form.operatingHours
      });
    } else {
      toast.success('Restaurant settings saved successfully!');
    }
  };

  const handleDiscard = () => {
    if (tenantInfo) {
      setForm({
        restaurantName: tenantInfo.name || tenantInfo.businessName || 'Deepak\'s Cafe & Bistro',
        gstNumber: tenantInfo.gstNumber || 'GSTIN29ABCDE1234F',
        storeAddress: tenantInfo.address || '1224 Culinary Heights, Bangalore',
        primaryPhone: tenantInfo.phone || '+91 96801 32562',
        publicEmail: tenantInfo.email || 'contact@serviq.ai',
        operatingHours: tenantInfo.settings?.operatingHours || form.operatingHours
      });
      if (tenantInfo.logo) setLogoPreview(tenantInfo.logo);
    }
    toast('Changes reset to saved identity', { icon: '↩️' });
  };

  return (
    <div className={styles.settingsContainer}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div>
          <h1 className={styles.pageTitle}>Restaurant Settings</h1>
          <p className={styles.pageSubtitle}>Configure your restaurant identity, operations, and subscription.</p>
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
              <Clock size={16} /> <span>Operations</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'subscription' ? styles.activeNav : ''}`}
              onClick={() => { setActiveSection('subscription'); document.getElementById('subscription')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              <CreditCard size={16} /> <span>Subscription</span>
            </button>
          </div>

          {/* Pro Enterprise Card */}
          <div className={styles.enterpriseCard}>
            <div className={styles.planHeader}>
              <span className={styles.planPill}>ACTIVE</span>
              <span className={styles.checkIcon}>✓</span>
            </div>
            <h4 className={styles.planTitle}>Pro Enterprise</h4>
            <p className={styles.planSub}>Next billing: Oct 24, 2026</p>
            <div className={styles.planButtons}>
              <button className={styles.manageBtn}>Manage Billing</button>
              <button className={styles.upgradeBtn}>Upgrade Plan</button>
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
                    <img src={logoPreview} alt="Logo" className={styles.logoImage} />
                    <label className={styles.replaceOverlay}>
                      <Upload size={14} />
                      <span>Replace Logo</span>
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
                        value={form.restaurantName}
                        onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>GST / Tax Number</label>
                      <input 
                        type="text" 
                        value={form.gstNumber}
                        onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Store Address</label>
                    <input 
                      type="text" 
                      value={form.storeAddress}
                      onChange={(e) => setForm({ ...form, storeAddress: e.target.value })}
                    />
                  </div>

                  <div className={styles.inputRow}>
                    <div className={styles.inputGroup}>
                      <label>Primary Phone</label>
                      <input 
                        type="text" 
                        value={form.primaryPhone}
                        onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Public Email</label>
                      <input 
                        type="email" 
                        value={form.publicEmail}
                        onChange={(e) => setForm({ ...form, publicEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Operating Hours */}
          <section className={styles.sectionCard} id="operations">
            <div className={styles.cardHeader}>
              <h3>Operating Hours</h3>
              <button type="button" className={styles.copyBtn} onClick={handleCopyMondayToAll}>
                📋 Copy to All
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
                    Prompt staff for estimated preparation time (e.g. 15 mins) when sending orders to the kitchen, and show a live countdown to customers. (Default: OFF)
                  </p>
                </div>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={form.enableEstimatedPrepTime} 
                    onChange={(e) => setForm({ ...form, enableEstimatedPrepTime: e.target.checked })} 
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </section>

          {/* 3. Subscription Plan Details & History */}
          <section className={styles.sectionCard} id="subscription">
            <div className={styles.cardHeader}>
              <h3>Subscription Plan & Activation Details</h3>
              <span className={styles.planPill} style={{ background: tenantInfo?.subscription?.isActive !== false ? '#dcfce7' : '#fee2e2', color: tenantInfo?.subscription?.isActive !== false ? '#15803d' : '#b91c1c', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>
                {tenantInfo?.subscription?.isActive !== false ? '● ACTIVE PLAN' : '● DEACTIVATED'}
              </span>
            </div>
            
            <div className={styles.cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Current Plan</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                    {tenantInfo?.subscription?.plan === '1_year' ? '1 Year Ultimate Pro' : tenantInfo?.subscription?.plan === '6_months' ? '6 Months Saver' : '1 Month Starter (₹999)'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Plan Price</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
                    ₹{tenantInfo?.subscription?.price || 999}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Renewal Date</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginTop: 4 }}>
                    {tenantInfo?.subscription?.endDate ? new Date(tenantInfo.subscription.endDate).toLocaleDateString('en-IN') : 'Oct 24, 2026'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  onClick={() => window.open('https://wa.me/919680132562?text=Hello%20SuperAdmin%2C%20I%20want%20to%20upgrade/renew%20my%20cafe%20subscription%20plan', '_blank')}
                  style={{ padding: '10px 18px', borderRadius: '10px', background: '#4f46e5', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Contact SuperAdmin to Upgrade/Renew
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
            <span>© 2026 Gourmet Ops - Provisions Enterprise Suite. v4.2.0-stable</span>
            <div className={styles.footerLinks}>
              <a href="#privacy">Privacy Policy</a>
              <a href="#audit">Audit Logs</a>
              <a href="#system">System Health</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
