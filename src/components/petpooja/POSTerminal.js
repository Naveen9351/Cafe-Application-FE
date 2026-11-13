import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Grid, Plus, Minus, Search, Check, X, RefreshCw, CreditCard,
  Trash2, QrCode, Printer, Smartphone, Zap, Coffee, Clock,
  ChevronDown, ChevronUp, Tag, ArrowLeft, ShoppingCart, IndianRupee,
  Utensils, ChefHat, Eye, CheckCircle2, CheckSquare, AlertCircle, Sparkles, Filter,
  User, Phone, BookOpen, StickyNote, Volume2, VolumeX, Banknote, Lock, Wallet, Percent, Moon
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getValidFoodImage, getCustomerFirstName } from '../AdminPanel';
import styles from './POSTerminal.module.css';
import { API_URL as API } from '../../config/api';
import { playOrderChime, isAudioMuted, setAudioMuted } from '../../utils/audioChime';
import { printOrderBill } from '../../utils/billPrinter';
import { openWhatsappBill } from '../../utils/whatsappBillSender';

// Smart table name formatter:
// Converts "1" -> "T 1", "Table 1" -> "T 1", "Ground" -> "T Ground", matching QR Code screens
export const formatTableName = (num) => {
  if (num === null || num === undefined || num === '') return 'T 1';
  const str = String(num).trim();
  if (str.toLowerCase() === 'walk-in') return 'Walk-in';
  const clean = str.replace(/^(table|t)[\s-_]*/i, '').trim();
  return `T ${clean}`;
};

// Clean table number formatter (removes 'Table' label so it displays clean '1', '2', 'Ground', 'M1'):
export const formatTableOnlyNumber = (num) => {
  if (num === null || num === undefined || num === '') return '1';
  const str = String(num).trim();
  if (str.toLowerCase() === 'walk-in') return 'Walk-in';
  const clean = str.replace(/^(table|t)[\s-_]*/i, '').trim();
  return clean || str;
};

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
  const [isSendingKitchen, setIsSendingKitchen] = useState(false);
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);
  const [dbTables, setDbTables] = useState([]);
  const [isLoadingTables, setIsLoadingTables] = useState(true);

  // Khata / Borrow Modal states
  const [showKhataModal, setShowKhataModal] = useState(false);
  const [khataCustomerList, setKhataCustomerList] = useState([]);
  const [selectedKhataCustomerChoice, setSelectedKhataCustomerChoice] = useState('NEW');

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
  const [customNotes, setCustomNotes] = useState('');
  const [customQty, setCustomQty] = useState(1);

  // Split bill states
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  // Merged tables state
  const [mergedTables, setMergedTables] = useState([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [actualAmountReceived, setActualAmountReceived] = useState('');
  const [settlementDiscount, setSettlementDiscount] = useState('');
  const [settlementDiscountReason, setSettlementDiscountReason] = useState('Customer Concession / Round Off');
  const [settlementSubMethod, setSettlementSubMethod] = useState('Cash');
  const [cashTenderGiven, setCashTenderGiven] = useState('');
  const [isMuted, setIsMuted] = useState(() => isAudioMuted());

  // 4-Button System: Item selection & payment states
  const [selectedItemKeys, setSelectedItemKeys] = useState(new Set());
  const [showPayItemsModal, setShowPayItemsModal] = useState(false);
  const [payItemsMethod, setPayItemsMethod] = useState('Cash');
  const [isSubmittingItemPay, setIsSubmittingItemPay] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearTablePaymentMethod, setClearTablePaymentMethod] = useState('Cash');

  // Load existing khata customers
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/khata/customers`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(res => {
      if (res.data?.success && Array.isArray(res.data.customers)) {
        setKhataCustomerList(res.data.customers);
      }
    }).catch(() => {});
  }, [showPayItemsModal]);

  const prevOrdersCountRef = useRef(orders ? orders.length : 0);
  useEffect(() => {
    if (orders && orders.length > prevOrdersCountRef.current) {
      if (!isMuted) {
        playOrderChime();
      }
    }
    prevOrdersCountRef.current = orders ? orders.length : 0;
  }, [orders, isMuted]);

  // Fetch dynamic tables from backend DB
  const fetchDbTables = useCallback(() => {
    setIsLoadingTables(true);
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
            { _id: 't4', tableNumber: '4', seatingCapacity: 4, zone: 'Main Floor' }
          ]);
        }
      })
      .catch(err => {
        console.log('Dynamic tables fetch error:', err.message);
        setDbTables([
          { _id: 't1', tableNumber: '1', seatingCapacity: 4, zone: 'Main Floor' },
          { _id: 't2', tableNumber: '2', seatingCapacity: 4, zone: 'Main Floor' },
          { _id: 't3', tableNumber: '3', seatingCapacity: 4, zone: 'Main Floor' },
          { _id: 't4', tableNumber: '4', seatingCapacity: 4, zone: 'Main Floor' }
        ]);
      })
      .finally(() => {
        setIsLoadingTables(false);
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
      const numOnly = rawTable.replace(/^Table\s*/i, '').trim();
      if (rawTable) {
        if (!map[rawTable]) map[rawTable] = [];
        if (!map[rawTable].some(e => e._id === o._id)) map[rawTable].push(o);

        if (numOnly && numOnly !== rawTable) {
          if (!map[numOnly]) map[numOnly] = [];
          if (!map[numOnly].some(e => e._id === o._id)) map[numOnly].push(o);
        }
      }
    });
    return map;
  }, [orders]);

  // Helper: Get active orders for a specific table object
  const getOrdersForTableObj = useCallback((tbl) => {
    const tStr = String(tbl.tableNumber || tbl.table || '').trim();
    const numOnly = tStr.replace(/^Table\s*/i, '').trim();
    return activeOrdersByTable[tStr] || activeOrdersByTable[numOnly] || [];
  }, [activeOrdersByTable]);

  // Unified tables list (combines DB tables and active orders)
  const allTablesList = useMemo(() => {
    if (isLoadingTables) return [];
    const fromDb = [...dbTables];
    // Check if any active orders have distinct table numbers not in DB
    const activeTableNumbers = new Set(
      (orders || [])
        .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
        .map(o => String(o.tableNumber || o.table || '').replace(/^Table\s*/i, '').trim())
        .filter(Boolean)
    );

    activeTableNumbers.forEach(tNum => {
      if (!fromDb.some(t => String(t.tableNumber).replace(/^Table\s*/i, '').trim() === tNum)) {
        fromDb.push({
          _id: `auto_${tNum}`,
          tableNumber: tNum,
          seatingCapacity: 4,
          zone: 'Main Floor'
        });
      }
    });

    return fromDb.sort((a, b) => {
      return String(a.tableNumber || '').localeCompare(String(b.tableNumber || ''), undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [dbTables, orders, isLoadingTables]);

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
      const isAllPaid = isOccupied && tableOrders.every(o => o.paymentStatus === 'paid');

      // Zone filter
      if (selectedZone !== 'all' && (t.zone || t.section || 'Main Floor') !== selectedZone) {
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

  // Grouped tables by category / section
  const groupedFloorTables = useMemo(() => {
    const map = {};
    filteredFloorTables.forEach(t => {
      const sec = (t.section || t.zone || 'Main Hall').trim();
      if (!map[sec]) map[sec] = [];
      map[sec].push(t);
    });
    return map;
  }, [filteredFloorTables]);

  // Active table stats
  const tableStats = useMemo(() => {
    let freeCount = 0;
    let occupiedCount = 0;
    let paidCount = 0;

    allTablesList.forEach(t => {
      const ords = getOrdersForTableObj(t);
      if (ords.length === 0) {
        freeCount++;
      } else if (ords.every(o => o.paymentStatus === 'paid')) {
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

  // Active orders currently belonging to the selected table + any merged tables in POS
  const currentTableOrders = useMemo(() => {
    if (!tableNumber) return [];
    const allTableNums = [tableNumber, ...mergedTables];
    const combinedOrders = [];
    allTableNums.forEach((t) => {
      const tStr = String(t).trim();
      const numOnly = tStr.replace(/[^0-9]/g, '') || tStr;
      const ords = activeOrdersByTable[tStr] || activeOrdersByTable[numOnly] || activeOrdersByTable[`Table ${numOnly}`] || [];
      ords.forEach(o => {
        if (!combinedOrders.some(existing => existing._id === o._id)) {
          combinedOrders.push(o);
        }
      });
    });
    return combinedOrders;
  }, [tableNumber, mergedTables, activeOrdersByTable]);

  // Format money helper to eliminate floating point precision junk (e.g. 1739.8500000000001 -> 1,739.85)
  const formatAmount = (val) => {
    const num = Number(val) || 0;
    const rounded = Math.round(num * 100) / 100;
    return rounded.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Running orders total
  const runningOrdersTotal = useMemo(() => {
    const sum = currentTableOrders.reduce((acc, o) => acc + (Number(o.total || o.totalAmount) || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [currentTableOrders]);

  // Current draft cart total
  const draftCartTotal = useMemo(() => {
    const sum = cart.reduce((acc, it) => acc + (Number(it.price) * (Number(it.quantity) || 1)), 0);
    return Math.round(sum * 100) / 100;
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.round((runningOrdersTotal + draftCartTotal) * 100) / 100;
  }, [runningOrdersTotal, draftCartTotal]);

  // Dynamically calculate sum of items already paid across currentTableOrders
  const paidItemsTotal = useMemo(() => {
    let sum = 0;
    currentTableOrders.forEach(ord => {
      if (ord.paymentStatus === 'paid') {
        sum += (Number(ord.total || ord.totalAmount) || 0);
      } else if (Array.isArray(ord.items)) {
        ord.items.forEach(it => {
          if (it.isPaid) {
            sum += (Number(it.price) * (Number(it.quantity) || 1));
          }
        });
      }
    });
    return Math.round(sum * 100) / 100;
  }, [currentTableOrders]);

  // Dynamic balance due (Total bill minus already paid items)
  const balanceDue = useMemo(() => {
    const due = grandTotal - paidItemsTotal;
    return Math.max(0, Math.round(due * 100) / 100);
  }, [grandTotal, paidItemsTotal]);

  // Selection summary for items selected with checkboxes
  const selectedItemsSummary = useMemo(() => {
    let count = 0;
    let total = 0;
    const itemsList = [];

    currentTableOrders.forEach(ord => {
      (ord.items || []).forEach((it, idx) => {
        const key = `${ord._id}_${idx}`;
        if (selectedItemKeys.has(key)) {
          count += 1;
          const cost = (Number(it.price) * (Number(it.quantity) || 1));
          total += cost;
          itemsList.push({ orderId: ord._id, itemIndex: idx, name: it.name || it.item?.name || 'Item', price: cost });
        }
      });
    });

    return { count, total: Math.round(total * 100) / 100, itemsList };
  }, [currentTableOrders, selectedItemKeys]);

  const handleToggleItemSelect = (key) => {
    setSelectedItemKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAllUnpaid = () => {
    const next = new Set();
    currentTableOrders.forEach(ord => {
      if (ord.paymentStatus !== 'paid') {
        (ord.items || []).forEach((it, idx) => {
          if (!it.isPaid) {
            next.add(`${ord._id}_${idx}`);
          }
        });
      }
    });
    setSelectedItemKeys(next);
  };

  // Night Menu Active Check
  const isNightActiveNow = useMemo(() => {
    if (!tenantInfo?.settings?.enableNightMenu) return false;
    const start = tenantInfo?.settings?.nightMenuStart || '22:00';
    const end = tenantInfo?.settings?.nightMenuEnd || '05:00';
    try {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = (start || '22:00').split(':').map(Number);
      const [eh, em] = (end || '05:00').split(':').map(Number);
      const startMins = (sh || 0) * 60 + (sm || 0);
      const endMins = (eh || 0) * 60 + (em || 0);
      if (startMins <= endMins) {
        return currentMins >= startMins && currentMins <= endMins;
      } else {
        return currentMins >= startMins || currentMins <= endMins;
      }
    } catch {
      return false;
    }
  }, [tenantInfo?.settings?.enableNightMenu, tenantInfo?.settings?.nightMenuStart, tenantInfo?.settings?.nightMenuEnd]);

  // Helper to determine effective item price (considering active night pricing)
  const getItemEffectivePrice = (item) => {
    if (!item) return 0;
    if (isNightActiveNow && (item.isNightMenu || item.nightPrice)) {
      const np = Number(item.nightPrice);
      if (np > 0) return np;
    }
    return Number(item.salePrice || item.price) || 0;
  };

  // Categories list for POS Menu (food categories only - Open Menu and Night Menu moved to top bar)
  const categories = useMemo(() => {
    const cats = ['all'];
    const regularCats = [...new Set(
      menuItems
        .filter(i => !i.isOpenMenu && !i.isPosOnly)
        .map(item => item.category || 'main-courses')
    )];
    return [...cats, ...regularCats];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      let matchesCat = false;
      if (selectedCategory === 'all') {
        matchesCat = true;
      } else if (selectedCategory === '⚡ Open Menu') {
        matchesCat = Boolean(item.isOpenMenu || item.isPosOnly);
      } else if (selectedCategory === '🌙 Night Menu') {
        matchesCat = Boolean(item.shiftAvailability === 'night_only' || item.isNightMenu || (item.nightPrice && Number(item.nightPrice) > 0));
      } else {
        matchesCat = item.category === selectedCategory;
      }
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
          price: getItemEffectivePrice(item),
          quantity: 1,
          variant: null,
          addons: []
        }]);
      }
      toast.success(`Added ${item.name}`);
    }
  };

  const handleDecrementItem = (item, e) => {
    if (e) e.stopPropagation();
    const existingIndex = cart.map(c => (c.id === item._id || c._id === item._id || c.name === item.name)).lastIndexOf(true);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity -= 1;
      if (newCart[existingIndex].quantity <= 0) {
        newCart.splice(existingIndex, 1);
      }
      setCart(newCart);
    }
  };

  const handleAddCustomized = () => {
    if (!customizingItem) return;
    let finalPrice = getItemEffectivePrice(customizingItem);
    let variantName = '';
    if (selectedVariant) {
      finalPrice = Number(selectedVariant.price) >= 0 ? Number(selectedVariant.price) : finalPrice;
      variantName = selectedVariant.name || '';
    }
    const addonPrice = selectedAddons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
    const totalPrice = finalPrice + addonPrice;
    const addQty = Math.max(1, customQty || 1);

    const existingIndex = cart.findIndex(c =>
      c.id === customizingItem._id &&
      ((!c.variant && !selectedVariant) || (c.variant?.name === selectedVariant?.name)) &&
      JSON.stringify(c.addons || []) === JSON.stringify(selectedAddons || []) &&
      (c.specialNotes || '') === (customNotes || '')
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += addQty;
      setCart(newCart);
    } else {
      setCart([...cart, {
        id: customizingItem._id,
        name: variantName ? `${customizingItem.name} (${variantName})` : customizingItem.name,
        price: totalPrice,
        quantity: addQty,
        variant: selectedVariant,
        addons: selectedAddons,
        specialNotes: customNotes
      }]);
    }

    setCustomizingItem(null);
    setCustomNotes('');
    setCustomQty(1);
    toast.success(`Added ${addQty}x ${customizingItem.name}${variantName ? ` (${variantName})` : ''}`);
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

  // Button 1: Send to Kitchen / Submit New Order (Directly sets status to 'preparing' - In Kitchen KDS)
  const handleSendKOT = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add dishes first!');
      return;
    }

    const effName = customerName.trim() || (tableNumber === 'Walk-in' ? 'Walk-in Guest' : `Table ${tableNumber} Guest`);
    const cleanPh = (customerPhone || '').replace(/\D/g, '');

    setIsSendingKitchen(true);
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
        addons: (it.addons || []),
        itemStatus: 'preparing',
        isPaid: false
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
      setIsSendingKitchen(false);
    }
  };

  // Button 2: Direct (Counter Handover - Instant served, bypasses Kitchen KDS)
  const handleDirectOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add counter dishes first!');
      return;
    }

    const effName = customerName.trim() || (tableNumber === 'Walk-in' ? 'Walk-in Guest' : `Table ${tableNumber} Guest`);
    const cleanPh = (customerPhone || '').replace(/\D/g, '');

    setIsSubmittingDirect(true);
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
      isDirect: true,
      status: 'served', // Directly marks as "Served", bypassing kitchen KDS
      paymentStatus: 'pending',
      items: cart.map(it => ({
        id: it.id,
        itemId: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        variant: it.variant ? it.variant : null,
        addons: (it.addons || []),
        isDirect: true,
        itemStatus: 'served',
        isPaid: false
      })),
      totalAmount: draftCartTotal
    };

    try {
      if (currentTableOrders.length > 0) {
        const lastOrder = currentTableOrders[currentTableOrders.length - 1];
        const itemsToAppend = cart.map(it => ({
          id: it.id,
          itemId: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          variant: it.variant ? it.variant : null,
          addons: (it.addons || []),
          isDirect: true,
          itemStatus: 'served',
          isPaid: false
        }));

        const res = await axios.post(`${API}/orders/${lastOrder._id}/append-items`, { items: itemsToAppend }, {
          headers: token ? { 'x-auth-token': token } : {}
        });

        toast.success(`⚡ Direct items added to Round ${lastOrder.roundNumber || 1} & served!`);
        setCart([]);
        if (onOrderPlaced) onOrderPlaced(res.data.order || res.data);
        if (onOrderCreated) onOrderCreated(res.data.order || res.data);
      } else {
        const res = await axios.post(`${API}/orders`, orderPayload, {
          headers: token ? { 'x-auth-token': token } : {}
        });

        toast.success(`⚡ Direct items handed over & served for Table ${tableNumber}!`);
        setCart([]);
        if (onOrderPlaced) onOrderPlaced(res.data);
        if (onOrderCreated) onOrderCreated(res.data);
      }
    } catch (err) {
      console.error('Direct order error:', err);
      toast.error('Failed to submit direct order: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  // Button 3: Paid Order (Mark selected items or all unpaid items as paid, with settlement concession support)
  const handleConfirmPayItems = async (customPayable = null, customDiscount = 0, customMethod = null) => {
    const token = localStorage.getItem('token');
    const effectiveTenantId = tenantId || tenantInfo?._id || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

    setIsSubmittingItemPay(true);
    try {
      const itemsToPay = selectedItemsSummary.itemsList.map(it => ({
        orderId: it.orderId,
        itemIndex: it.itemIndex
      }));

      const isFullTable = itemsToPay.length === 0 || selectedItemsSummary.count === 0 || selectedItemsSummary.count === currentTableOrders.flatMap(o => (o.items || []).filter(it => !it.isPaid)).length;
      const allSettleTables = [String(tableNumber).trim(), ...mergedTables.map(t => String(t).trim())];

      const tenderAmount = selectedItemsSummary.count > 0 ? selectedItemsSummary.total : balanceDue;
      const effectiveMethod = customMethod || (payItemsMethod === 'Settlement' ? (settlementSubMethod || 'Cash') : payItemsMethod);
      const finalPaid = customPayable !== null ? Number(customPayable) : (actualAmountReceived !== '' && !isNaN(Number(actualAmountReceived)) ? Number(actualAmountReceived) : tenderAmount);
      const finalDiscount = customDiscount > 0 ? Number(customDiscount) : Math.max(0, tenderAmount - finalPaid);

      if (isFullTable && tableNumber !== 'Walk-in') {
        // Full table settlement: settle orders, record concession discount, free table
        await axios.put(
          `${API}/orders/table/${encodeURIComponent(String(tableNumber).trim())}/settle`,
          {
            paymentMethod: effectiveMethod,
            paymentStatus: 'paid',
            tenantId: effectiveTenantId,
            mergedTables: allSettleTables,
            settledAmount: finalPaid,
            discountAmount: finalDiscount,
            discountReason: settlementDiscountReason || 'Settlement Concession / Round Off',
            originalTotal: grandTotal
          },
          { headers: token ? { 'x-auth-token': token } : {} }
        );

        const discountMsg = finalDiscount > 0 ? ` (₹${formatAmount(finalDiscount)} discount applied)` : '';
        toast.success(`✓ Table ${tableNumber} settled for ₹${formatAmount(finalPaid)}${discountMsg}! Table is now free.`);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setMergedTables([]);
        setActualAmountReceived('');
        setSettlementDiscount('');
        setCashTenderGiven('');
        setSelectedItemKeys(new Set());
        setShowPayItemsModal(false);

        allSettleTables.forEach(tNum => {
          if (onOrderPlaced) onOrderPlaced({ tableNumber: tNum, status: 'completed', _refreshAll: true });
          if (onOrderCreated) onOrderCreated({ tableNumber: tNum, status: 'completed', _refreshAll: true });
          if (onSettleTable) onSettleTable(tNum);
        });

        setViewMode('tables');
      } else {
        // Partial items pay
        const res = await axios.put(
          `${API}/orders/table/${encodeURIComponent(String(tableNumber).trim())}/pay-items`,
          {
            paymentMethod: effectiveMethod,
            itemsToPay,
            payAll: isFullTable,
            actualAmount: finalPaid,
            settledAmount: finalPaid,
            discountAmount: finalDiscount,
            discountReason: settlementDiscountReason || 'Settlement Concession / Round Off',
            tenantId: effectiveTenantId
          },
          { headers: token ? { 'x-auth-token': token } : {} }
        );

        const discountMsg = finalDiscount > 0 ? ` (₹${formatAmount(finalDiscount)} discount)` : '';
        toast.success(`✓ Marked items as paid (₹${formatAmount(finalPaid)})${discountMsg} via ${effectiveMethod}!`);
        setShowPayItemsModal(false);
        setSelectedItemKeys(new Set());
        setActualAmountReceived('');
        setSettlementDiscount('');
        setCashTenderGiven('');

        if (onOrderPlaced) onOrderPlaced({ tableNumber, _refreshAll: true });
        if (onOrderCreated) onOrderCreated({ tableNumber, _refreshAll: true });
      }
    } catch (err) {
      console.error('Pay items error:', err);
      toast.error('Payment error: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingItemPay(false);
    }
  };

  // Button 4: Clear Table Click Handler (Verifies unpaid balance)
  const handleClearTableClick = () => {
    if (grandTotal <= 0 && currentTableOrders.length === 0 && cart.length === 0) {
      toast.error('No items or active orders to clear for this table.');
      return;
    }

    if (balanceDue > 0) {
      // Unpaid balance remains: prompt cashier to collect remaining tender
      setClearTablePaymentMethod(paymentMethod || 'Cash');
      setShowClearConfirmModal(true);
    } else {
      // Table is already 100% paid: clear immediately!
      handleSettleBill(paymentMethod || 'Cash');
    }
  };

  // Quick Settle & Clear Table directly from floor view
  const handleQuickSettleTable = async (tNum) => {
    const token = localStorage.getItem('token');
    const effectiveTenantId = tenantId || tenantInfo?._id || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

    try {
      await axios.put(
        `${API}/orders/table/${encodeURIComponent(String(tNum).trim())}/settle`,
        {
          paymentMethod: 'Cash',
          paymentStatus: 'paid',
          tenantId: effectiveTenantId
        },
        { headers: token ? { 'x-auth-token': token } : {} }
      );
      toast.success(`Table ${tNum} cleared and is now free!`);
      if (onOrderPlaced) onOrderPlaced({ tableNumber: tNum, status: 'completed', _refreshAll: true });
      if (onOrderCreated) onOrderCreated({ tableNumber: tNum, status: 'completed', _refreshAll: true });
    } catch (err) {
      console.error('Quick settle error:', err);
      toast.error('Failed to clear table: ' + (err.response?.data?.error || err.message));
    }
  };

  // Settle Bill & Free Table
  const handleSettleBill = async (overrideMethod = null) => {
    if (grandTotal <= 0 && currentTableOrders.length === 0 && cart.length === 0) {
      toast.error('No items or active orders to settle for this table.');
      return;
    }

    const settleMethod = overrideMethod || paymentMethod || 'Cash';
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
          paymentMethod: settleMethod,
          paymentStatus: 'paid',
          status: 'served',
          items: cart.map(it => ({
            id: it.id,
            itemId: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            variant: it.variant ? it.variant : null,
            addons: (it.addons || []),
            itemStatus: 'served',
            isPaid: true
          })),
          totalAmount: draftCartTotal
        };
        await axios.post(`${API}/orders`, orderPayload, {
          headers: token ? { 'x-auth-token': token } : {}
        });
      }

      // 2. Settle all existing orders on this table (including merged tables)
      const allSettleTables = [String(tableNumber).trim(), ...mergedTables.map(t => String(t).trim())];
      const finalSettledAmount = actualAmountReceived !== '' ? Number(actualAmountReceived) : grandTotal;

      if (tableNumber !== 'Walk-in' && currentTableOrders.length > 0) {
        await axios.put(
          `${API}/orders/table/${encodeURIComponent(String(tableNumber).trim())}/settle`,
          {
            paymentMethod: settleMethod,
            paymentStatus: 'paid',
            tenantId: effectiveTenantId,
            mergedTables: allSettleTables,
            settledAmount: finalSettledAmount,
            originalTotal: grandTotal
          },
          { headers: token ? { 'x-auth-token': token } : {} }
        );
      }

      const tableLabel = allSettleTables.length > 1 ? `Tables ${allSettleTables.join(', ')}` : `Table ${tableNumber}`;
      toast.success(`✓ ${tableLabel} cleared & fully settled (₹${formatAmount(finalSettledAmount)})! Table is now free.`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setMergedTables([]);
      setActualAmountReceived('');
      setSelectedItemKeys(new Set());
      setShowSplitModal(false);
      setShowClearConfirmModal(false);

      allSettleTables.forEach(tNum => {
        if (onOrderPlaced) onOrderPlaced({ tableNumber: tNum, status: 'completed', _refreshAll: true });
        if (onOrderCreated) onOrderCreated({ tableNumber: tNum, status: 'completed', _refreshAll: true });
        if (onSettleTable) onSettleTable(tNum);
      });

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
    const cleanPhone = (customerPhone || '').replace(/\D/g, '');
    const effLegacyName = customerName.trim() || (tableNumber !== 'Walk-in' ? `Table ${tableNumber} Guest` : 'Walk-in Guest');
    const effLegacyPhone = cleanPhone || customerPhone.trim() || 'N/A';

    const curDue = balanceDue > 0 ? balanceDue : grandTotal;
    const paidNum = Number(khataPaidAmount) || 0;
    const borrowNum = Math.max(0, curDue - paidNum);
    const totalRecordedBill = (grandTotal - curDue) + paidNum + borrowNum;

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
        tenantId: effectiveTenantId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        totalBill: totalRecordedBill,
        paidAmount: (grandTotal - curDue) + paidNum,
        borrowAmount: borrowNum,
        notes: khataNotes || `Table ${tableNumber} order`
      }, {
        headers: token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : {}
      });

      // 3. Settle all existing orders on this table & free table
      const allSettleTables = [String(tableNumber).trim(), ...mergedTables.map(t => String(t).trim())];
      if (tableNumber !== 'Walk-in') {
        await axios.put(
          `${API}/orders/table/${encodeURIComponent(String(tableNumber).trim())}/settle`,
          {
            paymentMethod: 'Khata / Borrow',
            paymentStatus: borrowNum === 0 ? 'paid' : 'partial',
            tenantId: effectiveTenantId,
            mergedTables: allSettleTables,
            actualAmount: paidNum,
            settledAmount: paidNum
          },
          { headers: token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : {} }
        );
      }

      toast.success(`✓ Khata recorded for ${customerName} (Paid: ₹${paidNum}, Borrow: ₹${borrowNum}). Table ${tableNumber} cleared!`);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setActualAmountReceived('');
      setKhataPaidAmount('');
      setKhataBorrowAmount(0);
      setKhataNotes('');
      setSelectedItemKeys(new Set());
      setMergedTables([]);
      setShowKhataModal(false);

      allSettleTables.forEach(tNum => {
        if (onOrderPlaced) onOrderPlaced({ tableNumber: tNum, status: 'completed', _refreshAll: true });
        if (onOrderCreated) onOrderCreated({ tableNumber: tNum, status: 'completed', _refreshAll: true });
        if (onSettleTable) onSettleTable(tNum);
      });

      // Crucial: Clear view and return to tables matrix
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
            {/* Left Tabs / Quick Filter */}
            <div className={styles.floorTabsSegment}>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'all' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('all')}
              >
                All Tables ({isLoadingTables ? '...' : tableStats.total})
              </button>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'free' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('free')}
              >
                <span className={styles.dotFree}>●</span> Free ({isLoadingTables ? '...' : tableStats.free})
              </button>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'occupied' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('occupied')}
              >
                <span className={styles.dotOccupied}>●</span> Booked / Running ({isLoadingTables ? '...' : tableStats.occupied})
              </button>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'paid' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('paid')}
              >
                <span className={styles.dotPaid}>●</span> Paid / Served ({isLoadingTables ? '...' : tableStats.paid})
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
                  disabled={isLoadingTables}
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

          {/* Tables Grid Layout or Loading Skeleton */}
          {isLoadingTables ? (
            <div className={styles.tablesGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.tableTileSkeleton}>
                  <div className={styles.skeletonShimmer} style={{ width: '46px', height: '12px', margin: '0 auto 10px', borderRadius: '4px' }} />
                  <div className={styles.skeletonShimmer} style={{ width: '74px', height: '22px', margin: '6px auto 10px', borderRadius: '6px' }} />
                  <div className={styles.skeletonShimmer} style={{ width: '56px', height: '14px', margin: '0 auto', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {Object.entries(groupedFloorTables).map(([secName, secTables]) => (
                <div key={secName} style={{ background: '#ffffff', borderRadius: '12px', padding: '0.85rem 1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '0.75rem',
                    paddingBottom: '6px',
                    borderBottom: '1.5px solid #f1f5f9'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      {secName}
                    </h3>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '100px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0'
                    }}>
                      {secTables.length} {secTables.length === 1 ? 'Table' : 'Tables'}
                    </span>
                  </div>
                  <div className={styles.tablesGrid}>
                    {secTables.map(tbl => {
                      const tableOrders = getOrdersForTableObj(tbl);
                      const isOccupied = tableOrders.length > 0;
                      const isAllPaid = isOccupied && tableOrders.every(o => o.paymentStatus === 'paid');
                      const totalAmt = tableOrders.reduce((s, o) => s + (Number(o.total || o.totalAmount) || 0), 0);

                      let elapsedMin = null;
                      if (isOccupied && tableOrders[0]?.createdAt) {
                        const diffSec = Math.max(1, Math.floor((Date.now() - new Date(tableOrders[0].createdAt).getTime()) / 1000));
                        const d = Math.floor(diffSec / 86400);
                        const h = Math.floor((diffSec % 86400) / 3600);
                        const m = Math.floor((diffSec % 3600) / 60);
                        if (d > 0) elapsedMin = h > 0 ? `${d}d ${h}h` : `${d}d`;
                        else if (h > 0) elapsedMin = m > 0 ? `${h}h ${m}m` : `${h}h`;
                        else elapsedMin = `${Math.max(1, m)} Min`;
                      }

                      // 1. FREE / EMPTY CARD
                      if (!isOccupied) {
                        return (
                          <div
                            key={tbl._id || tbl.tableNumber}
                            className={`${styles.tableTile} ${styles.tileFree}`}
                            onClick={() => handleOpenTableInPOS(tbl.tableNumber)}
                            title={`Table ${formatTableOnlyNumber(tbl.tableNumber)} - Clean & Ready. Click to take order.`}
                          >
                            <span className={styles.tileCapacity}>{tbl.seatingCapacity || 4} Seats</span>
                            <span className={styles.tileName}>{formatTableOnlyNumber(tbl.tableNumber)}</span>
                            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>+ Take Order</span>
                          </div>
                        );
                      }

                      const rawCustName = tableOrders[0]?.customerDetails?.name || tableOrders[0]?.customerName || '';
                      const custName = getCustomerFirstName(rawCustName);

                      // 2. PAID / BILLED / SERVED CARD (Soft Green)
                      if (isAllPaid) {
                        return (
                          <div
                            key={tbl._id || tbl.tableNumber}
                            className={`${styles.tableTile} ${styles.tilePaid}`}
                            onClick={() => handleOpenTableInPOS(tbl.tableNumber)}
                            title={`Table ${formatTableOnlyNumber(tbl.tableNumber)} - Billed/Paid. Click to open POS.`}
                          >
                            <div className={styles.tileTopMeta}>
                              <Check size={12} /> {elapsedMin ? `${elapsedMin} Min` : 'Paid'}
                            </div>
                            <span className={styles.tileName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                              {custName || formatTableOnlyNumber(tbl.tableNumber)}
                            </span>
                            {custName && (
                              <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>
                                {formatTableOnlyNumber(tbl.tableNumber)}
                              </span>
                            )}
                            <span className={styles.tileAmount}>₹{formatAmount(totalAmt)}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickSettleTable(tbl.tableNumber);
                              }}
                              style={{
                                marginTop: '6px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#059669',
                                color: '#ffffff',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                              }}
                              title={`Click to clear and free Table ${formatTableOnlyNumber(tbl.tableNumber)}`}
                            >
                              <CheckCircle2 size={12} /> Clear Table
                            </button>
                          </div>
                        );
                      }

                      // 3. OCCUPIED / RUNNING / BOOKING CARD (Orange / Warm Amber)
                      return (
                        <div
                          key={tbl._id || tbl.tableNumber}
                          className={`${styles.tableTile} ${styles.tileOccupied}`}
                          onClick={() => handleOpenTableInPOS(tbl.tableNumber)}
                          title={`Table ${formatTableOnlyNumber(tbl.tableNumber)} - Running Order ₹${formatAmount(totalAmt)}. Click to open POS.`}
                        >
                          <div className={styles.tileTopMeta}>
                            <Clock size={11} /> {elapsedMin ? `${elapsedMin} Min` : 'Active'}
                          </div>
                          <span className={styles.tileName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                            {custName || formatTableOnlyNumber(tbl.tableNumber)}
                          </span>
                          {custName && (
                            <span style={{ fontSize: '0.68rem', color: '#92400e', fontWeight: 700 }}>
                              {formatTableOnlyNumber(tbl.tableNumber)}
                            </span>
                          )}
                          <span className={styles.tileAmount}>₹{formatAmount(totalAmt)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoadingTables && filteredFloorTables.length === 0 && (
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
        <div className={styles.terminalContainerWrap}>

          {/* POS Two-Column Grid */}
          <div className={styles.posGrid}>

            {/* Left: Menu Catalog & Categories */}
            <div className={styles.menuSection}>
              <div className={styles.menuFilterBar}>
                {/* Inline Back Arrow Button */}
                <button
                  type="button"
                  className={styles.backIconBtn}
                  onClick={() => setViewMode('tables')}
                  title="Back to Floor Tables"
                >
                  <ArrowLeft size={16} />
                </button>

                {/* Dish Search input right after back button */}
                <div className={styles.searchBox}>
                  <Search size={13} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search dish..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                  {dishSearch && (
                    <button
                      type="button"
                      onClick={() => setDishSearch('')}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Special Filter Buttons: Open Menu & Night Menu (Moved up from categories) */}
                <div className={styles.specialFilterGroup}>
                  <button
                    type="button"
                    className={`${styles.specialFilterBtn} ${selectedCategory === '⚡ Open Menu' ? styles.specialFilterBtnActiveOpen : ''}`}
                    onClick={() => setSelectedCategory(prev => prev === '⚡ Open Menu' ? 'all' : '⚡ Open Menu')}
                    title="View Open Menu (Owner/POS Only items like cigarettes, off-menu counter items)"
                  >
                    <Zap size={13} className={styles.specialFilterIcon} />
                    <span>Open Menu</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.specialFilterBtn} ${selectedCategory === '🌙 Night Menu' ? styles.specialFilterBtnActiveNight : ''}`}
                    onClick={() => setSelectedCategory(prev => prev === '🌙 Night Menu' ? 'all' : '🌙 Night Menu')}
                    title="View Night Menu (Night pricing and dishes)"
                  >
                    <Moon size={13} className={styles.specialFilterIcon} />
                    <span>Night Menu</span>
                  </button>
                </div>

                {isNightActiveNow && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
                    color: '#ffffff',
                    padding: '5px 11px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(109, 40, 217, 0.35)',
                    flexShrink: 0
                  }}>
                    <span>🌙</span>
                    <span>Night Pricing Active ({tenantInfo?.settings?.nightMenuStart || '22:00'} - {tenantInfo?.settings?.nightMenuEnd || '05:00'})</span>
                  </div>
                )}
              </div>

              {/* Horizontally scrollable Category Pills row below search */}
              <div
                className={styles.categoryPillsWrap}
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
              >
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

              {/* Dish Cards Grid */}
              <div className={styles.dishesGrid}>
                {filteredMenuItems.map(item => {
                  const imgUrl = getValidFoodImage(item);
                  const price = getItemEffectivePrice(item);
                  const cartQty = cart
                    .filter(c => c.id === item._id || c._id === item._id || c.name === item.name)
                    .reduce((sum, c) => sum + (c.quantity || 1), 0);

                  return (
                    <div
                      key={item._id}
                      className={`${styles.dishCard} ${cartQty > 0 ? styles.dishCardInCart : ''}`}
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
                        {(item.isOpenMenu || item.isPosOnly) && (
                          <div style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 6,
                            background: 'rgba(192, 38, 211, 0.92)',
                            color: '#ffffff',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.3px',
                            backdropFilter: 'blur(4px)',
                            zIndex: 2
                          }}>
                            ⚡ Open Menu
                          </div>
                        )}
                        {!(item.isOpenMenu || item.isPosOnly) && (item.shiftAvailability === 'night_only' || item.isNightMenu) && (
                          <div style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 6,
                            background: 'rgba(76, 29, 149, 0.92)',
                            color: '#ffffff',
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.3px',
                            backdropFilter: 'blur(4px)',
                            zIndex: 2
                          }}>
                            🌙 Night Menu
                          </div>
                        )}
                      </div>

                      <div className={styles.dishInfo}>
                        <h4>{item.name}</h4>
                      </div>

                      <div className={styles.dishPriceRow}>
                        <span className={styles.dishPrice}>₹{formatAmount(price)}</span>
                        {cartQty > 0 ? (
                          <div className={styles.dishQtyStepper} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={styles.dishStepperBtn}
                              onClick={(e) => handleDecrementItem(item, e)}
                              title="Decrease quantity"
                            >
                              <Minus size={11} />
                            </button>
                            <span className={styles.dishStepperQty}>{cartQty}</span>
                            <button
                              type="button"
                              className={styles.dishStepperBtn}
                              onClick={(e) => { e.stopPropagation(); handleQuickAdd(item); }}
                              title="Increase quantity"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.dishAddBtn}
                            onClick={(e) => { e.stopPropagation(); handleQuickAdd(item); }}
                            title="Add to order"
                          >
                            <Plus size={13} />
                          </button>
                        )}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4 className={styles.drawerTitle} style={{ margin: 0 }}>
                        {tableNumber === 'Walk-in' ? 'Walk-in' : `Table ${formatTableOnlyNumber(tableNumber)}`}
                      </h4>
                      {mergedTables.map(mTable => (
                        <span
                          key={mTable}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            backgroundColor: '#e0e7ff',
                            color: '#3730a3',
                            border: '1px solid #c7d2fe',
                            padding: '1px 6px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '800'
                          }}
                        >
                          + Table {formatTableOnlyNumber(mTable)}
                          <button
                            type="button"
                            onClick={() => setMergedTables(prev => prev.filter(t => t !== mTable))}
                            title={`Demerge Table ${mTable}`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4338ca', padding: 0, display: 'flex' }}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      {tableNumber !== 'Walk-in' && (
                        <button
                          type="button"
                          onClick={() => setShowMergeModal(true)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            backgroundColor: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            color: '#334155'
                          }}
                        >
                          <Plus size={11} /> Merge
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                </div>

                {/* Customer Inputs */}
                <div className={styles.customerInputs}>
                  <input
                    type="text"
                    placeholder="Guest Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={styles.inputField}
                  />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Phone Number"
                    value={customerPhone}
                    onKeyDown={(e) => {
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
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
                      <span>ACTIVE ORDERS ({currentTableOrders.length})</span>
                      <span>₹{formatAmount(runningOrdersTotal)}</span>
                    </div>

                    {/* Quick selection bar for partial/paid order */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 2px 8px', fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                      <span>
                        {selectedItemsSummary.count > 0
                          ? `Selected: ${selectedItemsSummary.count} item(s) (₹${formatAmount(selectedItemsSummary.total)})`
                          : 'Select items below to mark as Paid:'}
                      </span>
                      {selectedItemsSummary.count > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedItemKeys(new Set())}
                          style={{
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <X size={11} /> Clear Selection
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSelectAllUnpaid}
                          style={{
                            border: '1px solid #c4b5fd',
                            background: '#ede9fe',
                            color: '#6d28d9',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <CheckSquare size={11} /> Select All Unpaid
                        </button>
                      )}
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
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>Round {idx + 1}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              {ord.paymentStatus === 'paid' && (
                                <span className={styles.paidBadge}>✓ Fully Paid</span>
                              )}
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
                          </div>

                          <div className={styles.cartList}>
                            {(ord.items || []).map((it, itemIdx) => {
                              const isPaid = Boolean(it.isPaid || ord.paymentStatus === 'paid');
                              const itemKey = `${ord._id}_${itemIdx}`;
                              const isSelected = selectedItemKeys.has(itemKey);

                              return (
                                <div key={itemIdx} className={styles.cartItem} style={{
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  marginBottom: '4px',
                                  border: isSelected ? '1.5px solid #c4b5fd' : (itemIdx < ord.items.length - 1 ? '1px dashed #e2e8f0' : '1px solid transparent'),
                                  background: isSelected ? '#f5f3ff' : 'transparent',
                                  transition: 'all 0.15s ease',
                                  opacity: isPaid ? 0.78 : 1
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    {!isPaid ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleItemSelect(itemKey);
                                        }}
                                        style={{
                                          width: '20px',
                                          height: '20px',
                                          minWidth: '20px',
                                          minHeight: '20px',
                                          borderRadius: '5px',
                                          border: isSelected ? '2px solid #7c3aed' : '2px solid #cbd5e1',
                                          background: isSelected ? '#7c3aed' : '#ffffff',
                                          color: '#ffffff',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          cursor: 'pointer',
                                          padding: 0,
                                          marginTop: '2px',
                                          transition: 'all 0.15s ease',
                                          boxShadow: isSelected ? '0 2px 4px rgba(124, 58, 237, 0.25)' : 'none'
                                        }}
                                        title={isSelected ? "Item selected (click to uncheck)" : "Click to select item for payment"}
                                      >
                                        {isSelected && <Check size={13} strokeWidth={3.2} />}
                                      </button>
                                    ) : (
                                      <div
                                        style={{
                                          width: '20px',
                                          height: '20px',
                                          minWidth: '20px',
                                          borderRadius: '5px',
                                          background: '#ecfdf5',
                                          border: '1.5px solid #86efac',
                                          color: '#16a34a',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          marginTop: '2px'
                                        }}
                                        title="Item is already paid"
                                      >
                                        <Check size={12} strokeWidth={3} />
                                      </div>
                                    )}
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                        <p className={styles.cartItemTitle} style={{ margin: 0 }}>{it.name || it.item?.name || 'Item'}</p>
                                        {it.isDirect && <span className={styles.directBadge}>⚡ Direct</span>}
                                        {isPaid ? (
                                          <span className={styles.paidBadge}>✓ Paid</span>
                                        ) : (
                                          <span className={styles.unpaidBadge}>Unpaid</span>
                                        )}
                                      </div>
                                      <p className={styles.cartItemPrice} style={{ margin: '2px 0 0' }}>₹{formatAmount(it.price || 0)} each</p>
                                    </div>
                                  </div>
                                  <div className={styles.qtyControls}>
                                    {!isPaid && (
                                      <button type="button" className={styles.qtyBtn} onClick={() => handleUpdateExistingOrderItem(ord._id, itemIdx, -1)}>
                                        <Minus size={10} />
                                      </button>
                                    )}
                                    <span className={styles.qtyVal}>{it.quantity || 1}</span>
                                    {!isPaid && (
                                      <button type="button" className={styles.qtyBtn} onClick={() => handleUpdateExistingOrderItem(ord._id, itemIdx, 1)}>
                                        <Plus size={10} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Draft Section / Next Round */}
                {cart.length > 0 ? (
                  <div style={{ marginTop: currentTableOrders.length > 0 ? '10px' : '0' }}>
                    <div className={styles.draftSectionHeader}>
                      <span>{currentTableOrders.length > 0 ? `ROUND ${currentTableOrders.length + 1} (DRAFT)` : 'NEW ORDER (DRAFT)'} ({cart.length})</span>
                      <span>₹{formatAmount(draftCartTotal)}</span>
                    </div>

                    <div className={styles.cartList} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 10px' }}>
                      {cart.map((it, idx) => (
                        <div key={idx} className={styles.cartItem} style={{ padding: '5px 0', borderBottom: idx < cart.length - 1 ? '1px dashed #f1f5f9' : 'none' }}>
                          <div>
                            <p className={styles.cartItemTitle}>{it.name}</p>
                            <p className={styles.cartItemPrice}>₹{formatAmount(it.price)} each</p>
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
                  </div>
                ) : currentTableOrders.length === 0 ? (
                  <div className={styles.emptyCartPlaceholder}>
                    <ShoppingCart size={24} style={{ color: '#cbd5e1', marginBottom: 6 }} />
                    <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>Order Slip is Empty</p>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>Click dishes on the menu to take order</span>
                  </div>
                ) : null}
              </div>

              {/* Bottom Block: Payment Mode, Total & Action Buttons (Pinned Bottom) */}
              <div className={styles.drawerBottomBlock}>
                <div className={styles.billSummary}>
                  <div className={styles.billRowSub}>
                    <span>Gross Total:</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{formatAmount(grandTotal)}</span>
                  </div>

                  {paidItemsTotal > 0 && (
                    <div className={styles.billRowSub} style={{ color: '#16a34a' }}>
                      <span>Paid So Far:</span>
                      <span style={{ fontWeight: 700 }}>-₹{formatAmount(paidItemsTotal)}</span>
                    </div>
                  )}

                  <div className={styles.billRowTotal} style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                    <span>Balance Due:</span>
                    <span style={{ color: balanceDue > 0 ? '#ea580c' : '#16a34a', fontWeight: 900, fontSize: '0.95rem' }}>
                      ₹{formatAmount(balanceDue)}
                    </span>
                  </div>
                </div>

                {/* Progressive Terminal Action System */}
                {(() => {
                  const hasActiveOrders = currentTableOrders.length > 0;
                  const hasDraftItems = cart.length > 0;

                  return (
                    <>
                      {/* Dynamic Action Buttons */}
                      {(hasDraftItems || hasActiveOrders) && (
                        <div className={styles.terminalActionBtns}>
                          {/* 1. Send to Kitchen: Shown whenever draft items exist */}
                          {hasDraftItems && (
                            <button
                              type="button"
                              className={styles.sendKotBtn}
                              onClick={handleSendKOT}
                              disabled={isSendingKitchen}
                              title="Send draft items to Kitchen KDS (Status: In Kitchen)"
                            >
                              <ChefHat size={14} />
                              <span>{isSendingKitchen ? 'Sending...' : 'Send to Kitchen'}</span>
                            </button>
                          )}

                          {/* 2. Direct (Counter): Shown whenever draft items exist */}
                          {hasDraftItems && (
                            <button
                              type="button"
                              className={styles.directBtn}
                              onClick={handleDirectOrder}
                              disabled={isSubmittingDirect}
                              title="Direct counter items - bypasses kitchen, status: Served"
                            >
                              <Zap size={14} />
                              <span>{isSubmittingDirect ? 'Processing...' : 'Direct (Counter)'}</span>
                            </button>
                          )}

                          {/* 3. Pay Order: Available whenever active orders exist OR draft items exist */}
                          {(hasActiveOrders || hasDraftItems) && (
                            <button
                              type="button"
                              className={styles.paidOrderBtn}
                              onClick={async () => {
                                if (!hasActiveOrders && hasDraftItems) {
                                  // Auto-serve draft items and open payment dialog
                                  await handleDirectOrder();
                                  setKhataPaidAmount('0');
                                  setKhataBorrowAmount(0);
                                  setActualAmountReceived('');
                                  setSettlementDiscount('');
                                  setCashTenderGiven('');
                                  setSettlementDiscountReason('Customer Concession / Round Off');
                                  setSettlementSubMethod('Cash');
                                  setShowPayItemsModal(true);
                                  return;
                                }
                                if (selectedItemsSummary.count === 0 && balanceDue <= 0) {
                                  toast.error('All active items on this table are already paid!');
                                  return;
                                }
                                setKhataPaidAmount('0');
                                setKhataBorrowAmount(0);
                                setActualAmountReceived('');
                                setSettlementDiscount('');
                                setCashTenderGiven('');
                                setSettlementDiscountReason('Customer Concession / Round Off');
                                setSettlementSubMethod('Cash');
                                setShowPayItemsModal(true);
                              }}
                              disabled={isSubmittingItemPay || isSubmittingDirect || (!hasDraftItems && selectedItemsSummary.count === 0 && balanceDue <= 0)}
                              title="Mark selected items (or all unpaid items) as Paid"
                            >
                              <CreditCard size={14} />
                              <span>
                                {selectedItemsSummary.count > 0
                                  ? `Pay Selected (${selectedItemsSummary.count} - ₹${formatAmount(selectedItemsSummary.total)})`
                                  : (balanceDue > 0
                                      ? `Pay (₹${formatAmount(balanceDue)})`
                                      : (hasDraftItems ? `Quick Pay (₹${formatAmount(draftCartTotal)})` : 'Paid Order'))}
                              </span>
                            </button>
                          )}

                          {/* 4. Clear Table: Shown ONLY AFTER order is active on the table */}
                          {hasActiveOrders && (
                            <button
                              type="button"
                              className={styles.clearTableBtn}
                              onClick={handleClearTableClick}
                              disabled={isSettling}
                              title="Clear and reset table once customer finishes"
                            >
                              <CheckCircle2 size={14} />
                              <span>
                                {isSettling
                                  ? 'Clearing...'
                                  : (balanceDue === 0 ? 'Clear Table (Free)' : `Clear Table (₹${formatAmount(balanceDue)})`)}
                              </span>
                            </button>
                          )}

                          {/* Quick Thermal Print Bill & WhatsApp E-Bill */}
                          {hasActiveOrders && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginTop: '8px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const billOrder = {
                                    orderNumber: currentTableOrders[0]?.orderNumber || `TBL-${tableNumber}`,
                                    tableNumber,
                                    customerName: customerName || currentTableOrders[0]?.customerName || 'Guest',
                                    customerPhone: customerPhone || currentTableOrders[0]?.customerPhone || '',
                                    items: [
                                      ...currentTableOrders.flatMap(o => o.items || []),
                                      ...cart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity, variant: c.variant }))
                                    ],
                                    subTotal: grandTotal,
                                    totalAmount: grandTotal,
                                    paymentMethod: paymentMethod || 'Cash',
                                    paymentStatus: balanceDue === 0 ? 'PAID' : 'PENDING'
                                  };
                                  printOrderBill(billOrder, tenantInfo?.name);
                                }}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '9px',
                                  border: '1.5px solid #cbd5e1',
                                  background: '#ffffff',
                                  color: '#1e293b',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                title="Print 80mm Thermal Receipt"
                              >
                                <Printer size={15} color="#475569" />
                                <span>Print Bill</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const billOrder = {
                                    orderNumber: currentTableOrders[0]?.orderNumber || `TBL-${tableNumber}`,
                                    tableNumber,
                                    customerName: customerName || currentTableOrders[0]?.customerName || 'Guest',
                                    customerPhone: customerPhone || currentTableOrders[0]?.customerPhone || '',
                                    items: [
                                      ...currentTableOrders.flatMap(o => o.items || []),
                                      ...cart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity, variant: c.variant }))
                                    ],
                                    subTotal: grandTotal,
                                    totalAmount: grandTotal,
                                    paymentMethod: paymentMethod || 'Cash',
                                    paymentStatus: balanceDue === 0 ? 'PAID' : 'PENDING'
                                  };
                                  openWhatsappBill(billOrder, tenantInfo, customerPhone);
                                  toast.success('WhatsApp E-Bill opened!');
                                }}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '9px',
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                                  color: '#ffffff',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.35)',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
                                title="Send WhatsApp Digital E-Bill"
                              >
                                <FaWhatsapp size={16} />
                                <span>WhatsApp E-Bill</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2.1 PAY ITEMS / TABLE SETTLEMENT & CONCESSION MODAL       */}
      {/* ========================================================= */}
      {showPayItemsModal && (() => {
        const tenderAmount = selectedItemsSummary.count > 0 ? selectedItemsSummary.total : balanceDue;
        
        // Calculate settlement discount and payable amount
        const discountVal = Math.max(0, Number(settlementDiscount) || 0);
        const finalPayable = Math.max(0, tenderAmount - discountVal);

        const availableTenders = [
          { id: 'Cash', label: 'Cash', icon: Banknote },
          { id: 'UPI / GPay', label: 'UPI / GPay', icon: Smartphone },
          { id: 'Card', label: 'Card', icon: CreditCard },
          ...(tenantInfo?.settings?.enableKhata !== false ? [{ id: 'Khata / Borrow', label: 'Udhar / Khata', icon: BookOpen }] : [])
        ];

        const currentMethod = (payItemsMethod === 'Settlement' || !payItemsMethod) ? 'Cash' : payItemsMethod;

        const rawPaidNow = Number(khataPaidAmount) || 0;
        const paidNowNum = Math.min(finalPayable, Math.max(0, rawPaidNow));
        const borrowDueNum = Math.max(0, finalPayable - paidNowNum);

        // Cash tender change calculation
        const tenderGivenNum = Number(cashTenderGiven) || 0;
        const changeDue = Math.max(0, tenderGivenNum - finalPayable);

        const handleModalConfirm = async () => {
          if (payItemsMethod === 'Khata / Borrow') {
            const effName = customerName.trim() || (tableNumber !== 'Walk-in' ? `Table ${tableNumber} Guest` : 'Walk-in Guest');
            const effPhone = customerPhone.trim() || 'N/A';

            setIsSubmittingKhata(true);
            const token = localStorage.getItem('token');
            const effectiveTenantId = tenantId || tenantInfo?._id || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

            try {
              // Check how many unpaid items exist on table
              const allUnpaidItems = currentTableOrders.flatMap(o => (o.items || []).filter(it => !it.isPaid));
              const isPartialKhata = selectedItemsSummary.count > 0 && selectedItemsSummary.count < allUnpaidItems.length;

              // Extract items to record in Khata
              const khataItems = selectedItemsSummary.count > 0
                ? selectedItemsSummary.itemsList.map(it => ({
                    name: it.name || 'Dish',
                    quantity: it.quantity || 1,
                    price: Number(it.price) || 0
                  }))
                : allUnpaidItems.map(it => ({
                    name: it.name || it.item?.name || 'Dish',
                    quantity: it.quantity || 1,
                    price: Number(it.price || it.item?.price) || 0
                  }));

              // 1. Record directly in Khata / Customer Credit Ledger (with final discounted amount)
              await axios.post(`${API}/khata`, {
                tenantId: effectiveTenantId,
                customerName: effName,
                customerPhone: effPhone,
                totalBill: finalPayable,
                paidAmount: paidNowNum,
                borrowAmount: borrowDueNum,
                notes: khataNotes || (isPartialKhata ? `Table ${tableNumber} partial dishes (${selectedItemsSummary.count})` : `Table ${tableNumber} order${discountVal > 0 ? ` [Discount: ₹${discountVal}]` : ''}`),
                items: khataItems
              }, {
                headers: token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : {}
              });

              if (isPartialKhata) {
                // PARTIAL ITEM SETTLEMENT: Only mark selected items as paid/khata, DO NOT CLEAR OR FREE TABLE
                const itemsToPay = selectedItemsSummary.itemsList.map(it => ({
                  orderId: it.orderId,
                  itemIndex: it.itemIndex
                }));

                await axios.put(
                  `${API}/orders/table/${encodeURIComponent(String(tableNumber).trim())}/pay-items`,
                  {
                    paymentMethod: 'Khata / Borrow',
                    itemsToPay,
                    payAll: false,
                    actualAmount: paidNowNum,
                    settledAmount: paidNowNum,
                    discountAmount: discountVal,
                    discountReason: settlementDiscountReason || 'Settlement Concession / Round Off',
                    tenantId: effectiveTenantId
                  },
                  { headers: token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : {} }
                );

                toast.success(`✓ Recorded ₹${finalPayable} in Khata (${effName})! ${allUnpaidItems.length - selectedItemsSummary.count} unpaid item(s) remain on Table ${tableNumber}.`);
                setShowPayItemsModal(false);
                setSelectedItemKeys(new Set());
                setKhataPaidAmount('0');
                setKhataBorrowAmount(0);
                setKhataNotes('');
                setActualAmountReceived('');
                setSettlementDiscount('');
                setCashTenderGiven('');

                if (onOrderPlaced) onOrderPlaced({ tableNumber, _refreshAll: true });
                if (onOrderCreated) onOrderCreated({ tableNumber, _refreshAll: true });
              } else {
                // FULL TABLE SETTLEMENT: All items are covered, settle orders on this table & free table
                const allSettleTables = [String(tableNumber).trim(), ...mergedTables.map(t => String(t).trim())];
                if (tableNumber !== 'Walk-in') {
                  await axios.put(
                    `${API}/orders/table/${encodeURIComponent(String(tableNumber).trim())}/settle`,
                    {
                      paymentMethod: 'Khata / Borrow',
                      paymentStatus: borrowDueNum === 0 ? 'paid' : (paidNowNum > 0 ? 'partial' : 'pending'),
                      tenantId: effectiveTenantId,
                      mergedTables: allSettleTables,
                      actualAmount: paidNowNum,
                      settledAmount: paidNowNum,
                      discountAmount: discountVal,
                      discountReason: settlementDiscountReason || 'Settlement Concession / Round Off',
                      originalTotal: grandTotal
                    },
                    { headers: token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : {} }
                  );
                }

                toast.success(`✓ Khata recorded for ${effName} (Paid: ₹${paidNowNum}, Borrow: ₹${borrowDueNum}). Table ${tableNumber} cleared!`);
                setCart([]);
                setCustomerName('');
                setCustomerPhone('');
                setActualAmountReceived('');
                setSettlementDiscount('');
                setCashTenderGiven('');
                setKhataPaidAmount('0');
                setKhataBorrowAmount(0);
                setKhataNotes('');
                setSelectedItemKeys(new Set());
                setMergedTables([]);
                setShowPayItemsModal(false);

                allSettleTables.forEach(tNum => {
                  if (onOrderPlaced) onOrderPlaced({ tableNumber: tNum, status: 'completed', _refreshAll: true });
                  if (onOrderCreated) onOrderCreated({ tableNumber: tNum, status: 'completed', _refreshAll: true });
                  if (onSettleTable) onSettleTable(tNum);
                });

                // Return to table matrix view - table is completely clear
                setViewMode('tables');
              }
            } catch (err) {
              console.error('Khata settlement error:', err);
              toast.error('Failed to record Khata: ' + (err.response?.data?.error || err.message));
            } finally {
              setIsSubmittingKhata(false);
            }
            return;
          }

          // For standard Cash / UPI / Card payment
          handleConfirmPayItems(finalPayable, discountVal, currentMethod);
        };

        return (
          <div className={styles.splitModalOverlay} onClick={() => setShowPayItemsModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className={styles.splitModalContent}
              style={{
                maxWidth: '430px',
                width: '94%',
                padding: '16px 18px',
                borderRadius: '14px',
                background: '#ffffff',
                boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Compact Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: currentMethod === 'Khata / Borrow' ? '#fffbeb' : '#f5f3ff',
                    color: currentMethod === 'Khata / Borrow' ? '#d97706' : '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {currentMethod === 'Khata / Borrow' ? <BookOpen size={16} /> : <Wallet size={16} />}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedItemsSummary.count > 0 ? `Pay (${selectedItemsSummary.count} items)` : `Table ${tableNumber} Settlement`}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayItemsModal(false)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b'
                  }}
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Clean Compact Bill Bar */}
              <div style={{
                background: discountVal > 0 ? '#f0fdf4' : '#f8fafc',
                border: discountVal > 0 ? '1px solid #86efac' : '1px solid #e2e8f0',
                borderRadius: '9px',
                padding: '8px 12px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: discountVal > 0 ? '#15803d' : '#64748b', textTransform: 'uppercase' }}>
                    {discountVal > 0 ? 'Final Net Payable' : 'Total Bill Due'}
                  </span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: discountVal > 0 ? '#15803d' : '#0f172a', lineHeight: 1.1 }}>
                    ₹{formatAmount(finalPayable)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {discountVal > 0 ? (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 7px', borderRadius: '5px' }}>
                      Original ₹{tenderAmount} (-₹{discountVal})
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', background: '#ffffff', border: '1px solid #e2e8f0', padding: '2px 7px', borderRadius: '5px' }}>
                      Table {tableNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Payment Tender Tabs: Cash, UPI / GPay, Card, Udhar / Khata */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${availableTenders.length}, 1fr)`, gap: '5px', marginBottom: '10px' }}>
                {availableTenders.map(t => {
                  const IconComp = t.icon;
                  const isSelected = currentMethod === t.id;
                  const isKhata = t.id === 'Khata / Borrow';

                  let activeBorder = '2px solid #7c3aed';
                  let activeBg = '#f5f3ff';
                  let activeColor = '#7c3aed';

                  if (isKhata) {
                    activeBorder = '2px solid #d97706';
                    activeBg = '#fffbeb';
                    activeColor = '#92400e';
                  }

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPayItemsMethod(t.id)}
                      style={{
                        padding: '6px 2px',
                        borderRadius: '8px',
                        border: isSelected ? activeBorder : '1px solid #e2e8f0',
                        background: isSelected ? activeBg : '#ffffff',
                        color: isSelected ? activeColor : '#64748b',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.71rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px'
                      }}
                    >
                      <IconComp size={15} color={isSelected ? activeColor : '#64748b'} />
                      <span style={{ whiteSpace: 'nowrap' }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* SETTLED / FINAL AMOUNT & CONCESSION CARD (FOR CASH, UPI, CARD) */}
              {currentMethod !== 'Khata / Borrow' && (
                <div style={{
                  background: '#f8fafc',
                  border: discountVal > 0 ? '1px solid #86efac' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '9px 11px',
                  marginBottom: '10px'
                }}>
                  {/* Final Amount & Discount Input Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '7px', marginBottom: '7px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                        Final Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={tenderAmount}
                        placeholder={String(tenderAmount)}
                        value={discountVal > 0 ? (tenderAmount - discountVal) : String(tenderAmount)}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') {
                            setSettlementDiscount('');
                          } else {
                            const pays = Math.max(0, Math.min(tenderAmount, Number(raw) || 0));
                            const disc = Math.max(0, tenderAmount - pays);
                            setSettlementDiscount(disc > 0 ? String(disc) : '');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: discountVal > 0 ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: discountVal > 0 ? '#15803d' : '#0f172a',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: '#dc2626', marginBottom: '2px' }}>
                        Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={tenderAmount}
                        placeholder="0"
                        value={settlementDiscount || ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') {
                            setSettlementDiscount('');
                          } else {
                            const disc = Math.min(tenderAmount, Math.max(0, Number(raw) || 0));
                            setSettlementDiscount(disc > 0 ? String(disc) : '');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: discountVal > 0 ? '1.5px solid #f87171' : '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: '#dc2626',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Round-off Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: currentMethod === 'Cash' ? '7px' : '0px' }}>
                    <button
                      type="button"
                      onClick={() => setSettlementDiscount('')}
                      style={{
                        padding: '2px 6px',
                        borderRadius: '5px',
                        border: discountVal === 0 ? '1px solid #10b981' : '1px solid #cbd5e1',
                        background: discountVal === 0 ? '#dcfce7' : '#ffffff',
                        color: discountVal === 0 ? '#065f46' : '#475569',
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Exact ₹{tenderAmount}
                    </button>

                    {tenderAmount > 50 && (tenderAmount % 50 !== 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = Math.floor(tenderAmount / 50) * 50;
                          setSettlementDiscount(String(tenderAmount - target));
                        }}
                        style={{
                          padding: '2px 6px',
                          borderRadius: '5px',
                          border: discountVal === (tenderAmount - Math.floor(tenderAmount / 50) * 50) ? '1px solid #10b981' : '1px solid #cbd5e1',
                          background: discountVal === (tenderAmount - Math.floor(tenderAmount / 50) * 50) ? '#dcfce7' : '#ffffff',
                          color: discountVal === (tenderAmount - Math.floor(tenderAmount / 50) * 50) ? '#065f46' : '#475569',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Round to ₹{Math.floor(tenderAmount / 50) * 50} (-₹{tenderAmount - Math.floor(tenderAmount / 50) * 50})
                      </button>
                    )}

                    {tenderAmount > 10 && (tenderAmount % 10 !== 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = Math.floor(tenderAmount / 10) * 10;
                          setSettlementDiscount(String(tenderAmount - target));
                        }}
                        style={{
                          padding: '2px 6px',
                          borderRadius: '5px',
                          border: discountVal === (tenderAmount - Math.floor(tenderAmount / 10) * 10) ? '1px solid #10b981' : '1px solid #cbd5e1',
                          background: discountVal === (tenderAmount - Math.floor(tenderAmount / 10) * 10) ? '#dcfce7' : '#ffffff',
                          color: discountVal === (tenderAmount - Math.floor(tenderAmount / 10) * 10) ? '#065f46' : '#475569',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Round to ₹{Math.floor(tenderAmount / 10) * 10} (-₹{tenderAmount - Math.floor(tenderAmount / 10) * 10})
                      </button>
                    )}

                    {[10, 20, 50].map(amt => {
                      if (tenderAmount <= amt) return null;
                      const isChosen = discountVal === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSettlementDiscount(String(amt))}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '5px',
                            border: isChosen ? '1px solid #10b981' : '1px solid #cbd5e1',
                            background: isChosen ? '#dcfce7' : '#ffffff',
                            color: isChosen ? '#065f46' : '#475569',
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          -₹{amt}
                        </button>
                      );
                    })}
                  </div>

                  {/* If Cash: show Cash Tender Given & Change Return */}
                  {currentMethod === 'Cash' && (
                    <div style={{ marginTop: '7px', paddingTop: '7px', borderTop: '1px dashed #cbd5e1', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '7px', alignItems: 'center' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.63rem', fontWeight: 700, color: '#475569', marginBottom: '2px' }}>
                          Cash Given (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder={String(finalPayable)}
                          value={cashTenderGiven}
                          onChange={(e) => setCashTenderGiven(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '5px 7px',
                            borderRadius: '5px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            boxSizing: 'border-box',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>
                          Change to Return
                        </div>
                        <div style={{
                          padding: '5px 7px',
                          borderRadius: '5px',
                          border: tenderGivenNum > finalPayable ? '1px solid #86efac' : '1px solid #e2e8f0',
                          background: tenderGivenNum > finalPayable ? '#f0fdf4' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontSize: '0.86rem', fontWeight: 900, color: tenderGivenNum > finalPayable ? '#15803d' : '#64748b' }}>
                            ₹{formatAmount(changeDue)}
                          </span>
                          {tenderGivenNum > finalPayable && (
                            <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '1px 4px', borderRadius: '3px' }}>
                              RETURN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If UPI */}
                  {currentMethod === 'UPI / GPay' && (
                    <div style={{ marginTop: '5px', fontSize: '0.68rem', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Smartphone size={13} /> Collect ₹{formatAmount(finalPayable)} via Store QR / Soundbox
                    </div>
                  )}

                  {/* If Card */}
                  {currentMethod === 'Card' && (
                    <div style={{ marginTop: '5px', fontSize: '0.68rem', fontWeight: 700, color: '#9333ea', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CreditCard size={13} /> Swipe / Tap Card for ₹{formatAmount(finalPayable)} on POS EDC
                    </div>
                  )}
                </div>
              )}

              {/* KHATA / BORROW */}
              {currentMethod === 'Khata / Borrow' && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '9px 11px',
                  marginBottom: '10px'
                }}>
                  <div style={{ marginBottom: '6px' }}>
                    <select
                      value={selectedKhataCustomerChoice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedKhataCustomerChoice(val);
                        if (val === 'NEW') {
                          setCustomerName('');
                          setCustomerPhone('');
                        } else {
                          const found = khataCustomerList.find(c => (c.customerPhone !== 'N/A' && c.customerPhone === val) || c.customerName === val);
                          if (found) {
                            setCustomerName(found.customerName);
                            setCustomerPhone(found.customerPhone !== 'N/A' ? found.customerPhone : '');
                          }
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '5px 7px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="NEW">➕ Create New Customer</option>
                      {khataCustomerList.map((c, i) => (
                        <option key={i} value={c.customerPhone !== 'N/A' ? c.customerPhone : c.customerName}>
                          {c.customerName} {c.customerPhone !== 'N/A' ? `(${c.customerPhone})` : ''} — Due: ₹${c.outstandingBalance}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      placeholder="Name (Optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 7px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.72rem',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Mobile (Optional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      style={{
                        width: '100%',
                        padding: '5px 7px',
                        borderRadius: '5px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.72rem',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#16a34a', marginBottom: '1px' }}>
                        Paid Now (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={tenderAmount}
                        placeholder="0"
                        value={khataPaidAmount}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') setKhataPaidAmount('');
                          else setKhataPaidAmount(String(Math.min(tenderAmount, Math.max(0, Number(raw) || 0))));
                        }}
                        style={{
                          width: '100%',
                          padding: '5px 7px',
                          borderRadius: '5px',
                          border: '1px solid #bbf7d0',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#16a34a',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#dc2626', marginBottom: '1px' }}>
                        Udhar Due (₹)
                      </label>
                      <div style={{
                        padding: '5px 7px',
                        borderRadius: '5px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#dc2626',
                        boxSizing: 'border-box'
                      }}>
                        ₹{formatAmount(borrowDueNum)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons: Cancel and Confirm */}
              <div style={{ display: 'flex', gap: '7px' }}>
                <button
                  type="button"
                  onClick={() => setShowPayItemsModal(false)}
                  style={{
                    flex: 1,
                    height: '38px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalConfirm}
                  disabled={isSubmittingItemPay || isSubmittingKhata}
                  style={{
                    flex: 2,
                    height: '38px',
                    borderRadius: '8px',
                    border: 'none',
                    background: currentMethod === 'Khata / Borrow'
                      ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                      : 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  {currentMethod === 'Khata / Borrow' ? <BookOpen size={15} /> : <CheckCircle2 size={15} />}
                  <span>
                    {isSubmittingItemPay || isSubmittingKhata
                      ? 'Processing...'
                      : (currentMethod === 'Khata / Borrow'
                          ? (borrowDueNum > 0 ? `Record Khata (₹${formatAmount(borrowDueNum)} Due)` : `Confirm & Settle (₹${formatAmount(paidNowNum)})`)
                          : (discountVal > 0
                              ? `Confirm & Pay ₹${formatAmount(finalPayable)} (-₹${formatAmount(discountVal)})`
                              : `Confirm & Pay ₹${formatAmount(finalPayable)}`))}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* 2.2 CLEAR TABLE CONFIRMATION MODAL                        */}
      {/* ========================================================= */}
      {showClearConfirmModal && (
        <div className={styles.splitModalOverlay} onClick={() => setShowClearConfirmModal(false)}>
          <div className={styles.splitModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Clear Table {tableNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '12px 14px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
                <span style={{ color: '#7c2d12', fontWeight: 600 }}>Total Unpaid Balance:</span>
                <strong style={{ color: '#0f172a' }}>₹{formatAmount(balanceDue)}</strong>
              </div>
              {actualAmountReceived !== '' && !isNaN(Number(actualAmountReceived)) && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
                    <span style={{ color: '#15803d', fontWeight: 700 }}>Actual Amount Received:</span>
                    <strong style={{ color: '#15803d' }}>₹{formatAmount(Number(actualAmountReceived))}</strong>
                  </div>
                  {Number(actualAmountReceived) < balanceDue && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#c2410c', fontWeight: 700 }}>
                      <span>Settled with Adjustment:</span>
                      <span>-₹{formatAmount(balanceDue - Number(actualAmountReceived))}</span>
                    </div>
                  )}
                  {Number(actualAmountReceived) > balanceDue && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>
                      <span>Change to Return:</span>
                      <span>₹{formatAmount(Number(actualAmountReceived) - balanceDue)}</span>
                    </div>
                  )}
                </>
              )}
              <div style={{ borderTop: '1px dashed #fed7aa', marginTop: '8px', paddingTop: '6px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#c2410c' }}>
                  Amount to Collect & Settle:
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#ea580c' }}>
                  ₹{formatAmount(actualAmountReceived !== '' && !isNaN(Number(actualAmountReceived)) ? Number(actualAmountReceived) : balanceDue)}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                Select Payment Tender
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                {['Cash', 'UPI / GPay', 'Card'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setClearTablePaymentMethod(m)}
                    style={{
                      padding: '7px 4px',
                      borderRadius: '8px',
                      border: clearTablePaymentMethod === m ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      background: clearTablePaymentMethod === m ? '#f0fdf4' : '#ffffff',
                      color: clearTablePaymentMethod === m ? '#16a34a' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: '#64748b' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirmModal(false);
                  handleSettleBill(clearTablePaymentMethod);
                }}
                disabled={isSettling}
                style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#ffffff', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={15} />
                <span>{isSettling ? 'Clearing...' : `Settle & Free Table (₹${formatAmount(actualAmountReceived !== '' && !isNaN(Number(actualAmountReceived)) ? Number(actualAmountReceived) : balanceDue)})`}</span>
              </button>
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

            {/* Add-ons */}
            {customizingItem.addons && customizingItem.addons.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Extra Add-ons
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {customizingItem.addons.map((addon, aIdx) => {
                    const isChecked = selectedAddons.some(a => a.name === addon.name);
                    return (
                      <div
                        key={addon.name || aIdx}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedAddons(prev => prev.filter(a => a.name !== addon.name));
                          } else {
                            setSelectedAddons(prev => [...prev, addon]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: isChecked ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: isChecked ? '#eff6ff' : '#ffffff',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => { }}
                            style={{ accentColor: '#2563eb', width: 15, height: 15 }}
                          />
                          <span>{addon.name}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: '#059669' }}>+₹{addon.price || 0}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Instructions / Notes */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: 4 }}>
                Special Cooking Instructions / Notes
              </span>
              <input
                type="text"
                placeholder="e.g. Less spicy, extra sauce, well done..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Quantity Stepper & Dynamic Total */}
            {(() => {
              const vPrice = selectedVariant ? (Number(selectedVariant.price) >= 0 ? Number(selectedVariant.price) : (customizingItem.salePrice || customizingItem.price)) : (customizingItem.salePrice || customizingItem.price);
              const aPrice = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
              const singleUnitPrice = vPrice + aPrice;
              const modalTotal = singleUnitPrice * customQty;

              return (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #2563eb',
                    borderRadius: 8,
                    padding: '4px 8px',
                    gap: 10,
                    height: '42px',
                    boxSizing: 'border-box'
                  }}>
                    <button
                      type="button"
                      onClick={() => setCustomQty(prev => Math.max(1, prev - 1))}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', display: 'flex', padding: 0 }}
                    >
                      <Minus size={15} />
                    </button>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', minWidth: 16, textAlign: 'center' }}>
                      {customQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomQty(prev => prev + 1)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', display: 'flex', padding: 0 }}
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomized}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      height: '42px'
                    }}
                  >
                    Add to Order (₹{modalTotal})
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4B. MERGE TABLE MODAL                                     */}
      {/* ========================================================= */}
      {showMergeModal && (
        <div className={styles.splitModalOverlay} onClick={() => setShowMergeModal(false)}>
          <div className={styles.splitModalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Merge Tables with Table {tableNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem' }}>
              Select occupied tables to combine their running orders into one bill. You can demerge at any time before payment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {dbTables
                .filter(tbl => String(tbl.tableNumber).trim() !== String(tableNumber).trim())
                .map(tbl => {
                  const tStr = String(tbl.tableNumber).trim();
                  const ords = activeOrdersByTable[tStr] || activeOrdersByTable[`Table ${tStr}`] || [];
                  const isMerged = mergedTables.includes(tStr);
                  const isOccupied = ords.length > 0;
                  const total = ords.reduce((s, o) => s + (Number(o.total || o.totalAmount) || 0), 0);

                  return (
                    <div
                      key={tbl._id || tStr}
                      onClick={() => {
                        if (isMerged) {
                          setMergedTables(prev => prev.filter(t => t !== tStr));
                        } else {
                          setMergedTables(prev => [...prev, tStr]);
                        }
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isMerged ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                        backgroundColor: isMerged ? '#eef2ff' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isMerged}
                          onChange={() => { }}
                          style={{ accentColor: '#4f46e5', width: 16, height: 16 }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                            Table {tbl.tableNumber}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: isOccupied ? '#b45309' : '#10b981', fontWeight: 700 }}>
                            {isOccupied ? `● Occupied (${ords.length} orders)` : 'Free'}
                          </div>
                        </div>
                      </div>
                      {isOccupied && (
                        <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#e05c5c' }}>
                          ₹{formatAmount(total)}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowMergeModal(false);
                toast.success(mergedTables.length > 0 ? `Merged ${mergedTables.length} tables with Table ${tableNumber}` : 'Demerged tables');
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Done ({mergedTables.length} Tables Merged)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. KHATA / BORROW (UDHARI) SETTLEMENT MODAL (PREMIUM UI)   */}
      {/* ========================================================= */}
      {showKhataModal && (
        <div className={styles.splitModalOverlay} onClick={() => setShowKhataModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={styles.khataModal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.khataHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.khataIconWrap}>
                  <BookOpen size={22} />
                </div>
                <div className={styles.khataTitleArea}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3>Customer Khata & Credit</h3>
                    <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '100px' }}>
                      UDHARI
                    </span>
                  </div>
                  <p>Record partial payment and maintain live borrower balance.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.khataCloseBtn}
                onClick={() => setShowKhataModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Total Bill Card with Dual-Progress Split Visualizer */}
            <div className={styles.khataBillCard}>
              <div className={styles.khataBillHeader}>
                <span className={styles.khataBillLabel}>Total Order Bill</span>
                <span className={styles.khataBillAmount}>₹{formatAmount(grandTotal)}</span>
              </div>

              {/* Live Visual Split Bar */}
              <div className={styles.khataSplitVisualizer}>
                <div className={styles.khataSplitTrack}>
                  <div
                    className={styles.khataPaidFill}
                    style={{ width: `${grandTotal > 0 ? Math.min(100, Math.max(0, ((Number(khataPaidAmount) || 0) / grandTotal) * 100)) : 0}%` }}
                  />
                  <div
                    className={styles.khataBorrowFill}
                    style={{ width: `${grandTotal > 0 ? Math.min(100, Math.max(0, (Math.max(0, grandTotal - (Number(khataPaidAmount) || 0)) / grandTotal) * 100)) : 100}%` }}
                  />
                </div>

                <div className={styles.khataSplitLabels}>
                  <span className={styles.khataPaidTag}>
                    ● Paid: ₹{formatAmount(Number(khataPaidAmount) || 0)} ({grandTotal > 0 ? Math.round(((Number(khataPaidAmount) || 0) / grandTotal) * 100) : 0}%)
                  </span>
                  <span className={styles.khataBorrowTag}>
                    ● Udhar Due: ₹{formatAmount(Math.max(0, grandTotal - (Number(khataPaidAmount) || 0)))} ({grandTotal > 0 ? Math.max(0, 100 - Math.round(((Number(khataPaidAmount) || 0) / grandTotal) * 100)) : 100}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Split Action Chips */}
            <div className={styles.khataPresetChips}>
              <button
                type="button"
                className={`${styles.khataPresetChip} ${(Number(khataPaidAmount) || 0) === 0 ? styles.khataPresetActive : ''}`}
                onClick={() => {
                  setKhataPaidAmount('0');
                  setKhataBorrowAmount(grandTotal);
                }}
              >
                Full Credit (₹0 Paid)
              </button>

              {grandTotal > 100 && (
                <button
                  type="button"
                  className={`${styles.khataPresetChip} ${(Number(khataPaidAmount) || 0) === 100 ? styles.khataPresetActive : ''}`}
                  onClick={() => {
                    setKhataPaidAmount('100');
                    setKhataBorrowAmount(Math.max(0, grandTotal - 100));
                  }}
                >
                  ₹100 Paid
                </button>
              )}

              {grandTotal > 500 && (
                <button
                  type="button"
                  className={`${styles.khataPresetChip} ${(Number(khataPaidAmount) || 0) === 500 ? styles.khataPresetActive : ''}`}
                  onClick={() => {
                    setKhataPaidAmount('500');
                    setKhataBorrowAmount(Math.max(0, grandTotal - 500));
                  }}
                >
                  ₹500 Paid
                </button>
              )}

              <button
                type="button"
                className={`${styles.khataPresetChip} ${(Number(khataPaidAmount) || 0) === Math.round(grandTotal / 2) ? styles.khataPresetActive : ''}`}
                onClick={() => {
                  const half = Math.round(grandTotal / 2);
                  setKhataPaidAmount(String(half));
                  setKhataBorrowAmount(grandTotal - half);
                }}
              >
                50% Split (₹{Math.round(grandTotal / 2)})
              </button>

              {grandTotal > 100 && Math.floor(grandTotal / 100) * 100 !== grandTotal && (
                <button
                  type="button"
                  className={`${styles.khataPresetChip} ${(Number(khataPaidAmount) || 0) === (Math.floor(grandTotal / 100) * 100) ? styles.khataPresetActive : ''}`}
                  onClick={() => {
                    const rounded = Math.floor(grandTotal / 100) * 100;
                    setKhataPaidAmount(String(rounded));
                    setKhataBorrowAmount(grandTotal - rounded);
                  }}
                >
                  Round to ₹{Math.floor(grandTotal / 100) * 100}
                </button>
              )}
            </div>

            {/* Customer Information Inputs (2-Col Side by Side) */}
            <div className={styles.khataTwoColGrid}>
              <div className={styles.khataFieldGroup}>
                <label className={styles.khataFieldLabel}>
                  <User size={13} color="#64748b" /> Customer Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className={styles.khataInputWrapper}>
                  <User size={14} className={styles.khataInputIcon} />
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={styles.khataInputField}
                    required
                  />
                </div>
              </div>

              <div className={styles.khataFieldGroup}>
                <label className={styles.khataFieldLabel}>
                  <Phone size={13} color="#64748b" /> Phone Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className={styles.khataInputWrapper}>
                  <Phone size={14} className={styles.khataInputIcon} />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit Mobile Number"
                    maxLength={10}
                    value={customerPhone}
                    onKeyDown={(e) => {
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={styles.khataInputField}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Split Amount Dual-Card Inputs */}
            <div className={styles.khataAmountsGrid}>
              <div className={`${styles.khataAmountBox} ${styles.khataPaidBox}`}>
                <div className={styles.khataAmountBoxLabel} style={{ color: '#15803d' }}>
                  Amount Paid Now
                </div>
                <div className={styles.khataAmountInputWrap}>
                  <span className={styles.khataAmountCurrency} style={{ color: '#16a34a' }}>₹</span>
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
                    className={`${styles.khataAmountInput} ${styles.khataPaidInput}`}
                  />
                </div>
              </div>

              <div className={`${styles.khataAmountBox} ${styles.khataBorrowBox}`}>
                <div className={styles.khataAmountBoxLabel} style={{ color: '#b45309' }}>
                  Borrow / Udhar Due *
                </div>
                <div className={styles.khataAmountInputWrap}>
                  <span className={styles.khataAmountCurrency} style={{ color: '#d97706' }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={khataBorrowAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setKhataBorrowAmount(e.target.value);
                      setKhataPaidAmount(String(Math.max(0, grandTotal - val)));
                    }}
                    className={`${styles.khataAmountInput} ${styles.khataBorrowInput}`}
                  />
                </div>
              </div>
            </div>

            {/* Notes & Quick Tags */}
            <div className={styles.khataFieldGroup} style={{ marginBottom: 0 }}>
              <label className={styles.khataFieldLabel}>
                <StickyNote size={13} color="#64748b" /> Notes / Ledger Memo (Optional)
              </label>
              <div className={styles.khataInputWrapper}>
                <StickyNote size={14} className={styles.khataInputIcon} />
                <input
                  type="text"
                  placeholder="e.g. Regular customer, will settle Friday"
                  value={khataNotes}
                  onChange={(e) => setKhataNotes(e.target.value)}
                  className={styles.khataInputField}
                />
              </div>

              {/* Quick Tag Badges */}
              <div className={styles.khataTagsWrap}>
                {['Regular Customer', 'Will Pay Tomorrow', 'Weekly Settlement', 'Office Tab'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.khataTagBtn}
                    onClick={() => {
                      setKhataNotes(prev => prev ? `${prev} • ${tag}` : tag);
                    }}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.khataActions}>
              <button
                type="button"
                className={styles.khataCancelBtn}
                onClick={() => setShowKhataModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.khataSubmitBtn}
                onClick={handleConfirmKhataSettlement}
                disabled={isSubmittingKhata || isSettling}
              >
                <CheckCircle2 size={16} />
                <span>
                  {isSubmittingKhata || isSettling
                    ? 'Recording...'
                    : `Record Khata & Settle (₹${formatAmount(Math.max(0, grandTotal - (Number(khataPaidAmount) || 0)))} Due)`}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
