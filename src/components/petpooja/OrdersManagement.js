import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  ShoppingBag, Search, Plus, Filter, ArrowUpDown, X,
  RefreshCw, Download, CheckCircle2, Clock, Eye, Printer,
  Phone, MessageSquare, IndianRupee, AlertCircle, TrendingUp,
  Receipt, Flame, Check, Utensils, Send, ChevronRight, ShieldCheck,
  Calendar, User, FileSpreadsheet, SlidersHorizontal, RotateCcw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './OrdersManagement.module.css';
import { API_URL as API } from '../../config/api';
import { printOrderBill } from '../../utils/billPrinter';

export default function OrdersManagement({ tenantId, orders = [], onUpdateStatus, onNavigateTab }) {
  const [localOrders, setLocalOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Applied Filter States
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all', 'paid', 'unpaid', 'upi', 'cash', 'card'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'highest_amount', 'lowest_amount'
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Draft Filter States (Used in Filter Modal - Only applied on clicking "Apply Filter")
  const [draftSearch, setDraftSearch] = useState('');
  const [draftPaymentFilter, setDraftPaymentFilter] = useState('all');
  const [draftStatusFilter, setDraftStatusFilter] = useState('all');
  const [draftSortBy, setDraftSortBy] = useState('newest');

  // Server-side Pagination State (20 Limit)
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPageSize = 20;
  const [totalServerOrders, setTotalServerOrders] = useState(0);
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);

  // Fetch Orders with Database-wide Pagination & Filtering
  const fetchOrders = useCallback(async (
    page = ordersPage,
    q = search,
    pay = paymentFilter,
    st = statusFilter,
    sort = sortBy
  ) => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      if (token) {
        let url = `${API}/orders?paginate=true&page=${page}&limit=${ordersPageSize}&sortBy=${sort}`;
        if (q && q.trim()) url += `&search=${encodeURIComponent(q.trim())}`;
        if (st && st !== 'all') url += `&status=${encodeURIComponent(st)}`;
        if (pay && pay !== 'all') {
          if (['upi', 'cash', 'card'].includes(pay)) {
            url += `&paymentMethod=${encodeURIComponent(pay)}`;
          } else {
            url += `&paymentStatus=${encodeURIComponent(pay)}`;
          }
        }

        const res = await axios.get(url, {
          headers: { 'x-auth-token': token }
        });

        if (res.data) {
          if (res.data.orders && Array.isArray(res.data.orders)) {
            setLocalOrders(res.data.orders);
            setTotalServerOrders(res.data.total || 0);
            setTotalServerPages(res.data.totalPages || 1);
            setIsServerPaginated(true);
            setIsLoading(false);
            return;
          } else if (Array.isArray(res.data)) {
            setLocalOrders(res.data);
            setTotalServerOrders(res.data.length);
            setTotalServerPages(Math.ceil(res.data.length / ordersPageSize) || 1);
            setIsServerPaginated(false);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.log('API fetch orders error, falling back to props:', err.message);
    }

    if (orders && Array.isArray(orders)) {
      setLocalOrders(orders);
      setTotalServerOrders(orders.length);
      setTotalServerPages(Math.ceil(orders.length / ordersPageSize) || 1);
      setIsServerPaginated(false);
    }
    setIsLoading(false);
  }, [orders, ordersPageSize]);

  // Initial load and pagination page-change listener (filters only fire explicitly on Apply Filter click)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchOrders(1, search, paymentFilter, statusFilter, sortBy);
      return;
    }
    fetchOrders(ordersPage, search, paymentFilter, statusFilter, sortBy);
  }, [ordersPage]);

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

  // Export Excel (.xlsx) Feature - Replacing CSV
  const handleExportExcel = () => {
    if (localOrders.length === 0) return toast.error("No order records to export");

    const headers = [
      "Order #",
      "Channel",
      "Table",
      "Customer Name",
      "Phone",
      "Status",
      "Payment Status",
      "Payment Method",
      "Items Count",
      "Items Summary",
      "Subtotal (₹)",
      "Tax (₹)",
      "Total Amount (₹)",
      "Date & Time"
    ];

    const rows = localOrders.map(o => [
      o.orderNumber || o._id?.slice(-5) || '',
      o.orderType || o.channel || 'dine-in',
      o.tableNumber || o.table || '-',
      o.customerName || o.customerDetails?.name || 'Guest Diner',
      o.customerPhone || o.customerDetails?.phone || '',
      (o.status || 'pending').toUpperCase(),
      (o.paymentStatus || 'unpaid').toUpperCase(),
      (o.paymentMethod || 'UPI').toUpperCase(),
      (o.items || []).reduce((s, it) => s + (it.quantity || 1), 0),
      (o.items || []).map(it => `${it.quantity || 1}x ${it.name || it.item?.name || 'Item'}`).join(', '),
      Number(o.subTotal || o.subtotal || o.total || 0),
      Number(o.taxAmount || 0),
      Math.round(Number(o.totalAmount || o.finalAmount || o.total || 0)),
      o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : ''
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 16 },
      { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 35 },
      { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 22 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders Master");

    const fileName = `serviq_orders_master_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success("Orders master ledger downloaded as Excel (.xlsx)!");
  };

  // Print Bill / KOT Handler
  const handlePrintReceipt = (order) => {
    printOrderBill(order);
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

  // Computed Metrics (Harmonized with Dashboard & Reports Suite)
  const metrics = useMemo(() => {
    const totalOrders = totalServerOrders || localOrders.length;
    const completedOrders = localOrders.filter(o => o.status === 'completed');
    const completedRate = totalOrders > 0 ? Math.round((completedOrders.length / totalOrders) * 100) : 0;

    const activeOrders = localOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const pendingCount = localOrders.filter(o => o.status === 'pending').length;

    const totalRevenue = completedOrders
      .reduce((sum, o) => sum + Number(o.totalAmount || o.finalAmount || o.total || 0), 0);

    const aov = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    return {
      totalOrders,
      completedRate,
      activeOrdersCount: activeOrders.length,
      pendingCount,
      totalRevenue,
      aov
    };
  }, [localOrders, totalServerOrders]);

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

  const totalOrdersPages = isServerPaginated
    ? totalServerPages
    : Math.max(1, Math.ceil(filteredOrders.length / ordersPageSize));

  const totalCount = isServerPaginated ? totalServerOrders : filteredOrders.length;
  const startCount = totalCount > 0 ? ((ordersPage - 1) * ordersPageSize) + 1 : 0;
  const endCount = isServerPaginated
    ? Math.min(ordersPage * ordersPageSize, totalServerOrders)
    : Math.min(ordersPage * ordersPageSize, filteredOrders.length);

  const paginatedOrders = useMemo(() => {
    if (isServerPaginated) return localOrders;
    const start = (ordersPage - 1) * ordersPageSize;
    return filteredOrders.slice(start, start + ordersPageSize);
  }, [isServerPaginated, localOrders, filteredOrders, ordersPage, ordersPageSize]);

  const activeFilterCount = (search.trim() ? 1 : 0) + (paymentFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const handleOpenFilterModal = () => {
    setDraftSearch(search);
    setDraftPaymentFilter(paymentFilter);
    setDraftStatusFilter(statusFilter);
    setDraftSortBy(sortBy);
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = () => {
    setSearch(draftSearch);
    setPaymentFilter(draftPaymentFilter);
    setStatusFilter(draftStatusFilter);
    setSortBy(draftSortBy);
    setOrdersPage(1);
    fetchOrders(1, draftSearch, draftPaymentFilter, draftStatusFilter, draftSortBy);
    setIsFilterModalOpen(false);
  };

  const resetFilters = () => {
    setDraftSearch('');
    setDraftPaymentFilter('all');
    setDraftStatusFilter('all');
    setDraftSortBy('newest');
    setSearch('');
    setPaymentFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
    setOrdersPage(1);
    fetchOrders(1, '', 'all', 'all', 'newest');
    setIsFilterModalOpen(false);
  };

  const handleRemoveSearch = () => {
    setSearch('');
    setDraftSearch('');
    setOrdersPage(1);
    fetchOrders(1, '', paymentFilter, statusFilter, sortBy);
  };

  const handleRemovePayment = () => {
    setPaymentFilter('all');
    setDraftPaymentFilter('all');
    setOrdersPage(1);
    fetchOrders(1, search, 'all', statusFilter, sortBy);
  };

  const handleRemoveStatus = () => {
    setStatusFilter('all');
    setDraftStatusFilter('all');
    setOrdersPage(1);
    fetchOrders(1, search, paymentFilter, 'all', sortBy);
  };

  const handleRemoveSort = () => {
    setSortBy('newest');
    setDraftSortBy('newest');
    setOrdersPage(1);
    fetchOrders(1, search, paymentFilter, statusFilter, 'newest');
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
            <ShoppingBag size={18} />
          </div>
          <h2 className={styles.title}>Orders Directory & Management</h2>
        </div>

        <div className={styles.headerActions}>


          {/* Combined Filter Button */}
          <button
            className={`${styles.btnSecondary} ${hasActiveFilters ? styles.btnFilterActive : ''}`}
            onClick={handleOpenFilterModal}
            title="Filter and Search Orders"
          >
            <Filter size={13} color={hasActiveFilters ? "#2563eb" : "#475569"} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className={styles.filterBadgeCount}>{activeFilterCount}</span>
            )}
          </button>

          <button
            className={styles.btnSecondary}
            onClick={handleExportExcel}
            title="Download Excel (.xlsx) Master Ledger"
          >
            <FileSpreadsheet size={13} color="#16a34a" />
            <span>Download Excel</span>
          </button>

          <button
            className={styles.btnSecondary}
            onClick={() => fetchOrders(ordersPage, search, paymentFilter, statusFilter, sortBy)}
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
              <Plus size={13} />

            </button>
          )}
        </div>
      </div>

      {/* ── Top 4 KPI Ribbon Cards ── */}
      <div className={styles.compactKpiRibbon}>
        {/* 1. Total Orders */}
        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Total Orders</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal}>{metrics.totalOrders}</span>
              <span className={styles.miniKpiSub}>({metrics.completedRate}% Completed)</span>
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconEmerald}`}>
            <ShoppingBag size={16} />
          </div>
        </div>

        {/* 2. Live Active Queue */}
        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Active Queue</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal}>{metrics.activeOrdersCount}</span>
              <span className={styles.miniKpiSub} style={{ color: '#d97706' }}>
                ({metrics.pendingCount} Pending)
              </span>
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconAmber}`}>
            <Flame size={16} />
          </div>
        </div>

        {/* 3. Total Revenue */}
        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Total Sales</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal}>{formatCurrency(metrics.totalRevenue)}</span>
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconIndigo}`}>
            <IndianRupee size={16} />
          </div>
        </div>

        {/* 4. Average Order Value (AOV) */}
        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Average Order Value (AOV)</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal}>{formatCurrency(metrics.aov)}</span>
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconRose}`}>
            <Receipt size={16} />
          </div>
        </div>
      </div>

      {/* ── Full-Width Maximized Table Card ── */}
      <div className={styles.fullWidthCard}>
        {/* Active Filter Pills Bar (Only shown if filters are active) */}
        {hasActiveFilters && (
          <div className={styles.activeFilterPillsBar}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Active Filters:</span>
            {search && (
              <span className={styles.filterChip}>
                Search: "{search}"
                <button type="button" onClick={handleRemoveSearch} className={styles.filterChipRemove}>
                  <X size={10} />
                </button>
              </span>
            )}
            {paymentFilter !== 'all' && (
              <span className={styles.filterChip}>
                Payment: {paymentFilter.toUpperCase()}
                <button type="button" onClick={handleRemovePayment} className={styles.filterChipRemove}>
                  <X size={10} />
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className={styles.filterChip}>
                Status: {statusFilter.toUpperCase()}
                <button type="button" onClick={handleRemoveStatus} className={styles.filterChipRemove}>
                  <X size={10} />
                </button>
              </span>
            )}
            {sortBy !== 'newest' && (
              <span className={styles.filterChip}>
                Sort: {sortBy.replace('_', ' ').toUpperCase()}
                <button type="button" onClick={handleRemoveSort} className={styles.filterChipRemove}>
                  <X size={10} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Dense Data Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.th}>Order id</th>
                            <th className={styles.th}>Table No</th>
                            <th className={styles.th}>Customer</th>
                            <th className={styles.th}>Phone Number</th>
                            <th className={styles.th}>Payment</th>
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
                                  <div className={styles.skeletonLine} style={{ width: '70px', height: '13px' }} />
                                </td>
                                <td className={styles.skeletonCell}>
                                  <div className={styles.skeletonLine} style={{ width: '75px', height: '13px' }} />
                                </td>
                                <td className={styles.skeletonCell}>
                                  <div className={styles.skeletonLine} style={{ width: '90px', height: '12px' }} />
                                </td>
                                <td className={styles.skeletonCell}>
                                  <div className={styles.skeletonLine} style={{ width: '85px', height: '12px' }} />
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
                              const hasPhone = custPhone && custPhone !== '';
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
                                  {/* Order # & Token in SINGLE LINE */}
                                  <td className={styles.td}>
                                    <div className={styles.orderIdSingleLine}>
                                      <span className={styles.orderNumberText}>#{orderNum}</span>
                                      {ord.tokenNumber && (
                                        <span className={styles.tokenBadge}>T#{ord.tokenNumber}</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Table No / Channel */}
                                  <td className={styles.td}>
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
                                  </td>

                                  {/* Customer Name */}
                                  <td className={styles.td}>
                                    <span className={styles.nameRow} style={{ fontWeight: 600, color: '#0f172a' }}>{custName}</span>
                                  </td>

                                  {/* Customer Phone */}
                                  <td className={styles.td}>
                                    {custPhone && custPhone !== 'Not Provided' ? (
                                      <span style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500, fontFamily: 'monospace' }}>
                                        {custPhone}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>—</span>
                                    )}
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

                    {/* Pinned Bottom Table Footer with Pagination */}
                    <div className={styles.tableFooter}>
                      {isLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <RefreshCw size={12} className="animate-spin" color="#0f172a" />
                          <span>Loading orders directory...</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: 400, color: '#64748b' }}>
                          Showing <span style={{ fontWeight: 600, color: '#0f172a' }}>{startCount} - {endCount}</span> of <span style={{ fontWeight: 600, color: '#0f172a' }}>{totalCount}</span> orders
                        </span>
                      )}

                      {totalOrdersPages > 1 && (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <button
                            type="button"
                            disabled={ordersPage === 1}
                            onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                            style={{ padding: '3px 10px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', background: ordersPage === 1 ? '#f8fafc' : '#ffffff', color: ordersPage === 1 ? '#cbd5e1' : '#334155', fontWeight: 500, fontSize: '11.5px', cursor: ordersPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease' }}
                          >
                            Prev
                          </button>
                          {getPaginationRange(ordersPage, totalOrdersPages).map((p, idx) => (
                            p === '...' ? (
                              <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '11px' }}>...</span>
                            ) : (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setOrdersPage(p)}
                                style={{ minWidth: '26px', height: '26px', padding: '0 4px', borderRadius: '6px', border: 'none', background: ordersPage === p ? '#0f172a' : '#f8fafc', color: ordersPage === p ? '#ffffff' : '#475569', fontWeight: 500, fontSize: '11.5px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                              >
                                {p}
                              </button>
                            )
                          ))}
                          <button
                            type="button"
                            disabled={ordersPage === totalOrdersPages}
                            onClick={() => setOrdersPage(p => Math.min(totalOrdersPages, p + 1))}
                            style={{ padding: '3px 10px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', background: ordersPage === totalOrdersPages ? '#f8fafc' : '#ffffff', color: ordersPage === totalOrdersPages ? '#cbd5e1' : '#334155', fontWeight: 500, fontSize: '11.5px', cursor: ordersPage === totalOrdersPages ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease' }}
                          >
                            Next
                          </button>
                        </div>
                      )}

                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Click row to open 360° Order Details</span>
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
                            {/* 1. Current Step Status Chip */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 14px',
                              background: '#f8fafc',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              marginBottom: '1rem'
                            }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                                Order Status
                              </span>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 12px',
                                borderRadius: '100px',
                                fontSize: '12px',
                                fontWeight: 800,
                                textTransform: 'capitalize',
                                background: (selectedOrder.status === 'completed' || selectedOrder.status === 'served') ? '#f0fdf4' :
                                  selectedOrder.status === 'ready' ? '#eff6ff' :
                                    selectedOrder.status === 'preparing' ? '#fffbeb' : '#f1f5f9',
                                color: (selectedOrder.status === 'completed' || selectedOrder.status === 'served') ? '#15803d' :
                                  selectedOrder.status === 'ready' ? '#2563eb' :
                                    selectedOrder.status === 'preparing' ? '#b45309' : '#475569',
                                border: '1px solid currentColor'
                              }}>
                                <span style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: 'currentColor'
                                }} />
                                {selectedOrder.status || 'Pending'}
                              </span>
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
                                  <span>{formatCurrency(selectedOrder.subTotal || selectedOrder.subtotal || selectedOrder.items?.reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0) || selectedOrder.totalAmount || 0)}</span>
                                </div>
                                {selectedOrder.discountAmount > 0 && (
                                  <div className={styles.calcRow} style={{ color: '#dc2626' }}>
                                    <span>Discount Applied</span>
                                    <span>- {formatCurrency(selectedOrder.discountAmount)}</span>
                                  </div>
                                )}
                                {selectedOrder.taxAmount > 0 ? (
                                  <div className={styles.calcRow}>
                                    <span>Taxes & GST</span>
                                    <span>+ {formatCurrency(selectedOrder.taxAmount)}</span>
                                  </div>
                                ) : (
                                  <div className={styles.calcRow} style={{ color: '#64748b', fontSize: '0.74rem' }}>
                                    <span>Taxes & Levies</span>
                                    <span>₹0 (Inclusive in menu price)</span>
                                  </div>
                                )}
                                <div className={`${styles.calcRow} ${styles.calcRowHighlight}`} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '6px' }}>
                                  <span style={{ fontWeight: 800, color: '#0f172a' }}>Grand Total Payable</span>
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

                  {/* ── Filter & Search Modal Popup ── */}
                  <AnimatePresence>
                    {isFilterModalOpen && (
                      <div className={styles.filterModalOverlay} onClick={() => setIsFilterModalOpen(false)}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className={styles.filterModalCard}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.filterModalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Filter size={16} color="#2563eb" />
                              <h3 className={styles.filterModalTitle}>Filter Orders</h3>
                              {(() => {
                                const draftCount = (draftSearch.trim() ? 1 : 0) + (draftPaymentFilter !== 'all' ? 1 : 0) + (draftStatusFilter !== 'all' ? 1 : 0) + (draftSortBy !== 'newest' ? 1 : 0);
                                return draftCount > 0 ? (
                                  <span className={styles.filterBadgeCount}>{draftCount} active</span>
                                ) : null;
                              })()}
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsFilterModalOpen(false)}
                              className={styles.modalCloseBtn}
                            >
                              <X size={15} />
                            </button>
                          </div>

                          <div className={styles.filterModalBody}>
                            {/* Search */}
                            <div className={styles.filterGroup}>
                              <label className={styles.filterLabel}>Search Orders</label>
                              <div className={styles.modalSearchWrap}>
                                <Search size={14} color="#94a3b8" />
                                <input
                                  type="text"
                                  placeholder="Order #, Customer, Phone, Table..."
                                  value={draftSearch}
                                  onChange={(e) => setDraftSearch(e.target.value)}
                                  className={styles.modalSearchInput}
                                />
                                {draftSearch && (
                                  <button type="button" onClick={() => setDraftSearch('')} className={styles.clearBtn}>
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Grid for Selects */}
                            <div className={styles.filterGrid}>
                              {/* Payment */}
                              <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Payment Status</label>
                                <select
                                  value={draftPaymentFilter}
                                  onChange={(e) => setDraftPaymentFilter(e.target.value)}
                                  className={styles.modalSelectField}
                                >
                                  <option value="all">All Payments</option>
                                  <option value="paid">Paid Only</option>
                                  <option value="unpaid">Unpaid</option>
                                  <option value="upi">UPI / QR</option>
                                  <option value="cash">Cash</option>
                                  <option value="card">Credit/Debit Card</option>
                                </select>
                              </div>

                              {/* Order Status */}
                              <div className={styles.filterGroup}>
                                <label className={styles.filterLabel}>Order Status</label>
                                <select
                                  value={draftStatusFilter}
                                  onChange={(e) => setDraftStatusFilter(e.target.value)}
                                  className={styles.modalSelectField}
                                >
                                  <option value="all">All Status</option>
                                  <option value="pending">Pending</option>
                                  <option value="preparing">Preparing</option>
                                  <option value="ready">Ready for Pickup/Serve</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>

                              {/* Sorting */}
                              <div className={styles.filterGroup} style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.filterLabel}>Sort By</label>
                                <select
                                  value={draftSortBy}
                                  onChange={(e) => setDraftSortBy(e.target.value)}
                                  className={styles.modalSelectField}
                                >
                                  <option value="newest">Newest First</option>
                                  <option value="highest_amount">Highest Amount</option>
                                  <option value="lowest_amount">Lowest Amount</option>
                                  <option value="oldest">Oldest First</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className={styles.filterModalFooter}>
                            <button
                              type="button"
                              onClick={resetFilters}
                              className={styles.filterResetBtn}
                              disabled={!hasActiveFilters && !draftSearch && draftPaymentFilter === 'all' && draftStatusFilter === 'all' && draftSortBy === 'newest'}
                            >
                              Reset Filters
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyFilters}
                              className={styles.filterApplyBtn}
                              disabled={isLoading}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              {isLoading ? <RefreshCw size={13} className="animate-spin" /> : <Filter size={13} />}
                              <span>{isLoading ? 'Applying...' : 'Apply Filter'}</span>
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
                );
}
