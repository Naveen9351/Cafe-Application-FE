import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Grid, Plus, Minus, Search, Check, X, RefreshCw, CreditCard,
  Trash2, QrCode, Printer, Smartphone, Zap, Coffee, Clock,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Tag, ArrowLeft, ShoppingCart, IndianRupee,
  Utensils, ChefHat, Eye, CheckCircle2, CheckSquare, AlertCircle, Sparkles, Filter, Layers,
  User, UserPlus, Phone, BookOpen, StickyNote, Volume2, VolumeX, Banknote, Lock, Wallet, Percent, Moon, GitMerge, Link2,
  GripVertical, ArrowRight, ArrowRightLeft, Move, RotateCcw
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import rawToast from 'react-hot-toast';

// Only error toasts are permitted: completely suppress all action/success notifications
const toast = {
  ...rawToast,
  success: () => '',
  loading: () => '',
  custom: () => '',
  error: (msg, opts) => rawToast.error(msg, opts)
};
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getValidFoodImage, getCustomerFirstName } from '../AdminPanel';
import styles from './POSTerminal.module.css';
import { API_URL as API } from '../../config/api';
import { playOrderChime, isAudioMuted, setAudioMuted } from '../../utils/audioChime';
import { printOrderBill } from '../../utils/billPrinter';
import { openWhatsappBill } from '../../utils/whatsappBillSender';
import WhatsAppConnectModal from '../WhatsAppConnectModal';
import { hasModuleAccess, MODULE_KEYS } from '../../config/subscriptionPlans';
import { GPayIcon, PhonePeIcon, PaytmIcon, BhimIcon, buildUpiUri } from '../common/UpiBrandLogos';

// Smart table name formatter:
// Converts "1" -> "T 1", "Table 1" -> "T 1", "Ground" -> "T Ground", matching QR Code screens
export const formatTableName = (num) => {
  if (num === null || num === undefined || num === '') return 'T 1';
  const str = String(num).trim();
  if (str.toLowerCase() === 'walk-in') return 'Walk-in';
  if (/^temp/i.test(str)) return str;
  const clean = str.replace(/^(table|t)[\s-_]*/i, '').trim();
  return `T ${clean}`;
};

// Clean table number formatter (removes 'Table' label so it displays clean '1', '2', 'Ground', 'M1'):
export const formatTableOnlyNumber = (num) => {
  if (num === null || num === undefined || num === '') return '1';
  const str = String(num).trim();
  if (str.toLowerCase() === 'walk-in') return 'Walk-in';
  if (/^temp/i.test(str)) {
    return str.replace(/^temp\s*[-_:]\s*/i, '');
  }
  const clean = str.replace(/^(table|t)[\s-_]*/i, '').trim();
  return clean || str;
};

export default function POSTerminal({
  tenantId,
  tenantInfo,
  categories: passedCategories,
  menuItems = [],
  orders = [],
  initialTable = null,
  isMainSidebarOpen = true,
  onOrderCreated,
  onOrderPlaced,
  onSettleTable,
  onRefreshTables,
  onRefreshOrders
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTableParam = searchParams.get('table');

  const activeOperatingMode = tenantInfo?.operatingMode
    || tenantInfo?.settings?.operatingMode
    || tenantInfo?.businessOperatingArchitecture
    || (JSON.parse(localStorage.getItem('user') || '{}')?.operatingMode)
    || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId?.operatingMode)
    || 'dine_in';
  const hasTableSuite = tenantInfo?.subscription
    ? hasModuleAccess(tenantInfo?.subscription, MODULE_KEYS.TABLE_QR)
    : true;
  const isCounterBillingOnly = activeOperatingMode === 'counter_billing'
    || activeOperatingMode === 'quick_billing'
    || tenantInfo?.settings?.businessMode === 'quick_billing'
    || tenantInfo?.settings?.operatingMode === 'counter_billing'
    || tenantInfo?.operatingMode === 'counter_billing';

  const effectiveInitialTable = urlTableParam || initialTable || null;

  // View mode: In counter billing, ALWAYS 'terminal' (no floor tables). In dine-in, 'terminal' if table specified in URL or props, else 'tables' (Floor view)
  const [viewMode, setViewMode] = useState(isCounterBillingOnly ? 'terminal' : (effectiveInitialTable ? 'terminal' : 'tables'));
  const [tableNumber, setTableNumber] = useState(isCounterBillingOnly ? 'Walk-in' : (effectiveInitialTable || '1'));
  const [selectedZone, setSelectedZone] = useState('all');
  const [tableStatusFilter, setTableStatusFilter] = useState('all'); // 'all', 'free', 'occupied', 'paid'
  const [tableSearch, setTableSearch] = useState('');

  // POS Layout state
  const isBothSidebarsOpen = isMainSidebarOpen;

  // Persistent Draft State per Table (Preserves unsubmitted draft dishes across page reloads until sent to kitchen or counter)
  const getDraftKey = useCallback((tbl) => {
    const raw = String(tbl || 'walkin').trim().toLowerCase();
    const cleanTbl = raw.replace(/^(table|t)[\s-_]*/i, '').trim() || raw;
    const effTenant = tenantId || tenantInfo?._id || 'global';
    return `pos_draft_cart_${effTenant}_${cleanTbl}`;
  }, [tenantId, tenantInfo]);

  const loadDraftForTable = useCallback((tbl) => {
    if (!tbl) return [];
    try {
      const key = getDraftKey(tbl);
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.cart)) return parsed.cart;
      }
    } catch (e) { }
    return [];
  }, [getDraftKey]);

  const clearDraftForTable = useCallback((tbl) => {
    if (!tbl) return;
    try {
      const key = getDraftKey(tbl);
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch (e) { }
  }, [getDraftKey]);

  // Initial cart populated from persistent draft if available for the active table
  const initialDraft = useMemo(() => {
    if (!effectiveInitialTable) return [];
    try {
      const raw = String(effectiveInitialTable || 'walkin').trim().toLowerCase();
      const cleanTbl = raw.replace(/^(table|t)[\s-_]*/i, '').trim() || raw;
      const effTenant = tenantId || tenantInfo?._id || 'global';
      const key = `pos_draft_cart_${effTenant}_${cleanTbl}`;
      const saved = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.cart)) return parsed.cart;
      }
    } catch (e) { }
    return [];
  }, [effectiveInitialTable, tenantId, tenantInfo]);

  // Cart & Settlement state for POS Terminal
  const [cart, setCart] = useState(initialDraft);
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

  // Keep track of active table to switch draft carts cleanly when switching tables
  const activeTableRef = useRef(tableNumber);

  useEffect(() => {
    if (activeTableRef.current !== tableNumber) {
      activeTableRef.current = tableNumber;
      if (tableNumber) {
        const savedDraft = loadDraftForTable(tableNumber);
        setCart(savedDraft);
      } else {
        setCart([]);
      }
    }
  }, [tableNumber, loadDraftForTable]);

  // Save current table's unplaced draft cart to storage automatically whenever cart updates
  useEffect(() => {
    if (!tableNumber) return;
    const key = getDraftKey(tableNumber);
    try {
      if (cart && cart.length > 0) {
        const payload = JSON.stringify({
          cart,
          customerName: customerName || '',
          customerPhone: customerPhone || '',
          updatedAt: Date.now()
        });
        sessionStorage.setItem(key, payload);
        localStorage.setItem(key, payload);
      } else {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      }
    } catch (e) { }
  }, [cart, tableNumber, customerName, customerPhone, getDraftKey]);

  // Khata / Borrow Modal states
  const [showKhataModal, setShowKhataModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
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

  // Temporary Table (Open Tab) Modal state
  const [showTempTableModal, setShowTempTableModal] = useState(false);
  const [tempCustomerName, setTempCustomerName] = useState('');
  const [tempCustomerPhone, setTempCustomerPhone] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const [isCreatingTempTable, setIsCreatingTempTable] = useState(false);

  // Customization dialog state
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [customNotes, setCustomNotes] = useState('');
  const [customQty, setCustomQty] = useState(1);

  // Split bill states
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [splitCount, setSplitCount] = useState(2);

  // Merged & Moved tables state
  const [mergedTables, setMergedTables] = useState([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [primaryMergeTable, setPrimaryMergeTable] = useState('');
  const [mergeSourceTable, setMergeSourceTable] = useState('');
  const [mergeTargetTable, setMergeTargetTable] = useState('');
  const [moveSourceTable, setMoveSourceTable] = useState('');
  const [moveTargetTable, setMoveTargetTable] = useState('');
  const [dragOverTargetTable, setDragOverTargetTable] = useState(null);
  const [gridDragSourceTable, setGridDragSourceTable] = useState(null);
  const [gridDragOverTable, setGridDragOverTable] = useState(null);
  const [isDragDropMode, setIsDragDropMode] = useState(false);
  const [undoAction, setUndoAction] = useState(null); // { type: 'move'|'merge', from, to, timestamp }
  const undoActionRef = useRef(null);
  useEffect(() => {
    undoActionRef.current = undoAction;
  }, [undoAction]);
  const isDraggingRef = useRef(false);
  const floorContainerRef = useRef(null);
  const [showOpenItemModal, setShowOpenItemModal] = useState(false);
  const [isOpenItemModeEnabled, setIsOpenItemModeEnabled] = useState(false);
  const [openItemForm, setOpenItemForm] = useState({
    name: '',
    price: '',
    quantity: 1,
    notes: '',
    saveToMenu: false
  });
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
  const [isUpiAmountLocked, setIsUpiAmountLocked] = useState(true);
  const [isSubmittingItemPay, setIsSubmittingItemPay] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [clearTablePaymentMethod, setClearTablePaymentMethod] = useState('Cash');
  const [lastClearedBill, setLastClearedBill] = useState(null);

  // Load existing khata customers
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/khata/customers`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(res => {
      if (res.data?.success && Array.isArray(res.data.customers)) {
        setKhataCustomerList(res.data.customers);
      }
    }).catch(() => { });
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

  // Fetch dynamic tables from backend DB (supports silent background refresh)
  const fetchDbTables = useCallback((silent = false) => {
    if (!silent) {
      setIsLoadingTables(true);
    }
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
        if (!silent) {
          setIsLoadingTables(false);
        }
      });
  }, [tenantId]);

  useEffect(() => {
    fetchDbTables();
  }, [fetchDbTables]);

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
        const addKey = (k) => {
          if (!k) return;
          if (!map[k]) map[k] = [];
          if (!map[k].some(e => e._id === o._id)) map[k].push(o);
        };
        addKey(rawTable);
        addKey(rawTable.toLowerCase());
        addKey(rawTable.replace(/\s+/g, ''));
        addKey(rawTable.replace(/\s+/g, '').toLowerCase());
        if (numOnly && numOnly !== rawTable) {
          addKey(numOnly);
          addKey(numOnly.toLowerCase());
          addKey(`Table ${numOnly}`);
          addKey(`table ${numOnly.toLowerCase()}`);
        }
      }
    });
    return map;
  }, [orders]);

  // Helper: Get active orders for a specific table object (combining merged tables and clearing merged-in tables)
  const getOrdersForTableObj = useCallback((tbl) => {
    const tStr = String(tbl.tableNumber || tbl.table || '').trim();
    const numOnly = tStr.replace(/^Table\s*/i, '').trim();
    let res = activeOrdersByTable[tStr]
      || activeOrdersByTable[tStr.toLowerCase()]
      || activeOrdersByTable[tStr.replace(/\s+/g, '')]
      || activeOrdersByTable[tStr.replace(/\s+/g, '').toLowerCase()]
      || activeOrdersByTable[numOnly]
      || activeOrdersByTable[numOnly.toLowerCase()]
      || [];

    // If table has mergedWith (e.g. Table 1 merged with Table 2), combine all orders of merged tables so primary shows full combined total (e.g. ₹270)
    if (tbl.mergedWith && Array.isArray(tbl.mergedWith) && tbl.mergedWith.length > 0) {
      const mergedOrders = [];
      tbl.mergedWith.forEach(mT => {
        const mStr = String(mT).trim();
        const mNum = mStr.replace(/^Table\s*/i, '').trim();
        const mList = activeOrdersByTable[mStr]
          || activeOrdersByTable[mStr.toLowerCase()]
          || activeOrdersByTable[mNum]
          || activeOrdersByTable[mNum.toLowerCase()]
          || [];
        mList.forEach(mo => {
          if (!res.some(r => r._id === mo._id) && !mergedOrders.some(m => m._id === mo._id)) {
            mergedOrders.push(mo);
          }
        });
      });
      res = [...res, ...mergedOrders];
    }

    return res;
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
        const isTemp = /^temp/i.test(tNum);
        fromDb.push({
          _id: `auto_${tNum}`,
          tableNumber: tNum,
          seatingCapacity: 4,
          isTemporary: isTemp,
          customerName: isTemp ? tNum.replace(/^temp\s*[-_:]\s*/i, '') : '',
          section: isTemp ? 'Temporary Tables' : 'Main Floor',
          zone: isTemp ? 'Temporary Tables' : 'Main Floor'
        });
      }
    });

    return fromDb.sort((a, b) => {
      // Prioritize temporary tables first in list
      const aTemp = a.isTemporary || /^temp/i.test(String(a.tableNumber || ''));
      const bTemp = b.isTemporary || /^temp/i.test(String(b.tableNumber || ''));
      if (aTemp && !bTemp) return -1;
      if (!aTemp && bTemp) return 1;
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

      // Search filter (matches table number, guest name from table doc, or order customer)
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase().trim();
        const tNum = String(t.tableNumber || '').toLowerCase();
        const cName = String(t.customerName || '').toLowerCase();
        const hasMatch = tNum.includes(query) || cName.includes(query) ||
          tableOrders.some(o => (o.customerName || o.customerDetails?.name || '').toLowerCase().includes(query));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [allTablesList, getOrdersForTableObj, selectedZone, tableStatusFilter, tableSearch]);

  // Grouped tables by category / section (with Temporary Tables placed first)
  const groupedFloorTables = useMemo(() => {
    const map = {};
    filteredFloorTables.forEach(t => {
      const isTemp = t.isTemporary || /^temp/i.test(String(t.tableNumber || ''));
      const sec = isTemp ? 'Temporary Tables' : (t.section || t.zone || 'Main Hall').trim();
      if (!map[sec]) map[sec] = [];
      map[sec].push(t);
    });

    // Ensure 'Temporary Tables' is always the FIRST section in the returned map
    const orderedMap = {};
    const tempKey = 'Temporary Tables';
    if (map[tempKey]) {
      orderedMap[tempKey] = map[tempKey];
      delete map[tempKey];
    }
    Object.keys(map).forEach(k => {
      orderedMap[k] = map[k];
    });
    return orderedMap;
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

  // Occupied tables with active running orders (eligible to be source of a move or merge)
  const activeOccupiedTables = useMemo(() => {
    return dbTables.filter(tbl => {
      const ords = getOrdersForTableObj(tbl);
      return ords && ords.length > 0;
    });
  }, [dbTables, getOrdersForTableObj]);

  // Clean empty tables with NO active running orders (eligible to be target of a move)
  const freeEmptyTables = useMemo(() => {
    return dbTables.filter(tbl => {
      const ords = getOrdersForTableObj(tbl);
      return !ords || ords.length === 0;
    });
  }, [dbTables, getOrdersForTableObj]);

  const sourceTableTotal = useMemo(() => {
    if (!mergeSourceTable) return 0;
    const tbl = dbTables.find(t => String(t.tableNumber).trim() === String(mergeSourceTable).trim());
    if (!tbl) return 0;
    const ords = getOrdersForTableObj(tbl);
    return ords.reduce((s, o) => s + (Number(o.total || o.totalAmount) || 0), 0);
  }, [mergeSourceTable, dbTables, getOrdersForTableObj]);

  const targetTableTotal = useMemo(() => {
    if (!mergeTargetTable) return 0;
    const tbl = dbTables.find(t => String(t.tableNumber).trim() === String(mergeTargetTable).trim());
    if (!tbl) return 0;
    const ords = getOrdersForTableObj(tbl);
    return ords.reduce((s, o) => s + (Number(o.total || o.totalAmount) || 0), 0);
  }, [mergeTargetTable, dbTables, getOrdersForTableObj]);

  // Handle clicking a table card -> opens POS Terminal
  const handleOpenTableInPOS = useCallback((tblNum, updateUrl = true) => {
    if (!tblNum) return;
    const tStr = String(tblNum).trim();
    const tblObj = dbTables.find(t => String(t.tableNumber).trim().toLowerCase() === tStr.toLowerCase());

    setTableNumber(tStr);
    setViewMode('terminal');

    if (updateUrl && !isCounterBillingOnly) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (next.get('table') !== tStr) {
          next.set('table', tStr);
          return next;
        }
        return prev;
      });
    }

    // Load any merged tables associated with this table from DB
    if (tblObj && Array.isArray(tblObj.mergedWith)) {
      setMergedTables(tblObj.mergedWith);
    } else {
      setMergedTables([]);
    }

    const isTemp = tblObj?.isTemporary || /^temp/i.test(tStr);

    const ordersForTable = activeOrdersByTable[tStr] || activeOrdersByTable[tStr.replace(/[^0-9]/g, '')] || [];
    if (ordersForTable.length > 0) {
      const firstOrd = ordersForTable[0];
      setCustomerName(firstOrd.customerDetails?.name || firstOrd.customerName || tblObj?.customerName || (isTemp ? tStr.replace(/^temp\s*[-_:]\s*/i, '') : 'Dine-in Guest'));
      setCustomerPhone(firstOrd.customerDetails?.phone || firstOrd.customerPhone || tblObj?.customerPhone || '');
      if (firstOrd.paymentMethod) setPaymentMethod(firstOrd.paymentMethod);
    } else {
      const defaultCustName = tblObj?.customerName || (isTemp ? tStr.replace(/^temp\s*[-_:]\s*/i, '') : '');
      setCustomerName(defaultCustName);
      setCustomerPhone(tblObj?.customerPhone || '');
    }
  }, [dbTables, activeOrdersByTable, isCounterBillingOnly, setSearchParams]);

  // Return to floor tables grid
  const handleReturnToTables = useCallback(() => {
    if (isCounterBillingOnly) {
      setViewMode('terminal');
      setTableNumber('Walk-in');
    } else {
      setViewMode('tables');
      setTableNumber('');
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (next.has('table')) {
          next.delete('table');
          return next;
        }
        return prev;
      });
    }
  }, [isCounterBillingOnly, setSearchParams]);

  // Quick Walkin / Counter POS
  const handleQuickWalkin = () => {
    setTableNumber('Walk-in');
    setCustomerName('Walk-in Guest');
    setCustomerPhone('');
    setViewMode('terminal');
    if (!isCounterBillingOnly) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (next.get('table') !== 'Walk-in') {
          next.set('table', 'Walk-in');
          return next;
        }
        return prev;
      });
    }
  };

  // Synchronize table selection with URL and operating mode
  useEffect(() => {
    if (isCounterBillingOnly) {
      setTableNumber('Walk-in');
      setViewMode('terminal');
    } else if (urlTableParam) {
      handleOpenTableInPOS(urlTableParam, false);
    } else if (initialTable) {
      handleOpenTableInPOS(initialTable, true);
    } else {
      setViewMode('tables');
    }
  }, [urlTableParam, initialTable, isCounterBillingOnly, handleOpenTableInPOS]);

  // Enterprise Table Merge Handler (Persisted to Database & Instant UI Synchronisation)
  const handleMergeTables = async (primaryTbl, tablesToMerge) => {
    if (!primaryTbl) {
      toast.error('Please select a primary table');
      return;
    }
    if (!tablesToMerge || tablesToMerge.length === 0) {
      toast.error('Please select at least one table to merge');
      return;
    }
    const token = localStorage.getItem('token');
    const cleanPrimary = String(primaryTbl).replace(/^Table\s*/i, '').trim();
    const cleanMergeList = (tablesToMerge || []).map(t => String(t).replace(/^Table\s*/i, '').trim());

    try {
      const res = await axios.post(`${API}/tables/merge`, {
        primaryTable: cleanPrimary,
        tablesToMerge: cleanMergeList
      }, {
        headers: token ? { 'x-auth-token': token } : {}
      });

      setMergedTables(prev => Array.from(new Set([...prev, ...cleanMergeList])));

      // Immediate local state update in POSTerminal
      setDbTables(prev => prev.map(t => {
        const tNum = String(t.tableNumber || '').replace(/^Table\s*/i, '').trim();
        if (tNum === cleanPrimary) {
          const curr = Array.isArray(t.mergedWith) ? t.mergedWith : [];
          return {
            ...t,
            mergedWith: Array.from(new Set([...curr, ...cleanMergeList]))
          };
        }
        if (cleanMergeList.includes(tNum)) {
          return {
            ...t,
            status: 'available',
            mergedInto: null,
            mergedAt: null,
            currentOrder: null
          };
        }
        return t;
      }));

      // Re-fetch tables in POSTerminal silently (without full skeleton unmount/page jump)
      fetchDbTables(true);

      // Immediately propagate to parent AdminPanel
      if (onOrderPlaced) {
        onOrderPlaced({
          _refreshAll: true,
          _refreshTables: true,
          action: 'merge',
          primaryTable: cleanPrimary,
          mergedTables: cleanMergeList
        });
      }
      if (onRefreshTables) onRefreshTables();
      if (onRefreshOrders) onRefreshOrders();

      // If viewing the merged source table in terminal, auto-switch to primary destination table
      if (viewMode === 'terminal') {
        const activeCurrent = String(tableNumber || '').replace(/^Table\s*/i, '').trim();
        if (cleanMergeList.includes(activeCurrent)) {
          setTableNumber(cleanPrimary);
        }
      }

      // Record undo action until bill is paid
      setUndoAction({
        type: 'merge',
        from: cleanMergeList[0] || cleanMergeList,
        to: cleanPrimary,
        timestamp: Date.now()
      });
      toast.success(`Merged Table ${cleanMergeList.join(', ')} into Table ${cleanPrimary}. (Ctrl+Z to undo)`);
    } catch (err) {
      console.error('Merge tables error:', err);
      toast.error('Failed to merge tables: ' + (err.response?.data?.error || err.message));
    }
  };

  // Move Table Handler (Transfers all active orders from source table to empty target table)
  const handleMoveTable = async (sourceTbl, targetTbl, isUndo = false) => {
    if (!sourceTbl) {
      toast.error('Please select a source table');
      return;
    }
    if (!targetTbl) {
      toast.error('Please select an empty destination table');
      return;
    }
    const cleanSource = String(sourceTbl).replace(/^Table\s*/i, '').trim();
    const cleanTarget = String(targetTbl).replace(/^Table\s*/i, '').trim();

    if (cleanSource.toLowerCase() === cleanTarget.toLowerCase()) {
      toast.error('Source and destination cannot be the same');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API}/tables/move`, {
        sourceTable: cleanSource,
        targetTable: cleanTarget
      }, {
        headers: token ? { 'x-auth-token': token } : {}
      });

      // Immediate local state update in POSTerminal
      setDbTables(prev => prev.map(t => {
        const tNum = String(t.tableNumber || '').replace(/^Table\s*/i, '').trim();
        if (tNum.toLowerCase() === cleanSource.toLowerCase()) {
          return {
            ...t,
            status: 'available',
            mergedInto: null,
            mergedAt: null,
            currentOrder: null
          };
        }
        if (tNum.toLowerCase() === cleanTarget.toLowerCase()) {
          return {
            ...t,
            status: 'occupied'
          };
        }
        return t;
      }));

      // Re-fetch tables in POSTerminal silently (without full skeleton unmount/page jump)
      fetchDbTables(true);

      // Propagate to parent AdminPanel
      if (onOrderPlaced) {
        onOrderPlaced({
          _refreshAll: true,
          _refreshTables: true,
          action: 'move',
          sourceTable: cleanSource,
          targetTable: cleanTarget
        });
      }
      if (onRefreshTables) onRefreshTables();
      if (onRefreshOrders) onRefreshOrders();

      // If viewing the moved source table in terminal, auto-switch to destination table
      if (viewMode === 'terminal') {
        const activeCurrent = String(tableNumber || '').replace(/^Table\s*/i, '').trim();
        if (activeCurrent.toLowerCase() === cleanSource.toLowerCase()) {
          setTableNumber(cleanTarget);
        }
      }

      setShowMoveModal(false);
      setMoveSourceTable('');
      setMoveTargetTable('');

      // Record undo action until bill is paid (unless this execution is already an undo)
      if (!isUndo) {
        setUndoAction({
          type: 'move',
          from: cleanSource,
          to: cleanTarget,
          timestamp: Date.now()
        });
        toast.success(`Moved Table ${formatTableOnlyNumber(cleanSource)} to Table ${formatTableOnlyNumber(cleanTarget)}. (Ctrl+Z to undo)`);
      }
    } catch (err) {
      console.error('Move table error:', err);
      toast.error('Failed to move table: ' + (err.response?.data?.error || err.message));
    }
  };

  // Undo Handler: Allows undoing Move or Merge operations until bill payment is settled (via Ctrl + Z)
  const handleUndo = async () => {
    const action = undoActionRef.current;
    if (!action) return;
    const { type, from, to } = action;

    // Verify whether the destination table has been paid or settled
    const targetOrders = activeOrdersByTable[String(to).trim()] || activeOrdersByTable[String(to).replace(/^Table\s*/i, '').trim()] || [];
    const isPaid = targetOrders.length > 0 && targetOrders.every(o => o.paymentStatus === 'paid');
    if (isPaid) {
      toast.error(`Cannot undo: Table ${formatTableOnlyNumber(to)} has already been settled / paid.`);
      setUndoAction(null);
      undoActionRef.current = null;
      return;
    }

    try {
      if (type === 'move') {
        // Reverse Move: move back from target to original source
        await handleMoveTable(to, from, true);
        toast.success(`Undone (Ctrl+Z): Restored Table ${formatTableOnlyNumber(from)}!`);
      } else if (type === 'merge') {
        // Reverse Merge: demerge original table from target
        await handleDemergeTable(to, from);
        toast.success(`Undone (Ctrl+Z): Unmerged Table ${formatTableOnlyNumber(from)} from Table ${formatTableOnlyNumber(to)}!`);
      }
      setUndoAction(null);
      undoActionRef.current = null;
    } catch (err) {
      console.error('Undo error:', err);
      toast.error('Failed to undo action: ' + (err.message || 'Error'));
    }
  };

  // Windows-style Ctrl+Z (or Cmd+Z) keyboard shortcut for undoing table moves/merges
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        // If user is currently typing in an input, textarea, or contentEditable, respect native text undo
        const target = e.target;
        const tag = (target && target.tagName) ? target.tagName.toUpperCase() : '';
        if (target && (target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) {
          return;
        }

        if (undoActionRef.current) {
          e.preventDefault();
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Demerge Table Handler (Restores table in Database & Instant UI Synchronisation)
  const handleDemergeTable = async (primaryTbl, tableToDemerge) => {
    const token = localStorage.getItem('token');
    const cleanPrimary = String(primaryTbl).replace(/^Table\s*/i, '').trim();
    const cleanDemerge = String(tableToDemerge).replace(/^Table\s*/i, '').trim();

    try {
      const res = await axios.post(`${API}/tables/demerge`, {
        primaryTable: cleanPrimary,
        tableToDemerge: cleanDemerge
      }, {
        headers: token ? { 'x-auth-token': token } : {}
      });
      setMergedTables(prev => prev.filter(t => String(t).replace(/^Table\s*/i, '').trim() !== cleanDemerge));

      // Immediate local state update in POSTerminal
      setDbTables(prev => prev.map(t => {
        const tNum = String(t.tableNumber || '').replace(/^Table\s*/i, '').trim();
        if (tNum === cleanPrimary) {
          return {
            ...t,
            mergedWith: Array.isArray(t.mergedWith) ? t.mergedWith.filter(m => String(m).replace(/^Table\s*/i, '').trim() !== cleanDemerge) : []
          };
        }
        if (tNum === cleanDemerge) {
          return {
            ...t,
            status: 'available',
            mergedInto: null,
            mergedAt: null
          };
        }
        return t;
      }));

      fetchDbTables(true);
      if (onOrderPlaced) {
        onOrderPlaced({
          _refreshAll: true,
          _refreshTables: true,
          action: 'demerge',
          primaryTable: cleanPrimary,
          demergedTable: cleanDemerge
        });
      }
      if (onRefreshTables) onRefreshTables();
      if (onRefreshOrders) onRefreshOrders();
    } catch (err) {
      console.error('Demerge table error:', err);
      toast.error('Failed to demerge table: ' + (err.response?.data?.error || err.message));
    }
  };

  // Emergency Open Item Quick Puncher (Item name & price are mandatory)
  const handleAddOpenItem = async (e) => {
    e?.preventDefault();
    const finalName = openItemForm.name.trim();
    if (!finalName) {
      toast.error('Item name is mandatory');
      return;
    }
    const priceNum = Number(openItemForm.price);
    if (openItemForm.price === '' || isNaN(priceNum) || priceNum < 0) {
      toast.error('Valid price is mandatory');
      return;
    }
    const qty = 1;

    const customId = 'open-' + Date.now();
    const newItem = {
      id: customId,
      itemId: customId,
      _id: customId,
      name: finalName,
      price: priceNum,
      quantity: qty,
      category: '⚡ Open Item',
      isOpenItem: true,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=60'
    };

    setCart(prev => {
      const existing = prev.find(it => it.name.toLowerCase() === newItem.name.toLowerCase() && it.price === newItem.price);
      if (existing) {
        return prev.map(it => it.id === existing.id ? { ...it, quantity: it.quantity + qty } : it);
      }
      return [...prev, newItem];
    });


    if (openItemForm.saveToMenu) {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API}/menu`, {
          name: finalName,
          price: priceNum,
          category: 'Open Items',
          isOpenMenu: true,
          isPosOnly: true,
          isVeg: true,
          image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=60'
        }, {
          headers: token ? { 'x-auth-token': token, 'Authorization': `Bearer ${token}` } : {}
        });
      } catch (err) {
        console.warn('Could not persist open item to menu:', err.message);
      }
    }

    setOpenItemForm({ name: '', price: '', quantity: 1, notes: '', saveToMenu: false });
    setShowOpenItemModal(false);
  };

  // Active orders currently belonging to the selected table + any merged tables in POS
  const currentTableOrders = useMemo(() => {
    if (isCounterBillingOnly && tableNumber === 'Walk-in') return []; // Quick Counter billing handles only the current cart transaction
    if (!tableNumber) return [];
    const allTableNums = [tableNumber, ...mergedTables];
    const combinedOrders = [];
    allTableNums.forEach((t) => {
      const tStr = String(t).trim();
      const numOnly = tStr.replace(/[^0-9]/g, '') || tStr;
      const ords = activeOrdersByTable[tStr]
        || activeOrdersByTable[tStr.toLowerCase()]
        || activeOrdersByTable[tStr.replace(/\s+/g, '')]
        || activeOrdersByTable[tStr.replace(/\s+/g, '').toLowerCase()]
        || activeOrdersByTable[numOnly]
        || activeOrdersByTable[numOnly.toLowerCase()]
        || activeOrdersByTable[`Table ${numOnly}`]
        || [];
      ords.forEach(o => {
        if (!combinedOrders.some(existing => existing._id === o._id)) {
          combinedOrders.push(o);
        }
      });
    });
    return combinedOrders;
  }, [tableNumber, mergedTables, activeOrdersByTable, isCounterBillingOnly]);

  // Format money helper to eliminate floating point precision junk (e.g. 1739.8500000000001 -> 1,739.85)
  const formatAmount = (val) => {
    const num = Number(val) || 0;
    const rounded = Math.round(num * 100) / 100;
    return rounded.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Running orders total
  const runningOrdersTotal = useMemo(() => {
    const sum = currentTableOrders.reduce((acc, o) => {
      const itemsSum = Array.isArray(o.items) && o.items.length > 0
        ? o.items.reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0)
        : null;
      const discount = Number(o.discountAmount) || 0;
      const tax = Number(o.taxAmount) || 0;
      const orderTotal = itemsSum !== null ? Math.max(0, itemsSum - discount + tax) : (Number(o.total || o.totalAmount) || 0);
      return acc + orderTotal;
    }, 0);
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
        const ordItemsSum = Array.isArray(ord.items) && ord.items.length > 0
          ? ord.items.reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0)
          : (Number(ord.total || ord.totalAmount) || 0);
        const discount = Number(ord.discountAmount) || 0;
        const tax = Number(ord.taxAmount) || 0;
        sum += Math.max(0, ordItemsSum - discount + tax);
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

  // Helper to merge open menu category variations (e.g. Open_menu, open items -> Open Items)
  const normalizeOpenCategory = (cat, isOpenMode = false) => {
    if (!cat) return isOpenMode ? 'Open Items' : 'main-courses';
    const s = String(cat).trim();
    const l = s.toLowerCase();
    if (l === 'open items' || l === 'open_menu' || l === 'open menu' || l === 'open item' || l === 'open_items' || l === '⚡ open item' || l === 'open') {
      return 'Open Items';
    }
    return s;
  };

  // Categories list for POS Menu (Strictly user-created categories only)
  const categories = useMemo(() => {
    const rawUserCats = (Array.isArray(passedCategories) && passedCategories.length > 0)
      ? passedCategories
      : (tenantInfo?.settings?.categories || []);

    const userCats = rawUserCats
      .filter(c => c && (c.id || c.name))
      .map(c => typeof c === 'object' ? (c.id || c.name) : c)
      .filter(cId => {
        const l = String(cId).toLowerCase();
        return l !== 'all' && l !== 'uncategorized';
      });

    if (isOpenItemModeEnabled) {
      // In Open Items mode: show All and Open Items
      const openCat = userCats.find(c => {
        const l = String(c).toLowerCase();
        return l === 'open-items' || l === 'open items' || l === 'open_menu' || l === 'open item';
      });
      return openCat ? ['all', openCat] : ['all'];
    }

    // In normal mode: exclude Open Items from normal category list
    const normalCats = userCats.filter(c => {
      const l = String(c).toLowerCase();
      return l !== 'open-items' && l !== 'open items' && l !== 'open_menu' && l !== 'open item' && l !== '⚡ open item';
    });

    return ['all', ...normalCats];
  }, [passedCategories, tenantInfo?.settings?.categories, isOpenItemModeEnabled]);

  // Dish counts per category for the left category sidebar
  const categoryDishCounts = useMemo(() => {
    const targetItems = menuItems.filter(item => {
      const isOpen = Boolean(
        item.isOpenMenu ||
        item.isPosOnly ||
        item.isOpenItem ||
        String(item.category || '').toLowerCase() === 'open items' ||
        String(item.category || '').toLowerCase() === 'open_menu' ||
        String(item.category || '').toLowerCase() === '⚡ open item'
      );
      return isOpenItemModeEnabled ? isOpen : !isOpen;
    });

    const map = { all: targetItems.length };
    categories.forEach(cat => {
      if (cat === 'all') return;
      const catStr = String(cat).toLowerCase().trim();
      const count = targetItems.filter(item => {
        const itemCat = String(item.category || '').toLowerCase().trim();
        const itemCatId = String(item.categoryId || '').toLowerCase().trim();
        return itemCat === catStr || itemCatId === catStr || itemCat.replace(/\s+/g, '-') === catStr;
      }).length;
      map[cat] = count;
    });
    return map;
  }, [menuItems, isOpenItemModeEnabled, categories]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const isOpen = Boolean(
        item.isOpenMenu ||
        item.isPosOnly ||
        item.isOpenItem ||
        String(item.category || '').toLowerCase() === 'open items' ||
        String(item.category || '').toLowerCase() === 'open_menu' ||
        String(item.category || '').toLowerCase() === '⚡ open item'
      );

      // Crucial: When Open Item mode is toggled ON, ONLY show Open Menu dishes!
      // When Open Item mode is toggled OFF, ONLY show regular normal dishes!
      if (isOpenItemModeEnabled) {
        if (!isOpen) return false;
      } else {
        if (isOpen) return false;
      }

      let matchesCat = false;
      if (selectedCategory === 'all') {
        matchesCat = true;
      } else {
        const targetCat = String(selectedCategory).toLowerCase().trim();
        const itemCat = String(item.category || '').toLowerCase().trim();
        const itemCatId = String(item.categoryId || '').toLowerCase().trim();
        matchesCat = itemCat === targetCat || itemCatId === targetCat || itemCat.replace(/\s+/g, '-') === targetCat;
      }
      const matchesSearch = !dishSearch || item.name.toLowerCase().includes(dishSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [menuItems, selectedCategory, dishSearch, isOpenItemModeEnabled]);

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
          addons: [],
          isOpenItem: Boolean(item.isOpenMenu || item.isPosOnly || item.isOpenItem || item.category === 'Open Items')
        }]);
      }
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

    const currentQty = Number(newItems[itemIndex].quantity) || 1;
    const updatedQty = currentQty + delta;

    if (updatedQty <= 0) {
      newItems.splice(itemIndex, 1);
    } else {
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        quantity: updatedQty
      };
    }

    const newTotal = newItems.reduce((sum, it) => sum + ((Number(it.price) || 0) * (it.quantity || 1)), 0);
    const token = localStorage.getItem('token');

    try {
      if (newItems.length === 0) {
        await axios.delete(`${API}/orders/${orderId}`, {
          headers: token ? { 'x-auth-token': token } : {}
        });
      } else {
        const res = await axios.put(`${API}/orders/${orderId}`, {
          items: newItems,
          total: newTotal,
          totalAmount: newTotal,
          subTotal: newTotal
        }, {
          headers: token ? { 'x-auth-token': token } : {}
        });
      }
      if (onRefreshOrders) onRefreshOrders();
      if (onOrderPlaced) onOrderPlaced({ tableNumber, _refreshAll: true });
      if (onOrderCreated) onOrderCreated({ tableNumber, _refreshAll: true });
    } catch (err) {
      console.error('Update item error:', err);
      toast.error('Failed to update order item');
    }
  };

  // Remove existing unpaid order item directly
  const handleRemoveExistingOrderItem = async (orderId, itemIndex) => {
    const order = currentTableOrders.find(o => o._id === orderId);
    if (!order) return;
    const newItems = [...(order.items || [])];
    if (!newItems[itemIndex]) return;

    const removedItemName = newItems[itemIndex].name || 'Item';
    newItems.splice(itemIndex, 1);
    const newTotal = newItems.reduce((sum, it) => sum + ((Number(it.price) || 0) * (it.quantity || 1)), 0);
    const token = localStorage.getItem('token');

    try {
      if (newItems.length === 0) {
        await axios.delete(`${API}/orders/${orderId}`, {
          headers: token ? { 'x-auth-token': token } : {}
        });
      } else {
        await axios.put(`${API}/orders/${orderId}`, {
          items: newItems,
          total: newTotal,
          totalAmount: newTotal,
          subTotal: newTotal
        }, {
          headers: token ? { 'x-auth-token': token } : {}
        });
      }
      if (onRefreshOrders) onRefreshOrders();
      if (onOrderPlaced) onOrderPlaced({ tableNumber, _refreshAll: true });
      if (onOrderCreated) onOrderCreated({ tableNumber, _refreshAll: true });
    } catch (err) {
      console.error('Remove item error:', err);
      toast.error('Failed to remove item');
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
      paymentMethod: null, // Payment method is null while order is unpaid/pending; finalized only upon settlement
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
        specialNotes: it.specialNotes || it.notes || '',
        isOpenItem: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
        isCustom: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
        itemStatus: 'preparing',
        isPaid: false
      })),
      totalAmount: draftCartTotal
    };

    try {
      if (currentTableOrders.length > 0) {
        const unpaidOrder = currentTableOrders.find(o => o.paymentStatus !== 'paid' && o.status !== 'completed' && o.status !== 'cancelled') || currentTableOrders[currentTableOrders.length - 1];
        const itemsToAppend = cart.map(it => ({
          id: it.id,
          itemId: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          variant: it.variant ? it.variant : null,
          addons: (it.addons || []),
          specialNotes: it.specialNotes || it.notes || '',
          isOpenItem: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
          isCustom: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
          itemStatus: 'preparing',
          isPaid: false
        }));

        const res = await axios.post(`${API}/orders/${unpaidOrder._id}/append-items`, { items: itemsToAppend }, {
          headers: token ? { 'x-auth-token': token } : {}
        });

        clearDraftForTable(tableNumber);
        setCart([]);
        setDishSearch('');
        handleReturnToTables();
        if (onOrderPlaced) onOrderPlaced(res.data.order || res.data);
        if (onOrderCreated) onOrderCreated(res.data.order || res.data);
      } else {
        const res = await axios.post(`${API}/orders`, orderPayload, {
          headers: token ? { 'x-auth-token': token } : {}
        });

        clearDraftForTable(tableNumber);
        setCart([]);
        setDishSearch('');
        handleReturnToTables();
        if (onOrderPlaced) onOrderPlaced(res.data);
        if (onOrderCreated) onOrderCreated(res.data);
      }
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
      paymentMethod: null, // Payment method is null while order is unpaid/pending; finalized only upon settlement
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
        specialNotes: it.specialNotes || it.notes || '',
        isOpenItem: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
        isCustom: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
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
          specialNotes: it.specialNotes || it.notes || '',
          isOpenItem: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
          isCustom: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
          isDirect: true,
          itemStatus: 'served',
          isPaid: false
        }));

        const res = await axios.post(`${API}/orders/${lastOrder._id}/append-items`, { items: itemsToAppend }, {
          headers: token ? { 'x-auth-token': token } : {}
        });

        clearDraftForTable(tableNumber);
        setCart([]);
        setDishSearch('');
        handleReturnToTables();
        if (onOrderPlaced) onOrderPlaced(res.data.order || res.data);
        if (onOrderCreated) onOrderCreated(res.data.order || res.data);
      } else {
        const res = await axios.post(`${API}/orders`, orderPayload, {
          headers: token ? { 'x-auth-token': token } : {}
        });

        clearDraftForTable(tableNumber);
        setCart([]);
        setDishSearch('');
        handleReturnToTables();
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
      if (isCounterBillingOnly && tableNumber === 'Walk-in') {
        // Quick Counter 1-Step Checkout: Create completed & paid order immediately!
        const tenderAmount = draftCartTotal;
        const effectiveMethod = customMethod || (payItemsMethod === 'Settlement' ? (settlementSubMethod || 'Cash') : payItemsMethod);
        const finalPaid = customPayable !== null ? Number(customPayable) : (actualAmountReceived !== '' && !isNaN(Number(actualAmountReceived)) ? Number(actualAmountReceived) : tenderAmount);
        const finalDiscount = customDiscount > 0 ? Number(customDiscount) : Math.max(0, tenderAmount - finalPaid);

        const effName = customerName.trim() || 'Walk-in Guest';
        const effPhone = customerPhone.trim();

        const orderPayload = {
          tenantId: effectiveTenantId,
          tableNumber: 'Walk-in',
          orderType: 'takeaway',
          customerName: effName,
          customerPhone: effPhone,
          customerDetails: {
            name: effName,
            phone: effPhone
          },
          paymentMethod: effectiveMethod,
          isDirect: true,
          status: 'completed',
          paymentStatus: 'paid',
          settledAmount: finalPaid,
          discountAmount: finalDiscount,
          discountReason: settlementDiscountReason || 'Quick Counter Settlement',
          items: cart.map(it => ({
            id: it.id,
            itemId: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            variant: it.variant || null,
            addons: it.addons || [],
            isDirect: true,
            itemStatus: 'served',
            isPaid: true
          })),
          totalAmount: finalPaid
        };

        const res = await axios.post(`${API}/orders`, orderPayload, {
          headers: token ? { 'x-auth-token': token } : {}
        });

        const createdOrder = res.data?.order || res.data;
        const discountMsg = finalDiscount > 0 ? ` (₹${formatAmount(finalDiscount)} discount applied)` : '';

        // Auto print bill
        try {
          printOrderBill({
            ...createdOrder,
            items: cart,
            totalAmount: finalPaid
          }, tenantInfo?.name);
        } catch (printErr) {
          console.warn('Print bill trigger:', printErr);
        }

        // Immediately reset POS for the NEXT customer!
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setShowPayItemsModal(false);
        setActualAmountReceived('');
        setSettlementDiscount('');
        setCashTenderGiven('');

        if (onOrderPlaced) onOrderPlaced(createdOrder);
        if (onOrderCreated) onOrderCreated(createdOrder);
        return;
      }

      // If draft items exist in cart on this table, persist them first so they aren't lost
      if (cart.length > 0 && tableNumber !== 'Walk-in') {
        const orderPayload = {
          tenantId: effectiveTenantId,
          tableNumber: String(tableNumber),
          orderType: 'dine_in',
          customerName: customerName.trim() || 'Guest',
          customerPhone: customerPhone.trim(),
          customerDetails: {
            name: customerName.trim() || 'Guest',
            phone: customerPhone.trim()
          },
          paymentMethod: customMethod || (payItemsMethod === 'Settlement' ? (settlementSubMethod || 'Cash') : payItemsMethod) || 'Cash',
          paymentStatus: 'paid',
          status: 'served',
          isDirect: true,
          items: cart.map(it => ({
            id: it.id,
            itemId: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            variant: it.variant || null,
            addons: (it.addons || []),
            specialNotes: it.specialNotes || it.notes || '',
            isOpenItem: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
            isCustom: Boolean(it.isOpenItem || String(it.id || '').startsWith('open')),
            isDirect: true,
            itemStatus: 'served',
            isPaid: true
          })),
          subTotal: draftCartTotal,
          total: draftCartTotal,
          totalAmount: draftCartTotal
        };
        const res = await axios.post(`${API}/orders`, orderPayload, {
          headers: token ? { 'x-auth-token': token } : {}
        });
        if (onOrderPlaced) onOrderPlaced(res.data?.order || res.data);
        if (onOrderCreated) onOrderCreated(res.data?.order || res.data);
        setCart([]);
      }

      const itemsToPay = selectedItemsSummary.itemsList.map(it => ({
        orderId: it.orderId,
        itemIndex: it.itemIndex
      }));

      const isFullTable = itemsToPay.length === 0 || selectedItemsSummary.count === 0 || selectedItemsSummary.count === currentTableOrders.flatMap(o => (o.items || []).filter(it => !it.isPaid)).length;
      const allSettleTables = [String(tableNumber).trim(), ...mergedTables.map(t => String(t).trim())];

      const tenderAmount = selectedItemsSummary.count > 0 ? selectedItemsSummary.total : (balanceDue > 0 ? balanceDue : draftCartTotal);
      const effectiveMethod = customMethod || (payItemsMethod === 'Settlement' ? (settlementSubMethod || 'Cash') : payItemsMethod);
      const finalPaid = customPayable !== null ? Number(customPayable) : (actualAmountReceived !== '' && !isNaN(Number(actualAmountReceived)) ? Number(actualAmountReceived) : tenderAmount);
      const finalDiscount = customDiscount > 0 ? Number(customDiscount) : Math.max(0, tenderAmount - finalPaid);

      if (isFullTable && tableNumber !== 'Walk-in') {
        // Table payment settlement: mark orders as paid with concession discount, but DO NOT clear table yet!
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
            originalTotal: grandTotal,
            freeTable: false // DO NOT FREE TABLE ON PAYMENT
          },
          { headers: token ? { 'x-auth-token': token } : {} }
        );

        const discountMsg = finalDiscount > 0 ? ` (₹${formatAmount(finalDiscount)} discount applied)` : '';
        setPaymentMethod(effectiveMethod);
        setPayItemsMethod(effectiveMethod);
        setActualAmountReceived('');
        setSettlementDiscount('');
        setCashTenderGiven('');
        setSelectedItemKeys(new Set());
        setShowPayItemsModal(false);

        allSettleTables.forEach(tNum => {
          if (onOrderPlaced) onOrderPlaced({ tableNumber: tNum, status: 'billed', _refreshAll: true });
          if (onOrderCreated) onOrderCreated({ tableNumber: tNum, status: 'billed', _refreshAll: true });
        });

        // Update local table status to 'billed' so tile turns soft-green / Billed
        setDbTables(prev => prev.map(t =>
          allSettleTables.some(st => String(t.tableNumber).trim().toLowerCase() === st.toLowerCase())
            ? { ...t, status: 'billed' }
            : t
        ));

        // Keep cashier in POS view for this table so they see all paid items, zero balance due, and the green 'Clear Table (Free)' button!
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
      // Table is already 100% paid: clear immediately with the established payment method!
      const activePaidMethod = currentTableOrders.find(o => o.paymentMethod)?.paymentMethod || paymentMethod || 'Cash';
      handleSettleBill(activePaidMethod);
    }
  };

  // Quick Settle & Clear Table directly from floor view
  const handleQuickSettleTable = async (tNum) => {
    const token = localStorage.getItem('token');
    const effectiveTenantId = tenantId || tenantInfo?._id || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

    const targetOrders = activeOrdersByTable[String(tNum).trim()] || activeOrdersByTable[String(tNum).replace(/^Table\s*/i, '').trim()] || [];
    const existingMethod = targetOrders.find(o => o.paymentMethod)?.paymentMethod || 'Cash';

    try {
      await axios.put(
        `${API}/orders/table/${encodeURIComponent(String(tNum).trim())}/settle`,
        {
          paymentMethod: existingMethod,
          paymentStatus: 'paid',
          tenantId: effectiveTenantId,
          freeTable: true
        },
        { headers: token ? { 'x-auth-token': token } : {} }
      );
      // Auto-remove any temporary table or mark permanent table available in dbTables immediately
      if (targetOrders.length > 0) {
        setLastClearedBill({
          orderNumber: targetOrders[0]?.orderNumber || `TBL-${tNum}`,
          tableNumber: `Table ${tNum}`,
          customerName: targetOrders[0]?.customerName || 'Guest',
          customerPhone: targetOrders[0]?.customerPhone || '',
          items: targetOrders.flatMap(o => o.items || []),
          subTotal: targetOrders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0),
          totalAmount: targetOrders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0),
          paymentMethod: existingMethod,
          paymentStatus: 'PAID',
          settledAt: new Date()
        });
      }
      setDbTables(prev => prev
        .filter(t => !(t.isTemporary && String(t.tableNumber).trim().toLowerCase() === String(tNum).trim().toLowerCase()))
        .map(t => String(t.tableNumber).trim().toLowerCase() === String(tNum).trim().toLowerCase() ? { ...t, status: 'available' } : t)
      );
      clearDraftForTable(tNum);
      if (tableNumber && String(tableNumber).trim().toLowerCase() === String(tNum).trim().toLowerCase()) {
        clearDraftForTable(tableNumber);
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setSelectedItemKeys(new Set());
        handleReturnToTables();
      }
      if (onOrderPlaced) onOrderPlaced({ tableNumber: tNum, status: 'completed', _refreshAll: true });
      if (onOrderCreated) onOrderCreated({ tableNumber: tNum, status: 'completed', _refreshAll: true });
      if (onSettleTable) onSettleTable(tNum);
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
            originalTotal: grandTotal,
            freeTable: true
          },
          { headers: token ? { 'x-auth-token': token } : {} }
        );
      }

      const tableLabel = allSettleTables.length > 1 ? `Tables ${allSettleTables.join(', ')}` : `Table ${tableNumber}`;
      setLastClearedBill({
        orderNumber: currentTableOrders[0]?.orderNumber || `TBL-${tableNumber}`,
        tableNumber: tableLabel,
        customerName: customerName.trim() || currentTableOrders[0]?.customerName || 'Guest',
        customerPhone: customerPhone.trim() || currentTableOrders[0]?.customerPhone || '',
        items: [
          ...currentTableOrders.flatMap(o => o.items || []),
          ...cart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity, variant: c.variant }))
        ],
        subTotal: grandTotal,
        totalAmount: finalSettledAmount,
        paymentMethod: settleMethod,
        paymentStatus: 'PAID',
        settledAt: new Date()
      });
      // Auto-remove any settled temporary table and reset permanent tables to available in dbTables state
      setDbTables(prev => prev
        .filter(t => !(t.isTemporary && allSettleTables.some(st => String(t.tableNumber).trim().toLowerCase() === st.toLowerCase())))
        .map(t => allSettleTables.some(st => String(t.tableNumber).trim().toLowerCase() === st.toLowerCase()) ? { ...t, status: 'available' } : t)
      );
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setMergedTables([]);
      setActualAmountReceived('');
      setSelectedItemKeys(new Set());
      setShowSplitModal(false);
      setShowClearConfirmModal(false);

      allSettleTables.forEach(tNum => {
        clearDraftForTable(tNum);
        if (onOrderPlaced) onOrderPlaced({ tableNumber: tNum, status: 'completed', _refreshAll: true });
        if (onOrderCreated) onOrderCreated({ tableNumber: tNum, status: 'completed', _refreshAll: true });
        if (onSettleTable) onSettleTable(tNum);
      });
      clearDraftForTable(tableNumber);

      // Return to table matrix view (or stay in terminal for counter billing)
      handleReturnToTables();
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
        clearDraftForTable(tNum);
        if (onOrderPlaced) onOrderPlaced({ tableNumber: tNum, status: 'completed', _refreshAll: true });
        if (onOrderCreated) onOrderCreated({ tableNumber: tNum, status: 'completed', _refreshAll: true });
        if (onSettleTable) onSettleTable(tNum);
      });
      clearDraftForTable(tableNumber);

      // Crucial: Clear view and return to tables matrix (or stay in terminal for counter billing)
      handleReturnToTables();
    } catch (err) {
      console.error('Khata settlement error:', err);
      toast.error('Failed to record Khata: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmittingKhata(false);
    }
  };

  // Dedicated helper to print pro-forma / estimate / draft bill before payment
  const handlePrintDraftBill = (overrideTotal) => {
    const activeItems = (currentTableOrders || []).flatMap(o => o.items || []);
    const draftItems = (cart || []).map(c => ({
      name: c.name,
      price: c.price,
      quantity: c.quantity,
      variant: c.variant,
      addons: c.addons,
      modifier: c.variant?.name || ''
    }));

    const allItems = [...activeItems, ...draftItems];
    if (allItems.length === 0) {
      toast.error('Cart is empty. Add items to print bill.');
      return;
    }

    const calculatedSubtotal = allItems.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    const finalAmount = (typeof overrideTotal === 'number' && overrideTotal > 0)
      ? overrideTotal
      : (draftCartTotal > 0 ? draftCartTotal : grandTotal || calculatedSubtotal);

    const billOrder = {
      orderNumber: currentTableOrders[0]?.orderNumber || `EST-${Date.now().toString().slice(-4)}`,
      tableNumber: tableNumber || 'Walk-in',
      orderType: (tableNumber && tableNumber !== 'Walk-in') ? 'dine_in' : 'takeaway',
      customerName: customerName || currentTableOrders[0]?.customerName || 'Walk-in Guest',
      customerPhone: customerPhone || currentTableOrders[0]?.customerPhone || '',
      items: allItems,
      subTotal: calculatedSubtotal,
      totalAmount: finalAmount,
      total: finalAmount,
      discountAmount: Number(settlementDiscount) || 0,
      paymentMethod: settlementSubMethod || paymentMethod || 'Cash',
      paymentStatus: 'ESTIMATE / UNPAID',
      createdAt: new Date().toISOString()
    };

    try {
      printOrderBill(billOrder, tenantInfo?.name);
      toast.success('Bill receipt sent to printer!');
    } catch (err) {
      console.warn('Print bill error:', err);
      toast.error('Could not open print window.');
    }
  };

  // Quick Thermal Print Receipt simulation
  const handlePrintReceipt = (e, tblNum, amount) => {
    if (e) e.stopPropagation();
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
    }
  };

  // Create Temporary Table / Open Tab
  const handleCreateTempTable = async (openImmediately = true) => {
    const cleanName = tempCustomerName.trim();
    if (!cleanName) {
      toast.error('Please enter customer or tab name (e.g. Deepak)');
      return;
    }

    setIsCreatingTempTable(true);
    const token = localStorage.getItem('token');
    const effectiveTenantId = tenantId || tenantInfo?._id || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

    try {
      const res = await axios.post(
        `${API}/tables/temp`,
        {
          customerName: cleanName,
          customerPhone: tempCustomerPhone.trim(),
          notes: tempNotes.trim(),
          tenantId: effectiveTenantId
        },
        { headers: token ? { 'x-auth-token': token } : {} }
      );

      const createdTable = res.data;
      setDbTables(prev => {
        const filtered = prev.filter(t => t._id !== createdTable._id && t.tableNumber !== createdTable.tableNumber);
        return [createdTable, ...filtered];
      });

      setShowTempTableModal(false);
      setTempCustomerName('');
      setTempCustomerPhone('');
      setTempNotes('');

      if (openImmediately) {
        handleOpenTableInPOS(createdTable.tableNumber);
        if (cleanName) setCustomerName(cleanName);
        if (tempCustomerPhone) setCustomerPhone(tempCustomerPhone.trim());
      }
    } catch (err) {
      console.error('Create temp table error:', err);
      // Fallback: If network or route issue, create locally so service is never blocked
      const fallbackTableNum = `Temp - ${cleanName}`;
      const localTable = {
        _id: `temp_${Date.now()}`,
        tableNumber: fallbackTableNum,
        customerName: cleanName,
        customerPhone: tempCustomerPhone.trim(),
        section: 'Temporary Tables',
        isTemporary: true,
        seatingCapacity: 4,
        status: 'available'
      };
      setDbTables(prev => [localTable, ...prev]);
      setShowTempTableModal(false);
      setTempCustomerName('');
      setTempCustomerPhone('');
      setTempNotes('');

      if (openImmediately) {
        handleOpenTableInPOS(fallbackTableNum);
        if (cleanName) setCustomerName(cleanName);
        if (tempCustomerPhone) setCustomerPhone(tempCustomerPhone.trim());
      }
    } finally {
      setIsCreatingTempTable(false);
    }
  };

  // Delete/Dismiss empty temporary table
  const handleDeleteTempTable = async (tableObj, e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      if (tableObj._id && !tableObj._id.startsWith('temp_') && !tableObj._id.startsWith('auto_')) {
        await axios.delete(`${API}/tables/${tableObj._id}`, {
          headers: token ? { 'x-auth-token': token } : {}
        });
      }
      setDbTables(prev => prev.filter(t => t._id !== tableObj._id && t.tableNumber !== tableObj.tableNumber));
    } catch (err) {
      console.error('Delete temp table error:', err);
      setDbTables(prev => prev.filter(t => t._id !== tableObj._id && t.tableNumber !== tableObj.tableNumber));
    }
  };

  return (
    <div className={styles.terminalWrapper}>

      {/* ========================================================= */}
      {/* 1. FLOOR & TABLES MATRIX VIEW (Dine-in only)               */}
      {/* ========================================================= */}
      {!isCounterBillingOnly && viewMode === 'tables' && (
        <div className={styles.floorContainer}>

          {/* Streamlined Top Control Toolbar (Pinned Top Header - Never Scrolls Away or Clips) */}
          <div className={styles.floorTopBarClean}>
            {/* Quick Status Filter Tabs (Segmented Control) */}
            <div className={styles.floorTabsSegment} style={{ flexShrink: 0, padding: '3px', gap: '2px' }}>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'all' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('all')}
                style={{ padding: '4px 9px', fontSize: '0.74rem' }}
              >
                All ({isLoadingTables ? '...' : tableStats.total})
              </button>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'free' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('free')}
                style={{ padding: '4px 8px', fontSize: '0.74rem' }}
              >
                <span className={styles.dotFree}>●</span> Free ({isLoadingTables ? '...' : tableStats.free})
              </button>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'occupied' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('occupied')}
                style={{ padding: '4px 8px', fontSize: '0.74rem' }}
              >
                <span className={styles.dotOccupied}>●</span> Booked ({isLoadingTables ? '...' : tableStats.occupied})
              </button>
              <button
                type="button"
                className={`${styles.floorTabBtn} ${tableStatusFilter === 'paid' ? styles.floorTabBtnActive : ''}`}
                onClick={() => setTableStatusFilter('paid')}
                style={{ padding: '4px 8px', fontSize: '0.74rem' }}
              >
                <span className={styles.dotPaid}>●</span> Paid ({isLoadingTables ? '...' : tableStats.paid})
              </button>
            </div>

            {/* Right: Temp Table Button, Move Table, Merge Tables, Drag Mode Toggle Switch & Search Box */}
            <div className={styles.floorRightControls} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {hasTableSuite && (
                <button
                  type="button"
                  onClick={() => setShowTempTableModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.38rem 0.65rem',
                    borderRadius: '7px',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(124, 58, 237, 0.25)',
                    whiteSpace: 'nowrap'
                  }}
                  title="Create Temporary Tab"
                >
                  <span>+ Temp Tab</span>
                </button>
              )}

              {/* Move Table Button */}
              <button
                type="button"
                onClick={() => {
                  setMoveSourceTable('');
                  setMoveTargetTable('');
                  setShowMoveModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0.38rem 0.65rem',
                  borderRadius: '7px',
                  background: '#ffffff',
                  color: '#0284c7',
                  border: '1.5px solid #bae6fd',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(2, 132, 199, 0.08)',
                  whiteSpace: 'nowrap'
                }}
                title="Move Table: Transfer active orders from one table to an empty table"
              >
                <ArrowRightLeft size={13} />
                <span>Move Table</span>
              </button>

              {/* Table Merge Button */}
              <button
                type="button"
                onClick={() => {
                  setPrimaryMergeTable('');
                  setMergeTargetTable('');
                  setMergeSourceTable('');
                  setShowMergeModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0.38rem 0.65rem',
                  borderRadius: '7px',
                  background: '#ffffff',
                  color: '#4f46e5',
                  border: '1.5px solid #c7d2fe',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(79, 70, 229, 0.08)',
                  whiteSpace: 'nowrap'
                }}
                title="Merge tables: Combine running bills of 2 occupied tables into one"
              >
                <GitMerge size={13} />
                <span>Merge Tables</span>
              </button>

              {/* Drag Mode Toggle Switch */}
              <div
                onClick={() => setIsDragDropMode(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.32rem 0.55rem',
                  borderRadius: '7px',
                  background: isDragDropMode ? '#ecfdf5' : '#f8fafc',
                  border: isDragDropMode ? '1.5px solid #10b981' : '1.5px solid #e2e8f0',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: isDragDropMode ? '0 1px 4px rgba(16, 185, 129, 0.2)' : 'none'
                }}
                title="Toggle Drag & Drop Mode"
              >
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: isDragDropMode ? '#065f46' : '#64748b',
                  whiteSpace: 'nowrap'
                }}>
                  Drag Mode
                </span>
                <div style={{
                  width: '28px',
                  height: '16px',
                  borderRadius: '20px',
                  background: isDragDropMode ? '#10b981' : '#cbd5e1',
                  position: 'relative',
                  transition: 'background 0.2s ease',
                  flexShrink: 0
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: '2px',
                    left: isDragDropMode ? '14px' : '2px',
                    transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.25)'
                  }} />
                </div>
              </div>

              {/* Search Box */}
              <div className={styles.searchBox} style={{ width: '130px', minWidth: '110px', height: '30px', padding: '0 8px' }}>
                <Search size={13} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search table..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className={styles.searchInput}
                  style={{ fontSize: '0.74rem' }}
                  disabled={isLoadingTables}
                />
                {tableSearch && (
                  <button
                    type="button"
                    onClick={() => setTableSearch('')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Floor Tables Grid Area (Tables scroll cleanly under the pinned toolbar) */}
          <div
            className={styles.floorScrollableArea}
            ref={floorContainerRef}
            onDragOver={(e) => {
              if (isDragDropMode && gridDragSourceTable) {
                const el = floorContainerRef.current;
                if (el) {
                  const rect = el.getBoundingClientRect();
                  if (e.clientY < rect.top + 70) {
                    el.scrollTop -= 12;
                  } else if (e.clientY > rect.bottom - 70) {
                    el.scrollTop += 12;
                  }
                }
              }
            }}
          >

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
          ) : isDragDropMode ? (
            /* COMPACT DRAG & DROP FLOOR OVERVIEW: All tables clustered closely together on 1 screen */
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '0.85rem',
              border: '1.5px solid #10b981',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
                gap: '8px'
              }}>
                {filteredFloorTables.map(tbl => {
                  const tableOrders = getOrdersForTableObj(tbl);
                  const isOccupied = tableOrders.length > 0;
                  const isAllPaid = isOccupied && tableOrders.every(o => o.paymentStatus === 'paid');
                  const totalAmt = tableOrders.reduce((s, o) => s + (Number(o.total || o.totalAmount) || 0), 0);
                  const isTemp = tbl.isTemporary || /^temp/i.test(String(tbl.tableNumber || ''));
                  const rawCustName = tableOrders[0]?.customerDetails?.name || tableOrders[0]?.customerName || tbl.customerName || '';
                  const custName = getCustomerFirstName(rawCustName);
                  const tempCustLabel = tbl.customerName || custName || (tbl.tableNumber ? String(tbl.tableNumber).replace(/^temp\s*-\s*/i, '') : 'Tab');
                  const secLabel = isTemp ? 'Temp' : (tbl.section || tbl.zone || 'Hall');

                  const isGridDragTarget = gridDragOverTable && String(gridDragOverTable).trim() === String(tbl.tableNumber).trim();
                  const isDragSource = gridDragSourceTable && String(gridDragSourceTable).trim() === String(tbl.tableNumber).trim();

                  return (
                    <div
                      key={tbl._id || tbl.tableNumber}
                      draggable={isOccupied}
                      onDragStart={(e) => {
                        if (!isOccupied) {
                          e.preventDefault();
                          return;
                        }
                        isDraggingRef.current = true;
                        e.dataTransfer.setData('gridSourceTable', tbl.tableNumber);
                        e.dataTransfer.effectAllowed = 'move';
                        setGridDragSourceTable(tbl.tableNumber);
                      }}
                      onDragEnd={() => {
                        setGridDragSourceTable(null);
                        setGridDragOverTable(null);
                        setTimeout(() => {
                          isDraggingRef.current = false;
                        }, 250);
                      }}
                      onDragOver={(e) => {
                        if (gridDragSourceTable && String(gridDragSourceTable).trim() !== String(tbl.tableNumber).trim()) {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          if (gridDragOverTable !== tbl.tableNumber) {
                            setGridDragOverTable(tbl.tableNumber);
                          }
                        }
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget)) return;
                        if (gridDragOverTable === tbl.tableNumber) setGridDragOverTable(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const srcTbl = e.dataTransfer.getData('gridSourceTable') || gridDragSourceTable;
                        setGridDragOverTable(null);
                        setGridDragSourceTable(null);
                        setTimeout(() => {
                          isDraggingRef.current = false;
                        }, 250);
                        if (srcTbl && String(srcTbl).trim() !== String(tbl.tableNumber).trim()) {
                          if (!isOccupied) {
                            handleMoveTable(srcTbl, tbl.tableNumber);
                          } else {
                            handleMergeTables(tbl.tableNumber, [srcTbl]);
                          }
                        }
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      style={{
                        minHeight: '68px',
                        padding: '6px 5px',
                        borderRadius: '8px',
                        border: isGridDragTarget
                          ? (isOccupied ? '2px solid #7c3aed' : '2px solid #0284c7')
                          : (isDragSource
                            ? '1.5px dashed #94a3b8'
                            : (isAllPaid
                              ? '1.5px solid #86efac'
                              : (isOccupied
                                ? '1.5px solid #f59e0b'
                                : '1.5px dashed #cbd5e1'))),
                        background: isGridDragTarget
                          ? (isOccupied ? '#f5f3ff' : '#e0f2fe')
                          : (isDragSource
                            ? '#f8fafc'
                            : (isAllPaid
                              ? '#f0fdf4'
                              : (isOccupied
                                ? '#fffbeb'
                                : '#ffffff'))),
                        cursor: isOccupied ? 'grab' : 'default',
                        userSelect: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textAlign: 'center',
                        boxShadow: isGridDragTarget
                          ? (isOccupied ? '0 0 0 3px rgba(124, 58, 237, 0.35)' : '0 0 0 3px rgba(2, 132, 199, 0.35)')
                          : (isOccupied ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'),
                        opacity: isDragSource ? 0.45 : 1,
                        transition: 'all 0.12s ease'
                      }}
                      title={isGridDragTarget
                        ? (isOccupied ? `Drop to Merge with Table ${formatTableOnlyNumber(tbl.tableNumber)}` : `Drop to Move to Table ${formatTableOnlyNumber(tbl.tableNumber)}`)
                        : `Table ${formatTableOnlyNumber(tbl.tableNumber)} (${secLabel})`}
                    >
                      <div style={{
                        pointerEvents: gridDragSourceTable ? 'none' : 'auto',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: '100%'
                      }}>
                        {isGridDragTarget ? (
                          <div style={{
                            color: isOccupied ? '#7c3aed' : '#0284c7',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                          }}>
                            <span style={{ fontSize: '0.86rem' }}>T-{formatTableOnlyNumber(tbl.tableNumber)}</span>
                            <span>{isOccupied ? '↵ Merge' : '↵ Move'}</span>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 2px' }}>
                              <span style={{
                                fontSize: '0.88rem',
                                fontWeight: 800,
                                color: isAllPaid ? '#047857' : (isOccupied ? '#92400e' : '#334155'),
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '60px'
                              }}>
                                {isTemp ? tempCustLabel : formatTableOnlyNumber(tbl.tableNumber)}
                              </span>
                              <span style={{
                                fontSize: '0.56rem',
                                fontWeight: 700,
                                color: '#64748b',
                                background: '#f1f5f9',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                whiteSpace: 'nowrap'
                              }}>
                                {secLabel.length > 5 ? secLabel.substring(0, 5) : secLabel}
                              </span>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '3px' }}>
                              {isAllPaid ? (
                                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#047857' }}>
                                  ₹{formatAmount(totalAmt)}
                                </span>
                              ) : isOccupied ? (
                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309' }}>
                                  ₹{formatAmount(totalAmt)}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#94a3b8' }}>
                                  + Free
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                        else elapsedMin = `${Math.max(1, m)}m`;
                      }

                      const rawCustName = tableOrders[0]?.customerDetails?.name || tableOrders[0]?.customerName || tbl.customerName || '';
                      const custName = getCustomerFirstName(rawCustName);
                      const isTemp = tbl.isTemporary || /^temp/i.test(String(tbl.tableNumber || ''));
                      const tempCustLabel = tbl.customerName || custName || (tbl.tableNumber ? String(tbl.tableNumber).replace(/^temp\s*-\s*/i, '') : 'Tab');

                      // 1. FREE / EMPTY CARD (Unoccupied or Merged/Cleared Table)
                      if (!isOccupied) {
                        const isGridDragTarget = gridDragOverTable && String(gridDragOverTable).trim() === String(tbl.tableNumber).trim();
                        return (
                          <div
                            key={tbl._id || tbl.tableNumber}
                            className={`${styles.tableTile} ${styles.tileFree}`}
                            onClick={(e) => {
                              if (isDraggingRef.current) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              handleOpenTableInPOS(tbl.tableNumber);
                            }}
                            onDragOver={(e) => {
                              if (!isDragDropMode) return;
                              if (gridDragSourceTable && String(gridDragSourceTable).trim() !== String(tbl.tableNumber).trim()) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = 'move';
                                if (gridDragOverTable !== tbl.tableNumber) {
                                  setGridDragOverTable(tbl.tableNumber);
                                }
                              }
                            }}
                            onDragLeave={() => {
                              if (!isDragDropMode) return;
                              if (gridDragOverTable === tbl.tableNumber) setGridDragOverTable(null);
                            }}
                            onDrop={(e) => {
                              if (!isDragDropMode) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const srcTbl = e.dataTransfer.getData('gridSourceTable') || gridDragSourceTable;
                              setGridDragOverTable(null);
                              setGridDragSourceTable(null);
                              setTimeout(() => {
                                isDraggingRef.current = false;
                              }, 250);
                              if (srcTbl && String(srcTbl).trim() !== String(tbl.tableNumber).trim()) {
                                handleMoveTable(srcTbl, tbl.tableNumber);
                              }
                            }}
                            style={{
                              cursor: 'pointer',
                              ...(isTemp ? { borderColor: '#c4b5fd', background: '#faf5ff', boxShadow: '0 1px 4px rgba(124, 58, 237, 0.08)' } : {}),
                              ...(isDragDropMode && isGridDragTarget ? { borderColor: '#0284c7', background: '#e0f2fe', boxShadow: '0 0 0 3px rgba(2, 132, 199, 0.35)', transform: 'scale(1.02)' } : {})
                            }}
                            title={isGridDragTarget ? `Drop Table ${gridDragSourceTable} here to Move` : (isTemp ? `Temporary Tab: ${tempCustLabel} - Clean & Ready. Click to take order.` : `Table ${formatTableOnlyNumber(tbl.tableNumber)} - Clean & Ready. Click to take order.`)}
                          >
                            {isGridDragTarget ? (
                              <div style={{ textAlign: 'center', color: '#0284c7', fontWeight: 800, padding: '10px 0' }}>
                                <div style={{ fontSize: '0.86rem' }}>Table {formatTableOnlyNumber(tbl.tableNumber)}</div>
                                <div style={{ fontSize: '0.72rem', marginTop: '3px' }}>↵ Drop to Move Here</div>
                              </div>
                            ) : (
                              <>
                                {isTemp ? (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#7c3aed', background: '#ede9fe', padding: '1px 6px', borderRadius: '4px' }}>
                                      ⚡ TEMP TAB
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteTempTable(tbl, e)}
                                      title="Dismiss this empty temporary tab"
                                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 2px' }}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                                    <span className={styles.tileCapacity}>{tbl.seatingCapacity || 4} Seats</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 500, color: '#16a34a', background: '#f0fdf4', padding: '1px 6px', borderRadius: '4px' }}>Free</span>
                                  </div>
                                )}
                                <div style={{ margin: '6px 0 2px 0' }}>
                                  <span className={styles.tileName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', color: isTemp ? '#6d28d9' : '#0f172a' }}>
                                    {isTemp ? tempCustLabel : `Table ${formatTableOnlyNumber(tbl.tableNumber)}`}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: isTemp ? '#7c3aed' : '#2563eb', fontWeight: 500, marginTop: 'auto' }}>
                                  + Take Order
                                </span>
                              </>
                            )}
                          </div>
                        );
                      }

                      // 2. PAID / BILLED / SERVED CARD (Soft Green)
                      if (isAllPaid) {
                        const isGridDragTarget = gridDragOverTable && String(gridDragOverTable).trim() === String(tbl.tableNumber).trim();
                        return (
                          <div
                            key={tbl._id || tbl.tableNumber}
                            className={`${styles.tableTile} ${styles.tilePaid}`}
                            draggable={isDragDropMode}
                            onDragStart={(e) => {
                              if (!isDragDropMode) {
                                e.preventDefault();
                                return;
                              }
                              isDraggingRef.current = true;
                              e.dataTransfer.setData('gridSourceTable', tbl.tableNumber);
                              e.dataTransfer.effectAllowed = 'move';
                              setGridDragSourceTable(tbl.tableNumber);
                            }}
                            onDragEnd={() => {
                              setGridDragSourceTable(null);
                              setGridDragOverTable(null);
                              setTimeout(() => {
                                isDraggingRef.current = false;
                              }, 250);
                            }}
                            onDragOver={(e) => {
                              if (!isDragDropMode) return;
                              if (gridDragSourceTable && String(gridDragSourceTable).trim() !== String(tbl.tableNumber).trim()) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = 'move';
                                if (gridDragOverTable !== tbl.tableNumber) {
                                  setGridDragOverTable(tbl.tableNumber);
                                }
                              }
                            }}
                            onDragLeave={() => {
                              if (!isDragDropMode) return;
                              if (gridDragOverTable === tbl.tableNumber) setGridDragOverTable(null);
                            }}
                            onDrop={(e) => {
                              if (!isDragDropMode) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const srcTbl = e.dataTransfer.getData('gridSourceTable') || gridDragSourceTable;
                              setGridDragOverTable(null);
                              setGridDragSourceTable(null);
                              setTimeout(() => {
                                isDraggingRef.current = false;
                              }, 250);
                              if (srcTbl && String(srcTbl).trim() !== String(tbl.tableNumber).trim()) {
                                handleMergeTables(tbl.tableNumber, [srcTbl]);
                              }
                            }}
                            onClick={(e) => {
                              if (isDraggingRef.current) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              handleOpenTableInPOS(tbl.tableNumber);
                            }}
                            style={{
                              cursor: isDragDropMode ? 'grab' : 'pointer',
                              ...(isTemp ? { borderColor: '#86efac', background: '#f0fdf4' } : {}),
                              ...(isDragDropMode && isGridDragTarget ? { borderColor: '#7c3aed', background: '#f5f3ff', boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.35)', transform: 'scale(1.02)' } : {})
                            }}
                            title={isGridDragTarget ? `Drop Table ${gridDragSourceTable} here to Merge` : `Table ${formatTableOnlyNumber(tbl.tableNumber)} - Drag to move or merge. Click to open POS.`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                              <div className={styles.tileTopMeta} style={{ color: '#047857' }}>
                                <Clock size={11} /> {elapsedMin || 'Paid'}
                              </div>
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 500,
                                color: '#047857',
                                background: '#dcfce7',
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}>
                                Paid
                              </span>
                            </div>

                            <div style={{ margin: '3px 0 1px 0' }}>
                              <span className={styles.tileName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                {isTemp ? tempCustLabel : `Table ${formatTableOnlyNumber(tbl.tableNumber)}`}
                              </span>
                              {custName && !isTemp && (
                                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                  {custName}
                                </span>
                              )}
                            </div>

                            <div style={{ margin: '2px 0' }}>
                              <span className={styles.tileAmount}>
                                ₹{formatAmount(totalAmt)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickSettleTable(tbl.tableNumber);
                              }}
                              style={{
                                marginTop: '2px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #10b981',
                                background: '#10b981',
                                color: '#ffffff',
                                fontSize: '0.68rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                width: '100%',
                                transition: 'all 0.15s ease'
                              }}
                              title={isTemp ? `Click to close and remove ${tempCustLabel}'s temporary tab` : `Click to clear and free Table ${formatTableOnlyNumber(tbl.tableNumber)}`}
                            >
                              <CheckCircle2 size={11} /> {isTemp ? 'Close Tab' : 'Clear Table'}
                            </button>
                          </div>
                        );
                      }

                      // 3. OCCUPIED / RUNNING / BOOKING CARD (Orange / Warm Amber)
                      const isGridDragTarget = gridDragOverTable && String(gridDragOverTable).trim() === String(tbl.tableNumber).trim();
                      const isBill = tbl.status === 'bill_requested';
                      return (
                        <div
                          key={tbl._id || tbl.tableNumber}
                          className={`${styles.tableTile} ${isBill ? styles.tileBillRequested : styles.tileOccupied}`}
                          draggable={isDragDropMode}
                          onDragStart={(e) => {
                            if (!isDragDropMode) {
                              e.preventDefault();
                              return;
                            }
                            isDraggingRef.current = true;
                            e.dataTransfer.setData('gridSourceTable', tbl.tableNumber);
                            e.dataTransfer.effectAllowed = 'move';
                            setGridDragSourceTable(tbl.tableNumber);
                          }}
                          onDragEnd={() => {
                            setGridDragSourceTable(null);
                            setGridDragOverTable(null);
                            setTimeout(() => {
                              isDraggingRef.current = false;
                            }, 250);
                          }}
                          onDragOver={(e) => {
                            if (!isDragDropMode) return;
                            if (gridDragSourceTable && String(gridDragSourceTable).trim() !== String(tbl.tableNumber).trim()) {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                              if (gridDragOverTable !== tbl.tableNumber) {
                                setGridDragOverTable(tbl.tableNumber);
                              }
                            }
                          }}
                          onDragLeave={() => {
                            if (!isDragDropMode) return;
                            if (gridDragOverTable === tbl.tableNumber) setGridDragOverTable(null);
                          }}
                          onDrop={(e) => {
                            if (!isDragDropMode) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const srcTbl = e.dataTransfer.getData('gridSourceTable') || gridDragSourceTable;
                            setGridDragOverTable(null);
                            setGridDragSourceTable(null);
                            setTimeout(() => {
                              isDraggingRef.current = false;
                            }, 250);
                            if (srcTbl && String(srcTbl).trim() !== String(tbl.tableNumber).trim()) {
                              handleMergeTables(tbl.tableNumber, [srcTbl]);
                            }
                          }}
                          onClick={(e) => {
                            if (isDraggingRef.current) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            handleOpenTableInPOS(tbl.tableNumber);
                          }}
                          style={{
                            cursor: isDragDropMode ? 'grab' : 'pointer',
                            ...(isTemp ? { borderColor: '#f59e0b', background: '#fffbeb', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.15)' } : {}),
                            ...(isGridDragTarget ? { borderColor: '#7c3aed', background: '#f5f3ff', boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.35)', transform: 'scale(1.02)' } : {})
                          }}
                          title={isGridDragTarget ? `Drop Table ${gridDragSourceTable} here to Merge` : `Table ${formatTableOnlyNumber(tbl.tableNumber)} - Drag to move or merge. Click to open POS.`}
                        >
                          {/* Top Meta: Elapsed timer & Status Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '2px' }}>
                            <div className={styles.tileTopMeta}>
                              <Clock size={11} /> {elapsedMin || (isTemp ? 'Open' : 'Active')}
                            </div>
                            {isBill ? (
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 600,
                                color: '#c2410c',
                                background: '#ffedd5',
                                border: '1px solid #fdba74',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                Bill Req
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 600,
                                color: isTemp ? '#7c3aed' : '#92400e',
                                background: isTemp ? '#f5f3ff' : '#fde68a',
                                border: isTemp ? '1px solid #ddd6fe' : '1px solid #fcd34d',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                {isTemp ? 'Running' : 'Occupied'}
                              </span>
                            )}
                          </div>

                          {/* Table Identity */}
                          <div style={{ margin: '3px 0 1px 0' }}>
                            <span className={styles.tileName} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                              {isTemp ? tempCustLabel : `Table ${formatTableOnlyNumber(tbl.tableNumber)}`}
                            </span>
                            {custName && !isTemp && (
                              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                                {custName}
                              </span>
                            )}
                          </div>

                          {/* Total Amount */}
                          <div style={{ margin: '2px 0' }}>
                            <span className={styles.tileAmount} style={isBill ? { color: '#ea580c' } : {}}>
                              ₹{formatAmount(totalAmt)}
                            </span>
                          </div>

                          {/* Bottom Action Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickSettleTable(tbl.tableNumber);
                            }}
                            style={{
                              marginTop: '2px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: 'none',
                              background: isBill ? '#ea580c' : '#d97706',
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              width: '100%',
                              boxShadow: isBill ? '0 1px 4px rgba(234, 88, 12, 0.3)' : '0 1px 4px rgba(217, 119, 6, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                            title={isTemp ? `Click to close and remove ${tempCustLabel}'s temporary tab` : `Click to clear and free Table ${formatTableOnlyNumber(tbl.tableNumber)}`}
                          >
                            <CheckCircle2 size={11} /> {isTemp ? 'Close Tab' : 'Clear Table'}
                          </button>
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
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. POS BILLING & ORDER VIEW (High-Speed Terminal)         */}
      {/* ========================================================= */}
      {(isCounterBillingOnly || viewMode === 'terminal') && (
        <div className={styles.terminalContainerWrap}>

          {/* POS Two-Column Grid */}
          <div className={styles.posGrid}>

            {/* Left: Menu Catalog & Categories */}
            <div className={styles.menuSection}>
              {/* 1. Left Side: Clean Vertical Category List starting from TOP */}
              <div className={styles.categorySidebar}>
                <div className={styles.categoryListContainer}>
                  {categories.map(cat => {
                    const isActive = selectedCategory === cat;
                    const count = categoryDishCounts[cat] !== undefined ? categoryDishCounts[cat] : 0;
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`${styles.categoryListItem} ${isActive ? styles.categoryListItemActive : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                        title={cat === 'all' ? (isOpenItemModeEnabled ? 'All Open Items' : 'All Dishes') : cat}
                      >
                        <span className={styles.categoryItemName}>
                          {(() => {
                            if (cat === 'all') return isOpenItemModeEnabled ? 'All Open Items' : 'All Dishes';
                            const allDefs = (Array.isArray(passedCategories) && passedCategories.length > 0)
                              ? passedCategories
                              : (tenantInfo?.settings?.categories || []);
                            const found = allDefs.find(c => (c && (c.id === cat || c.name === cat)));
                            return found?.name || (typeof cat === 'string' ? (cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')) : String(cat));
                          })()}
                        </span>
                        <span className={`${styles.categoryItemCount} ${isActive ? styles.categoryItemCountActive : ''}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Right Side: Main Column (Search/Toggle Bar on Top + Dishes Grid Below) */}
              <div className={styles.menuMainColumn}>
                <div className={styles.menuFilterBar}>
                  {/* Inline Back Arrow Button to return to Floor Tables (Dine-in only) */}
                  {!isCounterBillingOnly && (
                    <button
                      type="button"
                      className={styles.backIconBtn}
                      onClick={handleReturnToTables}
                      title="Back to Floor Tables"
                    >
                      <ArrowLeft size={16} />
                    </button>
                  )}

                  {/* Dish Search input right after back button */}
                  <div className={styles.searchBox}>
                    <Search size={13} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder={isOpenItemModeEnabled ? "Search open items..." : "Search dish..."}
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

                  {/* Open Item Interactive Toggle Switch & Add Button */}
                  <div className={styles.specialFilterGroup}>
                    <div
                      onClick={() => {
                        setIsOpenItemModeEnabled(prev => {
                          const next = !prev;
                          setSelectedCategory('all');
                          setDishSearch('');
                          return next;
                        });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: isOpenItemModeEnabled ? '#eff6ff' : '#f8fafc',
                        border: `1.5px solid ${isOpenItemModeEnabled ? '#3b82f6' : '#e2e8f0'}`,
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: isOpenItemModeEnabled ? '0 1px 4px rgba(59, 130, 246, 0.2)' : 'none'
                      }}
                      title={isOpenItemModeEnabled ? "Switch back to Normal Menu" : "Switch to Open Menu"}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: isOpenItemModeEnabled ? '#3b82f6' : '#e2e8f0',
                        color: isOpenItemModeEnabled ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Zap size={11} />
                      </div>
                      <span style={{
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: isOpenItemModeEnabled ? '#1d4ed8' : '#475569'
                      }}>
                        {isOpenItemModeEnabled ? 'Open Menu' : 'Open Item'}
                      </span>
                      {/* Toggle Pill */}
                      <div style={{
                        width: '28px',
                        height: '16px',
                        borderRadius: '10px',
                        background: isOpenItemModeEnabled ? '#2563eb' : '#cbd5e1',
                        position: 'relative',
                        transition: 'background 0.2s ease'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          position: 'absolute',
                          top: '2px',
                          left: isOpenItemModeEnabled ? '14px' : '2px',
                          transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>

                    {/* When Open Item toggle is enabled, show the '+ Add Open Item' button */}
                    {isOpenItemModeEnabled && (
                      <button
                        type="button"
                        onClick={() => setShowOpenItemModal(true)}
                        style={{
                          height: '32px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                          whiteSpace: 'nowrap'
                        }}
                        title="Punch an emergency / off-menu item"
                      >
                        <Plus size={14} />
                        <span>Add Open Item</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dishes Grid */}
                <div
                  className={`${styles.dishesGrid} ${isBothSidebarsOpen ? styles.dishesGrid3 : styles.dishesGrid4}`}
                  style={{
                    gridTemplateColumns: isBothSidebarsOpen
                      ? 'repeat(3, minmax(0, 1fr))'
                      : 'repeat(4, minmax(0, 1fr))'
                  }}
                >
                  {filteredMenuItems.length === 0 ? (
                    <div style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: '3rem 1.5rem',
                      background: '#f8fafc',
                      borderRadius: '16px',
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '260px'
                    }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: isOpenItemModeEnabled ? '#eff6ff' : '#f1f5f9',
                        color: isOpenItemModeEnabled ? '#2563eb' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '10px'
                      }}>
                        {isOpenItemModeEnabled ? <Zap size={22} /> : <Search size={22} />}
                      </div>
                      <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 800 }}>
                        {isOpenItemModeEnabled
                          ? (dishSearch ? `No open items match "${dishSearch}"` : 'No Open Menu items cataloged yet')
                          : (dishSearch ? `No dishes match "${dishSearch}"` : 'No dishes found')}
                      </h4>
                      <p style={{ margin: '6px 0 16px', color: '#64748b', fontSize: '0.8rem', maxWidth: '340px' }}>
                        {isOpenItemModeEnabled
                          ? 'Quickly punch emergency off-menu items, custom charges or cigarettes using the button below.'
                          : 'Switch category or clear search to browse menu.'}
                      </p>
                      {isOpenItemModeEnabled && (
                        <button
                          type="button"
                          onClick={() => setShowOpenItemModal(true)}
                          style={{
                            padding: '9px 18px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
                          }}
                        >
                          <Plus size={15} />
                          <span>+ Add Open Item</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredMenuItems.map((item, idx) => {
                      const imgUrl = getValidFoodImage(item);
                      const price = getItemEffectivePrice(item);
                      const cartQty = cart
                        .filter(c => c.id === item._id || c._id === item._id || c.name === item.name)
                        .reduce((sum, c) => sum + (c.quantity || 1), 0);

                      return (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.22, delay: Math.min(idx * 0.025, 0.3) }}
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
                            <div className={item.isVeg ? styles.vegBadge : styles.nonVegBadge}>
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
                                ⚡ Open Item
                              </div>
                            )}
                            {/* NIGHT MENU BADGE COMMENTED OUT AS PER REQUEST
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
                        */}
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
                        </motion.div>
                      );
                    }))}
                </div>
              </div>
            </div>

            {/* Right: Order Slip & Settlement Drawer */}
            <div className={styles.orderDrawer}>

              {/* Top Block: Title & Inputs (Pinned Top) */}
              <div className={styles.drawerTopBlock}>
                <div className={styles.drawerHeader}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4 className={styles.drawerTitle} style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {isCounterBillingOnly ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 800
                          }}>
                            ⚡ COUNTER POS
                          </span>
                        ) : tableNumber === 'Walk-in' ? (
                          'Walk-in'
                        ) : /^temp/i.test(tableNumber) ? (
                          <>
                            <span style={{
                              background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                              color: '#ffffff',
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              letterSpacing: '0.5px'
                            }}>
                              ⚡ TEMP TAB
                            </span>
                            <span>{formatTableOnlyNumber(tableNumber)}</span>
                          </>
                        ) : (
                          `Table ${formatTableOnlyNumber(tableNumber)}`
                        )}
                      </h4>
                      {!isCounterBillingOnly && mergedTables.map(mTable => (
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
                            onClick={() => handleDemergeTable(tableNumber, mTable)}
                            title={`Demerge Table ${mTable}`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4338ca', padding: 0, display: 'flex' }}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                      {!isCounterBillingOnly && tableNumber !== 'Walk-in' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const curTbl = String(tableNumber || '').replace(/^Table\s*/i, '').trim();
                              setMoveSourceTable(curTbl);
                              setMoveTargetTable('');
                              setShowMoveModal(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              height: '24px',
                              borderRadius: '6px',
                              border: '1.5px solid #bae6fd',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              lineHeight: 1
                            }}
                            title="Move this table's order to an empty table"
                          >
                            <ArrowRightLeft size={12} />
                            <span>Move</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const curTbl = String(tableNumber || '').replace(/^Table\s*/i, '').trim();
                              setMergeSourceTable(curTbl);
                              setMergeTargetTable('');
                              setPrimaryMergeTable('');
                              setShowMergeModal(true);
                            }}
                            className={styles.mergeTablesBtn}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              height: '24px',
                              borderRadius: '6px',
                              border: '1px solid #c7d2fe',
                              background: '#eef2ff',
                              color: '#4338ca',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              lineHeight: 1
                            }}
                            title="Merge this table's bill into another table"
                          >
                            <GitMerge size={12} />
                            <span>Merge</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {cart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          clearDraftForTable(tableNumber);
                          setCart([]);
                        }}
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
                                      {(it.specialNotes || it.notes) && (
                                        <div style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          marginTop: '3px',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          background: '#fef3c7',
                                          border: '1px solid #fde68a',
                                          color: '#92400e',
                                          fontSize: '0.72rem',
                                          fontWeight: 700
                                        }}>
                                          <span>📝 Note: {it.specialNotes || it.notes}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className={styles.qtyControls}>
                                    {!isPaid && (
                                      <button type="button" className={styles.qtyBtn} onClick={() => handleUpdateExistingOrderItem(ord._id, itemIdx, -1)} title="Decrease quantity (or remove if 0)">
                                        <Minus size={10} />
                                      </button>
                                    )}
                                    <span className={styles.qtyVal}>{it.quantity || 1}</span>
                                    {!isPaid && (
                                      <button type="button" className={styles.qtyBtn} onClick={() => handleUpdateExistingOrderItem(ord._id, itemIdx, 1)} title="Increase quantity">
                                        <Plus size={10} />
                                      </button>
                                    )}
                                    {!isPaid && (
                                      <button
                                        type="button"
                                        className={styles.qtyBtn}
                                        onClick={() => handleRemoveExistingOrderItem(ord._id, itemIdx)}
                                        title="Remove unpaid item"
                                        style={{ marginLeft: '4px', borderColor: '#fecaca', background: '#fef2f2', color: '#dc2626' }}
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {(ord.notes || ord.specialInstructions || ord.customerDetails?.notes) && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              color: '#b45309',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              marginTop: '6px'
                            }}>
                              <StickyNote size={12} />
                              <span>Chef Note: {ord.notes || ord.specialInstructions || ord.customerDetails?.notes}</span>
                            </div>
                          )}
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
                        <>
                          {(isCounterBillingOnly || !hasTableSuite || tableNumber === 'Walk-in') ? (
                            hasDraftItems && (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '8px', width: '100%', marginTop: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handlePrintDraftBill()}
                                  style={{
                                    padding: '11px 10px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #cbd5e1',
                                    background: '#ffffff',
                                    color: '#1e293b',
                                    fontSize: '0.86rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                  title="Print Bill / Estimate before payment"
                                >
                                  <Printer size={16} color="#334155" />
                                  <span>Print Bill</span>
                                </button>
                                <button
                                  type="button"
                                  className={styles.paidOrderBtn}
                                  onClick={() => {
                                    setKhataPaidAmount('0');
                                    setKhataBorrowAmount(0);
                                    setActualAmountReceived('');
                                    setSettlementDiscount('');
                                    setCashTenderGiven('');
                                    setSettlementDiscountReason('Quick Counter Concession / Round Off');
                                    setSettlementSubMethod('Cash');
                                    setShowPayItemsModal(true);
                                  }}
                                  disabled={isSubmittingItemPay || isSubmittingDirect}
                                  style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    fontSize: '0.94rem',
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    borderRadius: '10px',
                                    border: 'none',
                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 7
                                  }}
                                  title="Collect payment and generate bill"
                                >
                                  <CreditCard size={17} />
                                  <span>Pay & Bill (₹{formatAmount(draftCartTotal)})</span>
                                </button>
                              </div>
                            )
                          ) : (
                            <>
                              {hasActiveOrders && balanceDue === 0 && tableNumber !== 'Walk-in' && (
                                <div style={{
                                  background: '#f0fdf4',
                                  border: '1px solid #86efac',
                                  borderRadius: '8px',
                                  padding: '6px 10px',
                                  marginBottom: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  color: '#166534',
                                  boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)'
                                }}>
                                  <CheckCircle2 size={14} color="#16a34a" />
                                  <span>✓ Bill Paid in Full! Table stays occupied until you click <strong>Clear Table</strong>.</span>
                                </div>
                              )}
                              <div className={styles.terminalActionBtns}>
                                {/* 1. Send to Kitchen: Shown whenever draft items exist and tenant has KDS module */}
                                {hasDraftItems && hasModuleAccess(tenantInfo?.subscription, MODULE_KEYS.LIVE_ORDERS_KDS) && (
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
                                    onClick={() => {
                                      const totalPayable = selectedItemsSummary.count > 0
                                        ? selectedItemsSummary.total
                                        : (balanceDue > 0 ? balanceDue : draftCartTotal);

                                      if (totalPayable <= 0 && !hasDraftItems) {
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
                                          : (hasDraftItems ? `Pay (₹${formatAmount(draftCartTotal)})` : 'Paid Order'))}
                                    </span>
                                  </button>
                                )}

                                {/* 4. Clear Table: Always visible when table is active or has draft items */}
                                {(hasActiveOrders || hasDraftItems) && (
                                  <button
                                    type="button"
                                    className={styles.clearTableBtn}
                                    onClick={() => {
                                      if (hasActiveOrders) {
                                        handleClearTableClick();
                                      } else {
                                        setCart([]);
                                      }
                                    }}
                                    disabled={isSettling}
                                    title="Clear and reset table"
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>
                                      {isSettling
                                        ? 'Clearing...'
                                        : (hasActiveOrders
                                          ? (balanceDue === 0 ? 'Clear Table (Free)' : `Clear Table (₹${formatAmount(balanceDue)})`)
                                          : 'Clear Table')}
                                    </span>
                                  </button>
                                )}

                                {/* Quick Thermal Print Bill & WhatsApp E-Bill */}
                                {(hasActiveOrders || hasDraftItems) && (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginTop: '8px' }}>
                                    <button
                                      type="button"
                                      onClick={() => handlePrintDraftBill()}
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
                            </>
                          )}
                        </>
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
        const tenderAmount = (isCounterBillingOnly && tableNumber === 'Walk-in')
          ? draftCartTotal
          : (selectedItemsSummary.count > 0 ? selectedItemsSummary.total : (balanceDue > 0 ? balanceDue : draftCartTotal));

        // Calculate settlement discount and payable amount
        const discountVal = Math.max(0, Number(settlementDiscount) || 0);
        const finalPayable = Math.max(0, tenderAmount - discountVal);

        const availableTenders = [
          { id: 'Cash', label: 'Cash', icon: Banknote },
          { id: 'UPI / GPay', label: 'UPI / GPay', icon: Smartphone },
          { id: 'Card', label: 'Card', icon: CreditCard },
          ...(tenantInfo?.settings?.enableKhata !== false && hasModuleAccess(tenantInfo?.subscription, MODULE_KEYS.KHATA_LEDGER) ? [{ id: 'Khata / Borrow', label: 'Udhar / Khata', icon: BookOpen }] : [])
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
              if (isCounterBillingOnly && tableNumber === 'Walk-in') {
                const khataItems = cart.map(it => ({
                  name: it.name || 'Dish',
                  quantity: it.quantity || 1,
                  price: Number(it.price) || 0
                }));

                await axios.post(`${API}/khata`, {
                  tenantId: effectiveTenantId,
                  customerName: effName,
                  customerPhone: effPhone,
                  totalBill: finalPayable,
                  paidAmount: paidNowNum,
                  borrowAmount: borrowDueNum,
                  notes: khataNotes || `Counter Order${discountVal > 0 ? ` [Discount: ₹${discountVal}]` : ''}`,
                  items: khataItems
                }, {
                  headers: token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : {}
                });

                const orderPayload = {
                  tenantId: effectiveTenantId,
                  tableNumber: 'Walk-in',
                  orderType: 'takeaway',
                  customerName: effName,
                  customerPhone: effPhone,
                  customerDetails: { name: effName, phone: effPhone },
                  paymentMethod: 'Khata / Borrow',
                  isDirect: true,
                  status: 'completed',
                  paymentStatus: borrowDueNum === 0 ? 'paid' : (paidNowNum > 0 ? 'partial' : 'pending'),
                  settledAmount: paidNowNum,
                  discountAmount: discountVal,
                  discountReason: settlementDiscountReason || 'Quick Counter Settlement',
                  items: cart.map(it => ({
                    id: it.id,
                    itemId: it.id,
                    name: it.name,
                    price: it.price,
                    quantity: it.quantity,
                    variant: it.variant || null,
                    addons: it.addons || [],
                    isDirect: true,
                    itemStatus: 'served',
                    isPaid: borrowDueNum === 0
                  })),
                  totalAmount: finalPayable
                };

                const res = await axios.post(`${API}/orders`, orderPayload, {
                  headers: token ? { 'x-auth-token': token } : {}
                });
                const createdOrder = res.data?.order || res.data;

                setCart([]);
                setCustomerName('');
                setCustomerPhone('');
                setShowPayItemsModal(false);
                setActualAmountReceived('');
                setSettlementDiscount('');
                setCashTenderGiven('');
                setKhataPaidAmount('0');
                if (onOrderPlaced) onOrderPlaced(createdOrder);
                if (onOrderCreated) onOrderCreated(createdOrder);
                return;
              }
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

                // Return to table matrix view - table is completely clear (or stay in terminal for counter billing)
                handleReturnToTables();
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

                  {/* If UPI / GPay */}
                  {currentMethod === 'UPI / GPay' && (() => {
                    const rawUpi = tenantInfo?.settings?.upiId || '';
                    const isEmail = rawUpi.endsWith('@gmail.com') || rawUpi.endsWith('@yahoo.com');
                    const cleanUpiId = (!isEmail && rawUpi) ? rawUpi : '9351862675@paytm';
                    const upiPayee = tenantInfo?.settings?.upiPayeeName || tenantInfo?.name || 'Cafee';
                    const upiString = buildUpiUri({
                      upiId: cleanUpiId,
                      payeeName: upiPayee,
                      amount: finalPayable,
                      note: `Bill Table ${tableNumber}`,
                      includeAmount: isUpiAmountLocked
                    });

                    return (
                      <div style={{
                        marginTop: '9px',
                        padding: '12px 14px',
                        background: 'linear-gradient(145deg, #ffffff, #f0fdf4)',
                        border: '1.5px solid #86efac',
                        borderRadius: '12px',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)'
                      }}>
                        {/* Header & Amount Lock Tag */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Smartphone size={15} color="#059669" /> Dynamic UPI Table QR
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsUpiAmountLocked(!isUpiAmountLocked)}
                            title="Click to toggle amount lock in QR"
                            style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              color: isUpiAmountLocked ? '#15803d' : '#475569',
                              background: isUpiAmountLocked ? '#dcfce7' : '#f1f5f9',
                              padding: '3px 8px',
                              borderRadius: '100px',
                              border: isUpiAmountLocked ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <Lock size={10} /> {isUpiAmountLocked ? `Pre-filled: ₹${formatAmount(finalPayable)}` : 'Open Amount'}
                          </button>
                        </div>

                        {/* QR Code and Brand Logos */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                          <div style={{
                            background: '#ffffff',
                            padding: '8px',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            border: '1.5px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <QRCodeSVG
                              value={upiString}
                              size={120}
                              level="M"
                            />
                          </div>

                          <div style={{ textAlign: 'left', flex: 1, minWidth: '165px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                              Accepting all UPI payment apps:
                            </div>

                            {/* Official Brand Logo Badges */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}>
                                <GPayIcon size={20} />
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1e293b' }}>GPay</span>
                              </div>

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}>
                                <PhonePeIcon size={20} />
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#5f259f' }}>PhonePe</span>
                              </div>

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}>
                                <PaytmIcon size={18} />
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#002970' }}>PayTM</span>
                              </div>

                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 6px',
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}>
                                <BhimIcon size={20} />
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#008450' }}>BHIM</span>
                              </div>
                            </div>

                            {/* VPA Display & Status */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px' }}>
                              <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>
                                UPI: <strong>{cleanUpiId}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(cleanUpiId);
                                }}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#059669' }}
                                title="Copy UPI ID"
                              >
                                <Tag size={11} />
                              </button>
                            </div>

                            <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700, marginTop: '3px' }}>
                              ✓ Amount locks in customer's phone automatically
                            </div>

                            {isEmail && (
                              <div style={{ fontSize: '0.62rem', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
                                ⚠️ Settings has an email ({rawUpi}). Using default UPI {cleanUpiId}. Update in Restaurant Settings.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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

              {/* Action Buttons: Cancel, Print Bill and Confirm */}
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
                  onClick={() => handlePrintDraftBill(finalPayable)}
                  style={{
                    flex: 1.2,
                    height: '38px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                  title="Print Pro-forma / Estimate receipt before paying"
                >
                  <Printer size={15} color="#475569" />
                  <span>Print Bill</span>
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
                        : `Confirm & Pay ₹${formatAmount(finalPayable)}`)}
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
      {/* 4B. MERGE TABLE MODAL (Drag & Drop / 1-Click Interactive)   */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* 4B-1. MOVE TABLE MODAL (Orders -> Empty Table Only)       */}
      {/* ========================================================= */}
      {showMoveModal && (
        <div className={styles.splitModalOverlay} onClick={() => {
          setMoveSourceTable('');
          setMoveTargetTable('');
          setShowMoveModal(false);
        }}>
          <div
            className={styles.splitModalContent}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '680px',
              width: '95vw',
              padding: '1.25rem',
              borderRadius: '16px',
              background: '#ffffff',
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', padding: '8px', borderRadius: '10px', display: 'flex', boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)' }}>
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a' }}>
                    Move Table
                  </h3>

                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMoveSourceTable('');
                  setMoveTargetTable('');
                  setShowMoveModal(false);
                }}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Visual Transfer Connector Banner */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1.5px solid #e2e8f0',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              {/* Source Box */}
              <div style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                background: moveSourceTable ? '#eff6ff' : '#ffffff',
                border: moveSourceTable ? '1.5px solid #0284c7' : '1.5px dashed #cbd5e1',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: moveSourceTable ? '#0284c7' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  1. Move Order From
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: moveSourceTable ? '#0f172a' : '#94a3b8', marginTop: '2px' }}>
                  {moveSourceTable ? `Table ${formatTableOnlyNumber(moveSourceTable)}` : 'Select / Drag Table'}
                </div>
              </div>

              {/* Transfer Arrow Indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ background: '#0284c7', color: '#ffffff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)' }}>
                  <ArrowRight size={14} />
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#0284c7' }}>Moves into</span>
              </div>

              {/* Target Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverTargetTable('banner-move-target'); }}
                onDragLeave={() => setDragOverTargetTable(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const src = e.dataTransfer.getData('moveSourceTable');
                  if (src && moveTargetTable && src !== moveTargetTable) {
                    setMoveSourceTable(src);
                  }
                  setDragOverTargetTable(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: moveTargetTable ? '#f0fdf4' : '#ffffff',
                  border: moveTargetTable ? '1.5px solid #22c55e' : (dragOverTargetTable === 'banner-move-target' ? '2px dashed #22c55e' : '1.5px dashed #cbd5e1'),
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: moveTargetTable ? '#15803d' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  2. Move Into Table (Empty)
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: moveTargetTable ? '#0f172a' : '#94a3b8', marginTop: '2px' }}>
                  {moveTargetTable ? `Table ${formatTableOnlyNumber(moveTargetTable)}` : 'Drop or Select Empty Table'}
                </div>
              </div>
            </div>

            {/* Two Columns: Left (Tables With Orders), Right (ONLY Empty Tables) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Left Column: Tables with Orders */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    1. Move From (Active)
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px' }}>
                    {activeOccupiedTables.length} active
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                  scrollbarWidth: 'thin'
                }}>
                  {activeOccupiedTables.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.78rem' }}>
                      No active tables with orders to move.
                    </div>
                  ) : (
                    activeOccupiedTables.map(tbl => {
                      const tStr = String(tbl.tableNumber).trim();
                      const isSelected = moveSourceTable === tStr;

                      return (
                        <div
                          key={tbl._id || tStr}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('moveSourceTable', tStr);
                            setMoveSourceTable(tStr);
                          }}
                          onClick={() => {
                            setMoveSourceTable(isSelected ? '' : tStr);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            background: isSelected ? '#eff6ff' : '#ffffff',
                            border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                            cursor: 'grab',
                            boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Click or drag Table ${tStr}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <GripVertical size={14} color={isSelected ? '#0284c7' : '#94a3b8'} />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? '#0369a1' : '#0f172a' }}>
                                Table {formatTableOnlyNumber(tStr)}
                                {tbl.customerName ? ` (${tbl.customerName})` : ''}
                              </div>
                            </div>
                          </div>
                          <div>
                            {isSelected ? (
                              <span style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 800, background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                                SOURCE ✓
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                                Select ➔
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: ONLY Empty / Free Tables */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    2. Move Into (Empty Tables Only)
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px' }}>
                    {freeEmptyTables.length} empty
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                  scrollbarWidth: 'thin'
                }}>
                  {freeEmptyTables.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.78rem' }}>
                      No empty tables available.
                    </div>
                  ) : (
                    freeEmptyTables.map(tbl => {
                      const tStr = String(tbl.tableNumber).trim();
                      const isSelected = moveTargetTable === tStr;
                      const isDragOver = dragOverTargetTable === `move-${tStr}`;

                      return (
                        <div
                          key={tbl._id || tStr}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverTargetTable(`move-${tStr}`);
                          }}
                          onDragLeave={() => {
                            if (dragOverTargetTable === `move-${tStr}`) setDragOverTargetTable(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverTargetTable(null);
                            const src = e.dataTransfer.getData('moveSourceTable');
                            if (src && src !== tStr) {
                              setMoveSourceTable(src);
                              setMoveTargetTable(tStr);
                            }
                          }}
                          onClick={() => {
                            setMoveTargetTable(isSelected ? '' : tStr);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            background: isDragOver ? '#dcfce7' : (isSelected ? '#f0fdf4' : '#ffffff'),
                            border: isDragOver ? '2px dashed #16a34a' : (isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0'),
                            cursor: 'pointer',
                            boxShadow: isSelected ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? '#15803d' : '#0f172a' }}>
                              Table {formatTableOnlyNumber(tStr)}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700 }}>
                              Empty / Free
                            </div>
                          </div>
                          <div>
                            {isDragOver ? (
                              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 800 }}>
                                Drop Here ↵
                              </span>
                            ) : isSelected ? (
                              <span style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 800, background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                                DESTINATION ✓
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                                Select ➔
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setMoveSourceTable('');
                  setMoveTargetTable('');
                  setShowMoveModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!moveSourceTable || !moveTargetTable || moveSourceTable === moveTargetTable}
                onClick={async () => {
                  if (moveSourceTable && moveTargetTable && moveSourceTable !== moveTargetTable) {
                    await handleMoveTable(moveSourceTable, moveTargetTable);
                  }
                }}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: (!moveSourceTable || !moveTargetTable || moveSourceTable === moveTargetTable)
                    ? '#cbd5e1'
                    : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: (!moveSourceTable || !moveTargetTable || moveSourceTable === moveTargetTable) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: (!moveSourceTable || !moveTargetTable || moveSourceTable === moveTargetTable) ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.35)'
                }}
              >
                <ArrowRightLeft size={16} />
                <span>
                  {moveSourceTable && moveTargetTable && moveSourceTable !== moveTargetTable
                    ? `Confirm Move: Table ${formatTableOnlyNumber(moveSourceTable)} ➔ Table ${formatTableOnlyNumber(moveTargetTable)}`
                    : 'Select Source & Empty Destination Table'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4B-2. MERGE TABLE MODAL (Orders -> Occupied Tables Only)   */}
      {/* ========================================================= */}
      {showMergeModal && (
        <div className={styles.splitModalOverlay} onClick={() => {
          setMergeSourceTable('');
          setMergeTargetTable('');
          setShowMergeModal(false);
        }}>
          <div
            className={styles.splitModalContent}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '680px',
              width: '95vw',
              padding: '1.25rem',
              borderRadius: '16px',
              background: '#ffffff',
              boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.25)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#ffffff', padding: '8px', borderRadius: '10px', display: 'flex', boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)' }}>
                  <GitMerge size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a' }}>
                    Merge Tables
                  </h3>

                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMergeSourceTable('');
                  setMergeTargetTable('');
                  setShowMergeModal(false);
                }}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Visual Transfer Connector Banner */}
            <div style={{
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1.5px solid #e2e8f0',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              position: 'relative'
            }}>
              {/* Source Box */}
              <div style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '10px',
                background: mergeSourceTable ? '#eff6ff' : '#ffffff',
                border: mergeSourceTable ? '1.5px solid #3b82f6' : '1.5px dashed #cbd5e1',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: mergeSourceTable ? '#1d4ed8' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  1. Move Order From
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: mergeSourceTable ? '#0f172a' : '#94a3b8', marginTop: '2px' }}>
                  {mergeSourceTable ? `Table ${formatTableOnlyNumber(mergeSourceTable)}` : 'Select / Drag Table'}
                </div>
              </div>

              {/* Transfer Arrow Indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ background: '#4f46e5', color: '#ffffff', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)' }}>
                  <ArrowRight size={14} />
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#6366f1' }}>Merges into</span>
              </div>

              {/* Target Box */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverTargetTable('banner-target'); }}
                onDragLeave={() => setDragOverTargetTable(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const src = e.dataTransfer.getData('sourceTable');
                  if (src && mergeTargetTable && src !== mergeTargetTable) {
                    setMergeSourceTable(src);
                  }
                  setDragOverTargetTable(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: mergeTargetTable ? '#f0fdf4' : '#ffffff',
                  border: mergeTargetTable ? '1.5px solid #22c55e' : (dragOverTargetTable === 'banner-target' ? '2px dashed #22c55e' : '1.5px dashed #cbd5e1'),
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: mergeTargetTable ? '#15803d' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  2. Merge Into Table
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: mergeTargetTable ? '#0f172a' : '#94a3b8', marginTop: '2px' }}>
                  {mergeTargetTable ? `Table ${formatTableOnlyNumber(mergeTargetTable)}` : 'Drop or Select Table'}
                </div>
              </div>
            </div>

            {/* Two Columns: Both show ONLY tables that contain orders (NO empty tables!) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Left Column: Tables With Active Orders */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    1. Move Order From (Active)
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px' }}>
                    {activeOccupiedTables.length} active
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                  scrollbarWidth: 'thin'
                }}>
                  {activeOccupiedTables.length === 0 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.78rem' }}>
                      No active tables with orders to merge.
                    </div>
                  ) : (
                    activeOccupiedTables.map(tbl => {
                      const tStr = String(tbl.tableNumber).trim();
                      const isSelected = mergeSourceTable === tStr;
                      const isDestination = mergeTargetTable === tStr;

                      return (
                        <div
                          key={tbl._id || tStr}
                          draggable={!isDestination}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('sourceTable', tStr);
                            setMergeSourceTable(tStr);
                          }}
                          onClick={() => {
                            if (isDestination) {
                              setMergeTargetTable('');
                              setMergeSourceTable(tStr);
                              return;
                            }
                            setMergeSourceTable(isSelected ? '' : tStr);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            background: isSelected ? '#eff6ff' : (isDestination ? '#f1f5f9' : '#ffffff'),
                            border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                            cursor: isDestination ? 'not-allowed' : 'grab',
                            opacity: isDestination ? 0.45 : 1,
                            boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                          title={`Click or drag Table ${tStr}`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <GripVertical size={14} color={isSelected ? '#2563eb' : '#94a3b8'} />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                                Table {formatTableOnlyNumber(tStr)}
                                {tbl.customerName ? ` (${tbl.customerName})` : ''}
                              </div>
                            </div>
                          </div>
                          <div>
                            {isSelected ? (
                              <span style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 800, background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                                SOURCE ✓
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                                Select ➔
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Other Active Tables ONLY (No Empty Tables!) */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    2. Merge Into (Active Tables Only)
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px' }}>
                    {activeOccupiedTables.filter(t => String(t.tableNumber).trim() !== String(mergeSourceTable).trim()).length} target tables
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  paddingRight: '6px',
                  scrollbarWidth: 'thin'
                }}>
                  {activeOccupiedTables.length <= 1 ? (
                    <div style={{ padding: '24px 12px', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.78rem' }}>
                      At least 2 active tables with orders are required to merge.
                    </div>
                  ) : (
                    activeOccupiedTables
                      .filter(tbl => String(tbl.tableNumber).trim() !== String(mergeSourceTable).trim())
                      .map(tbl => {
                        const tStr = String(tbl.tableNumber).trim();
                        const isSource = mergeSourceTable === tStr;
                        const isSelected = mergeTargetTable === tStr;
                        const isDragOver = dragOverTargetTable === `merge-${tStr}`;

                        return (
                          <div
                            key={tbl._id || tStr}
                            onDragOver={(e) => {
                              if (isSource) return;
                              e.preventDefault();
                              setDragOverTargetTable(`merge-${tStr}`);
                            }}
                            onDragLeave={() => {
                              if (dragOverTargetTable === `merge-${tStr}`) setDragOverTargetTable(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverTargetTable(null);
                              const src = e.dataTransfer.getData('sourceTable');
                              if (src && src !== tStr) {
                                setMergeSourceTable(src);
                                setMergeTargetTable(tStr);
                              }
                            }}
                            onClick={() => {
                              if (isSource) return;
                              setMergeTargetTable(isSelected ? '' : tStr);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: '10px',
                              background: isDragOver ? '#dcfce7' : (isSelected ? '#f0fdf4' : '#ffffff'),
                              border: isDragOver ? '2px dashed #16a34a' : (isSelected ? '2px solid #16a34a' : '1px solid #e2e8f0'),
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 2px 8px rgba(22, 163, 74, 0.15)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: isSelected ? '#15803d' : '#0f172a' }}>
                                Table {formatTableOnlyNumber(tStr)}
                                {tbl.customerName ? ` (${tbl.customerName})` : ''}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 700 }}>
                                Active Order
                              </div>
                            </div>
                            <div>
                              {isDragOver ? (
                                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 800 }}>
                                  Drop Here ↵
                                </span>
                              ) : isSelected ? (
                                <span style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 800, background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                                  DESTINATION ✓
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                                  Select ➔
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Live explanation & Action Buttons */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setMergeSourceTable('');
                  setMergeTargetTable('');
                  setShowMergeModal(false);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#64748b',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!mergeSourceTable || !mergeTargetTable || mergeSourceTable === mergeTargetTable}
                onClick={async () => {
                  if (mergeSourceTable && mergeTargetTable && mergeSourceTable !== mergeTargetTable) {
                    await handleMergeTables(mergeTargetTable, [mergeSourceTable]);
                    setMergeSourceTable('');
                    setMergeTargetTable('');
                    setShowMergeModal(false);
                  }
                }}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: (!mergeSourceTable || !mergeTargetTable || mergeSourceTable === mergeTargetTable)
                    ? '#cbd5e1'
                    : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: (!mergeSourceTable || !mergeTargetTable || mergeSourceTable === mergeTargetTable) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: (!mergeSourceTable || !mergeTargetTable || mergeSourceTable === mergeTargetTable) ? 'none' : '0 4px 12px rgba(79, 70, 229, 0.35)'
                }}
              >
                <GitMerge size={16} />
                <span>
                  {mergeSourceTable && mergeTargetTable && mergeSourceTable !== mergeTargetTable
                    ? `Confirm Merge: Table ${formatTableOnlyNumber(mergeSourceTable)} ➔ Table ${formatTableOnlyNumber(mergeTargetTable)}`
                    : 'Select Source & Destination Table'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4C. EMERGENCY OPEN ITEM POPUP MODAL (Modern Redesign)       */}
      {/* ========================================================= */}
      {showOpenItemModal && (
        <div
          className={styles.splitModalOverlay}
          onClick={() => setShowOpenItemModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.6rem',
              width: '92%',
              maxWidth: '470px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
              animation: 'scaleIn 0.18s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)'
                }}>
                  <Zap size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Add Open Item</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b' }}>Fast off-menu dishes, custom charges or emergency items</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOpenItemModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddOpenItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '6px' }}>
              {/* Item Name Input (Mandatory) */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  Item Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  transition: 'border-color 0.15s ease'
                }}>
                  <Tag size={16} color="#64748b" />
                  <input
                    type="text"
                    required
                    placeholder="Enter item name (e.g. Special Hookah, Off-menu Dish)"
                    value={openItemForm.name}
                    onChange={(e) => setOpenItemForm(prev => ({ ...prev, name: e.target.value }))}
                    autoFocus
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Price (Mandatory) */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                  Price (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc'
                }}>
                  <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1rem' }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="0"
                    value={openItemForm.price}
                    onChange={(e) => setOpenItemForm(prev => ({ ...prev, price: e.target.value }))}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      width: '100%',
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Save to menu toggle */}
              <div
                onClick={() => setOpenItemForm(prev => ({ ...prev, saveToMenu: !prev.saveToMenu }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: openItemForm.saveToMenu ? '#eff6ff' : '#f8fafc',
                  border: `1px solid ${openItemForm.saveToMenu ? '#93c5fd' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={14} color={openItemForm.saveToMenu ? '#2563eb' : '#94a3b8'} />
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: openItemForm.saveToMenu ? '#1d4ed8' : '#475569' }}>
                    Save to POS Open Items catalog
                  </span>
                </div>
                <div style={{
                  width: '28px',
                  height: '16px',
                  borderRadius: '10px',
                  background: openItemForm.saveToMenu ? '#2563eb' : '#cbd5e1',
                  position: 'relative',
                  transition: 'background 0.2s ease'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: '2px',
                    left: openItemForm.saveToMenu ? '14px' : '2px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowOpenItemModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  <Plus size={16} />
                  <span>Add to Table Order</span>
                </button>
              </div>
            </form>
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

      {/* ========================================================= */}
      {/* TEMPORARY TABLE / OPEN TAB CREATION MODAL                 */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showTempTableModal && (
          <div className={styles.splitModalOverlay} onClick={() => !isCreatingTempTable && setShowTempTableModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className={styles.splitModalContent}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '460px', width: '92%', borderRadius: '16px', padding: '1.25rem', border: '1.5px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.25)' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #c4b5fd'
                  }}>
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      Create Temporary Table
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                      For walk-in, floating guests, or running tabs (e.g. Deepak)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTempTableModal(false)}
                  disabled={isCreatingTempTable}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateTempTable(true);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Customer / Tab Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="e.g. Deepak"
                      value={tempCustomerName}
                      onChange={(e) => setTempCustomerName(e.target.value)}
                      autoFocus
                      required
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.1rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Phone Number <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>(Optional - for WhatsApp E-Bill)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={tempCustomerPhone}
                      onChange={(e) => setTempCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.1rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Notes / Tag <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>(Optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <StickyNote size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Optional notes or tag"
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.75rem 0.55rem 2.1rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Helper info badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f5f3ff',
                  border: '1px solid #ddd6fe',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  fontSize: '0.72rem',
                  color: '#6d28d9',
                  fontWeight: 600
                }}>
                  <Zap size={13} color="#7c3aed" style={{ flexShrink: 0 }} />
                  <span>All orders throughout the day will be tracked on this tab. Once settled & paid, it auto-removes!</span>
                </div>

                {/* Modal Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowTempTableModal(false)}
                    disabled={isCreatingTempTable}
                    style={{
                      flex: 1,
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateTempTable(false)}
                    disabled={isCreatingTempTable}
                    style={{
                      flex: 1.2,
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: '1.5px solid #c4b5fd',
                      background: '#ffffff',
                      color: '#6d28d9',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Create Tab Only
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTempTable}
                    style={{
                      flex: 1.6,
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <UserPlus size={14} />
                    <span>{isCreatingTempTable ? 'Creating...' : 'Create & Order'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Link Modal */}
      <WhatsAppConnectModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        tenantInfo={tenantInfo}
      />

      {/* Floating Cleared Table Quick Bill & WhatsApp Dispatcher */}
      <AnimatePresence>
        {lastClearedBill && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 99999,
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '14px',
              padding: '12px 18px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              border: '1px solid #334155'
            }}
          >
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} color="#38bdf8" />
                {lastClearedBill.tableNumber} Cleared & Settled
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                Amount: ₹{Math.round(lastClearedBill.totalAmount || lastClearedBill.subTotal)} • {lastClearedBill.paymentMethod}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => openWhatsappBill(lastClearedBill, tenantInfo, lastClearedBill.customerPhone)}
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9px',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.4)'
                }}
              >
                <FaWhatsapp size={15} />
                <span>WhatsApp Bill</span>
              </button>
              <button
                type="button"
                onClick={() => printOrderBill(lastClearedBill, tenantInfo?.name)}
                style={{
                  background: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #475569',
                  borderRadius: '9px',
                  padding: '7px 11px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => setLastClearedBill(null)}
                style={{
                  background: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0 4px',
                  lineHeight: 1
                }}
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
