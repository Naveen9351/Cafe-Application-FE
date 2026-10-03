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
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Store,
  Lock,
  Sun,
  Moon,
  UserCheck,
  Receipt,
  Sparkles,
  ShieldCheck,
  Utensils,
  MapPin,
  ArrowRight,
  FileText
} from "lucide-react";
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
  const [step, setStep] = useState(1); // 1: Review, 2: Details/Payment
  const [isPlacing, setIsPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("counter"); // counter or online
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
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

  // Ensure scroll is immediately reset to top on mount and step change
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    scrollToTop();
    const raf = requestAnimationFrame(scrollToTop);
    const t1 = setTimeout(scrollToTop, 40);
    const t2 = setTimeout(scrollToTop, 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step]);

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

  const handleProceedToCheckout = () => {
    if (!customer?.verified) {
      setIsVerificationOpen(true);
    } else {
      setStep(2);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  const handleVerificationSuccess = (verifiedUser) => {
    setCustomer(verifiedUser);
    setIsVerificationOpen(false);
    setStep(2);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    toast.success(`Welcome, ${verifiedUser.name}!`);
  };

  const handlePlaceOrder = async () => {
    // 1. Validate Customer Verification
    if (!customer?.verified) {
      setIsVerificationOpen(true);
      return;
    }

    // 2. Validate Table
    if (!tableNumber && paymentMethod === "counter") {
      toast.error("Please enter a table number");
      return;
    }

    // 3. Validate Tenant
    const tenantId = localStorage.getItem("tenantId");
    if (!tenantId) {
      toast.error("Invalid Cafe session. Please rescan QR code.");
      return;
    }

    if (paymentMethod === "online") {
      setIsProcessingPayment(true);
      await new Promise(r => setTimeout(r, 2200));
      setIsProcessingPayment(false);
      toast.success("Payment Received!");
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
        paymentStatus: paymentMethod === "online" ? "paid" : "pending",
        customerDetails: {
          name: customer?.name || "Guest",
          phone: customer?.phone || "",
          email: customer?.email || "",
          isPhoneVerified: Boolean(customer?.verified)
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

  const total = getCartTotal();
  const cartTotalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={styles.page} style={{ backgroundColor: theme.bgPage, color: theme.textMain }}>
      <Toaster position="top-center" />

      <div className={styles.appContainer} style={{ backgroundColor: theme.bgContainer, borderLeft: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}` }}>
        {/* Top Nav */}
        <div className={styles.topNavBar}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => step === 1 ? navigate(-1) : setStep(1)}
            className={styles.backBtn}
            style={{ color: theme.textMain, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
            <span>{step === 1 ? "Back to Menu" : "Review Cart"}</span>
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {tableNumber && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '4px 10px',
                borderRadius: '100px',
                backgroundColor: `${theme.accent}14`,
                color: theme.accent,
                border: `1px solid ${theme.accent}33`
              }}>
                Table #{tableNumber}
              </span>
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '50%'
              }}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={17} color="#fbbe21" /> : <Moon size={17} color="#475569" />}
            </button>
          </div>
        </div>

        {/* Page Title */}
        <header className={styles.header}>
          <h1 className={styles.title} style={{ color: theme.textMain }}>
            {step === 1 ? "Your Cart" : "Confirm Order"}
          </h1>
          <p className={styles.subtitle} style={{ color: theme.textMuted }}>
            {step === 1 ? `Review your delicious selection (${cartTotalItems} items)` : "Review details & confirm your dining order"}
          </p>
        </header>

        {/* Sleek Steps Progress Indicator */}
        <div className={styles.stepsContainer}>
          <div
            className={styles.stepPill}
            onClick={() => setStep(1)}
            style={{
              backgroundColor: step === 1 ? theme.accent : (isDarkMode ? '#241e18' : '#f1f5f9'),
              color: step === 1 ? '#ffffff' : theme.textMuted,
              boxShadow: step === 1 ? `0 4px 14px ${theme.accentGlow}` : 'none',
              cursor: 'pointer'
            }}
          >
            <ShoppingBag size={14} />
            <span>1. Cart Items</span>
          </div>

          <div className={styles.stepLine} style={{ backgroundColor: step === 2 ? theme.accent : theme.border }} />

          <div
            className={styles.stepPill}
            onClick={() => {
              if (items.length > 0) {
                handleProceedToCheckout();
              }
            }}
            style={{
              backgroundColor: step === 2 ? theme.accent : (isDarkMode ? '#241e18' : '#f1f5f9'),
              color: step === 2 ? '#ffffff' : theme.textMuted,
              boxShadow: step === 2 ? `0 4px 14px ${theme.accentGlow}` : 'none',
              cursor: items.length > 0 ? 'pointer' : 'default'
            }}
          >
            <Utensils size={14} />
            <span>2. Confirm Order</span>
          </div>
        </div>

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
          ) : step === 1 ? (
            <motion.div
              key="cart-review"
              initial={{ x: -15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 15, opacity: 0 }}
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleProceedToCheckout}
                  className={styles.checkoutBtn}
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent}, #c2410c)`,
                    boxShadow: `0 4px 18px ${theme.accentGlow}`
                  }}
                >
                  <span>Proceed to Confirm</span>
                  <ArrowRight size={17} strokeWidth={2.5} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="checkout-details"
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -15, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.formSection}>
                {/* Verified Customer Card */}
                {customer?.verified && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
                    border: `1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.25)' : '#bbf7d0'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0
                      }}>
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: theme.textMain }}>
                          {customer.name} <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>● Verified</span>
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textMuted }}>
                          {customer.phone ? `+91 ${customer.phone}` : (customer.email || 'Verified Guest')}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsVerificationOpen(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.accent,
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        padding: '4px 8px'
                      }}
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Table Details - Hidden for now as requested */}
                {/* 
                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: theme.textMain }}>
                    <MapPin size={16} color={theme.accent} />
                    <span>Dining Table</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Table Number (Optional if scanned QR)"
                    className={styles.input}
                    style={{ backgroundColor: theme.inputBg, color: theme.inputText, border: `1.5px solid ${theme.border}` }}
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />

                  <div className={styles.tablePillsGrid}>
                    {["1", "2", "3", "4", "5", "6", "Takeaway"].map((t) => (
                      <span
                        key={t}
                        onClick={() => setTableNumber(t === "Takeaway" ? "Takeaway" : t)}
                        className={styles.tablePill}
                        style={{
                          backgroundColor: tableNumber === t ? `${theme.accent}18` : theme.inputBg,
                          borderColor: tableNumber === t ? theme.accent : theme.border,
                          color: tableNumber === t ? theme.accent : theme.textMuted
                        }}
                      >
                        {t === "Takeaway" ? "📦 Takeaway" : `Table #${t}`}
                      </span>
                    ))}
                  </div>
                </div>
                */}

                {/* Payment & Order Mode Selection */}
                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: theme.textMain }}>
                    <CreditCard size={16} color={theme.accent} />
                    <span>Order Confirmation Mode</span>
                  </label>
                  <div className={styles.paymentTabs}>
                    <div
                      className={styles.payTab}
                      style={{
                        backgroundColor: paymentMethod === "counter" ? `${theme.accent}12` : theme.inputBg,
                        border: paymentMethod === "counter" ? `2px solid ${theme.accent}` : `1.5px solid ${theme.border}`,
                        color: paymentMethod === "counter" ? theme.textMain : theme.textMuted,
                        boxShadow: paymentMethod === "counter" ? `0 2px 10px ${theme.accentGlow}` : 'none'
                      }}
                      onClick={() => setPaymentMethod("counter")}
                    >
                      <Store size={22} color={paymentMethod === "counter" ? theme.accent : theme.textMuted} />
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>Pay at Counter / Table</div>
                        <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 600 }}>Pay after dining</span>
                      </div>
                    </div>

                    <div
                      className={styles.payTab}
                      style={{
                        backgroundColor: paymentMethod === "online" ? `${theme.accent}12` : theme.inputBg,
                        border: paymentMethod === "online" ? `2px solid ${theme.accent}` : `1.5px solid ${theme.border}`,
                        color: paymentMethod === "online" ? theme.textMain : theme.textMuted,
                        boxShadow: paymentMethod === "online" ? `0 2px 10px ${theme.accentGlow}` : 'none'
                      }}
                      onClick={() => setPaymentMethod("online")}
                    >
                      <CreditCard size={22} color={paymentMethod === "online" ? theme.accent : theme.textMuted} />
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>Pay Online</div>
                        <span style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 600 }}>Instant UPI / Cards</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm & Place Order CTA */}
                <motion.button
                  whileHover={!isPlacing ? { scale: 1.02 } : {}}
                  whileTap={!isPlacing ? { scale: 0.96 } : {}}
                  disabled={isPlacing}
                  onClick={handlePlaceOrder}
                  className={styles.checkoutBtn}
                  style={{
                    background: `linear-gradient(135deg, ${theme.accent}, #c2410c)`,
                    boxShadow: `0 4px 18px ${theme.accentGlow}`,
                    marginTop: '0.5rem'
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

      {/* Online Payment Animation Modal */}
      <AnimatePresence>
        {isProcessingPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={styles.modalContent}
            >
              <div className={styles.paymentHeader}>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>Paying to {tenantInfo.name}</p>
                <div className={styles.paymentAmount}>₹{Math.round(total)}</div>
              </div>
              <div className={styles.paymentBody}>
                <div className={styles.loadingSpinner}></div>
                <p style={{ textAlign: "center", fontWeight: "700", color: "#0f172a", margin: '0 0 4px' }}>Securing payment connection...</p>
                <p style={{ textAlign: "center", fontStyle: "italic", fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
                  Please do not refresh or close this window
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Verification Modal */}
      <CustomerVerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        onVerified={handleVerificationSuccess}
        initialName={customer?.name || ''}
      />
    </div>
  );
}