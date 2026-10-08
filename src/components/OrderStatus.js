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
  Check
} from "lucide-react";
import { motion } from "framer-motion";
import { encodeTableToken } from "../utils/tableToken";
import { API_URL as API, SOCKET_URL } from "../config/api";
import { io } from "socket.io-client";
import RestaurantCafeLottieLoader from "./RestaurantCafeLottieLoader";
import TableBadge from "./common/TableBadge";
import CustomerBottomNav from "./common/CustomerBottomNav";

const OrderStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRoundIndex, setActiveRoundIndex] = useState(null);

  const tabsContainerRef = useRef(null);
  const activeTabRef = useRef(null);

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
        } catch (e) {}

        const res = await axios.get(`${API}/orders/status/${id}`, {
          params: sessionIds.length > 0 ? { sessionIds: sessionIds.join(',') } : {}
        });
        const currentOrder = res.data;

        let allOrders = currentOrder.sessionOrders && currentOrder.sessionOrders.length > 0
          ? [...currentOrder.sessionOrders]
          : [currentOrder];

        // Store all active session order IDs into localStorage so customer never loses added rounds
        try {
          const allIds = allOrders.map(o => o._id).filter(Boolean);
          if (allIds.length > 0) {
            localStorage.setItem('serviq_session_orders', JSON.stringify(allIds));
          }
        } catch (e) {}

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
    const cafeName = order?.tenantId?.name || localStorage.getItem('restaurant_name') || "SERVIQ Gourmet Bistro";
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
    if (s === 'completed') return 2;
    if (s === 'ready' || s === 'preparing') return 1; // ready to serve is included in preparing step
    return 0; // pending
  };

  const currentStepIndex = getStepIndex(trackedOrder.status);
  const isCancelled = trackedOrder.status === 'cancelled';
  const isCompleted = trackedOrder.status === 'completed';
  const tableNumStr = order.tableNumber || localStorage.getItem('tableNumber') || '1';
  const tableToken = tableNumStr ? encodeTableToken(tableNumStr) : '';
  const tableTarget = tableToken ? `?t=${encodeURIComponent(tableToken)}` : '';
  const orderNumStr = trackedOrder.orderNumber ? `#${trackedOrder.orderNumber}` : (trackedOrder._id ? `#${trackedOrder._id.slice(-6).toUpperCase()}` : '#ORD');

  const getStatusBadgeInfo = (st) => {
    switch (st) {
      case 'completed':
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
                ₹{Math.round(
                  hasMultipleRounds
                    ? sessionOrders.reduce((sum, ord) => {
                        const sumItems = ord.items ? ord.items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0) : 0;
                        return sum + Number(ord.settledAmount || (sumItems > 0 ? sumItems : ord.total) || 0);
                      }, 0)
                    : (() => {
                        const sumItems = order.items ? order.items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0) : 0;
                        return Number(order.settledAmount || (sumItems > 0 ? sumItems : order.total) || 0);
                      })()
                )}
              </span>
            </div>
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

          {/* Footer */}
          <footer className={styles.footer}>
            <p className={styles.footerSubtitle} style={{ color: theme.textMuted }}>
              Table: <strong>{tableNumStr}</strong> — Enjoy your dining experience!
            </p>
            <p className={styles.poweredBy} style={{ color: theme.textMuted }}>
              Powered by <span style={{ color: theme.accent, fontWeight: '800' }}>SERVIQ OS</span>
            </p>
          </footer>

        </div>

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