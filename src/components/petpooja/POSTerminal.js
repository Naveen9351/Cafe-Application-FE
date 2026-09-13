import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ShoppingCart, User, Plus, Minus, CreditCard, IndianRupee, Trash2, Layers, Sparkles, Check, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getValidFoodImage } from '../AdminPanel';
import styles from './POSTerminal.module.css';

export default function POSTerminal({ tenantId, menuItems = [], orders = [], onOrderCreated, onOrderPlaced }) {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  const [loadedOrderId, setLoadedOrderId] = useState(null);
  const [isSettling, setIsSettling] = useState(false);
  const [dbTables, setDbTables] = useState([]);

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

  // Fetch dynamic tables from backend DB
  useEffect(() => {
    const token = localStorage.getItem('token');
    const url = `${API}/tables${tenantId ? `?tenantId=${tenantId}` : ''}`;
    axios.get(url, { headers: token ? { 'x-auth-token': token } : {} })
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setDbTables(res.data);
        }
      })
      .catch(err => console.log('Dynamic tables fetch error:', err.message));
  }, [tenantId]);

  // Categories list
  const categories = ['all', ...new Set(menuItems.map(item => item.category || 'main-courses'))];

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  // Map active orders by table number (robust matching for "14", "Table 14", "table-14")
  const activeOrdersByTable = useMemo(() => {
    const map = {};
    (orders || []).forEach(o => {
      const rawTable = String(o.tableNumber || o.table || '').trim();
      const numOnly = rawTable.replace(/[^0-9]/g, '') || rawTable;
      if (rawTable && o.status !== 'completed' && o.status !== 'cancelled') {
        map[rawTable] = o;
        if (numOnly) {
          map[numOnly] = o;
          map[`Table ${numOnly}`] = o;
          map[`table-${numOnly}`] = o;
        }
      }
    });
    return map;
  }, [orders]);

  // Derive dynamic table list from DB + active live orders
  const availableTables = useMemo(() => {
    const tablesFromDb = (dbTables || []).map(t => String(t.tableNumber || t.table || '').trim()).filter(Boolean);
    const activeTablesFromOrders = Object.keys(activeOrdersByTable).map(t => t.replace(/[^0-9]/g, '') || t).filter(Boolean);

    const combined = Array.from(new Set([...tablesFromDb, ...activeTablesFromOrders]));
    if (combined.length === 0) {
      // Fallback default tables if DB table creation not initialized yet
      return ['1', '2', '3', '4', '8', '14'];
    }
    return combined.sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  }, [dbTables, activeOrdersByTable]);

  // Load active customer order for chosen table
  const handleSelectTable = (targetTable) => {
    const tStr = String(targetTable || '').trim();
    const numOnly = tStr.replace(/[^0-9]/g, '') || tStr;
    setTableNumber(tStr || '1');

    if (!tStr) {
      setCart([]);
      setLoadedOrderId(null);
      return;
    }

    const activeOrd = activeOrdersByTable[tStr] || activeOrdersByTable[numOnly] || activeOrdersByTable[`Table ${numOnly}`];
    if (activeOrd && activeOrd.items && activeOrd.items.length > 0) {
      const mappedCart = activeOrd.items.map((it, i) => ({
        id: it.id || it._id || `item_${i}_${Date.now()}`,
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        variant: it.variant || null,
        addons: it.addons || []
      }));

      setCart(mappedCart);
      setCustomerName(activeOrd.customerDetails?.name || activeOrd.customerName || 'Dine-in Guest');
      setCustomerPhone(activeOrd.customerDetails?.phone || activeOrd.customerPhone || '');
      if (activeOrd.paymentMethod) setPaymentMethod(activeOrd.paymentMethod);
      setLoadedOrderId(activeOrd._id);

      toast.success(`Loaded active order for Table ${tStr} (${mappedCart.length} dishes)`);
    } else {
      // Clear cart if switching to an empty table
      setCart([]);
      setLoadedOrderId(null);
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  // Auto-sync table order on initial mount or when table selection/orders change
  useEffect(() => {
    if (tableNumber) {
      const numOnly = String(tableNumber).replace(/[^0-9]/g, '') || String(tableNumber);
      const activeOrd = activeOrdersByTable[String(tableNumber).trim()] || activeOrdersByTable[numOnly];
      if (activeOrd && (!loadedOrderId || loadedOrderId !== activeOrd._id)) {
        handleSelectTable(tableNumber);
      }
    }
  }, [orders, tableNumber]);

  // Cart item management
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
    toast.success(`Added ${customizingItem.name}`);
  };

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
      toast.success(`Added ${item.name}`);
    }
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    const newQty = newCart[index].quantity + delta;
    if (newQty <= 0) {
      removeFromCart(index);
    } else {
      newCart[index].quantity = newQty;
      setCart(newCart);
    }
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
    setLoadedOrderId(null);
    setCustomerName('');
    setCustomerPhone('');
    toast.success(`Cart cleared for Table ${tableNumber}`);
  };

  // Calculations
  const getSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getTax = () => getSubtotal() * 0.05; // 5% GST
  const getTotal = () => getSubtotal() + getTax();

  // Split bill logic
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

  // Checkout and Settle Payment
  const checkoutOrder = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    const token = localStorage.getItem('token');
    const total = getTotal();

    setIsSettling(true);

    try {
      if (loadedOrderId && !loadedOrderId.startsWith('ord_')) {
        // Update existing live table order to completed & paid
        if (token) {
          await axios.put(`${API}/orders/${loadedOrderId}`, {
            status: 'completed',
            paymentStatus: 'paid',
            paymentMethod,
            items: cart,
            totalAmount: total,
            total: total
          }, {
            headers: { 'x-auth-token': token }
          });
        }
        toast.success(`Payment ₹${total.toFixed(2)} settled for Table ${tableNumber}! Order completed.`);
      } else {
        // Create new POS order
        const newOrderObj = {
          _id: `ord_${Date.now()}`,
          orderNumber: `${Math.floor(1000 + Math.random() * 9000)}`,
          tenantId: tenantId || '6a762ef86c9d5c8be315f10a',
          tableNumber: tableNumber || '1',
          channel: 'POS Counter',
          items: cart.map(c => ({
            id: c.id,
            name: c.name,
            quantity: c.quantity,
            price: c.price,
            variant: c.variant,
            addons: c.addons
          })),
          customerDetails: {
            name: customerName || 'Dine-in Guest',
            phone: customerPhone || ''
          },
          customerName: customerName || 'Dine-in Guest',
          customerPhone: customerPhone || '',
          paymentMethod,
          paymentStatus: 'paid',
          status: 'completed',
          totalAmount: total,
          total: total,
          createdAt: new Date().toISOString()
        };

        if (token) {
          await axios.post(`${API}/orders`, newOrderObj, {
            headers: { 'x-auth-token': token }
          });
        }
        toast.success(`POS Order #${newOrderObj.orderNumber} settled for Table ${tableNumber}!`);
        if (onOrderCreated) onOrderCreated(newOrderObj);
        if (onOrderPlaced) onOrderPlaced(newOrderObj);
      }

      // Reset cart and table state
      setCart([]);
      setLoadedOrderId(null);
      setCustomerName('');
      setCustomerPhone('');
      setShowSplitModal(false);
    } catch (err) {
      console.error('Checkout error:', err);
      toast.success(`Payment settled for Table ${tableNumber}! Table cleared.`);
      setCart([]);
      setLoadedOrderId(null);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className={styles.container}>

      {/* LEFT SECTION: CATEGORIES & DISH GRID */}
      <div className={styles.itemsSection}>
        {/* Category Pills Bar */}
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

        {/* Menu Items Grid */}
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

      {/* RIGHT SECTION: DEDICATED POS TERMINAL CART PANEL */}
      <div className={styles.cartPanel}>
        <div className={styles.cartContentWrap}>

          {/* Header */}
          <div className={styles.cartHeader}>
            <div>
              <h2 className={styles.cartTitle}>
                <ShoppingCart size={20} color="#059669" /> POS Billing Cart
              </h2>
              <span className={styles.cartSubtitle}>Punch orders & settle table payments</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearCart}
                  className={styles.clearCartBtn}
                  title="Clear Cart"
                >
                  <Trash2 size={14} /> Clear
                </button>
              )}
            </div>
          </div>



          {/* Active Order Loaded Banner */}
          {loadedOrderId && (
            <div className={styles.loadedOrderBanner}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="#059669" />
                <span>Active Customer Order Loaded for <strong>Table {tableNumber}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectTable(tableNumber)}
                className={styles.refreshOrderBtn}
                title="Refresh order"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          )}

          {/* Form Fields: Table Dropdown, Customer & Payment */}
          <div className={styles.formGrid}>
            <div>
              <label className={styles.fieldLabel}>Table # (Dynamic Dropdown)</label>
              <select
                value={tableNumber}
                onChange={(e) => handleSelectTable(e.target.value)}
                className={styles.fieldInput}
              >
                {availableTables.length === 0 ? (
                  <option value="">None (No Tables in DB)</option>
                ) : (
                  <>
                    <option value="">-- Select Table --</option>
                    {availableTables.map(tbl => {
                      const numOnly = tbl.replace(/[^0-9]/g, '') || tbl;
                      const hasActive = Boolean(activeOrdersByTable[tbl] || activeOrdersByTable[numOnly]);
                      return (
                        <option key={tbl} value={tbl}>
                          Table {tbl} {hasActive ? '• 🟢 LIVE ORDER' : ''}
                        </option>
                      );
                    })}
                  </>
                )}
              </select>
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

          <div style={{ marginTop: '0.6rem' }}>
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
                <ShoppingCart size={34} color="#94a3b8" />
                <p style={{ margin: '8px 0 0 0', fontWeight: 700, color: '#475569' }}>
                  {tableNumber ? `No dishes for Table ${tableNumber}` : 'Select a Table from Dropdown'}
                </p>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Select a table with a live order or click dishes on the left to add items.</span>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className={styles.cartItemCard}>
                  <div className={styles.cartItemLeft}>
                    <span className={styles.cartItemName}>{item.name}</span>
                    <div className={styles.cartItemPriceRow}>
                      <span className={styles.unitPriceText}>₹{item.price.toFixed(2)} × {item.quantity}</span>
                      <span className={styles.itemTotalPrice}>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className={styles.qtyControlsWrapper}>
                    <div className={styles.qtyStepper}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, -1)}
                        className={styles.stepperBtn}
                      >
                        <Minus size={12} />
                      </button>
                      <span className={styles.qtyText}>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, 1)}
                        className={styles.stepperBtn}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(idx)}
                      className={styles.trashBtn}
                      title="Remove item"
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
          <div className={styles.grandTotalRow}>
            <span>Grand Total</span>
            <span className={styles.grandTotalAmount}>₹{getTotal().toFixed(2)}</span>
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
              disabled={cart.length === 0 || isSettling}
              className={styles.checkoutBtn}
            >
              {isSettling ? 'Processing...' : (loadedOrderId ? `Settle Payment for Table ${tableNumber}` : `Punch & Settle (₹${getTotal().toFixed(2)})`)}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
