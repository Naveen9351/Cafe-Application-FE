import { useState, useEffect } from 'react';
import { useCartContext } from '../context/CartContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import styles from './Cart.module.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

function Cart() {
  const { items, setItems, getCartTotal, removeItem, updateItemQuantity } = useCartContext();
  const [customerName, setCustomerName] = useState(localStorage.getItem('customerName') || '');
  const [tableNumber, setTableNumber] = useState('');
  const [previousOrders, setPreviousOrders] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Load previous orders and persist cart items
  useEffect(() => {
    try {
      const storedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      if (storedCart.length > 0 && items.length === 0) {
        setItems(storedCart);
        console.log('Loaded cart items from localStorage:', storedCart);
      }
    } catch (err) {
      console.error('Error loading cartItems:', err);
      setError('Failed to load cart items');
    }

    const fetchOrders = async () => {
      if (!customerName) return;
      setIsLoading(true);
      try {
        const res = await axios.get(`${API}/orders`, { params: { customerName } });
        setPreviousOrders(res.data);
        console.log('Fetched previous orders:', res.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch previous orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    socket.on('orderUpdate', (updatedOrder) => {
      setPreviousOrders((prev) =>
        prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order))
      );
    });

    socket.on('orderDeleted', ({ id }) => {
      setPreviousOrders((prev) => prev.filter((order) => order._id !== id));
    });

    return () => {
      socket.off('orderUpdate');
      socket.off('orderDeleted');
    };
  }, [customerName, setItems, items.length]);

  // Persist cart items to localStorage
  useEffect(() => {
    try {
      if (items.length > 0) {
        localStorage.setItem('cartItems', JSON.stringify(items));
        console.log('Saved cart items to localStorage:', items);
      } else {
        localStorage.removeItem('cartItems');
        console.log('Cleared cart items from localStorage');
      }
    } catch (err) {
      console.error('Error saving cartItems:', err);
      setError('Failed to save cart items');
    }
  }, [items]);

  // Handle order placement
  const handleOrder = async () => {
    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!tableNumber || isNaN(tableNumber) || Number(tableNumber) <= 0) {
      setError('Please enter a valid table number');
      return;
    }
    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const order = {
        items: items.map(item => item.id),
        quantities: items.map(item => item.quantity),
        total: getCartTotal(),
        customerName,
        tableNumber,
        status: 'pending',
      };
      const res = await axios.post(`${API}/orders`, order);
      const newOrder = res.data;

      localStorage.setItem('customerName', customerName);
      setItems([]);
      localStorage.removeItem('cartItems');
      setPreviousOrders((prev) => [newOrder, ...prev]);
      navigate(`/order/status/${newOrder._id}`);
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order: ' + (err.response?.data?.error || 'Server error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle customer name change
  const handleCustomerNameChange = (e) => {
    const newName = e.target.value;
    setCustomerName(newName);
    localStorage.setItem('customerName', newName);
    setError(null);
    setPreviousOrders([]);
  };

  // Handle remove item with debug logging
  const handleRemoveItem = (id) => {
    console.log('Removing item with ID:', id);
    console.log('Current cart items:', items);
    removeItem(id);
    console.log('Cart items after remove:', items);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Your Cart</h1>

      {isLoading && <p className={styles.loading}>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* Customer Name and Table Number Inputs */}
      <div className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <div className={styles.formGroup}>
            <label htmlFor="customerName" className={styles.label}>Name</label>
            <input
              type="text"
              id="customerName"
              placeholder="Enter your name"
              value={customerName}
              onChange={handleCustomerNameChange}
              className={styles.input}
              aria-label="Customer name"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="tableNumber" className={styles.label}>Table Number</label>
            <input
              type="text"
              id="tableNumber"
              placeholder="Enter table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className={styles.input}
              aria-label="Table number"
              required
            />
          </div>
        </div>
      </div>

      {/* Previous Orders */}
      {customerName && previousOrders.length > 0 ? (
        <div className={styles.pendingOrders}>
          <h2 className={styles.pendingTitle}>Previous Orders</h2>
          <div className={styles.orderGrid}>
            {previousOrders.map(order => (
              <div key={order._id} className={styles.pendingOrder}>
                <p className={styles.orderText}><span className={styles.orderLabel}>Order ID:</span> {order._id.slice(-6)}</p>
                <p className={styles.orderText}><span className={styles.orderLabel}>Table:</span> {order.tableNumber}</p>
                <p className={styles.orderText}>
                  <span className={styles.orderLabel}>Status:</span> 
                  <span className={order.status === 'done' ? styles.statusDone : styles.statusPreparing}>
                    {order.status}
                  </span>
                </p>
                {order.status === 'preparing' && order.estimatedTime && order.timeSetAt ? (
                  <>
                    <p className={styles.orderText}>
                      Time Remaining: {Math.max(0, Math.ceil((order.estimatedTime * 60 - (Date.now() - new Date(order.timeSetAt).getTime()) / 1000) / 60))} mins
                    </p>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min(((Date.now() - new Date(order.timeSetAt).getTime()) / (order.estimatedTime * 60 * 1000)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <p className={styles.orderText}><span className={styles.orderLabel}>Estimated Time:</span> {order.estimatedTime ? `${order.estimatedTime} mins` : 'N/A'}</p>
                )}
                <p className={styles.orderText}><span className={styles.orderLabel}>Total:</span> ${order.total.toFixed(2)}</p>
                <button
                  onClick={() => navigate(`/order/status/${order._id}`)}
                  className={styles.viewButton}
                  disabled={isLoading}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        customerName && <p className={styles.noPending}>No previous orders found.</p>
      )}

      {/* Cart Contents */}
      {items.length === 0 ? (
        <p className={styles.emptyCart}>Your cart is empty</p>
      ) : (
        <>
          <div className={styles.cartGrid}>
            {items.map(item => (
              <div key={item.id} className={styles.itemContainer}>
                <div className={styles.itemDetails}>
                  <h3 className={styles.itemTitle}>{item.name}</h3>
                  <p className={styles.itemPrice}>${item.price.toFixed(2)} x {item.quantity}</p>
                </div>
                <div className={styles.quantityButtons}>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    className={styles.quantityButton}
                    aria-label={`Increase quantity of ${item.name}`}
                    disabled={isLoading}
                  >
                    +
                  </button>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    className={styles.quantityButton}
                    aria-label={`Decrease quantity of ${item.name}`}
                    disabled={isLoading}
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className={styles.removeButton}
                    aria-label={`Remove ${item.name} from cart`}
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.orderSummary}>
            <p className={styles.total}>Total: ${getCartTotal().toFixed(2)}</p>
            <button
              onClick={handleOrder}
              disabled={!customerName || !tableNumber || items.length === 0 || isLoading}
              className={styles.orderButton}
            >
              Place Order
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;