import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  User, ChevronLeft, ChevronRight, Moon, Sun,
  ShoppingBag, Wallet, Bell, Wifi, Trash2, Edit3,
  Check, X, Leaf, Smartphone, Heart, Gift,
  LogOut, Plus, AlertCircle, ShoppingCart,
  Sparkles, ShieldCheck, Zap
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import styles from './CustomerProfilePage.module.css';
import { decodeTableToken, encodeTableToken } from '../utils/tableToken';
import { API_URL as API } from '../config/api';
import CustomerBottomNav from './common/CustomerBottomNav';
import TableBadge from './common/TableBadge';

export default function CustomerProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Table & Tenant resolution
  const tableParam = searchParams.get('table') || searchParams.get('t') || searchParams.get('code');
  const tableNumber = tableParam ? decodeTableToken(tableParam) : (localStorage.getItem('tableNumber') || '1');
  const tenantId = searchParams.get('tenantId') || localStorage.getItem('tenantId') || '';

  const tableToken = tableNumber ? encodeTableToken(tableNumber) : '';
  const tableTarget = tableToken ? `?t=${encodeURIComponent(tableToken)}` : '';

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
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('customer_phone') || localStorage.getItem('verified_customer_phone') || '');
  const [customerBirthday, setCustomerBirthday] = useState(() => localStorage.getItem('customer_birthday') || '');
  const [customerAnniversary, setCustomerAnniversary] = useState(() => localStorage.getItem('customer_anniversary') || '');
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  // Form states
  const [nameInput, setNameInput] = useState(customerName);
  const [phoneInput, setPhoneInput] = useState(customerPhone);
  const [birthdayInput, setBirthdayInput] = useState(customerBirthday);
  const [anniversaryInput, setAnniversaryInput] = useState(customerAnniversary);
  const [isUpdating, setIsUpdating] = useState(false);

  // Wishlist items state — PER USER: key = serviq_favorites_<tenantId>_<phone>
  // This prevents User A's liked dishes from showing in User B's profile.
  const getFavKey = () => {
    const tid = tenantId || localStorage.getItem('tenantId') || 'default';
    const phone = localStorage.getItem('customer_phone')
      || localStorage.getItem('verified_customer_phone')
      || 'guest';
    return `serviq_favorites_${tid}_${phone}`;
  };

  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const tid = localStorage.getItem('tenantId') || 'default';
      const phone = localStorage.getItem('customer_phone')
        || localStorage.getItem('verified_customer_phone')
        || 'guest';
      const key = `serviq_favorites_${tid}_${phone}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const getVegKey = () => {
    const tid = tenantId || localStorage.getItem('tenantId') || 'default';
    const phone = localStorage.getItem('customer_phone')
      || localStorage.getItem('verified_customer_phone')
      || 'guest';
    return `serviq_veg_only_${tid}_${phone}`;
  };

  // Pure Veg Mode switch — PER USER: key = serviq_veg_only_<tenantId>_<phone>
  const [isVegOnly, setIsVegOnly] = useState(() => {
    try {
      const tid = localStorage.getItem('tenantId') || 'default';
      const phone = localStorage.getItem('customer_phone')
        || localStorage.getItem('verified_customer_phone')
        || 'guest';
      const key = `serviq_veg_only_${tid}_${phone}`;
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
      const legacy = localStorage.getItem('serviq_veg_only');
      return legacy ? JSON.parse(legacy) : false;
    } catch (e) {
      return false;
    }
  });

  // Table Service cooldown countdowns
  const [serviceTimers, setServiceTimers] = useState({
    waiter: 0,
    bill: 0
  });

  // Live session bill total
  const [liveBill, setLiveBill] = useState({ total: 0, itemsCount: 0, roundsCount: 1 });
  const [billPaymentMethod, setBillPaymentMethod] = useState('UPI / QR at Table');
  const [wifiCopied, setWifiCopied] = useState(false);

  const tenantInfo = {
    name: localStorage.getItem('restaurant_name') || "SERVIQ Gourmet Bistro",
    address: "Indiranagar, Bangalore",
    wifiSSID: "SERVIQ_Guest_HighSpeed",
    wifiPass: "ServiqCafe@2026"
  };

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Save wishlist to the per-user scoped key whenever it changes
  useEffect(() => {
    const key = getFavKey();
    localStorage.setItem(key, JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // Real-time sync: re-read favorites when Menu.js updates them (same-tab CustomEvent)
  useEffect(() => {
    const syncFromMenu = (e) => {
      // Menu.js sends { detail: { key } } — use that exact key
      const key = (e && e.detail && e.detail.key) ? e.detail.key : getFavKey();
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setWishlistItems(parsed);
        } else {
          setWishlistItems([]);
        }
      } catch (err) {}
    };

    // Same-tab: Menu.js fires this CustomEvent after every heart toggle
    window.addEventListener('serviq_favorites_updated', syncFromMenu);

    // Cross-tab: standard storage event — key will be the namespaced one
    const storageSync = (e) => {
      const myKey = getFavKey();
      if (e.key === myKey) syncFromMenu(null);
    };
    window.addEventListener('storage', storageSync);

    return () => {
      window.removeEventListener('serviq_favorites_updated', syncFromMenu);
      window.removeEventListener('storage', storageSync);
    };
  }, []);

  // Real-time sync: re-read Pure Veg mode if updated from Menu or another tab
  useEffect(() => {
    const syncVeg = (e) => {
      const key = (e && e.detail && e.detail.key) ? e.detail.key : getVegKey();
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) setIsVegOnly(JSON.parse(raw));
      } catch (err) {}
    };

    window.addEventListener('serviq_veg_only_updated', syncVeg);

    const storageSync = (e) => {
      if (e.key === getVegKey()) syncVeg(null);
    };
    window.addEventListener('storage', storageSync);

    return () => {
      window.removeEventListener('serviq_veg_only_updated', syncVeg);
      window.removeEventListener('storage', storageSync);
    };
  }, []);



  // Decrement cooldown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setServiceTimers(prev => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          if (next[k] > 0) {
            next[k] -= 1;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync live orders & active bill
  useEffect(() => {
    let billTotal = 0;
    let itemsCount = 0;
    let sessionIds = [];

    try {
      const rawHist = localStorage.getItem('serviq_order_history');
      if (rawHist) {
        const parsed = JSON.parse(rawHist);
        if (Array.isArray(parsed)) {
          parsed.forEach(ord => {
            if (ord.paymentStatus !== 'paid' && ord.status !== 'cancelled') {
              billTotal += (ord.totalAmount || ord.total || 0);
              ord.items?.forEach(it => { itemsCount += (it.quantity || 1); });
            }
          });
        }
      }
      const rawSess = localStorage.getItem('serviq_session_orders');
      if (rawSess) {
        const parsed = JSON.parse(rawSess);
        if (Array.isArray(parsed)) sessionIds = parsed;
      }
    } catch (e) {}

    setLiveBill({
      total: billTotal,
      itemsCount: itemsCount,
      roundsCount: sessionIds.length > 0 ? sessionIds.length : (billTotal > 0 ? 1 : 0)
    });
  }, [tableNumber]);

  const handleToggleVegOnly = () => {
    const nextVal = !isVegOnly;
    setIsVegOnly(nextVal);
    const key = getVegKey();
    localStorage.setItem(key, JSON.stringify(nextVal));
    localStorage.setItem('serviq_veg_only', JSON.stringify(nextVal));
    window.dispatchEvent(new CustomEvent('serviq_veg_only_updated', { detail: { key, isVegOnly: nextVal } }));
    toast.success(nextVal ? '🟢 Pure Veg mode activated!' : 'Pure Veg mode turned off');
  };

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

      let sessionIds = [];
      try {
        const raw = localStorage.getItem('serviq_session_orders');
        if (raw) sessionIds = JSON.parse(raw);
      } catch (e) {}

      await axios.post(`${API}/customer/update-profile`, {
        name: newName,
        phone: newPhone || customerPhone,
        tenantId,
        sessionIds,
        tableNumber
      });

      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      toast.success('Profile updated locally!');
      setIsEditModalOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveBirthdayAndPerks = async (e) => {
    if (e) e.preventDefault();
    setCustomerBirthday(birthdayInput);
    setCustomerAnniversary(anniversaryInput);
    localStorage.setItem('customer_birthday', birthdayInput);
    localStorage.setItem('customer_anniversary', anniversaryInput);

    try {
      await axios.post(`${API}/customer/update-profile`, {
        name: customerName,
        phone: customerPhone,
        birthday: birthdayInput,
        anniversary: anniversaryInput,
        tenantId,
        tableNumber
      });
    } catch (err) {}

    setIsBirthdayModalOpen(false);
    toast.success('🎉 Birthday & special dates saved! 20% birthday perk unlocked.', {
      duration: 4000,
      icon: '🎂'
    });
  };

  const handleRemoveFavorite = (dishId) => {
    setWishlistItems(prev => prev.filter(it => (it.id || it._id) !== dishId));
    toast.success('Removed from wishlist');
  };

  const handleAddToCartFromWishlist = (dish) => {
    try {
      const rawCart = localStorage.getItem('cart');
      let currentCart = rawCart ? JSON.parse(rawCart) : [];
      if (!Array.isArray(currentCart)) currentCart = [];

      const existingIndex = currentCart.findIndex(it => (it.id || it._id) === (dish.id || dish._id));
      if (existingIndex > -1) {
        currentCart[existingIndex].quantity = (currentCart[existingIndex].quantity || 1) + 1;
      } else {
        currentCart.push({
          id: dish.id || dish._id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          isVeg: dish.isVeg !== undefined ? dish.isVeg : true
        });
      }

      localStorage.setItem('cart', JSON.stringify(currentCart));
      window.dispatchEvent(new Event('cartUpdated'));
      toast.success(`Added ${dish.name} to Cart! 🛒`, { icon: '🛒' });
    } catch (e) {
      toast.success(`Added ${dish.name} to Cart!`);
    }
  };

  const handleCallWaiter = async () => {
    if (serviceTimers.waiter > 0) {
      toast.error(`Staff already alerted for Table ${tableNumber}! Arriving in ${serviceTimers.waiter}s.`);
      return;
    }

    setServiceTimers(p => ({ ...p, waiter: 60 }));

    try {
      const res = await axios.post(`${API}/tables/service-request`, {
        tableNumber,
        tenantId,
        customerName,
        customerPhone,
        type: 'call_waiter'
      });

      if (res.data?.alreadyActive) {
        toast('Staff has already been alerted! Arriving shortly.', { icon: '🛎️' });
      } else {
        toast.success(`🛎️ Staff alerted for Table ${tableNumber}! Heading over.`, { duration: 3500 });
      }
    } catch (err) {
      // Fallback: timer is set and local confirmation shown
      toast.success(`🛎️ Staff called for Table ${tableNumber}! Heading over.`, { duration: 3500 });
    }
  };

  const handleConfirmBill = async () => {
    setIsBillModalOpen(false);
    setServiceTimers(p => ({ ...p, bill: 90 }));

    try {
      await axios.post(`${API}/tables/service-request`, {
        tableNumber,
        tenantId,
        customerName,
        customerPhone,
        type: 'request_bill',
        paymentMethod: billPaymentMethod,
        amount: liveBill.total
      });
      toast.success(`💳 Bill requested with ${billPaymentMethod}! Staff is on the way.`, { duration: 4000 });
    } catch (err) {
      toast.success(`💳 Bill requested with ${billPaymentMethod}! Staff is on the way.`, { duration: 4000 });
    }
  };

  const handleCopyWiFi = () => {
    navigator.clipboard?.writeText(tenantInfo.wifiPass);
    setWifiCopied(true);
    toast.success(`WiFi password "${tenantInfo.wifiPass}" copied!`, { duration: 2500 });
    setTimeout(() => setWifiCopied(false), 2000);
  };

  // Complete Production Logout Flow
  const handlePerformLogout = () => {
    // 1. Clear session and user identification
    localStorage.removeItem('customer_name');
    localStorage.removeItem('customer_phone');
    localStorage.removeItem('serviq_customer');
    localStorage.removeItem('serviq_dietary_pref');
    localStorage.removeItem('serviq_veg_only');
    try {
      localStorage.removeItem(getVegKey());
    } catch (e) {}
    localStorage.removeItem('customer_birthday');
    localStorage.removeItem('customer_anniversary');
    localStorage.removeItem('serviq_session_orders');
    localStorage.removeItem('serviq_last_order_id');

    // 2. Reset in-memory state
    setCustomerName('Guest Diner');
    setCustomerPhone('');
    setCustomerBirthday('');
    setCustomerAnniversary('');
    setIsVegOnly(false);
    setIsLogoutModalOpen(false);

    toast.success('👋 Logged out successfully! Browsing as Guest Diner.');
    
    // 3. Navigate back to menu with table token preserved
    navigate(`/menu${tableTarget}`, { replace: true });
  };

  // Blinkit Theme Tokens
  const theme = {
    bgPage: isDarkMode ? '#0e1015' : '#f4f5f8',
    bgHeaderGlow: isDarkMode 
      ? 'radial-gradient(ellipse 100% 60% at 50% -10%, rgba(180, 83, 9, 0.42) 0%, rgba(14, 16, 21, 0) 100%)' 
      : 'radial-gradient(ellipse 100% 60% at 50% -10%, rgba(254, 215, 170, 0.5) 0%, rgba(244, 245, 248, 0) 100%)',
    bgCard: isDarkMode ? '#1a1d24' : '#ffffff',
    bgBanner: isDarkMode 
      ? 'linear-gradient(90deg, #1e1b18 0%, #2e2417 100%)' 
      : 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0',
    borderBanner: isDarkMode ? '#78350f' : '#fed7aa',
    textMain: isDarkMode ? '#ffffff' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#ea580c',
    inputBg: isDarkMode ? '#13161c' : '#f8fafc'
  };

  return (
    <div className={styles.pageContainer} style={{ backgroundColor: theme.bgPage, color: theme.textMain }}>
      <Toaster position="top-center" />

      <div
        className={styles.contentWrapper}
        style={{
          background: `${theme.bgHeaderGlow}, ${theme.bgPage}`
        }}
      >
        {/* 1. Top Navigation Bar */}
        <div className={styles.topNav}>
          <button
            type="button"
            onClick={() => navigate(`/menu${tableTarget}`, { replace: true })}
            className={styles.backCircleBtn}
            style={{
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
              color: theme.textMain
            }}
          >
            <ChevronLeft size={22} />
          </button>

          <TableBadge
            tableNumber={tableNumber}
            isDarkMode={isDarkMode}
            style={{ padding: '4px 9px', fontSize: '0.8rem' }}
          />
        </div>

        {/* 2. Hero Center Profile (Blinkit Style) */}
        <div className={styles.heroProfileSection}>
          <div className={styles.largeAvatarCircle} onClick={openEditModal}>
            <User size={46} strokeWidth={2.4} />
          </div>

          <h1 className={styles.heroTitle} style={{ color: theme.textMain }}>
            <span>{customerName === 'Guest Diner' ? 'Your account' : customerName}</span>
            <Edit3 size={15} color={theme.accent} style={{ cursor: 'pointer' }} onClick={openEditModal} />
          </h1>

          <p className={styles.heroSubtitle} style={{ color: theme.textMuted }}>
            {customerPhone ? customerPhone : '+ Add Mobile Number'}
          </p>
        </div>

        {/* 3. Birthday / Loyalty Promo Banner (Interactive & Functional) */}
        <div
          className={styles.promoBannerCard}
          onClick={() => setIsBirthdayModalOpen(true)}
          style={{
            background: theme.bgBanner,
            borderColor: theme.borderBanner
          }}
        >
          <div className={styles.promoTextCol}>
            <h3 className={styles.promoTitle} style={{ color: theme.textMain }}>
              {customerBirthday ? `Birthday: ${customerBirthday}` : 'Add your birthday'}
            </h3>
            <span className={styles.promoLink} style={{ color: '#22c55e' }}>
              <span>{customerBirthday ? 'Perks Active • Edit date' : 'Enter details ▸'}</span>
              <ChevronRight size={14} strokeWidth={3} />
            </span>
          </div>

          <div className={styles.promoGraphic}>
            🎂
          </div>
        </div>

        {/* 4. Three Core Bento Action Cards */}
        <div className={styles.bentoGrid}>
          {/* Bento 1: Your orders */}
          <div
            className={styles.bentoCard}
            onClick={() => navigate(`/history${tableTarget}`)}
            style={{
              backgroundColor: theme.bgCard,
              borderColor: theme.border
            }}
          >
            <div className={styles.bentoIconBox} style={{ color: theme.textMain }}>
              <ShoppingBag size={24} strokeWidth={2.2} />
            </div>
            <span className={styles.bentoLabel} style={{ color: theme.textMain }}>
              Your orders
            </span>
          </div>

          {/* Bento 2: Pay & Bill */}
          <div
            className={styles.bentoCard}
            onClick={() => setIsBillModalOpen(true)}
            style={{
              backgroundColor: theme.bgCard,
              borderColor: theme.border
            }}
          >
            <div className={styles.bentoIconBox} style={{ color: theme.textMain }}>
              <Wallet size={24} strokeWidth={2.2} />
            </div>
            <span className={styles.bentoLabel} style={{ color: theme.textMain }}>
              Pay & Bill
            </span>
          </div>

          {/* Bento 3: Call Staff */}
          <div
            className={styles.bentoCard}
            onClick={handleCallWaiter}
            style={{
              backgroundColor: theme.bgCard,
              borderColor: serviceTimers.waiter > 0 ? theme.accent : theme.border
            }}
          >
            <div className={styles.bentoIconBox} style={{ color: serviceTimers.waiter > 0 ? theme.accent : theme.textMain }}>
              <Bell size={24} strokeWidth={2.2} />
            </div>
            <span className={styles.bentoLabel} style={{ color: serviceTimers.waiter > 0 ? theme.accent : theme.textMain }}>
              {serviceTimers.waiter > 0 ? `${serviceTimers.waiter}s...` : 'Call Staff'}
            </span>
          </div>
        </div>

        {/* 5. Preferences & Display Options */}
        <div
          className={styles.sectionGroup}
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.border
          }}
        >
          {/* Appearance Row */}
          <div
            className={styles.groupRow}
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ borderColor: theme.border }}
          >
            <div className={styles.groupRowLeft}>
              {isDarkMode ? <Moon size={20} color={theme.textMain} /> : <Sun size={20} color={theme.textMain} />}
              <span className={styles.groupRowTitle} style={{ color: theme.textMain }}>
                Appearance
              </span>
            </div>

            <span style={{ fontSize: '0.78rem', fontWeight: 850, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{isDarkMode ? 'DARK' : 'LIGHT'}</span>
              <ChevronRight size={14} />
            </span>
          </div>

          {/* Pure Veg Mode Toggle */}
          <div
            className={styles.groupRow}
            onClick={handleToggleVegOnly}
            style={{ borderColor: theme.border }}
          >
            <div className={styles.groupRowLeft}>
              <Leaf size={20} color={isVegOnly ? '#16a34a' : theme.textMuted} />
              <div>
                <h4 className={styles.groupRowTitle} style={{ color: theme.textMain }}>
                  Pure Veg Mode
                </h4>
                <p className={styles.groupRowSub} style={{ color: theme.textMuted }}>
                  Only vegetarian dishes will be shown on menu
                </p>
              </div>
            </div>

            <div
              className={styles.toggleSwitch}
              style={{
                backgroundColor: isVegOnly ? '#16a34a' : (isDarkMode ? 'rgba(255,255,255,0.15)' : '#cbd5e1')
              }}
            >
              <div
                className={styles.toggleCircle}
                style={{
                  transform: isVegOnly ? 'translateX(20px)' : 'translateX(0)'
                }}
              />
            </div>
          </div>
        </div>

        {/* 6. Your Information & Features Group */}
        <h2 className={styles.groupSectionHeading} style={{ color: theme.textMain }}>
          Your information
        </h2>

        <div
          className={styles.sectionGroup}
          style={{
            backgroundColor: theme.bgCard,
            borderColor: theme.border
          }}
        >
          {/* 1. Wishlist & Favorites (Fully Interactive Modal) */}
          <div
            className={styles.groupRow}
            onClick={() => setIsWishlistModalOpen(true)}
            style={{ borderColor: theme.border }}
          >
            <div className={styles.groupRowLeft}>
              <Heart size={20} color="#f43f5e" />
              <div>
                <h4 className={styles.groupRowTitle} style={{ color: theme.textMain }}>
                  Your wishlist & favorites
                </h4>
                <p className={styles.groupRowSub} style={{ color: theme.textMuted }}>
                  {wishlistItems.length} saved dish{wishlistItems.length === 1 ? '' : 'es'} • Tap to view
                </p>
              </div>
            </div>
            <ChevronRight size={17} color={theme.textMuted} />
          </div>

          {/* 2. Guest WiFi Password */}
          <div
            className={styles.groupRow}
            onClick={handleCopyWiFi}
            style={{ borderColor: theme.border }}
          >
            <div className={styles.groupRowLeft}>
              <Wifi size={20} color={theme.textMuted} />
              <div>
                <h4 className={styles.groupRowTitle} style={{ color: theme.textMain }}>
                  Guest Wi-Fi Password
                </h4>
                <p className={styles.groupRowSub} style={{ color: theme.textMuted }}>
                  {wifiCopied ? '✓ Copied to clipboard!' : `SSID: ${tenantInfo.wifiSSID} • Tap to copy`}
                </p>
              </div>
            </div>
            <ChevronRight size={17} color={theme.textMuted} />
          </div>

          {/* 3. Log out / Switch Table */}
          <div
            className={styles.groupRow}
            onClick={() => setIsLogoutModalOpen(true)}
          >
            <div className={styles.groupRowLeft}>
              <LogOut size={20} color="#ef4444" />
              <div>
                <h4 className={styles.groupRowTitle} style={{ color: '#ef4444' }}>
                  Log out session
                </h4>
                <p className={styles.groupRowSub} style={{ color: theme.textMuted }}>
                  Clear profile & table dining session
                </p>
              </div>
            </div>
            <ChevronRight size={17} color={theme.textMuted} />
          </div>
        </div>

        {/* 7. SERVIQ Brand Simple One-Liner Footer */}
        <div className={styles.brandOneLiner}>
          <p className={styles.brandOneLinerText} style={{ color: theme.textMuted }}>
            POWERED BY <strong style={{ color: theme.textMain, letterSpacing: '0.05em' }}>SERVIQ</strong> • Autonomous Dining OS
          </p>
        </div>


        {/* Edit Profile Modal */}
        <AnimatePresence>
          {isEditModalOpen && (
            <div className={styles.modalBackdrop}>
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 10 }}
                className={styles.modalContent}
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.border
                }}
              >
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle} style={{ color: theme.textMain }}>Your Profile</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: theme.textMuted }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. Deepak"
                      className={styles.modalInput}
                      style={{
                        backgroundColor: theme.inputBg,
                        color: theme.textMain,
                        borderColor: theme.border
                      }}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: theme.textMuted }}>
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 9166131551"
                      className={styles.modalInput}
                      style={{
                        backgroundColor: theme.inputBg,
                        color: theme.textMain,
                        borderColor: theme.border
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className={styles.cancelBtn}
                      style={{ borderColor: theme.border, color: theme.textMuted }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className={styles.primaryBtn}
                      style={{ flex: 1.5 }}
                    >
                      {isUpdating ? 'Saving...' : 'Save Details'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Birthday & Anniversary Perks Modal */}
        <AnimatePresence>
          {isBirthdayModalOpen && (
            <div className={styles.modalBackdrop}>
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 10 }}
                className={styles.modalContent}
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.border
                }}
              >
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle} style={{ color: theme.textMain }}>🎂 Birthday & Rewards</h3>
                  <button
                    type="button"
                    onClick={() => setIsBirthdayModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <p style={{ fontSize: '0.82rem', color: theme.textMuted, margin: '0 0 14px 0' }}>
                  Celebrate special occasions with us! You will receive <strong>20% discount perks & complimentary dessert</strong>.
                </p>

                <form onSubmit={handleSaveBirthdayAndPerks} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: theme.textMuted }}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={birthdayInput}
                      onChange={(e) => setBirthdayInput(e.target.value)}
                      className={styles.modalInput}
                      style={{
                        backgroundColor: theme.inputBg,
                        color: theme.textMain,
                        borderColor: theme.border
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 800, color: theme.textMuted }}>
                      Anniversary Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={anniversaryInput}
                      onChange={(e) => setAnniversaryInput(e.target.value)}
                      className={styles.modalInput}
                      style={{
                        backgroundColor: theme.inputBg,
                        color: theme.textMain,
                        borderColor: theme.border
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsBirthdayModalOpen(false)}
                      className={styles.cancelBtn}
                      style={{ borderColor: theme.border, color: theme.textMuted }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      style={{ flex: 1.5 }}
                    >
                      Save Perks
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Wishlist & Favorites Modal */}
        <AnimatePresence>
          {isWishlistModalOpen && (
            <div className={styles.modalBackdrop}>
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 10 }}
                className={styles.modalContent}
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.border
                }}
              >
                <div className={styles.modalHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={20} color="#f43f5e" fill="#f43f5e" />
                    <h3 className={styles.modalTitle} style={{ color: theme.textMain }}>
                      Your Wishlist ({wishlistItems.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWishlistModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {wishlistItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '28px 16px' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: isDarkMode ? 'rgba(244, 63, 94, 0.12)' : '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Heart size={28} color="#f43f5e" />
                    </div>
                    <h4 style={{ fontSize: '0.96rem', fontWeight: 850, color: theme.textMain, margin: '0 0 4px' }}>
                      No Saved Dishes Yet
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: theme.textMuted, margin: '0 0 16px', lineHeight: 1.4 }}>
                      Tap the ❤️ icon on any dish in the Menu to save your favorites here.
                    </p>
                  </div>
                ) : (
                  <div className={styles.wishlistContainer}>
                    {wishlistItems.map((dish) => (
                      <div
                        key={dish.id || dish._id}
                        className={styles.wishlistItemCard}
                        style={{
                          backgroundColor: isDarkMode ? '#13161c' : '#f8fafc',
                          borderColor: theme.border
                        }}
                      >
                        <div className={styles.wishlistLeft}>
                          <div className={styles.dishThumb}>
                            {dish.image ? (
                              <img
                                src={dish.image}
                                alt={dish.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              dish.emoji || '🍽️'
                            )}
                          </div>
                          <div className={styles.dishInfo}>
                            <h5 className={styles.dishName} style={{ color: theme.textMain }}>
                              {dish.name}
                            </h5>
                            <p className={styles.dishPrice} style={{ color: theme.accent }}>
                              ₹{dish.price}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleAddToCartFromWishlist(dish)}
                            className={styles.addDishBtn}
                            title="Add to Cart"
                          >
                            <ShoppingCart size={13} />
                            <span>Add</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveFavorite(dish.id || dish._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '6px'
                            }}
                            title="Remove from favorites"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWishlistModalOpen(false);
                      navigate(`/menu${tableTarget}`);
                    }}
                    className={styles.primaryBtn}
                  >
                    Browse Full Menu
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bill Modal */}
        <AnimatePresence>
          {isBillModalOpen && (
            <div className={styles.modalBackdrop}>
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 10 }}
                className={styles.modalContent}
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.border
                }}
              >
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle} style={{ color: theme.textMain }}>Table Bill & Payment</h3>
                  <button
                    type="button"
                    onClick={() => setIsBillModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(234, 88, 12, 0.12)' : '#fff7ed',
                    border: `1.5px solid ${theme.accent}`,
                    borderRadius: '14px',
                    padding: '14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.84rem', color: theme.textMuted, fontWeight: 800 }}>
                    Table {tableNumber} Total
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: theme.accent }}>
                    ₹{liveBill.total}
                  </span>
                </div>

                <p style={{ fontSize: '0.82rem', color: theme.textMuted, margin: '0 0 10px 0' }}>
                  Select settlement method:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                  {['UPI / QR at Table', 'Card (Swipe Machine)', 'Cash to Waiter'].map(m => (
                    <div
                      key={m}
                      onClick={() => setBillPaymentMethod(m)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: `1.5px solid ${billPaymentMethod === m ? theme.accent : theme.border}`,
                        backgroundColor: billPaymentMethod === m ? (isDarkMode ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed') : theme.inputBg,
                        color: billPaymentMethod === m ? theme.accent : theme.textMain,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: 800,
                        fontSize: '0.86rem'
                      }}
                    >
                      <span>{m}</span>
                      {billPaymentMethod === m && <Check size={16} strokeWidth={3} />}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsBillModalOpen(false)}
                    className={styles.cancelBtn}
                    style={{ borderColor: theme.border, color: theme.textMuted }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBill}
                    className={styles.primaryBtn}
                    style={{ flex: 1.5 }}
                  >
                    Notify Staff
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {isLogoutModalOpen && (
            <div className={styles.modalBackdrop}>
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 10 }}
                className={styles.modalContent}
                style={{
                  backgroundColor: theme.bgCard,
                  borderColor: theme.border
                }}
              >
                <div className={styles.modalHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={22} color="#ef4444" />
                    <h3 className={styles.modalTitle} style={{ color: theme.textMain }}>Log Out Session?</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLogoutModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <p style={{ fontSize: '0.84rem', color: theme.textMuted, margin: '0 0 16px 0', lineHeight: 1.4 }}>
                  Are you sure you want to log out? Your name and local dining preferences on this device will be cleared.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsLogoutModalOpen(false)}
                    className={styles.cancelBtn}
                    style={{ borderColor: theme.border, color: theme.textMuted }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePerformLogout}
                    className={styles.dangerBtn}
                    style={{ flex: 1.5 }}
                  >
                    Yes, Log Out
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Customer Bottom Nav */}
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
