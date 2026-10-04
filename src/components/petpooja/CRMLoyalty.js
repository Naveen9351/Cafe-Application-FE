import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Users, Award, Search, Plus, PhoneCall, Mail, Star,
  CheckCircle2, XCircle, Calendar, ArrowUpDown, Filter,
  Receipt, Clock, ChevronRight, X, TrendingUp, IndianRupee,
  RefreshCw, UserCheck, ShieldCheck, ShoppingBag, Sparkles,
  Info, ArrowRight, UserPlus, Download, Crown, Eye, MessageSquare, Phone,
  UtensilsCrossed, Tag, Gift, Edit3, Heart, AlertCircle, Send, KeyRound,
  SlidersHorizontal, RotateCcw, Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CRMLoyalty.module.css';
import { API_URL as API } from '../../config/api';

export default function CRMLoyalty({ tenantId, orders = [] }) {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Segment Dropdown Tab ('all', 'repeat', 'single', 'inactive')
  const [activeTab, setActiveTab] = useState('all');

  // Unified Search & Detailed Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all'); // 'all', 'verified', 'unverified'
  const [sortBy, setSortBy] = useState('highest_spend'); // 'highest_spend', 'highest_aov', 'recent_visit', 'total_visits', 'name_asc'
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // Side Drawer & Add Modal State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  const [formError, setFormError] = useState('');

  // OTP Verification State in Add Customer Modal
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpInputsRef = useRef([]);

  // Verify Unverified Customer Modal State
  const [verifyingCustomer, setVerifyingCustomer] = useState(null);
  const [verifyOtpMode, setVerifyOtpMode] = useState(false);
  const [verifyOtpDigits, setVerifyOtpDigits] = useState(['', '', '', '', '', '']);
  const [isVerifySending, setIsVerifySending] = useState(false);
  const [isVerifyLoading, setIsVerifyLoading] = useState(false);
  const [verifyCountdown, setVerifyCountdown] = useState(30);
  const [verifyCanResend, setVerifyCanResend] = useState(false);
  const [verifyFormError, setVerifyFormError] = useState('');
  const verifyOtpInputsRef = useRef([]);

  // Notes State per customer
  const [customerNotes, setCustomerNotes] = useState({});
  const [activeNoteText, setActiveNoteText] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [orders]);

  useEffect(() => {
    if (selectedCustomer) {
      const key = selectedCustomer._id || selectedCustomer.phone;
      setActiveNoteText(customerNotes[key] || selectedCustomer.notes || '');
    }
  }, [selectedCustomer]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (isOtpMode && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpMode, countdown]);

  // Countdown timer for Verify Customer Modal OTP
  useEffect(() => {
    let timer;
    if (verifyOtpMode && verifyCountdown > 0) {
      timer = setInterval(() => {
        setVerifyCountdown((prev) => {
          if (prev <= 1) {
            setVerifyCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [verifyOtpMode, verifyCountdown]);

  // Click outside listener for filter popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isFilterOpen]);

  const resetAddModal = () => {
    setNewCustomer({ name: '', phone: '', email: '' });
    setFormError('');
    setIsOtpMode(false);
    setIsPhoneVerified(false);
    setOtpDigits(['', '', '', '', '', '']);
    setCountdown(30);
    setCanResend(false);
    setIsAddModalOpen(false);
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      if (token) {
        const res = await axios.get(`${API}/petpooja/customers`, {
          headers: { 'x-auth-token': token }
        });
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setCustomers(res.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log('CRM API fetch error, deriving from active orders:', err);
    }

    // Derive from active orders if API fails or backend returns empty
    if (orders && orders.length > 0) {
      const custMap = new Map();
      orders.forEach((o) => {
        const phone = o.customerPhone || o.customerDetails?.phone;
        const name = o.customerName || o.customerDetails?.name || 'Guest Diner';
        if (phone || (name && name !== 'Walk-in Guest')) {
          const key = phone || name;
          const orderTotal = Number(o.settledAmount || o.finalAmount || o.totalAmount || o.total || 0);
          const orderDate = new Date(o.createdAt || Date.now());

          if (!custMap.has(key)) {
            custMap.set(key, {
              _id: `cust_${String(key).replace(/\D/g, '') || Date.now()}`,
              name: name,
              phone: phone || 'Not Provided',
              email: o.customerDetails?.email || '',
              isPhoneVerified: Boolean(o.isPhoneVerified || o.customerDetails?.isPhoneVerified),
              firstVisit: orderDate,
              lastVisit: orderDate,
              totalVisits: 1,
              lifetimeSpend: orderTotal,
              averageOrderValue: orderTotal,
              orders: [o]
            });
          } else {
            const existing = custMap.get(key);
            existing.totalVisits += 1;
            existing.lifetimeSpend += orderTotal;
            existing.averageOrderValue = Math.round(existing.lifetimeSpend / existing.totalVisits);
            if (orderDate < new Date(existing.firstVisit)) existing.firstVisit = orderDate;
            if (orderDate > new Date(existing.lastVisit)) existing.lastVisit = orderDate;
            if (o.isPhoneVerified || o.customerDetails?.isPhoneVerified) existing.isPhoneVerified = true;
            existing.orders.push(o);
          }
        }
      });

      const derived = Array.from(custMap.values());
      setCustomers(derived);
    } else {
      setCustomers([]);
    }
    setIsLoading(false);
  };

  // OTP Handlers
  const handleSendOtp = async () => {
    setFormError('');
    const cleanPhone = newCustomer.phone.replace(/[^0-9]/g, '');

    if (!newCustomer.name.trim()) {
      setFormError("Please enter Full Name before sending OTP");
      toast.error("Please enter Full Name before sending OTP");
      return;
    }
    if (cleanPhone.length < 10) {
      setFormError("Please enter a valid 10-digit mobile number");
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsOtpSending(true);
    try {
      const res = await axios.post(`${API}/customer/send-otp`, {
        phone: cleanPhone,
        name: newCustomer.name.trim()
      });

      toast.success(res.data.message || `OTP sent to +91 ${cleanPhone}`);
      if (res.data.devOtp) {
        toast(`Demo OTP: ${res.data.devOtp}`, { icon: '🔑', duration: 6000 });
      }

      setIsOtpMode(true);
      setCountdown(30);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err) {
      console.error('Send OTP failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to send OTP code. Please try again.';
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleOtpDigitChange = (idx, value) => {
    setFormError('');
    const clean = value.replace(/[^0-9]/g, '');
    const newOtp = [...otpDigits];

    if (clean.length > 1) {
      const digits = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtpDigits(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    newOtp[idx] = clean;
    setOtpDigits(newOtp);

    if (clean && idx < 5) {
      otpInputsRef.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      otpInputsRef.current[idx - 1]?.focus();
    }
  };

  const handleConfirmOtp = async () => {
    setFormError('');
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setFormError("Please enter the complete 6-digit OTP code");
      return toast.error("Please enter the complete 6-digit OTP");
    }

    setIsOtpVerifying(true);
    const cleanPhone = newCustomer.phone.replace(/[^0-9]/g, '');

    try {
      const res = await axios.post(`${API}/customer/verify-otp`, {
        phone: cleanPhone,
        otp: fullOtp,
        name: newCustomer.name.trim()
      });

      if (res.data.verified) {
        setIsPhoneVerified(true);
        setIsOtpMode(false);
        toast.success(`Mobile verified successfully! ✅`);
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      const errMsg = err.response?.data?.error || 'Incorrect OTP code. Please check and retry.';
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsOtpVerifying(false);
    }
  };

  // ── Existing Customer Verification Handlers ──
  const handleOpenVerifyModal = (cust) => {
    if (!cust) return;
    setVerifyingCustomer(cust);
    setVerifyOtpMode(false);
    setVerifyOtpDigits(['', '', '', '', '', '']);
    setVerifyFormError('');
    setVerifyCountdown(30);
    setVerifyCanResend(false);
  };

  const markCustomerAsVerified = (targetCust) => {
    setCustomers(prev => prev.map(c => {
      if ((c._id && c._id === targetCust._id) || (c.phone && c.phone === targetCust.phone)) {
        return { ...c, isPhoneVerified: true };
      }
      return c;
    }));
    if (selectedCustomer && ((selectedCustomer._id && selectedCustomer._id === targetCust._id) || (selectedCustomer.phone && selectedCustomer.phone === targetCust.phone))) {
      setSelectedCustomer(prev => ({ ...prev, isPhoneVerified: true }));
    }
  };

  const handleSendVerifyCustomerOtp = async () => {
    if (!verifyingCustomer) return;
    setVerifyFormError('');
    const cleanPhone = (verifyingCustomer.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setVerifyFormError("Invalid mobile number. Must be 10 digits.");
      return toast.error("Invalid mobile number");
    }
    setIsVerifySending(true);
    try {
      const res = await axios.post(`${API}/customer/send-otp`, {
        phone: cleanPhone,
        name: verifyingCustomer.name || 'Guest'
      });
      toast.success(res.data?.message || `OTP sent to +91 ${cleanPhone}`);
      if (res.data?.devOtp) {
        toast(`Demo OTP: ${res.data.devOtp}`, { icon: '🔑', duration: 6000 });
      }
      setVerifyOtpMode(true);
      setVerifyCountdown(30);
      setVerifyCanResend(false);
      setVerifyOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        verifyOtpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err) {
      console.error('Send OTP error:', err);
      const errMsg = err.response?.data?.error || 'Failed to send OTP code.';
      setVerifyFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsVerifySending(false);
    }
  };

  const handleVerifyOtpDigitChange = (idx, value) => {
    setVerifyFormError('');
    const clean = value.replace(/[^0-9]/g, '');
    const newOtp = [...verifyOtpDigits];

    if (clean.length > 1) {
      const digits = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setVerifyOtpDigits(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      verifyOtpInputsRef.current[nextIdx]?.focus();
      return;
    }

    newOtp[idx] = clean;
    setVerifyOtpDigits(newOtp);

    if (clean && idx < 5) {
      verifyOtpInputsRef.current[idx + 1]?.focus();
    }
  };

  const handleVerifyOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !verifyOtpDigits[idx] && idx > 0) {
      verifyOtpInputsRef.current[idx - 1]?.focus();
    }
  };

  const handleConfirmVerifyCustomerOtp = async () => {
    if (!verifyingCustomer) return;
    setVerifyFormError('');
    const fullOtp = verifyOtpDigits.join('');
    if (fullOtp.length < 6) {
      setVerifyFormError("Please enter the complete 6-digit OTP code");
      return toast.error("Please enter the complete 6-digit OTP");
    }

    setIsVerifyLoading(true);
    const cleanPhone = (verifyingCustomer.phone || '').replace(/[^0-9]/g, '');
    try {
      const res = await axios.post(`${API}/customer/verify-otp`, {
        phone: cleanPhone,
        otp: fullOtp,
        name: verifyingCustomer.name || 'Guest'
      });

      if (res.data?.verified) {
        markCustomerAsVerified(verifyingCustomer);
        toast.success(`+91 ${cleanPhone} verified successfully! ✅`);
        setVerifyingCustomer(null);
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);
      const errMsg = err.response?.data?.error || 'Incorrect OTP code. Please check and retry.';
      setVerifyFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const handleDirectAdminVerify = async () => {
    if (!verifyingCustomer) return;
    setIsVerifyLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token && verifyingCustomer._id) {
        try {
          await axios.put(`${API}/petpooja/customers/${verifyingCustomer._id}`, {
            isPhoneVerified: true
          }, { headers: { 'x-auth-token': token } });
        } catch (e) {
          console.log('Backend sync fallback:', e.message);
        }
      }
      markCustomerAsVerified(verifyingCustomer);
      toast.success(`${verifyingCustomer.name || 'Guest'} marked as Verified! ✅`);
      setVerifyingCustomer(null);
    } finally {
      setIsVerifyLoading(false);
    }
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newCustomer.name.trim()) {
      setFormError("Please enter guest full name");
      return toast.error("Please enter guest full name");
    }
    if (!newCustomer.phone.trim()) {
      setFormError("Please enter mobile number");
      return toast.error("Please enter mobile number");
    }

    const cleanPhone = newCustomer.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError("Please enter a valid 10-digit mobile number");
      return toast.error("Please enter a valid 10-digit mobile number");
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    const newCustObj = {
      ...newCustomer,
      _id: `cust_${Date.now()}`,
      isPhoneVerified: isPhoneVerified,
      firstVisit: new Date(),
      lastVisit: new Date(),
      totalVisits: 1,
      lifetimeSpend: 0,
      averageOrderValue: 0,
      orders: []
    };

    try {
      if (token) {
        await axios.post(`${API}/petpooja/customers`, {
          ...newCustomer,
          isPhoneVerified: isPhoneVerified
        }, {
          headers: { 'x-auth-token': token }
        });
      }
      setCustomers(prev => [newCustObj, ...prev]);
      toast.success(`Guest profile registered for ${newCustomer.name}!`);
      resetAddModal();
    } catch (err) {
      console.log('Customer registered locally fallback:', err);
      setCustomers(prev => [newCustObj, ...prev]);
      toast.success(`Guest profile registered for ${newCustomer.name}!`);
      resetAddModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = () => {
    if (!selectedCustomer) return;
    const key = selectedCustomer._id || selectedCustomer.phone;
    setCustomerNotes(prev => ({ ...prev, [key]: activeNoteText }));
    toast.success("Guest preference notes saved!");
  };

  // Avatar Gradient Generation
  const getAvatarGradient = (name = '') => {
    const gradients = [
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || 'GU').toUpperCase();
  };

  const formatCurrency = (num) => {
    const val = Number(num) || 0;
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  // Calculate top favorite dishes for customer
  const favoriteItems = useMemo(() => {
    if (!selectedCustomer || !selectedCustomer.orders || selectedCustomer.orders.length === 0) {
      return [];
    }
    const counts = {};
    selectedCustomer.orders.forEach(ord => {
      (ord.items || []).forEach(it => {
        const name = it.name || it.item?.name || 'Item';
        const qty = Number(it.quantity || 1);
        counts[name] = (counts[name] || 0) + qty;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [selectedCustomer]);

  // Group customer orders by Date for timeline
  const groupedOrders = useMemo(() => {
    if (!selectedCustomer || !selectedCustomer.orders || selectedCustomer.orders.length === 0) {
      return {};
    }

    const groups = {};
    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const sorted = [...selectedCustomer.orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    sorted.forEach(ord => {
      const d = new Date(ord.createdAt || Date.now());
      const dStr = d.toDateString();
      let label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      if (dStr === todayStr) label = `Today (${label})`;
      else if (dStr === yesterdayStr) label = `Yesterday (${label})`;

      if (!groups[label]) groups[label] = [];
      groups[label].push(ord);
    });

    return groups;
  }, [selectedCustomer]);

  // Export CSV Feature
  const handleExportCSV = () => {
    if (customers.length === 0) return toast.error("No customer records to export");
    const headers = ["Full Name", "Mobile", "Email", "Verified", "Visits", "Lifetime Spend", "AOV", "First Visit", "Last Visit"];
    const rows = customers.map(c => [
      `"${c.name || 'Guest'}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      c.isPhoneVerified ? 'Yes' : 'No',
      c.totalVisits || 1,
      Math.round(c.lifetimeSpend || 0),
      Math.round(c.averageOrderValue || c.aov || 0),
      c.firstVisit ? new Date(c.firstVisit).toISOString().slice(0, 10) : '',
      c.lastVisit ? new Date(c.lastVisit).toISOString().slice(0, 10) : ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `serviq_crm_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Customer directory exported as CSV!");
  };

  // WhatsApp Promo Link Generator
  const getWhatsAppPromoUrl = (phone, promoType = 'vip10') => {
    if (!phone || phone === 'Not Provided') return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    const name = selectedCustomer?.name || 'Guest';

    let message = '';
    if (promoType === 'vip10') {
      message = `Hello ${name}! ✨ As a valued VIP guest at our cafe, here's an exclusive 10% discount on your next dine-in visit! Use code: *VIP10*. See you soon! ☕🍕`;
    } else if (promoType === 'feedback') {
      message = `Hello ${name}! 🌟 Thank you for dining with us. We hope you loved the food! We would love to hear your feedback on your experience. 💬`;
    } else if (promoType === 'miss_you') {
      message = `Hey ${name}! 🎁 We miss having you around! Visit us this week and get a complimentary dessert/beverage on your order! ☕🍰`;
    }

    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Computed KPI Metrics & Tab Counts
  const { metrics, tabCounts } = useMemo(() => {
    const totalCust = customers.length;
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const inactiveCount = customers.filter(c => new Date(c.lastVisit || 0).getTime() < thirtyDaysAgo).length;

    const totalSpend = customers.reduce((sum, c) => sum + (Number(c.lifetimeSpend) || 0), 0);
    const totalOrdersCount = customers.reduce((s, c) => s + (Number(c.totalVisits) || (c.orders?.length || 1)), 0);
    const overallAov = totalOrdersCount > 0 ? Math.round(totalSpend / totalOrdersCount) : 0;

    const verifiedCount = customers.filter(c => c.isPhoneVerified).length;
    const verifiedRate = totalCust > 0 ? Math.round((verifiedCount / totalCust) * 100) : 0;
    const repeatCustCount = customers.filter(c => (Number(c.totalVisits) || (c.orders?.length || 1)) >= 2).length;
    const singleVisitCount = totalCust - repeatCustCount;
    const repeatRate = totalCust > 0 ? Math.round((repeatCustCount / totalCust) * 100) : 0;

    return {
      metrics: { totalCust, totalOrders: totalOrdersCount, repeatCustCount, totalSpend, overallAov, verifiedRate, repeatRate },
      tabCounts: { all: totalCust, repeat: repeatCustCount, single: singleVisitCount, verified: verifiedCount, inactive: inactiveCount }
    };
  }, [customers]);

  // Filtering & Sorting
  const filteredCustomers = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    return customers
      .filter(c => {
        const visits = Number(c.totalVisits) || (c.orders?.length || 1);
        // Segment Dropdown Filter
        if (activeTab === 'repeat' && visits < 2) return false;
        if (activeTab === 'single' && visits > 1) return false;
        if (activeTab === 'inactive' && new Date(c.lastVisit || 0).getTime() >= thirtyDaysAgo) return false;

        // Unified Search (Name, Phone, Email)
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = (c.name || '').toLowerCase().includes(q);
          const matchesPhone = String(c.phone || '').toLowerCase().includes(q);
          const matchesEmail = (c.email || '').toLowerCase().includes(q);
          if (!matchesName && !matchesPhone && !matchesEmail) return false;
        }

        let matchesVerification = true;
        if (verificationFilter === 'verified') matchesVerification = Boolean(c.isPhoneVerified);
        if (verificationFilter === 'unverified') matchesVerification = !Boolean(c.isPhoneVerified);

        return matchesVerification;
      })
      .sort((a, b) => {
        const aSpend = Number(a.lifetimeSpend || 0);
        const bSpend = Number(b.lifetimeSpend || 0);
        const aVisits = Number(a.totalVisits || 1);
        const bVisits = Number(b.totalVisits || 1);
        const aAov = Number(a.averageOrderValue || a.aov || (aSpend / aVisits));
        const bAov = Number(b.averageOrderValue || b.aov || (bSpend / bVisits));

        if (sortBy === 'highest_spend') return bSpend - aSpend;
        if (sortBy === 'highest_aov') return bAov - aAov;
        if (sortBy === 'recent_visit') return new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0);
        if (sortBy === 'total_visits') return bVisits - aVisits;
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });
  }, [customers, activeTab, searchQuery, verificationFilter, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, verificationFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeTab !== 'all') count++;
    if (verificationFilter !== 'all') count++;
    if (sortBy !== 'highest_spend') count++;
    return count;
  }, [activeTab, verificationFilter, sortBy]);

  const hasActiveFilters = searchQuery || activeFilterCount > 0;

  const resetFilters = () => {
    setActiveTab('all');
    setSearchQuery('');
    setVerificationFilter('all');
    setSortBy('highest_spend');
  };

  // Ellipsis Pagination Generator Helper
  const getPaginationRange = (current, total) => {
    if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  return (
    <div className={styles.page}>
      {/* Local high z-index Toaster for instant front-facing notifications */}
      <Toaster position="top-center" containerStyle={{ zIndex: 99999999 }} toastOptions={{ style: { zIndex: 99999999, fontWeight: '700' } }} />

      {/* ── Top Header Row ── */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.brandIconWrap}>
            <Users size={20} />
          </div>
          <div>
            <h2 className={styles.title}>Customer Directory & CRM</h2>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.btnSecondary}
            onClick={handleExportCSV}
            title="Download CSV Customer Directory"
          >
            <Download size={13} />
          </button>

          <button
            className={styles.btnSecondary}
            onClick={fetchCustomers}
            title="Refresh Customer Directory"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            className={styles.btnPrimary}
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
            title="Register New Customer"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* ── Full-Width Maximized Customer Table Card ── */}
      <div className={styles.fullWidthCard}>
        {/* Unified Toolbar with Compact Inline Metrics (Matching Orders Clean Layout) */}
        <div className={styles.unifiedToolbar}>
          {/* Left: Compact Badge + Total Spend + AOV + Repeat Orders */}
          <div className={styles.toolbarLeft}>
            <div className={styles.totalOrdersLedgerBadge}>
              <Users size={14} color="#059669" />
              <span>All Guests</span>
              <span className={styles.totalOrdersLedgerCount}>{filteredCustomers.length}</span>
            </div>

            <div className={styles.inlineMetricItem}>
              <span className={styles.inlineMetricLabel}>Total Spend:</span>
              <span className={styles.inlineMetricVal}>{formatCurrency(metrics.totalSpend)}</span>
            </div>

            <div className={styles.inlineMetricItem}>
              <span className={styles.inlineMetricLabel}>AOV:</span>
              <span className={styles.inlineMetricVal}>{formatCurrency(metrics.overallAov)}</span>
            </div>

            <div className={styles.inlineMetricItem}>
              <span className={styles.inlineMetricLabel}>Orders:</span>
              <span className={styles.inlineMetricVal}>{metrics.totalOrders} ({metrics.repeatRate}% repeat)</span>
            </div>
          </div>

          {/* Search & Multi-Level Filter Trigger */}
          <div className={styles.toolbarRight}>
            {/* Search Field */}
            <div className={styles.searchField}>
              <Search size={13} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search Name, Phone, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.inputField}
              />
              {searchQuery && (
                <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Trigger & Multi-level Popup */}
            <div className={styles.filterWrapper} ref={filterRef}>
              <button
                type="button"
                className={`${styles.filterIconButton} ${activeFilterCount > 0 ? styles.filterIconButtonActive : ''} ${isFilterOpen ? styles.filterIconButtonOpen : ''}`}
                onClick={() => setIsFilterOpen(prev => !prev)}
                title="Filter & Sort Customers"
                aria-label="Filter & Sort Customers"
              >
                <Filter size={14} />
                {activeFilterCount > 0 && (
                  <span className={styles.filterBadge}>{activeFilterCount}</span>
                )}
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    className={styles.filterPopover}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {/* Header */}
                    <div className={styles.filterPopoverHeader}>
                      <div className={styles.filterPopoverTitleWrap}>
                        <SlidersHorizontal size={14} className={styles.filterHeaderIcon} />
                        <span className={styles.filterPopoverTitle}>Filters & Sort</span>
                        {activeFilterCount > 0 && (
                          <span className={styles.filterActiveCountTag}>
                            {activeFilterCount} active
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className={styles.filterCloseBtn}
                        onClick={() => setIsFilterOpen(false)}
                        aria-label="Close Filter Popup"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Popover Body with Multi-Level Filters */}
                    <div className={styles.filterPopoverBody}>
                      {/* Level 1: Guest Segment */}
                      <div className={styles.filterGroup}>
                        <label className={styles.filterGroupLabel}>
                          <Users size={12} />
                          Guest Segment
                        </label>
                        <div className={styles.filterChipGrid}>
                          {[
                            { id: 'all', label: `All Guests (${tabCounts.all})` },
                            { id: 'repeat', label: `Repeat Diners (${tabCounts.repeat})` },
                            { id: 'single', label: `Single Visit (${tabCounts.single})` },
                            ...(tabCounts.inactive > 0 ? [{ id: 'inactive', label: `Inactive (${tabCounts.inactive})` }] : [])
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              className={`${styles.filterChip} ${activeTab === opt.id ? styles.filterChipActive : ''}`}
                              onClick={() => setActiveTab(opt.id)}
                            >
                              {activeTab === opt.id && <Check size={11} className={styles.filterCheckIcon} />}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Level 2: Verification Status */}
                      <div className={styles.filterGroup}>
                        <label className={styles.filterGroupLabel}>
                          <ShieldCheck size={12} />
                          Phone Verification
                        </label>
                        <div className={styles.filterChipGrid}>
                          {[
                            { id: 'all', label: 'All Verification' },
                            { id: 'verified', label: 'Verified Only' },
                            { id: 'unverified', label: 'Unverified Only' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              className={`${styles.filterChip} ${verificationFilter === opt.id ? styles.filterChipActive : ''}`}
                              onClick={() => setVerificationFilter(opt.id)}
                            >
                              {verificationFilter === opt.id && <Check size={11} className={styles.filterCheckIcon} />}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Level 3: Sort Options */}
                      <div className={styles.filterGroup}>
                        <label className={styles.filterGroupLabel}>
                          <ArrowUpDown size={12} />
                          Sort Directory By
                        </label>
                        <div className={styles.filterChipGrid}>
                          {[
                            { id: 'highest_spend', label: 'Highest Spend' },
                            { id: 'highest_aov', label: 'Highest AOV' },
                            { id: 'recent_visit', label: 'Recent Visit' },
                            { id: 'total_visits', label: 'Total Visits' },
                            { id: 'name_asc', label: 'Name (A-Z)' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              className={`${styles.filterChip} ${sortBy === opt.id ? styles.filterChipActive : ''}`}
                              onClick={() => setSortBy(opt.id)}
                            >
                              {sortBy === opt.id && <Check size={11} className={styles.filterCheckIcon} />}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Popover Footer */}
                    <div className={styles.filterPopoverFooter}>
                      <button
                        type="button"
                        className={styles.filterResetBtn}
                        onClick={resetFilters}
                        disabled={activeFilterCount === 0 && !searchQuery}
                      >
                        <RotateCcw size={12} />
                        Reset
                      </button>
                      <button
                        type="button"
                        className={styles.filterApplyBtn}
                        onClick={() => setIsFilterOpen(false)}
                      >
                        Apply Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Maximized Full-Width Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Mobile Number</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Last Visit</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>Visits</th>
                <th className={styles.th}>Lifetime Spend</th>
                <th className={styles.th}>AOV</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 7 }).map((_, sIdx) => (
                  <tr key={sIdx} className={styles.skeletonRow}>
                    <td className={styles.skeletonCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div className={styles.skeletonAvatar} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                          <div className={styles.skeletonLine} style={{ width: '65%', height: '13px' }} />
                          <div className={styles.skeletonLine} style={{ width: '40%', height: '9px' }} />
                        </div>
                      </div>
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonLine} style={{ width: '90px', height: '12px' }} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonPill} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonLine} style={{ width: '75px', height: '11px' }} />
                    </td>
                    <td className={styles.skeletonCell} style={{ textAlign: 'center' }}>
                      <div className={styles.skeletonLine} style={{ width: '26px', height: '22px', margin: '0 auto', borderRadius: '7px' }} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonLine} style={{ width: '60px', height: '13px' }} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonLine} style={{ width: '50px', height: '12px' }} />
                    </td>
                    <td className={styles.skeletonCell} style={{ textAlign: 'center' }}>
                      <div className={styles.skeletonLine} style={{ width: '75px', height: '24px', margin: '0 auto', borderRadius: '7px' }} />
                    </td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyState}>
                      <Users size={34} strokeWidth={1.5} />
                      <p style={{ margin: 0, fontWeight: '600', color: '#64748b' }}>
                        No customer profiles match your selected search criteria.
                      </p>
                      {hasActiveFilters && (
                        <button className={styles.resetBtn} onClick={resetFilters}>
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map(cust => {
                  const spend = Number(cust.lifetimeSpend) || 0;
                  const visits = Number(cust.totalVisits) || (cust.orders?.length || 1);
                  const aov = Number(cust.averageOrderValue || cust.aov || (visits > 0 ? Math.round(spend / visits) : 0));
                  const isSelected = selectedCustomer?._id === cust._id || selectedCustomer?.phone === cust.phone;

                  return (
                    <motion.tr
                      key={cust._id || cust.phone}
                      className={`${styles.trHover} ${isSelected ? styles.trActive : ''}`}
                      onClick={() => setSelectedCustomer(cust)}
                    >
                      {/* Customer Identity */}
                      <td className={styles.td}>
                        <div className={styles.customerIdentity}>
                          <div
                            className={styles.avatar}
                            style={{ background: getAvatarGradient(cust.name) }}
                          >
                            {getInitials(cust.name)}
                          </div>
                          <div className={styles.identityText}>
                            <div className={styles.nameRow}>
                              <span>{cust.name || 'Guest Diner'}</span>
                            </div>
                            {cust.email && (
                              <span className={styles.emailText}>{cust.email}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mobile Number */}
                      <td className={styles.td} style={{ fontWeight: '600', color: '#1e293b' }}>
                        {cust.phone || 'Not Provided'}
                      </td>

                      {/* Status */}
                      <td className={styles.td}>
                        {cust.isPhoneVerified ? (
                          <span className={styles.badgeVerified}>
                            <CheckCircle2 size={11} /> Verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={styles.badgeUnverifiedBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenVerifyModal(cust);
                            }}
                            title="Click to Verify Customer Mobile via OTP"
                          >
                            <XCircle size={11} />
                            <span>Unverified</span>
                          </button>
                        )}
                      </td>

                      {/* Last Visit */}
                      <td className={styles.td} style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '500' }}>
                        {formatDate(cust.lastVisit || cust.firstVisit)}
                      </td>

                      {/* Visits Count */}
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        <span className={styles.visitsPill}>
                          {visits}
                        </span>
                      </td>

                      {/* Lifetime Spend */}
                      <td className={styles.td}>
                        <span className={styles.spendText}>
                          {formatCurrency(spend)}
                        </span>
                      </td>

                      {/* AOV */}
                      <td className={styles.td}>
                        <span className={styles.aovText}>
                          {formatCurrency(aov)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                          }}
                          className={styles.actionBtn}
                        >
                          <Eye size={12} />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Ellipsis Pagination */}
        <div className={styles.tableFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '12px 18px' }}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={12} className="animate-spin" color="#059669" />
              <span>Loading customer directory...</span>
            </span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
              Showing <strong style={{ color: '#0f172a', fontWeight: 600 }}>{filteredCustomers.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} - {Math.min(currentPage * pageSize, filteredCustomers.length)}</strong> of <strong style={{ color: '#0f172a', fontWeight: 600 }}>{filteredCustomers.length}</strong> guests
            </span>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : '#ffffff', color: currentPage === 1 ? '#cbd5e1' : '#0f172a', fontWeight: 600, fontSize: '11px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Prev
              </button>
              {getPaginationRange(currentPage, totalPages).map((p, pIdx) => {
                if (p === '...') {
                  return (
                    <span key={`dots_${pIdx}`} style={{ padding: '0 4px', color: '#94a3b8', fontWeight: 500, fontSize: '12px' }}>
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    style={{ minWidth: '28px', height: '28px', padding: '0 4px', borderRadius: '6px', border: 'none', background: currentPage === p ? '#059669' : '#f1f5f9', color: currentPage === p ? '#ffffff' : '#475569', fontWeight: currentPage === p ? 600 : 500, fontSize: '11px', cursor: 'pointer' }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f8fafc' : '#ffffff', color: currentPage === totalPages ? '#cbd5e1' : '#0f172a', fontWeight: 500, fontSize: '11px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Slide-over Modal: Add Customer Record with OTP Verification ── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) resetAddModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className={styles.modalContent}
            >
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <UserPlus size={18} color="#059669" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                    Register New Customer
                  </h3>
                </div>
                <button
                  onClick={resetAddModal}
                  className={styles.closeBtn}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Prominent Inline Error Banner right in the modal */}
              {formError && (
                <div className={styles.errorBanner} style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                  <button
                    type="button"
                    onClick={() => setFormError('')}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <form onSubmit={handleRegisterCustomer} className={styles.formWrapper}>
                {/* 1. Full Name */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span>Full Name</span>
                    <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div className={styles.inputIconWrap}>
                    <Users size={15} className={styles.fieldIcon} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Kapoor"
                      value={newCustomer.name}
                      onChange={(e) => {
                        setNewCustomer({ ...newCustomer, name: e.target.value });
                        if (formError) setFormError('');
                      }}
                      className={`${styles.formInput} ${formError && !newCustomer.name.trim() ? styles.inputError : ''}`}
                    />
                  </div>
                </div>

                {/* 2. Mobile Number with OTP Verification trigger */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span>Mobile Number</span>
                    <span style={{ color: '#dc2626' }}>* (10 Digits)</span>
                  </label>
                  <div className={styles.inputIconWrap}>
                    <PhoneCall size={15} className={styles.fieldIcon} />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      disabled={isPhoneVerified}
                      placeholder="e.g. 9876543210"
                      value={newCustomer.phone}
                      onChange={(e) => {
                        setNewCustomer({ ...newCustomer, phone: e.target.value.replace(/\D/g, '') });
                        setIsPhoneVerified(false);
                        if (formError) setFormError('');
                      }}
                      className={`${styles.formInput} ${formError && newCustomer.phone.length < 10 ? styles.inputError : ''}`}
                    />

                    {/* Verified Pill or Send OTP Button */}
                    {isPhoneVerified ? (
                      <span className={styles.verifiedPhonePill}>
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    ) : (
                      newCustomer.phone.length === 10 && !isOtpMode && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isOtpSending}
                          className={styles.sendOtpPillBtn}
                        >
                          <KeyRound size={12} />
                          <span>{isOtpSending ? 'Sending...' : 'Verify with OTP'}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 3. OTP Code Input Section (Visible when OTP Mode is active) */}
                {isOtpMode && !isPhoneVerified && (
                  <div className={styles.otpSectionBox}>
                    <div className={styles.otpHeaderRow}>
                      <span className={styles.otpPromptTitle}>
                        <ShieldCheck size={14} color="#059669" />
                        <span>Enter 6-Digit Verification Code</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtpMode(false);
                          setFormError('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Cancel
                      </button>
                    </div>

                    <div className={styles.otpInputsContainer}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className={styles.otpDigitInput}
                        />
                      ))}
                    </div>

                    <div className={styles.otpActionsRow}>
                      <div>
                        {countdown > 0 ? (
                          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Resend in <strong>{countdown}s</strong></span>
                        ) : (
                          <button
                            type="button"
                            disabled={!canResend || isOtpSending}
                            onClick={handleSendOtp}
                            className={styles.resendBtn}
                          >
                            Resend OTP Code
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isOtpVerifying || otpDigits.join('').length < 6}
                        onClick={handleConfirmOtp}
                        className={styles.verifyOtpConfirmBtn}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isOtpVerifying ? 'Verifying...' : 'Confirm OTP'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Email Address */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span>Email Address</span>
                    <span style={{ color: '#94a3b8', fontWeight: '600' }}>Optional</span>
                  </label>
                  <div className={styles.inputIconWrap}>
                    <Mail size={15} className={styles.fieldIcon} />
                    <input
                      type="email"
                      placeholder="rahul@domain.com"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                {/* 5. Submit Button */}
                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                  <Plus size={15} />
                  <span>
                    {isSubmitting
                      ? 'Registering...'
                      : isPhoneVerified
                        ? 'Save Verified Customer Profile'
                        : 'Register Customer Profile'}
                  </span>
                </button>

                <div className={styles.infoBanner}>
                  <Info size={15} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p className={styles.infoText}>
                    <strong>Smart Sync:</strong> Orders placed via Dine-in QR or POS Terminal using this mobile number will automatically sync to this CRM profile.
                  </p>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: Verify Customer Mobile via OTP ── */}
      <AnimatePresence>
        {verifyingCustomer && (
          <div
            className={styles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setVerifyingCustomer(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className={styles.modalContent}
            >
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <ShieldCheck size={20} color="#059669" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                    Verify Customer Mobile
                  </h3>
                </div>
                <button
                  onClick={() => setVerifyingCustomer(null)}
                  className={styles.closeBtn}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Prominent Error Banner */}
              {verifyFormError && (
                <div className={styles.errorBanner} style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{verifyFormError}</span>
                  <button
                    type="button"
                    onClick={() => setVerifyFormError('')}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Customer Snapshot Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                  <div
                    className={styles.avatar}
                    style={{ background: getAvatarGradient(verifyingCustomer.name), width: '40px', height: '40px', fontSize: '0.95rem' }}
                  >
                    {getInitials(verifyingCustomer.name)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                      {verifyingCustomer.name || 'Guest Diner'}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📱 +91 {verifyingCustomer.phone || 'Not Provided'}
                    </span>
                  </div>
                </div>

                {!verifyOtpMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontWeight: '500', lineHeight: 1.4 }}>
                      Send a 6-digit verification passcode (OTP) to <strong>+91 {verifyingCustomer.phone}</strong> to authenticate this guest.
                    </p>

                    <button
                      type="button"
                      className={styles.submitBtn}
                      onClick={handleSendVerifyCustomerOtp}
                      disabled={isVerifySending}
                    >
                      {isVerifySending ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Sending OTP Code...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={15} />
                          <span>Send 6-Digit OTP to Customer</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className={styles.btnSecondary}
                      style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', border: '1px solid #cbd5e1' }}
                      onClick={handleDirectAdminVerify}
                      disabled={isVerifyLoading}
                    >
                      <CheckCircle2 size={15} color="#059669" />
                      <span>Instant Direct Verify (Counter / Manual)</span>
                    </button>
                  </div>
                ) : (
                  <div className={styles.otpSection}>
                    <div className={styles.otpHeaderRow}>
                      <div className={styles.otpLabel}>
                        <KeyRound size={14} color="#059669" />
                        <span>Enter 6-Digit OTP Code</span>
                      </div>
                      <span className={styles.otpPhoneBadge}>+91 {verifyingCustomer.phone}</span>
                    </div>

                    <div className={styles.otpInputsWrap}>
                      {verifyOtpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={el => verifyOtpInputsRef.current[idx] = el}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleVerifyOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleVerifyOtpKeyDown(idx, e)}
                          className={styles.otpDigitInput}
                          autoFocus={idx === 0}
                        />
                      ))}
                    </div>

                    <div className={styles.otpActionsRow}>
                      <div>
                        {verifyCountdown > 0 ? (
                          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>Resend in <strong>{verifyCountdown}s</strong></span>
                        ) : (
                          <button
                            type="button"
                            disabled={!verifyCanResend || isVerifySending}
                            onClick={handleSendVerifyCustomerOtp}
                            className={styles.resendBtn}
                          >
                            Resend OTP Code
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isVerifyLoading || verifyOtpDigits.join('').length < 6}
                        onClick={handleConfirmVerifyCustomerOtp}
                        className={styles.verifyOtpConfirmBtn}
                      >
                        <CheckCircle2 size={13} />
                        <span>{isVerifyLoading ? 'Verifying...' : 'Confirm OTP'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Right Slide-Over Side Drawer: Customer 360° Profile & Date-Grouped Timeline ── */}
      <AnimatePresence>
        {selectedCustomer && (
          <div
            className={styles.drawerOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedCustomer(null);
            }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={styles.drawerPanel}
            >
              {/* Drawer Header */}
              <div className={styles.drawerHeader}>
                <div className={styles.drawerProfile}>
                  <div
                    className={styles.drawerAvatar}
                    style={{ background: getAvatarGradient(selectedCustomer.name) }}
                  >
                    {getInitials(selectedCustomer.name)}
                  </div>
                  <div>
                    <div className={styles.drawerName}>
                      <span>{selectedCustomer.name}</span>
                    </div>
                    <div className={styles.drawerContactRow}>
                      <span>📞 {selectedCustomer.phone}</span>
                      <span>•</span>
                      {selectedCustomer.isPhoneVerified ? (
                        <span className={styles.drawerVerifiedText}>✅ Verified</span>
                      ) : (
                        <button
                          type="button"
                          className={styles.drawerVerifyTrigger}
                          onClick={() => handleOpenVerifyModal(selectedCustomer)}
                          title="Click to Verify Customer Mobile"
                        >
                          ❌ Unverified
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.quickActionBtns}>
                  {selectedCustomer.phone && selectedCustomer.phone !== 'Not Provided' && (
                    <>
                      <a
                        href={`https://wa.me/91${selectedCustomer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.contactIconBtn}
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare size={14} color="#16a34a" />
                      </a>
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className={styles.contactIconBtn}
                        title="Call Customer"
                      >
                        <Phone size={14} />
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className={styles.closeDrawerBtn}
                    title="Close Drawer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className={styles.drawerBody}>
                {/* Metrics Summary Strip */}
                <div className={styles.drawerMetricsGrid}>
                  <div>
                    <div className={styles.drawerMetricLabel}>Total Visits</div>
                    <div className={styles.drawerMetricVal}>
                      {selectedCustomer.totalVisits || selectedCustomer.orders?.length || 1}
                    </div>
                  </div>
                  <div>
                    <div className={styles.drawerMetricLabel}>Lifetime Spend</div>
                    <div className={styles.drawerMetricVal} style={{ color: '#059669' }}>
                      {formatCurrency(selectedCustomer.lifetimeSpend || 0)}
                    </div>
                  </div>
                  <div>
                    <div className={styles.drawerMetricLabel}>Avg Ticket (AOV)</div>
                    <div className={styles.drawerMetricVal}>
                      {formatCurrency(
                        selectedCustomer.averageOrderValue ||
                        selectedCustomer.aov ||
                        Math.round((Number(selectedCustomer.lifetimeSpend) || 0) / Math.max(1, Number(selectedCustomer.totalVisits) || 1))
                      )}
                    </div>
                  </div>
                </div>

                {/* 📅 Date-Grouped Order History Timeline */}
                <div className={styles.timelineSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: '900', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={15} color="#059669" />
                      <span>Order History Timeline ({selectedCustomer.orders?.length || 0})</span>
                    </h4>
                  </div>

                  {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                    <div className={styles.emptyState} style={{ padding: '2rem 1rem' }}>
                      <Receipt size={30} />
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', fontWeight: '600' }}>
                        No past order records found for this guest.
                      </p>
                    </div>
                  ) : (
                    Object.entries(groupedOrders).map(([dateLabel, dateOrders]) => (
                      <div key={dateLabel} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Date Header Badge */}
                        <div className={styles.dateGroupHeader}>
                          <Calendar size={13} color="#059669" />
                          <span>{dateLabel}</span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 'auto', fontWeight: '700' }}>
                            {dateOrders.length} {dateOrders.length === 1 ? 'order' : 'orders'}
                          </span>
                        </div>

                        {/* Orders under this date */}
                        <div className={styles.dateGroupOrders}>
                          {dateOrders.map((ord, idx) => (
                            <div
                              key={ord._id || idx}
                              className={styles.orderCardDrawer}
                            >
                              <div className={styles.orderCardHeader}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span className={styles.orderNumber}>
                                    Order #{ord.orderNumber || ord._id?.slice(-6) || idx + 1}
                                  </span>
                                  <span className={styles.tableTag}>
                                    {ord.tableNumber ? `Table ${ord.tableNumber}` : (ord.orderType || 'Dine-In')}
                                  </span>
                                </div>
                                <span className={styles.orderAmount}>
                                  {formatCurrency(ord.settledAmount || ord.finalAmount || ord.totalAmount || ord.total || 0)}
                                </span>
                              </div>

                              <div className={styles.orderMetaRow}>
                                <span>{new Date(ord.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span>Status: <strong style={{ textTransform: 'capitalize', color: '#0f172a' }}>{ord.status || 'completed'}</strong></span>
                                {ord.paymentMethod && (
                                  <>
                                    <span>•</span>
                                    <span style={{ textTransform: 'uppercase', fontSize: '0.68rem', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontWeight: '800' }}>
                                      {ord.paymentMethod}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Items list */}
                              {ord.items && ord.items.length > 0 && (
                                <div className={styles.itemsContainer}>
                                  {ord.items.map((it, itIdx) => (
                                    <div key={itIdx} className={styles.itemRow}>
                                      <span>{it.quantity}x {it.name || it.item?.name || 'Menu Item'}</span>
                                      <span style={{ fontWeight: '800' }}>₹{(it.price || 0) * (it.quantity || 1)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
