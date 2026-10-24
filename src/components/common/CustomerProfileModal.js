import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, CheckCircle2, ShieldCheck, Moon, Sun, Bell, MapPin, Sparkles, Heart, Coffee, LogOut, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomerProfileModal({
  isOpen,
  onClose,
  tableNumber = '',
  tenantInfo = {},
  isDarkMode = false,
  onToggleDarkMode
}) {
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('customer_name') || 'Guest Diner');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('customer_phone') || '');
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(customerName);

  if (!isOpen) return null;

  const bgModal = isDarkMode ? '#1a130e' : '#ffffff';
  const cardBg = isDarkMode ? '#241c14' : '#f8fafc';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textMain = isDarkMode ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    setCustomerName(nameInput.trim());
    localStorage.setItem('customer_name', nameInput.trim());
    setIsEditing(false);
    toast.success('Profile name updated!');
  };

  const handleCallWaiter = () => {
    toast.success(`🛎️ Waiter notified for Table ${tableNumber || 'your table'}!`, {
      duration: 3500,
      icon: '🛎️'
    });
  };

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9998
          }}
        />

        {/* Modal Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          style={{
            position: 'relative',
            zIndex: 9999,
            width: '100%',
            maxWidth: '520px',
            backgroundColor: bgModal,
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
            border: `1px solid ${borderCol}`
          }}
        >
          {/* Grab Handle */}
          <div style={{ width: '40px', height: '4px', borderRadius: '4px', backgroundColor: isDarkMode ? '#475569' : '#cbd5e1', margin: '12px auto 0 auto' }} />

          {/* Header */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${borderCol}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: textMain }}>Customer Profile</h3>
                <span style={{ fontSize: '0.75rem', color: textMuted }}>Dine-In Preferences & Details</span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: textMain
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Profile Card Body */}
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* User Avatar & Name */}
            <div style={{ backgroundColor: cardBg, border: `1px solid ${borderCol}`, borderRadius: '18px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ea580c, #b91c1c)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                fontWeight: '900',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                flexShrink: 0
              }}>
                {customerName.charAt(0).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: `1px solid #ea580c`,
                        backgroundColor: isDarkMode ? '#1a130e' : '#ffffff',
                        color: textMain,
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ea580c',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 850, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customerName}
                    </h4>
                    <button
                      onClick={() => {
                        setNameInput(customerName);
                        setIsEditing(true);
                      }}
                      style={{ background: 'none', border: 'none', color: textMuted, cursor: 'pointer', padding: 2 }}
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                )}

                {customerPhone ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, marginTop: '3px' }}>
                    <ShieldCheck size={14} />
                    <span>+91 {customerPhone} • Verified</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.76rem', color: textMuted, display: 'block', marginTop: '2px' }}>
                    Dining Guest
                  </span>
                )}
              </div>
            </div>

            {/* Table & Dining Session Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: cardBg, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '12px 14px' }}>
                <span style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Seated At</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '1rem', fontWeight: 850, color: textMain }}>
                  {tableNumber ? `Table #${String(tableNumber).replace(/^Table\s*#?/i, '')}` : 'Takeaway'}
                </p>
              </div>
              <div style={{ backgroundColor: cardBg, border: `1px solid ${borderCol}`, borderRadius: '14px', padding: '12px 14px' }}>
                <span style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Restaurant</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.92rem', fontWeight: 850, color: textMain, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tenantInfo.name || localStorage.getItem('restaurant_name') || 'SERVIQ Bistro'}
                </p>
              </div>
            </div>

            {/* Quick Actions List */}
            <div style={{ backgroundColor: cardBg, border: `1px solid ${borderCol}`, borderRadius: '16px', overflow: 'hidden' }}>
              {/* Call Waiter */}
              <div
                onClick={handleCallWaiter}
                style={{
                  padding: '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${borderCol}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Bell size={18} color="#ea580c" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: textMain }}>Call Waiter to Table</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: 800, backgroundColor: 'rgba(234, 88, 12, 0.12)', padding: '3px 8px', borderRadius: '100px' }}>
                  Request
                </span>
              </div>

              {/* Theme Toggle */}
              {onToggleDarkMode && (
                <div
                  onClick={onToggleDarkMode}
                  style={{
                    padding: '13px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isDarkMode ? <Sun size={18} color="#fbbe21" /> : <Moon size={18} color="#64748b" />}
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: textMain }}>App Theme</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: textMuted, fontWeight: 700 }}>
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
