import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, Search, Plus, Filter, ArrowUpDown, X, 
  RefreshCw, Download, CheckCircle2, Clock, Eye, Printer,
  Phone, MessageSquare, IndianRupee, AlertCircle, TrendingUp,
  Receipt, Flame, Check, Utensils, Send, ChevronRight, ShieldCheck,
  Calendar, User
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
    link.setAttribute("download", `serviq_orders_master_${new Date().toISOString().slice(0,10)}.csv`);
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

  const hasActiveFilters = search || paymentFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearch('');
    setPaymentFilter('all');
    setStatusFilter('all');
    setSortBy('newest');
  };

  return (
    <div className={styles.page}>
      <Toaster position="top-center" containerStyle={{ zIndex: 99999999 }} toastOptions={{ style: { zIndex: 99999999, fontWeight: '700' } }} />

      {/* ── Top Header Row ── */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.brandIconWrap}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className={styles.title}>Orders Directory & Management</h2>
            <p className={styles.subtitle}>
              Master ledger of all historical dine-in, takeaway, delivery & QR orders grouped by date with itemized billing.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot}></span>
            <span>Live Sync</span>
          </div>

          <button 
            className={styles.btnSecondary}
            onClick={handleExportCSV}
            title="Download CSV Master Ledger"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button 
            className={styles.btnSecondary} 
            onClick={fetchOrders}
            title="Refresh Orders"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {onNavigateTab && (
            <button 
              className={styles.btnPrimary}
              onClick={() => onNavigateTab('pos')}
            >
              <Plus size={14} />
              <span>New POS Order</span>
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
        {/* Unified Toolbar */}
        <div className={styles.unifiedToolbar}>
          {/* Total Ledger Badge on Left */}
          <div className={styles.toolbarLeft}>
            <div className={styles.totalOrdersLedgerBadge}>
              <ShoppingBag size={14} color="#059669" />
              <span>All Orders Directory</span>
              <span className={styles.totalOrdersLedgerCount}>{filteredOrders.length}</span>
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

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className={styles.selectField}
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid</option>
              <option value="upi">UPI / QR</option>
              <option value="cash">Cash</option>
              <option value="card">Credit/Debit Card</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.selectField}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready for Pickup/Serve</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.selectField}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="highest_amount">Sort: Highest Amount</option>
              <option value="lowest_amount">Sort: Lowest Amount</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button className={styles.resetBtn} onClick={resetFilters}>
                <X size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Dense Data Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Order # / Token</th>
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
                groupedOrdersByDate.map(group => (
                  <React.Fragment key={group.dateKey}>
                    {/* Date Section Header */}
                    <tr className={styles.dateGroupHeaderRow}>
                      <td colSpan={8} className={styles.dateGroupCell}>
                        <div className={styles.dateGroupContent}>
                          <div className={styles.dateGroupBadge}>
                            <Calendar size={13} color="#475569" />
                            <span>{group.label}</span>
                            <span className={styles.dateGroupCount}>
                              {group.orders.length} {group.orders.length === 1 ? 'Order' : 'Orders'}
                            </span>
                          </div>
                          <div className={styles.dateGroupSales}>
                            <span>Day's Sales:</span>
                            <strong>{formatCurrency(group.totalRevenue)}</strong>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Orders for this Date */}
                    {group.orders.map(ord => {
                      const custName = ord.customerName || ord.customerDetails?.name || 'Guest Diner';
                      const custPhone = ord.customerPhone || ord.customerDetails?.phone || 'Not Provided';
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
                          {/* Order # & Channel Badge */}
                          <td className={styles.td}>
                            <div className={styles.orderIdWrap}>
                              <span className={styles.orderNumberText}>
                                <span>#{orderNum}</span>
                                {ord.tokenNumber && (
                                  <span className={styles.tokenBadge}>T#{ord.tokenNumber}</span>
                                )}
                              </span>
                              {channel.includes('dine') ? (
                                <span className={`${styles.channelPill} ${styles.channelDineIn}`}>
                                  🍽️ Table {ord.tableNumber || ord.table || '1'}
                                </span>
                              ) : channel.includes('takeaway') ? (
                                <span className={`${styles.channelPill} ${styles.channelTakeaway}`}>
                                  🛍️ Takeaway
                                </span>
                              ) : channel.includes('delivery') ? (
                                <span className={`${styles.channelPill} ${styles.channelDelivery}`}>
                                  🛵 Delivery
                                </span>
                              ) : (
                                <span className={`${styles.channelPill} ${styles.channelQr}`}>
                                  📱 QR Order
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Customer Identity without short name avatar */}
                          <td className={styles.td}>
                            <div className={styles.customerIdentity}>
                              <div className={styles.identityText}>
                                <span className={styles.nameRow}>{custName}</span>
                                <span className={styles.phoneText}>{custPhone}</span>
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
                              <span className={styles.itemsSummaryText} title={ord.items?.map(i => `${i.quantity || 1}x ${i.name || i.item?.name}`).join(', ')}>
                                {firstItem} {ord.items?.length > 1 ? `+${ord.items.length - 1} more` : ''}
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
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pinned Bottom Table Footer */}
        <div className={styles.tableFooter}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={12} className="animate-spin" color="#059669" />
              <span>Loading orders directory...</span>
            </span>
          ) : (
            <span>Showing <strong>{filteredOrders.length}</strong> of <strong>{localOrders.length}</strong> total orders</span>
          )}
          <span>Click any row to open full 360° Order Details & Bill Receipt</span>
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
                  <div className={styles.brandIconWrap} style={{ width: '32px', height: '32px' }}>
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
                {/* 1. Quick Status Stepper */}
                <div className={styles.statusStepperCard}>
                  <h5 className={styles.statusStepperTitle}>
                    <Clock size={12} color="#059669" />
                    <span>Order Lifecycle Stage</span>
                  </h5>
                  <div className={styles.statusBtnGrid}>
                    {['pending', 'preparing', 'ready', 'completed'].map((st) => {
                      const isActive = (selectedOrder.status || 'pending').toLowerCase() === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          className={`${styles.statusStepBtn} ${isActive ? styles.statusStepBtnActive : ''}`}
                          onClick={() => handleUpdateOrderStatus(selectedOrder._id, st)}
                        >
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </button>
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
                      <span className={styles.phoneText} style={{ fontSize: '0.8rem', color: '#475569' }}>
                        📞 {selectedOrder.customerPhone || selectedOrder.customerDetails?.phone || 'Not Provided'}
                      </span>
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
                      <Utensils size={13} color="#059669" />
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
                          <tr key={idx}>
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
                </div>

                {/* 5. Financial Calculation Breakdown */}
                <div className={styles.calculationCard}>
                  <div className={styles.calcRow}>
                    <span>Items Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.items?.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0) || selectedOrder.totalAmount || 0)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className={styles.calcRow} style={{ color: '#059669' }}>
                      <span>Discount Applied</span>
                      <span>- {formatCurrency(selectedOrder.discountAmount)}</span>
                    </div>
                  )}
                  {selectedOrder.taxAmount > 0 && (
                    <div className={styles.calcRow}>
                      <span>Taxes & GST (5%)</span>
                      <span>+ {formatCurrency(selectedOrder.taxAmount)}</span>
                    </div>
                  )}
                  <div className={`${styles.calcRow} ${styles.calcRowHighlight}`}>
                    <span>Grand Total</span>
                    <span style={{ color: '#059669' }}>
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

              {/* Drawer Footer Actions */}
              <div className={styles.drawerFooter}>
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className={styles.printReceiptBtn}
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
