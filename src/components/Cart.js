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
  Lock
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
    <div className={styles.page}>
      <Toaster position="top-center" />

      <div className={styles.appContainer}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => step === 1 ? navigate(-1) : setStep(1)}
          className={styles.backBtn}
        >
          <ChevronLeft size={20} />
          {step === 1 ? "Back to Menu" : "Back to Cart"}
        </motion.button>

        <header className={styles.header}>
          <h1 className={styles.title}>{step === 1 ? "Your Cart" : "Checkout"}</h1>
          <p className={styles.subtitle}>
            {step === 1 ? `Review your selection (${cartTotalItems} items)` : "Complete your order"}
          </p>
        </header>

        {/* Steps Indicator */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.activeStep}`}>1</div>
          <div className={`${styles.step} ${step === 2 ? styles.activeStep : ""}`}>2</div>
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
                  <motion.div layout key={item.id} className={styles.card}>
                    <img src={item.image || "/placeholder-food.jpg"} alt={item.name} className={styles.itemImg} />
                    <div className={styles.cardBody}>
                      <div>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <p className={styles.itemPrice}>₹{item.price} each</p>
                      </div>
                      <div className={styles.actions}>
                        <div className={styles.qtyWrapper}>
                          <button onClick={() => updateItemQuantity(item.id, item.quantity - 1)} className={styles.qtyBtn}>
                            <Minus size={16} />
                          </button>
                          <span className={styles.qty}>{item.quantity}</span>
                          <button onClick={() => updateItemQuantity(item.id, item.quantity + 1)} className={styles.qtyBtn}>
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

              <div className={styles.summary}>
                <div className={styles.row}>
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className={styles.row}>
                  <span>Service Fee</span>
                  <span>₹0.00</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
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
                  <label className={styles.label}>Where are you sitting?</label>
                  <input
                    type="number"
                    placeholder="Enter Table Number"
                    className={styles.input}
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Payment Method</label>
                  <div className={styles.paymentTabs}>
                    <div
                      className={`${styles.payTab} ${paymentMethod === "counter" ? styles.activePayTab : ""}`}
                      onClick={() => setPaymentMethod("counter")}
                    >
                      <Store className={styles.payIcon} />
                      Pay at Counter
                    </div>
                    <div
                      className={`${styles.payTab} ${paymentMethod === "online" ? styles.activePayTab : ""}`}
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
                  {isPlacing ? "Placing Order..." : `Place Order (₹${total.toFixed(2)})`}
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
                <div className={styles.paymentAmount}>₹{total.toFixed(2)}</div>
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
          Powered by <span style={{ color: '#10b981', fontWeight: '800' }}>RASTRORATO OS</span>
        </p>
      </footer>
    </div>
  );
}