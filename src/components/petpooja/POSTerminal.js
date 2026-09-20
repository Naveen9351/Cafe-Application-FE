import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Grid, Plus, Minus, Search, Check, X, RefreshCw, CreditCard,
  Trash2, QrCode, Printer, Smartphone, Zap, Coffee, Clock,
  ChevronDown, ChevronUp, Tag, ArrowLeft, ShoppingCart, IndianRupee,
  Utensils, ChefHat, Eye, CheckCircle2, AlertCircle, Sparkles, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getValidFoodImage } from '../AdminPanel';
import styles from './POSTerminal.module.css';
import { API_URL as API } from '../../config/api';

export default function POSTerminal({
  tenantId,
  tenantInfo,
  menuItems = [],
  orders = [],
  initialTable = null,
  onOrderCreated,
  onOrderPlaced,
  onSettleTable
}) {
  // View mode: 'tables' (Petpooja table matrix) or 'terminal' (POS billing)
  const [viewMode, setViewMode] = useState(initialTable ? 'terminal' : 'tables');
  const [tableNumber, setTableNumber] = useState(initialTable || '1');
  const [selectedZone, setSelectedZone] = useState('all');
  const [tableStatusFilter, setTableStatusFilter] = useState('all'); // 'all', 'free', 'occupied', 'paid'
  const [tableSearch, setTableSearch] = useState('');

  // Cart & Settlement state for POS Terminal
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dishSearch, setDishSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isSettling, setIsSettling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbTables, setDbTables] = useState([]);

  // Khata / Borrow Modal states
  const [showKhataModal, setShowKhataModal] = useState(false);
  const [khataPaidAmount, setKhataPaidAmount] = useState('');
  const [khataBorrowAmount, setKhataBorrowAmount] = useState(0);
  const [khataNotes, setKhataNotes] = useState('');
  const [isSubmittingKhata, setIsSubmittingKhata] = useState(false);

  // Add Table Modal state
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState('4');
  const [newTableZone, setNewTableZone] = useState('Main Floor');

  // Customization dialog state
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Split bill states
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  // Fetch dynamic tables from backend DB
  const fetchDbTables = useCallback(() => {
    const token = localStorage.getItem('token');
    const url = `${API}/tables${tenantId ? `?tenantId=${tenantId}` : ''}`;
    axios.get(url, { headers: token ? { 'x-auth-token': token } : {} })
      .then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setDbTables(res.data);
        } else {
          setDbTables([
            { _id: 't1', tableNumber: '1', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't2', tableNumber: '2', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't3', tableNumber: '3', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't4', tableNumber: '4', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't5', tableNumber: '5', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't6', tableNumber: '6', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't7', tableNumber: '7', seatingCapacity: 2, zone: 'Garden' },
            { _id: 't8', tableNumber: '8', seatingCapacity: 4, zone: 'Roof Top' }
          ]);
        }
      })
      .catch(err => {
        console.log('Dynamic tables fetch error:', err.message);
        if (dbTables.length === 0) {
          setDbTables([
            { _id: 't1', tableNumber: '1', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't2', tableNumber: '2', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't3', tableNumber: '3', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't4', tableNumber: '4', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't5', tableNumber: '5', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't6', tableNumber: '6', seatingCapacity: 4, zone: 'Main Floor' },
            { _id: 't7', tableNumber: '7', seatingCapacity: 2, zone: 'Garden' },
            { _id: 't8', tableNumber: '8', seatingCapacity: 4, zone: 'Roof Top' }
          ]);
        }
      });
  }, [tenantId]);

  useEffect(() => {
    fetchDbTables();
  }, [fetchDbTables]);

  useEffect(() => {
    if (initialTable) {
      setTableNumber(initialTable);
      setViewMode('terminal');
    }
  }, [initialTable]);

  // Real-time active uncompleted orders
  const activeOrdersList = useMemo(() => {
    return (orders || []).filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  }, [orders]);

  // Active orders grouped by table
  const activeOrdersByTable = useMemo(() => {
    const map = {};
    (orders || []).forEach(o => {
      if (o.status === 'completed' || o.status === 'cancelled') return;
      const rawTable = String(o.tableNumber || o.table || '').trim();
      const numOnly = rawTable.replace(/[^0-9]/g, '') || rawTable;
      if (rawTable) {
        if (!map[rawTable]) map[rawTable] = [];
        if (!map[rawTable].some(e => e._id === o._id)) map[rawTable].push(o);

        if (numOnly && numOnly !== rawTable) {
          if (!map[numOnly]) map[numOnly] = [];
          if (!map[numOnly].some(e => e._id === o._id)) map[numOnly].push(o);
        }
        const tblKey = `Table ${numOnly}`;
        if (!map[tblKey]) map[tblKey] = [];
        if (!map[tblKey].some(e => e._id === o._id)) map[tblKey].push(o);
      }
    });
    return map;
  }, [orders]);

  // Helper: Get active orders for a specific table object
  const getOrdersForTableObj = useCallback((tbl) => {
    const tStr = String(tbl.tableNumber || tbl.table || '').trim();
    const numOnly = tStr.replace(/[^0-9]/g, '') || tStr;
    return activeOrdersByTable[tStr] || activeOrdersByTable[numOnly] || activeOrdersByTable[`Table ${numOnly}`] || [];
  }, [activeOrdersByTable]);

  // Unified tables list (combines DB tables and active orders)
  const allTablesList = useMemo(() => {
    const fromDb = [...dbTables];
    // Check if any active orders have tables not in DB
    Object.keys(activeOrdersByTable).forEach(rawTbl => {
      const numOnly = rawTbl.replace(/[^0-9]/g, '') || rawTbl;
      if (!fromDb.some(t => String(t.tableNumber) === numOnly || String(t.tableNumber) === rawTbl)) {
        fromDb.push({
          _id: `auto_${rawTbl}`,
          tableNumber: numOnly || rawTbl,
          seatingCapacity: 4,
          zone: 'Main Floor'
        });
      }
    });

    return fromDb.sort((a, b) => {
      return String(a.tableNumber || '').localeCompare(String(b.tableNumber || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [dbTables, activeOrdersByTable]);

  // Available zones / floor sections
  const zonesList = useMemo(() => {
    const zones = ['all'];
    allTablesList.forEach(t => {
      const z = t.zone || 'Main Floor';
      if (!zones.includes(z)) zones.push(z);
    });
    return zones;
  }, [allTablesList]);

  // Filtered tables for floor view
  const filteredFloorTables = useMemo(() => {
    return allTablesList.filter(t => {
      const tableOrders = getOrdersForTableObj(t);
      const isOccupied = tableOrders.length > 0;
      const isAllPaid = isOccupied && tableOrders.every(o => o.paymentStatus === 'paid' || o.status === 'served');

      // Zone filter
      if (selectedZone !== 'all' && (t.zone || 'Main Floor') !== selectedZone) {
        return false;
      }

      // Status filter
      if (tableStatusFilter === 'free' && isOccupied) return false;
      if (tableStatusFilter === 'occupied' && (!isOccupied || isAllPaid)) return false;
      if (tableStatusFilter === 'paid' && !isAllPaid) return false;

      // Search filter
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase().trim();
        const tNum = String(t.tableNumber).toLowerCase();
        const hasMatch = tNum.includes(query) ||
          tableOrders.some(o => (o.customerName || o.customerDetails?.name || '').toLowerCase().includes(query));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [allTablesList, getOrdersForTableObj, selectedZone, tableStatusFilter, tableSearch]);

  // Active table stats
  const tableStats = useMemo(() => {
    let freeCount = 0;
    let occupiedCount = 0;
    let paidCount = 0;

    allTablesList.forEach(t => {
      const ords = getOrdersForTableObj(t);
      if (ords.length === 0) {
        freeCount++;
      } else if (ords.every(o => o.paymentStatus === 'paid' || o.status === 'served')) {
        paidCount++;
      } else {
        occupiedCount++;
      }
    });

    return {
      total: allTablesList.length,
      free: freeCount,
      occupied: occupiedCount,
      paid: paidCount
    };
  }, [allTablesList, getOrdersForTableObj]);

  // Handle clicking a table card -> opens POS Terminal
  const handleOpenTableInPOS = (tblNum) => {
    const tStr = String(tblNum).trim();
    setTableNumber(tStr);
    setViewMode('terminal');

    const ordersForTable = activeOrdersByTable[tStr] || activeOrdersByTable[tStr.replace(/[^0-9]/g, '')] || [];
    if (ordersForTable.length > 0) {
      const firstOrd = ordersForTable[0];
      setCustomerName(firstOrd.customerDetails?.name || firstOrd.customerName || 'Dine-in Guest');
      setCustomerPhone(firstOrd.customerDetails?.phone || firstOrd.customerPhone || '');
      if (firstOrd.paymentMethod) setPaymentMethod(firstOrd.paymentMethod);
      toast.success(`Opened Table ${tStr} (${ordersForTable.length} running ${ordersForTable.length === 1 ? 'round' : 'rounds'})`);
    } else {
      setCustomerName('');
      setCustomerPhone('');
      toast.success(`Selected Table ${tStr}`);
    }
  };

  // Quick Walkin / Counter POS
  const handleQuickWalkin = () => {
    setTableNumber('Walk-in');
    setCustomerName('Walk-in Guest');
    setCustomerPhone('');
    setViewMode('terminal');
    toast.success('Opened Counter Walk-in POS');
  };

  // Active orders currently belonging to the selected table in POS
  const currentTableOrders = useMemo(() => {
    if (!tableNumber) return [];
    const tStr = String(tableNumber).trim();
    const numOnly = tStr.replace(/[^0-9]/g, '') || tStr;
    return activeOrdersByTable[tStr] || activeOrdersByTable[numOnly] || activeOrdersByTable[`Table ${numOnly}`] || [];
  }, [tableNumber, activeOrdersByTable]);

  // Running orders total
  const runningOrdersTotal = useMemo(() => {
    return currentTableOrders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0);
  }, [currentTableOrders]);

  // Current draft cart total
  const draftCartTotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + (Number(it.price) * (Number(it.quantity) || 1)), 0);
  }, [cart]);

  const grandTotal = runningOrdersTotal + draftCartTotal;

  // Categories list for POS Menu
  const categories = useMemo(() => {
    return ['all', ...new Set(menuItems.map(item => item.category || 'main-courses'))];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = !dishSearch || item.name.toLowerCase().includes(dishSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategory, dishSearch]);

  // Cart operations
  const handleQuickAdd = (item) => {
    if ((item.variants && item.variants.length > 0) || (item.addons && item.addons.length > 0)) {
      setCustomizingItem(item);
      setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : null);
      setSelectedAddons([]);
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

  const handleAddCustomized = () => {
    if (!customizingItem) return;
    let finalPrice = Number(customizingItem.salePrice || customizingItem.price) || 0;
    if (selectedVariant) finalPrice = Number(selectedVariant.price) || finalPrice;
    const addonPrice = selectedAddons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
    const totalPrice = finalPrice + addonPrice;

    setCart([...cart, {
      id: customizingItem._id,
      name: customizingItem.name,
      price: totalPrice,
      quantity: 1,
      variant: selectedVariant,
      addons: selectedAddons
    }]);

    setCustomizingItem(null);
    toast.success(`Added ${customizingItem.name}`);
  };

  const updateCartQty = (idx, delta) => {
    const newCart = [...cart];
    newCart[idx].quantity += delta;
    if (newCart[idx].quantity <= 0) {
      newCart.splice(idx, 1);
    }
    setCart(newCart);
  };

  // Update existing active order item (inline quantity adjustment / delete)
  const handleUpdateExistingOrderItem = async (orderId, itemIndex, delta) => {
    const order = currentTableOrders.find(o => o._id === orderId);
    if (!order) return;
    const newItems = [...(order.items || [])];
    if (!newItems[itemIndex]) return;

    newItems[itemIndex] = {
      ...newItems[itemIndex],
      quantity: (newItems[itemIndex].quantity || 1) + delta
    };

    if (newItems[itemIndex].quantity <= 0) {
      newItems.splice(itemIndex, 1);
    }

    const newTotal = newItems.reduce((sum, it) => sum + ((Number(it.price) || 0) * (it.quantity || 1)), 0);
    const token = localStorage.getItem('token');

    try {
      if (newItems.length === 0) {
        await axios.delete(`${API}/orders/${orderId}`, {
          headers: token ? { 'x-auth-token': token } : {}
        });
        toast.success('Order removed');
      } else {
        await axios.put(`${API}/orders/${orderId}`, {
          items: newItems,
          totalAmount: newTotal
        }, {
          headers: token ? { 'x-auth-token': token } : {}
        });
        toast.success('Updated item quantity');
      }
      if (onOrderPlaced) onOrderPlaced({ tableNumber, _refreshAll: true });
    } catch (err) {
      console.error('Update item error:', err);
      toast.error('Failed to update order item');
    }
  };

  // Send to Kitchen / Submit New Order (Directly sets status to 'preparing' - In Kitchen)
  const handleSendKOT = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add dishes first!');
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const effectiveTenantId = tenantId || tenantInfo?._id || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

    const orderPayload = {
      tenantId: effectiveTenantId,
      tableNumber: tableNumber === 'Walk-in' ? 'Walk-in' : String(tableNumber),
      orderType: tableNumber === 'Walk-in' ? 'takeaway' : 'dine_in',
      customerName: customerName.trim() || 'Guest',
      customerPhone: customerPhone.trim(),
      customerDetails: {
        name: customerName.trim() || 'Guest',
        phone: customerPhone.trim()
      },
      paymentMethod,
      status: 'preparing', // Directly marks as "In Kitchen" when sent from POS terminal
      paymentStatus: 'pending',
      items: cart.map(it => ({
        id: it.id,
        itemId: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        variant: it.variant ? it.variant : null,
        addons: (it.addons || [])
      })),
      totalAmount: draftCartTotal
    };

    try {
      const res = await axios.post(`${API}/orders`, orderPayload, {
        headers: token ? { 'x-auth-token': token } : {}
      });

      toast.success(`✓ Order sent to Kitchen for Table ${tableNumber}!`);
      setCart([]);
      if (onOrderPlaced) onOrderPlaced(res.data);
      if (onOrderCreated) onOrderCreated(res.data);
    } catch (err) {
      console.error('Send order error:', err);
      toast.error('Failed to submit order: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Settle Bill & Clear Table
  const handleSettleBill = async () => {
    if (grandTotal <= 0 && currentTableOrders.length === 0 && cart.length === 0) {
      toast.error('No items or active orders to settle for this table.');
      return;
    }

    setIsSettling(true);
    const token = localStorage.getItem('token');
    const effectiveTenantId = tenantId || tenantInfo?._id || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

    try {
      // 1. If draft cart has items, create the final round first
      if (cart.length > 0) {
        const orderPayload = {
          tenantId: effectiveTenantId,
          tableNumber: tableNumber === 'Walk-in' ? 'Walk-in' : String(tableNumber),
          orderType: tableNumber === 'Walk-in' ? 'takeaway' : 'dine_in',
          customerName: customerName.trim() || 'Guest',
          customerPhone: customerPhone.trim(),
          customerDetails: {
            name: customerName.trim() || 'Guest',
            phone: customerPhone.trim()
          },
          paymentMethod,
          paymentStatus: 'paid',
          items: cart.map(it => ({
            id: it.id,
            itemId: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            variant: it.variant ? it.variant : null,
            addons: (it.addons || [])
          })),
          totalAmount: draftCartTotal
        };
        await axios.post(`${API}/orders`, orderPayload, {
          headers: token ? { 'x-auth-token': token } : {}
        });
      }

      // 2. Settle all existing orders on this table
      if (tableNumber !== 'Walk-in' && currentTableOrders.length > 0) {
        await axios.put(
          `${API}/orders/table/${encodeURIComponent(String(tableNumber).trim())}/settle`,
          { paymentMethod, paymentStatus: 'paid', tenantId: effectiveTenantId },
          { headers: token ? { 'x-auth-token': token } : {} }
        );
      }

      toast.success(`✓ Table ${tableNumber} fully settled (₹${grandTotal})! Table is now free.`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setShowSplitModal(false);

      if (onOrderPlaced) onOrderPlaced({ tableNumber, status: 'completed', _refreshAll: true });
      if (onOrderCreated) onOrderCreated({ tableNumber, status: 'completed', _refreshAll: true });
      if (onSettleTable) onSettleTable(tableNumber);

      // Return to table matrix view
      setViewMode('tables');
    } catch (err) {
      console.error('Settle table error:', err);
      toast.error('Settlement error: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSettling(false);
    }
  };

  // Confirm Khata / Borrow (Udhari) Record & Settlement
  const handleConfirmKhataSettlement = async (e) => {
    if (e) e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error('Customer Name and Phone number are required to record Khata / Borrow');
      return;
    }

    const paidNum = Number(khataPaidAmount) || 0;
    const borrowNum = Math.max(0, grandTotal - paidNum);

    setIsSubmittingKhata(true);
    const token = localStorage.getItem('token');
    const effectiveTenantId = tenantId || tenantInfo?._id || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

    try {
      // 1. If draft cart has items, create the final round first
      if (cart.length > 0) {
        const orderPayload = {
          tenantId: effectiveTenantId,
          tableNumber: tableNumber === 'Walk-in' ? 'Walk-in' : String(tableNumber),
          orderType: tableNumber === 'Walk-in' ? 'takeaway' : 'dine_in',
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerDetails: {
            name: customerName.trim(),
            phone: customerPhone.trim()
          },
          paymentMethod: 'Khata / Borrow',
          paymentStatus: borrowNum === 0 ? 'paid' : (paidNum > 0 ? 'partial' : 'pending'),
          items: cart.map(it => ({
            id: it.id,
            itemId: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            variant: it.variant ? it.variant : null,
            addons: (it.addons || [])
          })),
          totalAmount: draftCartTotal
        };
        await axios.post(`${API}/orders`, orderPayload, {
          headers: token ? { 'x-auth-token': token } : {}
        });
      }

      // 2. Record in Khata / Customer Credit Ledger
      await axios.post(`${API}/khata`, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        totalBill: grandTotal,
        paidAmount: paidNum,
        borrowAmount: borrowNum,
        notes: khataNotes || `Table ${tableNumber} order`
      }, {
        headers: token ? { 'x-auth-token': token } : {}
      });

      // 3. Settle all existing orders on this table
      if (tableNumber !== 'Walk-in' && currentTableOrders.length > 0) {
        await axios.put(
          `${API}/orders/table/${encodeURIComponent(String(tableNumber).trim())}/settle`,
          { paymentMethod: 'Khata / Borrow', paymentStatus: borrowNum === 0 ? 'paid' : 'partial', tenantId: effectiveTenantId },
          { headers: token ? { 'x-auth-token': token } : {} }
        );
      }

      toast.success(`✓ Khata recorded for ${customerName} (Paid: ₹${paidNum}, Borrow: ₹${borrowNum}). Table cleared!`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setShowKhataModal(false);

      if (onOrderPlaced) onOrderPlaced({ tableNumber, status: 'completed', _refreshAll: true });
      if (onOrderCreated) onOrderCreated({ tableNumber, status: 'completed', _refreshAll: true });
      if (onSettleTable) onSettleTable(tableNumber);

      setViewMode('tables');
    } catch (err) {
      console.error('Khata settlement error:', err);
      toast.error('Failed to record Khata: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingKhata(false);
    }
  };

  // Quick Thermal Print Receipt simulation
  const handlePrintReceipt = (e, tblNum, amount) => {
    if (e) e.stopPropagation();
    toast.success(`🖨️ Printing receipt for Table ${tblNum} (₹${amount})`, {
      icon: '🖨️',
      style: { background: '#0f172a', color: '#ffffff' }
    });
  };

  // Create new table
  const handleAddTableSubmit = async (e) => {
    e.preventDefault();
    if (!newTableNum.trim()) {
      toast.error('Please enter a table number');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(`${API}/tables`, {
        tableNumber: newTableNum.trim(),
        seatingCapacity: Number(newTableCap) || 4,
        zone: newTableZone || 'Main Floor',
        tenantId
      }, {
        headers: token ? { 'x-auth-token': token } : {}
      });

      setDbTables(prev => [...prev, res.data || {
        _id: Date.now().toString(),
        tableNumber: newTableNum.trim(),
        seatingCapacity: Number(newTableCap) || 4,
        zone: newTableZone
      }]);

      setShowAddTableModal(false);
      setNewTableNum('');
      toast.success(`✓ Table ${newTableNum} created!`);
    } catch (err) {
      // Local fallback
      setDbTables(prev => [...prev, {
        _id: Date.now().toString(),
        tableNumber: newTableNum.trim(),
        seatingCapacity: Number(newTableCap) || 4,
        zone: newTableZone
      }]);
      setShowAddTableModal(false);
      setNewTableNum('');
      toast.success(`✓ Table ${newTableNum} added`);
    }
  };

  return (
    <div className={styles.terminalWrapper}>
      
      {/* ========================================================= */}
      {/* 1. FLOOR & TABLES MATRIX VIEW (Petpooja Reference Style)  */}
      {/* ========================================================= */}
      {viewMode === 'tables' && (
        <div className={styles.floorContainer}>
          
          {/* Streamlined Top Control Toolbar */}
          <div className={styles.floorTopBarClean}>
            {/* Quick Status Filter Tabs (Segmented Control) */}
            <div className={styles.floorTabsSegment}>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'all' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('all')}
              >
                All Tables ({tableStats.total})
              </button>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'free' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('free')}
              >
                <span className={styles.dotFree}>●</span> Free ({tableStats.free})
              </button>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'occupied' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('occupied')}
              >
                <span className={styles.dotOccupied}>●</span> Booked / Running ({tableStats.occupied})
              </button>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'paid' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('paid')}
              >
                <span className={styles.dotPaid}>●</span> Paid / Served ({tableStats.paid})
              </button>
            </div>

            {/* Right: Search Box */}
            <div className={styles.floorRightControls}>
              <div className={styles.searchBox}>
                <Search size={14} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search table or guest..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className={styles.searchInput}
                />
                {tableSearch && (
                  <button
                    type="button"
                    onClick={() => setTableSearch('')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tables Grid Layout */}
          <div className={styles.tablesGrid}>
            {filteredFloorTables.map(tbl => {
              const tableOrders = getOrdersForTableObj(tbl);
              const isOccupied = tableOrders.length > 0;
              const isAllPaid = isOccupied && tableOrders.every(o => o.paymentStatus === 'paid' || o.status === 'served');
              const totalAmt = tableOrders.reduce((s, o) => s + (Number(o.total || o.totalAmount) || 0), 0);

              // Calculate running elapsed minutes
              let elapsedMin = null;
              if (isOccupied && tableOrders[0]?.createdAt) {
                const start = new Date(tableOrders[0].createdAt);
                const diffMs = Date.now() - start.getTime();
                elapsedMin = Math.max(1, Math.floor(diffMs / (1000 * 60)));
              }

              // 1. FREE / EMPTY CARD
              if (!isOccupied) {
                return (
                  <div
                    key={tbl._id || tbl.tableNumber}
                    className={`${styles.tableTile} ${styles.tileFree}`}
                    onClick={() => handleOpenTableInPOS(tbl.tableNumber)}
                    title={`Table ${tbl.tableNumber} - Clean & Ready. Click to take order.`}
                  >
                    <span className={styles.tileCapacity}>{tbl.seatingCapacity || 4} Seats</span>
                    <span className={styles.tileName}>Table {tbl.tableNumber}</span>
                    <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>+ Take Order</span>
                  </div>
                );
              }

              // 2. PAID / BILLED / SERVED CARD (Soft Green)
              if (isAllPaid) {
                return (
                  <div
                    key={tbl._id || tbl.tableNumber}
                    className={`${styles.tableTile} ${styles.tilePaid}`}
                    onClick={() => handleOpenTableInPOS(tbl.tableNumber)}
                    title={`Table ${tbl.tableNumber} - Billed/Paid. Click to open POS.`}
                  >
                    <div className={styles.tileTopMeta}>
                      <Check size={12} /> {elapsedMin ? `${elapsedMin} Min` : 'Paid'}
                    </div>
                    <span className={styles.tileName}>Table {tbl.tableNumber}</span>
                    <span className={styles.tileAmount}>₹{Math.round(totalAmt).toLocaleString('en-IN')}</span>
                  </div>
                );
              }

              // 3. OCCUPIED / RUNNING / BOOKING CARD (Orange / Warm Amber)
              return (
                <div
                  key={tbl._id || tbl.tableNumber}
                  className={`${styles.tableTile} ${styles.tileOccupied}`}
                  onClick={() => handleOpenTableInPOS(tbl.tableNumber)}
                  title={`Table ${tbl.tableNumber} - Running Order ₹${totalAmt}. Click to open POS.`}
                >
                  <div className={styles.tileTopMeta}>
                    <Clock size={11} /> {elapsedMin ? `${elapsedMin} Min` : 'Active'}
                  </div>
                  <span className={styles.tileName}>Table {tbl.tableNumber}</span>
                  <span className={styles.tileAmount}>₹{Math.round(totalAmt).toLocaleString('en-IN')}</span>
                </div>
              );
            })}
          </div>

          {filteredFloorTables.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '3.5rem 1.5rem',
              background: '#f8fafc',
              borderRadius: '14px',
              border: '1.5px dashed #cbd5e1',
              width: '100%',
              minHeight: '220px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <Grid size={24} />
              </div>
              <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1rem', fontWeight: 800 }}>
                {tableStatusFilter !== 'all' ? `No ${tableStatusFilter} tables` : 'No tables found'}
              </h4>
              <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.82rem', maxWidth: '380px' }}>
                {tableSearch
                  ? `No tables match "${tableSearch}"`
                  : tableStatusFilter !== 'all'
                  ? `There are currently no tables with status "${tableStatusFilter}". Switch filter to see other tables.`
                  : 'No tables available on this floor.'}
              </p>
              {tableStatusFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('all')}
                  style={{
                    marginTop: '12px',
                    padding: '6px 14px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#2563eb',
                    cursor: 'pointer'
                  }}
                >
                  View All Tables ({tableStats.total})
                </button>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. POS BILLING & ORDER VIEW (High-Speed Terminal)         */}
      {/* ========================================================= */}
      {viewMode === 'terminal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* POS Two-Column Grid */}
          <div className={styles.posGrid}>
            
            {/* Left: Menu Catalog & Categories */}
            <div className={styles.menuSection}>
              <div className={styles.menuFilterBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Inline Back Arrow Button */}
                  <button
                    type="button"
                    className={styles.backIconBtn}
                    onClick={() => setViewMode('tables')}
                    title="Back to Floor Tables"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  <div className={styles.categoryPillsWrap}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className={`${styles.catPill} ${selectedCategory === cat ? styles.catPillActive : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat === 'all' ? 'All Dishes' : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.searchBox} style={{ width: 180 }}>
                  <Search size={13} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search dish..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>

              {/* Dish Cards Grid */}
              <div className={styles.dishesGrid}>
                {filteredMenuItems.map(item => {
                  const imgUrl = getValidFoodImage(item);
                  const price = Number(item.salePrice || item.price) || 0;

                  return (
                    <div
                      key={item._id}
                      className={styles.dishCard}
                      onClick={() => handleQuickAdd(item)}
                    >
                      <div className={styles.dishImgWrap}>
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className={styles.dishImg}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                        <div className={styles.vegBadge}>
                          <div className={item.isVeg ? styles.vegDot : styles.nonVegDot} />
                        </div>
                      </div>

                      <div className={styles.dishInfo}>
                        <h4>{item.name}</h4>
                      </div>

                      <div className={styles.dishPriceRow}>
                        <span className={styles.dishPrice}>₹{price}</span>
                        <button
                          type="button"
                          className={styles.dishAddBtn}
                          onClick={(e) => { e.stopPropagation(); handleQuickAdd(item); }}
                          title="Add to order"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Order Slip & Settlement Drawer */}
            <div className={styles.orderDrawer}>
              
              {/* Top Block: Title & Inputs (Pinned Top) */}
              <div className={styles.drawerTopBlock}>
                <div className={styles.drawerHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h4 className={styles.drawerTitle}>
                      {tableNumber === 'Walk-in' ? 'Walk-in Order Slip' : `Table ${tableNumber} Order Slip`}
                    </h4>
                    {runningOrdersTotal > 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        ● Active (₹{runningOrdersTotal})
                      </span>
                    )}
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Clear Draft
                    </button>
                  )}
                </div>

                {/* Customer Inputs */}
                <div className={styles.customerInputs}>
                  <input
                    type="text"
                    placeholder="Guest Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={styles.inputField}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={styles.inputField}
                  />
                </div>
              </div>

              {/* Middle Block: Running Orders + Draft Items (Flex-1, Scrollable) */}
              <div className={styles.drawerMiddleBlock}>
                {/* Active Kitchen Orders (Order 1, Order 2, etc.) */}
                {currentTableOrders.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <div className={styles.roundHeader}>
                      <span>ACTIVE KITCHEN ORDERS ({currentTableOrders.length})</span>
                      <span>₹{runningOrdersTotal}</span>
                    </div>

                    {currentTableOrders.map((ord, idx) => {
                      const statusColor = ord.status === 'preparing' ? '#f59e0b' : (ord.status === 'ready' ? '#3b82f6' : (ord.status === 'pending' ? '#64748b' : '#10b981'));
                      const statusBg = ord.status === 'preparing' ? '#fef3c7' : (ord.status === 'ready' ? '#eff6ff' : (ord.status === 'pending' ? '#f1f5f9' : '#ecfdf5'));
                      const statusLabel = ord.status === 'preparing' ? '🟡 In Kitchen' : (ord.status === 'ready' ? '🔵 Ready' : (ord.status === 'pending' ? '⚪ Placed' : '🟢 Served'));

                      return (
                        <div key={ord._id} style={{
                          background: '#f8fafc',
                          border: `1px solid ${ord.status === 'preparing' ? '#fde68a' : '#e2e8f0'}`,
                          borderRadius: '10px',
                          padding: '8px 10px',
                          marginBottom: '8px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>Order {idx + 1}</span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: statusBg,
                              color: statusColor,
                              border: `1px solid ${statusColor}40`
                            }}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className={styles.cartList}>
                            {(ord.items || []).map((it, itemIdx) => (
                              <div key={itemIdx} className={styles.cartItem} style={{ padding: '4px 0', borderBottom: itemIdx < ord.items.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                                <div>
                                  <p className={styles.cartItemTitle}>{it.name || it.item?.name || 'Item'}</p>
                                  <p className={styles.cartItemPrice}>₹{it.price || 0} each</p>
                                </div>
                                <div className={styles.qtyControls}>
                                  <button type="button" className={styles.qtyBtn} onClick={() => handleUpdateExistingOrderItem(ord._id, itemIdx, -1)}>
                                    <Minus size={10} />
                                  </button>
                                  <span className={styles.qtyVal}>{it.quantity || 1}</span>
                                  <button type="button" className={styles.qtyBtn} onClick={() => handleUpdateExistingOrderItem(ord._id, itemIdx, 1)}>
                                    <Plus size={10} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Draft Section Header */}
                <div className={styles.draftSectionHeader}>
                  <span>NEW ORDER (DRAFT) ({cart.length})</span>
                  {cart.length > 0 && <span>₹{draftCartTotal}</span>}
                </div>

                {/* Cart items list or empty placeholder */}
                {cart.length > 0 ? (
                  <div className={styles.cartList} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 10px' }}>
                    {cart.map((it, idx) => (
                      <div key={idx} className={styles.cartItem} style={{ padding: '5px 0', borderBottom: idx < cart.length - 1 ? '1px dashed #f1f5f9' : 'none' }}>
                        <div>
                          <p className={styles.cartItemTitle}>{it.name}</p>
                          <p className={styles.cartItemPrice}>₹{it.price} each</p>
                        </div>
                        <div className={styles.qtyControls}>
                          <button type="button" className={styles.qtyBtn} onClick={() => updateCartQty(idx, -1)}>
                            <Minus size={10} />
                          </button>
                          <span className={styles.qtyVal}>{it.quantity}</span>
                          <button type="button" className={styles.qtyBtn} onClick={() => updateCartQty(idx, 1)}>
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyCartPlaceholder}>
                    <ShoppingCart size={22} style={{ color: '#cbd5e1', marginBottom: 4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No draft items yet</p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Click dishes to add to this order</span>
                  </div>
                )}
              </div>

              {/* Bottom Block: Payment Mode, Total & Action Buttons (Pinned Bottom) */}
              <div className={styles.drawerBottomBlock}>
                <div className={styles.paymentSection}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                    Payment Method
                  </span>
                  <div className={styles.paymentModeRow}>
                    {['Cash', 'UPI / GPay', 'Card', ...(tenantInfo?.settings?.enableKhata ? ['Khata / Borrow'] : [])].map(m => (
                      <button
                        key={m}
                        type="button"
                        className={`${styles.payModeBtn} ${paymentMethod === m ? styles.payModeBtnActive : ''} ${m === 'Khata / Borrow' ? styles.khataPayBtn : ''}`}
                        onClick={() => setPaymentMethod(m)}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bill Summary */}
                <div className={styles.billSummary}>
                  <div className={styles.billRowTotal}>
                    <span>Total Amount:</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>

                {/* Terminal Action Buttons */}
                <div className={styles.terminalActionBtns}>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      className={styles.sendKotBtn}
                      onClick={handleSendKOT}
                      disabled={isSubmitting}
                      title="Send draft items to Kitchen (KDS / In Kitchen)"
                    >
                      <ChefHat size={14} />
                      <span>{isSubmitting ? 'Sending...' : 'Send to Kitchen'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.settlePayBtn}
                    onClick={() => {
                      if (paymentMethod === 'Khata / Borrow') {
                        setKhataPaidAmount('');
                        setKhataBorrowAmount(grandTotal);
                        setShowKhataModal(true);
                      } else {
                        handleSettleBill();
                      }
                    }}
                    disabled={isSettling || (grandTotal <= 0 && currentTableOrders.length === 0 && cart.length === 0)}
                  >
                    <CheckCircle2 size={15} />
                    <span>{isSettling ? 'Settling...' : (paymentMethod === 'Khata / Borrow' ? `Record Khata (₹${grandTotal})` : `Settle & Clear (₹${grandTotal})`)}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ADD TABLE MODAL                                        */}
      {/* ========================================================= */}
      {showAddTableModal && (
        <div className={styles.splitModalOverlay} onClick={() => setShowAddTableModal(false)}>
          <div className={styles.splitModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Add Dining Table</h3>
              <button
                type="button"
                onClick={() => setShowAddTableModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTableSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Table Number / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9 or T9 or C5"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className={styles.inputField}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Floor / Zone Section
                </label>
                <select
                  value={newTableZone}
                  onChange={(e) => setNewTableZone(e.target.value)}
                  className={styles.inputField}
                >
                  <option value="Main Floor">Main Floor / Coffee House</option>
                  <option value="Roof Top">Roof Top</option>
                  <option value="Garden">Garden</option>
                  <option value="AC Lounge">AC Lounge / 1st Floor</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Seating Capacity (Guests)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={newTableCap}
                  onChange={(e) => setNewTableCap(e.target.value)}
                  className={styles.inputField}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. DISH CUSTOMIZATION MODAL (VARIANTS & ADDONS)           */}
      {/* ========================================================= */}
      {customizingItem && (
        <div className={styles.splitModalOverlay} onClick={() => setCustomizingItem(null)}>
          <div className={styles.splitModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Customize {customizingItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Variants */}
            {customizingItem.variants && customizingItem.variants.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Select Portion / Variant
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {customizingItem.variants.map((v, i) => (
                    <label
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: selectedVariant?.name === v.name ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: selectedVariant?.name === v.name ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariant?.name === v.name}
                        onChange={() => setSelectedVariant(v)}
                        style={{ display: 'none' }}
                      />
                      <span>{v.name}</span>
                      <span style={{ fontWeight: 800, color: '#059669' }}>₹{v.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddCustomized}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginTop: 8
              }}
            >
              Add to Order
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. KHATA / BORROW (UDHARI) SETTLEMENT MODAL               */}
      {/* ========================================================= */}
      {showKhataModal && (
        <div className={styles.splitModalOverlay} onClick={() => setShowKhataModal(false)}>
          <div className={styles.splitModalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#fef3c7', padding: '4px 8px', borderRadius: '8px', fontSize: '1.1rem' }}>📒</span>
                  Customer Khata / Borrow
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Record partial payment and maintain remaining as customer credit / udhari.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowKhataModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                <span>Total Bill Amount:</span>
                <span style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 900 }}>₹{grandTotal}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={styles.inputField}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Customer Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className={styles.inputField}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>
                    Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    placeholder="0"
                    value={khataPaidAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setKhataPaidAmount(e.target.value);
                      setKhataBorrowAmount(Math.max(0, grandTotal - val));
                    }}
                    className={styles.inputField}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                    Borrow / Udhari (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={khataBorrowAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setKhataBorrowAmount(e.target.value);
                      setKhataPaidAmount(Math.max(0, grandTotal - val));
                    }}
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Notes / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Regular regular customer, will pay tomorrow"
                  value={khataNotes}
                  onChange={(e) => setKhataNotes(e.target.value)}
                  className={styles.inputField}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowKhataModal(false)}
                  style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmKhataSettlement}
                  disabled={isSettling}
                  style={{ flex: 2, padding: 11, borderRadius: 8, border: 'none', background: '#d97706', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                >
                  {isSettling ? 'Recording...' : `Record Khata & Clear`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
