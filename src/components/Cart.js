import { useState, useEffect } from "react";
import { useCartContext } from "../context/CartContext";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ChevronRight,
  Sun,
  Moon,
  Receipt,
  Utensils,
  FileText
} from "lucide-react";
import TableBadge from "./common/TableBadge";
import TrackOrderBadge from "./common/TrackOrderBadge";
import CustomerBottomNav from "./common/CustomerBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import CustomerVerificationModal from "./CustomerVerificationModal";
import { FssaiDietaryBadge } from "./DishDetailsModal";
import { decodeTableToken } from "../utils/tableToken";
import styles from "./Cart.module.css";
import { API_URL as API } from "../config/api";

export default function Cart() {
  const {
    items,
    setItems,
    updateItemQuantity,
    removeItem,
    getCartTotal,
  } = useCartContext();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tableNumber, setTableNumber] = useState(localStorage.getItem("tableNumber") || "");
  const [tenantInfo, setTenantInfo] = useState({ name: "Cafe" });
  const [isPlacing, setIsPlacing] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);

  // Customer verification profile
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Sync theme with localStorage (Default is Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("isDarkMode");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Premium Gourmet Theme Tokens
  const theme = isDarkMode ? {
    bgPage: '#0d0b08',
    bgContainer: '#16120e',
    bgCard: '#1f1913',
    textMain: '#f8fafc',
    textMuted: '#a1a1aa',
    accent: '#ea580c',
    accentGlow: 'rgba(234, 88, 12, 0.35)',
    border: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.09)',
    chipBg: '#261f18',
    inputBg: '#1f1913',
    inputText: '#ffffff'
  } : {
    bgPage: '#f8fafc',
    bgContainer: '#ffffff',
    bgCard: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
    accent: '#ea580c',
    accentGlow: 'rgba(234, 88, 12, 0.25)',
    border: '#e2e8f0',
    cardBorder: '#e2e8f0',
    chipBg: '#f8fafc',
    inputBg: '#f8fafc',
    inputText: '#0f172a'
  };

  // Ensure scroll is immediately reset to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const tokenParam = searchParams.get("t") || searchParams.get("code") || searchParams.get("token");
    let resolvedTable = null;
    if (tokenParam) {
      resolvedTable = decodeTableToken(tokenParam);
    } else if (searchParams.get("table")) {
      resolvedTable = decodeTableToken(searchParams.get("table"));
    }

    if (resolvedTable) {
      setTableNumber(resolvedTable);
      localStorage.setItem("tableNumber", resolvedTable);
    }

    // Fetch tenant info for branding
    const tenantId = localStorage.getItem("tenantId");
    if (tenantId) {
      axios.get(`${API}/tenants/public/${tenantId}`)
        .then(res => setTenantInfo(res.data))
        .catch(err => console.error(err));
    }
  }, [searchParams]);

  const executeOrderPlacement = async (activeCustomer = customer) => {
    // 1. Validate Customer Verification
    if (!activeCustomer?.verified) {
      setIsVerificationOpen(true);
      return;
    }

    // 2. Validate Table
    if (!tableNumber) {
      toast.error("Please enter a table number");
      return;
    }

    // 3. Validate Tenant
    const tenantId = localStorage.getItem("tenantId");
    if (!tenantId) {
      toast.error("Invalid Cafe session. Please rescan QR code.");
      return;
    }

    setIsPlacing(true);
    try {
      const payload = {
        items: items.map((i) => {
          let cleanId = i.itemId || i._id;
          if (!cleanId && typeof i.id === 'string') {
            cleanId = i.id.includes('_') ? i.id.split('_')[0] : i.id;
          }
          return {
            id: cleanId,
            itemId: cleanId,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            variant: i.variant || null,
            addons: i.addons || [],
            specialNotes: i.specialNotes || i.notes || ''
          };
        }),
        tenantId,
        tableNumber: tableNumber || "Online Order",
        status: "pending",
        paymentStatus: "pending",
        customerDetails: {
          name: activeCustomer?.name || "Guest",
          phone: activeCustomer?.phone || "",
          email: activeCustomer?.email || "",
          isPhoneVerified: Boolean(activeCustomer?.verified)
        }
      };

      const { data } = await axios.post(`${API}/orders`, payload);

      try {
        localStorage.setItem('serviq_last_order_id', data._id);
        localStorage.setItem('serviq_last_table', String(tableNumber || ''));
        const prevSession = JSON.parse(localStorage.getItem('serviq_session_orders') || '[]');
        if (!prevSession.includes(data._id)) {
          prevSession.push(data._id);
        }
        localStorage.setItem('serviq_session_orders', JSON.stringify(prevSession));

        const prevHistory = JSON.parse(localStorage.getItem('serviq_order_history') || '[]');
        const updatedHistory = [data, ...prevHistory.filter(o => o && o._id !== data._id)];
        localStorage.setItem('serviq_order_history', JSON.stringify(updatedHistory));
      } catch (e) {}

      setItems([]);
      localStorage.removeItem("cartItems");
      toast.success("Order placed successfully!");
      navigate(`/order/status/${data._id}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!customer?.verified) {
      setIsVerificationOpen(true);
      return;
    }
    executeOrderPlacement(customer);
  };

  const handleVerificationSuccess = (verifiedUser) => {
    setCustomer(verifiedUser);
    setIsVerificationOpen(false);
    toast.success(`Welcome, ${verifiedUser.name}!`);
    executeOrderPlacement(verifiedUser);
  };

  const total = getCartTotal();
  const cartTotalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={styles.page} style={{ backgroundColor: theme.bgPage, color: theme.textMain }}>
      <Toaster position="top-center" />

      <div
        className={styles.appContainer}
        style={{
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
        }}
      >
        {/* Top Sticky Header */}
        <div
          style={{
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
          }}
        >
          {/* Screen Title & Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'rgba(234, 88, 12, 0.15)', color: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBag size={18} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: theme.textMain, letterSpacing: '-0.2px', lineHeight: 1.2 }}>
              Your Cart
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TableBadge tableNumber={tableNumber} isDarkMode={isDarkMode} style={{ padding: '4px 9px', fontSize: '0.8rem' }} />

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

        {/* Cart Content Body */}
        <div style={{ padding: '16px 18px 0 18px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

        <AnimatePresence
          mode="wait"
          onExitComplete={() => {
            window.scrollTo(0, 0);
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
          }}
        >
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.empty}
              style={{
                flex: 1,
                minHeight: 'calc(100vh - 180px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 'auto 0'
              }}
            >
              <ShoppingBag size={64} className={styles.emptyIcon} color={theme.accent} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: theme.textMain, margin: '0 0 6px' }}>Your cart is empty</h3>
              <p style={{ color: theme.textMuted, fontSize: '0.88rem', margin: '0 0 1.25rem' }}>Looks like you haven't added any dishes yet.</p>
              <Link
                to={`/menu?table=${tableNumber}`}
                className={styles.emptyLink}
                style={{ backgroundColor: theme.accent, boxShadow: `0 4px 15px ${theme.accentGlow}` }}
              >
                <Utensils size={16} />
                <span>Explore Delicious Menu</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="cart-review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Cart Items List */}
              <div className={styles.itemsList}>
                {items.map((item) => {
                  const varName = item.variant ? (typeof item.variant === 'object' ? (item.variant.name || item.variant.size) : String(item.variant)) : null;
                  const itemAddons = Array.isArray(item.addons) ? item.addons : [];
                  const notes = item.specialNotes || item.notes || '';
                  const cleanItemName = item.name
                    ? item.name.split(' + ')[0].replace(/\s*\((?:[^)(]+|\([^)(]*\))*\)+$/, '').trim()
                    : item.name;

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      className={styles.card}
                      style={{
                        backgroundColor: theme.bgCard,
                        border: `1px solid ${theme.cardBorder}`,
                        boxShadow: isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 12px rgba(15,23,42,0.04)'
                      }}
                    >
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500"}
                        alt={cleanItemName}
                        className={styles.itemImg}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500";
                        }}
                      />

                      <div className={styles.cardBody}>
                        <div className={styles.cardTopRow}>
                          <div className={styles.itemNameRow}>
                            <FssaiDietaryBadge isVeg={item.isVeg !== false} size={14} />
                            <h3 className={styles.itemName} style={{ color: theme.textMain }} title={cleanItemName}>
                              {cleanItemName}
                            </h3>
                          </div>

                          {/* Variant & Addons Tags at Top-Right (Above stepper / delete button) */}
                          {(varName || itemAddons.length > 0) && (
                            <div className={styles.customTagsRight}>
                              {varName && (
                                <span className={styles.tagPill} style={{ backgroundColor: `${theme.accent}18`, color: theme.accent, border: `1px solid ${theme.accent}30` }}>
                                  {varName}
                                </span>
                              )}
                              {itemAddons.map((a, aIdx) => (
                                <span key={aIdx} className={styles.tagPill} style={{ backgroundColor: isDarkMode ? '#27201a' : '#f1f5f9', color: theme.textMuted }}>
                                  +{a.name || a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {notes && (
                          <p className={styles.notePill} style={{ color: theme.textMuted }}>
                            <FileText size={11} color={theme.accent} />
                            <span>"{notes}"</span>
                          </p>
                        )}

                        <div className={styles.actions}>
                          <div className={styles.itemPrice} style={{ color: theme.accent }}>
                            ₹{Number(item.price).toFixed(2)}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={styles.qtyWrapper} style={{ backgroundColor: theme.chipBg, border: `1px solid ${theme.border}` }}>
                              <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                className={styles.qtyBtn}
                                style={{ color: theme.textMain }}
                                title="Decrease"
                              >
                                <Minus size={13} strokeWidth={3} />
                              </motion.button>
                              <span className={styles.qty} style={{ color: theme.textMain }}>
                                {item.quantity}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                className={styles.qtyBtn}
                                style={{ color: theme.textMain }}
                                title="Increase"
                              >
                                <Plus size={13} strokeWidth={3} />
                              </motion.button>
                            </div>

                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => removeItem(item.id)}
                              className={styles.removeBtn}
                              style={{ backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2' }}
                              title="Delete Item"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Add More Items Link */}
              <Link
                to={`/menu?table=${tableNumber}`}
                className={styles.addMoreBanner}
                style={{
                  backgroundColor: isDarkMode ? 'rgba(234, 88, 12, 0.1)' : '#fff7ed',
                  border: `1.5px dashed ${theme.accent}`,
                  color: theme.accent
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={16} strokeWidth={3} />
                  <span>Add more delicious items from menu</span>
                </div>
                <ChevronRight size={16} />
              </Link>

              {/* Bill Details Box */}
              <div className={styles.summary} style={{ backgroundColor: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <div className={styles.summaryHeader} style={{ color: theme.textMain }}>
                  <Receipt size={16} color={theme.accent} />
                  <span>Bill Summary</span>
                </div>

                <div className={styles.row} style={{ color: theme.textMuted }}>
                  <span>Item Subtotal</span>
                  <span style={{ color: theme.textMain, fontWeight: 700 }}>₹{Math.round(total)}</span>
                </div>

                <div className={styles.row} style={{ color: theme.textMuted }}>
                  <span>Dining & Service Fee</span>
                  <span className={styles.freeTag}>FREE</span>
                </div>

                <div className={styles.row} style={{ color: theme.textMuted }}>
                  <span>Taxes & GST</span>
                  <span style={{ color: theme.textMain, fontWeight: 700 }}>Included</span>
                </div>

                <div className={styles.totalRow} style={{ color: theme.textMain, borderColor: theme.border }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>Total</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: theme.accent }}>
                    ₹{Math.round(total)}
                  </span>
                </div>

                <motion.button
                  whileHover={!isPlacing ? { scale: 1.02 } : {}}
                  whileTap={!isPlacing ? { scale: 0.96 } : {}}
                  disabled={isPlacing}
                  onClick={handlePlaceOrder}
                  className={styles.checkoutBtn}
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent}, #c2410c)`,
                    boxShadow: `0 4px 18px ${theme.accentGlow}`,
                    cursor: isPlacing ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Utensils size={18} />
                  <span>{isPlacing ? "Placing Your Order..." : `Place Order • ₹${Math.round(total)}`}</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand Footer inside Container */}
        <footer style={{ marginTop: 'auto', paddingTop: '1.5rem', paddingBottom: '0.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: '700', margin: 0 }}>
            Powered by <span style={{ color: theme.accent, fontWeight: '800' }}>SERVIQ OS</span>
          </p>
        </footer>
        </div>
      </div>

      {/* Customer Verification Modal */}
      <CustomerVerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onVerified={handleVerificationSuccess}
        initialName={customer?.name || ''}
      />

      {/* Customer Bottom Navigation Bar */}
      <CustomerBottomNav
        tableNumber={tableNumber}
        tenantId={tenantInfo?.tenantId || ''}
        tenantInfo={tenantInfo}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    </div>
  );
}