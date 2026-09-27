import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./OrderStatus.module.css";
import axios from "axios";
import { CheckCircle, Clock, ChefHat, ShoppingBag, ArrowRight, Plus, ChevronLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { API_URL as API } from "../config/api";

const OrderStatus = () => {
  const { id } = useParams(); // Should matched defined route param (App.js: /order/status/:id)
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const steps = [
    { id: 'pending', label: 'Order Placed', icon: ShoppingBag },
    { id: 'preparing', label: 'Preparing', icon: ChefHat },
    { id: 'ready', label: 'Ready', icon: CheckCircle },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
  ];

  // Intercept browser / hardware Back button: Always navigate to Menu instead of returning to Cart
  useEffect(() => {
    const handlePopState = (e) => {
      const tbl = order?.tableNumber || localStorage.getItem('serviq_last_table') || '';
      navigate(`/menu${tbl ? `?table=${encodeURIComponent(tbl)}` : ''}`, { replace: true });
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
  const tableTarget = order.tableNumber ? `?table=${encodeURIComponent(order.tableNumber)}` : '';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Top Header with Back to Menu navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate(`/menu${tableTarget}`, { replace: true })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: '#f1f5f9',
              color: '#334155',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <ChevronLeft size={16} /> Back to Menu
          </button>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>
            Table {order.tableNumber || 'Takeaway'}
          </span>
        </div>

        <div className={styles.header}>
          <h1>Order #{order.orderNumber ? order.orderNumber : (order._id ? order._id.slice(-6).toUpperCase() : 'ORD')}</h1>
          <p className={styles.tenantName}>{order?.tenantId?.name || "SERVIQ Cafe"}</p>
          {Number(order.estimatedTime) > 0 && order.tenantId?.settings?.enableEstimatedPrepTime !== false && order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className={styles.estimatedTimeWrapper}>
              <div className={styles.estimatedTimeHeader}>
                <Clock size={15} /> <span>Est. Time: {order.estimatedTime} mins</span>
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
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <div className={styles.iconBox}>
                    <Icon size={18} color={isActive ? "white" : "#94a3b8"} />
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

        {/* ORDER SUMMARY WITH COMPLETE ITEM BREAKDOWN */}
        <div className={styles.details}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>Ordered Items Summary</h3>
          {order.items && order.items.map((item, i) => {
            const varLabel = item.variant?.name ? `(${item.variant.name})` : '';
            const addonsLabel = item.addons && item.addons.length > 0
              ? item.addons.map(a => a.name).join(', ')
              : '';

            return (
              <div
                key={i}
                className={styles.itemRow}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '6px 0',
                  borderBottom: '1px dashed #e2e8f0'
                }}
              >
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                    {item.quantity}x {item.name} {varLabel}
                  </div>
                  {addonsLabel && (
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: 2 }}>
                      Add-ons: {addonsLabel}
                    </div>
                  )}
                  {item.specialNotes && (
                    <div style={{ fontSize: '11px', color: '#b45309', fontStyle: 'italic', marginTop: 1 }}>
                      Note: "{item.specialNotes}"
                    </div>
                  )}
                </div>
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                  ₹{Math.round(item.price * item.quantity)}
                </span>
              </div>
            );
          })}

          <div className={styles.totalRow} style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px solid #e2e8f0' }}>
            <span style={{ fontWeight: 800 }}>Grand Total</span>
            <span style={{ fontWeight: 900, color: '#2563eb', fontSize: '1.15rem' }}>₹{Math.round(order.settledAmount || order.total || 0)}</span>
          </div>
        </div>

        {/* PROMINENT + ADD MORE ITEMS BUTTON */}
        <div style={{ margin: '1.25rem 0' }}>
          <button
            type="button"
            onClick={() => navigate(`/menu${tableTarget}`, { replace: true })}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Plus size={18} strokeWidth={2.5} /> + Add More Items
          </button>
        </div>

        <div className={styles.footer}>
          <p>Table: <strong>{order.tableNumber}</strong> — Enjoy your meal!</p>
          <div className={styles.poweredBy}>
            Powered by{' '}
            <a
              href="https://serviq.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2563eb',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              SERVIQ OS <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;