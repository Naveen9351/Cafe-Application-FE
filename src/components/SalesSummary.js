import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  TrendingUp,
  Search,
  X,
  RefreshCw,
  IndianRupee,
  ShoppingBag,
  Utensils,
  Award,
  Receipt,
  Calendar,
  FileSpreadsheet,
  Eye,
  Clock
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './petpooja/OrdersManagement.module.css';
import { API_URL as API } from '../config/api';

export default function SalesSummary({ initialOrders = [] }) {
  const [orders, setOrders] = useState(() => (Array.isArray(initialOrders) && initialOrders.length > 0 ? initialOrders : []));
  const [menuCatalog, setMenuCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simple, clean filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'qty_desc' | 'sales_desc'

  // Pagination (20 rows per page, matching OrdersManagement)
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Detail Modal for seeing exact orders/timings of an item on a date
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    if (Array.isArray(initialOrders) && initialOrders.length > 0) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const tid = localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);
    const headers = token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : {};

    try {
      const [ordersRes, menuRes] = await Promise.allSettled([
        axios.get(`${API}/orders`, { headers }),
        axios.get(`${API}/menu?tenantId=${tid || ''}&includeUnavailable=true&includePosOnly=true`, { headers })
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
        const data = Array.isArray(ordersRes.value.data)
          ? ordersRes.value.data
          : (ordersRes.value.data.orders || []);
        setOrders(data);
      }
      if (menuRes.status === 'fulfilled' && Array.isArray(menuRes.value.data)) {
        setMenuCatalog(menuRes.value.data);
      }
    } catch (err) {
      console.error('Failed to fetch sales summary data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFilter, customDate, categoryFilter, sortBy]);

  const getOrderAmount = (ord) => {
    if (!ord) return 0;
    const val = Number(ord.settledAmount || ord.finalAmount || ord.total || ord.totalAmount || ord.subTotal);
    if (!isNaN(val) && val > 0) return val;
    if (Array.isArray(ord.items) && ord.items.length > 0) {
      return ord.items.reduce((s, it) => s + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    }
    return 0;
  };

  // Menu category lookup
  const menuMap = useMemo(() => {
    const map = {};
    menuCatalog.forEach(m => {
      if (m && m.name) {
        map[m.name.trim().toLowerCase()] = m.category || m.categoryId || 'General';
      }
    });
    return map;
  }, [menuCatalog]);

  // Filter completed/valid orders by date filter (exclude cancelled)
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(ord => {
      if (!ord.createdAt || ord.status === 'cancelled') return false;
      const ordDate = new Date(ord.createdAt);

      if (dateFilter === 'today') {
        return ordDate.toDateString() === now.toDateString();
      }
      if (dateFilter === 'yesterday') {
        const yest = new Date();
        yest.setDate(now.getDate() - 1);
        return ordDate.toDateString() === yest.toDateString();
      }
      if (dateFilter === '7d') {
        const start = new Date();
        start.setDate(now.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return ordDate >= start;
      }
      if (dateFilter === '30d') {
        const start = new Date();
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return ordDate >= start;
      }
      if (dateFilter === 'custom' && customDate) {
        return ordDate.toISOString().slice(0, 10) === customDate;
      }
      return true;
    });
  }, [orders, dateFilter, customDate]);

  // Build Date-Wise + Item-Wise flat rows (1 row = 1 Item on 1 Date)
  const { dateItemRows, categories, kpiMetrics } = useMemo(() => {
    const rowMap = {};
    const catSet = new Set();
    const dishTotals = {};
    let totalRevenue = 0;
    let totalUnits = 0;

    // Sort newest orders first
    const sorted = [...filteredOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sorted.forEach(ord => {
      totalRevenue += getOrderAmount(ord);
      const dObj = new Date(ord.createdAt);
      const dateKey = dObj.toISOString().slice(0, 10);
      const displayDate = dObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = dObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const orderNum = ord.orderNumber || (ord._id ? ord._id.slice(-6).toUpperCase() : 'ORD');
      const tableLabel = ord.tableNumber ? `Table ${ord.tableNumber}` : 'Takeaway / POS';
      const guestName = ord.customerName || ord.customerDetails?.name || 'Walk-in Guest';
      const payMethod = ord.paymentMethod || 'Cash';

      (ord.items || []).forEach(it => {
        const name = (it.name || it.item?.name || 'Unknown Item').trim();
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price || it.item?.price) || 0;
        const lineTotal = qty * price;
        const category = (it.category || it.item?.category || menuMap[name.toLowerCase()] || 'General').trim();

        catSet.add(category);
        totalUnits += qty;

        // Track overall top dish
        if (!dishTotals[name]) dishTotals[name] = { name, qty: 0, sales: 0 };
        dishTotals[name].qty += qty;
        dishTotals[name].sales += lineTotal;

        const key = `${dateKey}__${name.toLowerCase()}`;
        if (!rowMap[key]) {
          rowMap[key] = {
            id: key,
            dateKey,
            displayDate,
            name,
            category,
            qty: 0,
            price,
            totalSales: 0,
            orders: []
          };
        }
        rowMap[key].qty += qty;
        rowMap[key].totalSales += lineTotal;
        rowMap[key].orders.push({
          orderNum,
          timeStr,
          tableLabel,
          guestName,
          qty,
          price,
          lineTotal,
          payMethod
        });
      });
    });

    const topDish = Object.values(dishTotals).sort((a, b) => b.qty - a.qty)[0] || null;
    const totalBills = filteredOrders.length;
    const aov = totalBills > 0 ? Math.round(totalRevenue / totalBills) : 0;

    return {
      dateItemRows: Object.values(rowMap),
      categories: Array.from(catSet).sort(),
      kpiMetrics: {
        totalRevenue,
        totalUnits,
        uniqueDishes: Object.keys(dishTotals).length,
        totalBills,
        aov,
        topDish
      }
    };
  }, [filteredOrders, menuMap]);

  // Apply search, category, and sorting
  const displayedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = dateItemRows.filter(r => {
      const matchesSearch = !q || r.name.toLowerCase().includes(q) || r.displayDate.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'all' || r.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCat;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'qty_desc') return b.qty - a.qty || b.dateKey.localeCompare(a.dateKey);
      if (sortBy === 'sales_desc') return b.totalSales - a.totalSales || b.dateKey.localeCompare(a.dateKey);
      return b.dateKey.localeCompare(a.dateKey) || b.totalSales - a.totalSales;
    });
  }, [dateItemRows, search, categoryFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(displayedRows.length / pageSize));
  const paginatedRows = displayedRows.slice((page - 1) * pageSize, page * pageSize);

  // Download Excel
  const handleExportExcel = () => {
    try {
      const rows = [
        ['Date', 'Item / Dish Name', 'Category', 'Qty Sold', 'Unit Price (INR)', 'Total Sales (INR)', 'Sold Timings']
      ];
      displayedRows.forEach(r => {
        const timings = r.orders.map(o => `${o.timeStr} (x${o.qty})`).join(', ');
        rows.push([r.displayDate, r.name, r.category, r.qty, r.price, r.totalSales, timings]);
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Item Sales Summary');
      XLSX.writeFile(wb, `Item_Sales_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel downloaded!');
    } catch (err) {
      toast.error('Failed to export Excel');
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className={styles.page}>
      <Toaster position="top-center" containerStyle={{ zIndex: 99999999 }} toastOptions={{ style: { zIndex: 99999999, fontWeight: '700' } }} />

      {/* ── Top Header Row (Matching OrdersManagement) ── */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <div className={styles.brandIconWrap} style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <TrendingUp size={18} />
          </div>
          <h2 className={styles.title}>Item & Sales Summary</h2>
        </div>

        <div className={styles.headerActions}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search item or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.4rem 0.7rem 0.4rem 1.8rem',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                fontSize: '0.76rem',
                outline: 'none',
                width: '170px',
                background: '#ffffff'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={styles.btnSecondary}
            style={{ outline: 'none' }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Pick Date</option>
          </select>

          {dateFilter === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className={styles.btnSecondary}
              style={{ outline: 'none' }}
            />
          )}

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.btnSecondary}
            style={{ outline: 'none' }}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.btnSecondary}
            style={{ outline: 'none' }}
          >
            <option value="date_desc">Newest Date</option>
            <option value="qty_desc">Highest Qty</option>
            <option value="sales_desc">Highest Sales</option>
          </select>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExportExcel}
            title="Download Excel (.xlsx)"
          >
            <FileSpreadsheet size={13} color="#16a34a" />
            <span>Download Excel</span>
          </button>

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={fetchData}
            title="Refresh"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Top KPI Ribbon Cards (Matching OrdersManagement) ── */}
      <div className={styles.compactKpiRibbon}>
        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Total Sales</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal}>{formatCurrency(kpiMetrics.totalRevenue)}</span>
              <span className={styles.miniKpiSub}>({kpiMetrics.totalBills} Bills)</span>
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconIndigo}`}>
            <IndianRupee size={16} />
          </div>
        </div>

        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Total Items Sold</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal}>{kpiMetrics.totalUnits}</span>
              <span className={styles.miniKpiSub}>Units</span>
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconEmerald}`}>
            <ShoppingBag size={16} />
          </div>
        </div>

        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Unique Dishes</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal}>{kpiMetrics.uniqueDishes}</span>
              <span className={styles.miniKpiSub}>Menu Items</span>
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconAmber}`}>
            <Utensils size={16} />
          </div>
        </div>

        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Average Order Value</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal}>{formatCurrency(kpiMetrics.aov)}</span>
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconRose}`}>
            <Receipt size={16} />
          </div>
        </div>

        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Top Selling Item</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal} style={{ fontSize: '0.88rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {kpiMetrics.topDish ? kpiMetrics.topDish.name : '—'}
              </span>
              {kpiMetrics.topDish && (
                <span className={styles.miniKpiSub}>(×{kpiMetrics.topDish.qty})</span>
              )}
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconEmerald}`}>
            <Award size={16} />
          </div>
        </div>
      </div>

      {/* ── Full-Width Maximized Table Card ── */}
      <div className={styles.fullWidthCard} style={{ minHeight: '420px' }}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ paddingLeft: '16px' }}>Date</th>
                <th className={styles.th}>Item / Dish Name</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>Qty Sold</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Unit Price</th>
                <th className={styles.th} style={{ textAlign: 'right', paddingRight: '24px' }}>Total Sales</th>
                <th className={styles.th}>Sold Timings</th>
                <th className={styles.th} style={{ textAlign: 'center', paddingRight: '16px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.td} style={{ textAlign: 'center', padding: '5rem 1rem', color: '#94a3b8', fontSize: '0.85rem', borderBottom: 'none' }}>
                    {isLoading ? 'Loading item sales summary...' : 'No item sales found for the selected filter.'}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className={styles.tr}>
                    <td className={styles.td} style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', paddingLeft: '16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="#64748b" />
                        {row.displayDate}
                      </div>
                    </td>
                    <td className={styles.td} style={{ fontWeight: 700, color: '#1e293b' }}>
                      {row.name}
                    </td>
                    <td className={styles.td}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#475569'
                      }}>
                        {row.category}
                      </span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 9px',
                        borderRadius: '100px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        background: '#eff6ff',
                        color: '#2563eb'
                      }}>
                        ×{row.qty}
                      </span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right', color: '#64748b' }}>
                      {formatCurrency(row.price)}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', paddingRight: '24px' }}>
                      {formatCurrency(row.totalSales)}
                    </td>
                    <td className={styles.td} style={{ fontSize: '0.73rem', color: '#475569', maxWidth: '260px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {row.orders.slice(0, 3).map((o, idx) => (
                          <span key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 6px', borderRadius: '5px', whiteSpace: 'nowrap' }}>
                            {o.timeStr} (×{o.qty})
                          </span>
                        ))}
                        {row.orders.length > 3 && (
                          <span style={{ background: '#eff6ff', color: '#2563eb', padding: '1px 6px', borderRadius: '5px', fontWeight: 700 }}>
                            +{row.orders.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'center', paddingRight: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className={styles.btnSecondary}
                        style={{ padding: '3px 9px', fontSize: '0.72rem', margin: '0 auto' }}
                      >
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Pagination Footer */}
        {displayedRows.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.75rem', color: '#64748b' }}>
            <span>
              Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, displayedRows.length)} of {displayedRows.length} entries
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={styles.btnSecondary}
                  style={{ padding: '4px 10px', opacity: page === 1 ? 0.5 : 1 }}
                >
                  Prev
                </button>
                <span style={{ padding: '4px 8px', fontWeight: 700, color: '#0f172a' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={styles.btnSecondary}
                  style={{ padding: '4px 10px', opacity: page === totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simple Item Sale Details Modal */}
      <AnimatePresence>
        {selectedRow && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                maxWidth: '580px',
                width: '100%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="#2563eb" />
                    {selectedRow.name} — {selectedRow.displayDate}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Total Qty: <strong>×{selectedRow.qty}</strong> • Total Sales: <strong>{formatCurrency(selectedRow.totalSales)}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ overflowY: 'auto', padding: '14px 18px' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Time</th>
                      <th className={styles.th}>Order #</th>
                      <th className={styles.th}>Table / Guest</th>
                      <th className={styles.th} style={{ textAlign: 'center' }}>Qty</th>
                      <th className={styles.th}>Payment</th>
                      <th className={styles.th} style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRow.orders.map((o, idx) => (
                      <tr key={idx} className={styles.tr}>
                        <td className={styles.td} style={{ fontWeight: 700, color: '#2563eb' }}>{o.timeStr}</td>
                        <td className={styles.td} style={{ fontWeight: 700, color: '#4f46e5' }}>#{o.orderNum}</td>
                        <td className={styles.td}>
                          <div style={{ fontWeight: 600 }}>{o.tableLabel}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{o.guestName}</div>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'center', fontWeight: 800 }}>×{o.qty}</td>
                        <td className={styles.td}>{o.payMethod}</td>
                        <td className={styles.td} style={{ textAlign: 'right', fontWeight: 800 }}>{formatCurrency(o.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
