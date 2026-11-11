import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Search, CheckCircle, AlertCircle, Check, X, Phone, User, Plus,
  RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, MessageCircle, Trash2, ShoppingBag, CreditCard,
  ChevronRight, ChevronLeft, Utensils, Minus, Printer, QrCode, Smartphone, Banknote,
  FileText, Clock, Sparkles, ArrowLeft
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import { useTranslation } from '../utils/translations';
import { getValidFoodImage } from './AdminPanel';
import styles from './KhataLedger.module.css';

const getAvatarStyle = (name = '') => {
  const palettes = [
    { background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff', bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', text: '#ffffff' },
    { background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', color: '#ffffff', bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', text: '#ffffff' },
    { background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', color: '#ffffff', bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', text: '#ffffff' },
    { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#ffffff', bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', text: '#ffffff' },
    { background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', color: '#ffffff', bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', text: '#ffffff' },
    { background: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', color: '#ffffff', bg: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', text: '#ffffff' },
    { background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: '#ffffff', bg: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', text: '#ffffff' },
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
  const [passbookTab, setPassbookTab] = useState('bills'); // 'bills' or 'items'
  const [passbookSearch, setPassbookSearch] = useState('');

  // In-Screen POS Visual Menu Order Mode
  const [khataMode, setKhataMode] = useState('ledger'); // 'ledger' or 'pos_menu'
  const [activePosCustomer, setActivePosCustomer] = useState(null);
  const [isNewCustomerInline, setIsNewCustomerInline] = useState(false);
  const [posSelectedCategory, setPosSelectedCategory] = useState('all');
  const [posDishSearch, setPosDishSearch] = useState('');

  // Customization dialog state (variants & addons) - same as POS Terminal
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [customNotes, setCustomNotes] = useState('');
  const [customQty, setCustomQty] = useState(1);

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

  // Menu items: strictly prefer menuItems prop from AdminPanel (preserving exact POS Terminal order!)
  const effectiveMenu = useMemo(() => {
    if (menuItems && menuItems.length > 0) {
      return menuItems;
    }
    return availableMenu;
  }, [menuItems, availableMenu]);

  // Categories list for POS Menu (preserving exact POS Terminal order)
  const posCategories = useMemo(() => {
    const cats = ['all'];

    const hasOpenMenu = effectiveMenu.some(i => i.isOpenMenu || i.isPosOnly);
    if (hasOpenMenu) {
      cats.push('⚡ Open Menu');
    }

    // Always include 🌙 Night Menu pill so user can browse night items anytime (exact same as POS Terminal)
    cats.push('🌙 Night Menu');

    // Regular categories in their natural order from effectiveMenu (no artificial .sort())
    const regularCats = [...new Set(
      effectiveMenu
        .filter(i =>
          !i.isOpenMenu &&
          !i.isPosOnly &&
          !i.isNightMenu &&
          i.shiftAvailability !== 'night_only' &&
          !(i.category && i.category.toLowerCase().includes('night'))
        )
        .map(item => item.category || 'main-courses')
    )];

    return [...cats, ...regularCats];
  }, [effectiveMenu]);

  // Filtered dishes for POS visual grid - exact same order as POS Terminal
  const posFilteredDishes = useMemo(() => {
    return effectiveMenu.filter(item => {
      let matchesCat = false;
      if (posSelectedCategory === 'all') {
        matchesCat = true;
      } else if (posSelectedCategory === '⚡ Open Menu') {
        matchesCat = Boolean(item.isOpenMenu || item.isPosOnly);
      } else if (posSelectedCategory === '🌙 Night Menu') {
        matchesCat = Boolean(
          item.shiftAvailability === 'night_only' ||
          item.isNightMenu ||
          (item.nightPrice && Number(item.nightPrice) > 0) ||
          (item.category && item.category.toLowerCase().includes('night'))
        );
      } else {
        matchesCat = (item.category || 'main-courses') === posSelectedCategory;
      }

      const q = (posDishSearch || '').toLowerCase().trim();
      const matchesSearch = !q || (item.name && item.name.toLowerCase().includes(q)) || (item.category && item.category.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [effectiveMenu, posDishSearch, posSelectedCategory]);

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

  // POS Visual Menu Handlers - Same as POS Terminal
  const handlePosQuickAdd = (dish) => {
    if ((dish.variants && dish.variants.length > 0) || (dish.addons && dish.addons.length > 0)) {
      setCustomizingItem(dish);
      setSelectedVariant(dish.variants && dish.variants.length > 0 ? dish.variants[0] : null);
      setSelectedAddons([]);
      setCustomNotes('');
      setCustomQty(1);
    } else {
      const effPrice = Number(dish.salePrice || dish.price) || 0;
      setLineItems(prev => {
        const idx = prev.findIndex(it => (it.id === dish._id || it.name.toLowerCase() === dish.name.toLowerCase()) && !it.variant && (!it.addons || it.addons.length === 0));
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
            id: dish._id,
            name: dish.name,
            quantity: 1,
            price: String(effPrice),
            isVeg: dish.isVeg,
            variant: null,
            addons: []
          }
        ];
      });
      toast.success(`Added ${dish.name}`);
    }
  };

  const handleAddCustomized = () => {
    if (!customizingItem) return;
    let finalPrice = Number(customizingItem.salePrice || customizingItem.price) || 0;
    let variantName = '';
    if (selectedVariant) {
      finalPrice = Number(selectedVariant.price) >= 0 ? Number(selectedVariant.price) : finalPrice;
      variantName = selectedVariant.name || '';
    }
    const addonPrice = selectedAddons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
    const totalPrice = finalPrice + addonPrice;
    const addQty = Math.max(1, customQty || 1);
    const displayName = variantName ? `${customizingItem.name} (${variantName})` : customizingItem.name;

    setLineItems(prev => {
      const idx = prev.findIndex(c =>
        (c.id === customizingItem._id || c.name === displayName) &&
        ((!c.variant && !selectedVariant) || (c.variant?.name === selectedVariant?.name)) &&
        JSON.stringify(c.addons || []) === JSON.stringify(selectedAddons || [])
      );

      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          quantity: (Number(copy[idx].quantity) || 1) + addQty
        };
        return copy;
      }

      return [
        ...prev,
        {
          id: customizingItem._id,
          name: displayName,
          price: String(totalPrice),
          quantity: addQty,
          isVeg: customizingItem.isVeg,
          variant: selectedVariant,
          addons: selectedAddons,
          specialNotes: customNotes
        }
      ];
    });

    setCustomizingItem(null);
    setCustomNotes('');
    setCustomQty(1);
    toast.success(`Added ${addQty}x ${displayName}`);
  };

  const handlePosDecrement = (dish, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setLineItems(prev => {
      const idx = prev.map(c => (
        c.id === dish._id || c._id === dish._id ||
        c.name.toLowerCase() === dish.name.toLowerCase() ||
        c.name.toLowerCase().startsWith(dish.name.toLowerCase())
      )).lastIndexOf(true);
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
    const prevDue = Number(activePosCustomer?.outstandingBalance) || 0;
    const maxPayable = totalBill + prevDue;
    const enteredPaid = Number(newPaidAmount) || 0;

    // Strict Validation: Paid amount cannot exceed total udhar
    if (enteredPaid > maxPayable && maxPayable > 0) {
      alert(`Entered amount (₹${enteredPaid.toLocaleString('en-IN')}) cannot be greater than Total Udhar (₹${maxPayable.toLocaleString('en-IN')}).`);
      return;
    }

    // Must have either dishes or a valid payment
    if (totalBill <= 0 && enteredPaid <= 0) {
      alert('Please select at least one dish from the menu or enter a payment amount.');
      return;
    }

    try {
      setIsCreating(true);
      const token = localStorage.getItem('token');

      // Case 1: Pure settlement payment (no dishes ordered, customer paying towards old due)
      if (totalBill <= 0 && enteredPaid > 0) {
        const res = await axios.post(`${API_URL}/khata/customer-payment`, {
          customerPhone: finalPhone,
          customerName: effName.trim(),
          amount: enteredPaid,
          paymentMethod: (newPaidMethod || 'cash').toLowerCase(),
          notes: newNotes.trim() || 'Settlement payment recorded at counter'
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

        showFeedback(res.data?.message || `✓ Payment of ₹${enteredPaid.toLocaleString('en-IN')} recorded for ${effName}!`);
        fetchKhataRecords();
        return;
      }

      // Case 2: Dishes ordered (totalBill > 0)
      const billPaid = Math.min(enteredPaid, totalBill);
      const newUdharAmount = Math.max(0, totalBill - billPaid);
      const excessPaid = Math.max(0, enteredPaid - totalBill);

      const validItems = lineItems
        .filter(it => it.name && it.name.trim())
        .map(it => ({
          name: it.name.trim(),
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0
        }));

      // 1. Create order record in khata
      const res = await axios.post(`${API_URL}/khata`, {
        tenantId,
        orderNumber: entryOrderNumber.trim(),
        customerName: effName.trim(),
        customerPhone: finalPhone,
        totalBill: totalBill,
        paidAmount: billPaid,
        borrowAmount: newUdharAmount,
        notes: newNotes.trim(),
        items: validItems,
        date: entryDate,
        paidMethod: billPaid > 0 ? newPaidMethod : 'Cash'
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // 2. If excess amount was paid over current bill, apply it to settle the prior due!
      if (excessPaid > 0 && prevDue > 0) {
        try {
          await axios.post(`${API_URL}/khata/customer-payment`, {
            customerPhone: finalPhone,
            customerName: effName.trim(),
            amount: excessPaid,
            paymentMethod: (newPaidMethod || 'cash').toLowerCase(),
            notes: `Paid with order: ₹${excessPaid} settled towards prior due`
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        } catch (settleErr) {
          console.error('Failed to settle prior due with order payment:', settleErr);
        }
      }

      setKhataMode('ledger');
      setActivePosCustomer(null);
      setLineItems([]);
      setNewPaidAmount('0');
      setNewNotes('');
      setEntryOrderNumber('');
      setIsNewCustomerInline(false);

      if (excessPaid > 0) {
        showFeedback(`✓ Order recorded! Bill (₹${totalBill.toLocaleString('en-IN')}) paid + ₹${excessPaid.toLocaleString('en-IN')} settled from old due for ${effName}.`);
      } else {
        showFeedback(res.data?.message || `✓ Khata recorded for ${effName}! (New Due: ₹${newUdharAmount.toLocaleString('en-IN')})`);
      }
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
          {/* Left Column: Top Navigation Bar + Visual Dishes Catalog */}
          <div className={styles.posLeftSection}>
            {/* Top Navigation & Customer Header Bar */}
            <div className={styles.posHeader}>
              <div className={styles.posHeaderLeft}>
                <button
                  type="button"
                  onClick={() => {
                    setKhataMode('ledger');
                    setActivePosCustomer(null);
                    setLineItems([]);
                  }}
                  className={styles.posBackIconBtn}
                  title="Back to Khata Ledger"
                  aria-label="Back"
                >
                  <ArrowLeft size={16} />
                </button>

                <div className={styles.posCustomerCard}>
                  <div className={styles.posCustomerInfo}>
                    <div className={styles.posCustomerNameRow}>
                      <span className={styles.posCustomerName}>
                        {activePosCustomer?.isNew ? (activePosCustomer?.customerName || 'New Customer') : (activePosCustomer?.customerName || 'Customer')}
                      </span>
                      <span className={styles.posDueBadge}>
                        ₹{(Number(activePosCustomer?.outstandingBalance) || 0).toLocaleString('en-IN')} Due
                      </span>
                      {activePosCustomer?.customerPhone && activePosCustomer?.customerPhone !== 'N/A' && (
                        <span className={styles.posCustomerPhone}>
                          • {activePosCustomer.customerPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sleek integrated customer switcher */}
                  <div className={styles.posSwitchBtnWrap}>
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
                      className={styles.posSwitchSelect}
                      title="Switch to another customer account"
                    >
                      <option value="" disabled hidden>Change</option>
                      <optgroup label="Select Customer">
                        {customerAccounts.map(c => (
                          <option key={c.customerPhone + c.customerName} value={c.customerPhone !== 'N/A' ? c.customerPhone : c.customerName}>
                            {c.customerName} {c.customerPhone !== 'N/A' ? `(${c.customerPhone})` : ''} — Due: ₹{c.outstandingBalance.toLocaleString('en-IN')}
                          </option>
                        ))}
                      </optgroup>
                      <option value="__NEW__">➕ New Customer (नया ग्राहक)</option>
                    </select>
                    <span className={styles.posSwitchBtnLabel}>Switch ▾</span>
                  </div>
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

                {/* Search Box expands cleanly across left row */}
                <div className={styles.posSearchWrap}>
                  <Search size={14} color="#64748b" />
                  <input
                    type="text"
                    placeholder={isHindi ? "मेनू में खोजें..." : "Search menu dishes..."}
                    value={posDishSearch}
                    onChange={(e) => setPosDishSearch(e.target.value)}
                    className={styles.posSearchInput}
                  />
                  {posDishSearch && (
                    <button
                      type="button"
                      onClick={() => setPosDishSearch('')}
                      className={styles.posClearSearchBtn}
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Panel */}
            <div className={styles.posMenuPanel}>
              {/* Category Pills - Same as POS Terminal */}
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
                      : cat === '⚡ Open Menu' || cat === '🌙 Night Menu'
                        ? cat
                        : cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>

              {/* Dishes Grid - Identical to POS Terminal */}
              <div className={styles.posDishesGrid}>
                {posFilteredDishes.map(item => {
                  const imgUrl = getValidFoodImage(item);
                  const price = Number(item.salePrice || item.price) || 0;
                  const cartQty = lineItems
                    .filter(c => (c.id === item._id || c._id === item._id || c.name.toLowerCase() === item.name.toLowerCase() || c.name.toLowerCase().startsWith(item.name.toLowerCase())))
                    .reduce((sum, c) => sum + (Number(c.quantity) || 1), 0);

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
                        <div className={item.isVeg ? styles.posVegBadge : styles.posNonVegBadge}>
                          <div className={item.isVeg ? styles.posVegDot : styles.posNonVegDot} />
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

                      <div className={styles.posDishInfo}>
                        <h4 title={item.name}>{item.name}</h4>
                      </div>

                      <div className={styles.posDishPriceRow}>
                        <span className={styles.posDishPrice}>₹{price.toLocaleString('en-IN')}</span>
                        {cartQty > 0 ? (
                          <div className={styles.posStepper} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={styles.posStepperBtn}
                              onClick={(e) => handlePosDecrement(item, e)}
                              title="Decrease quantity"
                            >
                              <Minus size={11} />
                            </button>
                            <span className={styles.posStepperQty}>{cartQty}</span>
                            <button
                              type="button"
                              className={styles.posStepperBtn}
                              onClick={(e) => { e.stopPropagation(); handlePosQuickAdd(item); }}
                              title="Increase quantity"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className={styles.posAddBtn}
                            onClick={(e) => { e.stopPropagation(); handlePosQuickAdd(item); }}
                            title="Add to order"
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
          </div>

          {/* Right Column: Customer Khata Slip (Starts from Top alongside Left Section!) */}
          <div className={styles.posSlipPanel}>
              {/* Slip Header */}
              <div className={styles.posSlipHeader}>
                <div className={styles.posSlipTitleRow}>
                  <h3 className={styles.posSlipTitle}>Order Slip</h3>
                  {lineItems.length > 0 && (
                    <span className={styles.posSlipItemCountBadge}>
                      {lineItems.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0)} items
                    </span>
                  )}
                </div>
              </div>

              {/* Cart Items List - Maximized Space */}
              <div className={styles.posSlipItemsContainer}>
                {lineItems.length === 0 ? (
                  <div className={styles.posSlipEmpty}>
                    <div className={styles.posEmptyIconCircle}>
                      <ShoppingBag size={22} color="#3b82f6" />
                    </div>
                    <h4>Slip is empty</h4>
                    <p>Click dishes on the left to add items</p>
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
                              <span className={styles.posSlipItemName} title={item.name}>{item.name}</span>
                              <span className={styles.posSlipItemRate}>₹{item.price} each</span>
                            </div>
                          </div>

                          <div className={styles.posSlipItemRight}>
                            <div className={styles.posStepper}>
                              <button
                                type="button"
                                className={styles.posStepperBtn}
                                onClick={() => handlePosDecrement(item)}
                                title="Decrease"
                              >
                                <Minus size={11} />
                              </button>
                              <span className={styles.posStepperQty}>{item.quantity}</span>
                              <button
                                type="button"
                                className={styles.posStepperBtn}
                                onClick={() => handlePosQuickAdd(item)}
                                title="Increase"
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

              {/* Compact Footer: Summary & Settlement */}
              {(() => {
                const grossTotal = lineItems.reduce((acc, it) => acc + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
                const prevDue = Number(activePosCustomer?.outstandingBalance) || 0;
                const maxPayable = grossTotal + prevDue;
                const paidNum = Math.min(Math.max(0, Number(newPaidAmount) || 0), maxPayable);
                const excessPaid = Math.max(0, paidNum - grossTotal);
                const newUdhar = Math.max(0, grossTotal - paidNum);
                const updatedDue = Math.max(0, prevDue + newUdhar - excessPaid);

                return (
                  <div className={styles.posSlipFooter}>
                    {/* Bill Total & Counter Pay Chips */}
                    <div className={styles.posCompactTotalBar}>
                      <div className={styles.posTotalGroup}>
                        <span className={styles.posTotalLabel}>Total:</span>
                        <span className={styles.posTotalValue}>₹{grossTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className={styles.posPaidChips}>
                        <button
                          type="button"
                          className={`${styles.posChip} ${newPaidAmount === '0' || newPaidAmount === '' ? styles.posChipActive : ''}`}
                          onClick={() => setNewPaidAmount('0')}
                        >
                          Full Udhar
                        </button>
                        {grossTotal > 0 && prevDue > 0 ? (
                          <>
                            <button
                              type="button"
                              className={`${styles.posChip} ${newPaidAmount === String(grossTotal) ? styles.posChipActive : ''}`}
                              onClick={() => setNewPaidAmount(String(grossTotal))}
                            >
                              Bill (₹{grossTotal})
                            </button>
                            <button
                              type="button"
                              className={`${styles.posChip} ${newPaidAmount === String(maxPayable) ? styles.posChipActive : ''}`}
                              onClick={() => setNewPaidAmount(String(maxPayable))}
                            >
                              Clear All
                            </button>
                          </>
                        ) : grossTotal > 0 ? (
                          <>
                            <button
                              type="button"
                              className={`${styles.posChip} ${newPaidAmount === String(Math.round(grossTotal / 2)) ? styles.posChipActive : ''}`}
                              onClick={() => setNewPaidAmount(String(Math.round(grossTotal / 2)))}
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              className={`${styles.posChip} ${newPaidAmount === String(grossTotal) ? styles.posChipActive : ''}`}
                              onClick={() => setNewPaidAmount(String(grossTotal))}
                            >
                              Paid
                            </button>
                          </>
                        ) : prevDue > 0 ? (
                          <>
                            <button
                              type="button"
                              className={`${styles.posChip} ${newPaidAmount === String(Math.round(prevDue / 2)) ? styles.posChipActive : ''}`}
                              onClick={() => setNewPaidAmount(String(Math.round(prevDue / 2)))}
                            >
                              50% Due
                            </button>
                            <button
                              type="button"
                              className={`${styles.posChip} ${newPaidAmount === String(prevDue) ? styles.posChipActive : ''}`}
                              onClick={() => setNewPaidAmount(String(prevDue))}
                            >
                              Clear Due
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Counter Paid Input & Tender */}
                    <div className={styles.posCounterPayRow}>
                      <div className={styles.posPaidInputGroup}>
                        <span className={styles.posPaidInputLabel}>Paid Now:</span>
                        <div className={styles.posPaidInputWrap}>
                          <span className={styles.posCurrencyPrefix}>₹</span>
                          <input
                            type="number"
                            min="0"
                            max={maxPayable}
                            value={newPaidAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setNewPaidAmount('');
                                return;
                              }
                              const num = Number(val);
                              if (maxPayable > 0 && num > maxPayable) {
                                setNewPaidAmount(String(maxPayable));
                              } else {
                                setNewPaidAmount(val);
                              }
                            }}
                            placeholder="0"
                            className={styles.posPaidInput}
                          />
                        </div>
                      </div>

                      <div
                        className={styles.posTenderPills}
                        style={{
                          opacity: Number(newPaidAmount) > 0 ? 1 : 0.4,
                          pointerEvents: Number(newPaidAmount) > 0 ? 'auto' : 'none'
                        }}
                      >
                        {[
                          { id: 'Cash', label: 'Cash' },
                          { id: 'UPI', label: 'UPI' },
                          { id: 'Card', label: 'Card' }
                        ].map(m => (
                          <button
                            key={m.id}
                            type="button"
                            className={`${styles.posTenderPill} ${newPaidMethod === m.id ? styles.posTenderPillActive : ''}`}
                            onClick={() => setNewPaidMethod(m.id)}
                          >
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Khata Balance Impact Strip */}
                    <div
                      className={styles.posBalanceImpactStrip}
                      style={excessPaid > 0 ? { background: '#f0fdf4', borderColor: '#bbf7d0' } : {}}
                    >
                      <div className={styles.posImpactCol}>
                        <span className={styles.posImpactSub}>Old Due</span>
                        <span className={styles.posImpactVal}>₹{prevDue.toLocaleString('en-IN')}</span>
                      </div>

                      {excessPaid > 0 ? (
                        <>
                          <span className={styles.posImpactOp} style={{ color: '#16a34a' }}>-</span>
                          <div className={styles.posImpactCol}>
                            <span className={styles.posImpactSub} style={{ color: '#15803d' }}>Settled</span>
                            <span className={styles.posImpactAddVal} style={{ color: '#16a34a' }}>
                              ₹{excessPaid.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className={styles.posImpactOp}>+</span>
                          <div className={styles.posImpactCol}>
                            <span className={styles.posImpactSub}>New Udhar</span>
                            <span className={styles.posImpactAddVal}>
                              ₹{newUdhar.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </>
                      )}

                      <span className={styles.posImpactOp}>=</span>
                      <div
                        className={`${styles.posImpactCol} ${styles.posImpactTotalCol}`}
                        style={excessPaid > 0 ? { borderColor: '#86efac' } : {}}
                      >
                        <span className={styles.posImpactSubTotal}>Updated Due</span>
                        <span
                          className={styles.posImpactFinalVal}
                          style={{ color: updatedDue > 0 ? '#dc2626' : '#16a34a' }}
                        >
                          ₹{updatedDue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Compact Note input */}
                    <div className={styles.posNotesWrap}>
                      <input
                        type="text"
                        placeholder="Note / remark (optional, e.g. Table 4)..."
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className={styles.posNotesInput}
                      />
                    </div>

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
                        disabled={isCreating || (lineItems.length === 0 && Number(newPaidAmount) <= 0)}
                        className={styles.posConfirmBtn}
                      >
                        {isCreating ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Recording...</span>
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            <span>
                              {lineItems.length === 0 && paidNum > 0
                                ? `Confirm & Settle ₹${paidNum.toLocaleString('en-IN')} Due`
                                : newUdhar > 0
                                ? `Confirm & Add ₹${newUdhar.toLocaleString('en-IN')} to Khata`
                                : excessPaid > 0
                                ? `Confirm Bill & Settle ₹${excessPaid.toLocaleString('en-IN')} Due`
                                : `Confirm & Record ₹${grossTotal.toLocaleString('en-IN')} Paid`}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

          {/* Centered Modal Overlay for Dish Customization (Variants & Addons - Exact match to POS Terminal) */}
          {customizingItem && (
            <div className={styles.posModalOverlay} onClick={() => setCustomizingItem(null)}>
              <div className={styles.posModalContent} onClick={(e) => e.stopPropagation()}>
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
                            name="pos_khata_variant"
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
                  const singleUnitPrice = (Number(vPrice) || 0) + aPrice;
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
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <span>Add to Slip</span>
                        <span style={{ opacity: 0.85 }}>•</span>
                        <span>₹{modalTotal.toLocaleString('en-IN')}</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
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
            <span>{isHindi ? 'नया उधार जोड़ें' : 'Add Customer Udhar'}</span>
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
                  <th>{isHindi ? 'ग्राहक का नाम' : 'Customer Name'}</th>
                  <th>{isHindi ? 'मोबाइल नंबर' : 'Mobile Number'}</th>
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
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                      <User size={38} color="#cbd5e1" style={{ margin: '0 auto 10px auto', display: 'block' }} />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155', display: 'block' }}>
                        {isHindi ? 'कोई ग्राहक खाता नहीं मिला' : 'No Customer Khata Accounts Found'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {isHindi ? 'नया उधार जोड़ने के लिए ऊपर दिए गए बटन का उपयोग करें' : 'Click "Add Customer Udhar" to start a customer credit account'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((cust) => {
                    const hasDue = cust.outstandingBalance > 0;
                    const paidPercent = cust.totalPurchases > 0 ? Math.min(100, Math.round((cust.totalPaid / cust.totalPurchases) * 100)) : 100;

                    return (
                      <tr key={cust.customerPhone !== 'N/A' ? cust.customerPhone : cust.customerName}>
                        {/* Customer Name (No circular avatar) */}
                        <td>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>
                            {cust.customerName}
                          </span>
                        </td>

                        {/* Mobile Number */}
                        <td>
                          <span style={{
                            fontSize: '12.5px',
                            color: cust.customerPhone && cust.customerPhone !== 'N/A' ? '#475569' : '#94a3b8',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums'
                          }}>
                            {cust.customerPhone && cust.customerPhone !== 'N/A' ? cust.customerPhone : '—'}
                          </span>
                        </td>

                        {/* Total Purchases & Modern Progress Pill */}
                        <td>
                          <div style={{ minWidth: 120 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px' }}>
                                ₹{cust.totalPurchases.toLocaleString('en-IN')}
                              </span>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: paidPercent === 100 ? '#16a34a' : paidPercent > 0 ? '#2563eb' : '#94a3b8'
                              }}>
                                {paidPercent}% paid
                              </span>
                            </div>
                            <div className={styles.creditBarWrap} title={`${paidPercent}% settled`}>
                              <div
                                className={styles.creditBarPaid}
                                style={{
                                  width: `${paidPercent}%`,
                                  background: paidPercent === 100
                                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                    : 'linear-gradient(90deg, #3b82f6, #10b981)'
                                }}
                              />
                            </div>
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

                        {/* Actions (Clean: Passbook, Add, Settle - WhatsApp removed) */}
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

        // Compute Item-wise Aggregation across all customer records
        const itemMap = {};
        let nonItemizedTotal = 0;
        let nonItemizedCount = 0;
        customerHistory.forEach(rec => {
          if (rec.items && Array.isArray(rec.items) && rec.items.length > 0) {
            rec.items.forEach(it => {
              const name = (it.name || 'Custom Dish').trim();
              const qty = Number(it.quantity) || 1;
              const price = Number(it.price) || 0;
              if (!itemMap[name]) {
                itemMap[name] = { name, quantity: 0, unitPrice: price, totalAmount: 0, ordersCount: 0, lastOrdered: rec.createdAt, isVeg: it.isVeg };
              }
              itemMap[name].quantity += qty;
              if (price > 0 && itemMap[name].unitPrice === 0) itemMap[name].unitPrice = price;
              itemMap[name].totalAmount += (price > 0 ? (price * qty) : 0);
              itemMap[name].ordersCount += 1;
              if (new Date(rec.createdAt) > new Date(itemMap[name].lastOrdered)) itemMap[name].lastOrdered = rec.createdAt;
            });
          } else {
            nonItemizedTotal += Number(rec.totalBill) || 0;
            nonItemizedCount += 1;
          }
        });
        const allItemsList = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);

        // Search filter
        const q = (passbookSearch || '').toLowerCase().trim();
        const filteredHistory = customerHistory.filter(rec => {
          if (!q) return true;
          return rec.items?.some(it => it.name?.toLowerCase().includes(q)) || rec.notes?.toLowerCase().includes(q);
        });
        const filteredItemsList = allItemsList.filter(it => !q || it.name.toLowerCase().includes(q));
        const totalUniqueDishes = allItemsList.length;
        const totalItemsQty = allItemsList.reduce((sum, it) => sum + it.quantity, 0);
        const totalItemsValue = allItemsList.reduce((sum, it) => sum + it.totalAmount, 0);

        // Professional Thermal Receipt Slip Printing Handler (Modern Typography & Crisp Spacing)
        const handlePrintReceipt = () => {
          const restaurantName = tenantInfo?.name || 'Cafe & Restaurant';
          const restaurantPhone = tenantInfo?.phone || tenantInfo?.settings?.phone || '';
          const restaurantAddress = tenantInfo?.address || tenantInfo?.settings?.address || '';
          const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

          const printWin = window.open('', '_blank', 'width=440,height=820');
          if (!printWin) {
            window.print();
            return;
          }

          // Build transaction rows
          const txRows = customerHistory.slice(0, 20).map(rec => {
            const due = Number(rec.borrowAmount !== undefined ? rec.borrowAmount : (rec.remainingAmount || 0));
            const recDate = new Date(rec.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            const itemText = rec.items && rec.items.length > 0
              ? rec.items.map(it => it.name + ' ×' + (it.quantity || 1)).join(', ')
              : (rec.notes || 'Order purchase');

            return (
              '<div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 11px; padding: 3px 0; border-bottom: 1px dotted #e5e7eb;">' +
                '<span style="color: #6b7280; min-width: 44px; font-variant-numeric: tabular-nums;">' + recDate + '</span>' +
                '<span style="flex: 1; padding: 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1f2937;">' + itemText + '</span>' +
                '<span style="min-width: 44px; text-align: right; font-weight: 600; font-variant-numeric: tabular-nums;">₹' + (Number(rec.totalBill) || 0) + '</span>' +
                '<span style="min-width: 50px; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; color: ' + (due > 0 ? '#dc2626' : '#16a34a') + ';">' + (due > 0 ? '₹' + due : 'PAID') + '</span>' +
              '</div>'
            );
          }).join('');

          // Build item consumption breakdown
          const dishRows = allItemsList.slice(0, 15).map(it => (
            '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding: 2.5px 0;">' +
              '<span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1f2937;">• ' + it.name + '</span>' +
              '<span style="min-width: 36px; text-align: center; color: #2563eb; font-weight: 700; font-variant-numeric: tabular-nums;">×' + it.quantity + '</span>' +
              '<span style="min-width: 50px; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums;">₹' + it.totalAmount.toLocaleString('en-IN') + '</span>' +
            '</div>'
          )).join('');

          const htmlContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8" />
                <title>Receipt_Khata_${passbookCustomer.customerName}</title>
                <style>
                  @page {
                    size: 80mm auto;
                    margin: 0;
                  }
                  * { box-sizing: border-box; }
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    width: 76mm;
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 8mm 4mm;
                    color: #111827;
                    background: #ffffff;
                    font-size: 11px;
                    line-height: 1.4;
                    font-variant-numeric: tabular-nums;
                  }
                  .text-center { text-align: center; }
                  .text-right { text-align: right; }
                  .divider { border-top: 1px dashed #6b7280; margin: 8px 0; }
                  .double-divider { border-top: 1.5px solid #111827; margin: 8px 0; }
                  .bold { font-weight: 700; }
                  .flex-between { display: flex; justify-content: space-between; align-items: center; }
                  @media print {
                    body { padding: 5mm 3mm; width: 74mm; }
                    .no-print { display: none; }
                  }
                </style>
              </head>
              <body>
                <!-- Header -->
                <div class="text-center">
                  <div style="font-size: 16px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #0f172a;">
                    ${restaurantName}
                  </div>
                  ${restaurantAddress ? '<div style="font-size: 10px; color: #4b5563; margin-top: 1px;">' + restaurantAddress + '</div>' : ''}
                  ${restaurantPhone ? '<div style="font-size: 10px; color: #4b5563;">Tel: ' + restaurantPhone + '</div>' : ''}
                  
                  <div style="display: inline-block; margin-top: 6px; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; font-size: 9.5px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #334155;">
                    CUSTOMER KHATA PASSBOOK SLIP
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Customer Details -->
                <div style="font-size: 11px; line-height: 1.5;">
                  <div class="flex-between">
                    <span style="color: #6b7280;">Customer:</span>
                    <span class="bold" style="font-size: 12px; color: #0f172a;">${passbookCustomer.customerName}</span>
                  </div>
                  <div class="flex-between">
                    <span style="color: #6b7280;">Phone:</span>
                    <span class="bold">${passbookCustomer.customerPhone}</span>
                  </div>
                  <div class="flex-between">
                    <span style="color: #6b7280;">Date:</span>
                    <span style="color: #4b5563;">${dateStr}</span>
                  </div>
                  <div class="flex-between">
                    <span style="color: #6b7280;">Recorded Visits:</span>
                    <span style="color: #4b5563;">${passbookCustomer.entriesCount || customerHistory.length} orders</span>
                  </div>
                </div>

                <div class="double-divider"></div>

                <!-- Balance Summary Hero Box -->
                <div style="padding: 2px 0;">
                  <div class="flex-between" style="font-size: 11px; margin-bottom: 2px;">
                    <span style="color: #4b5563;">TOTAL PURCHASES:</span>
                    <span class="bold">₹${passbookCustomer.totalPurchases.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="flex-between" style="font-size: 11px; margin-bottom: 2px;">
                    <span style="color: #15803d; font-weight: 600;">TOTAL REPAID:</span>
                    <span class="bold" style="color: #15803d;">₹${passbookCustomer.totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div class="divider"></div>
                  <div class="flex-between" style="font-size: 13px; font-weight: 900;">
                    <span>CURRENT DUE:</span>
                    <span style="font-size: 15px; color: ${passbookCustomer.outstandingBalance > 0 ? '#dc2626' : '#15803d'};">
                      ₹${passbookCustomer.outstandingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div class="double-divider"></div>

                <!-- Dish Consumption Summary -->
                ${allItemsList && allItemsList.length > 0 ? `
                  <div class="bold text-center" style="font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; color: #374151; margin-bottom: 5px;">
                    -- DISH CONSUMPTION SUMMARY --
                  </div>
                  <div class="flex-between bold" style="font-size: 9.5px; color: #6b7280; border-bottom: 1px dotted #9ca3af; padding-bottom: 3px; margin-bottom: 3px;">
                    <span>ITEM</span>
                    <span style="width: 36px; text-align: center;">QTY</span>
                    <span style="width: 50px; text-align: right;">SPENT</span>
                  </div>
                  ${dishRows}
                  <div class="divider"></div>
                ` : ''}

                <!-- Recent Transactions Ledger -->
                <div class="bold text-center" style="font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; color: #374151; margin-bottom: 5px;">
                  -- RECENT TRANSACTIONS --
                </div>
                <div class="flex-between bold" style="font-size: 9.5px; color: #6b7280; border-bottom: 1px dotted #9ca3af; padding-bottom: 3px; margin-bottom: 3px;">
                  <span style="min-width: 44px;">DATE</span>
                  <span style="flex: 1; padding: 0 6px;">ITEMS</span>
                  <span style="min-width: 44px; text-align: right;">BILL</span>
                  <span style="min-width: 50px; text-align: right;">DUE</span>
                </div>
                ${txRows}

                <div class="double-divider"></div>

                <!-- Footer Status & DineviQ Brand -->
                <div class="text-center" style="padding-top: 4px;">
                  <div class="bold" style="font-size: 11px; color: ${passbookCustomer.outstandingBalance > 0 ? '#b91c1c' : '#15803d'};">
                    ${passbookCustomer.outstandingBalance > 0
                      ? 'STATUS: PAYMENT PENDING (₹' + passbookCustomer.outstandingBalance.toLocaleString('en-IN') + ')'
                      : 'STATUS: ALL DUES FULLY CLEARED ✓'}
                  </div>
                  <div style="font-size: 10px; color: #6b7280; margin-top: 3px;">
                    ${passbookCustomer.outstandingBalance > 0 ? 'Please settle your pending balance at the earliest.' : 'Thank you for dining with us!'}
                  </div>

                  <div class="divider"></div>

                  <div style="font-size: 10px; font-weight: 800; margin-top: 4px; color: #1e293b; letter-spacing: -0.01em;">
                    Powered by <span style="color: #2563eb;">DineviQ OS</span>
                  </div>
                  <div style="font-size: 8.5px; color: #94a3b8; margin-top: 1px;">
                    Autonomous Restaurant & Khata Cloud
                  </div>
                </div>
              </body>
            </html>
          `;

          printWin.document.write(htmlContent);
          printWin.document.close();
          printWin.focus();
          setTimeout(() => {
            printWin.print();
          }, 250);
        };

        return (
          <div className={styles.modalOverlay} onClick={() => { setPassbookCustomer(null); setPassbookTab('bills'); setPassbookSearch(''); }}>
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
                    onClick={handlePrintReceipt}
                    className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                    title="Print Khata Receipt Slip"
                  >
                    <Printer size={13} />
                    <span>{isHindi ? 'प्रिंट रसीद' : 'Print Receipt'}</span>
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
                    onClick={() => { setPassbookCustomer(null); setPassbookTab('bills'); setPassbookSearch(''); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Compact Sleek Customer Header Bar (Space-saving & Modern) */}
              <div className={styles.passbookHeaderCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  {/* Left: Customer Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: getAvatarStyle(passbookCustomer.customerName).background,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '18px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                      flexShrink: 0
                    }}>
                      {passbookCustomer.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                          {passbookCustomer.customerName}
                        </h4>
                        <span style={{ fontSize: '10.5px', background: '#eff6ff', color: '#2563eb', padding: '1px 8px', borderRadius: 10, fontWeight: 700, border: '1px solid #bfdbfe' }}>
                          {passbookCustomer.entriesCount || customerHistory.length} visits
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: 2 }}>
                        📞 {passbookCustomer.customerPhone}
                      </div>
                    </div>
                  </div>

                  {/* Center: 3 Compact Metric Pills */}
                  <div className={styles.passbookPillGroup}>
                    <div className={styles.passbookMetricPill}>
                      <div>
                        <div className={styles.passbookPillLabel}>{isHindi ? 'कुल खरीदारी' : 'Total Billed'}</div>
                        <div className={styles.passbookPillValue} style={{ color: '#0f172a' }}>
                          ₹{passbookCustomer.totalPurchases.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className={styles.passbookMetricPill} style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                      <div>
                        <div className={styles.passbookPillLabel} style={{ color: '#15803d' }}>{isHindi ? 'कुल चुकता' : 'Total Repaid'}</div>
                        <div className={styles.passbookPillValue} style={{ color: '#16a34a' }}>
                          ₹{passbookCustomer.totalPaid.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div
                      className={styles.passbookMetricPill}
                      style={{
                        background: passbookCustomer.outstandingBalance > 0 ? '#fef2f2' : '#f0fdf4',
                        borderColor: passbookCustomer.outstandingBalance > 0 ? '#fecaca' : '#bbf7d0'
                      }}
                    >
                      <div>
                        <div className={styles.passbookPillLabel} style={{ color: passbookCustomer.outstandingBalance > 0 ? '#991b1b' : '#15803d' }}>
                          {isHindi ? 'बकाया उधार' : 'Current Due'}
                        </div>
                        <div className={styles.passbookPillValue} style={{ color: passbookCustomer.outstandingBalance > 0 ? '#dc2626' : '#16a34a' }}>
                          ₹{passbookCustomer.outstandingBalance.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="noPrint" style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const cust = passbookCustomer;
                        setPassbookCustomer(null);
                        handleAddUdharForCustomer(cust);
                      }}
                      className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                      style={{ background: '#ffffff', color: '#2563eb', borderColor: '#bfdbfe', fontWeight: 700 }}
                    >
                      <Plus size={14} />
                      <span>{isHindi ? 'नया उधार' : 'Add Udhar'}</span>
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
                        style={{ background: '#16a34a', color: '#ffffff', borderColor: '#15803d', fontWeight: 700 }}
                      >
                        <Check size={14} />
                        <span>{isHindi ? 'जमा करें' : 'Settle Due'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs Bar + Search */}
              <div className="noPrint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <div className={styles.passbookTabsBar}>
                  <button
                    type="button"
                    className={`${styles.passbookTabBtn} ${passbookTab === 'bills' ? styles.passbookTabBtnActive : ''}`}
                    onClick={() => setPassbookTab('bills')}
                  >
                    <FileText size={13} />
                    <span>Bill-wise History</span>
                    <span className={styles.passbookTabCount}>{customerHistory.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.passbookTabBtn} ${passbookTab === 'items' ? styles.passbookTabBtnActive : ''}`}
                    onClick={() => setPassbookTab('items')}
                  >
                    <Utensils size={13} />
                    <span>Item-wise Summary</span>
                    <span className={styles.passbookTabCount}>{totalUniqueDishes}</span>
                  </button>
                </div>

                <div className={styles.passbookSearchWrap}>
                  <Search size={14} color="#94a3b8" />
                  <input
                    type="text"
                    className={styles.passbookSearchInput}
                    placeholder={passbookTab === 'bills' ? 'Search bills...' : 'Search dishes...'}
                    value={passbookSearch}
                    onChange={(e) => setPassbookSearch(e.target.value)}
                  />
                  {passbookSearch && (
                    <button type="button" onClick={() => setPassbookSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tab Content: Bill-wise History */}
              {passbookTab === 'bills' && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569' }}>
                      {isHindi ? 'खाता विवरण व लेन-देन इतिहास' : 'Detailed Ledger Statement & History'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      {filteredHistory.length} transaction{filteredHistory.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                    <table className={styles.passbookTable}>
                      <thead>
                        <tr>
                          <th style={{ width: 120 }}>{isHindi ? 'दिनांक' : 'Date'}</th>
                          <th style={{ minWidth: 260 }}>{isHindi ? 'विवरण / व्यंजन' : 'Particulars / Items'}</th>
                          <th style={{ width: 100, textAlign: 'right' }}>{isHindi ? 'कुल बिल' : 'Total Bill'}</th>
                          <th style={{ width: 90, textAlign: 'right' }}>{isHindi ? 'भुगतान' : 'Paid'}</th>
                          <th style={{ width: 100, textAlign: 'right' }}>{isHindi ? 'उधार (बकाया)' : 'Udhar Due'}</th>
                          <th style={{ width: 85, textAlign: 'center' }}>{isHindi ? 'स्थिति' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                              {q ? 'No matching transactions found' : (isHindi ? 'कोई लेन-देन नहीं मिला' : 'No Transactions Found')}
                            </td>
                          </tr>
                        ) : (
                          filteredHistory.map((rec) => {
                            const due = Number(rec.borrowAmount !== undefined ? rec.borrowAmount : (rec.remainingAmount || 0));
                            const isSettled = rec.status === 'settled' || due <= 0;

                            return (
                              <tr key={rec._id}>
                                <td style={{ whiteSpace: 'nowrap', fontSize: '11.5px', color: '#64748b', width: 120 }}>
                                  <div style={{ fontWeight: 700, color: '#334155' }}>
                                    {new Date(rec.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                    {new Date(rec.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>

                                <td style={{ minWidth: 260 }}>
                                  {rec.items && rec.items.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: '280px' }}>
                                      {rec.items.map((it, idx) => (
                                        <span
                                          key={idx}
                                          className={styles.passbookItemChip}
                                        >
                                          <span style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: it.isVeg === false ? '#ef4444' : '#22c55e',
                                            display: 'inline-block', flexShrink: 0
                                          }} />
                                          {it.name} ×{it.quantity || 1}
                                          {it.price > 0 && <span style={{ color: '#94a3b8', fontSize: '10px' }}>₹{it.price}</span>}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                      {rec.notes || 'Order purchase'}
                                    </span>
                                  )}

                                  {/* Settlement history breakdown */}
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

                                <td style={{ width: 100, textAlign: 'right' }}>
                                  <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>
                                    ₹{(Number(rec.totalBill) || 0).toLocaleString('en-IN')}
                                  </strong>
                                </td>

                                <td style={{ width: 90, textAlign: 'right' }}>
                                  <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '12px' }}>
                                    ₹{(Number(rec.paidAmount) || 0).toLocaleString('en-IN')}
                                  </span>
                                </td>

                                <td style={{ width: 100, textAlign: 'right' }}>
                                  <span style={{ color: due > 0 ? '#dc2626' : '#16a34a', fontWeight: 800, fontSize: '12.5px' }}>
                                    ₹{due.toLocaleString('en-IN')}
                                  </span>
                                </td>

                                <td style={{ width: 85, textAlign: 'center' }}>
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
              )}

              {/* Tab Content: Item-wise Summary */}
              {passbookTab === 'items' && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#475569' }}>
                      {isHindi ? 'व्यंजन अनुसार सारांश' : 'Dish-wise Consumption Summary'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      {filteredItemsList.length} unique dish{filteredItemsList.length > 1 ? 'es' : ''}
                    </span>
                  </div>

                  <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
                    <table className={styles.passbookItemTable}>
                      <thead>
                        <tr>
                          <th style={{ width: 44, minWidth: 44, maxWidth: 44, textAlign: 'center', padding: '10px 4px' }}>#</th>
                          <th style={{ minWidth: 240, textAlign: 'left' }}>Dish Name</th>
                          <th style={{ width: 120, textAlign: 'center' }}>Total Consumed</th>
                          <th style={{ width: 100, textAlign: 'right' }}>Unit Price</th>
                          <th style={{ width: 110, textAlign: 'right' }}>Total Spent</th>
                          <th style={{ width: 80, textAlign: 'center' }}>Orders</th>
                          <th style={{ width: 110 }}>Last Ordered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItemsList.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                              {q ? 'No matching dishes found' : 'No dish data available'}
                            </td>
                          </tr>
                        ) : (
                          filteredItemsList.map((item, idx) => (
                            <tr key={item.name}>
                              <td style={{ width: 44, minWidth: 44, maxWidth: 44, textAlign: 'center', padding: '10px 4px', color: '#94a3b8', fontWeight: 600, fontSize: '11px' }}>
                                {idx + 1}
                              </td>
                              <td style={{ minWidth: 240 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <span style={{
                                    width: 7, height: 7, borderRadius: '50%',
                                    background: item.isVeg === false ? '#ef4444' : '#22c55e',
                                    display: 'inline-block', flexShrink: 0
                                  }} />
                                  <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '12.5px' }}>{item.name}</span>
                                </div>
                              </td>
                              <td style={{ width: 120, textAlign: 'center' }}>
                                <span style={{
                                  background: 'rgba(59,130,246,0.12)',
                                  color: '#2563eb',
                                  fontWeight: 800,
                                  fontSize: '12px',
                                  padding: '2px 10px',
                                  borderRadius: 10
                                }}>
                                  ×{item.quantity}
                                </span>
                              </td>
                              <td style={{ width: 100, textAlign: 'right', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
                                ₹{item.unitPrice.toLocaleString('en-IN')}
                              </td>
                              <td style={{ width: 110, textAlign: 'right' }}>
                                <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '12.5px' }}>
                                  ₹{item.totalAmount.toLocaleString('en-IN')}
                                </span>
                              </td>
                              <td style={{ width: 80, textAlign: 'center', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
                                {item.ordersCount}×
                              </td>
                              <td style={{ width: 110, fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                {new Date(item.lastOrdered).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Properly Placed Bottom Summary Bar (Reconciled with Total Billed) */}
                  {filteredItemsList.length > 0 && (
                    <div className={styles.passbookSummaryBar}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '12.5px' }}>
                          Dish Items: ₹{totalItemsValue.toLocaleString('en-IN')}
                        </span>
                        <span style={{
                          background: 'rgba(59,130,246,0.12)',
                          color: '#2563eb',
                          fontWeight: 800,
                          fontSize: '11.5px',
                          padding: '2px 8px',
                          borderRadius: 12
                        }}>
                          {filteredItemsList.length} dishes • ×{totalItemsQty} items
                        </span>
                        {nonItemizedCount > 0 && (
                          <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                            + ₹{nonItemizedTotal.toLocaleString('en-IN')} ({nonItemizedCount} manual / other {nonItemizedCount > 1 ? 'orders' : 'order'})
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Total Billed:</span>
                        <span style={{ color: '#0f172a', fontWeight: 900, fontSize: '15px' }}>
                          ₹{(totalItemsValue + nonItemizedTotal).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer print stamp */}
              <div style={{ marginTop: 14, textAlign: 'center', fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                <span>{tenantInfo?.name || 'Cafe Application'}</span>
                <span>•</span>
                <span>Customer Khata Ledger Statement</span>
                <span>•</span>
                <span style={{ color: '#2563eb', fontWeight: 700 }}>Powered by DineviQ OS</span>
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
