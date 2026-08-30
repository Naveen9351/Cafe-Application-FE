import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./OrderStatus.module.css";
import axios from "axios";
import { CheckCircle, Clock, ChefHat, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

const OrderStatus = () => {
  const { id } = useParams(); // Should matched defined route param (App.js: /order/status/:id)
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const steps = [
    { id: 'pending', label: 'Order Placed', icon: ShoppingBag },
    { id: 'preparing', label: 'Preparing', icon: ChefHat },
    { id: 'ready', label: 'Ready', icon: CheckCircle },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
  ];

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError("Invalid Order ID");
      setLoading(false);
      return;
    }

    let interval;
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API}/orders/status/${id}`);
        setOrder(res.data);
        setLoading(false);

        // Stop polling if completed or cancelled
        if (['completed', 'cancelled'].includes(res.data.status)) {
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Fetch order error:", err);
        setError("Order not found or invalid ID");
        setLoading(false);
      }
    };

    fetchOrder();
    interval = setInterval(fetchOrder, 5000);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className={styles.loading}>Loading order status...</div>;
  if (error) return (
    <div className={styles.error}>
      <p>{error}</p>
      <Link to="/menu" style={{ marginTop: '1rem', color: '#2563eb' }}>Return to Menu</Link>
    </div>
  );
  if (!order) return <div className={styles.error}>Order not found</div>;

  const currentStepIndex = steps.findIndex(s => s.id === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>
          <p className={styles.tenantName}>{order?.tenantId?.name || "The Cafe"}</p>
          {order.estimatedTime && order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className={styles.estimatedTimeWrapper}>
              <div className={styles.estimatedTimeHeader}>
                <Clock size={16} /> <span>Est. Time: {order.estimatedTime} mins</span>
              </div>
              <div className={styles.progressBarContainer}>
                <motion.div
                  className={styles.progressBarFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (Math.max(0, (new Date() - new Date(order.createdAt)) / 60000) / order.estimatedTime) * 100)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className={styles.timeRemaining}>
                {Math.max(0, Math.ceil(order.estimatedTime - (new Date() - new Date(order.createdAt)) / 60000))} mins remaining
              </p>
            </div>
          )}
        </div>

        {isCancelled ? (
          <div className={styles.cancelled}>
            <h2>Order Cancelled</h2>
            <p>Please contact staff for assistance.</p>
          </div>
        ) : (
          <div className={styles.timeline}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <motion.div
                  key={step.id}
                  className={`${styles.step} ${isActive ? styles.activeStep : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={styles.iconBox}>
                    <Icon size={24} color={isActive ? "white" : "#94a3b8"} />
                  </div>
                  <div className={styles.stepContent}>
                    <h3>{step.label}</h3>
                    {isCurrent && <span className={styles.pulse}>● Processing</span>}
                  </div>
                  {index < steps.length - 1 && <div className={`${styles.line} ${index < currentStepIndex ? styles.activeLine : ''}`} />}
                </motion.div>
              );
            })}
          </div>
        )}

        <div className={styles.details}>
          <h3>Order Summary</h3>
          {order.items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <span>{item.quantity}x {item.name}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className={styles.totalRow}>
            <span>Total Paid</span>
            <span>₹{order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <p>Table: <strong>{order.tableNumber}</strong> — Enjoy your meal!</p>
          <div className={styles.poweredBy}>Powered by <span>RASTRORATO OS</span></div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;