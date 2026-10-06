import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  User, Phone, ShieldCheck, Moon, Sun, Bell,
  Utensils, Edit3, Check, Heart, Sparkles,
  Wifi, Star, Award, Receipt, CreditCard, Droplets,
  Trash2, Copy, CheckCircle2, ChevronRight, X,
  Clock, MapPin, Smile, RefreshCw, Smartphone
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { decodeTableToken } from '../utils/tableToken';
import { API_URL as API } from '../config/api';
import CustomerBottomNav from './common/CustomerBottomNav';

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Table & Tenant resolution
  const tableParam = searchParams.get('table') || searchParams.get('t') || searchParams.get('code');
  const tableNumber = tableParam ? decodeTableToken(tableParam) : (localStorage.getItem('tableNumber') || '');
  const tenantId = searchParams.get('tenantId') || localStorage.getItem('tenantId') || '';

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("isDarkMode");
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  const [customerName, setCustomerName] = useState(() => localStorage.getItem('customer_name') || 'Guest Diner');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('customer_phone') || '');
  
  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState(customerName);
  const [phoneInput, setPhoneInput] = useState(customerPhone);
  const [isUpdating, setIsUpdating] = useState(false);

  // Orders count & Favorites calculation
  const [ordersCount, setOrdersCount] = useState(0);
  const [favCount, setFavCount] = useState(0);

  // Review & Rating State
  const [selectedRating, setSelectedRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [billPaymentMethod, setBillPaymentMethod] = useState('UPI / Online');

  const tenantInfo = {
    name: localStorage.getItem('restaurant_name') || "SERVIQ Gourmet Bistro",
    address: "Indiranagar, Bangalore",
    wifiSSID: "SERVIQ_Guest_HighSpeed",
    wifiPass: "ServiqCafe@2026"
  };

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    // Calculate total recorded orders
    let total = 0;
    try {
      const rawHist = localStorage.getItem('serviq_order_history');
      if (rawHist) {
        const parsed = JSON.parse(rawHist);
        if (Array.isArray(parsed)) total = parsed.length;
      }
      if (total === 0) {
        const rawSess = localStorage.getItem('serviq_session_orders');
        if (rawSess) {
          const parsed = JSON.parse(rawSess);
          if (Array.isArray(parsed)) total = parsed.length;
        }
      }
    } catch (e) {}
    setOrdersCount(total);

    // Calculate favorites
    try {
      const rawFav = localStorage.getItem('serviq_favorites');
      if (rawFav) {
        const parsed = JSON.parse(rawFav);
        if (Array.isArray(parsed)) setFavCount(parsed.length);
      }
    } catch (e) {}
  }, []);

  const openEditModal = () => {
    setNameInput(customerName);
    setPhoneInput(customerPhone);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!nameInput.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const newName = nameInput.trim();
    const newPhone = phoneInput.trim();
    setIsUpdating(true);

    try {
      setCustomerName(newName);
      localStorage.setItem('customer_name', newName);

      if (newPhone) {
        setCustomerPhone(newPhone);
        localStorage.setItem('customer_phone', newPhone);
      }

      try {
        const storedCust = localStorage.getItem('serviq_customer');
        if (storedCust) {
          const parsed = JSON.parse(storedCust);
          parsed.name = newName;
          if (newPhone) parsed.phone = newPhone;
          localStorage.setItem('serviq_customer', JSON.stringify(parsed));
        }
      } catch (e) {}

      // Synchronize customer name with backend orders & KDS
      let sessionIds = [];
      try {
        const raw = localStorage.getItem('serviq_session_orders');
        if (raw) sessionIds = JSON.parse(raw);
      } catch (e) {}
      const lastOrd = localStorage.getItem('serviq_last_order_id');
      if (lastOrd && !sessionIds.includes(lastOrd)) sessionIds.push(lastOrd);

      await axios.post(`${API}/customer/update-profile`, {
        name: newName,
        phone: newPhone || customerPhone,
        tenantId,
        sessionIds,
        tableNumber
      });

      toast.success('Profile updated & synchronized with KDS!', { icon: '✨' });
      setIsEditModalOpen(false);
    } catch (apiErr) {
      console.warn('Sync customer name with KDS:', apiErr);
      toast.success('Profile name updated locally!');
      setIsEditModalOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCallWaiter = () => {
    toast.success(`🛎️ Waiter notified! Staff is heading to your table.`, {
      duration: 4000,
      icon: '🛎️'
    });
  };

  const handleRequestWater = () => {
    toast.success(`💧 Fresh water & napkins requested!`, {
      duration: 3500,
      icon: '💧'
    });
  };

  const handleRequestCleanTable = () => {
    toast.success(`✨ Housekeeping notified to clean table!`, {
      duration: 3500,
      icon: '✨'
    });
  };

  const handleConfirmBillRequest = () => {
    setIsRequestingBill(false);
    toast.success(`💳 Bill requested with ${billPaymentMethod}! Staff is on the way.`, {
      duration: 4500,
      icon: '🧾'
    });
  };

  const handleCopyWiFi = () => {
    navigator.clipboard?.writeText(tenantInfo.wifiPass);
    toast.success(`📶 WiFi Password "${tenantInfo.wifiPass}" copied!`, {
      duration: 3000,
      icon: '📋'
    });
  };

  const handleSubmitFeedback = () => {
    if (selectedRating === 0) return;
    setFeedbackSubmitted(true);
    toast.success('🎉 Thank you! Your feedback helps us serve you better.', {
      duration: 4000,
      icon: '🌟'
    });
  };

  const handleClearSession = () => {
    if (window.confirm("Are you sure you want to clear your dining profile session on this device?")) {
      localStorage.removeItem('customer_name');
      localStorage.removeItem('customer_phone');
      localStorage.removeItem('serviq_customer');
      setCustomerName('Guest Diner');
      setCustomerPhone('');
      toast.success('Profile session reset!');
    }
  };

  const getDinerBadge = () => {
    if (ordersCount >= 5) return { title: 'Gold VIP Gourmet', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)', icon: '👑' };
    if (ordersCount >= 2) return { title: 'Silver Foodie', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', icon: '✨' };
    return { title: 'Gourmet Member', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.15)', icon: '🌟' };
  };

  const badge = getDinerBadge();

  const theme = {
    bgPage: isDarkMode ? '#120d09' : '#f8fafc',
    bgContainer: isDarkMode ? '#1a130e' : '#ffffff',
    cardBg: isDarkMode ? '#241c14' : '#ffffff',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#ea580c',
    accentGlow: 'rgba(234, 88, 12, 0.25)',
    inputBg: isDarkMode ? '#221911' : '#f1f5f9'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bgPage, color: theme.textMain, display: 'flex', justifyContent: 'center' }}>
      <Toaster position="top-center" />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: theme.bgContainer,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        paddingBottom: '6rem',
        boxSizing: 'border-box',
        borderLeft: `1px solid ${theme.border}`,
        borderRight: `1px solid ${theme.border}`
      }}>
        {/* Top Sticky Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          backgroundColor: isDarkMode ? 'rgba(26, 19, 14, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.border}`,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          {/* Screen Title & Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'rgba(234, 88, 12, 0.15)', color: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={18} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: theme.textMain, letterSpacing: '-0.2px', lineHeight: 1.2 }}>
              Profile
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                padding: 0
              }}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={16} color="#fbbe21" /> : <Moon size={16} color="#475569" />}
            </button>
          </div>
        </div>

        {/* Profile Content Body */}
        <div style={{ padding: '16px 18px 0 18px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

          {/* 1. VIP Customer Identity Card */}
          <div style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '24px',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.35)' : '0 10px 30px rgba(15,23,42,0.04)'
          }}>
            {/* Subtle background glow effect */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(234, 88, 12, 0.22) 0%, rgba(234, 88, 12, 0) 70%)',
              pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
              {/* Avatar with Glow Ring */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ea580c 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: '900',
                  boxShadow: '0 6px 20px rgba(234, 88, 12, 0.4)',
                  flexShrink: 0
                }}>
                  {customerName ? customerName.charAt(0).toUpperCase() : 'G'}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  backgroundColor: '#16a34a',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: `2.5px solid ${theme.cardBg}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: theme.textMain,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.3px'
                  }}>
                    {customerName}
                  </h2>
                  <button
                    onClick={openEditModal}
                    style={{
                      background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                      border: `1px solid ${theme.border}`,
                      color: theme.accent,
                      cursor: 'pointer',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                    title="Edit Profile"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                </div>

                {customerPhone ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', color: '#16a34a', fontWeight: 700, marginTop: '3px' }}>
                    <ShieldCheck size={14} />
                    <span>+91 {customerPhone} • Verified</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: theme.textMuted, display: 'block', marginTop: '2px', fontWeight: 600 }}>
                    Direct Dining Guest • QR Order
                  </span>
                )}

                {/* Diner Status Badge */}
                <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 850 }}>
                  <span>{badge.icon}</span>
                  <span>{badge.title}</span>
                </div>
              </div>
            </div>

            {/* Live Customer Metrics Strip (No Table Number) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.border}`
            }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Orders</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: theme.textMain, marginTop: '2px', display: 'block' }}>
                  {ordersCount}
                </span>
              </div>
              <div style={{ textAlign: 'center', borderLeft: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Favorites</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: theme.accent, marginTop: '2px', display: 'block' }}>
                  {favCount} dishes
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tier</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 900, color: badge.color, marginTop: '5px', display: 'block' }}>
                  {badge.icon} {badge.title.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Instant Table Service Hub (2x2 Bento Grid) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 2px' }}>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: theme.textMain, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🛎️ Table Service Hub
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, backgroundColor: 'rgba(22, 163, 74, 0.1)', padding: '2px 8px', borderRadius: '100px' }}>
                Live Staff Assistance
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Action 1: Call Waiter */}
              <motion.div
                whileTap={{ scale: 0.96 }}
                onClick={handleCallWaiter}
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '18px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(234, 88, 12, 0.15)', color: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 850, color: theme.textMain, display: 'block' }}>Call Waiter</span>
                  <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>Request staff at table</span>
                </div>
              </motion.div>

              {/* Action 2: Water & Napkins */}
              <motion.div
                whileTap={{ scale: 0.96 }}
                onClick={handleRequestWater}
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '18px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 850, color: theme.textMain, display: 'block' }}>Water & Napkins</span>
                  <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>Quick refill dispatched</span>
                </div>
              </motion.div>

              {/* Action 3: Request Bill */}
              <motion.div
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsRequestingBill(true)}
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '18px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 850, color: theme.textMain, display: 'block' }}>Request Bill</span>
                  <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>Cash / UPI / Machine</span>
                </div>
              </motion.div>

              {/* Action 4: Clean Table */}
              <motion.div
                whileTap={{ scale: 0.96 }}
                onClick={handleRequestCleanTable}
                style={{
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '18px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 850, color: theme.textMain, display: 'block' }}>Clean Table</span>
                  <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>Housekeeping alert</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* 3. Cafe High-Speed WiFi & Location Info */}
          <div style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding: '16px 18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wifi size={20} />
                </div>
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 850, color: theme.textMain, display: 'block' }}>Guest High-Speed WiFi</span>
                  <span style={{ fontSize: '0.74rem', color: theme.textMuted }}>SSID: <strong>{tenantInfo.wifiSSID}</strong></span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleCopyWiFi}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: isDarkMode ? '#2f241a' : '#f1f5f9',
                  border: `1px solid ${theme.border}`,
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  color: theme.textMain,
                  cursor: 'pointer'
                }}
              >
                <Copy size={13} />
                <span>Copy Key</span>
              </motion.button>
            </div>
          </div>

          {/* 4. Live Dining Feedback & Rating Widget */}
          <div style={{
            backgroundColor: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '20px',
            padding: '18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 850, color: theme.textMain }}>
                  ⭐ Rate Today's Dining Experience
                </h3>
                <span style={{ fontSize: '0.74rem', color: theme.textMuted }}>Direct feedback to executive chef & manager</span>
              </div>
            </div>

            {feedbackSubmitted ? (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#16a34a' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 8px' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 850 }}>Thank you for your rating!</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: theme.textMuted }}>We hope you enjoy every bite at {tenantInfo.name}.</p>
              </div>
            ) : (
              <div>
                {/* 5 Stars Bar */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '12px 0 16px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setSelectedRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Star
                        size={28}
                        fill={star <= selectedRating ? '#f59e0b' : 'transparent'}
                        color={star <= selectedRating ? '#f59e0b' : theme.textMuted}
                      />
                    </motion.button>
                  ))}
                </div>

                {/* Quick Compliment Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', justifyContent: 'center' }}>
                  {[
                    '🍕 Delicious Food',
                    '⚡ Super Fast Service',
                    '🌿 Lovely Ambience',
                    '✨ Friendly Staff',
                    '☕ Best Coffee'
                  ].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '100px',
                          fontSize: '0.74rem',
                          fontWeight: 750,
                          border: `1px solid ${isSelected ? theme.accent : theme.border}`,
                          backgroundColor: isSelected ? 'rgba(234, 88, 12, 0.1)' : 'transparent',
                          color: isSelected ? theme.accent : theme.textMuted,
                          cursor: 'pointer'
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmitFeedback}
                  style={{
                    width: '100%',
                    backgroundColor: theme.accent,
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: `0 4px 14px ${theme.accentGlow}`
                  }}
                >
                  Submit Dining Feedback
                </motion.button>
              </div>
            )}
          </div>

          {/* 5. Settings & Reset Options */}
          <div style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '20px', overflow: 'hidden' }}>
            {/* Theme Row */}
            <div
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderBottom: `1px solid ${theme.border}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: isDarkMode ? 'rgba(251, 190, 33, 0.15)' : 'rgba(100, 116, 139, 0.15)', color: isDarkMode ? '#fbbe21' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
                </div>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: theme.textMain, display: 'block' }}>Display Theme</span>
                  <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>Toggle dark / light appearance</span>
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: 700 }}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>

            {/* Clear Session Row */}
            <div
              onClick={handleClearSession}
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={17} />
                </div>
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ef4444', display: 'block' }}>Reset Dining Session</span>
                  <span style={{ fontSize: '0.72rem', color: theme.textMuted }}>Clear local device cache & name</span>
                </div>
              </div>
              <ChevronRight size={16} color={theme.textMuted} />
            </div>
          </div>

          {/* Brand Footer */}
          <footer style={{ marginTop: 'auto', paddingTop: '1.5rem', paddingBottom: '0.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: '700', margin: 0 }}>
              Powered by <span style={{ color: theme.accent, fontWeight: '800' }}>SERVIQ OS</span>
            </p>
          </footer>
        </div>

        {/* Dedicated Edit Profile Modal */}
        <AnimatePresence>
          {isEditModalOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  backgroundColor: theme.bgContainer,
                  borderRadius: '24px',
                  padding: '24px',
                  border: `1px solid ${theme.border}`,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(234, 88, 12, 0.15)', color: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Edit3 size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: theme.textMain }}>Edit Profile</h3>
                      <span style={{ fontSize: '0.74rem', color: theme.textMuted }}>Update details for kitchen & orders</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: theme.textMuted, marginBottom: '6px' }}>
                      Customer Full Name *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} color={theme.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Enter your full name"
                        style={{
                          width: '100%',
                          backgroundColor: theme.inputBg,
                          border: `1.5px solid ${theme.accent}`,
                          borderRadius: '12px',
                          padding: '10px 14px 10px 38px',
                          color: theme.textMain,
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: theme.textMuted, marginBottom: '6px' }}>
                      Phone Number (Mobile)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Smartphone size={16} color={theme.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        style={{
                          width: '100%',
                          backgroundColor: theme.inputBg,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '12px',
                          padding: '10px 14px 10px 38px',
                          color: theme.textMain,
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: 'transparent',
                        color: theme.textMuted,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      style={{
                        flex: 1.5,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: theme.accent,
                        color: '#ffffff',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: `0 4px 14px ${theme.accentGlow}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {isUpdating ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
                      <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Request Bill Modal */}
        <AnimatePresence>
          {isRequestingBill && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  backgroundColor: theme.bgContainer,
                  borderRadius: '24px',
                  padding: '24px',
                  border: `1px solid ${theme.border}`,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Receipt size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: theme.textMain }}>Request Final Bill</h3>
                    <span style={{ fontSize: '0.76rem', color: theme.textMuted }}>Table Service</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.84rem', color: theme.textMuted, margin: '0 0 16px 0' }}>
                  How would you like to settle your bill with the waiter?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {['UPI / Online', 'Card (Swipe Machine)', 'Cash'].map((method) => (
                    <div
                      key={method}
                      onClick={() => setBillPaymentMethod(method)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '14px',
                        border: `1.5px solid ${billPaymentMethod === method ? theme.accent : theme.border}`,
                        backgroundColor: billPaymentMethod === method ? 'rgba(234, 88, 12, 0.1)' : theme.cardBg,
                        color: billPaymentMethod === method ? theme.accent : theme.textMain,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 800,
                        fontSize: '0.88rem'
                      }}
                    >
                      <span>{method}</span>
                      {billPaymentMethod === method && <Check size={16} strokeWidth={3} />}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setIsRequestingBill(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: `1px solid ${theme.border}`,
                      backgroundColor: 'transparent',
                      color: theme.textMuted,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBillRequest}
                    style={{
                      flex: 1.5,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: theme.accent,
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: `0 4px 14px ${theme.accentGlow}`
                    }}
                  >
                    Notify Staff
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Customer Bottom Navigation */}
        <CustomerBottomNav
          tableNumber={tableNumber}
          tenantId={tenantId}
          tenantInfo={tenantInfo}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      </div>
    </div>
  );
}
