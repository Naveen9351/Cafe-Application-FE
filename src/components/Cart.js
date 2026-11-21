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
  FileText,
  Edit3,
  X,
  CreditCard,
  CheckCircle2,
  QrCode,
  Smartphone,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { GPayIcon, PhonePeIcon, PaytmIcon, BhimIcon, buildUpiUri, buildAppSpecificUpiUri } from "./common/UpiBrandLogos";
import TableBadge from "./common/TableBadge";
import TrackOrderBadge from "./common/TrackOrderBadge";
import CustomerBottomNav from "./common/CustomerBottomNav";
import { motion, AnimatePresence } from "framer-motion";
import CustomerVerificationModal from "./CustomerVerificationModal";
import { FssaiDietaryBadge } from "./DishDetailsModal";
import { decodeTableToken } from "../utils/tableToken";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import styles from "./Cart.module.css";
import { API_URL as API } from "../config/api";

export default function Cart() {
  const {
    items,
    setItems,
    updateItemQuantity,
    updateItemNote,
    removeItem,
    getCartTotal,
  } = useCartContext();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tableNumber, setTableNumber] = useState(localStorage.getItem("tableNumber") || "");
  const [tenantInfo, setTenantInfo] = useState({ name: "Cafe" });
  const [isPlacing, setIsPlacing] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('direct_upi'); // 'direct_upi' (Zomato/Swiggy Direct) | 'razorpay' | 'counter'
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiCountdown, setUpiCountdown] = useState(300);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  // Cooking / preparation instructions notes state
  const [editingNoteItemId, setEditingNoteItemId] = useState(null);
  const [noteInputText, setNoteInputText] = useState('');
  const [orderGeneralNote, setOrderGeneralNote] = useState('');

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
    const isVerificationRequired = tenantInfo?.settings?.enableCustomerOtp !== false;
    // 1. Validate Customer Verification if required
    if (isVerificationRequired && !activeCustomer?.verified) {
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

    const effectiveCustomer = (activeCustomer && activeCustomer.verified) ? activeCustomer : {
      name: activeCustomer?.name || localStorage.getItem('customer_name') || "Guest",
      phone: activeCustomer?.phone || localStorage.getItem('customer_phone') || "",
      verified: activeCustomer?.verified || false,
      isGuest: true
    };

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
          name: effectiveCustomer.name || "Guest",
          phone: effectiveCustomer.phone || "",
          email: effectiveCustomer.email || "",
          isPhoneVerified: Boolean(effectiveCustomer.verified)
        },
        notes: orderGeneralNote || ''
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
      navigate(`/order/status/${data._id}`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to place order. Please check your internet connection.");
    } finally {
      setIsPlacing(false);
    }
  };

  const executeRazorpayCheckout = async (activeCustomer = customer) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const isVerificationRequired = tenantInfo?.settings?.enableCustomerOtp !== false;
    if (isVerificationRequired && !activeCustomer?.verified) {
      setIsVerificationOpen(true);
      return;
    }

    if (!tableNumber) {
      toast.error("Please enter a table number");
      return;
    }

    const tenantId = localStorage.getItem("tenantId");
    if (!tenantId) {
      toast.error("Invalid Cafe session. Please rescan QR code.");
      return;
    }

    const effectiveCustomer = (activeCustomer && activeCustomer.verified) ? activeCustomer : {
      name: activeCustomer?.name || localStorage.getItem('customer_name') || "Guest",
      phone: activeCustomer?.phone || localStorage.getItem('customer_phone') || "",
      verified: activeCustomer?.verified || false,
      isGuest: true
    };

    setIsPlacing(true);
    const toastId = toast.loading("Initializing secure Razorpay payment...");

    try {
      // 1. Ensure Razorpay Checkout SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        toast.error("Could not load Razorpay payment gateway. Please check your internet connection.", { id: toastId });
        setIsPlacing(false);
        return;
      }

      // 2. Prepare order payload and create payment order on backend
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
        customerDetails: {
          name: effectiveCustomer.name || "Guest",
          phone: effectiveCustomer.phone || "",
          email: effectiveCustomer.email || "",
          isPhoneVerified: Boolean(effectiveCustomer.verified)
        },
        notes: orderGeneralNote || ''
      };

      const { data } = await axios.post(`${API}/payments/create-order`, payload);

      if (!data.success || !data.orderId) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      toast.dismiss(toastId);

      // 3. Launch Razorpay Checkout Modal
      const options = {
        key: data.keyId,
        amount: data.amount, // in paise
        currency: data.currency || "INR",
        name: data.cafeName || tenantInfo?.name || "Cafe Order",
        description: `Order #${data.orderNumber} - ${items.length} items`,
        order_id: data.orderId,
        prefill: {
          name: effectiveCustomer.name || "",
          contact: effectiveCustomer.phone || "",
          email: effectiveCustomer.email || ""
        },
        theme: {
          color: theme.accent || "#ea580c"
        },
        modal: {
          ondismiss: function () {
            toast("Payment window closed. You can retry anytime.", { icon: "ℹ️" });
            setIsPlacing(false);
          }
        },
        handler: async function (response) {
          // response = { razorpay_order_id, razorpay_payment_id, razorpay_signature }
          const verifyToastId = toast.loading("Verifying payment signature with server...");
          try {
            const verifyRes = await axios.post(`${API}/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              dbOrderId: data.dbOrderId
            });

            if (verifyRes.data?.success) {
              toast.success("Payment verified! Order placed successfully 🎉", { id: verifyToastId });

              const confirmedOrder = verifyRes.data.order;
              try {
                localStorage.setItem('serviq_last_order_id', confirmedOrder._id);
                localStorage.setItem('serviq_last_table', String(tableNumber || ''));
                const prevSession = JSON.parse(localStorage.getItem('serviq_session_orders') || '[]');
                if (!prevSession.includes(confirmedOrder._id)) {
                  prevSession.push(confirmedOrder._id);
                }
                localStorage.setItem('serviq_session_orders', JSON.stringify(prevSession));

                const prevHistory = JSON.parse(localStorage.getItem('serviq_order_history') || '[]');
                const updatedHistory = [confirmedOrder, ...prevHistory.filter(o => o && o._id !== confirmedOrder._id)];
                localStorage.setItem('serviq_order_history', JSON.stringify(updatedHistory));
              } catch (e) {}

              setItems([]);
              localStorage.removeItem("cartItems");
              navigate(`/order/status/${confirmedOrder._id}`, { replace: true });
            } else {
              throw new Error(verifyRes.data?.error || "Payment verification failed");
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            toast.error(verifyErr.response?.data?.error || verifyErr.message || "Payment verification failed", { id: verifyToastId });
            setIsPlacing(false);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (failResponse) {
        console.error("Payment failed:", failResponse.error);
        toast.error(`Payment failed: ${failResponse.error?.description || "Transaction declined"}`);
        setIsPlacing(false);
      });

      razorpayInstance.open();
    } catch (err) {
      console.error("Razorpay order initiation error:", err);
      toast.error(err.response?.data?.error || err.message || "Failed to start online payment", { id: toastId });
      setIsPlacing(false);
    }
  };

  // UPI Countdown Timer
  useEffect(() => {
    let timer;
    if (isUpiModalOpen && upiCountdown > 0) {
      timer = setInterval(() => {
        setUpiCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isUpiModalOpen, upiCountdown]);

  // Execute Direct UPI Order (Zomato/Swiggy Direct to Cafe Bank Account)
  const executeDirectUpiOrder = async (activeCustomer = customer) => {
    setIsPlacing(true);
    const toastId = toast.loading("Confirming your order with kitchen...");
    try {
      const effectiveCustomer = (activeCustomer && activeCustomer.verified) ? activeCustomer : {
        name: activeCustomer?.name || localStorage.getItem('customer_name') || "Guest",
        phone: activeCustomer?.phone || localStorage.getItem('customer_phone') || "",
        verified: activeCustomer?.verified || false,
        isGuest: true
      };

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
        tenantId: localStorage.getItem("tenantId"),
        tableNumber: tableNumber || "Online Order",
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: "UPI",
        customerDetails: {
          name: effectiveCustomer.name || "Guest",
          phone: effectiveCustomer.phone || "",
          email: effectiveCustomer.email || "",
          isPhoneVerified: Boolean(effectiveCustomer.verified)
        },
        notes: orderGeneralNote || ''
      };

      const { data } = await axios.post(`${API}/orders`, payload);

      setIsPaymentSuccess(true);
      toast.success("Payment Received & Confirmed 🎉", { id: toastId });

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

      setTimeout(() => {
        setIsUpiModalOpen(false);
        setIsPaymentSuccess(false);
        navigate(`/order/status/${data._id}`, { replace: true });
      }, 1800);
    } catch (err) {
      console.error("Direct UPI order error:", err);
      toast.error(err.response?.data?.error || "Failed to place order.", { id: toastId });
    } finally {
      setIsPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    const isVerificationRequired = tenantInfo?.settings?.enableCustomerOtp !== false;
    if (isVerificationRequired && !customer?.verified) {
      setIsVerificationOpen(true);
      return;
    }

    const effectiveCustomer = (customer && customer.verified) ? customer : {
      name: customer?.name || localStorage.getItem('customer_name') || 'Guest',
      phone: customer?.phone || localStorage.getItem('customer_phone') || '',
      verified: !isVerificationRequired,
      isGuest: true
    };

    if (paymentMethod === 'direct_upi') {
      setUpiCountdown(300);
      setIsUpiModalOpen(true);
    } else if (paymentMethod === 'razorpay') {
      executeRazorpayCheckout(effectiveCustomer);
    } else {
      executeOrderPlacement(effectiveCustomer);
    }
  };

  const handleVerificationSuccess = (verifiedUser) => {
    setCustomer(verifiedUser);
    setIsVerificationOpen(false);
    if (paymentMethod === 'direct_upi') {
      setUpiCountdown(300);
      setIsUpiModalOpen(true);
    } else if (paymentMethod === 'razorpay') {
      executeRazorpayCheckout(verifiedUser);
    } else {
      executeOrderPlacement(verifiedUser);
    }
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

                        {/* Item Cooking Note */}
                        {editingNoteItemId === item.id ? (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="text"
                              value={noteInputText}
                              onChange={(e) => setNoteInputText(e.target.value)}
                              placeholder="e.g. Less sugar, extra ice, no onions..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateItemNote(item.id, noteInputText.trim());
                                  setEditingNoteItemId(null);
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: `1.5px solid ${theme.accent}`,
                                fontSize: '0.78rem',
                                background: isDarkMode ? '#1e1610' : '#ffffff',
                                color: theme.textMain,
                                outline: 'none'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateItemNote(item.id, noteInputText.trim());
                                setEditingNoteItemId(null);
                              }}
                              style={{
                                padding: '5px 9px',
                                borderRadius: '6px',
                                background: theme.accent,
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteItemId(null)}
                              style={{
                                padding: '5px 7px',
                                borderRadius: '6px',
                                background: 'transparent',
                                color: theme.textMuted,
                                border: `1px solid ${theme.border}`,
                                fontSize: '0.74rem',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : notes ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <p className={styles.notePill} style={{ color: theme.textMuted, margin: 0 }}>
                              <FileText size={11} color={theme.accent} />
                              <span>"{notes}"</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteItemId(item.id);
                                setNoteInputText(notes);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: theme.accent,
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Edit Note"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateItemNote(item.id, '')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Remove Note"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteItemId(item.id);
                              setNoteInputText('');
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'transparent',
                              border: `1px dashed ${theme.border}`,
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '0.73rem',
                              color: theme.accent,
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginTop: '4px',
                              alignSelf: 'flex-start'
                            }}
                          >
                            <FileText size={10} />
                            <span>+ Note (e.g. less sugar)</span>
                          </button>
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

              {/* Cooking / Chef Instructions Note */}
              <div style={{
                backgroundColor: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '12px 14px',
                marginTop: '12px',
                boxShadow: isDarkMode ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 12px rgba(15,23,42,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 800, color: theme.textMain, marginBottom: '6px' }}>
                  <FileText size={14} color={theme.accent} />
                  <span>Cooking / Chef Instructions (Optional)</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Less sugar in drinks, serve starters first, extra napkins..."
                  value={orderGeneralNote}
                  onChange={(e) => setOrderGeneralNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    background: isDarkMode ? '#1e1610' : '#f8fafc',
                    color: theme.textMain,
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

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

                {/* Payment Option Selector */}
                <div style={{ marginTop: '14px', marginBottom: '14px', borderTop: `1px dashed ${theme.border}`, paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: theme.textMain, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={14} color={theme.accent} />
                    <span>Choose Payment Method</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('direct_upi')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: paymentMethod === 'direct_upi' ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                        backgroundColor: paymentMethod === 'direct_upi' ? (isDarkMode ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed') : theme.bgCard,
                        color: paymentMethod === 'direct_upi' ? theme.accent : theme.textMain,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '0.8rem' }}>
                        <Smartphone size={14} color={theme.accent} />
                        <span>UPI &amp; QR</span>
                      </div>
                      <span style={{ fontSize: '0.67rem', color: theme.textMuted }}>GPay / PhonePe / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('counter')}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: paymentMethod === 'counter' ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                        backgroundColor: paymentMethod === 'counter' ? (isDarkMode ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed') : theme.bgCard,
                        color: paymentMethod === 'counter' ? theme.accent : theme.textMain,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, fontSize: '0.8rem' }}>
                        <Utensils size={14} />
                        <span>Pay at Counter</span>
                      </div>
                      <span style={{ fontSize: '0.67rem', color: theme.textMuted }}>Cash / Dine-in</span>
                    </button>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('razorpay')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: paymentMethod === 'razorpay' ? theme.accent : theme.textMuted,
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        textDecoration: paymentMethod === 'razorpay' ? 'underline' : 'none',
                        fontWeight: 600
                      }}
                    >
                      {paymentMethod === 'razorpay' ? '✓ Card/Netbanking Mode Active' : 'Need Cards or Netbanking? Click here'}
                    </button>
                  </div>
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
                  {paymentMethod === 'direct_upi' ? <Smartphone size={18} /> : (paymentMethod === 'razorpay' ? <CreditCard size={18} /> : <Utensils size={18} />)}
                  <span>
                    {isPlacing
                      ? "Processing Your Order..."
                      : (paymentMethod === 'direct_upi'
                          ? `Pay via UPI • ₹${Math.round(total)}`
                          : (paymentMethod === 'razorpay' ? `Pay with Card • ₹${Math.round(total)}` : `Place Order (Pay at Counter) • ₹${Math.round(total)}`))}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand Footer inside Container */}
        <footer style={{ marginTop: 'auto', paddingTop: '1.5rem', paddingBottom: '0.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.78rem', color: theme.textMuted, fontWeight: '700', margin: 0 }}>
            Powered by <span style={{ color: theme.accent, fontWeight: '800' }}>DINEVIQ OS</span>
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
        enableCustomerOtp={tenantInfo?.settings?.enableCustomerOtp !== false}
      />

      {/* ── ZOMATO / SWIGGY STYLE DIRECT DYNAMIC UPI MODAL ── */}
      <AnimatePresence>
        {isUpiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px'
            }}
            onClick={() => {
              if (!isPlacing) {
                setIsUpiModalOpen(false);
                setIsPaymentSuccess(false);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: theme.bgContainer,
                color: theme.textMain,
                borderRadius: '20px',
                padding: '0.85rem 1rem 1rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
                border: `1px solid ${theme.border}`,
                boxSizing: 'border-box',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Handle */}
              <div style={{ width: 36, height: 3, borderRadius: 100, backgroundColor: isDarkMode ? '#3f3f46' : '#cbd5e1', margin: '0 auto 8px' }} />

              {/* Thank You Celebration View */}
              {isPaymentSuccess ? (
                <div style={{
                  padding: '1.25rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
                  }}>
                    <Check size={32} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: theme.textMain }}>
                      Thank You! Payment Confirmed 🎉
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: theme.textMuted }}>
                      Received <strong>₹{Math.round(total)}</strong> via UPI • Table {tableNumber || 'Takeaway'}
                    </p>
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '100px',
                    padding: '4px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#047857'
                  }}>
                    <Zap size={13} /> Sending your order directly to kitchen...
                  </div>
                </div>
              ) : (
                (() => {
                  const rawUpi = tenantInfo?.settings?.upiId || '';
                  const isEmail = rawUpi.endsWith('@gmail.com') || rawUpi.endsWith('@yahoo.com');
                  const cleanUpiId = (!isEmail && rawUpi) ? rawUpi : '9351862675@paytm';
                  const payeeName = tenantInfo?.settings?.upiPayeeName || tenantInfo?.name || 'Cafee';
                  const upiUri = buildUpiUri({
                    upiId: cleanUpiId,
                    payeeName: payeeName,
                    amount: total,
                    note: `Order Table ${tableNumber || 'Takeaway'}`
                  });

                  const handleUpiAppClick = (e, appKey, appName) => {
                    e.preventDefault();
                    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
                    if (!isMobile) {
                      try {
                        navigator.clipboard.writeText(cleanUpiId);
                        toast.success(`📱 Scan QR code below with ${appName}, or use copied UPI ID!`, { icon: '💳', duration: 3200 });
                      } catch (err) {}
                      return;
                    }
                    const appUri = buildAppSpecificUpiUri(appKey, {
                      upiId: cleanUpiId,
                      payeeName,
                      amount: total,
                      note: `Table ${tableNumber || 'Takeaway'}`
                    });
                    window.location.href = appUri;
                    setTimeout(() => {
                      window.location.href = upiUri;
                    }, 1200);
                  };

                  return (
                    <>
                      {/* Compact Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: theme.textMain, letterSpacing: '-0.3px' }}>
                            UPI Payment
                          </h3>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '100px',
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0'
                          }}>
                            Instant • 0% Fee
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '100px',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontFamily: 'monospace'
                          }}>
                            ⏱️ {Math.floor(upiCountdown / 60)}:{('0' + (upiCountdown % 60)).slice(-2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsUpiModalOpen(false)}
                            style={{
                              background: isDarkMode ? '#27272a' : '#f1f5f9',
                              border: 'none',
                              color: theme.textMuted,
                              cursor: 'pointer',
                              borderRadius: '50%',
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0
                            }}
                            title="Close"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Compact Amount Banner */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: isDarkMode ? '#1f1913' : '#f8fafc',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '10px',
                        marginBottom: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' }}>
                            Payable:
                          </span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: theme.accent, lineHeight: 1 }}>
                            ₹{Math.round(total)}
                          </span>
                        </div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.65rem',
                          color: '#16a34a',
                          fontWeight: 700
                        }}>
                          <ShieldCheck size={12} /> Auto-filled in app
                        </span>
                      </div>

                      {/* 2x2 Clickable UPI App Buttons */}
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: theme.textMuted, marginBottom: '5px', display: 'block' }}>
                          Pay directly with installed app:
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                          {/* GPay */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={(e) => handleUpiAppClick(e, 'gpay', 'Google Pay')}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                              backgroundColor: isDarkMode ? '#1f1913' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              color: theme.textMain,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <GPayIcon size={20} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>GPay</span>
                          </motion.button>

                          {/* PhonePe */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={(e) => handleUpiAppClick(e, 'phonepe', 'PhonePe')}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                              backgroundColor: isDarkMode ? '#1f1913' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              color: theme.textMain,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <PhonePeIcon size={20} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#5f259f' }}>PhonePe</span>
                          </motion.button>

                          {/* Paytm */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={(e) => handleUpiAppClick(e, 'paytm', 'PayTM')}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                              backgroundColor: isDarkMode ? '#1f1913' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              color: theme.textMain,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <PaytmIcon size={17} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#002970' }}>PayTM</span>
                          </motion.button>

                          {/* BHIM */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={(e) => handleUpiAppClick(e, 'bhim', 'BHIM UPI')}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                              backgroundColor: isDarkMode ? '#1f1913' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              color: theme.textMain,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <BhimIcon size={20} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#008450' }}>BHIM</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Dynamic QR Code Card (Compact, Zero-Scroll) */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '6px 8px',
                        backgroundColor: isDarkMode ? '#1e1814' : '#f8fafc',
                        borderRadius: '12px',
                        border: `1px solid ${theme.border}`,
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          backgroundColor: '#ffffff',
                          padding: '6px',
                          borderRadius: '8px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                          border: '1px solid #e2e8f0',
                          lineHeight: 0
                        }}>
                          <QRCodeSVG
                            value={upiUri}
                            size={116}
                            level="M"
                          />
                        </div>
                        <span style={{ fontSize: '0.67rem', fontWeight: 700, marginTop: '4px', color: theme.textMain }}>
                          Scan with GPay, PhonePe, Paytm, or CRED
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.64rem', color: theme.textMuted, fontFamily: 'monospace' }}>
                            UPI: <strong>{cleanUpiId}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                navigator.clipboard.writeText(cleanUpiId);
                                toast.success('UPI ID copied!');
                              } catch (err) {}
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.accent, padding: 0, display: 'flex', alignItems: 'center' }}
                            title="Copy UPI ID"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Single Checkmark Confirmation Button */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        disabled={isPlacing}
                        onClick={() => executeDirectUpiOrder(customer)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #16a34a, #15803d)',
                          color: '#ffffff',
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          cursor: isPlacing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 3px 10px rgba(22, 163, 74, 0.3)'
                        }}
                      >
                        <Check size={16} strokeWidth={2.5} />
                        <span>{isPlacing ? "Confirming Order..." : `I Have Paid • ₹${Math.round(total)}`}</span>
                      </motion.button>
                    </>
                  );
                })()
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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