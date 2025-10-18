import { useState, useEffect } from 'react';
import { useCartContext } from '../context/CartContext';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './Cart.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';

function Cart() {
  const { items, setItems, getCartTotal, updateItemQuantity } = useCartContext();
  const [searchParams] = useSearchParams();
  const [tableNumber, setTableNumber] = useState(localStorage.getItem('tableNumber') || '');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [cartKey, setCartKey] = useState(0);
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

  // Load cart items from localStorage only on initial render
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
  }, [setItems]);

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
      setCartKey(prev => prev + 1);
      navigate(`/order/status/${newOrder._id}`);
    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order: ' + (err.response?.data?.error || 'Server error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle remove item with immediate state update
  const handleRemoveItem = (id) => {
    console.log('Removing item with ID:', id);
    console.log('Current cart items:', items);
    setItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== id);
      console.log('Cart items after remove:', updatedItems);
      if (updatedItems.length === 0) {
        localStorage.removeItem('cartItems');
        setCartKey(prev => prev + 1);
      }
      return updatedItems;
    });
  };

  // Handle clear cart
  const handleClearCart = () => {
    console.log('Clearing cart, current items:', items);
    setIsClearing(true);
    setItems([]);
    localStorage.removeItem('cartItems');
    setCartKey(prev => prev + 1);
    console.log('Cart cleared, items:', []);
    setTimeout(() => setIsClearing(false), 500); // Reset clearing state after short delay
  };

  return (
    <div className={styles.container} key={cartKey}>
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

      {/* Cart Contents */}
      {items.length === 0 ? (
        <p className={styles.emptyCart}>
          Your cart is empty.
          {tableNumber && <span> Add items from the menu for Table #{tableNumber}</span>}
        </p>
      ) : (
        <>
          <div className={styles.cartGrid}>
            {items.map((item) => (
              <div key={item.id} className={styles.itemContainer}>
                <div className={styles.itemDetails}>
                  <h3 className={styles.itemTitle}>{item.name}</h3>
                  <p className={styles.itemPrice}>
                    {item.price.toFixed(2)} x {item.quantity} = {(item.price * item.quantity).toFixed(2)} rs
                  </p>
                </div>
                <div className={styles.quantityButtons}>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                    className={styles.quantityButton}
                    aria-label={`Increase quantity of ${item.name}`}
                    disabled={isLoading || isClearing}
                  >
                    +
                  </button>
                  <button
                    onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                    className={styles.quantityButton}
                    aria-label={`Decrease quantity of ${item.name}`}
                    disabled={isLoading || isClearing || item.quantity <= 1}
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className={styles.removeButton}
                    aria-label={`Remove ${item.name} from cart`}
                    disabled={isLoading || isClearing}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.orderSummary}>
            <p className={styles.total}>Total: {getCartTotal().toFixed(2)} rs</p>
            <div className={styles.buttonGroup}>
              <button
                onClick={handleClearCart}
                disabled={isLoading || isClearing}
                className={styles.clearButton}
              >
                {isClearing ? 'Clearing...' : 'Clear Cart'}
              </button>
              <button
                onClick={handleOrder}
                disabled={!tableNumber || items.length === 0 || isLoading || isClearing}
                className={styles.orderButton}
              >
                {isLoading ? 'Placing Order...' : `Place Order for Table #${tableNumber}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;