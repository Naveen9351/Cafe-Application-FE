import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  ArrowLeft,
  Coffee,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './OrderStatus.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';
const socket = io(process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com');

function OrderStatus() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API}/orders/status/${id}`);
        setOrder(res.data);
      } catch (err) {
        setError('Failed to fetch order details');
        console.error(err);
      }
    };

    fetchOrder();

    socket.on('orderUpdate', (updatedOrder) => {
      if (updatedOrder._id === id) {
        setOrder(updatedOrder);
        toast.success(`Order is now ${updatedOrder.status}!`, {
          icon: '✨',
          style: { borderRadius: '12px', background: '#1a2e35', color: '#fff' },
        });
      }
    });

    return () => {
      socket.off('orderUpdate');
    };
  }, [id]);

  useEffect(() => {
    if (!order || order.status !== 'preparing' || !order.estimatedTime || !order.timeSetAt) {
      setProgress(0);
      return;
    }

    const calculateProgress = () => {
      const timeSetAt = new Date(order.timeSetAt).getTime();
      const estimatedMs = order.estimatedTime * 60 * 1000;
      const elapsedMs = Date.now() - timeSetAt;
      const progressPercent = Math.min((elapsedMs / estimatedMs) * 100, 100);
      setProgress(progressPercent);
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 2000);
    return () => clearInterval(interval);
  }, [order]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={32} />;
      case 'preparing': return <ChefHat size={32} />;
      case 'ready': return <Coffee size={32} />;
      case 'done': return <CheckCircle2 size={32} />;
      default: return <Clock size={32} />;
    }
  };

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h2 className={styles.title}>Oops!</h2>
            <p className={styles.subtitle}>{error}</p>
            <Link to="/menu" className={styles.homeBtn} style={{ marginTop: '2rem' }}>
              <ArrowLeft size={18} /> Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Tracking your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />

      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.card}
        >
          <div className={styles.header}>
            <h1 className={styles.title}>Order #{order._id.slice(-6).toUpperCase()}</h1>
            <p className={styles.subtitle}>Table {order.tableNumber}</p>
          </div>

          <div className={styles.statusContainer}>
            <motion.div
              key={order.status}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={styles.iconCircle}
            >
              {getStatusIcon(order.status)}
            </motion.div>
            <h2 className={styles.statusText}>{order.status}</h2>

            {order.status === 'preparing' && (
              <div className={styles.progressWrapper}>
                <div className={styles.progressBar}>
                  <motion.div
                    className={styles.progressFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className={styles.timeInfo}>
                  <span className={styles.timeText}>Estimated Time: </span>
                  <span className={styles.timeValue}>
                    {Math.max(0, Math.ceil((order.estimatedTime * 60 - (Date.now() - new Date(order.timeSetAt).getTime()) / 1000) / 60))} mins
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.itemsSection}>
            <h3 className={styles.sectionTitle}>Order Summary</h3>
            {order.items.map((item, idx) => (
              <div key={idx} className={styles.itemRow}>
                <div className={styles.itemInfo}>
                  <img src={item.image || '/placeholder-food.jpg'} alt="" className={styles.itemImg} />
                  <div>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemQty}>Quantity: {order.quantities[idx]}</p>
                  </div>
                </div>
                <p className={styles.itemPrice}>₹{item.price * order.quantities[idx]}</p>
              </div>
            ))}
          </div>

          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Total Paid</span>
            <span className={styles.totalAmount}>₹{order.total.toFixed(2)}</span>
          </div>
        </motion.div>

        <div className={styles.footer}>
          <Link to="/menu" className={styles.homeBtn}>
            <ArrowLeft size={18} /> Order More Items
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderStatus;