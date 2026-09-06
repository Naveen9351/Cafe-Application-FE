import React, { useState } from 'react';
import { 
  Building2, Clock, Palette, DollarSign, CreditCard, 
  Upload, Trash2, CheckCircle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './RestaurantSettings.module.css';

export default function RestaurantSettings({ tenantInfo, onSave }) {
  const [activeSection, setActiveSection] = useState('general');
  const [accentColor, setAccentColor] = useState('#4f46e5');
  const [logoPreview, setLogoPreview] = useState(tenantInfo?.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200');
  
  const [form, setForm] = useState({
    restaurantName: tenantInfo?.businessName || 'Gourmet Ops Kitchen',
    gstNumber: tenantInfo?.gstNumber || 'GSTIN29ABCDE1234F',
    storeAddress: tenantInfo?.address || '1224 Michelin Avenue, Culinary District, Paris, France',
    primaryPhone: tenantInfo?.phone || '+33 1 45 67 89 00',
    publicEmail: tenantInfo?.email || 'contact@gourmetops.fr',
    enableGst: true,
    enableGratuity: true,
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

  const accentPresets = ['#4f46e5', '#059669', '#e11d48', '#0284c7', '#0f172a'];

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
    if (onSave) onSave({ ...form, accentColor, logo: logoPreview });
    toast.success('Restaurant settings saved successfully!');
  };

  const handleDiscard = () => {
    toast('Changes reset to defaults', { icon: '↩️' });
  };

  return (
    <div className={styles.settingsContainer}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div>
          <h1 className={styles.pageTitle}>Restaurant Settings</h1>
          <p className={styles.pageSubtitle}>Configure your restaurant identity, operations, and branding.</p>
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
              onClick={() => setActiveSection('general')}
            >
              <Building2 size={16} /> <span>General Identity</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'operations' ? styles.activeNav : ''}`}
              onClick={() => setActiveSection('operations')}
            >
              <Clock size={16} /> <span>Operations</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'branding' ? styles.activeNav : ''}`}
              onClick={() => setActiveSection('branding')}
            >
              <Palette size={16} /> <span>Branding & Theme</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'finance' ? styles.activeNav : ''}`}
              onClick={() => setActiveSection('finance')}
            >
              <DollarSign size={16} /> <span>Finance & Tax</span>
            </button>
            <button 
              className={`${styles.navItem} ${activeSection === 'subscription' ? styles.activeNav : ''}`}
              onClick={() => setActiveSection('subscription')}
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
                          if (e.target.files && e.target.files[0]) {
                            const url = URL.createObjectURL(e.target.files[0]);
                            setLogoPreview(url);
                            toast.success('Logo updated');
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
            </div>
          </section>

          {/* 3. Branding & Theme */}
          <section className={styles.sectionCard} id="branding">
            <div className={styles.cardHeader}>
              <h3>Branding & Theme</h3>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.brandingSplit}>
                <div className={styles.brandingLeft}>
                  <label className={styles.fieldLabel}>Dashboard Accent Color</label>
                  <div className={styles.paletteList}>
                    {accentPresets.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`${styles.colorChip} ${accentColor === color ? styles.activeColor : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setAccentColor(color);
                          toast.success('Accent color updated');
                        }}
                      />
                    ))}
                    <button type="button" className={styles.addColorChip}>+</button>
                  </div>

                  {/* QR Menu Branding */}
                  <div className={styles.qrBrandCard}>
                    <div className={styles.qrBrandHead}>
                      <div>
                        <h4>QR Menu Branding</h4>
                        <p>Apply your primary brand colors and logo to customer-facing QR Menus.</p>
                      </div>
                      <span className={styles.qrIconTag}>📲</span>
                    </div>
                    <button type="button" className={styles.configQrBtn}>Configure QR Style</button>
                  </div>
                </div>

                {/* Live Invoice Preview */}
                <div className={styles.invoicePreviewCard}>
                  <div className={styles.previewTitle}>Invoice Preview</div>
                  <div className={styles.mockInvoice}>
                    <div className={styles.mockHead}>
                      <div className={styles.mockLogo} style={{ backgroundColor: accentColor }}></div>
                      <div className={styles.mockLines}>
                        <div className={styles.lineLong}></div>
                        <div className={styles.lineShort}></div>
                      </div>
                    </div>
                    <div className={styles.mockDivider}></div>
                    <div className={styles.mockItemRow}></div>
                    <div className={styles.mockItemRow}></div>
                    <div className={styles.mockItemRow}></div>
                    <div className={styles.mockFooter}>
                      <div className={styles.pillLight} style={{ backgroundColor: `${accentColor}20` }}></div>
                      <div className={styles.pillDark} style={{ backgroundColor: accentColor }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Finance & Tax */}
          <section className={styles.sectionCard} id="finance">
            <div className={styles.cardHeader}>
              <h3>Finance & Tax</h3>
            </div>
            
            <div className={styles.cardBody}>
              <div className={styles.taxSwitchesRow}>
                <div className={styles.taxCard}>
                  <div className={styles.taxInfo}>
                    <div className={styles.taxIconBox}>🧾</div>
                    <div>
                      <strong>Enable GST/VAT</strong>
                      <p>Applied to all customer bills</p>
                    </div>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={form.enableGst} 
                      onChange={(e) => setForm({ ...form, enableGst: e.target.checked })} 
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.taxCard}>
                  <div className={styles.taxInfo}>
                    <div className={styles.taxIconBox}>💡</div>
                    <div>
                      <strong>Allow Gratuity/Tips</strong>
                      <p>Enable tip prompt on checkout</p>
                    </div>
                  </div>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={form.enableGratuity} 
                      onChange={(e) => setForm({ ...form, enableGratuity: e.target.checked })} 
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              {/* Linked Payment Methods */}
              <div className={styles.paymentSection}>
                <label className={styles.fieldLabel}>LINKED PAYMENT METHODS</label>
                <div className={styles.paymentMethodsGrid}>
                  <div className={`${styles.paymentMethodCard} ${styles.activePayment}`}>
                    <div className={styles.payTop}>
                      <span className={styles.payIcon}>💳</span>
                      <CheckCircle size={16} color="#4f46e5" />
                    </div>
                    <h4>Stripe</h4>
                    <p>Payments, Apple Pay, Cards</p>
                    <span className={styles.configuredBadge}>Configured</span>
                  </div>

                  <div className={styles.paymentMethodCard}>
                    <div className={styles.payTop}>
                      <span className={styles.payIcon}>🅿️</span>
                    </div>
                    <h4>PayPal</h4>
                    <p>Express Checkout</p>
                    <button type="button" className={styles.connectLink}>Connect Account</button>
                  </div>

                  <div className={styles.paymentMethodCard}>
                    <div className={styles.payTop}>
                      <span className={styles.payIcon}>💵</span>
                    </div>
                    <h4>Cash</h4>
                    <p>In-person transactions</p>
                    <span className={styles.alwaysActiveBadge}>Always Active</span>
                  </div>
                </div>
              </div>
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
