import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./OrderStatus.module.css";
import axios from "axios";
import {
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  Plus,
  ChevronLeft,
  Receipt,
  Sparkles,
  Utensils,
  Moon,
  Sun,
  AlertCircle,
  Layers,
  Wallet,
  Check,
  MessageSquare,
  Star,
  X,
  Banknote,
  QrCode,
  Smartphone,
  Copy,
  ExternalLink,
  Clock,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { encodeTableToken } from "../utils/tableToken";
import { API_URL as API, SOCKET_URL } from "../config/api";
import { io } from "socket.io-client";
import RestaurantCafeLottieLoader from "./RestaurantCafeLottieLoader";
import TableBadge from "./common/TableBadge";
import CustomerBottomNav from "./common/CustomerBottomNav";
import { openWhatsappBill } from "../utils/whatsappBillSender";
import { QRCodeSVG } from "qrcode.react";
import { GPayIcon, PhonePeIcon, PaytmIcon, BhimIcon, buildUpiUri, buildAppSpecificUpiUri } from "./common/UpiBrandLogos";

const OrderStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRoundIndex, setActiveRoundIndex] = useState(null);

  const tabsContainerRef = useRef(null);
  const activeTabRef = useRef(null);
  const lastKnownStatusRef = useRef(null);

  // Customer Experience Rating States
  const [ratingStars, setRatingStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [selectedRatingTags, setSelectedRatingTags] = useState([]);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingDismissed, setRatingDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(`rating_dismissed_${id}`) === 'true';
    } catch {
      return false;
    }
  });
  const [hasRated, setHasRated] = useState(() => {
    try {
      return localStorage.getItem(`rating_done_${id}`) === 'true';
    } catch {
      return false;
    }
  });

  // Get Bill & Payment Mode Modal States
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billPaymentMethod, setBillPaymentMethod] = useState('UPI'); // 'UPI' or 'Cash'
  const [isRequestingBill, setIsRequestingBill] = useState(false);
  const [billPhoneInput, setBillPhoneInput] = useState(() => {
    try {
      return localStorage.getItem('customer_phone') || '';
    } catch {
      return '';
    }
  });
  const [sendWhatsappCopy, setSendWhatsappCopy] = useState(true);
  const [billRequestedStatus, setBillRequestedStatus] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`serviq_bill_req_${id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const RATING_TAGS = [
    "Delicious Food 🍲",
    "Quick Service ⚡",
    "Polite Staff 🤝",
    "Cozy Ambience ✨",
    "Value for Money 💰",
    "Super Clean 🧼"
  ];

  const handleToggleTag = (tag) => {
    setSelectedRatingTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSkipRating = () => {
    try {
      sessionStorage.setItem(`rating_dismissed_${id}`, 'true');
    } catch { }
    setRatingDismissed(true);
  };

  const handleSubmitRating = async () => {
    if (!order?._id) return;
    setIsSubmittingRating(true);
    try {
      await axios.post(`${API}/orders/${order._id}/rate`, {
        rating: ratingStars || 5,
        feedback: feedbackComment,
        feedbackTags: selectedRatingTags
      });
      try {
        localStorage.setItem(`rating_done_${id}`, 'true');
      } catch { }
      setHasRated(true);
      toast.success("Thank you for your feedback! ⭐", { icon: '🎉' });
    } catch (err) {
      console.error("Submit rating error:", err);
      toast.error("Could not save rating. Please try again.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Request browser notification permission for mobile notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => { });
      }
    }
  }, []);

  const triggerMobileNotification = (status, tableNum) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const tableLabel = tableNum ? `Table ${tableNum}` : 'Your Table';
    let title = `Order Update • ${tableLabel}`;
    let body = 'Your order status has been updated.';

    if (status === 'preparing') {
      body = 'Chef is crafting your delicious meal in the kitchen! 👨‍🍳';
    } else if (status === 'ready') {
      body = 'Your food is ready! Serving to your table shortly. 🍽️';
    } else if (status === 'completed') {
      body = 'Order served! Enjoy your meal. ✨';
    } else if (status === 'cancelled') {
      body = 'Your order has been cancelled.';
    } else {
      return;
    }

    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200]
          });
        }).catch(() => {
          new Notification(title, { body, icon: '/favicon.ico' });
        });
      } else {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    } catch (e) {
      console.warn('Native mobile notification notice:', e);
    }
  };

  // Dark mode state matching rest of the application
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("isDarkMode");
      return saved !== null ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Smoothly center active round tab horizontally inside container ONLY when active tab changes
  useEffect(() => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const scrollTarget = tab.offsetLeft - (container.offsetWidth / 2) + (tab.offsetWidth / 2);
      container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
    }
  }, [activeRoundIndex, order]);

  // Sync customer phone if loaded from order (MUST be placed before early returns)
  useEffect(() => {
    if (order?.customerPhone && !billPhoneInput) {
      setBillPhoneInput(order.customerPhone);
    }
  }, [order?.customerPhone, billPhoneInput]);

  const theme = {
    bgPage: isDarkMode ? '#120d09' : '#f8fafc',
    bgCard: isDarkMode ? '#1a130e' : '#ffffff',
    cardInner: isDarkMode ? '#221a13' : '#ffffff',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#ea580c',
    accentGlow: 'rgba(234, 88, 12, 0.35)',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    chipBg: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    stepInactive: isDarkMode ? '#241c14' : '#f1f5f9'
  };

  const steps = [
    { id: 'pending', label: 'Order Placed', subtext: 'Received in kitchen', icon: ShoppingBag },
    { id: 'preparing', label: 'In Preparation', subtext: 'Chef is crafting & preparing your dish', icon: ChefHat },
    { id: 'completed', label: 'Completed', subtext: 'Served • Enjoy your meal', icon: CheckCircle2 },
  ];

  // Intercept browser Back button: Always navigate to Menu instead of returning to Cart
  useEffect(() => {
    const handlePopState = () => {
      const tbl = order?.tableNumber || localStorage.getItem('serviq_last_table') || '';
      const token = tbl ? encodeTableToken(tbl) : '';
      navigate(`/menu${token ? `?t=${encodeURIComponent(token)}` : ''}`, { replace: true });
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, order?.tableNumber]);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError("Invalid Order ID");
      setLoading(false);
      return;
    }

    let interval;
    let socket;

    const fetchOrder = async () => {
      try {
        let sessionIds = [];
        try {
          const raw = localStorage.getItem('serviq_session_orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) sessionIds = parsed;
          }
          if (!sessionIds.includes(id)) {
            sessionIds.push(id);
          }
        } catch (e) { }

        const res = await axios.get(`${API}/orders/status/${id}`, {
          params: sessionIds.length > 0 ? { sessionIds: sessionIds.join(',') } : {}
        });
        const currentOrder = res.data;

        let allOrders = currentOrder.sessionOrders && currentOrder.sessionOrders.length > 0
          ? [...currentOrder.sessionOrders]
          : [currentOrder];

        // Store only active UNPAID session order IDs into localStorage so customer never loses added rounds, but cleared tables reset
        try {
          if (currentOrder.paymentStatus === 'paid' && allOrders.every(o => o.paymentStatus === 'paid')) {
            localStorage.removeItem('serviq_session_orders');
          } else {
            const activeUnpaidIds = allOrders.filter(o => o.paymentStatus !== 'paid').map(o => o._id).filter(Boolean);
            if (activeUnpaidIds.length > 0) {
              localStorage.setItem('serviq_session_orders', JSON.stringify(activeUnpaidIds));
            } else {
              localStorage.removeItem('serviq_session_orders');
            }
          }
        } catch (e) { }

        allOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const mergedOrder = {
          ...currentOrder,
          sessionOrders: allOrders.length > 0 ? allOrders : [currentOrder]
        };

        setOrder(prevOrder => {
          // If session orders increased or newly fetched, auto-focus active round
          if (!prevOrder || mergedOrder.sessionOrders.length !== (prevOrder?.sessionOrders?.length || 1)) {
            const activeIdx = mergedOrder.sessionOrders.findIndex(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
            if (activeIdx !== -1) {
              setActiveRoundIndex(activeIdx);
            } else {
              setActiveRoundIndex(mergedOrder.sessionOrders.length - 1);
            }
          }
          return mergedOrder;
        });

        // Trigger native mobile notification if status changed
        const latestStatus = currentOrder.status;
        if (lastKnownStatusRef.current && lastKnownStatusRef.current !== latestStatus) {
          triggerMobileNotification(latestStatus, currentOrder.tableNumber);
        }
        lastKnownStatusRef.current = latestStatus;

        setLoading(false);
      } catch (err) {
        console.error("Fetch order error:", err);
        setError("Order not found or invalid ID");
        setLoading(false);
      }
    };

    fetchOrder();

    // Continuous 2.5s polling loop to immediately catch owner POS added rounds
    interval = setInterval(fetchOrder, 2500);

    // Socket.io real-time event listener for 0ms latency sync
    try {
      socket = io(SOCKET_URL, { transports: ['websocket', 'polling'], timeout: 6000 });
      const currentTenantId = localStorage.getItem('tenantId');
      if (currentTenantId) {
        socket.emit('joinTenant', String(currentTenantId));
      }
      socket.on('newOrder', () => fetchOrder());
      socket.on('orderUpdate', () => fetchOrder());
      socket.on('tablesUpdated', () => fetchOrder());
    } catch (e) {
      console.warn("Socket initialization note:", e);
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [id]);

  if (loading) {
    const cafeName = order?.tenantId?.name || localStorage.getItem('restaurant_name') || "DINEVIQ Gourmet Bistro";
    const cafeLogo = order?.tenantId?.logo || localStorage.getItem('restaurant_logo') || null;
    const tableNum = order?.tableNumber || localStorage.getItem('tableNumber') || "1";

    return (
      <div className={styles.centerBox} style={{ backgroundColor: theme.bgPage, color: theme.textMain, justifyContent: 'center' }}>
        <RestaurantCafeLottieLoader
          cafeName={cafeName}
          tableNumber={tableNum}
          cafeLogo={cafeLogo}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.centerBox} style={{ backgroundColor: theme.bgPage, color: theme.textMain }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px' }}>{error || "Order Not Found"}</h3>
        <p style={{ fontSize: '0.88rem', color: theme.textMuted, margin: '0 0 1.25rem' }}>We couldn't retrieve details for this order.</p>
        <Link
          to="/menu"
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            backgroundColor: theme.accent,
            color: '#fff',
            fontWeight: 800,
            textDecoration: 'none',
            fontSize: '0.9rem'
          }}
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  const sessionOrders = (order.sessionOrders && order.sessionOrders.length > 0) ? order.sessionOrders : [order];
  const hasMultipleRounds = sessionOrders.length > 1;
  const currentIdx = activeRoundIndex !== null && activeRoundIndex < sessionOrders.length ? activeRoundIndex : (sessionOrders.length - 1);
  const trackedOrder = sessionOrders[currentIdx] || order;

  const getStepIndex = (status) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'completed' || s === 'served') return 2;
    if (s === 'ready' || s === 'preparing') return 1; // ready to serve is included in preparing step
    return 0; // pending
  };

  const currentStepIndex = getStepIndex(trackedOrder.status);
  const isCancelled = trackedOrder.status === 'cancelled';
  const isCompleted = trackedOrder.status === 'completed' || trackedOrder.status === 'served';
  const tableNumStr = order.tableNumber || localStorage.getItem('tableNumber') || '1';
  const tableToken = tableNumStr ? encodeTableToken(tableNumStr) : '';
  const tableTarget = tableToken ? `?t=${encodeURIComponent(tableToken)}` : '';
  const orderNumStr = trackedOrder.orderNumber ? `#${trackedOrder.orderNumber}` : (trackedOrder._id ? `#${trackedOrder._id.slice(-6).toUpperCase()}` : '#ORD');

  const getStatusBadgeInfo = (st) => {
    switch (st) {
      case 'completed':
      case 'served':
        return { text: '✓ Served', bg: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5', color: '#059669' };
      case 'ready':
      case 'preparing':
        return { text: '● In Kitchen', bg: isDarkMode ? 'rgba(234, 88, 12, 0.16)' : '#fff7ed', color: '#ea580c' };
      case 'cancelled':
        return { text: '✕ Cancelled', bg: isDarkMode ? 'rgba(239, 68, 68, 0.16)' : '#fef2f2', color: '#dc2626' };
      default:
        return { text: '● Placed', bg: isDarkMode ? 'rgba(234, 88, 12, 0.16)' : '#fff7ed', color: '#ea580c' };
    }
  };

  const stepMeta = [
    { id: 'pending', label: 'Order Placed', icon: ShoppingBag, activeText: '● Placed', doneText: '✓ Placed' },
    { id: 'preparing', label: 'In Preparation', icon: ChefHat, activeText: '● In Kitchen', doneText: '✓ Prepared' },
    { id: 'completed', label: 'Completed', icon: Utensils, activeText: '✓ Served', doneText: '✓ Served' },
  ];

  // Compute total running bill across all rounds
  const totalRunningAmount = Math.round(
    hasMultipleRounds
      ? sessionOrders.reduce((sum, ord) => {
        const sumItems = ord.items ? ord.items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0) : 0;
        return sum + Number(ord.settledAmount || (sumItems > 0 ? sumItems : ord.total) || 0);
      }, 0)
      : (() => {
        const sumItems = order?.items ? order.items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0) : 0;
        return Number(order?.settledAmount || (sumItems > 0 ? sumItems : order?.total) || 0);
      })()
  );

  const isAllOrdersPaid = sessionOrders.every(o => o.paymentStatus === 'paid');

  const tenantSettings = order?.tenantId?.settings || {};
  const cleanUpiId = (tenantSettings.upiId || localStorage.getItem('tenant_upi_id') || '').trim();
  const cafePayeeName = order?.tenantId?.name || localStorage.getItem('restaurant_name') || 'DINEVIQ CAFE';
  const upiUri = cleanUpiId ? buildUpiUri({
    upiId: cleanUpiId,
    payeeName: cafePayeeName,
    amount: totalRunningAmount,
    note: `Table ${tableNumStr} Bill`
  }) : '';

  const handleConfirmBillRequest = async (chosenMethod = billPaymentMethod) => {
    if (isRequestingBill) return;
    setIsRequestingBill(true);

    try {
      const tid = order?.tenantId?._id || order?.tenantId || localStorage.getItem('tenantId');
      const custPhone = (billPhoneInput ? billPhoneInput.trim() : '') || order?.customerPhone || localStorage.getItem('customer_phone') || '';
      const custName = order?.customerName || localStorage.getItem('customer_name') || 'Guest Diner';

      await axios.post(`${API}/tables/service-request`, {
        tableNumber: tableNumStr,
        tenantId: tid,
        customerName: custName,
        customerPhone: custPhone,
        type: 'request_bill',
        paymentMethod: chosenMethod,
        amount: totalRunningAmount,
        orderIds: sessionOrders.map(o => o._id).filter(Boolean)
      });

      const statusObj = {
        requested: true,
        method: chosenMethod,
        timestamp: Date.now()
      };
      setBillRequestedStatus(statusObj);

      try {
        sessionStorage.setItem(`serviq_bill_req_${id}`, JSON.stringify(statusObj));
        if (custPhone) {
          localStorage.setItem('customer_phone', custPhone);
        }
      } catch (e) { }

      // If user opted for WhatsApp bill and has valid 10 digits
      if (sendWhatsappCopy && custPhone && custPhone.replace(/\D/g, '').length >= 10) {
        try {
          await openWhatsappBill(order, order.tenantId, custPhone);
        } catch (waErr) { }
      }

      if (chosenMethod === 'UPI') {
        toast.success(`🛎️ Bill requested for Table ${tableNumStr}! Staff notified for UPI payment.`, { duration: 4500, icon: '📱' });
      } else {
        toast.success(`🛎️ Bill requested for Table ${tableNumStr}! Staff notified for Cash payment.`, { duration: 4500, icon: '💵' });
      }

      setIsBillModalOpen(false);
    } catch (err) {
      console.error('Request bill error:', err);
      toast.error('Could not alert staff. Please notify staff directly.');
    } finally {
      setIsRequestingBill(false);
    }
  };

  return (
    <div className={styles.container} style={{ backgroundColor: theme.bgPage }}>
      <div className={styles.appContainer} style={{ backgroundColor: theme.bgCard, color: theme.textMain }}>

        {/* Sticky Top Header Bar */}
        <div
          className={styles.stickyHeader}
          style={{
            backgroundColor: isDarkMode ? 'rgba(26, 19, 14, 0.94)' : 'rgba(255, 255, 255, 0.94)',
            borderBottom: `1px solid ${theme.border}`
          }}
        >
          {/* Header Left: Compact Back Button + Title */}
          <div className={styles.headerLeft}>
            <button
              type="button"
              onClick={() => navigate(`/menu${tableTarget}`, { replace: true })}
              className={styles.backIconBtn}
              style={{
                backgroundColor: theme.chipBg,
                color: theme.textMain
              }}
              title="Back to Menu"
            >
              <ChevronLeft size={19} />
            </button>

            <h1 className={styles.headerTitle} style={{ color: theme.textMain }}>
              Order {orderNumStr}
            </h1>
          </div>

          {/* Header Right: Table Badge + Theme Toggle */}
          <div className={styles.headerRightGroup}>
            <TableBadge
              tableNumber={tableNumStr}
              isDarkMode={isDarkMode}
              style={{ padding: '4px 9px', fontSize: '0.8rem' }}
            />

            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={styles.themeToggleBtn}
              style={{
                backgroundColor: theme.chipBg,
                color: theme.textMain
              }}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={15} color="#fbbe24" /> : <Moon size={15} color="#64748b" />}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className={styles.contentBody}>

          {/* Multi-Round Segmented Control */}
          {hasMultipleRounds && (
            <div ref={tabsContainerRef} className={styles.roundSwitcherContainer}>
              <div
                className={styles.roundSegmentedTrack}
                style={{
                  backgroundColor: isDarkMode ? '#1e1711' : '#f1f5f9',
                  borderColor: theme.border
                }}
              >
                {sessionOrders.map((ord, idx) => {
                  const isTabActive = idx === currentIdx;
                  const bInfo = getStatusBadgeInfo(ord.status);

                  return (
                    <button
                      key={ord._id || idx}
                      ref={isTabActive ? activeTabRef : null}
                      type="button"
                      onClick={() => setActiveRoundIndex(idx)}
                      className={styles.roundSegmentTab}
                      style={{
                        backgroundColor: isTabActive ? (isDarkMode ? '#2c221a' : '#ffffff') : 'transparent',
                        color: isTabActive ? theme.textMain : theme.textMuted,
                        boxShadow: isTabActive ? '0 2px 8px rgba(0, 0, 0, 0.06)' : 'none',
                        border: isTabActive ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}` : '1px solid transparent'
                      }}
                    >
                      <span className={styles.roundSegmentTitle}>
                        Round {idx + 1}
                      </span>
                      <span
                        className={styles.roundSegmentStatus}
                        style={{
                          backgroundColor: bInfo.bg,
                          color: bInfo.color
                        }}
                      >
                        {bInfo.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Progress Tracker */}
          {isCancelled ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={styles.cancelledCard}
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.16), rgba(220, 38, 38, 0.06))'
                  : 'linear-gradient(135deg, #fff1f2, #fef2f2)',
                borderColor: isDarkMode ? 'rgba(220, 38, 38, 0.35)' : '#fecdd3'
              }}
            >
              <div className={styles.cancelledIconBadge}>
                <AlertCircle size={26} color="#dc2626" strokeWidth={2.5} />
              </div>

              <div className={styles.cancelledPill}>
                <span>● Cancelled by Kitchen</span>
              </div>

              <h3 className={styles.cancelledTitle} style={{ color: isDarkMode ? '#fecaca' : '#991b1b' }}>
                {hasMultipleRounds ? `Round ${currentIdx + 1} Has Been Cancelled` : 'Order Has Been Cancelled'}
              </h3>

              <p className={styles.cancelledSubtitle} style={{ color: isDarkMode ? '#f87171' : '#b91c1c' }}>
                This order was cancelled. Please speak with our restaurant staff or tap below to place fresh items.
              </p>
            </motion.div>
          ) : (
            <div
              className={styles.timelineCard}
              style={{
                backgroundColor: theme.cardInner,
                borderColor: theme.border
              }}
            >
              <div className={styles.timelineHeading} style={{ color: theme.textMuted }}>
                <span>
                  {hasMultipleRounds ? `Round ${currentIdx + 1} Kitchen Progress` : 'Kitchen Progress'}
                </span>
                {isCompleted ? (
                  <span style={{ color: '#059669', fontSize: '0.68rem', fontWeight: 800 }}>✓ Completed</span>
                ) : (
                  <span style={{ color: currentStepIndex === 0 ? '#16a34a' : '#ea580c', fontSize: '0.68rem', fontWeight: 800 }}>● In Progress</span>
                )}
              </div>

              <div className={styles.horizontalStepperWrapper}>
                {/* Background Connecting Track Line */}
                <div
                  className={styles.stepperTrackBase}
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'
                  }}
                >
                  <div
                    className={styles.stepperTrackFill}
                    style={{
                      width: currentStepIndex === 0 ? '0%' : (currentStepIndex === 1 ? '50%' : '100%'),
                      backgroundColor: '#ea580c'
                    }}
                  />
                </div>

                {/* 3 Step Nodes - Option 1: Single Continuous Brand Accent */}
                {stepMeta.map((meta, index) => {
                  const Icon = meta.icon;
                  const isPast = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;

                  let iconBg = isDarkMode ? '#1e1711' : '#f8fafc';
                  let iconColor = theme.textMuted;
                  let iconBorder = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0';
                  let textColor = theme.textMuted;
                  let subtextColor = theme.textMuted;

                  if (isPast) {
                    iconBg = '#ea580c';
                    iconColor = '#ffffff';
                    iconBorder = '#ea580c';
                    textColor = theme.textMain;
                    subtextColor = '#ea580c';
                  } else if (isCurrent) {
                    iconBg = '#ea580c';
                    iconColor = '#ffffff';
                    iconBorder = '#ea580c';
                    textColor = '#ea580c';
                    subtextColor = '#ea580c';
                  }

                  return (
                    <div key={meta.id} className={styles.hStepItem}>
                      <motion.div
                        initial={false}
                        animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                        transition={isCurrent ? { repeat: Infinity, duration: 2.2 } : {}}
                        className={styles.hStepIconBox}
                        style={{
                          backgroundColor: iconBg,
                          color: iconColor,
                          boxShadow: isCurrent
                            ? '0 0 0 4px rgba(234, 88, 12, 0.2), 0 4px 14px rgba(234, 88, 12, 0.45)'
                            : (isPast ? '0 2px 8px rgba(234, 88, 12, 0.25)' : 'none'),
                          border: `2px solid ${iconBorder}`
                        }}
                      >
                        {isPast ? (
                          <Check size={16} strokeWidth={3} color="#ffffff" />
                        ) : (
                          <Icon
                            size={16}
                            strokeWidth={isCurrent ? 2.5 : 2}
                            color={isCurrent ? '#ffffff' : theme.textMuted}
                          />
                        )}
                      </motion.div>

                      <h4
                        className={styles.hStepTitle}
                        style={{
                          color: textColor,
                          fontWeight: isCurrent ? 850 : 700
                        }}
                      >
                        {meta.label}
                      </h4>

                      <span
                        className={styles.hStepSubtext}
                        style={{
                          color: subtextColor
                        }}
                      >
                        {isPast ? meta.doneText : (isCurrent ? meta.activeText : 'Upcoming')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ordered Items Receipt Summary */}
          <div
            className={styles.receiptCard}
            style={{
              backgroundColor: theme.cardInner,
              borderColor: theme.border
            }}
          >
            <div className={styles.receiptHeader}>
              <h3 className={styles.receiptTitle} style={{ color: theme.textMain }}>
                <Receipt size={16} color={theme.textMuted} />
                <span>Order Summary</span>
                {hasMultipleRounds && (
                  <span
                    style={{
                      fontSize: '0.67rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '5px',
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                      color: theme.textMuted,
                      letterSpacing: '0px',
                      textTransform: 'none'
                    }}
                  >
                    {sessionOrders.length} Rounds
                  </span>
                )}
              </h3>
              <span
                className={styles.paymentBadge}
                style={{
                  backgroundColor: order.paymentStatus === 'paid' ? (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : (isDarkMode ? 'rgba(99, 102, 241, 0.14)' : '#eef2ff'),
                  color: order.paymentStatus === 'paid' ? '#059669' : '#4f46e5',
                  border: order.paymentStatus === 'paid' ? '1px solid #a7f3d0' : (isDarkMode ? '1px solid rgba(99, 102, 241, 0.28)' : '1px solid #c7d2fe'),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {order.paymentStatus === 'paid' ? (
                  <>
                    <Check size={11} strokeWidth={3} /> Paid Online
                  </>
                ) : (
                  <>
                    <Wallet size={11} strokeWidth={2.4} /> Pay at Counter
                  </>
                )}
              </span>
            </div>

            {sessionOrders.map((ord, rIdx) => {
              const isCurrentOrd = rIdx === currentIdx;
              const roundNum = rIdx + 1;
              const roundCode = ord.orderNumber ? `#${ord.orderNumber}` : (ord._id ? `#${ord._id.slice(-6).toUpperCase()}` : `#${roundNum}`);
              const bInfo = getStatusBadgeInfo(ord.status);
              const itemsSum = ord.items ? ord.items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0) : 0;
              const roundSubtotal = Number(ord.settledAmount || (itemsSum > 0 ? itemsSum : ord.total) || 0);

              return (
                <div
                  key={ord._id || rIdx}
                  className={hasMultipleRounds ? styles.roundSection : ''}
                  style={{ cursor: hasMultipleRounds ? 'pointer' : 'default' }}
                  onClick={() => hasMultipleRounds && setActiveRoundIndex(rIdx)}
                >
                  {hasMultipleRounds && (
                    <div className={styles.roundHeaderRow}>
                      <span className={styles.roundTitle} style={{ color: theme.textMain }}>
                        Round {roundNum} • {roundCode}
                        {ord.isDirect && (
                          <span style={{ fontSize: '0.66rem', color: '#ea580c', fontWeight: 800, marginLeft: 5 }}>
                            ⚡ Direct
                          </span>
                        )}
                        {isCurrentOrd && (
                          <span style={{ fontSize: '0.66rem', color: theme.accent, textTransform: 'none', fontWeight: 800 }}>
                            (Tracking)
                          </span>
                        )}
                      </span>
                      <span
                        className={styles.roundStatusPill}
                        style={{
                          backgroundColor: bInfo.bg,
                          color: bInfo.color
                        }}
                      >
                        {bInfo.text}
                      </span>
                    </div>
                  )}

                  <div className={styles.itemsList}>
                    {ord.items && ord.items.map((item, i) => {
                      const cleanItemName = item.name
                        ? item.name.split(' + ')[0].replace(/\s*\((?:[^)(]+|\([^)(]*\))*\)+$/, '').trim()
                        : item.name;

                      const varName = item.variant ? (typeof item.variant === 'object' ? (item.variant.name || item.variant.size) : String(item.variant)) : null;
                      const itemAddons = Array.isArray(item.addons) ? item.addons : [];
                      const notes = item.specialNotes || item.notes || '';

                      return (
                        <div key={i} className={styles.itemRow}>
                          <span
                            className={styles.itemQtyBadge}
                            style={{
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                              color: isDarkMode ? '#cbd5e1' : '#475569',
                              border: `1px solid ${theme.border}`
                            }}
                          >
                            {item.quantity}×
                          </span>

                          <div className={styles.itemDetails}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <p className={styles.itemName} style={{ color: theme.textMain }}>
                                {cleanItemName}
                              </p>
                              <span className={styles.itemPrice} style={{ color: theme.textMain }}>
                                ₹{Math.round(item.price * item.quantity)}
                              </span>
                            </div>

                            {(varName || itemAddons.length > 0) && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                                {varName && (
                                  <span
                                    className={styles.itemVariantPill}
                                    style={{
                                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                                      color: isDarkMode ? '#cbd5e1' : '#64748b',
                                      border: `1px solid ${theme.border}`
                                    }}
                                  >
                                    {varName}
                                  </span>
                                )}
                                {itemAddons.map((a, aIdx) => (
                                  <span
                                    key={aIdx}
                                    className={styles.itemVariantPill}
                                    style={{
                                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                                      color: theme.textMuted,
                                      border: `1px solid ${theme.border}`
                                    }}
                                  >
                                    +{a.name || a}
                                  </span>
                                ))}
                              </div>
                            )}

                            {notes && (
                              <p className={styles.itemNotes} style={{ color: theme.textMuted }}>
                                "{notes}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {hasMultipleRounds && (
                    <div className={styles.roundSubtotalRow} style={{ color: theme.textMuted }}>
                      <span>Round {roundNum} Total</span>
                      <span style={{ color: theme.textMain }}>₹{Math.round(roundSubtotal)}</span>
                    </div>
                  )}
                </div>
              );
            })}

            <div className={styles.receiptTotalRow}>
              <span className={styles.totalLabel} style={{ color: theme.textMain }}>
                {hasMultipleRounds ? 'Total Running Bill' : 'Total Amount'}
              </span>
              <span className={styles.totalAmount} style={{ color: theme.accent }}>
                ₹{totalRunningAmount}
              </span>
            </div>

            {/* Bill & Payment Request CTA */}
            {isAllOrdersPaid ? (
              <button
                type="button"
                onClick={() => openWhatsappBill(order, order.tenantId, billPhoneInput)}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #bbf7d0',
                  background: '#f0fdf4',
                  color: '#15803d',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.08)'
                }}
              >
                <MessageSquare size={17} color="#16a34a" />
                <span>✓ Bill Paid • Get E-Bill on WhatsApp</span>
              </button>
            ) : billRequestedStatus?.requested ? (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #16a34a',
                    background: '#dcfce7',
                    color: '#15803d',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 3px 10px rgba(22, 163, 74, 0.15)'
                  }}
                >
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span>✓ Bill Requested ({billRequestedStatus.method}) • Staff Notified</span>
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                    🛎️ Staff is bringing your bill ({billRequestedStatus.method})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBillModalOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.accent,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    Change payment mode
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsBillModalOpen(true)}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #86efac',
                  background: '#f0fdf4',
                  color: '#15803d',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.12)'
                }}
              >
                <Receipt size={18} color="#16a34a" />
                <span>💬 Get Bill (UPI / Cash)</span>
              </button>
            )}
          </div>

          {/* Primary CTA: + Add More Items */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => navigate(`/menu${tableTarget}`, { replace: true })}
            className={styles.addMoreBtn}
          >
            <Plus size={18} strokeWidth={3} />
            <span>Add More Items</span>
          </motion.button>

          {/* Rated Acknowledgment Badge */}
          {(order.rating || hasRated) && (
            <div style={{
              margin: '14px 0',
              padding: '12px 16px',
              borderRadius: '14px',
              background: isDarkMode ? '#271f18' : '#fffbeb',
              border: isDarkMode ? '1px solid #4a3b2c' : '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#d97706',
              fontSize: '0.82rem',
              fontWeight: 800
            }}>
              <Sparkles size={16} />
              <span>Thank you for rating your dining experience! ⭐</span>
            </div>
          )}

          {/* Footer */}
          <footer className={styles.footer}>
            <p className={styles.footerSubtitle} style={{ color: theme.textMuted }}>
              Table: <strong>{tableNumStr}</strong> — Enjoy your dining experience!
            </p>
            <p className={styles.poweredBy} style={{ color: theme.textMuted }}>
              Powered by <span style={{ color: theme.accent, fontWeight: '800' }}>DINEVIQ OS</span>
            </p>
          </footer>

        </div>

        {/* Customer Experience 5-Star Rating Modal */}
        <AnimatePresence>
          {(isCompleted || order.paymentStatus === 'paid') && !order.rating && !ratingDismissed && !hasRated && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999999,
              background: 'rgba(15, 23, 42, 0.72)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                style={{
                  width: '100%',
                  maxWidth: '420px',
                  background: isDarkMode ? '#1e1b18' : '#ffffff',
                  color: theme.textMain,
                  borderRadius: '24px',
                  padding: '24px 20px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                  border: isDarkMode ? '1px solid #382d24' : '1px solid #f1f5f9',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                {/* Skip button top right */}
                <button
                  type="button"
                  onClick={handleSkipRating}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    border: 'none',
                    background: isDarkMode ? '#2d241d' : '#f1f5f9',
                    color: theme.textMuted,
                    borderRadius: '100px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Skip</span>
                  <X size={14} />
                </button>

                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)'
                }}>
                  <Sparkles size={28} color="#d97706" />
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 4px', color: theme.textMain }}>
                  How was your experience?
                </h3>
                <p style={{ fontSize: '0.82rem', color: theme.textMuted, margin: '0 0 16px' }}>
                  Table {tableNumStr} • Order #{orderNumStr.replace('#', '')}
                </p>

                {/* 5 Interactive Stars */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverStars || ratingStars) >= star;
                    return (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setHoverStars(star)}
                        onMouseLeave={() => setHoverStars(0)}
                        onClick={() => setRatingStars(star)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Star
                          size={34}
                          color={isFilled ? '#f59e0b' : (isDarkMode ? '#44382e' : '#cbd5e1')}
                          fill={isFilled ? '#f59e0b' : 'none'}
                          strokeWidth={2}
                        />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Dynamic Star Feedback Label */}
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f59e0b', marginBottom: '16px' }}>
                  {ratingStars === 5 && 'Exceptional! 🌟'}
                  {ratingStars === 4 && 'Very Good! 😃'}
                  {ratingStars === 3 && 'Good 😊'}
                  {ratingStars === 2 && 'Fair 😐'}
                  {ratingStars === 1 && 'Needs Improvement 😞'}
                </div>

                {/* Quick Sentiment Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
                  {RATING_TAGS.map(tag => {
                    const isSelected = selectedRatingTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        style={{
                          padding: '6px 11px',
                          borderRadius: '100px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          border: isSelected ? '1.5px solid #f59e0b' : `1px solid ${theme.border}`,
                          background: isSelected ? (isDarkMode ? '#3b2f1e' : '#fffbeb') : (isDarkMode ? '#241c16' : '#f8fafc'),
                          color: isSelected ? '#d97706' : theme.textMuted,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Optional Comment Input */}
                <textarea
                  rows={2}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us what you loved (optional)..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                    background: isDarkMode ? '#17120e' : '#f8fafc',
                    color: theme.textMain,
                    padding: '10px 12px',
                    fontSize: '0.82rem',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    marginBottom: '16px'
                  }}
                />

                {/* Buttons Row */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleSkipRating}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '14px',
                      border: `1px solid ${theme.border}`,
                      background: 'transparent',
                      color: theme.textMuted,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Skip
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={isSubmittingRating}
                    onClick={handleSubmitRating}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)'
                    }}
                  >
                    {isSubmittingRating ? 'Submitting...' : 'Submit Review ⭐'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bill Request & Payment Mode Modal */}
        <AnimatePresence>
          {isBillModalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999998,
                background: 'rgba(15, 23, 42, 0.72)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: '0'
              }}
              onClick={() => setIsBillModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  backgroundColor: theme.bgCard,
                  color: theme.textMain,
                  borderRadius: '24px 24px 0 0',
                  padding: '20px 20px 30px',
                  boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
                  border: `1px solid ${theme.border}`,
                  borderBottom: 'none'
                }}
              >
                {/* Modal Handle Pill */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: isDarkMode ? '#475569' : '#cbd5e1' }} />
                </div>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Receipt size={22} color={theme.accent} />
                      Request Bill
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: theme.textMuted }}>
                      Table <strong>{tableNumStr}</strong> • {hasMultipleRounds ? 'Total Running Bill' : 'Total Amount'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBillModalOpen(false)}
                    style={{
                      background: isDarkMode ? '#334155' : '#f1f5f9',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: theme.textMuted
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Amount Banner */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: isDarkMode ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.15) 0%, rgba(249, 115, 22, 0.05) 100%)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                  border: `1px solid ${isDarkMode ? 'rgba(234, 88, 12, 0.3)' : '#fed7aa'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '18px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: theme.accent, fontWeight: 700 }}>
                      Payable Amount
                    </div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 900, color: theme.textMain }}>
                      ₹{totalRunningAmount}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: theme.accent,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}>
                    {sessionOrders.length} Round{sessionOrders.length > 1 ? 's' : ''}
                  </div>
                </div>

                {/* Section Title */}
                <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '10px', color: theme.textMain }}>
                  Select How You Want to Pay:
                </div>

                {/* Payment Option Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {/* UPI Option */}
                  <div
                    onClick={() => setBillPaymentMethod('UPI')}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '14px',
                      border: billPaymentMethod === 'UPI' ? `2px solid ${theme.accent}` : `1.5px solid ${theme.border}`,
                      backgroundColor: billPaymentMethod === 'UPI' ? (isDarkMode ? 'rgba(234, 88, 12, 0.12)' : '#fff7ed') : (isDarkMode ? '#1e1814' : '#fafafa'),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {billPaymentMethod === 'UPI' && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: theme.accent,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <QrCode size={24} color={billPaymentMethod === 'UPI' ? theme.accent : theme.textMuted} style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: theme.textMain }}>
                      UPI / Online
                    </div>
                    <div style={{ fontSize: '0.7rem', color: theme.textMuted, marginTop: '2px', lineHeight: 1.2 }}>
                      GPay, PhonePe, Paytm, QR
                    </div>
                  </div>

                  {/* Cash Option */}
                  <div
                    onClick={() => setBillPaymentMethod('Cash')}
                    style={{
                      padding: '14px 12px',
                      borderRadius: '14px',
                      border: billPaymentMethod === 'Cash' ? `2px solid #16a34a` : `1.5px solid ${theme.border}`,
                      backgroundColor: billPaymentMethod === 'Cash' ? (isDarkMode ? 'rgba(22, 163, 74, 0.12)' : '#f0fdf4') : (isDarkMode ? '#1e1814' : '#fafafa'),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {billPaymentMethod === 'Cash' && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <Banknote size={24} color={billPaymentMethod === 'Cash' ? '#16a34a' : theme.textMuted} style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: theme.textMain }}>
                      Cash to Waiter
                    </div>
                    <div style={{ fontSize: '0.7rem', color: theme.textMuted, marginTop: '2px', lineHeight: 1.2 }}>
                      Pay cash at table with bill
                    </div>
                  </div>
                </div>

                {/* Dynamic Details based on chosen mode */}
                {billPaymentMethod === 'UPI' ? (
                  <div style={{
                    padding: '14px',
                    borderRadius: '14px',
                    backgroundColor: isDarkMode ? '#1a130e' : '#f8fafc',
                    border: `1px solid ${theme.border}`,
                    marginBottom: '16px'
                  }}>
                    {cleanUpiId ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{
                          backgroundColor: '#ffffff',
                          padding: '10px',
                          borderRadius: '12px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                          border: '1px solid #e2e8f0',
                          lineHeight: 0,
                          marginBottom: '8px'
                        }}>
                          <QRCodeSVG
                            value={upiUri}
                            size={135}
                            level="M"
                          />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: theme.textMain }}>
                          Scan to Pay ₹{totalRunningAmount} via Any UPI App
                        </span>

                        {/* 1-Tap UPI Launch Buttons */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const uri = buildAppSpecificUpiUri('gpay', { upiId: cleanUpiId, payeeName: cafePayeeName, amount: totalRunningAmount, note: `Table ${tableNumStr} Bill` });
                              window.location.href = uri;
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <GPayIcon size={18} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>GPay</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const uri = buildAppSpecificUpiUri('phonepe', { upiId: cleanUpiId, payeeName: cafePayeeName, amount: totalRunningAmount, note: `Table ${tableNumStr} Bill` });
                              window.location.href = uri;
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <PhonePeIcon size={18} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#5f259f' }}>PhonePe</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const uri = buildAppSpecificUpiUri('paytm', { upiId: cleanUpiId, payeeName: cafePayeeName, amount: totalRunningAmount, note: `Table ${tableNumStr} Bill` });
                              window.location.href = uri;
                            }}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <PaytmIcon size={18} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                          <span style={{ fontSize: '0.7rem', color: theme.textMuted, fontFamily: 'monospace' }}>
                            UPI ID: <strong>{cleanUpiId}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                navigator.clipboard.writeText(cleanUpiId);
                                toast.success('UPI ID copied!');
                              } catch (err) { }
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <Copy size={13} color={theme.accent} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Smartphone size={22} color={theme.accent} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme.textMain }}>
                            Staff will bring UPI QR Scanner to Table {tableNumStr}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: theme.textMuted, marginTop: '3px' }}>
                            You can pay with any UPI app on the staff's handheld scanner or printed QR.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: '14px',
                    borderRadius: '14px',
                    backgroundColor: isDarkMode ? '#1a130e' : '#f8fafc',
                    border: `1px solid ${theme.border}`,
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <Banknote size={24} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: theme.textMain }}>
                        Cash Payment at Table {tableNumStr}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: '3px' }}>
                        The waiter will bring the itemized printed bill and collect cash / provide change at your table.
                      </div>
                    </div>
                  </div>
                )}

                {/* WhatsApp Digital E-Bill Section */}
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: isDarkMode ? '#1e1814' : '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  marginBottom: '18px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: sendWhatsappCopy ? '8px' : '0' }}>
                    <input
                      type="checkbox"
                      checked={sendWhatsappCopy}
                      onChange={(e) => setSendWhatsappCopy(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#16a34a' }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MessageSquare size={14} /> Send E-Bill copy to WhatsApp
                    </span>
                  </label>

                  {sendWhatsappCopy && (
                    <input
                      type="tel"
                      value={billPhoneInput}
                      onChange={(e) => setBillPhoneInput(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e1'}`,
                        backgroundColor: theme.bgCard,
                        color: theme.textMain,
                        fontSize: '0.82rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  )}
                </div>

                {/* Submit Action Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={isRequestingBill}
                  onClick={() => handleConfirmBillRequest(billPaymentMethod)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: billPaymentMethod === 'UPI' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: isRequestingBill ? 'not-allowed' : 'pointer',
                    boxShadow: billPaymentMethod === 'UPI' ? '0 6px 20px rgba(234, 88, 12, 0.35)' : '0 6px 20px rgba(22, 163, 74, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: isRequestingBill ? 0.7 : 1
                  }}
                >
                  <Check size={18} strokeWidth={3} />
                  <span>
                    {isRequestingBill
                      ? 'Notifying Staff...'
                      : billPaymentMethod === 'UPI'
                        ? `Request Bill • Pay via UPI (₹${totalRunningAmount})`
                        : `Request Bill • Pay Cash (₹${totalRunningAmount})`
                    }
                  </span>
                </motion.button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation Bar */}
        <CustomerBottomNav
          tableNumber={tableNumStr}
          tenantId={order?.tenantId?._id || order?.tenantId || ''}
          isDarkMode={isDarkMode}
        />

      </div>
    </div>
  );
};

export default OrderStatus;