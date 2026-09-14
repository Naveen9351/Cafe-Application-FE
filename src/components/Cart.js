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
  CreditCard,
  Store,
  Lock,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Cart.module.css";

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

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

  // Sync theme with localStorage (Default is Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("isDarkMode");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const theme = isDarkMode ? {
    bgPage: '#090706',
    bgContainer: '#14100c',
    bgCard: '#18130e',
    textMain: '#f5ebe0',
    textMuted: '#a39282',
    accent: '#e05c5c',
    border: 'rgba(224, 92, 92, 0.2)',
    cardBorder: 'rgba(255, 255, 255, 0.07)',
    chipBg: '#1e1812',
    inputBg: '#1f1913',
    inputText: '#ffffff'
  } : {
    bgPage: '#f8fafc',
    bgContainer: '#ffffff',
    bgCard: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
    accent: '#e05c5c',
    border: '#e2e8f0',
    cardBorder: '#e2e8f0',
    chipBg: '#f1f5f9',
    inputBg: '#f8fafc',
    inputText: '#0f172a'
  };

  useEffect(() => {
    const urlTable = searchParams.get("table");
    if (urlTable) {
      setTableNumber(urlTable);
      localStorage.setItem("tableNumber", urlTable);
    }

    // Fetch tenant info for branding
    const tenantId = localStorage.getItem("tenantId");
    if (tenantId) {
      axios.get(`${API}/tenants/public/${tenantId}`)
        .then(res => setTenantInfo(res.data))
        .catch(err => console.error(err));
    }
  }, [searchParams]);

  const handlePlaceOrder = async () => {
    // 1. Validate Table
    if (!tableNumber && paymentMethod === "counter") {
      toast.error("Please enter a table number");
      return;
    }

    // 2. Validate Tenant
    const tenantId = localStorage.getItem("tenantId");
    if (!tenantId) {
      toast.error("Invalid Cafe session. Please rescan QR code.");
      return;
    }

    if (paymentMethod === "online") {
      setIsProcessingPayment(true);
      // Simulate payment gateway delay
      await new Promise(r => setTimeout(r, 2500));
      setIsProcessingPayment(false);
      toast.success("Payment Received!");
    }

    setIsPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })), // Send minimal data
        tenantId, // CRITICAL: Multi-tenant support
        tableNumber: tableNumber || "Online Order",
        status: "pending",
        paymentStatus: paymentMethod === "online" ? "paid" : "pending",
        customerDetails: {
          name: "Guest", // Could add form for this
          phone: ""
        }
      };

      const { data } = await axios.post(`${API}/orders`, payload);

      setItems([]);
      localStorage.removeItem("cartItems");
      toast.success("Order placed successfully!");
      navigate(`/order/status/${data._id}`);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => step === 1 ? navigate(-1) : setStep(1)}
            className={styles.backBtn}
            style={{ color: theme.textMuted, margin: 0 }}
          >
            <ChevronLeft size={20} />
            {step === 1 ? "Back to Menu" : "Back to Cart"}
          </motion.button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={19} color="#fbbe21" /> : <Moon size={19} color="#475569" />}
          </button>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title} style={{ color: theme.textMain }}>{step === 1 ? "Your Cart" : "Checkout"}</h1>
          <p className={styles.subtitle} style={{ color: theme.textMuted }}>
            {step === 1 ? `Review your selection (${cartTotalItems} items)` : "Complete your order"}
          </p>
        </header>

        {/* Steps Indicator */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.activeStep}`}>1</div>
          <div className={`${styles.step} ${step === 2 ? styles.activeStep : ""}`} style={step !== 2 ? { backgroundColor: theme.chipBg, borderColor: theme.border, color: theme.textMuted } : {}}>2</div>
        </div>

        <AnimatePresence mode="wait">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.empty}
            >
              <ShoppingBag size={64} className={styles.emptyIcon} />
              <p>Your cart feels light. Let's add something!</p>
              <Link to="/menu" className={styles.emptyLink}>Browse Menu</Link>
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="cart-review"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
            >
              <div className={styles.itemsList}>
                {items.map((item) => (
                  <motion.div layout key={item.id} className={styles.card} style={{ backgroundColor: theme.bgCard, borderColor: theme.cardBorder }}>
                    <img src={item.image || "/placeholder-food.jpg"} alt={item.name} className={styles.itemImg} />
                    <div className={styles.cardBody}>
                      <div>
                        <h3 className={styles.itemName} style={{ color: theme.textMain }}>{item.name}</h3>
                        <p className={styles.itemPrice}>₹{item.price} each</p>
                      </div>
                      <div className={styles.actions}>
                        <div className={styles.qtyWrapper} style={{ backgroundColor: theme.chipBg, borderColor: theme.border }}>
                          <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className={styles.qtyBtn} style={{ color: theme.textMuted }}>
                            <Minus size={16} />
                          </button>
                          <span className={styles.qty} style={{ color: theme.textMain }}>{item.quantity}</span>
                          <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className={styles.qtyBtn} style={{ color: theme.textMuted }}>
                            <Plus size={16} />
                          </button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className={styles.removeBtn}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className={styles.summary} style={{ backgroundColor: theme.bgPage, borderColor: theme.border }}>
                <div className={styles.row} style={{ color: theme.textMuted }}>
                  <span>Subtotal</span>
                  <span>₹{Math.round(total)}</span>
                </div>
                <div className={styles.row} style={{ color: theme.textMuted }}>
                  <span>Service Fee</span>
                  <span>₹0</span>
                </div>
                <div className={styles.totalRow} style={{ color: theme.textMain, borderColor: theme.border }}>
                  <span>Total</span>
                  <span>₹{Math.round(total)}</span>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className={styles.checkoutBtn}
                >
                  Proceed to Checkout
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="checkout-details"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: theme.textMain }}>Where are you sitting?</label>
                  <input
                    type="number"
                    placeholder="Enter Table Number"
                    className={styles.input}
                    style={{ backgroundColor: theme.inputBg, color: theme.inputText, borderColor: theme.border }}
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} style={{ color: theme.textMain }}>Payment Method</label>
                  <div className={styles.paymentTabs}>
                    <div
                      className={`${styles.payTab} ${paymentMethod === "counter" ? styles.activePayTab : ""}`}
                      style={paymentMethod === "counter" ? { backgroundColor: 'rgba(224, 92, 92, 0.08)', color: theme.textMain, borderColor: '#e05c5c' } : { backgroundColor: theme.inputBg, color: theme.textMuted, borderColor: theme.border }}
                      onClick={() => setPaymentMethod("counter")}
                    >
                      <Store className={styles.payIcon} />
                      Pay at Counter
                    </div>
                    <div
                      className={`${styles.payTab} ${paymentMethod === "online" ? styles.activePayTab : ""}`}
                      style={paymentMethod === "online" ? { backgroundColor: 'rgba(224, 92, 92, 0.08)', color: theme.textMain, borderColor: '#e05c5c' } : { backgroundColor: theme.inputBg, color: theme.textMuted, borderColor: theme.border }}
                      onClick={() => setPaymentMethod("online")}
                    >
                      <CreditCard className={styles.payIcon} />
                      Pay Online
                    </div>
                  </div>
                </div>

                <button
                  disabled={isPlacing}
                  onClick={handlePlaceOrder}
                  className={styles.checkoutBtn}
                >
                  {isPlacing ? "Placing Order..." : `Place Order (₹${Math.round(total)})`}
                </button>

                <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#64748b", marginTop: "1.5rem" }}>
                  <Lock size={12} style={{ display: "inline", marginRight: "4px" }} />
                  Secure SSL Encrypted Checkout
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                <p>Payment to {tenantInfo.name}</p>
                <div className={styles.paymentAmount}>₹{Math.round(total)}</div>
              </div>
              <div className={styles.paymentBody}>
                <div className={styles.loadingSpinner}></div>
                <p style={{ textAlign: "center", fontWeight: "600" }}>Securing connection to bank...</p>
                <p style={{ textAlign: "center", fontStyle: "italic", fontSize: "0.8rem", marginTop: "1rem" }}>
                  Please do not refresh or close this window
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <footer style={{ marginTop: '4rem', padding: '2rem 1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '700' }}>
          Powered by <span style={{ color: '#06b6d4', fontWeight: '800' }}>SERVIQ OS</span>
        </p>
      </footer>
    </div>
  );
}