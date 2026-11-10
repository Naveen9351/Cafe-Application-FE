import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Search, CheckCircle, AlertCircle, Check, X, Phone, User, Plus,
  RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, MessageCircle, Trash2, ShoppingBag, CreditCard,
  ChevronRight, ChevronLeft, Utensils, Minus, Printer, QrCode, Smartphone, Banknote,
  FileText, Clock, Sparkles, ArrowLeft
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useTranslation } from '../utils/translations';
import { getValidFoodImage } from './AdminPanel';
import styles from './KhataLedger.module.css';

const getAvatarStyle = (name = '') => {
  const palettes = [
    { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', text: '#ffffff' },
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
};

export default function KhataLedger({ menuItems = [], tenantId }) {
  const { t, isHindi } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'settled'
  const [viewMode, setViewMode] = useState('customers'); // 'customers' or 'transactions'
  const [tenantInfo, setTenantInfo] = useState(null);
  const [passbookCustomer, setPassbookCustomer] = useState(null);

  // In-Screen POS Visual Menu Order Mode
  const [khataMode, setKhataMode] = useState('ledger'); // 'ledger' or 'pos_menu'
  const [activePosCustomer, setActivePosCustomer] = useState(null);
  const [isNewCustomerInline, setIsNewCustomerInline] = useState(false);
  const [posSelectedCategory, setPosSelectedCategory] = useState('all');
  const [posDishSearch, setPosDishSearch] = useState('');

  // Full Cafe Menu Catalog from Database
  const [availableMenu, setAvailableMenu] = useState([]);

  // Fetch full restaurant menu catalog strictly filtered for THIS tenant/restaurant
  useEffect(() => {
    const fetchFullMenu = async () => {
      try {
        const token = localStorage.getItem('token');
        const tid = tenantId || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

        const menuUrl = tid
          ? `${API_URL}/menu?tenantId=${tid}&includeUnavailable=true&includePosOnly=true`
          : `${API_URL}/menu?includeUnavailable=true&includePosOnly=true`;

        const res = await axios.get(menuUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const list = Array.isArray(res.data) ? res.data : [];
        const menuMap = new Map();

        // Add fetched items strictly for this restaurant
        list.forEach(item => {
          if (item && item.name) {
            if (tid && item.tenantId && String(item.tenantId) !== String(tid)) {
              return;
            }
            const key = item.name.toLowerCase().trim();
            if (!menuMap.has(key)) {
              menuMap.set(key, {
                ...item,
                price: Number(item.price) || 0
              });
            }
          }
        });

        // Also merge items passed from parent props (AdminPanel passes this restaurant's items)
        (menuItems || []).forEach(item => {
          if (item && item.name) {
            if (tid && item.tenantId && String(item.tenantId) !== String(tid)) {
              return;
            }
            const key = item.name.toLowerCase().trim();
            if (!menuMap.has(key)) {
              menuMap.set(key, {
                ...item,
                price: Number(item.price) || 0
              });
            }
          }
        });

        const sorted = Array.from(menuMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        setAvailableMenu(sorted);
      } catch (err) {
        console.warn('Failed to load restaurant menu catalog:', err.message);
        if (Array.isArray(menuItems) && menuItems.length > 0) {
          setAvailableMenu(menuItems);
        }
      }
    };

    fetchFullMenu();
  }, [menuItems, tenantId]);

  // Group menu items by category for the quick-add selector
  const groupedMenu = useMemo(() => {
    const groups = {};
    availableMenu.forEach(item => {
      const rawCat = item.category || 'General';
      const cat = rawCat.replace(/-/g, ' ').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [availableMenu]);

  // Derived unique categories for POS visual catalog pills
  const posCategories = useMemo(() => {
    const cats = new Set();
    availableMenu.forEach(item => {
      if (item && item.category) {
        cats.add(item.category);
      }
    });
    return ['all', ...Array.from(cats).sort()];
  }, [availableMenu]);

  // Filtered dishes for POS visual grid
  const posFilteredDishes = useMemo(() => {
    return availableMenu.filter(item => {
      const q = (posDishSearch || '').toLowerCase().trim();
      const matchesSearch = !q || (item.name && item.name.toLowerCase().includes(q)) || (item.category && item.category.toLowerCase().includes(q));
      if (!matchesSearch) return false;
      if (posSelectedCategory !== 'all') {
        return item.category === posSelectedCategory;
      }
      return true;
    });
  }, [availableMenu, posDishSearch, posSelectedCategory]);

  // Pagination states
  const [customerPage, setCustomerPage] = useState(1);
  const CUSTOMERS_PER_PAGE = 8;

  const [transactionPage, setTransactionPage] = useState(1);
  const TX_PER_PAGE = 8;

  // Settlement Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedCustomerAccount, setSelectedCustomerAccount] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMethod, setSettleMethod] = useState('Cash');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // New Khata Entry Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerMode, setCustomerMode] = useState('existing'); // 'existing' or 'new'
  const [selectedCustomerChoice, setSelectedCustomerChoice] = useState('NEW');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPaidAmount, setNewPaidAmount] = useState('0');
  const [newPaidMethod, setNewPaidMethod] = useState('Cash'); // 'Cash', 'UPI', 'Card'
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [entryOrderNumber, setEntryOrderNumber] = useState('');
  const [dishSearch, setDishSearch] = useState('');
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [manualTotalBill, setManualTotalBill] = useState('');
  const [useManualTotal, setUseManualTotal] = useState(false);

  // Line items state
  const [lineItems, setLineItems] = useState([]);

  const [isCreating, setIsCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchKhataRecords();
    const tid = tenantId || localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);
    if (tid) {
      axios.get(`${API_URL}/tenants/public/${tid}`)
        .then(res => setTenantInfo(res.data))
        .catch(err => console.log('Khata tenant fetch:', err.message));
    }
  }, [tenantId]);

  const fetchKhataRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/khata`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = res.data;
      if (Array.isArray(data)) {
        setRecords(data);
      } else if (data && Array.isArray(data.records)) {
        setRecords(data.records);
      } else if (data && Array.isArray(data.data)) {
        setRecords(data.data);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to fetch khata records:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg, isError = false) => {
    setActionMessage({ text: msg, isError });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Aggregated Customer Accounts (Person-Centric Running Udhar Profiles)
  const customerAccounts = useMemo(() => {
    const map = new Map();

    records.forEach(r => {
      const phone = String(r.customerPhone || '').trim();
      const name = String(r.customerName || 'Walk-in Guest').trim();
      const key = (phone && phone !== 'N/A') ? phone : `NAME_${name.toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          customerName: name,
          customerPhone: (phone && phone !== 'N/A') ? phone : 'N/A',
          totalPurchases: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          entriesCount: 0,
          lastActivity: r.createdAt,
          transactions: []
        });
      }

      const acc = map.get(key);
      const bill = Number(r.totalBill !== undefined ? r.totalBill : (Number(r.borrowAmount || 0) + Number(r.paidAmount || 0))) || 0;
      const paid = Number(r.paidAmount || 0);
      const borrow = Number(r.borrowAmount !== undefined ? r.borrowAmount : r.remainingAmount) || 0;

      acc.totalPurchases += bill;
      acc.totalPaid += paid;
      if (r.status !== 'settled') {
        acc.outstandingBalance += borrow;
      }
      acc.entriesCount += 1;
      acc.transactions.push(r);
    });

    return Array.from(map.values()).sort((a, b) => b.outstandingBalance - a.outstandingBalance);
  }, [records]);

  // Detected existing customer while selecting or typing
  const matchedExistingCustomer = useMemo(() => {
    const cleanP = newCustomerPhone.replace(/[^0-9]/g, '');
    if (cleanP.length >= 4) {
      return customerAccounts.find(c => c.customerPhone.includes(cleanP));
    }
    if (newCustomerName.trim().length >= 3) {
      return customerAccounts.find(c => c.customerName.toLowerCase().includes(newCustomerName.toLowerCase().trim()));
    }
    return null;
  }, [customerAccounts, newCustomerPhone, newCustomerName]);

  // Currently active customer profile in Add Udhar modal
  const currentSelectedCustomer = useMemo(() => {
    if (customerMode === 'new') {
      return matchedExistingCustomer || null;
    }
    return customerAccounts.find(c =>
      (c.customerPhone !== 'N/A' && c.customerPhone === selectedCustomerChoice) ||
      c.customerName === selectedCustomerChoice
    ) || (customerAccounts.length > 0 ? customerAccounts[0] : null);
  }, [customerMode, customerAccounts, selectedCustomerChoice, matchedExistingCustomer]);

  // Filter available menu dishes by search query
  const filteredAvailableMenu = useMemo(() => {
    if (!dishSearch.trim()) return availableMenu;
    const q = dishSearch.toLowerCase().trim();
    return availableMenu.filter(m => m.name.toLowerCase().includes(q) || (m.category && m.category.toLowerCase().includes(q)));
  }, [availableMenu, dishSearch]);

  const groupedFilteredMenu = useMemo(() => {
    const groups = {};
    filteredAvailableMenu.forEach(item => {
      const rawCat = item.category || 'General';
      const cat = rawCat.replace(/-/g, ' ').toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredAvailableMenu]);

  // Filter existing customers in modal
  const filteredCustomerAccounts = useMemo(() => {
    if (!customerSearchText.trim()) return customerAccounts;
    const q = customerSearchText.toLowerCase().trim();
    return customerAccounts.filter(c => c.customerName.toLowerCase().includes(q) || c.customerPhone.includes(q));
  }, [customerAccounts, customerSearchText]);

  // Calculated items total
  const calculatedItemsTotal = useMemo(() => {
    if (useManualTotal) {
      return Number(manualTotalBill) || 0;
    }
    return lineItems.reduce((sum, it) => {
      const q = Number(it.quantity) || 1;
      const p = Number(it.price) || 0;
      return sum + (q * p);
    }, 0);
  }, [lineItems, useManualTotal, manualTotalBill]);

  const effectiveTotalBill = useManualTotal ? (Number(manualTotalBill) || 0) : calculatedItemsTotal;
  const effectivePaid = Math.min(effectiveTotalBill, Math.max(0, Number(newPaidAmount) || 0));
  const newUdharAmount = Math.max(0, effectiveTotalBill - effectivePaid);

  // Line item helpers
  const handleAddItemRow = (dish = null) => {
    if (dish) {
      setLineItems(prev => [...prev, { name: dish.name, quantity: 1, price: String(dish.price || 0) }]);
    } else {
      setLineItems(prev => [...prev, { name: '', quantity: 1, price: '' }]);
    }
  };

  const handleRemoveItemRow = (idx) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };

      // Auto-detect price if dish name matches an existing menu item
      if (field === 'name') {
        const found = availableMenu.find(m => m.name.toLowerCase().trim() === String(val).toLowerCase().trim());
        if (found && !updated[idx].price) {
          updated[idx].price = String(found.price || 0);
        }
      }
      return updated;
    });
  };

  const handleQuickAddDish = (dishId) => {
    if (!dishId) return;
    const dish = availableMenu.find(m => String(m._id || m.id) === String(dishId));
    if (dish) {
      setLineItems(prev => {
        // If dish already in list, increment quantity
        const existingIdx = prev.findIndex(it => it.name.toLowerCase().trim() === dish.name.toLowerCase().trim());
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx].quantity = (Number(updated[existingIdx].quantity) || 1) + 1;
          return updated;
        }
        // If there is an empty row, populate it
        const emptyIdx = prev.findIndex(it => !it.name.trim());
        if (emptyIdx > -1) {
          const updated = [...prev];
          updated[emptyIdx] = { name: dish.name, quantity: 1, price: String(dish.price || 0) };
          return updated;
        }
        return [...prev, { name: dish.name, quantity: 1, price: String(dish.price || 0) }];
      });
    }
  };

  // POS Visual Menu Handlers
  const handlePosQuickAdd = (dish) => {
    setLineItems(prev => {
      const idx = prev.findIndex(it => it.name.toLowerCase() === dish.name.toLowerCase());
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: (Number(copy[idx].quantity) || 1) + 1
        };
        return copy;
      }
      return [
        ...prev,
        {
          name: dish.name,
          quantity: 1,
          price: String(dish.price || 0),
          isVeg: dish.isVeg
        }
      ];
    });
  };

  const handlePosDecrement = (dish, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setLineItems(prev => {
      const idx = prev.findIndex(it => it.name.toLowerCase() === dish.name.toLowerCase());
      if (idx === -1) return prev;
      const currentQty = Number(prev[idx].quantity) || 1;
      if (currentQty <= 1) {
        return prev.filter((_, i) => i !== idx);
      }
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        quantity: currentQty - 1
      };
      return copy;
    });
  };

  const handlePosRemoveItem = (idxToRemove) => {
    setLineItems(prev => prev.filter((_, i) => i !== idxToRemove));
  };

  // Open POS Visual Menu for a customer
  const handleAddUdharForCustomer = (cust) => {
    setActivePosCustomer(cust);
    setIsNewCustomerInline(false);
    setPosDishSearch('');
    setPosSelectedCategory('all');
    setLineItems([]);
    setNewPaidAmount('0');
    setNewPaidMethod('Cash');
    setNewNotes('');
    setEntryDate(new Date().toISOString().slice(0, 16));
    setEntryOrderNumber('');
    setKhataMode('pos_menu');
  };

  // Confirm and Record POS Visual Menu Order directly to Khata
  const handleConfirmPosOrder = async () => {
    let effName = activePosCustomer?.customerName || '';
    let effPhone = activePosCustomer?.customerPhone || '';

    if (activePosCustomer?.isNew || isNewCustomerInline) {
      if (!effName.trim()) {
        alert('Please enter a Customer Name.');
        return;
      }
    }

    if (!effName) effName = 'Walk-in Guest';
    const cleanPhone = effPhone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone && cleanPhone.length >= 5 ? cleanPhone : (effPhone || 'N/A');

    const totalBill = lineItems.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);

    if (totalBill <= 0) {
      alert('Please select at least one dish from the menu.');
      return;
    }

    const effectivePaid = Math.min(Math.max(0, Number(newPaidAmount) || 0), totalBill);
    const newUdharAmount = Math.max(0, totalBill - effectivePaid);

    const validItems = lineItems
      .filter(it => it.name && it.name.trim())
      .map(it => ({
        name: it.name.trim(),
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0
      }));

    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/khata`, {
        tenantId,
        orderNumber: entryOrderNumber.trim(),
        customerName: effName.trim(),
        customerPhone: finalPhone,
        totalBill: totalBill,
        paidAmount: effectivePaid,
        borrowAmount: newUdharAmount,
        notes: newNotes.trim(),
        items: validItems,
        date: entryDate,
        paidMethod: effectivePaid > 0 ? newPaidMethod : 'Cash'
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setKhataMode('ledger');
      setActivePosCustomer(null);
      setLineItems([]);
      setNewPaidAmount('0');
      setNewNotes('');
      setEntryOrderNumber('');
      setIsNewCustomerInline(false);

      showFeedback(res.data?.message || `✓ Khata recorded for ${effName}! (New Due: ₹${newUdharAmount})`);
      fetchKhataRecords();
    } catch (err) {
      showFeedback(err.response?.data?.error || err.response?.data?.message || 'Failed to record khata entry.', true);
    } finally {
      setIsCreating(false);
    }
  };

  // Open Settlement Modal
  const handleOpenSettle = (rec) => {
    const due = Number(rec.borrowAmount !== undefined ? rec.borrowAmount : (rec.remainingAmount || 0));
    setSelectedRecord(rec);
    setSelectedCustomerAccount(null);
    setSettleAmount(due);
    setSettleMethod('Cash');
    setSettleNotes('');
  };

  const handleOpenCustomerSettle = (cust) => {
    setSelectedCustomerAccount(cust);
    setSelectedRecord(null);
    setSettleAmount(cust.outstandingBalance);
    setSettleMethod('Cash');
    setSettleNotes('');
  };

  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    try {
      setIsSettling(true);
      const token = localStorage.getItem('token');

      if (selectedCustomerAccount) {
        const res = await axios.post(`${API_URL}/khata/customer-payment`, {
          customerPhone: selectedCustomerAccount.customerPhone,
          customerName: selectedCustomerAccount.customerName,
          amount: Number(settleAmount),
          paymentMethod: settleMethod.toLowerCase(),
          notes: settleNotes
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setSelectedCustomerAccount(null);
        showFeedback(res.data?.message || 'Payment recorded successfully!');
      } else if (selectedRecord) {
        const res = await axios.put(`${API_URL}/khata/${selectedRecord._id}/settle`, {
          amountReceived: Number(settleAmount),
          amount: Number(settleAmount),
          paymentMethod: settleMethod.toLowerCase(),
          notes: settleNotes
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setSelectedRecord(null);
        showFeedback(res.data?.message || 'Payment recorded successfully!');
      }
      fetchKhataRecords();
    } catch (err) {
      showFeedback(err.response?.data?.error || err.response?.data?.message || 'Failed to record payment.', true);
    } finally {
      setIsSettling(false);
    }
  };

  // Save New Khata Entry
  const handleCreateKhata = async (e) => {
    e.preventDefault();

    let effName = newCustomerName.trim();
    let effPhone = newCustomerPhone.trim();

    if (customerMode === 'existing' && currentSelectedCustomer) {
      effName = currentSelectedCustomer.customerName;
      effPhone = currentSelectedCustomer.customerPhone;
    }

    if (!effName) effName = 'Walk-in Guest';
    const cleanPhone = effPhone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone && cleanPhone.length >= 5 ? cleanPhone : (effPhone || 'N/A');

    if (effectiveTotalBill <= 0) {
      alert('Please add at least one item or enter a total purchase amount greater than 0.');
      return;
    }

    const validItems = lineItems
      .filter(it => it.name && it.name.trim())
      .map(it => ({
        name: it.name.trim(),
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || 0
      }));

    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/khata`, {
        tenantId,
        orderNumber: entryOrderNumber.trim(),
        customerName: effName,
        customerPhone: finalPhone,
        totalBill: effectiveTotalBill,
        paidAmount: effectivePaid,
        borrowAmount: newUdharAmount,
        notes: newNotes.trim(),
        items: validItems,
        date: entryDate,
        paidMethod: newPaidMethod
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setShowAddModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setSelectedCustomerChoice('NEW');
      setLineItems([]);
      setManualTotalBill('');
      setUseManualTotal(false);
      setNewPaidAmount('0');
      setNewPaidMethod('Cash');
      setEntryDate(new Date().toISOString().slice(0, 16));
      setEntryOrderNumber('');
      setDishSearch('');
      setCustomerSearchText('');
      setNewNotes('');

      showFeedback(res.data?.message || `Khata entry recorded for ${effName}!`);
      fetchKhataRecords();
    } catch (err) {
      showFeedback(err.response?.data?.error || err.response?.data?.message || 'Failed to create khata entry.', true);
    } finally {
      setIsCreating(false);
    }
  };

  // Generate WhatsApp Statement Link
  const getWhatsAppStatementLink = (cust) => {
    const cleanPhone = cust.customerPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) return null;
    const message = `Hello ${cust.customerName}! ✨\n\nHere is your Khata / Udhar account statement from our cafe:\n\n*Total Purchases: ₹${cust.totalPurchases.toLocaleString('en-IN')}*\n*Total Repaid: ₹${cust.totalPaid.toLocaleString('en-IN')}*\n*Current Outstanding Due: ₹${cust.outstandingBalance.toLocaleString('en-IN')}*\n\nThank you for your patronage! ☕🍕`;
    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Summary Metrics
  const totalOutstanding = records
    .filter(r => r.status !== 'settled')
    .reduce((acc, r) => acc + (Number(r.borrowAmount !== undefined ? r.borrowAmount : r.remainingAmount) || 0), 0);

  const totalPaid = records.reduce((acc, r) => acc + (Number(r.paidAmount) || 0), 0);

  const totalCreditExtended = records.reduce((acc, r) => {
    const bill = Number(r.totalBill !== undefined ? r.totalBill : r.totalBillAmount) ||
      ((Number(r.borrowAmount) || 0) + (Number(r.paidAmount) || 0));
    return acc + bill;
  }, 0);

  const activeCustomersWithDue = customerAccounts.filter(c => c.outstandingBalance > 0);

  // Filtered customer list
  const filteredCustomers = customerAccounts.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matches = !q || c.customerName.toLowerCase().includes(q) || c.customerPhone.includes(q);
    if (!matches) return false;
    if (statusFilter === 'pending') return c.outstandingBalance > 0;
    if (statusFilter === 'settled') return c.outstandingBalance === 0;
    return true;
  });

  // Filtered transactions list
  const filteredTransactions = records.filter(rec => {
    const q = searchQuery.toLowerCase().trim();
    const matches = !q || (rec.customerName || '').toLowerCase().includes(q) || String(rec.customerPhone || '').includes(q);
    if (!matches) return false;
    const due = Number(rec.borrowAmount !== undefined ? rec.borrowAmount : (rec.remainingAmount || 0));
    const isSettled = rec.status === 'settled' || due <= 0;
    if (statusFilter === 'pending') return !isSettled;
    if (statusFilter === 'settled') return isSettled;
    return true;
  });

  // Paginated customer accounts
  const totalCustomerPages = Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * CUSTOMERS_PER_PAGE;
    return filteredCustomers.slice(start, start + CUSTOMERS_PER_PAGE);
  }, [filteredCustomers, customerPage]);

  // Paginated transactions
  const totalTxPages = Math.ceil(filteredTransactions.length / TX_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (transactionPage - 1) * TX_PER_PAGE;
    return filteredTransactions.slice(start, start + TX_PER_PAGE);
  }, [filteredTransactions, transactionPage]);

  useEffect(() => {
    setCustomerPage(1);
    setTransactionPage(1);
  }, [searchQuery, statusFilter, viewMode]);

  return (
    <div className={styles.container}>
      {/* Native Browser Datalist of ALL 196+ Cafe Dishes */}
      <datalist id="all-cafe-dishes">
        {availableMenu.map((dish, i) => (
          <option key={i} value={dish.name}>{dish.name} (₹{dish.price})</option>
        ))}
      </datalist>

      {/* Toast Notification Banner */}
      {actionMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 10000,
          background: actionMessage.isError ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          {actionMessage.isError ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {khataMode === 'pos_menu' ? (
        <div className={styles.posScreen}>
          {/* Top Header Bar */}
          <div className={styles.posHeader}>
            <div className={styles.posHeaderLeft}>
              <button
                type="button"
                onClick={() => {
                  setKhataMode('ledger');
                  setActivePosCustomer(null);
                  setLineItems([]);
                }}
                className={styles.posBackBtn}
                title="Back to Khata Ledger"
              >
                <ArrowLeft size={16} />
                <span>{isHindi ? 'लेजर पर वापस जाएं' : 'Back to Ledger'}</span>
              </button>

              <div className={styles.posCustomerBadge}>
                <div
                  className={styles.posAvatar}
                  style={getAvatarStyle(activePosCustomer?.customerName || 'Customer')}
                >
                  {(activePosCustomer?.customerName || 'C').charAt(0).toUpperCase()}
                </div>
                <div className={styles.posCustomerInfo}>
                  <div className={styles.posCustomerNameRow}>
                    <span className={styles.posCustomerName}>
                      {activePosCustomer?.isNew ? (activePosCustomer?.customerName || 'New Customer') : (activePosCustomer?.customerName || 'Customer')}
                    </span>
                    <span className={styles.posDueBadge}>
                      ₹{(Number(activePosCustomer?.outstandingBalance) || 0).toLocaleString('en-IN')} Due
                    </span>
                  </div>
                  <div className={styles.posCustomerMeta}>
                    {activePosCustomer?.customerPhone && activePosCustomer?.customerPhone !== 'N/A' && (
                      <span className={styles.posCustomerPhone}>
                        <Phone size={11} /> {activePosCustomer.customerPhone}
                      </span>
                    )}
                    {activePosCustomer?.entriesCount > 0 && (
                      <span>• {activePosCustomer.entriesCount} visits</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Selector */}
              <div className={styles.posCustomerSelectorWrap}>
                <select
                  value={activePosCustomer?.isNew ? '__NEW__' : (activePosCustomer?.customerPhone !== 'N/A' ? activePosCustomer?.customerPhone : activePosCustomer?.customerName)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__NEW__') {
                      setIsNewCustomerInline(true);
                      setActivePosCustomer({ customerName: '', customerPhone: '', outstandingBalance: 0, isNew: true });
                    } else {
                      setIsNewCustomerInline(false);
                      const found = customerAccounts.find(c =>
                        (c.customerPhone !== 'N/A' && c.customerPhone === val) || c.customerName === val
                      );
                      if (found) setActivePosCustomer(found);
                    }
                  }}
                  className={styles.posCustomerSelect}
                >
                  <optgroup label="Select Existing Customer">
                    {customerAccounts.map(c => (
                      <option key={c.customerPhone + c.customerName} value={c.customerPhone !== 'N/A' ? c.customerPhone : c.customerName}>
                        {c.customerName} {c.customerPhone !== 'N/A' ? `(${c.customerPhone})` : ''} — Due: ₹{c.outstandingBalance.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </optgroup>
                  <option value="__NEW__">➕ New Customer (नया ग्राहक)</option>
                </select>
              </div>

              {(activePosCustomer?.isNew || isNewCustomerInline) && (
                <div className={styles.posNewCustomerInputs}>
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={activePosCustomer?.customerName || ''}
                    onChange={(e) => setActivePosCustomer(prev => ({ ...prev, customerName: e.target.value }))}
                    className={styles.posInlineInput}
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={activePosCustomer?.customerPhone || ''}
                    onChange={(e) => setActivePosCustomer(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className={styles.posInlineInput}
                  />
                </div>
              )}
            </div>

            <div className={styles.posHeaderRight}>
              <div className={styles.posSearchWrap}>
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder={isHindi ? "मेनू में खोजें..." : "Search dish on menu..."}
                  value={posDishSearch}
                  onChange={(e) => setPosDishSearch(e.target.value)}
                  className={styles.posSearchInput}
                />
                {posDishSearch && (
                  <button
                    type="button"
                    onClick={() => setPosDishSearch('')}
                    className={styles.posClearSearchBtn}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* POS Two-Column Grid */}
          <div className={styles.posMainGrid}>
            {/* Left Column: Visual Dishes Catalog */}
            <div className={styles.posMenuPanel}>
              {/* Category Pills */}
              <div
                className={styles.posCategoryPills}
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
              >
                {posCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`${styles.posCatPill} ${posSelectedCategory === cat ? styles.posCatPillActive : ''}`}
                    onClick={() => setPosSelectedCategory(cat)}
                  >
                    {cat === 'all'
                      ? 'All Dishes'
                      : cat.toLowerCase().includes('night')
                        ? `🌙 ${cat.replace('-', ' ')}`
                        : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Dishes Grid */}
              <div className={styles.posDishesGrid}>
                {posFilteredDishes.map(item => {
                  const inCart = lineItems.find(it => it.name.toLowerCase() === item.name.toLowerCase());
                  const cartQty = inCart ? (Number(inCart.quantity) || 0) : 0;
                  const imgUrl = getValidFoodImage(item);
                  const price = Number(item.price) || 0;

                  return (
                    <div
                      key={item._id || item.name}
                      className={`${styles.posDishCard} ${cartQty > 0 ? styles.posDishCardActive : ''}`}
                      onClick={() => handlePosQuickAdd(item)}
                    >
                      <div className={styles.posDishImgWrap}>
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className={styles.posDishImg}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                        <div className={styles.posVegBadge}>
                          <div className={item.isVeg ? styles.posVegDot : styles.posNonVegDot} />
                        </div>
                      </div>

                      <div className={styles.posDishInfo}>
                        <h4 title={item.name}>{item.name}</h4>
                      </div>

                      <div className={styles.posDishPriceRow}>
                        <span className={styles.posDishPrice}>₹{price}</span>
                        {cartQty > 0 ? (
                          <div className={styles.posStepper} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={styles.posStepperBtn}
                              onClick={(e) => handlePosDecrement(item, e)}
                              title="Decrease"
                            >
                              <Minus size={11} />
                            </button>
                            <span className={styles.posStepperQty}>{cartQty}</span>
                            <button
                              type="button"
                              className={styles.posStepperBtn}
                              onClick={(e) => { e.stopPropagation(); handlePosQuickAdd(item); }}
                              title="Increase"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.posAddBtn}
                            onClick={(e) => { e.stopPropagation(); handlePosQuickAdd(item); }}
                            title="Add to slip"
                          >
                            <Plus size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {posFilteredDishes.length === 0 && (
                  <div className={styles.posNoDishes}>
                    <Utensils size={36} color="#94a3b8" />
                    <p>No dishes found matching "{posDishSearch}".</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Customer Khata Slip */}
            <div className={styles.posSlipPanel}>
              {/* Slip Header */}
              <div className={styles.posSlipHeader}>
                <div>
                  <div className={styles.posSlipTitleRow}>
                    <h3 className={styles.posSlipTitle}>
                      {activePosCustomer?.customerName || 'Customer'} Order Slip
                    </h3>
                    <span className={styles.posSlipTypeTag}>Khata / Udhar</span>
                  </div>
                  <p className={styles.posSlipSubtitle}>
                    Selected items will be charged directly to customer ledger
                  </p>
                </div>
                <div className={styles.posSlipMetaRow}>
                  <input
                    type="text"
                    placeholder="Table / Token # (opt)"
                    value={entryOrderNumber}
                    onChange={(e) => setEntryOrderNumber(e.target.value)}
                    className={styles.posSlipMetaInput}
                  />
                  <input
                    type="datetime-local"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className={styles.posSlipDateInput}
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className={styles.posSlipItemsContainer}>
                {lineItems.length === 0 ? (
                  <div className={styles.posSlipEmpty}>
                    <ShoppingBag size={44} color="#cbd5e1" strokeWidth={1.5} />
                    <h4>Order Slip is Empty</h4>
                    <p>Click dishes on the menu to take order</p>
                  </div>
                ) : (
                  <div className={styles.posSlipItemsList}>
                    {lineItems.map((item, idx) => {
                      const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                      return (
                        <div key={idx} className={styles.posSlipItemRow}>
                          <div className={styles.posSlipItemLeft}>
                            <div className={item.isVeg ? styles.posVegDot : styles.posNonVegDot} style={{ flexShrink: 0 }} />
                            <div className={styles.posSlipItemDetails}>
                              <span className={styles.posSlipItemName}>{item.name}</span>
                              <span className={styles.posSlipItemRate}>₹{item.price} each</span>
                            </div>
                          </div>

                          <div className={styles.posSlipItemRight}>
                            <div className={styles.posStepper}>
                              <button
                                type="button"
                                className={styles.posStepperBtn}
                                onClick={() => handlePosDecrement(item)}
                              >
                                <Minus size={11} />
                              </button>
                              <span className={styles.posStepperQty}>{item.quantity}</span>
                              <button
                                type="button"
                                className={styles.posStepperBtn}
                                onClick={() => handlePosQuickAdd(item)}
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                            <span className={styles.posSlipItemTotal}>₹{itemTotal}</span>
                            <button
                              type="button"
                              onClick={() => handlePosRemoveItem(idx)}
                              className={styles.posSlipTrashBtn}
                              title="Remove dish"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Custom Dish Row */}
              <div className={styles.posAddCustomRow}>
                <button
                  type="button"
                  onClick={() => {
                    const customName = prompt('Enter dish name:');
                    if (!customName || !customName.trim()) return;
                    const customPrice = prompt('Enter dish price (₹):', '100');
                    if (customPrice === null) return;
                    setLineItems(prev => [
                      ...prev,
                      {
                        name: customName.trim(),
                        quantity: 1,
                        price: String(Number(customPrice) || 0),
                        isVeg: true
                      }
                    ]);
                  }}
                  className={styles.posAddCustomBtn}
                >
                  <Plus size={12} />
                  <span>+ Add Custom Item (Off-Menu)</span>
                </button>
              </div>

              {/* Slip Summary & Payment Controls */}
              {(() => {
                const grossTotal = lineItems.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
                const paidNum = Math.min(Math.max(0, Number(newPaidAmount) || 0), grossTotal);
                const newUdhar = Math.max(0, grossTotal - paidNum);
                const prevDue = Number(activePosCustomer?.outstandingBalance) || 0;
                const updatedDue = prevDue + newUdhar;

                return (
                  <div className={styles.posSlipFooter}>
                    {/* Gross Total */}
                    <div className={styles.posSlipTotalRow}>
                      <span>Gross Total:</span>
                      <span className={styles.posSlipTotalAmount}>₹{grossTotal}</span>
                    </div>

                    {/* Paid Now Section */}
                    <div className={styles.posPaidSection}>
                      <div className={styles.posPaidLabelRow}>
                        <label>Paid Now at Counter (₹):</label>
                        <div className={styles.posPaidChips}>
                          <button
                            type="button"
                            className={`${styles.posChip} ${newPaidAmount === '0' ? styles.posChipActive : ''}`}
                            onClick={() => setNewPaidAmount('0')}
                          >
                            ₹0 (Full Udhar)
                          </button>
                          <button
                            type="button"
                            className={styles.posChip}
                            onClick={() => setNewPaidAmount(String(Math.round(grossTotal / 2)))}
                          >
                            50%
                          </button>
                          <button
                            type="button"
                            className={`${styles.posChip} ${newPaidAmount === String(grossTotal) ? styles.posChipActive : ''}`}
                            onClick={() => setNewPaidAmount(String(grossTotal))}
                          >
                            Full Paid
                          </button>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={grossTotal}
                        value={newPaidAmount}
                        onChange={(e) => setNewPaidAmount(e.target.value)}
                        className={styles.posPaidInput}
                      />
                    </div>

                    {/* Payment Tender Method */}
                    {Number(newPaidAmount) > 0 && (
                      <div className={styles.posTenderRow}>
                        <label>Paid Via:</label>
                        <div className={styles.posTenderPills}>
                          {['Cash', 'UPI', 'Card'].map(m => (
                            <button
                              key={m}
                              type="button"
                              className={`${styles.posTenderPill} ${newPaidMethod === m ? styles.posTenderPillActive : ''}`}
                              onClick={() => setNewPaidMethod(m)}
                            >
                              {m === 'Cash' && <Banknote size={12} />}
                              {m === 'UPI' && <Smartphone size={12} />}
                              {m === 'Card' && <CreditCard size={12} />}
                              <span>{m}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Balance Impact Box */}
                    <div className={styles.posBalanceImpactBox}>
                      <div className={styles.posBalanceImpactRow}>
                        <span className={styles.posBalanceLabel}>New Udhar Added:</span>
                        <span className={styles.posBalanceValPositive}>+₹{newUdhar}</span>
                      </div>
                      <div className={styles.posBalanceImpactRow}>
                        <span className={styles.posBalanceLabel}>Previous Due:</span>
                        <span>₹{prevDue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={`${styles.posBalanceImpactRow} ${styles.posBalanceImpactTotal}`}>
                        <span className={styles.posBalanceLabel}>Updated Total Due:</span>
                        <span className={styles.posBalanceUpdatedVal}>₹{updatedDue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Notes input */}
                    <input
                      type="text"
                      placeholder="Note / Remark (optional, e.g. Table 4 or evening tea)"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className={styles.posNotesInput}
                    />

                    {/* Action Buttons */}
                    <div className={styles.posActionsRow}>
                      <button
                        type="button"
                        onClick={() => {
                          setKhataMode('ledger');
                          setActivePosCustomer(null);
                          setLineItems([]);
                        }}
                        className={styles.posCancelBtn}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmPosOrder}
                        disabled={isCreating || lineItems.length === 0}
                        className={styles.posConfirmBtn}
                      >
                        {isCreating ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Recording...</span>
                          </>
                        ) : (
                          <>
                            <Check size={16} />
                            <span>Confirm & Record ₹{newUdhar} to Khata</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* Top Header Bar */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>
            <BookOpen size={22} color="#2563eb" />
            {isHindi ? 'ग्राहक खाता बही (उधारी लेजर)' : 'Customer Khata & Credit Ledger'}
            <span className={styles.liveSyncBadge}>
              <span className={styles.liveSyncDot} />
              {isHindi ? 'लाइव सिंक' : 'Live Ledger'}
            </span>
          </h2>
          <p>{isHindi ? 'ग्राहकों की उधारी, खरीदारी एवं भुगतान का व्यक्तिगत हिसाब-किताब' : 'Person-specific running credit, dish purchases, and balance settlements'}</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.searchWrap}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={isHindi ? "नाम या फ़ोन से खोजें..." : "Search customer or phone..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchBar}
            />
          </div>

          <button
            type="button"
            onClick={fetchKhataRecords}
            className={styles.refreshBtn}
            title="Refresh Ledger"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => {
              if (customerAccounts.length > 0) {
                handleAddUdharForCustomer(customerAccounts[0]);
              } else {
                handleAddUdharForCustomer({ customerName: '', customerPhone: '', outstandingBalance: 0, isNew: true });
                setIsNewCustomerInline(true);
              }
            }}
            className={styles.addRecordBtn}
          >
            <Plus size={16} />
            <span>{isHindi ? '+ नया उधार जोड़ें' : '+ Add Customer Udhar'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertCircle size={20} />
          </div>
          <div className={styles.statInfo}>
            <h4>₹{totalOutstanding.toLocaleString('en-IN')}</h4>
            <span>{isHindi ? 'कुल बकाया उधारी' : 'Total Outstanding Dues'}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle size={20} />
          </div>
          <div className={styles.statInfo}>
            <h4>₹{totalPaid.toLocaleString('en-IN')}</h4>
            <span>{isHindi ? 'कुल वसूल/प्राप्त राशि' : 'Total Paid / Recovered'}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <User size={20} />
          </div>
          <div className={styles.statInfo}>
            <h4>{activeCustomersWithDue.length}</h4>
            <span>{isHindi ? 'उधार वाले सक्रिय ग्राहक' : 'Customers with Active Credit'}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#faf5ff', color: '#9333ea' }}>
            <ShoppingBag size={20} />
          </div>
          <div className={styles.statInfo}>
            <h4>₹{totalCreditExtended.toLocaleString('en-IN')}</h4>
            <span>{isHindi ? 'कुल उधारी पर खरीदारी' : 'Total Credit Extended'}</span>
          </div>
        </div>
      </div>

      {/* View Switcher & Status Filter Ribbon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        {/* View Mode Toggle: Customer Accounts vs Transaction Logs */}
        <div style={{ display: 'flex', background: '#e2e8f0', padding: 3, borderRadius: 9 }}>
          <button
            type="button"
            onClick={() => setViewMode('customers')}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: 'none',
              background: viewMode === 'customers' ? '#ffffff' : 'transparent',
              color: viewMode === 'customers' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: viewMode === 'customers' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={14} />
            <span>{isHindi ? 'ग्राहक खाते (Accounts)' : 'Customer Accounts'}</span>
            <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>
              {customerAccounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('transactions')}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: 'none',
              background: viewMode === 'transactions' ? '#ffffff' : 'transparent',
              color: viewMode === 'transactions' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: viewMode === 'transactions' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={14} />
            <span>{isHindi ? 'सभी प्रविष्टियां (History)' : 'All Transactions'}</span>
            <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>
              {records.length}
            </span>
          </button>
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'all', label: isHindi ? 'सभी' : 'All' },
            { key: 'pending', label: isHindi ? 'बकाया उधारी' : 'Pending Dues' },
            { key: 'settled', label: isHindi ? 'पूर्ण चुकता' : 'Fully Settled' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '6px 13px',
                borderRadius: 8,
                border: statusFilter === tab.key ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: statusFilter === tab.key ? '#eff6ff' : '#ffffff',
                color: statusFilter === tab.key ? '#1d4ed8' : '#475569',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: CUSTOMER ACCOUNTS TABLE */}
      {viewMode === 'customers' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.khataTable}>
              <thead>
                <tr>
                  <th>{isHindi ? 'ग्राहक विवरण' : 'Customer'}</th>
                  <th>{isHindi ? 'कुल खरीदारी' : 'Total Purchases'}</th>
                  <th>{isHindi ? 'कुल भुगतान' : 'Total Paid'}</th>
                  <th>{isHindi ? 'बकाया उधार' : 'Current Due'}</th>
                  <th>{isHindi ? 'ऑर्डर विज़िट्स' : 'Visits'}</th>
                  <th>{isHindi ? 'अंतिम सक्रियता' : 'Last Active'}</th>
                  <th style={{ textAlign: 'right' }}>{isHindi ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                      <User size={38} color="#cbd5e1" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155', display: 'block' }}>
                        {isHindi ? 'कोई ग्राहक खाता नहीं मिला' : 'No Customer Khata Accounts Found'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {isHindi ? 'नया उधार जोड़ने के लिए ऊपर दिए गए बटन का उपयोग करें' : 'Click "+ Add Customer Udhar" to start a customer credit account'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((cust) => {
                    const hasDue = cust.outstandingBalance > 0;
                    const waLink = getWhatsAppStatementLink(cust);
                    const avatarInfo = getAvatarStyle(cust.customerName);
                    const paidPercent = cust.totalPurchases > 0 ? Math.min(100, Math.round((cust.totalPaid / cust.totalPurchases) * 100)) : 100;

                    return (
                      <tr key={cust.customerPhone !== 'N/A' ? cust.customerPhone : cust.customerName}>
                        {/* Customer Avatar & Name & Phone */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: avatarInfo.bg,
                              color: avatarInfo.text,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '14.5px',
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                            }}>
                              {cust.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px', lineHeight: 1.2 }}>
                                {cust.customerName}
                              </div>
                              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>
                                📞 {cust.customerPhone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Total Purchases & Progress */}
                        <td>
                          <div>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>
                              ₹{cust.totalPurchases.toLocaleString('en-IN')}
                            </span>
                            <div className={styles.creditBarWrap} title={`${paidPercent}% repaid`}>
                              <div className={styles.creditBarPaid} style={{ width: `${paidPercent}%` }} />
                              <div className={styles.creditBarDue} style={{ width: `${100 - paidPercent}%` }} />
                            </div>
                            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600, display: 'block', marginTop: 2 }}>
                              {paidPercent}% settled
                            </span>
                          </div>
                        </td>

                        {/* Total Paid */}
                        <td>
                          <span style={{
                            fontWeight: 700,
                            color: '#15803d',
                            fontSize: '13px',
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            padding: '3px 8px',
                            borderRadius: 6
                          }}>
                            ₹{cust.totalPaid.toLocaleString('en-IN')} ✓
                          </span>
                        </td>

                        {/* Outstanding Due */}
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: '12.5px',
                            fontWeight: 800,
                            background: hasDue ? '#fef2f2' : '#f0fdf4',
                            color: hasDue ? '#dc2626' : '#16a34a',
                            border: hasDue ? '1px solid #fecaca' : '1px solid #bbf7d0'
                          }}>
                            ₹{cust.outstandingBalance.toLocaleString('en-IN')} {hasDue ? 'Due' : 'Settled'}
                          </span>
                        </td>

                        {/* Visits Count */}
                        <td>
                          <span style={{
                            background: '#f1f5f9',
                            color: '#475569',
                            padding: '3px 9px',
                            borderRadius: 12,
                            fontSize: '12px',
                            fontWeight: 700
                          }}>
                            {cust.entriesCount} visit{cust.entriesCount > 1 ? 's' : ''}
                          </span>
                        </td>

                        {/* Last Active */}
                        <td style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>
                          {new Date(cust.lastActivity).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setPassbookCustomer(cust)}
                              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                              title="View complete customer ledger passbook & bill history"
                            >
                              <BookOpen size={13} color="#2563eb" />
                              <span>{isHindi ? 'पासबुक' : 'Passbook'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAddUdharForCustomer(cust)}
                              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                              title="Add new purchase / borrow for this customer"
                            >
                              <Plus size={13} />
                              <span>{isHindi ? 'उधार' : 'Add'}</span>
                            </button>

                            {hasDue && (
                              <button
                                type="button"
                                onClick={() => handleOpenCustomerSettle(cust)}
                                className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                                title="Record payment towards outstanding due"
                              >
                                <Check size={13} />
                                <span>{isHindi ? 'जमा करें' : 'Settle'}</span>
                              </button>
                            )}

                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className={`${styles.actionBtn} ${styles.actionBtnWhatsapp}`}
                                title="Share statement on WhatsApp"
                              >
                                <MessageCircle size={14} />
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Customer Accounts Pagination Footer */}
          {filteredCustomers.length > 0 && (
            <div className={styles.paginationFooter}>
              <span>
                Showing {Math.min((customerPage - 1) * CUSTOMERS_PER_PAGE + 1, filteredCustomers.length)} – {Math.min(customerPage * CUSTOMERS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} customer accounts
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button
                  type="button"
                  disabled={customerPage <= 1}
                  onClick={() => setCustomerPage(prev => Math.max(1, prev - 1))}
                  className={styles.paginationBtn}
                >
                  <ChevronLeft size={13} /> Prev
                </button>

                {Array.from({ length: totalCustomerPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCustomerPage(p)}
                    className={styles.pageNumberBtn}
                    style={{
                      border: p === customerPage ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      background: p === customerPage ? '#2563eb' : '#ffffff',
                      color: p === customerPage ? '#ffffff' : '#334155'
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={customerPage >= totalCustomerPages}
                  onClick={() => setCustomerPage(prev => Math.min(totalCustomerPages, prev + 1))}
                  className={styles.paginationBtn}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: ALL TRANSACTIONS TABLE */}
      {viewMode === 'transactions' && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.khataTable}>
              <thead>
                <tr>
                  <th>{isHindi ? 'ग्राहक विवरण' : 'Customer'}</th>
                  <th>{isHindi ? 'व्यंजन / सामान' : 'Items Taken'}</th>
                  <th>{isHindi ? 'कुल बिल' : 'Total Bill'}</th>
                  <th>{isHindi ? 'भुगतान' : 'Paid Now'}</th>
                  <th>{isHindi ? 'बकाया उधार' : 'Udhar Due'}</th>
                  <th>{isHindi ? 'स्थिति' : 'Status'}</th>
                  <th>{isHindi ? 'दिनांक' : 'Date'}</th>
                  <th style={{ textAlign: 'right' }}>{isHindi ? 'कार्रवाई' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                      <Calendar size={38} color="#cbd5e1" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155', display: 'block' }}>
                        {isHindi ? 'कोई लेन-देन नहीं मिला' : 'No Transactions Recorded'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map(rec => {
                    const due = Number(rec.borrowAmount !== undefined ? rec.borrowAmount : (rec.remainingAmount || 0));
                    const isSettled = rec.status === 'settled' || due <= 0;

                    return (
                      <tr key={rec._id}>
                        {/* Customer */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: getAvatarStyle(rec.customerName).bg,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '12px',
                              flexShrink: 0,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                              {(rec.customerName || 'G').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ display: 'block', color: '#0f172a', fontSize: '13px' }}>{rec.customerName}</strong>
                              <span style={{ fontSize: '11.5px', color: '#64748b' }}>📞 {rec.customerPhone}</span>
                            </div>
                          </div>
                        </td>

                        {/* Items Taken */}
                        <td>
                          {rec.items && rec.items.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: '280px' }}>
                              {rec.items.map((it, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '11px',
                                    color: '#334155',
                                    background: '#f1f5f9',
                                    padding: '3px 7px',
                                    borderRadius: 5,
                                    border: '1px solid #e2e8f0',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {it.name} ×{it.quantity || 1}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                              {rec.notes || 'Counter Order'}
                            </span>
                          )}
                        </td>

                        {/* Total Bill */}
                        <td>
                          <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                            ₹{(Number(rec.totalBill) || 0).toLocaleString('en-IN')}
                          </strong>
                        </td>

                        {/* Paid Now */}
                        <td>
                          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>
                            ₹{(Number(rec.paidAmount) || 0).toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Udhar Due */}
                        <td>
                          <span style={{
                            color: due > 0 ? '#dc2626' : '#16a34a',
                            fontWeight: 800,
                            fontSize: '13px'
                          }}>
                            ₹{due.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: isSettled ? '#f0fdf4' : '#fef2f2',
                            color: isSettled ? '#16a34a' : '#dc2626',
                            border: isSettled ? '1px solid #bbf7d0' : '1px solid #fecaca'
                          }}>
                            {isSettled ? (isHindi ? 'चुकता ✓' : 'Settled') : (isHindi ? 'बकाया' : 'Pending')}
                          </span>
                        </td>

                        {/* Date */}
                        <td style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {new Date(rec.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>

                        {/* Action */}
                        <td style={{ textAlign: 'right' }}>
                          {!isSettled && (
                            <button
                              type="button"
                              onClick={() => handleOpenSettle(rec)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 6,
                                border: '1px solid #86efac',
                                background: '#f0fdf4',
                                color: '#15803d',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {isHindi ? 'भुगतान दर्ज करें' : 'Settle'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Transactions Pagination Footer */}
          {filteredTransactions.length > 0 && (
            <div className={styles.paginationFooter}>
              <span>
                Showing {Math.min((transactionPage - 1) * TX_PER_PAGE + 1, filteredTransactions.length)} – {Math.min(transactionPage * TX_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button
                  type="button"
                  disabled={transactionPage <= 1}
                  onClick={() => setTransactionPage(prev => Math.max(1, prev - 1))}
                  className={styles.paginationBtn}
                >
                  <ChevronLeft size={13} /> Prev
                </button>

                {Array.from({ length: totalTxPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTransactionPage(p)}
                    className={styles.pageNumberBtn}
                    style={{
                      border: p === transactionPage ? '1px solid #2563eb' : '1px solid #e2e8f0',
                      background: p === transactionPage ? '#2563eb' : '#ffffff',
                      color: p === transactionPage ? '#ffffff' : '#334155'
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={transactionPage >= totalTxPages}
                  onClick={() => setTransactionPage(prev => Math.min(totalTxPages, prev + 1))}
                  className={styles.paginationBtn}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD CUSTOMER KHATA / UDHAR ENTRY (WIDE 2-COLUMN ENTERPRISE SUITE) */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div
            className={`${styles.modalContent} ${styles.wideModal}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '840px',
              width: '95%',
              borderRadius: 18,
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '22px 26px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                    {isHindi ? 'ग्राहक उधार प्रविष्टि जोड़ें' : 'Add Customer Udhar / Khata Entry'}
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {isHindi ? 'व्यक्तिगत खाते में खरीदारी व उधारी जोड़ें एवं बकाया अपडेट करें' : 'Record person-specific credit, dish purchases, and balance settlements'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateKhata}>
              <div className={styles.modalBodyTwoCol}>
                {/* ── LEFT COLUMN: CUSTOMER & DISH ITEMIZATION ── */}
                <div>
                  {/* Segmented Customer Mode Switch: Existing vs New */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{
                      display: 'flex',
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: 3,
                      gap: 3
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerMode('existing');
                          if (customerAccounts.length > 0 && selectedCustomerChoice === 'NEW') {
                            const first = customerAccounts[0];
                            setSelectedCustomerChoice(first.customerPhone !== 'N/A' ? first.customerPhone : first.customerName);
                            setNewCustomerName(first.customerName);
                            setNewCustomerPhone(first.customerPhone !== 'N/A' ? first.customerPhone : '');
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: 'none',
                          outline: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: '12px',
                          fontWeight: 700,
                          background: customerMode === 'existing' ? '#ffffff' : 'transparent',
                          color: customerMode === 'existing' ? '#0f172a' : '#64748b',
                          boxShadow: customerMode === 'existing' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <User size={13} />
                        <span>{isHindi ? 'मौजूदा ग्राहक' : 'Existing Customer'} ({customerAccounts.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCustomerMode('new');
                          setSelectedCustomerChoice('NEW');
                          setNewCustomerName('');
                          setNewCustomerPhone('');
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: 'none',
                          outline: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: '12px',
                          fontWeight: 700,
                          background: customerMode === 'new' ? '#ffffff' : 'transparent',
                          color: customerMode === 'new' ? '#0f172a' : '#64748b',
                          boxShadow: customerMode === 'new' ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Plus size={13} />
                        <span>{isHindi ? 'नया ग्राहक' : 'New Customer'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Selection: Existing */}
                  {customerMode === 'existing' && (
                    <div style={{ marginBottom: 14 }}>
                      {customerAccounts.length === 0 ? (
                        <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                          {isHindi ? 'कोई पुराना खाता नहीं है। कृपया "नया ग्राहक" चुनें।' : 'No existing customers found. Switch to "New Customer" to create one.'}
                        </div>
                      ) : (
                        <>
                          {/* Live search input if customer list has > 3 entries */}
                          {customerAccounts.length > 3 && (
                            <div style={{ position: 'relative', marginBottom: 6 }}>
                              <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                              <input
                                type="text"
                                placeholder={isHindi ? "नाम या फ़ोन से ग्राहक खोजें..." : "Filter customer by name or phone..."}
                                value={customerSearchText}
                                onChange={(e) => setCustomerSearchText(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '7px 10px 7px 30px',
                                  borderRadius: 7,
                                  border: '1px solid #cbd5e1',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          )}

                          <select
                            value={selectedCustomerChoice}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedCustomerChoice(val);
                              const found = customerAccounts.find(c => (c.customerPhone !== 'N/A' && c.customerPhone === val) || c.customerName === val);
                              if (found) {
                                setNewCustomerName(found.customerName);
                                setNewCustomerPhone(found.customerPhone !== 'N/A' ? found.customerPhone : '');
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1.5px solid #cbd5e1',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              background: '#ffffff',
                              color: '#0f172a',
                              boxSizing: 'border-box',
                              outline: 'none'
                            }}
                          >
                            {filteredCustomerAccounts.map((c, i) => (
                              <option key={i} value={c.customerPhone !== 'N/A' ? c.customerPhone : c.customerName}>
                                {c.customerName} {c.customerPhone !== 'N/A' ? `(${c.customerPhone})` : ''} — {c.outstandingBalance > 0 ? `Due: ₹${c.outstandingBalance.toLocaleString('en-IN')}` : 'Nil Due'}
                              </option>
                            ))}
                          </select>

                          {/* Selected Customer Profile Card */}
                          {currentSelectedCustomer && (
                            <div className={styles.custCardSelected}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  background: getAvatarStyle(currentSelectedCustomer.customerName).bg,
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '16px',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                                }}>
                                  {currentSelectedCustomer.customerName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>
                                    {currentSelectedCustomer.customerName}
                                  </strong>
                                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                                    📞 {currentSelectedCustomer.customerPhone} &nbsp;•&nbsp; {currentSelectedCustomer.entriesCount} visit{currentSelectedCustomer.entriesCount > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                                  {isHindi ? 'वर्तमान बकाया' : 'Current Due'}
                                </span>
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  color: currentSelectedCustomer.outstandingBalance > 0 ? '#dc2626' : '#16a34a',
                                  background: currentSelectedCustomer.outstandingBalance > 0 ? '#fef2f2' : '#f0fdf4',
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  border: currentSelectedCustomer.outstandingBalance > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0',
                                  display: 'inline-block',
                                  marginTop: 2
                                }}>
                                  ₹{currentSelectedCustomer.outstandingBalance.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Customer Selection: New */}
                  {customerMode === 'new' && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                            {isHindi ? 'मोबाइल नंबर (10 अंक)' : 'Customer Phone (10 digits)'}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <Phone size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                              type="tel"
                              placeholder="e.g. 9876543210"
                              value={newCustomerPhone}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setNewCustomerPhone(val);
                                const match = customerAccounts.find(c => c.customerPhone === val);
                                if (match && !newCustomerName) {
                                  setNewCustomerName(match.customerName);
                                }
                              }}
                              style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                            {isHindi ? 'ग्राहक का नाम' : 'Customer Name'}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <User size={13} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                              type="text"
                              placeholder="e.g. Rahul Sharma"
                              value={newCustomerName}
                              onChange={(e) => setNewCustomerName(e.target.value)}
                              style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      </div>

                      {matchedExistingCustomer && (
                        <div style={{
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          borderRadius: 8,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px'
                        }}>
                          <span style={{ color: '#1e40af' }}>
                            💡 Found existing: <strong>{matchedExistingCustomer.customerName}</strong> (₹{matchedExistingCustomer.outstandingBalance} Due)
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerMode('existing');
                              setSelectedCustomerChoice(matchedExistingCustomer.customerPhone !== 'N/A' ? matchedExistingCustomer.customerPhone : matchedExistingCustomer.customerName);
                            }}
                            style={{
                              background: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '3px 9px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Use Account
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── PURCHASE DETAILS / ITEMIZATION ── */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Utensils size={14} color="#2563eb" />
                        {isHindi ? 'खरीदारी विवरण (Dishes / Bill)' : 'Purchase & Dish Breakdown'}
                      </label>

                      <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '7px', border: '1px solid #e2e8f0' }}>
                        <button
                          type="button"
                          onClick={() => setUseManualTotal(false)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '5px',
                            border: 'none',
                            outline: 'none',
                            background: !useManualTotal ? '#ffffff' : 'transparent',
                            color: !useManualTotal ? '#0f172a' : '#64748b',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: !useManualTotal ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                          }}
                        >
                          🍽️ {isHindi ? 'मेन्यू से' : 'From Menu'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseManualTotal(true)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '5px',
                            border: 'none',
                            outline: 'none',
                            background: useManualTotal ? '#ffffff' : 'transparent',
                            color: useManualTotal ? '#0f172a' : '#64748b',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: useManualTotal ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                          }}
                        >
                          💰 {isHindi ? 'सीधा बिल' : 'Direct Total'}
                        </button>
                      </div>
                    </div>

                    {!useManualTotal ? (
                      <div className={styles.itemsCartBox}>
                        {/* Live Dish Filter & Category Dropdown */}
                        <div style={{ padding: '8px 10px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <Search size={12} color="#94a3b8" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                              <input
                                type="text"
                                placeholder={isHindi ? "व्यंजन खोजें (उदा. चाय, बर्गर)..." : "Filter dish (e.g. coffee, sandwich)..."}
                                value={dishSearch}
                                onChange={(e) => setDishSearch(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '6px 8px 6px 26px',
                                  borderRadius: 6,
                                  border: '1px solid #cbd5e1',
                                  fontSize: '11.5px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>

                            <select
                              onChange={(e) => {
                                handleQuickAddDish(e.target.value);
                                e.target.value = "";
                              }}
                              style={{
                                flex: 1.6,
                                padding: '6px 10px',
                                borderRadius: 6,
                                border: '1.5px solid #cbd5e1',
                                background: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#0f172a',
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>
                                ➕ {isHindi ? 'मेन्यू से जोड़ें...' : `+ Pick dish (${filteredAvailableMenu.length} matches)...`}
                              </option>
                              {Object.entries(groupedFilteredMenu).map(([categoryName, dishes]) => (
                                <optgroup key={categoryName} label={`📂 ${categoryName}`}>
                                  {dishes.map(d => (
                                    <option key={d._id || d.id} value={d._id || d.id}>
                                      {d.name} — ₹{d.price}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Cart items list */}
                        {lineItems.length === 0 ? (
                          <div className={styles.cartEmpty}>
                            <Utensils size={24} color="#cbd5e1" />
                            <span>{isHindi ? 'ऊपर मेन्यू से व्यंजन चुनें या नीचे कस्टम आइटम जोड़ें' : 'No items added yet. Pick dishes from the dropdown above'}</span>
                          </div>
                        ) : (
                          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            {lineItems.map((item, idx) => {
                              const qty = Number(item.quantity) || 1;
                              const pr = Number(item.price) || 0;
                              const lineTotal = qty * pr;

                              return (
                                <div key={idx} className={styles.cartRow}>
                                  <input
                                    type="text"
                                    list="all-cafe-dishes"
                                    placeholder="Dish name..."
                                    value={item.name}
                                    onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                    style={{ flex: 2, padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
                                  />

                                  {/* Quantity Stepper */}
                                  <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                                    <button
                                      type="button"
                                      onClick={() => handleItemChange(idx, 'quantity', Math.max(1, qty - 1))}
                                      style={{ width: 22, height: 26, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                      <Minus size={11} />
                                    </button>
                                    <span style={{ minWidth: 22, textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleItemChange(idx, 'quantity', qty + 1)}
                                      style={{ width: 22, height: 26, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                      <Plus size={11} />
                                    </button>
                                  </div>

                                  {/* Unit Price */}
                                  <div style={{ position: 'relative', width: '65px' }}>
                                    <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#64748b' }}>₹</span>
                                    <input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={item.price}
                                      onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                                      style={{ width: '100%', padding: '5px 6px 5px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '12px', textAlign: 'right', boxSizing: 'border-box' }}
                                    />
                                  </div>

                                  {/* Line Total */}
                                  <div style={{ minWidth: '45px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                                    ₹{lineTotal}
                                  </div>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItemRow(idx)}
                                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                                    title="Remove item"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Footer add custom row */}
                        <div style={{ padding: '6px 10px', background: '#fafbfc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleAddItemRow()}
                            style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Plus size={12} />
                            {isHindi ? 'कस्टम आइटम जोड़ें' : 'Add custom item'}
                          </button>

                          {lineItems.length > 0 && (
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                              {lineItems.length} item{lineItems.length > 1 ? 's' : ''} added
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Direct Total Amount Input */
                      <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                          {isHindi ? 'सीधा कुल बिल राशि दर्ज करें (₹)' : 'Enter Total Bill Amount (₹)'}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: 800, color: '#64748b' }}>₹</span>
                          <input
                            type="number"
                            min="1"
                            placeholder="0"
                            value={manualTotalBill}
                            onChange={(e) => setManualTotalBill(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 12px 10px 30px',
                              borderRadius: 8,
                              border: '1.5px solid #cbd5e1',
                              fontSize: '18px',
                              fontWeight: 800,
                              color: '#0f172a',
                              boxSizing: 'border-box',
                              outline: 'none'
                            }}
                          />
                        </div>

                        {/* Quick Amount Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {[50, 100, 150, 200, 300, 500, 1000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setManualTotalBill(String(amt))}
                              className={`${styles.chipBtn} ${Number(manualTotalBill) === amt ? styles.chipBtnActive : ''}`}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT COLUMN: FINANCIALS, TENDER, IMPACT & SUBMIT ── */}
                <div className={styles.rightColumnCard}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
                    {isHindi ? 'भुगतान एवं लेजर प्रभाव' : 'Payment & Ledger Terms'}
                  </div>

                  {/* Bill & Paid Now Hero */}
                  <div className={styles.billHeroBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                        {isHindi ? 'कुल बिल राशि' : 'Total Purchase Bill:'}
                      </span>
                      <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                        ₹{effectiveTotalBill.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#16a34a', marginBottom: 3 }}>
                        {isHindi ? 'अभी प्राप्त भुगतान (₹)' : 'Paid Now at Counter (₹)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={effectiveTotalBill}
                        placeholder="0"
                        value={newPaidAmount}
                        onChange={(e) => setNewPaidAmount(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: '1.5px solid #86efac',
                          fontSize: '14px',
                          fontWeight: 800,
                          color: '#15803d',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />

                      {/* Quick paid chips */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                        <button
                          type="button"
                          onClick={() => setNewPaidAmount('0')}
                          className={`${styles.chipBtn} ${newPaidAmount === '0' || newPaidAmount === '' ? styles.chipBtnActive : ''}`}
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                        >
                          ₹0 (Full Udhar)
                        </button>
                        {effectiveTotalBill >= 100 && (
                          <button
                            type="button"
                            onClick={() => setNewPaidAmount(String(Math.round(effectiveTotalBill / 2)))}
                            className={`${styles.chipBtn} ${Number(newPaidAmount) === Math.round(effectiveTotalBill / 2) ? styles.chipBtnActive : ''}`}
                            style={{ fontSize: '10px', padding: '2px 6px' }}
                          >
                            50% (₹{Math.round(effectiveTotalBill / 2)})
                          </button>
                        )}
                        {effectiveTotalBill > 0 && (
                          <button
                            type="button"
                            onClick={() => setNewPaidAmount(String(effectiveTotalBill))}
                            className={`${styles.chipBtn} ${Number(newPaidAmount) === effectiveTotalBill ? styles.chipBtnActive : ''}`}
                            style={{ fontSize: '10px', padding: '2px 6px' }}
                          >
                            Full Paid
                          </button>
                        )}
                      </div>

                      {/* Tender Mode for Paid Amount (Cash / UPI / Card) */}
                      {Number(newPaidAmount) > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            {isHindi ? 'प्राप्त राशि का माध्यम:' : 'Tender Method for Paid Amount:'}
                          </span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {[
                              { id: 'Cash', label: 'Cash' },
                              { id: 'UPI', label: 'UPI / QR' },
                              { id: 'Card', label: 'Card' }
                            ].map(m => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setNewPaidMethod(m.id)}
                                style={{
                                  flex: 1,
                                  padding: '4px',
                                  borderRadius: 5,
                                  border: newPaidMethod === m.id ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                                  background: newPaidMethod === m.id ? '#f0fdf4' : '#ffffff',
                                  color: newPaidMethod === m.id ? '#15803d' : '#475569',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calculated Udhar Added & Balance Impact Banner */}
                  {(() => {
                    const prevDue = currentSelectedCustomer ? Number(currentSelectedCustomer.outstandingBalance || 0) : 0;
                    const updatedBalance = prevDue + newUdharAmount;

                    return (
                      <div className={styles.balanceImpactCard}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 600 }}>
                            {isHindi ? 'खाते में नया उधार' : 'New Udhar Added:'}
                          </span>
                          <strong style={{ color: newUdharAmount > 0 ? '#dc2626' : '#16a34a', fontSize: '15px' }}>
                            +₹{newUdharAmount.toLocaleString('en-IN')}
                          </strong>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px', fontWeight: 600 }}>
                            {isHindi ? 'अपडेटेड कुल बकाया' : 'Updated Total Due:'}
                          </span>
                          <strong style={{ color: '#0f172a', fontSize: '15px' }}>
                            ₹{updatedBalance.toLocaleString('en-IN')}
                          </strong>
                          {prevDue > 0 && (
                            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>
                              (Prev: ₹{prevDue.toLocaleString('en-IN')})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Order & Khata Metadata Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: 2 }}>
                        {isHindi ? 'दिनांक व समय' : 'Date & Time'}
                      </label>
                      <input
                        type="datetime-local"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '11px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#475569', marginBottom: 2 }}>
                        {isHindi ? 'टेबल / टोकन नंबर' : 'Table / Token #'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Table 4"
                        value={entryOrderNumber}
                        onChange={(e) => setEntryOrderNumber(e.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Optional Note */}
                  <div style={{ marginBottom: 14 }}>
                    <input
                      type="text"
                      placeholder={isHindi ? "टिप्पणी (उदा. शाम का नाश्ता / ऑफिस ग्रुप)" : "Note / Remark (e.g. evening tea snack)"}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '12px', color: '#475569' }}
                    >
                      {isHindi ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || effectiveTotalBill <= 0}
                      style={{
                        flex: 2,
                        padding: '10px',
                        borderRadius: 8,
                        border: 'none',
                        background: effectiveTotalBill > 0
                          ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                          : '#cbd5e1',
                        color: '#ffffff',
                        fontWeight: 800,
                        cursor: effectiveTotalBill > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '12.5px',
                        boxShadow: effectiveTotalBill > 0 ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
                      }}
                    >
                      {isCreating
                        ? (isHindi ? 'दर्ज हो रहा है...' : 'Recording...')
                        : (isHindi ? `₹${newUdharAmount} उधार जोड़ें` : `Confirm & Add ₹${newUdharAmount}`)}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT / SETTLEMENT */}
      {(selectedRecord || selectedCustomerAccount) && (() => {
        const custName = selectedCustomerAccount ? selectedCustomerAccount.customerName : (selectedRecord?.customerName || 'Customer');
        const custPhone = selectedCustomerAccount ? selectedCustomerAccount.customerPhone : (selectedRecord?.customerPhone || 'N/A');
        const currentDue = selectedCustomerAccount
          ? selectedCustomerAccount.outstandingBalance
          : Number(selectedRecord?.borrowAmount !== undefined ? selectedRecord.borrowAmount : (selectedRecord?.remainingAmount || 0));
        const amountNum = Number(settleAmount) || 0;
        const remainingAfterPay = Math.max(0, currentDue - amountNum);

        const merchantUpi = tenantInfo?.settings?.upiId || tenantInfo?.upiId || 'cafe@upi';
        const upiUri = `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(tenantInfo?.name || 'Cafe Khata')}&am=${amountNum}&cu=INR&tn=${encodeURIComponent(`Khata Settlement - ${custName}`)}`;

        return (
          <div className={styles.modalOverlay} onClick={() => { setSelectedRecord(null); setSelectedCustomerAccount(null); }}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      {isHindi ? 'उधार भुगतान दर्ज करें' : 'Record Payment / Settlement'}
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {isHindi ? 'खाते में राशि जमा कर बकाया घटाएं' : 'Credit repayment towards customer dues'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedRecord(null); setSelectedCustomerAccount(null); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmSettle}>
                {/* Customer Outstanding Due Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  padding: '12px 14px',
                  borderRadius: 10,
                  marginBottom: 12,
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{isHindi ? 'ग्राहक:' : 'Customer:'}</div>
                    <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{custName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {custPhone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>{isHindi ? 'वर्तमान बकाया' : 'Current Due'}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#dc2626' }}>
                      ₹{currentDue.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Amount Received Input */}
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    {isHindi ? 'प्राप्त राशि (₹)' : 'Amount Received (₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={currentDue}
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #16a34a',
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />

                  {/* Quick Amount Chips */}
                  <div className={styles.chipsRow}>
                    <button
                      type="button"
                      onClick={() => setSettleAmount(String(currentDue))}
                      className={`${styles.chipBtn} ${amountNum === currentDue ? styles.chipBtnActive : ''}`}
                    >
                      {isHindi ? 'पूरा' : 'Full'}: ₹{currentDue.toLocaleString('en-IN')}
                    </button>
                    {currentDue >= 200 && (
                      <button
                        type="button"
                        onClick={() => setSettleAmount(String(Math.round(currentDue / 2)))}
                        className={`${styles.chipBtn} ${amountNum === Math.round(currentDue / 2) ? styles.chipBtnActive : ''}`}
                      >
                        50%: ₹{Math.round(currentDue / 2).toLocaleString('en-IN')}
                      </button>
                    )}
                    {[100, 200, 500, 1000].filter(a => a < currentDue).map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSettleAmount(String(amt))}
                        className={`${styles.chipBtn} ${amountNum === amt ? styles.chipBtnActive : ''}`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    {isHindi ? 'भुगतान माध्यम' : 'Payment Method'}
                  </label>
                  <div style={{ display: 'flex', gap: 7 }}>
                    {[
                      { id: 'Cash', label: 'Cash', icon: Banknote },
                      { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                      { id: 'Card', label: 'Card', icon: CreditCard }
                    ].map(m => {
                      const IconComp = m.icon;
                      const isSelected = settleMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSettleMethod(m.id)}
                          className={`${styles.methodCard} ${isSelected ? styles.methodCardActive : ''}`}
                        >
                          <IconComp size={16} />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Dynamic UPI QR Code Box */}
                {settleMethod === 'UPI' && (
                  <div className={styles.upiBox}>
                    <div className={styles.qrContainer}>
                      <QRCodeCanvas value={upiUri} size={140} level="M" />
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>
                      {isHindi ? 'ग्राहक से QR स्कैन करवाएं' : 'Customer Scans to Pay'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      GPay • PhonePe • Paytm • BHIM
                    </div>
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', padding: '3px 8px', borderRadius: 4, border: '1px solid #bbf7d0' }}>
                      <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 700 }}>
                        UPI ID: {merchantUpi}
                      </span>
                    </div>
                  </div>
                )}

                {/* Remaining Balance Indicator */}
                <div style={{
                  background: remainingAfterPay === 0 ? '#f0fdf4' : '#fffbeb',
                  border: remainingAfterPay === 0 ? '1px solid #bbf7d0' : '1px solid #fef3c7',
                  borderRadius: 8,
                  padding: '7px 10px',
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px'
                }}>
                  <span style={{ color: remainingAfterPay === 0 ? '#15803d' : '#92400e', fontWeight: 700 }}>
                    {remainingAfterPay === 0
                      ? (isHindi ? '🎉 यह खाता पूरी तरह चुकता हो जाएगा!' : '🎉 Account will be 100% cleared!')
                      : (isHindi ? 'भुगतान के बाद शेष बकाया:' : 'Remaining balance after pay:')}
                  </span>
                  <strong style={{ color: remainingAfterPay === 0 ? '#15803d' : '#b45309', fontSize: '13px' }}>
                    ₹{remainingAfterPay.toLocaleString('en-IN')}
                  </strong>
                </div>

                {/* Optional Note */}
                <div style={{ marginBottom: 14 }}>
                  <input
                    type="text"
                    placeholder={isHindi ? "भुगतान टिप्पणी (उदा. GPay Ref / Cash)" : "Payment note (e.g. GPay / Cash at counter)"}
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => { setSelectedRecord(null); setSelectedCustomerAccount(null); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer', fontSize: '12px', color: '#475569' }}
                  >
                    {isHindi ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSettling || amountNum <= 0}
                    style={{
                      flex: 2,
                      padding: '10px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                    }}
                  >
                    {isSettling ? (isHindi ? 'दर्ज हो रहा है...' : 'Recording...') : (isHindi ? `₹${amountNum} जमा करें` : `Confirm ₹${amountNum} Paid`)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL 3: CUSTOMER DIGITAL PASSBOOK & FULL TIMELINE */}
      {passbookCustomer && (() => {
        const customerHistory = records
          .filter(r => (r.customerPhone && r.customerPhone !== 'N/A' && r.customerPhone === passbookCustomer.customerPhone) || r.customerName === passbookCustomer.customerName)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const waLink = getWhatsAppStatementLink(passbookCustomer);

        return (
          <div className={styles.modalOverlay} onClick={() => setPassbookCustomer(null)}>
            <div className={`${styles.modalContent} ${styles.passbookModal} printablePassbook`} onClick={(e) => e.stopPropagation()}>
              {/* Passbook Top Bar */}
              <div className="noPrint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={20} color="#2563eb" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    {isHindi ? 'ग्राहक डिजिटल पासबुक' : 'Customer Digital Passbook'}
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                    title="Print Passbook Statement"
                  >
                    <Printer size={13} />
                    <span>{isHindi ? 'प्रिंट' : 'Print'}</span>
                  </button>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className={`${styles.actionBtn} ${styles.actionBtnWhatsapp}`}
                      title="Send statement on WhatsApp"
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPassbookCustomer(null)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Passbook Customer Header Card */}
              <div className={styles.passbookHeaderCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: getAvatarStyle(passbookCustomer.customerName).bg,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '18px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      {passbookCustomer.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                        {passbookCustomer.customerName}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        📞 {passbookCustomer.customerPhone} &nbsp;•&nbsp; {passbookCustomer.entriesCount} visit{passbookCustomer.entriesCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="noPrint" style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const cust = passbookCustomer;
                        setPassbookCustomer(null);
                        handleAddUdharForCustomer(cust);
                      }}
                      className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                      style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.25)' }}
                    >
                      <Plus size={13} />
                      <span>{isHindi ? '+ नया उधार' : '+ Add Udhar'}</span>
                    </button>

                    {passbookCustomer.outstandingBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const cust = passbookCustomer;
                          setPassbookCustomer(null);
                          handleOpenCustomerSettle(cust);
                        }}
                        className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                        style={{ background: '#22c55e', color: '#ffffff', borderColor: '#16a34a' }}
                      >
                        <Check size={13} />
                        <span>{isHindi ? 'जमा करें' : 'Settle Due'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3 Metric Tiles */}
                <div className={styles.passbookSummaryGrid}>
                  <div className={styles.passbookSummaryTile}>
                    <h5>₹{passbookCustomer.totalPurchases.toLocaleString('en-IN')}</h5>
                    <span>{isHindi ? 'कुल खरीदारी' : 'Total Purchases'}</span>
                  </div>
                  <div className={styles.passbookSummaryTile}>
                    <h5 style={{ color: '#4ade80' }}>₹{passbookCustomer.totalPaid.toLocaleString('en-IN')}</h5>
                    <span>{isHindi ? 'कुल चुकता' : 'Total Paid'}</span>
                  </div>
                  <div className={styles.passbookSummaryTile} style={{ background: passbookCustomer.outstandingBalance > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)', borderColor: passbookCustomer.outstandingBalance > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)' }}>
                    <h5 style={{ color: passbookCustomer.outstandingBalance > 0 ? '#fca5a5' : '#4ade80' }}>
                      ₹{passbookCustomer.outstandingBalance.toLocaleString('en-IN')}
                    </h5>
                    <span>{isHindi ? 'बकाया उधार' : 'Current Due'}</span>
                  </div>
                </div>
              </div>

              {/* Passbook Chronological Ledger Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569' }}>
                    {isHindi ? 'खाता विवरण व लेन-देन इतिहास' : 'Detailed Ledger Statement & History'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    {customerHistory.length} transaction{customerHistory.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <table className={styles.passbookTable}>
                    <thead>
                      <tr>
                        <th>{isHindi ? 'दिनांक' : 'Date'}</th>
                        <th>{isHindi ? 'विवरण / व्यंजन' : 'Particulars / Items'}</th>
                        <th>{isHindi ? 'कुल बिल' : 'Total Bill'}</th>
                        <th>{isHindi ? 'भुगतान' : 'Paid'}</th>
                        <th>{isHindi ? 'उधार (बकाया)' : 'Udhar Due'}</th>
                        <th>{isHindi ? 'स्थिति' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                            {isHindi ? 'कोई लेन-देन नहीं मिला' : 'No Transactions Found'}
                          </td>
                        </tr>
                      ) : (
                        customerHistory.map((rec) => {
                          const due = Number(rec.borrowAmount !== undefined ? rec.borrowAmount : (rec.remainingAmount || 0));
                          const isSettled = rec.status === 'settled' || due <= 0;

                          return (
                            <tr key={rec._id}>
                              <td style={{ whiteSpace: 'nowrap', fontSize: '11.5px', color: '#64748b' }}>
                                <div style={{ fontWeight: 700, color: '#334155' }}>
                                  {new Date(rec.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                  {new Date(rec.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>

                              <td>
                                {rec.items && rec.items.length > 0 ? (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: '240px' }}>
                                    {rec.items.map((it, idx) => (
                                      <span
                                        key={idx}
                                        style={{
                                          fontSize: '11px',
                                          color: '#334155',
                                          background: '#f1f5f9',
                                          padding: '2px 6px',
                                          borderRadius: 4,
                                          border: '1px solid #e2e8f0',
                                          fontWeight: 600
                                        }}
                                      >
                                        {it.name} ×{it.quantity || 1}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                    {rec.notes || 'Order purchase'}
                                  </span>
                                )}

                                {/* Settlement history breakdown if any repayments were recorded on this ticket */}
                                {rec.settlementHistory && rec.settlementHistory.length > 0 && (
                                  <div style={{ marginTop: 6, paddingLeft: 8, borderLeft: '2px solid #86efac' }}>
                                    {rec.settlementHistory.map((sh, sIdx) => (
                                      <div key={sIdx} style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 600 }}>
                                        ✓ Repaid ₹{sh.amount} via {sh.paymentMethod?.toUpperCase()} on {new Date(sh.settledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>

                              <td>
                                <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>
                                  ₹{(Number(rec.totalBill) || 0).toLocaleString('en-IN')}
                                </strong>
                              </td>

                              <td>
                                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '12px' }}>
                                  ₹{(Number(rec.paidAmount) || 0).toLocaleString('en-IN')}
                                </span>
                              </td>

                              <td>
                                <span style={{ color: due > 0 ? '#dc2626' : '#16a34a', fontWeight: 800, fontSize: '12.5px' }}>
                                  ₹{due.toLocaleString('en-IN')}
                                </span>
                              </td>

                              <td>
                                <span style={{
                                  padding: '2px 7px',
                                  borderRadius: 4,
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  background: isSettled ? '#f0fdf4' : '#fef2f2',
                                  color: isSettled ? '#16a34a' : '#dc2626',
                                  border: isSettled ? '1px solid #bbf7d0' : '1px solid #fecaca'
                                }}>
                                  {isSettled ? 'Settled ✓' : 'Due'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer print stamp */}
              <div style={{ marginTop: 14, textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
                {tenantInfo?.name || 'Cafe Application'} • Customer Khata Ledger Statement • Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        );
      })()}
        </>
      )}
    </div>
  );
}
