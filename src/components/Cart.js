import { useState, useEffect } from 'react';
import { useCartContext } from '../context/CartContext';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import styles from './Cart.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';
const socket = io(process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com');

function Cart() {
  const { items, setItems, getCartTotal, removeItem, updateItemQuantity } = useCartContext();
  const [searchParams] = useSearchParams();
  const [tableNumber, setTableNumber] = useState(localStorage.getItem('tableNumber') || '');
  const [previousOrders, setPreviousOrders] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Load table number from URL params or localStorage
  useEffect(() => {
    const urlTableNumber = searchParams.get('table');
    if (urlTableNumber) {
      setTableNumber(urlTableNumber);
      localStorage.setItem('tableNumber', urlTableNumber);
    } else if (!tableNumber) {
      const storedTableNumber = localStorage.getItem('tableNumber');
      if (storedTableNumber) {
        setTableNumber(storedTableNumber);
      } else {
        setError('No table number detected. Please scan the QR code from your table.');
      }
    }
  }, [searchParams, tableNumber]);

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
      if (!tableNumber) return;
      setIsLoading(true);
      try {
        const res = await axios.get(`${API}/orders`, { 
          params: { tableNumber } 
        });
        setPreviousOrders(res.data);
        console.log('Fetched previous orders:', res.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch previous orders');
      } finally {
        setIsLoading(false);
      }
    };

    if (tableNumber) {
      fetchOrders();
    }

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
  }, [tableNumber, setItems, items.length]);

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
    if (!tableNumber) {
      setError('Table number is required. Please scan the QR code from your table.');
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
        tableNumber,
        status: 'pending',
      };
      const res = await axios.post(`${API}/orders`, order);
      const newOrder = res.data;

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
      
      {/* Display Table Number */}
      {tableNumber && (
        <div className={styles.tableInfo}>
          <p className={styles.tableDisplay}>
            <strong>Table: #{tableNumber}</strong>
          </p>
        </div>
      )}

      {isLoading && <p className={styles.loading}>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* Previous Orders */}
      {tableNumber && previousOrders.length > 0 ? (
        <div className={styles.pendingOrders}>
          <h2 className={styles.pendingTitle}>Previous Orders for Table #{tableNumber}</h2>
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
        tableNumber && <p className={styles.noPending}>No previous orders found for this table.</p>
      )}

      {/* Cart Contents */}
      {items.length === 0 ? (
        <p className={styles.emptyCart}>Your cart is empty. 
          {tableNumber && <span> Add items from the menu for Table #{tableNumber}</span>}
        </p>
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
                    disabled={isLoading || item.quantity <= 1}
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
              disabled={!tableNumber || items.length === 0 || isLoading}
              className={styles.orderButton}
            >
              {isLoading ? 'Placing Order...' : 'Place Order for Table #' + tableNumber}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;