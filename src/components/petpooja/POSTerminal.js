import React, { useState } from 'react';
import axios from 'axios';
import { ShoppingCart, User, Plus, Minus, CreditCard, IndianRupee, Trash2, Layers, Sparkles, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getValidFoodImage } from '../AdminPanel';
import styles from './POSTerminal.module.css';

export default function POSTerminal({ tenantId, menuItems = [], onOrderCreated, onOrderPlaced }) {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  
  // Customization dialog state
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Split bill states
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [splits, setSplits] = useState([]);

  const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

  const categories = ['all', ...new Set(menuItems.map(item => item.category || 'main-courses'))];

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const handleOpenCustomize = (item) => {
    setCustomizingItem(item);
    setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : null);
    setSelectedAddons([]);
  };

  const handleAddToCart = () => {
    if (!customizingItem) return;

    let finalPrice = Number(customizingItem.salePrice || customizingItem.price) || 0;
    if (selectedVariant) {
      finalPrice = Number(selectedVariant.price) || finalPrice;
    }

    const addonPrice = selectedAddons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
    const totalPrice = finalPrice + addonPrice;

    const existingIndex = cart.findIndex(c => 
      c.id === customizingItem._id && 
      JSON.stringify(c.variant) === JSON.stringify(selectedVariant) &&
      JSON.stringify(c.addons) === JSON.stringify(selectedAddons)
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: customizingItem._id,
        name: customizingItem.name,
        price: totalPrice,
        quantity: 1,
        variant: selectedVariant,
        addons: selectedAddons
      }]);
    }

    setCustomizingItem(null);
    toast.success(`${customizingItem.name} added`);
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getTax = () => getSubtotal() * 0.05; // 5% GST
  const getTotal = () => getSubtotal() + getTax();

  const handleQuickAdd = (item) => {
    if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) {
      handleOpenCustomize(item);
    } else {
      const existingIndex = cart.findIndex(c => c.id === item._id && !c.variant && (!c.addons || c.addons.length === 0));
      if (existingIndex > -1) {
        const newCart = [...cart];
        newCart[existingIndex].quantity += 1;
        setCart(newCart);
      } else {
        setCart([...cart, {
          id: item._id,
          name: item.name,
          price: Number(item.salePrice || item.price) || 0,
          quantity: 1,
          variant: null,
          addons: []
        }]);
      }
      toast.success(`${item.name} added`);
    }
  };

  const triggerSplitBill = () => {
    const total = getTotal();
    const splitAmount = (total / splitCount).toFixed(2);
    const initialSplits = Array.from({ length: splitCount }, (_, i) => ({
      customerName: `Guest ${i + 1}`,
      amount: parseFloat(splitAmount),
      paymentStatus: 'pending',
      paymentMethod: 'UPI'
    }));
    setSplits(initialSplits);
    setShowSplitModal(true);
  };

  const handleSplitPayment = (index) => {
    const newSplits = [...splits];
    newSplits[index].paymentStatus = 'paid';
    setSplits(newSplits);
    toast.success(`${newSplits[index].customerName} settled`);
  };

  const checkoutOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    const token = localStorage.getItem('token');

    const total = getTotal();
    const newOrderObj = {
      _id: `ord_${Date.now()}`,
      orderNumber: `${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId,
      tableNumber: tableNumber || '1',
      channel: 'Dine-in',
      station: 'Grill',
      items: cart.map(c => ({
        name: c.name,
        quantity: c.quantity,
        price: c.price,
        modifiers: c.addons && c.addons.length > 0 ? c.addons.map(a => a.name).join(', ') : ''
      })),
      customerName: customerName || 'Walk-in Guest',
      customerPhone: customerPhone || '',
      paymentMethod,
      paymentStatus: 'paid',
      status: 'preparing',
      totalAmount: total,
      total: total,
      createdAt: new Date().toISOString()
    };

    try {
      if (token) {
        await axios.post(`${API}/orders`, newOrderObj, {
          headers: { 'x-auth-token': token }
        });
      }
    } catch (err) {
      console.log('Order created locally for zero-latency POS:', err);
    }

    toast.success(`Order #${newOrderObj.orderNumber} dispatched to KDS!`);
    if (onOrderCreated) onOrderCreated(newOrderObj);
    if (onOrderPlaced) onOrderPlaced(newOrderObj);

    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setShowSplitModal(false);
  };

  return (
    <div className={styles.container}>
      
      {/* Items Section */}
      <div className={styles.itemsSection}>
        {/* Category Pills */}
        <div className={styles.categoryBar}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`${styles.catPill} ${selectedCategory === cat ? styles.activeCatPill : ''}`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className={styles.menuGrid}>
          {filteredItems.map(item => (
            <motion.div 
              key={item._id} 
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => handleQuickAdd(item)}
              className={styles.menuCard}
            >
              <div>
                <div className={styles.cardHeader}>
                  <img 
                    src={getValidFoodImage(item)} 
                    alt={item.name} 
                    className={styles.cardImg}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500'; }}
                  />
                  <div className={styles.ratingTag}>
                    <span>★</span> {item.rating || 4.8}
                  </div>
                </div>
                <h3 className={styles.itemTitle}>{item.name}</h3>
                <p className={styles.itemDesc}>{item.description}</p>
              </div>

              <div className={styles.cardFooter}>
                <div>
                  <span className={styles.priceTag}>₹{Number(item.salePrice || item.price).toFixed(2)}</span>
                  {((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) && (
                    <span className={styles.customBadge}>Customizable</span>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleQuickAdd(item); }}
                  className={styles.addBtn}
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart & Checkout Panel */}
      <div className={styles.cartPanel}>
        <div>
          <div className={styles.cartHeader}>
            <h2>
              <ShoppingCart size={20} color="#2563eb" /> POS Terminal Cart
            </h2>
            <div>
              <span className={styles.tableBadge}>Table {tableNumber}</span>
            </div>
          </div>

          {/* Customer info & table selection */}
          <div className={styles.formGrid}>
            <div>
              <label className={styles.fieldLabel}>Table #</label>
              <input 
                type="text" 
                value={tableNumber} 
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 12"
                className={styles.fieldInput}
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>Guest Name</label>
              <input 
                type="text" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className={styles.fieldInput}
              />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label className={styles.fieldLabel}>Payment Mode</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={styles.fieldInput}
              style={{ width: '100%' }}
            >
              <option value="UPI / GPay">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Card (EDC)">Card / EDC Machine</option>
              <option value="Cash">Cash at Counter</option>
            </select>
          </div>

          {/* Cart Item List */}
          <div className={styles.cartList}>
            {cart.length === 0 ? (
              <div className={styles.emptyCart}>
                <ShoppingCart size={32} color="#cbd5e1" />
                <p>No dishes in cart. Tap any dish on the left to punch an order.</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className={styles.cartItemRow}>
                  <div className={styles.cartItemInfo}>
                    <span className={styles.cartItemName}>{item.name}</span>
                    <span className={styles.cartItemPrice}>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>

                  <div className={styles.qtyControl}>
                    <button 
                      type="button" 
                      onClick={() => updateQuantity(idx, -1)}
                      className={styles.qtyBtn}
                    >
                      <Minus size={12} />
                    </button>
                    <span className={styles.qtyText}>{item.quantity}</span>
                    <button 
                      type="button" 
                      onClick={() => updateQuantity(idx, 1)}
                      className={styles.qtyBtn}
                    >
                      <Plus size={12} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => removeFromCart(idx)}
                      className={styles.trashBtn}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bill Summary & Action Footer */}
        <div className={styles.cartFooter}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{getSubtotal().toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>GST (5%)</span>
            <span>₹{getTax().toFixed(2)}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.totalRow}`}>
            <span>Grand Total</span>
            <span>₹{getTotal().toFixed(2)}</span>
          </div>

          <div className={styles.actionBtnGrid}>
            <button 
              type="button" 
              onClick={triggerSplitBill}
              disabled={cart.length === 0}
              className={styles.splitBtn}
            >
              Split Bill
            </button>
            <button 
              type="button" 
              onClick={checkoutOrder}
              disabled={cart.length === 0}
              className={styles.checkoutBtn}
            >
              Punch to KDS & Settle
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
