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
            background: '#4caf50',
            color: '#fff',
            fontSize: '16px',
            padding: '10px 20px',
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
          duration: 4000,
          style: {
            background: '#d32f2f',
            color: '#fff',
            fontSize: '16px',
            padding: '10px 20px',
          },
        });
      }
    });

    return () => {
      socket.off('orderUpdate');
      socket.off('orderDeleted');
    };
  }, [id]);

  // Calculate progress for the order
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

    const interval = setInterval(calculateProgress, 1000);
    calculateProgress();

    return () => clearInterval(interval);
  }, [order]);

  if (error) {
    return (
      <div className={styles.container}>
        <Toaster />
        <h1 className={styles.title}>Order Status</h1>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <Toaster />
        <h1 className={styles.title}>Order Status</h1>
        <p>{message || 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Toaster />
      <h1 className={styles.title}>Order Status</h1>
      <div className={styles.order}>
        <h2>Order Details</h2>
        <p className={styles.text}>Do not reload this page !!</p>
        <p className={styles.text}>Table: {order.tableNumber}</p>
        <p className={styles.text}>Status: {order.status}</p>
        {order.status === 'preparing' && order.estimatedTime && order.timeSetAt ? (
          <>
            <p className={styles.text}>
              Time Remaining: {Math.max(0, Math.ceil((order.estimatedTime * 60 - (Date.now() - new Date(order.timeSetAt).getTime()) / 1000) / 60))} mins
            </p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </>
        ) : (
          <p className={styles.text}>Estimated Time: {order.estimatedTime ? `${order.estimatedTime} mins` : 'N/A'}</p>
        )}
        <div>
          <h3 className={styles.itemTitle}>Items:</h3>
          {order.items.map((item, index) => (
            <p key={item._id} className={styles.text}>
              {item.name} x {order.quantities[index]}
            </p>
          ))}
        </div>
        <p className={styles.total}>Total: {order.total.toFixed(2)}</p>
      </div>
    </div>
  );
}

export default OrderStatus;