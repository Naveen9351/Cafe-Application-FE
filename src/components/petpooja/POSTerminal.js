import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  ShoppingCart, User, Plus, Minus, CreditCard, IndianRupee, Trash2,
  Layers, Sparkles, Check, RefreshCw, AlertCircle, ChefHat, Flame,
  Receipt, Clock, Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getValidFoodImage } from '../AdminPanel';
import styles from './POSTerminal.module.css';

export default function POSTerminal({ tenantId, tenantInfo, menuItems = [], orders = [], onOrderCreated, onOrderPlaced }) {
  const [cart, setCart] = useState([]); // Draft dishes currently being added
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tableNumber, setTableNumber] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI / GPay');
  const [isSettling, setIsSettling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Real-time active uncompleted orders
  const activeOrdersList = useMemo(() => {
    return (orders || []).filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  }, [orders]);

  // Map ALL active orders grouped by table number into arrays (Table Batching)
  const activeOrdersByTable = useMemo(() => {
    const map = {};
    (orders || []).forEach(o => {
      const rawTable = String(o.tableNumber || o.table || '').trim();
      const numOnly = rawTable.replace(/[^0-9]/g, '') || rawTable;
      if (rawTable && o.status !== 'completed' && o.status !== 'cancelled') {
        if (!map[rawTable]) map[rawTable] = [];
        if (!map[rawTable].some(existing => existing._id === o._id)) {
          map[rawTable].push(o);
        }
        if (numOnly && numOnly !== rawTable) {
          if (!map[numOnly]) map[numOnly] = [];
          if (!map[numOnly].some(existing => existing._id === o._id)) {
            map[numOnly].push(o);
          }
        }
        const tblKey = `Table ${numOnly}`;
        if (!map[tblKey]) map[tblKey] = [];
        if (!map[tblKey].some(existing => existing._id === o._id)) {
          map[tblKey].push(o);
        }
      }
    });
    return map;
  }, [orders]);

  // Active orders currently belonging to the selected table batch
  const currentTableOrders = useMemo(() => {
    if (!tableNumber) return [];
    const tStr = String(tableNumber).trim();
    const numOnly = tStr.replace(/[^0-9]/g, '') || tStr;
    return activeOrdersByTable[tStr] || activeOrdersByTable[numOnly] || activeOrdersByTable[`Table ${numOnly}`] || [];
  }, [tableNumber, activeOrdersByTable]);

  // Summarize tables for top live bar: 1 pill per table showing cumulative rounds & total
  const activeTableSummaries = useMemo(() => {
    const tablesMap = {};
    (activeOrdersList || []).forEach(o => {
      const rawTbl = String(o.tableNumber || o.table || '').trim();
      const numOnly = rawTbl.replace(/[^0-9]/g, '') || rawTbl;
      const key = numOnly || rawTbl;
      if (!tablesMap[key]) {
        tablesMap[key] = {
          table: key,
          orders: [],
          totalAmount: 0,
          totalItems: 0,
          customerName: o.customerDetails?.name || o.customerName || 'Guest',
          allPaid: true,
          hasCooking: false
        };
      }
      tablesMap[key].orders.push(o);
      tablesMap[key].totalAmount += Number(o.total || o.totalAmount) || 0;
      tablesMap[key].totalItems += (o.items || []).reduce((s, it) => s + (Number(it.quantity) || 1), 0);
      if (o.paymentStatus !== 'paid') tablesMap[key].allPaid = false;
      if (o.status === 'pending' || o.status === 'preparing') tablesMap[key].hasCooking = true;
    });
    return Object.values(tablesMap).sort((a, b) => (parseInt(a.table) || 0) - (parseInt(b.table) || 0));
  }, [activeOrdersList]);

  // Derive dynamic table list from DB + active live orders
  const availableTables = useMemo(() => {
    const tablesFromDb = (dbTables || []).map(t => String(t.tableNumber || t.table || '').trim()).filter(Boolean);
    const activeTablesFromOrders = Object.keys(activeOrdersByTable).map(t => t.replace(/[^0-9]/g, '') || t).filter(Boolean);

    const combined = Array.from(new Set([...tablesFromDb, ...activeTablesFromOrders]));
    if (combined.length === 0) {
      return ['1', '2', '3', '4'];
    }
    return combined.sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));
  }, [dbTables, activeOrdersByTable]);

  // Select Table handler
  const handleSelectTable = (targetTable) => {
    const tStr = String(targetTable || '').trim();
    const numOnly = tStr.replace(/[^0-9]/g, '') || tStr;
    setTableNumber(tStr || '1');

    const ordersForTable = activeOrdersByTable[tStr] || activeOrdersByTable[numOnly] || activeOrdersByTable[`Table ${numOnly}`] || [];
    if (ordersForTable.length > 0) {
      const firstOrd = ordersForTable[0];
      setCustomerName(firstOrd.customerDetails?.name || firstOrd.customerName || 'Dine-in Guest');
      setCustomerPhone(firstOrd.customerDetails?.phone || firstOrd.customerPhone || '');
      if (firstOrd.paymentMethod) setPaymentMethod(firstOrd.paymentMethod);
      toast.success(`Loaded Table ${tStr} (${ordersForTable.length} active ${ordersForTable.length === 1 ? 'round' : 'rounds'})`);
    } else {
      setCustomerName('');
      setCustomerPhone('');
    }
  };

  // Sync customer details when orders update for current table
  useEffect(() => {
    if (tableNumber && currentTableOrders.length > 0 && !customerName) {
      const firstOrd = currentTableOrders[0];
      setCustomerName(firstOrd.customerDetails?.name || firstOrd.customerName || 'Dine-in Guest');
      setCustomerPhone(firstOrd.customerDetails?.phone || firstOrd.customerPhone || '');
    }
  }, [currentTableOrders, tableNumber]);

  // Cart item management for new draft dishes
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
    toast.success(`Draft dishes cleared for Table ${tableNumber}`);
  };

  // Calculations
  const enableGst = tenantInfo?.settings?.enableGst !== undefined ? tenantInfo.settings.enableGst : true;

  // Total of existing active orders for this table
  const existingOrdersTotal = useMemo(() => {
    return currentTableOrders.reduce((sum, ord) => sum + (Number(ord.total || ord.totalAmount) || 0), 0);
  }, [currentTableOrders]);

  const existingOrdersSubtotal = useMemo(() => {
    return currentTableOrders.reduce((sum, ord) => sum + (Number(ord.subTotal || ord.total || ord.totalAmount) || 0), 0);
  }, [currentTableOrders]);

  // Draft cart calculations
  const getDraftSubtotal = () => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const getDraftTax = () => enableGst ? getDraftSubtotal() * 0.05 : 0;
  const getDraftTotal = () => getDraftSubtotal() + getDraftTax();

  // Combined Grand Total across all active rounds + any new draft dishes
  const getTotalSubtotal = () => existingOrdersSubtotal + getDraftSubtotal();
  const getTotalTax = () => enableGst ? getTotalSubtotal() * 0.05 : 0;
  const getGrandTotal = () => Math.round(existingOrdersTotal + getDraftTotal());

  // Split bill logic
  const triggerSplitBill = () => {
    const total = getGrandTotal();
    const splitAmount = Math.round(total / splitCount);
    const initialSplits = Array.from({ length: splitCount }, (_, i) => ({
      customerName: `Guest ${i + 1}`,
      amount: splitAmount,
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

  // 1. Admin sends new dishes to Kitchen (Creates a NEW order/KOT ticket for this table)
  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      return toast.error("Cart is empty. Please select dishes from the menu first.");
    }
    const token = localStorage.getItem('token');
    setIsSubmitting(true);

    try {
      const payload = {
        items: cart.map(c => ({
          id: c.id,
          quantity: c.quantity,
          variant: c.variant,
          addons: c.addons
        })),
        tenantId: tenantId || '6a762ef86c9d5c8be315f10a',
        tableNumber: String(tableNumber || '1').trim(),
        channel: 'POS Counter',
        status: 'pending',
        paymentStatus: 'pending',
        customerDetails: {
          name: customerName || 'Dine-in Guest',
          phone: customerPhone || ''
        }
      };

      const res = await axios.post(`${API}/orders`, payload, {
        headers: token ? { 'x-auth-token': token } : {}
      });

      const newOrder = res.data;
      setCart([]); // Clear draft dishes
      toast.success(`🍽️ Round #${currentTableOrders.length + 1} sent to Kitchen for Table ${tableNumber}! (Order #${newOrder.orderNumber || newOrder._id?.slice(-4)})`);
      if (onOrderPlaced) onOrderPlaced(newOrder);
      if (onOrderCreated) onOrderCreated(newOrder);
    } catch (err) {
      console.error('Send to kitchen error:', err);
      toast.error(err.response?.data?.error || 'Failed to send order to kitchen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Settle Table (Completes all active orders for this table and frees table)
  const checkoutOrder = async () => {
    const total = getGrandTotal();
    if (total === 0 && currentTableOrders.length === 0 && cart.length === 0) {
      return toast.error("No active orders or dishes to settle");
    }
    const token = localStorage.getItem('token');
    setIsSettling(true);

    try {
      // If there are unsent draft dishes in cart, create an order for them first
      if (cart.length > 0) {
        const draftPayload = {
          items: cart.map(c => ({
            id: c.id,
            name: c.name,
            quantity: c.quantity,
            price: c.price,
            variant: c.variant,
            addons: c.addons
          })),
          tenantId: tenantId || '6a762ef86c9d5c8be315f10a',
          tableNumber: String(tableNumber || '1').trim(),
          channel: 'POS Counter',
          status: 'completed',
          paymentStatus: 'paid',
          paymentMethod,
          customerDetails: {
            name: customerName || 'Dine-in Guest',
            phone: customerPhone || ''
          }
        };
        if (token) {
          await axios.post(`${API}/orders`, draftPayload, {
            headers: { 'x-auth-token': token }
          });
        }
      }

      // Settle all active orders for this table via batch settle endpoint
      if (currentTableOrders.length > 0) {
        const headers = token ? { 'x-auth-token': token } : {};
        await axios.put(
          `${API}/orders/table/${encodeURIComponent(String(tableNumber).trim())}/settle`,
          { paymentMethod, paymentStatus: 'paid', tenantId },
          { headers }
        );
      }

      toast.success(`✓ Table ${tableNumber} fully settled (₹${total})! Table is now free.`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setShowSplitModal(false);

      // Trigger parent to re-fetch all orders so the table clears from live view
      if (onOrderPlaced) onOrderPlaced({ tableNumber, status: 'completed', _refreshAll: true });
      if (onOrderCreated) onOrderCreated({ tableNumber, status: 'completed', _refreshAll: true });

    } catch (err) {
      console.error('Checkout settle error:', err);
      const msg = err.response?.data?.error || err.message || 'Settlement failed';
      toast.error(`Settlement failed: ${msg}. Please try again.`);
    } finally {
      setIsSettling(false);
    }
  };

  const isAllOrdersPaid = currentTableOrders.length > 0 && currentTableOrders.every(o => o.paymentStatus === 'paid');

  return (
    <div className={styles.terminalWrapper}>

      {/* TOP REAL-TIME LIVE SCANNED & ACTIVE ORDERS BANNER (TABLE BATCHING) */}
      {/* <div className={styles.liveOrdersBanner}>
        <div className={styles.liveOrdersHeader}>
          <div className={styles.liveOrdersTitleWrap}>
            <span className={styles.pulsingLiveDot}></span>
            <span className={styles.liveOrdersTitle}>Live Customer Scanned & Active Tables</span>
            <span className={styles.liveOrdersCountBadge}>
              {activeTableSummaries.length} Active {activeTableSummaries.length === 1 ? 'Table' : 'Tables'}
            </span>
          </div>
          <span className={styles.liveOrdersSubtitle}>
            Click any table below to inspect customer scanned rounds, add dishes, or settle bill
          </span>
        </div>

        <div className={styles.liveOrdersPillsRow}>
          {activeTableSummaries.length === 0 ? (
            <div className={styles.liveOrdersEmpty}>
              <AlertCircle size={15} /> No active customer orders right now. When customers scan QR codes at tables or admin punches an order, it appears here in real-time.
            </div>
          ) : (
            activeTableSummaries.map(tbl => {
              const isSelected = String(tableNumber).trim() === tbl.table || String(tableNumber).replace(/[^0-9]/g, '') === tbl.table;

              return (
                <button
                  key={tbl.table}
                  type="button"
                  onClick={() => handleSelectTable(tbl.table)}
                  className={`${styles.liveOrderPill} ${isSelected ? styles.liveOrderPillActive : ''}`}
                >
                  <div className={styles.pillTopRow}>
                    <span className={styles.pillTableTag}>Table {tbl.table}</span>
                    <span className={styles.pillStatusBadge}>
                      {tbl.orders.length > 1 ? `📑 ${tbl.orders.length} Rounds` : (tbl.hasCooking ? '🍳 Cooking' : (tbl.allPaid ? '🟢 Paid' : 'Active'))}
                    </span>
                  </div>
                  <div className={styles.pillBottomRow}>
                    <span>{tbl.totalItems} dishes</span>
                    <span>•</span>
                    <span className={styles.pillPriceTag}>₹{Math.round(tbl.totalAmount)}</span>
                    <span>•</span>
                    <span style={{ maxWidth: '65px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tbl.customerName}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div> */}

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
                    <span className={styles.priceTag}>₹{Math.round(Number(item.salePrice || item.price))}</span>
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
                    title="Clear Draft Dishes"
                  >
                    <Trash2 size={14} /> Clear Draft
                  </button>
                )}
              </div>
            </div>

            {/* Active Table Status Banner */}
            {currentTableOrders.length > 0 && (
              <div className={styles.loadedOrderBanner}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={15} color="#059669" />
                    <span style={{ fontWeight: 800 }}>
                      Table {tableNumber} — {currentTableOrders.length} Active {currentTableOrders.length === 1 ? 'Round' : 'Rounds'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>Guest: <strong>{customerName || 'Dine-in Guest'}</strong></span>
                    <span>•</span>
                    <span>Status: <strong>{isAllOrdersPaid ? '🟢 Paid Online' : '🟡 Bill Pending'}</strong></span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectTable(tableNumber)}
                  className={styles.refreshOrderBtn}
                  title="Refresh table orders"
                >
                  <RefreshCw size={13} />
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
                        const roundsCount = (activeOrdersByTable[tbl] || activeOrdersByTable[numOnly] || []).length;
                        return (
                          <option key={tbl} value={tbl}>
                            Table {tbl} {hasActive ? `• 🟢 LIVE (${roundsCount} ${roundsCount === 1 ? 'Round' : 'Rounds'})` : ''}
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

            {/* Cart & Active Rounds List */}
            <div className={styles.cartList}>
              {currentTableOrders.length === 0 && cart.length === 0 ? (
                <div className={styles.emptyCart}>
                  <ShoppingCart size={34} color="#94a3b8" />
                  <p style={{ margin: '8px 0 0 0', fontWeight: 700, color: '#475569' }}>
                    {tableNumber ? `No dishes for Table ${tableNumber}` : 'Select a Table from Dropdown'}
                  </p>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Select a table with live orders or click dishes on the left to add items.
                  </span>
                </div>
              ) : (
                <>
                  {/* EXISTING ACTIVE ORDERS FOR THIS TABLE (ROUNDS) */}
                  {currentTableOrders.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Active Kitchen Rounds ({currentTableOrders.length})
                      </div>
                      {currentTableOrders.map((ord, roundIdx) => {
                        const ordTotal = Math.round(Number(ord.total || ord.totalAmount) || 0);
                        const isCooking = ord.status === 'preparing';
                        const isPending = ord.status === 'pending';
                        const isReady = ord.status === 'ready';

                        return (
                          <div key={ord._id} className={styles.roundBox}>
                            <div className={styles.roundHeader}>
                              <span>
                                🍳 Round #{roundIdx + 1} <small style={{ color: '#64748b' }}>#{ord.orderNumber || ord._id.slice(-4)}</small>
                              </span>
                              <span className={`${styles.roundStatusBadge} ${isPending ? styles.roundStatusBadgePending : ''}`}>
                                {isPending ? '⏱️ Cooking Pending' : (isCooking ? `🍳 Prepping (${ord.estimatedTime || 20}m)` : (isReady ? '✅ Ready' : ord.status))}
                              </span>
                            </div>
                            {(ord.items || []).map((it, i) => (
                              <div key={i} className={styles.roundItemRow}>
                                <span>{it.name || it.item?.name || 'Dish'} × {it.quantity || 1}</span>
                                <span>₹{Math.round((Number(it.price) || 0) * (Number(it.quantity) || 1))}</span>
                              </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px dashed #e2e8f0', fontSize: '11px', fontWeight: 800, color: '#059669' }}>
                              Round Total: ₹{ordTotal}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* DRAFT DISHES BEING ADDED BY ADMIN IN CURRENT ROUND */}
                  {cart.length > 0 && (
                    <div className={styles.draftBox}>
                      <div className={styles.draftHeader}>
                        <span>➕ New Dishes to Send (Round #{currentTableOrders.length + 1})</span>
                        <button type="button" onClick={() => setCart([])} className={styles.clearDraftBtn}>
                          Clear
                        </button>
                      </div>

                      {cart.map((item, idx) => (
                        <div key={idx} className={styles.cartItemCard}>
                          <div className={styles.cartItemLeft}>
                            <span className={styles.cartItemName}>{item.name}</span>
                            <div className={styles.cartItemPriceRow}>
                              <span className={styles.unitPriceText}>₹{Math.round(item.price)} × {item.quantity}</span>
                              <span className={styles.itemTotalPrice}>₹{Math.round(item.price * item.quantity)}</span>
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
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bill Summary & Action Footer */}
          <div className={styles.cartFooter}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{Math.round(getTotalSubtotal())}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>GST (5%)</span>
              <span>₹{Math.round(getTotalTax())}</span>
            </div>
            <div className={styles.grandTotalRow}>
              <span>Grand Total</span>
              <span className={styles.grandTotalAmount}>₹{Math.round(getGrandTotal())}</span>
            </div>

            <div className={styles.actionBtnGrid}>
              <div className={styles.actionBtnRow}>
                <button
                  type="button"
                  onClick={triggerSplitBill}
                  disabled={getGrandTotal() === 0}
                  className={styles.splitBtn}
                >
                  Split Bill
                </button>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className={styles.splitBtn}
                    style={{ color: '#ef4444', borderColor: '#fca5a5', background: '#fef2f2' }}
                  >
                    Clear Draft
                  </button>
                )}
              </div>

              {/* ACTION BUTTONS BASED ON TABLE STATE */}
              {cart.length > 0 ? (
                <div className={styles.actionBtnRow}>
                  <button
                    type="button"
                    onClick={handleSendToKitchen}
                    disabled={isSubmitting}
                    className={styles.sendKitchenBtn}
                    title="Send new dishes as a separate KOT ticket to Kitchen"
                  >
                    <ChefHat size={16} /> {isSubmitting ? 'Sending...' : `Send Round #${currentTableOrders.length + 1} to Kitchen`}
                  </button>

                  {currentTableOrders.length === 0 ? (
                    <button
                      type="button"
                      onClick={checkoutOrder}
                      disabled={isSettling}
                      className={styles.checkoutBtn}
                      title="Punch order and settle immediately"
                    >
                      <CreditCard size={16} /> {isSettling ? 'Processing...' : `Punch & Settle (₹${getGrandTotal()})`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={checkoutOrder}
                      disabled={isSettling}
                      className={styles.checkoutBtn}
                      title="Settle all rounds for this table and free table"
                    >
                      <Check size={16} /> {isSettling ? 'Settling...' : `Settle & Free Table (₹${getGrandTotal()})`}
                    </button>
                  )}
                </div>
              ) : currentTableOrders.length > 0 ? (
                <div className={styles.actionBtnRow}>
                  <button
                    type="button"
                    onClick={checkoutOrder}
                    disabled={isSettling}
                    className={styles.checkoutBtn}
                    style={{ width: '100%' }}
                  >
                    <Check size={16} /> {isSettling ? 'Settling...' : (isAllOrdersPaid ? `Mark All Completed & Free Table` : `Settle & Free Table (₹${getGrandTotal()})`)}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


