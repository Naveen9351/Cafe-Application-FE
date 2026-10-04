import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  ShoppingBag, Search, Plus, Filter, ArrowUpDown, X,
  RefreshCw, Download, CheckCircle2, Clock, Eye, Printer,
  Phone, MessageSquare, IndianRupee, AlertCircle, TrendingUp,
  Receipt, Flame, Check, Utensils, Send, ChevronRight, ShieldCheck,
  Calendar, User, SlidersHorizontal, RotateCcw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './OrdersManagement.module.css';
import { API_URL as API } from '../../config/api';

export default function OrdersManagement({ tenantId, orders = [], onUpdateStatus, onNavigateTab }) {
  const [localOrders, setLocalOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'paid', 'unpaid', 'upi', 'cash', 'card'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest_amount', 'lowest_amount'
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Pagination State
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPageSize = 7;

  // Fetch / Sync All Historical Orders
  const fetchOrders = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      if (token) {
        const res = await axios.get(`${API}/orders?range=all`, {
          headers: { 'x-auth-token': token }
        });
        if (res.data && Array.isArray(res.data)) {
          setLocalOrders(res.data);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.log('API fetch orders error, falling back to props:', err.message);
    }

    if (orders && Array.isArray(orders)) {
      setLocalOrders(orders);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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

  // Sync selectedOrder if orders update in real-time
  useEffect(() => {
    if (selectedOrder) {
      const updated = localOrders.find(o => o._id === selectedOrder._id);
      if (updated) setSelectedOrder(updated);
    }
  }, [localOrders]);

  // Helpers
  const formatCurrency = (val) => `₹${(Number(val) || 0).toLocaleString('en-IN')}`;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Status Change Handler
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.put(`${API}/orders/${orderId}/status`, { status: newStatus }, {
          headers: { 'x-auth-token': token }
        });
      }
      setLocalOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      if (onUpdateStatus) onUpdateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      console.log('Status update local fallback:', err.message);
      setLocalOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order marked as ${newStatus.toUpperCase()}`);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (localOrders.length === 0) return toast.error("No order records to export");
    const headers = ["Order ID", "Channel", "Table", "Customer Name", "Phone", "Status", "Payment", "Items Count", "Total Amount", "Date & Time"];
    const rows = localOrders.map(o => [
      `"${o.orderNumber || o._id?.slice(-5) || ''}"`,
      `"${o.orderType || o.channel || 'dine-in'}"`,
      `"${o.tableNumber || o.table || '-'}"`,
      `"${o.customerName || o.customerDetails?.name || 'Guest Diner'}"`,
      `"${o.customerPhone || o.customerDetails?.phone || ''}"`,
      `"${o.status || 'pending'}"`,
      `"${o.paymentStatus || 'unpaid'}"`,
      o.items?.length || 1,
      Math.round(o.totalAmount || o.finalAmount || o.total || 0),
      `"${o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `serviq_orders_master_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders master ledger exported as CSV!");
  };

  // WhatsApp Bill Message Generator
  const getWhatsAppBillUrl = (order) => {
    const phone = order.customerPhone || order.customerDetails?.phone;
    if (!phone) return '#';
    const cleanPhone = String(phone).replace(/\D/g, '');
    const name = order.customerName || order.customerDetails?.name || 'Valued Guest';
    const orderNum = order.orderNumber || order._id?.slice(-5);
    const total = formatCurrency(order.totalAmount || order.finalAmount || order.total || 0);

    const itemsSummary = (order.items || []).map(it => `• ${it.quantity || 1}x ${it.name || it.item?.name || 'Item'} (₹${it.price || 0})`).join('\n');

    const message = `Hello ${name}! ✨\n\nThank you for dining with us! Here is your bill receipt for Order *#${orderNum}*:\n\n${itemsSummary}\n\n*Grand Total: ${total}*\nPayment Status: *${(order.paymentStatus || 'Paid').toUpperCase()}*\n\nHave a wonderful day! ☕🍕`;

    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Print Bill Trigger
  const handlePrintReceipt = (order) => {
    window.print();
  };

  // Computed Metrics
  const metrics = useMemo(() => {
    const totalOrders = localOrders.length;
    const completedOrders = localOrders.filter(o => o.status === 'completed');
    const completedRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;

    const activeOrders = localOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const pendingCount = localOrders.filter(o => o.status === 'pending').length;

    const totalRevenue = localOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.totalAmount || o.finalAmount || o.total || 0), 0);

    const aov = totalOrders > 0 ? Math.round(totalRevenue / Math.max(1, totalOrders)) : 0;

    return {
      totalOrders,
      completedRate,
      activeOrdersCount: activeOrders.length,
      pendingCount,
      totalRevenue,
      aov
    };
  }, [localOrders]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return localOrders
      .filter(o => {
        const status = (o.status || 'pending').toLowerCase();
        const payStatus = (o.paymentStatus || 'unpaid').toLowerCase();
        const payMethod = (o.paymentMethod || '').toLowerCase();

        // 1. Search Query (Order #, Name, Phone, Table)
        if (search) {
          const q = search.toLowerCase();
          const orderNum = String(o.orderNumber || o._id || '').toLowerCase();
          const name = String(o.customerName || o.customerDetails?.name || '').toLowerCase();
          const phone = String(o.customerPhone || o.customerDetails?.phone || '');
          const tbl = String(o.tableNumber || o.table || '').toLowerCase();
          const matches = orderNum.includes(q) || name.includes(q) || phone.includes(q) || tbl.includes(q);
          if (!matches) return false;
        }

        // 2. Payment Filter
        if (paymentFilter === 'paid' && payStatus !== 'paid') return false;
        if (paymentFilter === 'unpaid' && payStatus === 'paid') return false;
        if (paymentFilter === 'upi' && !payMethod.includes('upi')) return false;
        if (paymentFilter === 'cash' && !payMethod.includes('cash')) return false;
        if (paymentFilter === 'card' && !payMethod.includes('card')) return false;

        // 3. Status Filter
        if (statusFilter !== 'all' && status !== statusFilter) return false;

        return true;
      })
      .sort((a, b) => {
        const aTotal = Number(a.totalAmount || a.finalAmount || a.total || 0);
        const bTotal = Number(b.totalAmount || b.finalAmount || b.total || 0);
        const aDate = new Date(a.createdAt || 0).getTime();
        const bDate = new Date(b.createdAt || 0).getTime();

        if (sortBy === 'newest') return bDate - aDate;
        if (sortBy === 'oldest') return aDate - bDate;
        if (sortBy === 'highest_amount') return bTotal - aTotal;
        if (sortBy === 'lowest_amount') return aTotal - bTotal;
        return 0;
      });
  }, [localOrders, search, paymentFilter, statusFilter, sortBy]);

  // Group Filtered Orders by Date
  const groupedOrdersByDate = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    filteredOrders.forEach(ord => {
      const d = ord.createdAt ? new Date(ord.createdAt) : new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      let formattedLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      if (isToday) {
        formattedLabel = `Today • ${formattedLabel}`;
      } else if (isYesterday) {
        formattedLabel = `Yesterday • ${formattedLabel}`;
      }

      if (!groupMap.has(dateKey)) {
        const newGroup = {
          dateKey,
          label: formattedLabel,
          orders: [],
          totalRevenue: 0
        };
        groupMap.set(dateKey, newGroup);
        groups.push(newGroup);
      }

      const grp = groupMap.get(dateKey);
      grp.orders.push(ord);
      grp.totalRevenue += Number(ord.totalAmount || ord.finalAmount || ord.total || 0);
    });

    return groups;
  }, [filteredOrders]);

  // Reset page when filter changes
  useEffect(() => {
    setOrdersPage(1);
  }, [search, paymentFilter, statusFilter, sortBy]);

  const totalOrdersPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPageSize));
  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ordersPageSize;
    return filteredOrders.slice(start, start + ordersPageSize);
  }, [filteredOrders, ordersPage, ordersPageSize]);

  const activeFilterCount = (paymentFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0);

  const hasActiveFilters = search || activeFilterCount > 0;

  const resetFilters = () => {
    setSearch('');
    setPaymentFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
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
      <Toaster position="top-center" containerStyle={{ zIndex: 99999999 }} toastOptions={{ style: { zIndex: 99999999, fontWeight: '700' } }} />

      {/* ── Top Header Row ── */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.brandIconWrap} style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4f46e5', borderColor: 'rgba(79, 70, 229, 0.3)' }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className={styles.title}>Orders Directory & Management</h2>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.btnSecondary}
            onClick={handleExportCSV}
            title="Download CSV Master Ledger"
          >
            <Download size={13} />
          </button>

          <button
            className={styles.btnSecondary}
            onClick={fetchOrders}
            title="Refresh Orders"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />

          </button>

          {onNavigateTab && (
            <button
              className={styles.btnPrimary}
              onClick={() => onNavigateTab('pos')}
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}
            >
              <Plus size={14} />

            </button>
          )}
        </div>
      </div>

      {/* ── Full-Width Maximized Table Card ── */}
      <div className={styles.fullWidthCard}>
        {/* Unified Toolbar with Compact Inline Metrics */}
        <div className={styles.unifiedToolbar}>
          {/* Left: Compact Badge + Total Sales + AOV */}
          <div className={styles.toolbarLeft}>
            <div className={styles.totalOrdersLedgerBadge}>
              <ShoppingBag size={14} color="#4f46e5" />
              <span>All Orders</span>
              <span className={styles.totalOrdersLedgerCount}>{filteredOrders.length}</span>
            </div>

            <div className={styles.inlineMetricItem}>
              <span className={styles.inlineMetricLabel}>Total Sales:</span>
              <span className={styles.inlineMetricVal}>{formatCurrency(metrics.totalRevenue)}</span>
            </div>

            <div className={styles.inlineMetricItem}>
              <span className={styles.inlineMetricLabel}>AOV:</span>
              <span className={styles.inlineMetricVal}>{formatCurrency(metrics.aov)}</span>
            </div>
          </div>

          {/* Search & Select Filters */}
          <div className={styles.toolbarRight}>
            {/* Search Field */}
            <div className={styles.searchField}>
              <Search size={13} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search Order #, Name, Phone, Table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.inputField}
              />
              {search && (
                <button className={styles.clearBtn} onClick={() => setSearch('')}>
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
                title="Filter & Sort Orders"
                aria-label="Filter & Sort Orders"
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
                      {/* Level 1: Payment Status */}
                      <div className={styles.filterGroup}>
                        <label className={styles.filterGroupLabel}>
                          <IndianRupee size={12} />
                          Payment Status
                        </label>
                        <div className={styles.filterChipGrid}>
                          {[
                            { id: 'all', label: 'All Payments' },
                            { id: 'paid', label: 'Paid Only' },
                            { id: 'unpaid', label: 'Unpaid' },
                            { id: 'upi', label: 'UPI / QR' },
                            { id: 'cash', label: 'Cash' },
                            { id: 'card', label: 'Card' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              className={`${styles.filterChip} ${paymentFilter === opt.id ? styles.filterChipActive : ''}`}
                              onClick={() => setPaymentFilter(opt.id)}
                            >
                              {paymentFilter === opt.id && <Check size={11} className={styles.filterCheckIcon} />}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Level 2: Order Status */}
                      <div className={styles.filterGroup}>
                        <label className={styles.filterGroupLabel}>
                          <CheckCircle2 size={12} />
                          Order Status
                        </label>
                        <div className={styles.filterChipGrid}>
                          {[
                            { id: 'all', label: 'All Status' },
                            { id: 'pending', label: 'Pending' },
                            { id: 'preparing', label: 'Preparing' },
                            { id: 'ready', label: 'Ready' },
                            { id: 'completed', label: 'Completed' },
                            { id: 'cancelled', label: 'Cancelled' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              className={`${styles.filterChip} ${statusFilter === opt.id ? styles.filterChipActive : ''}`}
                              onClick={() => setStatusFilter(opt.id)}
                            >
                              {statusFilter === opt.id && <Check size={11} className={styles.filterCheckIcon} />}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Level 3: Sort Options */}
                      <div className={styles.filterGroup}>
                        <label className={styles.filterGroupLabel}>
                          <ArrowUpDown size={12} />
                          Sort By
                        </label>
                        <div className={styles.filterChipGrid}>
                          {[
                            { id: 'newest', label: 'Newest First' },
                            { id: 'oldest', label: 'Oldest First' },
                            { id: 'highest_amount', label: 'Highest Amount' },
                            { id: 'lowest_amount', label: 'Lowest Amount' }
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
                        onClick={() => {
                          setPaymentFilter('all');
                          setStatusFilter('all');
                          setSortBy('newest');
                        }}
                        disabled={activeFilterCount === 0}
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

        {/* Dense Data Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Order # & Table</th>
                <th className={styles.th}>Customer</th>
                <th className={styles.th}>Items Summary</th>
                <th className={styles.th}>Payment</th>
                <th className={styles.th}>Order Status</th>
                <th className={styles.th}>Date & Time</th>
                <th className={styles.th}>Total Amount</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 7 }).map((_, sIdx) => (
                  <tr key={sIdx} className={styles.skeletonRow}>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonLine} style={{ width: '90px', height: '13px' }} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div className={styles.skeletonLine} style={{ width: '80px', height: '12px' }} />
                        <div className={styles.skeletonLine} style={{ width: '60px', height: '9px' }} />
                      </div>
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonLine} style={{ width: '130px', height: '12px' }} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonPill} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonPill} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonLine} style={{ width: '100px', height: '11px' }} />
                    </td>
                    <td className={styles.skeletonCell}>
                      <div className={styles.skeletonLine} style={{ width: '65px', height: '13px' }} />
                    </td>
                    <td className={styles.skeletonCell} style={{ textAlign: 'center' }}>
                      <div className={styles.skeletonLine} style={{ width: '75px', height: '24px', margin: '0 auto', borderRadius: '7px' }} />
                    </td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyState}>
                      <ShoppingBag size={34} strokeWidth={1.5} />
                      <p style={{ margin: 0, fontWeight: '700', color: '#64748b' }}>
                        No orders match your selected filter criteria.
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
                paginatedOrders.map(ord => {
                  const custName = ord.customerName || ord.customerDetails?.name || 'Guest Diner';
                  const custPhone = ord.customerPhone || ord.customerDetails?.phone;
                  const hasPhone = custPhone && custPhone !== 'Not Provided';
                  const orderNum = ord.orderNumber || ord._id?.slice(-5) || 'ORD';
                  const total = Number(ord.totalAmount || ord.finalAmount || ord.total || 0);
                  const itemsCount = ord.items?.reduce((s, it) => s + (Number(it.quantity) || 1), 0) || ord.items?.length || 1;
                  const firstItem = ord.items?.[0]?.name || ord.items?.[0]?.item?.name || 'Item';
                  const channel = (ord.orderType || ord.channel || 'dine-in').toLowerCase();
                  const status = (ord.status || 'pending').toLowerCase();
                  const payStatus = (ord.paymentStatus || 'unpaid').toLowerCase();
                  const isSelected = selectedOrder?._id === ord._id;

                  return (
                    <motion.tr
                      key={ord._id}
                      className={`${styles.trHover} ${isSelected ? styles.trActive : ''}`}
                      onClick={() => setSelectedOrder(ord)}
                    >
                      {/* Order # & Channel Badge in SINGLE LINE */}
                      <td className={styles.td}>
                        <div className={styles.orderIdSingleLine}>
                          <span className={styles.orderNumberText}>#{orderNum}</span>
                          {ord.tokenNumber && (
                            <span className={styles.tokenBadge}>T#{ord.tokenNumber}</span>
                          )}
                          {channel.includes('dine') ? (
                            <span className={`${styles.channelPill} ${styles.channelDineIn}`}>
                              Table {ord.tableNumber || ord.table || '1'}
                            </span>
                          ) : channel.includes('takeaway') ? (
                            <span className={`${styles.channelPill} ${styles.channelTakeaway}`}>
                              Takeaway
                            </span>
                          ) : channel.includes('delivery') ? (
                            <span className={`${styles.channelPill} ${styles.channelDelivery}`}>
                              Delivery
                            </span>
                          ) : (
                            <span className={`${styles.channelPill} ${styles.channelQr}`}>
                              QR Order
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer Identity */}
                      <td className={styles.td}>
                        <div className={styles.customerIdentity}>
                          <div className={styles.identityText}>
                            <span className={styles.nameRow}>{custName}
                              {hasPhone && (
                                <span> {custPhone}</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className={styles.td}>
                        <div className={styles.itemsPreviewWrap}>
                          <span className={styles.itemsCountBadge}>
                            <Utensils size={10} />
                            <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                          </span>

                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className={styles.td}>
                        {payStatus === 'paid' ? (
                          <span className={styles.paymentPaidUpi}>
                            <CheckCircle2 size={11} />
                            <span>Paid • {ord.paymentMethod?.toUpperCase() || 'UPI'}</span>
                          </span>
                        ) : (
                          <span className={styles.paymentUnpaid}>
                            <Clock size={11} />
                            <span>Unpaid</span>
                          </span>
                        )}
                      </td>

                      {/* Order Status */}
                      <td className={styles.td}>
                        {status === 'pending' && (
                          <span className={styles.statusPending}>
                            <span className={styles.statusDot} /> Pending
                          </span>
                        )}
                        {status === 'preparing' && (
                          <span className={styles.statusPreparing}>
                            <span className={styles.statusDot} /> Preparing
                          </span>
                        )}
                        {status === 'ready' && (
                          <span className={styles.statusReady}>
                            <span className={styles.statusDot} /> Ready
                          </span>
                        )}
                        {status === 'completed' && (
                          <span className={styles.statusCompleted}>
                            <CheckCircle2 size={11} /> Completed
                          </span>
                        )}
                        {status === 'cancelled' && (
                          <span className={styles.statusCancelled}>
                            <AlertCircle size={11} /> Cancelled
                          </span>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className={styles.td} style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
                        {formatDateTime(ord.createdAt)}
                      </td>

                      {/* Total Amount */}
                      <td className={styles.td}>
                        <span className={styles.amountText}>{formatCurrency(total)}</span>
                      </td>

                      {/* Actions */}
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                          className={styles.actionBtn}
                        >
                          <Eye size={12} />
                          <span>View Bill</span>
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pinned Bottom Table Footer with Ellipsis Pagination */}
        <div className={styles.tableFooter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '12px 18px' }}>


          {totalOrdersPages > 1 && (
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <button
                type="button"
                disabled={ordersPage === 1}
                onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: ordersPage === 1 ? '#f8fafc' : '#ffffff', color: ordersPage === 1 ? '#cbd5e1' : '#0f172a', fontWeight: 700, fontSize: '11px', cursor: ordersPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Prev
              </button>
              {getPaginationRange(ordersPage, totalOrdersPages).map((p, pIdx) => {
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
                    onClick={() => setOrdersPage(p)}
                    style={{ minWidth: '28px', height: '28px', padding: '0 4px', borderRadius: '6px', border: 'none', background: ordersPage === p ? '#4f46e5' : '#f1f5f9', color: ordersPage === p ? '#ffffff' : '#475569', fontWeight: ordersPage === p ? 600 : 500, fontSize: '11px', cursor: 'pointer' }}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={ordersPage === totalOrdersPages}
                onClick={() => setOrdersPage(p => Math.min(totalOrdersPages, p + 1))}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: ordersPage === totalOrdersPages ? '#f8fafc' : '#ffffff', color: ordersPage === totalOrdersPages ? '#cbd5e1' : '#0f172a', fontWeight: 500, fontSize: '11px', cursor: ordersPage === totalOrdersPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Right Slide-Over Side Drawer: Order 360° Details & Itemized Bill Receipt ── */}
      <AnimatePresence>
        {selectedOrder && (
          <div
            className={styles.drawerOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedOrder(null);
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
                <div className={styles.drawerOrderTitleWrap}>
                  <div className={styles.brandIconWrap} style={{ width: '34px', height: '34px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4f46e5', borderColor: '#a5b4fc' }}>
                    <Receipt size={17} />
                  </div>
                  <div>
                    <h3 className={styles.drawerOrderId}>
                      Order #{selectedOrder.orderNumber || selectedOrder._id?.slice(-5)}
                    </h3>
                    <span className={styles.drawerTimestamp}>
                      {formatDateTime(selectedOrder.createdAt)}
                    </span>
                  </div>
                </div>

                <button onClick={() => setSelectedOrder(null)} className={styles.closeBtn}>
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body */}
              <div className={styles.drawerBody}>
                {/* 1. Read-Only Order Stage Status Banner */}
                <div className={styles.statusStepperCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 className={styles.statusStepperTitle}>
                      <Clock size={12} color="#4f46e5" />
                      <span>Order Lifecycle Stage</span>
                    </h5>
                    <span style={{ fontSize: '10.5px', color: '#64748b', fontStyle: 'italic' }}>
                      (Status updated in Live Orders)
                    </span>
                  </div>
                  <div className={styles.statusBtnGrid}>
                    {[
                      { key: 'pending', label: 'Pending' },
                      { key: 'preparing', label: 'In Kitchen' },
                      { key: 'ready', label: 'Ready for Pass' },
                      { key: 'completed', label: 'Completed' }
                    ].map((st) => {
                      const currentStatus = (selectedOrder.status || 'pending').toLowerCase();
                      const isActive = currentStatus === st.key;
                      return (
                        <div
                          key={st.key}
                          className={`${styles.readOnlyStatusPill} ${isActive ? styles.readOnlyStatusPillActive : ''}`}
                        >
                          {st.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Customer Snapshot */}
                <div className={styles.customerSnapshotCard}>
                  <div className={styles.customerSnapshotLeft}>
                    <div className={styles.identityText}>
                      <span className={styles.nameRow} style={{ fontSize: '0.92rem' }}>
                        {selectedOrder.customerName || selectedOrder.customerDetails?.name || 'Guest Diner'}
                      </span>
                      {selectedOrder.customerPhone && selectedOrder.customerPhone !== 'Not Provided' && (
                        <span className={styles.phoneText} style={{ fontSize: '0.8rem', color: '#475569' }}>
                          📞 {selectedOrder.customerPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {(selectedOrder.customerPhone || selectedOrder.customerDetails?.phone) && (
                    <div className={styles.quickActionBtns}>
                      <a
                        href={`https://wa.me/91${String(selectedOrder.customerPhone || selectedOrder.customerDetails?.phone).replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.contactIconBtn}
                        title="WhatsApp Customer"
                      >
                        <MessageSquare size={13} color="#16a34a" />
                      </a>
                      <a
                        href={`tel:${selectedOrder.customerPhone || selectedOrder.customerDetails?.phone}`}
                        className={styles.contactIconBtn}
                        title="Call Customer"
                      >
                        <Phone size={13} />
                      </a>
                    </div>
                  )}
                </div>

                {/* 3. Special Instructions Alert */}
                {selectedOrder.specialInstructions && (
                  <div className={styles.specialNoteAlert}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <div>
                      <strong>Kitchen Note:</strong> {selectedOrder.specialInstructions}
                    </div>
                  </div>
                )}

                {/* 4. Itemized Bill Receipt Table */}
                <div className={styles.receiptCard}>
                  <div className={styles.receiptHeader}>
                    <h5 className={styles.receiptHeaderTitle}>
                      <Utensils size={13} color="#4f46e5" />
                      <span>Itemized Bill Receipt</span>
                    </h5>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700' }}>
                      {selectedOrder.items?.length || 0} items
                    </span>
                  </div>

                  <table className={styles.receiptTable}>
                    <thead>
                      <tr>
                        <th className={styles.receiptTh}>Item Details</th>
                        <th className={styles.receiptTh} style={{ textAlign: 'center' }}>Qty</th>
                        <th className={styles.receiptTh} style={{ textAlign: 'right' }}>Price</th>
                        <th className={styles.receiptTh} style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map((it, idx) => {
                        const itName = it.name || it.item?.name || 'Dish Item';
                        const itQty = Number(it.quantity) || 1;
                        const itPrice = Number(it.price || it.item?.price || 0);
                        const itTotal = itPrice * itQty;
                        const modifier = it.variant?.name ? `Size: ${it.variant.name}` : (it.addons && it.addons.length > 0 ? it.addons.map(a => a.name).join(', ') : '');

                        return (
                          <tr key={idx} className={styles.receiptTr}>
                            <td className={styles.receiptTd}>
                              <div className={styles.receiptItemName}>{itName}</div>
                              {modifier && <div className={styles.receiptItemModifier}>{modifier}</div>}
                            </td>
                            <td className={styles.receiptTd} style={{ textAlign: 'center', fontWeight: '800' }}>
                              x{itQty}
                            </td>
                            <td className={styles.receiptTd} style={{ textAlign: 'right' }}>
                              {formatCurrency(itPrice)}
                            </td>
                            <td className={styles.receiptTd} style={{ textAlign: 'right', fontWeight: '800', color: '#0f172a' }}>
                              {formatCurrency(itTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Financial Bill Ledger Breakdown */}
                  <div className={styles.calculationCard} style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '8px' }}>
                    <div className={styles.calcRow}>
                      <span>Items Subtotal</span>
                      <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.items?.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0) || selectedOrder.totalAmount || 0)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className={styles.calcRow} style={{ color: '#dc2626' }}>
                        <span>Discount Applied</span>
                        <span>- {formatCurrency(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    {selectedOrder.taxAmount > 0 && (
                      <div className={styles.calcRow}>
                        <span>Taxes & GST</span>
                        <span>+ {formatCurrency(selectedOrder.taxAmount)}</span>
                      </div>
                    )}
                    <div className={`${styles.calcRow} ${styles.calcRowHighlight}`} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a' }}>Grand Total</span>
                      <span style={{ color: '#4f46e5', fontWeight: 900, fontSize: '1.05rem' }}>
                        {formatCurrency(selectedOrder.totalAmount || selectedOrder.finalAmount || selectedOrder.total || 0)}
                      </span>
                    </div>
                    <div className={styles.calcRow} style={{ marginTop: '4px', fontSize: '0.72rem' }}>
                      <span>Payment Status</span>
                      <span style={{ fontWeight: '800', color: (selectedOrder.paymentStatus || '').toLowerCase() === 'paid' ? '#059669' : '#dc2626' }}>
                        {(selectedOrder.paymentStatus || '').toLowerCase() === 'paid'
                          ? `PAID • ${(selectedOrder.paymentMethod || 'UPI').toUpperCase()}`
                          : 'UNPAID'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className={styles.drawerFooter}>
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className={styles.printReceiptBtn}
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)', color: '#ffffff' }}
                >
                  <Printer size={15} />
                  <span>Print KOT / Bill</span>
                </button>

                {(selectedOrder.customerPhone || selectedOrder.customerDetails?.phone) && (
                  <a
                    href={getWhatsAppBillUrl(selectedOrder)}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.whatsappBillBtn}
                  >
                    <Send size={14} />
                    <span>WhatsApp Bill</span>
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
