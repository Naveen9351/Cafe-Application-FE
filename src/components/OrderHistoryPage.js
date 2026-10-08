import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Receipt, Clock, Calendar, Utensils, RefreshCw,
  Search, ChevronRight, Sun, Moon, ArrowRight, ShieldCheck, CheckCircle2,
  Phone, ChefHat, Sparkles, Check, AlertCircle, Edit2, Flame, MapPin, ShoppingBag, Wallet
} from 'lucide-react';
import axios from 'axios';
import { API_URL as API } from '../config/api';
import { decodeTableToken, encodeTableToken } from '../utils/tableToken';
import TableBadge from './common/TableBadge';
import CustomerBottomNav from './common/CustomerBottomNav';

import RestaurantCafeLottieLoader from './RestaurantCafeLottieLoader';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve mobile number from all possible localStorage sources
  const getResolvedPhone = () => {
    let p = localStorage.getItem('customer_phone') || localStorage.getItem('verified_customer_phone') || '';
    if (!p) {
      try {
        const cu = JSON.parse(localStorage.getItem('customer_user') || '{}');
        if (cu?.phone) p = cu.phone;
      } catch (e) {}
    }
    if (!p) {
      try {
        const vc = JSON.parse(localStorage.getItem('verifiedCustomer') || '{}');
        if (vc?.phone) p = vc.phone;
      } catch (e) {}
    }
    if (!p) {
      try {
        const c = JSON.parse(localStorage.getItem('customer') || '{}');
        if (c?.phone) p = c.phone;
      } catch (e) {}
    }
    return p ? String(p).replace(/[^0-9]/g, '') : '';
  };

  const [phone, setPhone] = useState(() => getResolvedPhone());
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhoneInput, setTempPhoneInput] = useState('');

  // Table & Tenant resolution
  const tableParam = searchParams.get('table') || searchParams.get('t') || searchParams.get('code');
  const tableNumber = tableParam ? decodeTableToken(tableParam) : (localStorage.getItem('tableNumber') || '');
  const tenantId = searchParams.get('tenantId') || localStorage.getItem('tenantId') || '';

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("isDarkMode");
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  const tenantInfo = {
    name: localStorage.getItem('restaurant_name') || "SERVIQ Gourmet Bistro"
  };

  useEffect(() => {
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 1. Session IDs
      let sessionIds = [];
      try {
        const raw = localStorage.getItem('serviq_session_orders');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) sessionIds = parsed;
        }
      } catch (e) {}
      const lastOrd = localStorage.getItem('serviq_last_order_id');
      if (lastOrd && !sessionIds.includes(lastOrd)) sessionIds.push(lastOrd);

      const allFoundOrders = new Map();

      // Preload cached orders from localStorage
      try {
        const cachedRaw = localStorage.getItem('serviq_order_history');
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach(ord => {
              if (ord && (ord._id || ord.orderNumber)) {
                allFoundOrders.set(String(ord._id || ord.orderNumber), ord);
              }
            });
          }
        }
      } catch (e) {}

      const effectivePhone = phone || getResolvedPhone();

      // Step A: Attempt /orders/history/customer
      try {
        const res = await axios.get(`${API}/orders/history/customer`, {
          params: {
            phone: effectivePhone || undefined,
            tableNumber: tableNumber || undefined,
            sessionIds: sessionIds.length > 0 ? sessionIds.join(',') : undefined,
            tenantId: tenantId && tenantId !== 'demo-tenant' ? tenantId : undefined
          },
          timeout: 4500
        });
        if (Array.isArray(res.data)) {
          res.data.forEach(ord => {
            if (ord && (ord._id || ord.orderNumber)) {
              allFoundOrders.set(String(ord._id || ord.orderNumber), ord);
            }
          });
        }
      } catch (e) {
        // endpoint fallback
      }

      // Step B: Attempt /orders/active-session
      try {
        const activeRes = await axios.get(`${API}/orders/active-session`, {
          params: {
            phone: effectivePhone || undefined,
            tableNumber: tableNumber || undefined,
            tenantId: tenantId && tenantId !== 'demo-tenant' ? tenantId : undefined
          },
          timeout: 4500
        });
        if (activeRes.data) {
          if (Array.isArray(activeRes.data.sessionOrders)) {
            activeRes.data.sessionOrders.forEach(ord => {
              if (ord && (ord._id || ord.orderNumber)) {
                allFoundOrders.set(String(ord._id || ord.orderNumber), ord);
              }
            });
          } else if (activeRes.data._id) {
            allFoundOrders.set(String(activeRes.data._id), activeRes.data);
          }
        }
      } catch (e) {}

      // Step C: Fetch live status for all session order IDs
      if (sessionIds.length > 0) {
        const promises = sessionIds.map(oid => 
          axios.get(`${API}/orders/status/${oid}`, { timeout: 4500 }).catch(() => null)
        );
        const results = await Promise.allSettled(promises);
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value?.data?._id) {
            allFoundOrders.set(String(r.value.data._id), r.value.data);
          }
        });
      }

      const merged = Array.from(allFoundOrders.values());
      merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setOrders(merged);

      if (merged.length > 0) {
        try {
          localStorage.setItem('serviq_order_history', JSON.stringify(merged));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to load order history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [phone, tableNumber, tenantId]);

  const isOrderActive = (ord) => {
    const s = String(ord?.status || 'pending').toLowerCase();
    return ['pending', 'confirmed', 'preparing', 'ready'].includes(s);
  };

  const activeCount = useMemo(() => {
    return orders.filter(isOrderActive).length;
  }, [orders]);

  // Filtered orders (All Orders vs Active Orders)
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const isActive = isOrderActive(ord);
      if (filter === 'active' && !isActive) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOrderNum = String(ord.orderNumber || ord._id || '').toLowerCase().includes(q);
        const matchItems = ord.items?.some(it => String(it.name || '').toLowerCase().includes(q));
        return matchOrderNum || matchItems;
      }
      return true;
    });
  }, [orders, filter, searchQuery]);

  // Group filtered orders by date label
  const groupedOrders = useMemo(() => {
    const groups = {};
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    filteredOrders.forEach(ord => {
      const d = ord.createdAt ? new Date(ord.createdAt) : new Date();
      let label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      if (d.toDateString() === todayStr) {
        label = 'Today';
      } else if (d.toDateString() === yesterdayStr) {
        label = 'Yesterday';
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(ord);
    });

    return groups;
  }, [filteredOrders]);

  // Stage helper info (3 Distinct Customer Steps: Placed (Blue) -> Preparing (Orange) -> Completed (Green))
  const getOrderStageInfo = (order) => {
    const s = (order.status || 'pending').toLowerCase();

    if (s === 'cancelled') {
      return {
        step: 0,
        total: 3,
        label: 'Cancelled',
        color: '#dc2626',
        bg: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : '#fef2f2',
        border: isDarkMode ? 'rgba(220, 38, 38, 0.3)' : '#fecaca',
        icon: AlertCircle
      };
    }
    if (s === 'completed') {
      return {
        step: 3,
        total: 3,
        label: 'Served',
        color: '#059669',
        bg: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
        border: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
        icon: Check
      };
    }
    if (s === 'preparing' || s === 'ready') {
      return {
        step: 2,
        total: 3,
        label: 'In Preparation',
        color: '#ea580c',
        bg: isDarkMode ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed',
        border: isDarkMode ? 'rgba(234, 88, 12, 0.3)' : '#fed7aa',
        icon: ChefHat
      };
    }
    // pending / confirmed
    return {
      step: 1,
      total: 3,
      label: 'Order Placed',
      color: '#ea580c',
      bg: isDarkMode ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed',
      border: isDarkMode ? 'rgba(234, 88, 12, 0.3)' : '#fed7aa',
      icon: ShoppingBag
    };
  };

  const theme = {
    bgPage: isDarkMode ? '#120d09' : '#f8fafc',
    bgContainer: isDarkMode ? '#1a130e' : '#ffffff',
    cardBg: isDarkMode ? '#221a13' : '#ffffff',
    innerBg: isDarkMode ? '#17120e' : '#f8fafc',
    border: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    textMain: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#64748b',
    accent: '#ea580c',
    accentGlow: 'rgba(234, 88, 12, 0.35)',
    inputBg: isDarkMode ? '#221911' : '#f1f5f9'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bgPage, color: theme.textMain, display: 'flex', justifyContent: 'center' }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: theme.bgContainer,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        paddingBottom: '6rem',
        boxSizing: 'border-box',
        borderLeft: `1px solid ${theme.border}`,
        borderRight: `1px solid ${theme.border}`
      }}>
        {/* Top Sticky Header */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          backgroundColor: isDarkMode ? 'rgba(26, 19, 14, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${theme.border}`,
          padding: '0.75rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          {/* Top Bar Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}>
            {/* Screen Title & Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', backgroundColor: 'rgba(234, 88, 12, 0.15)', color: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Receipt size={18} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: theme.textMain, letterSpacing: '-0.2px', lineHeight: 1.2 }}>
                Orders
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={fetchHistory}
                title="Refresh order history"
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: theme.textMuted,
                  padding: 0
                }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </motion.button>

              <TableBadge tableNumber={tableNumber} isDarkMode={isDarkMode} style={{ padding: '4px 9px', fontSize: '0.8rem' }} />

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  padding: 0
                }}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={16} color="#fbbe21" /> : <Moon size={16} color="#475569" />}
              </button>
            </div>
          </div>

          {/* Filter & Search Bar Section - Only rendered when data exists, full width underneath */}
          {!loading && orders.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', paddingTop: '2px' }}>
              {/* Unmistakable Mobile Tab Navigation Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  width: 'calc(100% + 2rem)',
                  margin: '0 -1rem',
                  borderBottom: `2px solid ${theme.border}`,
                  backgroundColor: isDarkMode ? 'rgba(26, 19, 14, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}
              >
                {[
                  {
                    key: 'all',
                    label: 'All Orders',
                    count: orders.length,
                    icon: Receipt
                  },
                  {
                    key: 'active',
                    label: 'Active Orders',
                    count: activeCount,
                    icon: Flame
                  }
                ].map(tab => {
                  const isActive = filter === tab.key;
                  const Icon = tab.icon;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      style={{
                        flex: 1,
                        padding: '12px 14px 14px 14px',
                        background: isActive ? (isDarkMode ? 'rgba(234, 88, 12, 0.08)' : 'rgba(234, 88, 12, 0.04)') : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '0.88rem',
                        fontWeight: isActive ? 850 : 600,
                        color: isActive ? theme.accent : theme.textMuted,
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        userSelect: 'none'
                      }}
                    >
                      <Icon
                        size={17}
                        strokeWidth={isActive ? 2.6 : 2}
                        color={isActive ? theme.accent : theme.textMuted}
                      />
                      <span style={{ letterSpacing: '-0.2px' }}>{tab.label}</span>

                      {/* Count Badge */}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isActive
                            ? `${theme.accent}18`
                            : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9'),
                          color: isActive
                            ? theme.accent
                            : theme.textMuted,
                          border: `1px solid ${isActive ? `${theme.accent}30` : theme.border}`
                        }}
                      >
                        {tab.count}
                      </span>

                      {/* Prominent Sliding Active Tab Indicator Underline */}
                      {isActive && (
                        <motion.div
                          layoutId="activeOrderTabUnderline"
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '12%',
                            right: '12%',
                            height: '3.5px',
                            borderRadius: '4px 4px 0 0',
                            backgroundColor: theme.accent,
                            boxShadow: `0 -1px 10px ${theme.accentGlow}`
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={14} color={theme.textMuted} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search by dish name or order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '12px',
                    padding: '8px 12px 8px 34px',
                    color: theme.textMain,
                    fontSize: '0.82rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Date-wise Orders List */}
        <div style={{
          padding: '12px 18px 0 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          flex: 1,
          justifyContent: (loading || filteredOrders.length === 0) ? 'center' : 'flex-start',
          alignItems: (loading || filteredOrders.length === 0) ? 'center' : 'stretch',
          minHeight: (loading || filteredOrders.length === 0) ? 'calc(100vh - 150px)' : 'auto'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              margin: 'auto 0'
            }}>
              <RestaurantCafeLottieLoader
                cafeName={tenantInfo.name}
                tableNumber={tableNumber}
                isDarkMode={isDarkMode}
                compact={true}
              />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: theme.textMuted }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDarkMode ? '#241c14' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', color: theme.accent }}>
                <Utensils size={28} />
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 850, color: theme.textMain }}>
                {searchQuery
                  ? "No matching orders found"
                  : filter === 'active'
                  ? "No Active Orders"
                  : "No Orders Found"}
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
                {searchQuery
                  ? "Try checking your query or filter tab."
                  : filter === 'active'
                  ? "You have no active orders in kitchen right now. Check 'All Orders' for past history."
                  : "No past orders found for this session or mobile number. Explore the menu and place your first delicious dish!"}
              </p>
            </div>
          ) : (
            Object.keys(groupedOrders).map((dateLabel) => {
              const dayOrders = groupedOrders[dateLabel];

              return (
                <div key={dateLabel} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Date Section Header Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                    <Calendar size={13} color={theme.accent} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 850, color: theme.textMain, letterSpacing: '0.2px' }}>
                      {dateLabel}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: theme.textMuted, fontWeight: 600 }}>
                      ({dayOrders.length} {dayOrders.length === 1 ? 'order' : 'orders'})
                    </span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: theme.border, marginLeft: '4px' }} />
                  </div>

                  {/* Day Orders */}
                  {dayOrders.map((ord) => {
                    const isActive = ['pending', 'confirmed', 'preparing', 'ready'].includes(ord.status) && ord.paymentStatus !== 'paid';
                    const isPaid = ord.paymentStatus === 'paid';
                    const stageInfo = getOrderStageInfo(ord);
                    const StageIcon = stageInfo.icon;
                    const timeStr = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';
                    const totalItemsCount = ord.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;

                    return (
                      <motion.div
                        key={ord._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          if (isActive) {
                            const tbl = ord.tableNumber || tableNumber;
                            const token = tbl ? encodeTableToken(tbl) : '';
                            navigate(`/order/status/${ord._id}${token ? `?t=${encodeURIComponent(token)}` : ''}`);
                          }
                        }}
                        style={{
                          backgroundColor: theme.cardBg,
                          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                          borderRadius: '18px',
                          padding: '16px',
                          boxShadow: isActive
                            ? (isDarkMode ? '0 6px 20px rgba(0,0,0,0.45)' : '0 4px 18px rgba(15, 23, 42, 0.06)')
                            : (isDarkMode ? '0 2px 10px rgba(0,0,0,0.3)' : '0 1px 4px rgba(15, 23, 42, 0.04)'),
                          cursor: isActive ? 'pointer' : 'default',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Active Indicator strip on top matching actual stage color */}
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            backgroundColor: stageInfo.color
                          }} />
                        )}

                        {/* Order Header Row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.94rem', fontWeight: 900, color: theme.textMain, letterSpacing: '0.3px' }}>
                                #{ord.orderNumber || ord._id?.slice(-5).toUpperCase()}
                              </span>
                              {ord.tableNumber && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                                  color: theme.textMain
                                }}>
                                  Table {ord.tableNumber}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: theme.textMuted, marginTop: '3px' }}>
                              <Clock size={11} />
                              <span>{timeStr}</span>
                              <span>•</span>
                              <span>{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}</span>
                            </div>
                          </div>

                          {/* Stage Pill */}
                          <div style={{
                            padding: '4px 10px',
                            borderRadius: '100px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: stageInfo.bg,
                            color: stageInfo.color,
                            border: `1px solid ${stageInfo.border}`
                          }}>
                            {isActive && (
                              <motion.span
                                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: stageInfo.color }}
                              />
                            )}
                            <StageIcon size={12} strokeWidth={2.6} />
                            <span>{stageInfo.label}</span>
                          </div>
                        </div>

                        {/* Active Kitchen Connected Timeline */}
                        {isActive && (
                          <div style={{
                            margin: '10px 0 12px 0',
                            padding: '9px 12px',
                            borderRadius: '12px',
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.71rem', fontWeight: 800, color: stageInfo.color, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Flame size={12} /> Live Kitchen Tracking
                              </span>
                              <span style={{ fontSize: '0.67rem', color: theme.textMuted, fontWeight: 600 }}>Tap card to track &rarr;</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {[
                                { key: 'placed', label: 'Placed', color: '#16a34a', step: 1 },
                                { key: 'preparing', label: 'Preparing', color: '#ea580c', step: 2 },
                                { key: 'completed', label: 'Completed', color: '#059669', step: 3 }
                              ].map((stepObj) => {
                                const stepNum = stepObj.step;
                                const isCurrent = stepNum === stageInfo.step;
                                const isDone = stepNum < stageInfo.step;
                                const stepColor = stepObj.color;

                                return (
                                  <div
                                    key={stepObj.key}
                                    style={{
                                      flex: 1,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <div style={{
                                      width: '100%',
                                      height: '4px',
                                      borderRadius: '2px',
                                      backgroundColor: isDone || isCurrent ? stepColor : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                                      boxShadow: isCurrent ? `0 0 8px ${stepColor}80` : 'none'
                                    }} />
                                    <span style={{
                                      fontSize: '0.66rem',
                                      fontWeight: isCurrent ? 850 : 600,
                                      color: isCurrent || isDone ? stepColor : theme.textMuted
                                    }}>
                                      {stepObj.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Dish Items List */}
                        <div style={{
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'}`,
                          borderRadius: '12px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          margin: '8px 0'
                        }}>
                          {ord.items?.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
                                <span style={{
                                  fontSize: '0.69rem',
                                  fontWeight: 800,
                                  color: isDarkMode ? '#cbd5e1' : '#475569',
                                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#eef2f6',
                                  padding: '2px 6px',
                                  borderRadius: '5px',
                                  flexShrink: 0
                                }}>
                                  {it.quantity || 1}×
                                </span>
                                <span style={{ color: theme.textMain, fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {it.name || it.item?.name || 'Delicious Dish'}
                                </span>
                              </div>
                              <span style={{ color: theme.textMain, fontWeight: 800, fontSize: '0.84rem', flexShrink: 0, marginLeft: '8px' }}>
                                ₹{Math.round((it.price || 0) * (it.quantity || 1))}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Bottom Summary Bar */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '8px',
                          borderTop: `1px solid ${theme.border}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isPaid ? (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: '6px',
                                backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.14)' : '#ecfdf5',
                                color: '#059669',
                                border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.28)' : '1px solid #a7f3d0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                <Check size={11} strokeWidth={3} /> Paid Online
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: '6px',
                                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.14)' : '#eef2ff',
                                color: '#4f46e5',
                                border: isDarkMode ? '1px solid rgba(99, 102, 241, 0.28)' : '1px solid #c7d2fe',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}>
                                <Wallet size={11} strokeWidth={2.4} /> Cash at Counter
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '0.66rem', color: theme.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Total
                            </span>
                            <span style={{ fontSize: '1.08rem', fontWeight: 900, color: theme.textMain }}>
                              ₹{Math.round(ord.settledAmount || ord.total || 0)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Global Customer Bottom Navigation */}
        <CustomerBottomNav
          tableNumber={tableNumber}
          tenantId={tenantId}
          tenantInfo={tenantInfo}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      </div>
    </div>
  );
}
