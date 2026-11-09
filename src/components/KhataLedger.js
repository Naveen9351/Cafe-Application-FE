import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Search, CheckCircle, AlertCircle, Check, X, Phone, User, Plus,
  RefreshCw, Calendar, ArrowUpRight, MessageCircle, Trash2, ShoppingBag, CreditCard,
  ChevronRight, ChevronLeft, Utensils, Minus
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useTranslation } from '../utils/translations';
import styles from './KhataLedger.module.css';

export default function KhataLedger({ menuItems = [], tenantId }) {
  const { t, isHindi } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'settled'
  const [viewMode, setViewMode] = useState('customers'); // 'customers' or 'transactions'

  // Full Cafe Menu Catalog from Database
  const [availableMenu, setAvailableMenu] = useState([]);

  // Fetch full database menu (all dishes across all categories)
  useEffect(() => {
    const fetchFullMenu = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch full database menu without restricting by tenant to ensure all items are available
        const res = await axios.get(`${API_URL}/menu?includeUnavailable=true&includePosOnly=true`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        const list = Array.isArray(res.data) ? res.data : [];
        const menuMap = new Map();

        // Add fetched items deduplicated by lowercase name
        list.forEach(item => {
          if (item && item.name) {
            const key = item.name.toLowerCase().trim();
            if (!menuMap.has(key)) {
              menuMap.set(key, {
                ...item,
                price: Number(item.price) || 0
              });
            }
          }
        });

        // Also merge any items passed from parent props
        (menuItems || []).forEach(item => {
          if (item && item.name) {
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
        console.warn('Failed to load full menu catalog:', err.message);
        if (Array.isArray(menuItems) && menuItems.length > 0) {
          setAvailableMenu(menuItems);
        }
      }
    };

    fetchFullMenu();
  }, [menuItems]);

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
  const [selectedCustomerChoice, setSelectedCustomerChoice] = useState('NEW');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPaidAmount, setNewPaidAmount] = useState('0');
  const [manualTotalBill, setManualTotalBill] = useState('');
  const [useManualTotal, setUseManualTotal] = useState(false);

  // Line items state
  const [lineItems, setLineItems] = useState([
    { name: '', quantity: 1, price: '' }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    fetchKhataRecords();
  }, []);

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
        // If there is an empty row, populate it
        const emptyIdx = prev.findIndex(it => !it.name.trim());
        if (emptyIdx > -1) {
          const updated = [...prev];
          updated[emptyIdx] = { name: dish.name, quantity: 1, price: String(dish.price || 0) };
          return updated;
        } else {
          return [...prev, { name: dish.name, quantity: 1, price: String(dish.price || 0) }];
        }
      });
    }
  };

  // Open Add Modal for a specific existing customer
  const handleAddUdharForCustomer = (cust) => {
    setSelectedCustomerChoice(cust.customerPhone !== 'N/A' ? cust.customerPhone : cust.customerName);
    setNewCustomerName(cust.customerName);
    setNewCustomerPhone(cust.customerPhone !== 'N/A' ? cust.customerPhone : '');
    setLineItems([{ name: '', quantity: 1, price: '' }]);
    setNewPaidAmount('0');
    setManualTotalBill('');
    setUseManualTotal(false);
    setNewNotes('');
    setShowAddModal(true);
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

    const effName = newCustomerName.trim() || 'Walk-in Guest';
    const cleanPhone = newCustomerPhone.replace(/[^0-9]/g, '');
    const effPhone = cleanPhone && cleanPhone.length >= 5 ? cleanPhone : (newCustomerPhone.trim() || 'N/A');

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
        customerName: effName,
        customerPhone: effPhone,
        totalBill: effectiveTotalBill,
        paidAmount: effectivePaid,
        borrowAmount: newUdharAmount,
        notes: newNotes.trim(),
        items: validItems
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setShowAddModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setSelectedCustomerChoice('NEW');
      setLineItems([{ name: '', quantity: 1, price: '' }]);
      setManualTotalBill('');
      setUseManualTotal(false);
      setNewPaidAmount('0');
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

      {/* Top Header Bar */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>
            <BookOpen size={20} color="#2563eb" />
            {isHindi ? 'ग्राहक खाता बही (उधारी लेजर)' : 'Customer Khata & Credit Ledger'}
          </h2>
          <p>{isHindi ? 'ग्राहकों की उधारी, खरीदारी एवं भुगतान का व्यक्तिगत हिसाब-किताब' : 'Person-specific running credit, dish purchases, and balance settlements'}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder={isHindi ? "नाम या फ़ोन से खोजें..." : "Search customer or phone..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchBar}
              style={{ paddingLeft: 34 }}
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
              setSelectedCustomerChoice('NEW');
              setNewCustomerName('');
              setNewCustomerPhone('');
              setLineItems([{ name: '', quantity: 1, price: '' }]);
              setNewPaidAmount('0');
              setManualTotalBill('');
              setUseManualTotal(false);
              setNewNotes('');
              setShowAddModal(true);
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

                    return (
                      <tr key={cust.customerPhone !== 'N/A' ? cust.customerPhone : cust.customerName}>
                        {/* Customer Avatar & Name & Phone */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: hasDue ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                              color: hasDue ? '#dc2626' : '#334155',
                              border: hasDue ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '14px',
                              flexShrink: 0,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                              {cust.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px', lineHeight: 1.2 }}>
                                {cust.customerName}
                              </div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                                📞 {cust.customerPhone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Total Purchases */}
                        <td>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>
                            ₹{cust.totalPurchases.toLocaleString('en-IN')}
                          </span>
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
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                            <button
                              type="button"
                              onClick={() => handleAddUdharForCustomer(cust)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 7,
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f172a',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.12s ease'
                              }}
                              title="Add new purchase / borrow for this customer"
                            >
                              + Add Udhar
                            </button>

                            {hasDue && (
                              <button
                                type="button"
                                onClick={() => handleOpenCustomerSettle(cust)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 7,
                                  border: '1px solid #86efac',
                                  background: '#f0fdf4',
                                  color: '#15803d',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.12s ease'
                                }}
                                title="Record payment towards outstanding due"
                              >
                                Record Pay
                              </button>
                            )}

                            {waLink && (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 7,
                                  border: '1px solid #bbf7d0',
                                  background: '#f0fdf4',
                                  color: '#16a34a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none'
                                }}
                                title="Share statement on WhatsApp"
                              >
                                <MessageCircle size={15} />
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
                              background: '#f1f5f9',
                              color: '#334155',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '12px',
                              flexShrink: 0
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

      {/* MODAL 1: ADD CUSTOMER KHATA / UDHAR ENTRY */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '95%',
              borderRadius: 14,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '18px 22px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  {isHindi ? 'ग्राहक उधार प्रविष्टि जोड़ें' : 'Add Customer Udhar / Khata Entry'}
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {isHindi ? 'व्यक्तिगत खाते में खरीदारी व उधारी जोड़ें' : 'Associate credit directly with customer account'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateKhata}>
              {/* Customer Account Selector Dropdown */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                  {isHindi ? 'ग्राहक खाता चुनें या नया बनाएं' : 'Select Customer Account or Create New'}
                </label>
                <select
                  value={selectedCustomerChoice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCustomerChoice(val);
                    if (val === 'NEW') {
                      setNewCustomerName('');
                      setNewCustomerPhone('');
                    } else {
                      const found = customerAccounts.find(c => (c.customerPhone !== 'N/A' && c.customerPhone === val) || c.customerName === val);
                      if (found) {
                        setNewCustomerName(found.customerName);
                        setNewCustomerPhone(found.customerPhone !== 'N/A' ? found.customerPhone : '');
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 7,
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="NEW">➕ {isHindi ? 'नया ग्राहक बनाएं' : 'Create New Customer'}</option>
                  {customerAccounts.map((c, i) => (
                    <option key={i} value={c.customerPhone !== 'N/A' ? c.customerPhone : c.customerName}>
                      {c.customerName} {c.customerPhone !== 'N/A' ? `(${c.customerPhone})` : ''} — {c.outstandingBalance > 0 ? `Due: ₹${c.outstandingBalance}` : 'Settled'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Phone & Name (Both Optional) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: 3 }}>
                    {isHindi ? 'फ़ोन नंबर (वैकल्पिक)' : 'Customer Phone (Optional)'}
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={newCustomerPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewCustomerPhone(val);
                      const cleanP = val.replace(/[^0-9]/g, '');
                      const match = customerAccounts.find(c => c.customerPhone === cleanP);
                      if (match && !newCustomerName) {
                        setNewCustomerName(match.customerName);
                      }
                    }}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: 3 }}>
                    {isHindi ? 'ग्राहक का नाम (वैकल्पिक)' : 'Customer Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Naveen"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Existing Account Match Banner */}
              {matchedExistingCustomer && (
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <User size={12} color="#475569" />
                    <span><strong>{matchedExistingCustomer.customerName}</strong> ({matchedExistingCustomer.customerPhone})</span>
                  </div>
                  <span style={{ fontWeight: 800, color: matchedExistingCustomer.outstandingBalance > 0 ? '#dc2626' : '#16a34a' }}>
                    {isHindi ? `वर्तमान बकाया: ₹${matchedExistingCustomer.outstandingBalance}` : `Current Due: ₹${matchedExistingCustomer.outstandingBalance}`}
                  </span>
                </div>
              )}

              {/* Dishes / Items Taken Section */}
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', border: '1px solid #e2e8f0', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Utensils size={13} color="#475569" />
                    {isHindi ? 'व्यंजन / सामान सूची' : 'Dishes / Items Taken'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUseManualTotal(prev => !prev)}
                    style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {useManualTotal ? (isHindi ? 'आइटम अनुसार जोड़ें' : 'Switch to item list') : (isHindi ? 'सीधा कुल बिल दर्ज करें' : 'Direct total amount')}
                  </button>
                </div>

                {!useManualTotal ? (
                  <div>
                    {/* Category-Grouped Full Cafe Menu Quick Picker (All 196 Dishes) */}
                    <div style={{ marginBottom: 8 }}>
                      <select
                        onChange={(e) => {
                          handleQuickAddDish(e.target.value);
                          e.target.value = "";
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: 6,
                          border: '1.5px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#0f172a',
                          cursor: 'pointer',
                          boxSizing: 'border-box'
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          ➕ {isHindi ? 'मेन्यू से व्यंजन चुनें...' : `Select any dish from Cafe Menu (${availableMenu.length} dishes available)...`}
                        </option>
                        {Object.entries(groupedMenu).map(([categoryName, dishes]) => (
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

                    {/* Line Items List */}
                    {lineItems.map((item, idx) => {
                      const qty = Number(item.quantity) || 1;
                      const pr = Number(item.price) || 0;
                      const lineTotal = qty * pr;

                      return (
                        <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                          {/* Dish Name input with native browser datalist auto-complete */}
                          <input
                            type="text"
                            list="all-cafe-dishes"
                            placeholder={isHindi ? "व्यंजन नाम टाइप करें या सूची से चुनें" : "Type dish name or pick from list..."}
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            style={{ flex: 2, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff' }}
                          />

                          {/* Quantity Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '1px' }}>
                            <button
                              type="button"
                              onClick={() => handleItemChange(idx, 'quantity', Math.max(1, qty - 1))}
                              style={{ width: 20, height: 26, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Minus size={11} />
                            </button>
                            <span style={{ minWidth: 20, textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleItemChange(idx, 'quantity', qty + 1)}
                              style={{ width: 20, height: 26, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                              style={{ width: '100%', padding: '6px 6px 6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '12px', textAlign: 'right', boxSizing: 'border-box' }}
                            />
                          </div>

                          {/* Line total */}
                          <div style={{ minWidth: '45px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                            ₹{lineTotal}
                          </div>

                          {/* Delete Row */}
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddItemRow()}
                      style={{
                        background: '#ffffff',
                        border: '1px dashed #cbd5e1',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Plus size={11} />
                      {isHindi ? 'खाली पंक्ति जोड़ें' : 'Add custom row'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="number"
                      min="1"
                      placeholder={isHindi ? "कुल बिल राशि (उदा. 450)" : "Total Bill Amount (e.g. 450)"}
                      value={manualTotalBill}
                      onChange={(e) => setManualTotalBill(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>

              {/* Total Purchase Bill & Paid Now */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                    {isHindi ? 'कुल खरीदारी बिल' : 'Total Purchase Bill'}
                  </label>
                  <div style={{ padding: '7px 10px', borderRadius: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                    ₹{effectiveTotalBill.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                    {isHindi ? 'अभी भुगतान (₹)' : 'Paid Now (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={effectiveTotalBill}
                    placeholder="0"
                    value={newPaidAmount}
                    onChange={(e) => setNewPaidAmount(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Calculated Udhar Added Banner */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '7px 10px',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px'
              }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>
                    {isHindi ? 'खाते में नई उधारी' : 'New Udhar Added to Account:'}
                  </span>
                  <strong style={{ color: newUdharAmount > 0 ? '#dc2626' : '#16a34a', fontSize: '13px' }}>
                    ₹{newUdharAmount.toLocaleString('en-IN')}
                  </strong>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>
                    {isHindi ? 'अपडेटेड कुल बकाया' : 'Updated Total Balance:'}
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '13px' }}>
                    ₹{((matchedExistingCustomer?.outstandingBalance || 0) + newUdharAmount).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Optional Note */}
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder={isHindi ? "अतिरिक्त टिप्पणी (वैकल्पिक)" : "Note / Remark (optional)"}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  style={{ flex: 2, padding: '9px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
                >
                  {isCreating ? (isHindi ? 'दर्ज हो रहा है...' : 'Recording...') : (isHindi ? `खाते में ₹${newUdharAmount} उधार जोड़ें` : `Record ₹${newUdharAmount} to Khata`)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT / SETTLEMENT */}
      {(selectedRecord || selectedCustomerAccount) && (
        <div className={styles.modalOverlay} onClick={() => { setSelectedRecord(null); setSelectedCustomerAccount(null); }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '390px', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                {isHindi ? 'उधार भुगतान दर्ज करें' : 'Record Payment / Settlement'}
              </h3>
              <button
                type="button"
                onClick={() => { setSelectedRecord(null); setSelectedCustomerAccount(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle}>
              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: 6, marginBottom: 10 }}>
                <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>{isHindi ? 'ग्राहक:' : 'Customer:'}</span>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                  {selectedCustomerAccount ? selectedCustomerAccount.customerName : selectedRecord?.customerName}
                </strong>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: 1 }}>
                  📞 {selectedCustomerAccount ? selectedCustomerAccount.customerPhone : selectedRecord?.customerPhone}
                </span>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                  {isHindi ? 'प्राप्त राशि (₹)' : 'Amount Received (₹)'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1.5px solid #16a34a', fontSize: '14px', fontWeight: 800, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                  {isHindi ? 'भुगतान माध्यम' : 'Payment Method'}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Cash', 'UPI', 'Card'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettleMethod(m)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: 6,
                        border: settleMethod === m ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                        background: settleMethod === m ? '#f0fdf4' : '#ffffff',
                        color: settleMethod === m ? '#16a34a' : '#475569',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder={isHindi ? "टिप्पणी (उदा. GPay द्वारा दिया)" : "Payment note (optional)"}
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '11.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setSelectedRecord(null); setSelectedCustomerAccount(null); }}
                  style={{ flex: 1, padding: '9px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSettling}
                  style={{ flex: 2, padding: '9px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#ffffff', fontWeight: 800, cursor: 'pointer', fontSize: '12px' }}
                >
                  {isSettling ? (isHindi ? 'दर्ज हो रहा है...' : 'Recording...') : (isHindi ? `₹${settleAmount} दर्ज करें` : `Confirm ₹${settleAmount}`)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
