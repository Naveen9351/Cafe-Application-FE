import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

export default function SalesSummary() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [kpi, setKpi] = useState({
    totalRevenue: 0,
    totalBills: 0,
    aov: 0,
    totalUnits: 0,
    uniqueDishes: 0,
    topDish: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusScope, setStatusScope] = useState('completed'); // 'completed' | 'all'
  const [groupBy, setGroupBy] = useState('date'); // 'date' | 'item'
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'qty_desc' | 'sales_desc'

  // Backend Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalRows, setTotalRows] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal for seeing exact bills of an item on a date
  const [selectedRow, setSelectedRow] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchItemSummary = useCallback(async () => {
    if (dateFilter === 'custom' && !startDate && !endDate) {
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');
    const headers = token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : {};

    try {
      const params = new URLSearchParams({
        range: dateFilter,
        category: categoryFilter,
        statusScope,
        groupBy,
        search: debouncedSearch,
        sortBy,
        page: String(page),
        limit: String(pageSize)
      });

      if (dateFilter === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }

      const res = await axios.get(`${API}/orders/item-summary?${params.toString()}`, { headers });

      if (res.data) {
        setRows(res.data.rows || []);
        setTotalRows(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
        if (Array.isArray(res.data.categories)) {
          setCategories(res.data.categories);
        }
        if (res.data.kpi) {
          setKpi(res.data.kpi);
        }
      }
    } catch (err) {
      console.error('Failed to fetch item summary:', err);
      toast.error(err.response?.data?.error || 'Failed to load item summary');
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, startDate, endDate, categoryFilter, statusScope, groupBy, debouncedSearch, sortBy, page]);

  useEffect(() => {
    fetchItemSummary();
  }, [fetchItemSummary]);

  const handleDateFilterChange = (val) => {
    setDateFilter(val);
    setPage(1);
    if (val !== 'custom') {
      setStartDate('');
      setEndDate('');
    } else if (!startDate && !endDate) {
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      setEndDate(today);
    }
  };

  // Export ALL matching records from backend
  const handleExportExcel = async () => {
    const toastId = toast.loading('Preparing Excel...');
    const token = localStorage.getItem('token');
    const headers = token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : {};

    try {
      const params = new URLSearchParams({
        range: dateFilter,
        category: categoryFilter,
        statusScope,
        groupBy,
        search: debouncedSearch,
        sortBy,
        exportAll: 'true'
      });
      if (dateFilter === 'custom') {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      }

      const res = await axios.get(`${API}/orders/item-summary?${params.toString()}`, { headers });
      const exportRows = res.data?.rows || [];

      const sheetData = groupBy === 'item'
        ? [['Item / Dish Name', 'Variant', 'Category', 'Days Sold', 'Qty Sold', 'Unit Price (INR)', 'Total Sales (INR)']]
        : [['Date', 'Item / Dish Name', 'Variant', 'Category', 'Qty Sold', 'Unit Price (INR)', 'Total Sales (INR)']];

      exportRows.forEach(r => {
        if (groupBy === 'item') {
          sheetData.push([
            r.name,
            r.variant || '-',
            r.category,
            (r.datesSold || []).length || 1,
            r.qty,
            Math.round(r.unitPrice || 0),
            Math.round(r.totalSales || 0)
          ]);
        } else {
          sheetData.push([
            formatDisplayDate(r.dateKey),
            r.name,
            r.variant || '-',
            r.category,
            r.qty,
            Math.round(r.unitPrice || 0),
            Math.round(r.totalSales || 0)
          ]);
        }
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetData), 'Item Summary');
      XLSX.writeFile(wb, `Item_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel downloaded!', { id: toastId });
    } catch (err) {
      toast.error('Failed to export Excel', { id: toastId });
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const formatDisplayDate = (dateKey) => {
    if (!dateKey) return '-';
    const d = new Date(`${dateKey}T00:00:00`);
    if (isNaN(d.getTime())) return dateKey;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Group current page rows by dateKey when in Date-Grouped mode
  const groupedByDate = useMemo(() => {
    if (groupBy !== 'date') return [];
    const map = new Map();
    rows.forEach((row) => {
      const key = row.dateKey || 'Unknown';
      if (!map.has(key)) {
        map.set(key, { dateKey: key, items: [], totalQty: 0, totalSales: 0 });
      }
      const g = map.get(key);
      g.items.push(row);
      g.totalQty += row.qty || 0;
      g.totalSales += row.totalSales || 0;
    });
    return Array.from(map.values());
  }, [rows, groupBy]);

  return (
    <div className={styles.page} style={{ height: 'calc(100dvh - 82px)', minHeight: '420px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-center" containerStyle={{ zIndex: 99999999 }} toastOptions={{ style: { zIndex: 99999999, fontWeight: '700' } }} />

      {/* ── Top Header Row ── */}
      <div className={styles.headerRow} style={{ flexShrink: 0, flexWrap: 'wrap', rowGap: '8px' }}>
        <div className={styles.titleArea}>
          <div className={styles.brandIconWrap} style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.25)' }}>
            <TrendingUp size={18} />
          </div>
          <h2 className={styles.title}>Item Summary</h2>
        </div>

        <div className={styles.headerActions} style={{ flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search item or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.4rem 1.6rem 0.4rem 1.8rem',
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

          {/* Date Preset Filter */}
          <select
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
            className={styles.btnSecondary}
            style={{ outline: 'none' }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Clean Custom Date Range Pickers */}
          {dateFilter === 'custom' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '7px', padding: '0.26rem 0.55rem' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>From</span>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                style={{ border: 'none', fontSize: '0.74rem', fontWeight: 600, color: '#0f172a', outline: 'none', background: 'transparent' }}
              />
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>To</span>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                style={{ border: 'none', fontSize: '0.74rem', fontWeight: 600, color: '#0f172a', outline: 'none', background: 'transparent' }}
              />
              <button
                type="button"
                onClick={() => handleDateFilterChange('all')}
                title="Clear custom range"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 2px', display: 'flex', alignItems: 'center' }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className={styles.btnSecondary}
            style={{ outline: 'none' }}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* View Grouping Toggle: Date Grouped vs Item-Wise */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '7px', padding: '2px', border: '1px solid #cbd5e1' }}>
            <button
              type="button"
              onClick={() => { setGroupBy('date'); setPage(1); }}
              style={{
                border: 'none',
                borderRadius: '5px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.73rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: groupBy === 'date' ? '#2563eb' : 'transparent',
                color: groupBy === 'date' ? '#ffffff' : '#475569'
              }}
            >
              Date Grouped
            </button>
            <button
              type="button"
              onClick={() => { setGroupBy('item'); setPage(1); }}
              style={{
                border: 'none',
                borderRadius: '5px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.73rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: groupBy === 'item' ? '#2563eb' : 'transparent',
                color: groupBy === 'item' ? '#ffffff' : '#475569'
              }}
            >
              Item-Wise
            </button>
          </div>

          {/* Order Status Scope Filter */}
          <select
            value={statusScope}
            onChange={(e) => { setStatusScope(e.target.value); setPage(1); }}
            className={styles.btnSecondary}
            style={{ outline: 'none' }}
          >
            <option value="completed">Completed Bills</option>
            <option value="all">All Active + Completed</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
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
            onClick={fetchItemSummary}
            title="Refresh"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Top KPI Ribbon Cards ── */}
      <div className={styles.compactKpiRibbon} style={{ flexShrink: 0 }}>
        <div className={styles.miniKpiCard}>
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Total Sales</span>
            <div className={styles.miniKpiValueRow}>
              <span className={styles.miniKpiVal}>{formatCurrency(kpi.totalRevenue)}</span>
              <span className={styles.miniKpiSub}>({kpi.totalBills} Bills)</span>
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
              <span className={styles.miniKpiVal}>{kpi.totalUnits}</span>
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
              <span className={styles.miniKpiVal}>{kpi.uniqueDishes}</span>
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
              <span className={styles.miniKpiVal}>{formatCurrency(kpi.aov)}</span>
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
                {kpi.topDish ? kpi.topDish.name : '—'}
              </span>
              {kpi.topDish && (
                <span className={styles.miniKpiSub}>(×{kpi.topDish.qty})</span>
              )}
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconEmerald}`}>
            <Award size={16} />
          </div>
        </div>
      </div>

      {/* ── Full-Width Table Card (Only List Scrolls Internally) ── */}
      <div className={styles.fullWidthCard} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className={styles.tableWrapper} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ paddingLeft: '16px' }}>Item / Dish Name</th>
                <th className={styles.th}>Category</th>
                {groupBy === 'item' && <th className={styles.th} style={{ textAlign: 'center' }}>Days Sold</th>}
                <th className={styles.th} style={{ textAlign: 'center' }}>Qty Sold</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Unit Price</th>
                <th className={styles.th} style={{ textAlign: 'right', paddingRight: '20px' }}>Total Sales</th>
                <th className={styles.th} style={{ textAlign: 'center', paddingRight: '16px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={groupBy === 'item' ? 7 : 6} className={styles.td} style={{ textAlign: 'center', padding: '5rem 1rem', color: '#94a3b8', fontSize: '0.85rem', borderBottom: 'none' }}>
                    {isLoading ? 'Loading item summary...' : 'No item sales found for the selected filter.'}
                  </td>
                </tr>
              ) : groupBy === 'date' ? (
                groupedByDate.map((group) => (
                  <React.Fragment key={group.dateKey}>
                    {/* Date Group Header Row */}
                    <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                      <td colSpan={6} style={{ padding: '8px 16px', fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} color="#2563eb" />
                            {formatDisplayDate(group.dateKey)}
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', marginLeft: '4px' }}>
                              ({group.items.length} {group.items.length === 1 ? 'Item' : 'Items'})
                            </span>
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem' }}>
                            <span style={{ color: '#2563eb', fontWeight: 700 }}>×{group.totalQty} Units</span>
                            <span style={{ color: '#0f172a', fontWeight: 800 }}>{formatCurrency(Math.round(group.totalSales))}</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                    {group.items.map((row) => (
                      <tr key={`${row.dateKey}_${row.name}_${row.variant || ''}`} className={styles.tr}>
                        <td className={styles.td} style={{ fontWeight: 700, color: '#1e293b', paddingLeft: '28px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>{row.name}</span>
                            {row.variant && (
                              <span style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '5px',
                                background: '#eef2ff',
                                color: '#4338ca'
                              }}>
                                {row.variant}
                              </span>
                            )}
                          </div>
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
                            {row.category || 'General'}
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
                          {formatCurrency(Math.round(row.unitPrice || 0))}
                        </td>
                        <td className={styles.td} style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', paddingRight: '20px' }}>
                          {formatCurrency(Math.round(row.totalSales || 0))}
                        </td>
                        <td className={styles.td} style={{ textAlign: 'center', paddingRight: '16px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedRow(row)}
                            className={styles.btnSecondary}
                            style={{ padding: '3px 9px', fontSize: '0.72rem', margin: '0 auto' }}
                          >
                            <Eye size={12} /> View ({row.orders?.length || 0})
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                rows.map((row) => (
                  <tr key={`${row.name}_${row.variant || ''}`} className={styles.tr}>
                    <td className={styles.td} style={{ fontWeight: 700, color: '#1e293b', paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>{row.name}</span>
                        {row.variant && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '5px',
                            background: '#eef2ff',
                            color: '#4338ca'
                          }}>
                            {row.variant}
                          </span>
                        )}
                      </div>
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
                        {row.category || 'General'}
                      </span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                      {(row.datesSold || []).length || 1} {((row.datesSold || []).length || 1) === 1 ? 'Day' : 'Days'}
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
                      {formatCurrency(Math.round(row.unitPrice || 0))}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', paddingRight: '20px' }}>
                      {formatCurrency(Math.round(row.totalSales || 0))}
                    </td>
                    <td className={styles.td} style={{ textAlign: 'center', paddingRight: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className={styles.btnSecondary}
                        style={{ padding: '3px 9px', fontSize: '0.72rem', margin: '0 auto' }}
                      >
                        <Eye size={12} /> View ({row.orders?.length || 0})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Fixed Pagination Footer */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.75rem', color: '#64748b' }}>
          <span>
            {totalRows > 0
              ? `Showing ${((page - 1) * pageSize) + 1} - ${Math.min(page * pageSize, totalRows)} of ${totalRows} entries`
              : '0 entries'}
          </span>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                disabled={page === 1 || isLoading}
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
                disabled={page === totalPages || isLoading}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={styles.btnSecondary}
                style={{ padding: '4px 10px', opacity: page === totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Item Sale Bills Modal */}
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
                maxWidth: '600px',
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
                    {selectedRow.name}{selectedRow.variant ? ` (${selectedRow.variant})` : ''}
                    {groupBy === 'date' && selectedRow.dateKey ? ` — ${formatDisplayDate(selectedRow.dateKey)}` : ''}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Total Qty: <strong>×{selectedRow.qty}</strong> • Total Sales: <strong>{formatCurrency(Math.round(selectedRow.totalSales || 0))}</strong>
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
                    {(selectedRow.orders || []).map((o, idx) => (
                      <tr key={idx} className={styles.tr}>
                        <td className={styles.td} style={{ fontWeight: 700, color: '#2563eb' }}>
                          {groupBy === 'item' && o.dateKey && (
                            <div style={{ fontSize: '0.68rem', color: '#475569' }}>{formatDisplayDate(o.dateKey)}</div>
                          )}
                          <div>{o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}</div>
                        </td>
                        <td className={styles.td} style={{ fontWeight: 700, color: '#4f46e5' }}>#{String(o.orderNum || '').slice(-6)}</td>
                        <td className={styles.td}>
                          <div style={{ fontWeight: 600 }}>{o.tableNumber ? `Table ${o.tableNumber}` : 'Takeaway / POS'}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{o.customerName || 'Walk-in Guest'}</div>
                        </td>
                        <td className={styles.td} style={{ textAlign: 'center', fontWeight: 800 }}>×{o.qty}</td>
                        <td className={styles.td}>
                          <div>{o.paymentMethod || 'Cash'}</div>
                          {o.orderStatus && (
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              color: o.orderStatus === 'completed' ? '#16a34a' : '#d97706'
                            }}>
                              {o.orderStatus}
                            </span>
                          )}
                        </td>
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
