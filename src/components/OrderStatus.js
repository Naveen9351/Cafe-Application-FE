import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./OrderStatus.module.css";
import axios from "axios";
import { 
  CheckCircle2, 
  Clock, 
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
  ExternalLink,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { encodeTableToken } from "../utils/tableToken";
import { API_URL as API } from "../config/api";
import RestaurantCafeLottieLoader from "./RestaurantCafeLottieLoader";
import TableBadge from "./common/TableBadge";

const OrderStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRoundIndex, setActiveRoundIndex] = useState(null);

  // Dark mode state matching rest of the application
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("isDarkMode");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const theme = isDarkMode ? {
    bgPage: '#0f0c08',
    bgCard: '#1a140e',
    cardInner: '#241c14',
    textMain: '#fdfbf7',
    textMuted: '#a89f91',
    accent: '#f97316',
    accentGlow: 'rgba(249, 115, 22, 0.25)',
    border: '#2e2419',
    chipBg: '#27201a',
    stepInactive: '#241c14'
  } : {
    bgPage: '#f8fafc',
    bgCard: '#ffffff',
    cardInner: '#f8fafc',
    textMain: '#0f172a',
    textMuted: '#64748b',
    accent: '#ea580c',
    accentGlow: 'rgba(234, 88, 12, 0.25)',
    border: '#e2e8f0',
    chipBg: '#f1f5f9',
    stepInactive: '#f1f5f9'
  };

  const steps = [
    { id: 'pending', label: 'Order Placed', subtext: 'Received in kitchen', icon: ShoppingBag },
    { id: 'preparing', label: 'In Preparation', subtext: 'Chef is crafting your dish', icon: ChefHat },
    { id: 'ready', label: 'Ready to Serve', subtext: 'Plated & ready at counter', icon: Utensils },
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

        // Ensure session orders only include the tracked session rounds
        if (sessionIds.length > 0) {
          const sessionFiltered = allOrders.filter(o => sessionIds.includes(o._id));
          if (sessionFiltered.length > 0) {
            allOrders = sessionFiltered;
          }
        }

        allOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const mergedOrder = {
          ...currentOrder,
          sessionOrders: allOrders.length > 0 ? allOrders : [currentOrder]
        };

        setOrder(mergedOrder);
        setLoading(false);

        // Auto-select latest active round if not explicitly set by user
        setActiveRoundIndex(prev => {
          if (prev !== null && prev < mergedOrder.sessionOrders.length) return prev;
          // Default to current URL order index or last round
          const foundIdx = mergedOrder.sessionOrders.findIndex(o => o._id === id);
          return foundIdx !== -1 ? foundIdx : mergedOrder.sessionOrders.length - 1;
        });

        // Stop polling if all session orders are completed or cancelled
        const allFinished = mergedOrder.sessionOrders.every(o => ['completed', 'cancelled'].includes(o.status));
        if (allFinished) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Fetch order error:", err);
        setError("Order not found or invalid ID");
        setLoading(false);
      }
    };

    fetchOrder();
    interval = setInterval(fetchOrder, 4000);

    return () => clearInterval(interval);
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
            borderRadius: '10px',
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

  const currentStepIndex = steps.findIndex(s => s.id === trackedOrder.status);
  const isCancelled = trackedOrder.status === 'cancelled';
  const isCompleted = trackedOrder.status === 'completed';
  const tableToken = order.tableNumber ? encodeTableToken(order.tableNumber) : '';
  const tableTarget = tableToken ? `?t=${encodeURIComponent(tableToken)}` : '';
  const guestName = order?.customerDetails?.name || order?.customerName || order?.tenantId?.name || "Valued Guest";
  const orderNumStr = trackedOrder.orderNumber ? `#${trackedOrder.orderNumber}` : (trackedOrder._id ? `#${trackedOrder._id.slice(-6).toUpperCase()}` : '#ORD');

  const getStatusBadgeInfo = (st) => {
    switch (st) {
      case 'completed': return { text: '✓ Served', bg: '#dcfce7', color: '#16a34a' };
      case 'ready': return { text: '● Ready', bg: '#e0f2fe', color: '#0284c7' };
      case 'preparing': return { text: '● In Kitchen', bg: 'rgba(234, 88, 12, 0.15)', color: '#ea580c' };
      case 'cancelled': return { text: '✕ Cancelled', bg: '#fee2e2', color: '#dc2626' };
      default: return { text: '⏳ Placed', bg: isDarkMode ? '#27201a' : '#f1f5f9', color: isDarkMode ? '#f97316' : '#ea580c' };
    }
  };

  return (
    <div className={styles.container} style={{ backgroundColor: theme.bgPage }}>
      <div className={styles.appContainer} style={{ backgroundColor: theme.bgCard, color: theme.textMain }}>
        
        {/* Top Header Bar */}
        <div className={styles.topNav}>
          <button
            type="button"
            onClick={() => navigate(`/menu${tableTarget}`, { replace: true })}
            className={styles.backBtn}
            style={{
              backgroundColor: theme.chipBg,
              color: theme.textMain,
              border: `1px solid ${theme.border}`
            }}
          >
            <ChevronLeft size={16} />
            <span>Back to Menu</span>
          </button>

          <div className={styles.topNavCenter}>
            <span className={styles.orderIdBadge} style={{ color: theme.textMain }}>
              Order {orderNumStr}
            </span>
          </div>

          <div className={styles.topRightGroup}>
            <TableBadge tableNumber={order?.tableNumber || 'Takeaway'} isDarkMode={isDarkMode} />

            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={styles.themeToggleBtn}
              style={{
                backgroundColor: theme.chipBg,
                color: theme.textMain,
                borderColor: theme.border
              }}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun size={15} color="#fbbe24" /> : <Moon size={15} color="#64748b" />}
            </button>
          </div>
        </div>

        {/* Multi-Round Compact Switcher Chips */}
        {hasMultipleRounds && (
          <div className={styles.roundSwitcherContainer}>
            <div className={styles.roundSwitcherHeader}>
              <span className={styles.roundSwitcherTitle} style={{ color: theme.textMuted }}>
                <Layers size={13} color={theme.accent} /> Select Round to Track
              </span>
              <span style={{ fontSize: '0.72rem', color: theme.accent, fontWeight: 700 }}>
                {sessionOrders.length} Rounds Active
              </span>
            </div>

            <div className={styles.roundChipsGrid}>
              {sessionOrders.map((ord, idx) => {
                const isTabActive = idx === currentIdx;
                const bInfo = getStatusBadgeInfo(ord.status);

                return (
                  <button
                    key={ord._id || idx}
                    type="button"
                    onClick={() => setActiveRoundIndex(idx)}
                    className={styles.roundChip}
                    style={{
                      backgroundColor: isTabActive ? theme.accent : (isDarkMode ? '#241c14' : '#f1f5f9'),
                      color: isTabActive ? '#ffffff' : theme.textMain,
                      borderColor: isTabActive ? theme.accent : theme.border,
                      boxShadow: isTabActive ? `0 3px 12px ${theme.accentGlow}` : 'none'
                    }}
                  >
                    <span className={styles.roundChipNumber}>
                      Round {idx + 1}
                    </span>
                    <span
                      className={styles.roundChipBadge}
                      style={{
                        backgroundColor: isTabActive ? 'rgba(255, 255, 255, 0.22)' : bInfo.bg,
                        color: isTabActive ? '#ffffff' : bInfo.color
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

        {/* Live Timeline Step Tracker for Selected Round */}
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
              <AlertCircle size={24} color="#dc2626" strokeWidth={2.5} />
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
              {!isCompleted && (
                <span style={{ fontSize: '0.72rem', color: theme.accent, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={12} /> Auto updating
                </span>
              )}
            </div>

            <div className={styles.timelineList}>
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isPast = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isActive = index <= currentStepIndex;

                return (
                  <div key={step.id} className={styles.stepItem}>
                    {/* Connecting Line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`${styles.stepConnector} ${isPast ? styles.stepConnectorActive : ''}`}
                        style={{
                          backgroundColor: isPast ? theme.accent : (isDarkMode ? '#2e2419' : '#e2e8f0')
                        }}
                      />
                    )}

                    {/* Step Icon Box */}
                    <motion.div
                      initial={false}
                      animate={isCurrent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                      transition={isCurrent ? { repeat: Infinity, duration: 2.5 } : {}}
                      className={styles.stepIconContainer}
                      style={{
                        backgroundColor: isActive ? theme.accent : theme.stepInactive,
                        color: isActive ? '#ffffff' : theme.textMuted,
                        boxShadow: isCurrent ? `0 4px 14px ${theme.accentGlow}` : 'none',
                        borderColor: isCurrent ? `${theme.accent}50` : 'transparent'
                      }}
                    >
                      <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                    </motion.div>

                    {/* Step Title & Subtext */}
                    <div className={styles.stepInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h4
                          className={styles.stepTitle}
                          style={{
                            color: isActive ? theme.textMain : theme.textMuted,
                            fontWeight: isActive ? 800 : 600
                          }}
                        >
                          {step.label}
                        </h4>
                        {isCurrent && !isCompleted && (
                          <span
                            className={styles.stepActiveTag}
                            style={{
                              backgroundColor: `${theme.accent}18`,
                              color: theme.accent
                            }}
                          >
                            ● In Progress
                          </span>
                        )}
                        {isPast && (
                          <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 800 }}>
                            ✓ Done
                          </span>
                        )}
                      </div>
                      <p
                        className={styles.stepSubtext}
                        style={{ color: isActive ? theme.textMuted : (isDarkMode ? '#6e6355' : '#94a3b8') }}
                      >
                        {step.subtext}
                      </p>
                    </div>
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
              <Receipt size={14} color={theme.accent} />
              <span>
                {hasMultipleRounds
                  ? `Order Summary (${sessionOrders.length} Rounds)`
                  : 'Order Summary'}
              </span>
            </h3>
            <span
              className={styles.paymentBadge}
              style={{
                backgroundColor: order.paymentStatus === 'paid' ? '#dcfce7' : `${theme.accent}15`,
                color: order.paymentStatus === 'paid' ? '#16a34a' : theme.accent
              }}
            >
              {order.paymentStatus === 'paid' ? '● Paid' : '● Pay at Counter'}
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
                    <span className={styles.roundTitle} style={{ color: isCurrentOrd ? theme.accent : theme.textMain }}>
                      Round {roundNum} • {roundCode}
                      {isCurrentOrd && (
                        <span style={{ fontSize: '0.66rem', color: theme.accent, textTransform: 'none', fontWeight: 700 }}>
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
                            backgroundColor: theme.chipBg,
                            color: theme.accent,
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
                                    backgroundColor: `${theme.accent}15`,
                                    color: theme.accent
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
                                    backgroundColor: theme.chipBg,
                                    color: theme.textMuted
                                  }}
                                >
                                  +{a.name || a}
                                </span>
                              ))}
                            </div>
                          )}

                          {notes && (
                            <p className={styles.itemNotes} style={{ color: theme.accent }}>
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
          style={{
            background: `linear-gradient(135deg, ${theme.accent}, #c2410c)`,
            boxShadow: `0 4px 18px ${theme.accentGlow}`
          }}
        >
          <Plus size={18} strokeWidth={3} />
          <span>Add More Items</span>
        </motion.button>

        {/* Footer */}
        <footer className={styles.footer}>
          <p className={styles.footerSubtitle} style={{ color: theme.textMuted }}>
            Table: <strong>{order.tableNumber || 'Takeaway'}</strong> — Enjoy your dining experience!
          </p>
          <p className={styles.poweredBy} style={{ color: theme.textMuted }}>
            Powered by <span style={{ color: theme.accent, fontWeight: '800' }}>SERVIQ OS</span>
          </p>
        </footer>

      </div>
    </div>
  );
};

export default OrderStatus;