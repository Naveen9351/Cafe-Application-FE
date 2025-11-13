import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import styles from './OrderStatus.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';
const socket = io(process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com');

function OrderStatus() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`${API}/orders/status/${id}`);
        setOrder(res.data);
      } catch (err) {
        setError('Failed to fetch order: ' + (err.response?.data?.error || 'Server error'));
        console.error(err);
      }
    };

    fetchOrder();

    socket.on('orderUpdate', (updatedOrder) => {
      if (updatedOrder._id === id) {
        setOrder(updatedOrder);
        toast.success(`Order status updated to: ${updatedOrder.status}`, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#22c55e',
            color: '#fff',
            fontSize: '16px',
            padding: '12px 20px',
            borderRadius: '8px',
          },
        });
      }
    });

    socket.on('orderDeleted', ({ id: deletedId }) => {
      if (deletedId === id) {
        setOrder(null);
        setMessage('This order has been deleted by the admin.');
        toast.error('Your order has been deleted by the admin.', {
          position: 'top-right',
          duration: 5000,
          style: {
            background: '#ef4444',
            color: '#fff',
            fontSize: '16px',
            padding: '12px 20px',
            borderRadius: '8px',
          },
        });
      }
    });

    return () => {
      socket.off('orderUpdate');
      socket.off('orderDeleted');
    };
  }, [id]);

  // Progress calculation
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
    const interval = setInterval(calculateProgress, 1000);
    return () => clearInterval(interval);
  }, [order]);

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'ready': return '#10b981';
      case 'done': return '#22c55e';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <Toaster />
        <div className={styles.errorCard}>
          <h1 className={styles.title}>Order Status</h1>
          <p className={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <Toaster />
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>{message || 'Loading your order...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toaster />
      
      <header className={styles.header}>
        <h1 className={styles.title}>Order Status</h1>
        <p className={styles.subtitle}>Live tracking for Table <strong>{order.tableNumber}</strong></p>
      </header>

      <div className={styles.orderCard}>
        {/* Status Badge */}
        <div className={styles.statusHeader}>
          <span
            className={styles.statusBadge}
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <p className={styles.warning}>Do not go back or refresh this page</p>
        </div>

        {/* Estimated Time & Progress */}
        {order.status === 'preparing' && order.estimatedTime && order.timeSetAt ? (
          <div className={styles.progressSection}>
            <div className={styles.timeInfo}>
              <span className={styles.timeLabel}>Estimated Time</span>
              <span className={styles.timeValue}>
                {Math.max(0, Math.ceil((order.estimatedTime * 60 - (Date.now() - new Date(order.timeSetAt).getTime()) / 1000) / 60))} mins
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              >
                <div className={styles.progressGlow}></div>
              </div>
            </div>
            <p className={styles.progressText}>{Math.round(progress)}% Complete</p>
          </div>
        ) : (
          <p className={styles.estimatedTime}>
            Estimated Time: <strong>{order.estimatedTime ? `${order.estimatedTime} mins` : 'N/A'}</strong>
          </p>
        )}

        {/* Order Items */}
        <div className={styles.itemsSection}>
          <h3 className={styles.sectionTitle}>Your Items</h3>
          <div className={styles.itemsList}>
            {order.items.map((item, index) => (
              <div key={item._id} className={styles.item}>
                <img
                  src={item.image}
                  alt={item.name}
                  className={styles.itemImage}
                  onError={(e) => { e.target.src = '/placeholder-food.jpg'; }}
                />
                <div className={styles.itemDetails}>
                  <h4 className={styles.itemName}>{item.name}</h4>
                  <p className={styles.itemDesc}>{item.description}</p>
                  <div className={styles.itemMeta}>
                    <span className={styles.quantity}>x{order.quantities[index]}</span>
                    <span className={styles.price}>₹{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className={styles.totalSection}>
          <div className={styles.totalRow}>
            <span>Total Amount</span>
            <span className={styles.totalAmount}>₹{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Thank you for your order! Enjoy your meal</p>
      </footer>
    </div>
  );
}

export default OrderStatus;