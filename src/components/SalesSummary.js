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
  Clock,
  Filter
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

  // Filter Modal & Draft States (Applied only on "Apply Filter")
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [draftSearch, setDraftSearch] = useState('');
  const [draftDateFilter, setDraftDateFilter] = useState('all');
  const [draftStartDate, setDraftStartDate] = useState('');
  const [draftEndDate, setDraftEndDate] = useState('');
  const [draftCategoryFilter, setDraftCategoryFilter] = useState('all');
  const [draftStatusScope, setDraftStatusScope] = useState('completed');
  const [draftGroupBy, setDraftGroupBy] = useState('date');
  const [draftSortBy, setDraftSortBy] = useState('date_desc');

  const handleOpenFilterModal = () => {
    setDraftSearch(search);
    setDraftDateFilter(dateFilter);
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setDraftCategoryFilter(categoryFilter);
    setDraftStatusScope(statusScope);
    setDraftGroupBy(groupBy);
    setDraftSortBy(sortBy);
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = () => {
    setSearch(draftSearch);
    setDebouncedSearch(draftSearch);
    setDateFilter(draftDateFilter);
    setStartDate(draftStartDate);
    setEndDate(draftEndDate);
    setCategoryFilter(draftCategoryFilter);
    setStatusScope(draftStatusScope);
    setGroupBy(draftGroupBy);
    setSortBy(draftSortBy);
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    setDraftSearch('');
    setDraftDateFilter('all');
    setDraftStartDate('');
    setDraftEndDate('');
    setDraftCategoryFilter('all');
    setDraftStatusScope('completed');
    setDraftGroupBy('date');
    setDraftSortBy('date_desc');
    setSearch('');
    setDebouncedSearch('');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setCategoryFilter('all');
    setStatusScope('completed');
    setGroupBy('date');
    setSortBy('date_desc');
    setPage(1);
    setIsFilterModalOpen(false);
  };

  const handleRemoveSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setDraftSearch('');
    setPage(1);
  };

  const handleRemoveDate = () => {
    setDateFilter('all');
    setDraftDateFilter('all');
    setStartDate('');
    setEndDate('');
    setDraftStartDate('');
    setDraftEndDate('');
    setPage(1);
  };

  const handleRemoveCategory = () => {
    setCategoryFilter('all');
    setDraftCategoryFilter('all');
    setPage(1);
  };

  const handleRemoveGroupBy = () => {
    setGroupBy('date');
    setDraftGroupBy('date');
    setPage(1);
  };

  const handleRemoveStatusScope = () => {
    setStatusScope('completed');
    setDraftStatusScope('completed');
    setPage(1);
  };

  const handleRemoveSort = () => {
    setSortBy('date_desc');
    setDraftSortBy('date_desc');
    setPage(1);
  };

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (dateFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (groupBy !== 'date' ? 1 : 0) +
    (statusScope !== 'completed' ? 1 : 0) +
    (sortBy !== 'date_desc' ? 1 : 0);

  const draftActiveCount =
    (draftSearch.trim() ? 1 : 0) +
    (draftDateFilter !== 'all' ? 1 : 0) +
    (draftCategoryFilter !== 'all' ? 1 : 0) +
    (draftGroupBy !== 'date' ? 1 : 0) +
    (draftStatusScope !== 'completed' ? 1 : 0) +
    (draftSortBy !== 'date_desc' ? 1 : 0);

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

        <div className={styles.headerActions}>
          {/* Single Filter Trigger Button */}
          <button
            type="button"
            className={`${styles.btnSecondary} ${activeFilterCount > 0 ? styles.btnFilterActive : ''}`}
            onClick={handleOpenFilterModal}
            title="Filter Summary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Filter size={13} color={activeFilterCount > 0 ? '#2563eb' : '#475569'} />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className={styles.filterBadgeCount}>{activeFilterCount}</span>
            )}
          </button>

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

      {/* ── Active Filter Pills Bar (Quick Remove) ── */}
      {activeFilterCount > 0 && (
        <div className={styles.activeFilterPillsBar} style={{ margin: '0 0 0.55rem 0', borderRadius: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Active Filters:</span>
          {search.trim() && (
            <span className={styles.filterChip}>
              Search: "{search}"
              <button type="button" onClick={handleRemoveSearch} className={styles.filterChipRemove} title="Clear search">
                <X size={12} />
              </button>
            </span>
          )}
          {dateFilter !== 'all' && (
            <span className={styles.filterChip}>
              Date: {dateFilter === 'custom' ? `${startDate || '...'} to ${endDate || '...'}` : dateFilter.replace('_', ' ')}
              <button type="button" onClick={handleRemoveDate} className={styles.filterChipRemove} title="Clear date filter">
                <X size={12} />
              </button>
            </span>
          )}
          {categoryFilter !== 'all' && (
            <span className={styles.filterChip}>
              Category: {categoryFilter}
              <button type="button" onClick={handleRemoveCategory} className={styles.filterChipRemove} title="Clear category filter">
                <X size={12} />
              </button>
            </span>
          )}
          {groupBy !== 'date' && (
            <span className={styles.filterChip}>
              View: Item-Wise
              <button type="button" onClick={handleRemoveGroupBy} className={styles.filterChipRemove} title="Reset view to date grouped">
                <X size={12} />
              </button>
            </span>
          )}
          {statusScope !== 'completed' && (
            <span className={styles.filterChip}>
              Status: All Active + Completed
              <button type="button" onClick={handleRemoveStatusScope} className={styles.filterChipRemove} title="Reset status to completed bills">
                <X size={12} />
              </button>
            </span>
          )}
          {sortBy !== 'date_desc' && (
            <span className={styles.filterChip}>
              Sort: {sortBy === 'qty_desc' ? 'Highest Qty' : 'Highest Sales'}
              <button type="button" onClick={handleRemoveSort} className={styles.filterChipRemove} title="Reset sort order">
                <X size={12} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 4px',
              marginLeft: 'auto'
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* ── Top KPI Ribbon Cards ── */}
      <div className={styles.compactKpiRibbon} style={{ flexShrink: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.03 }}
          className={styles.miniKpiCard}
        >
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Total Sales</span>
            <div className={styles.miniKpiValueRow}>
              {isLoading && kpi.totalRevenue === 0 ? (
                <div className={styles.skeletonLine} style={{ width: '90px', height: '18px', marginTop: '3px' }} />
              ) : (
                <>
                  <span className={styles.miniKpiVal}>{formatCurrency(kpi.totalRevenue)}</span>
                  <span className={styles.miniKpiSub}>({kpi.totalBills} Bills)</span>
                </>
              )}
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconIndigo}`}>
            <IndianRupee size={16} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.07 }}
          className={styles.miniKpiCard}
        >
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Total Items Sold</span>
            <div className={styles.miniKpiValueRow}>
              {isLoading && kpi.totalRevenue === 0 ? (
                <div className={styles.skeletonLine} style={{ width: '65px', height: '18px', marginTop: '3px' }} />
              ) : (
                <>
                  <span className={styles.miniKpiVal}>{kpi.totalUnits}</span>
                  <span className={styles.miniKpiSub}>Units</span>
                </>
              )}
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconEmerald}`}>
            <ShoppingBag size={16} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.11 }}
          className={styles.miniKpiCard}
        >
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Unique Dishes</span>
            <div className={styles.miniKpiValueRow}>
              {isLoading && kpi.totalRevenue === 0 ? (
                <div className={styles.skeletonLine} style={{ width: '70px', height: '18px', marginTop: '3px' }} />
              ) : (
                <>
                  <span className={styles.miniKpiVal}>{kpi.uniqueDishes}</span>
                  <span className={styles.miniKpiSub}>Menu Items</span>
                </>
              )}
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconAmber}`}>
            <Utensils size={16} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.15 }}
          className={styles.miniKpiCard}
        >
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Average Order Value</span>
            <div className={styles.miniKpiValueRow}>
              {isLoading && kpi.totalRevenue === 0 ? (
                <div className={styles.skeletonLine} style={{ width: '60px', height: '18px', marginTop: '3px' }} />
              ) : (
                <span className={styles.miniKpiVal}>{formatCurrency(kpi.aov)}</span>
              )}
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconRose}`}>
            <Receipt size={16} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.19 }}
          className={styles.miniKpiCard}
        >
          <div className={styles.miniKpiInfo}>
            <span className={styles.miniKpiLabel}>Top Selling Item</span>
            <div className={styles.miniKpiValueRow}>
              {isLoading && kpi.totalRevenue === 0 ? (
                <div className={styles.skeletonLine} style={{ width: '85px', height: '18px', marginTop: '3px' }} />
              ) : (
                <>
                  <span className={styles.miniKpiVal} style={{ fontSize: '0.88rem', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {kpi.topDish ? kpi.topDish.name : '—'}
                  </span>
                  {kpi.topDish && (
                    <span className={styles.miniKpiSub}>(×{kpi.topDish.qty})</span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className={`${styles.miniKpiIcon} ${styles.iconEmerald}`}>
            <Award size={16} />
          </div>
        </motion.div>
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
              {isLoading ? (
                groupBy === 'date' ? (
                  <>
                    {/* Skeleton Date Group 1 Header */}
                    <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                      <td colSpan={6} style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={styles.skeletonLine} style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                            <div className={styles.skeletonLine} style={{ width: '110px', height: '14px' }} />
                            <div className={styles.skeletonLine} style={{ width: '60px', height: '12px' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div className={styles.skeletonLine} style={{ width: '60px', height: '13px' }} />
                            <div className={styles.skeletonLine} style={{ width: '75px', height: '15px' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Item Rows for Group 1 */}
                    {[1, 2, 3].map((sKey) => (
                      <tr key={`sg1-${sKey}`} className={styles.skeletonRow}>
                        <td className={styles.skeletonCell} style={{ paddingLeft: '28px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={styles.skeletonLine} style={{ width: sKey % 2 === 0 ? '140px' : '110px', height: '14px' }} />
                            <div className={styles.skeletonPill} style={{ width: '45px', height: '16px', borderRadius: '5px' }} />
                          </div>
                        </td>
                        <td className={styles.skeletonCell}>
                          <div className={styles.skeletonPill} style={{ width: '55px', height: '20px', borderRadius: '6px' }} />
                        </td>
                        <td className={styles.skeletonCell} style={{ textAlign: 'center' }}>
                          <div className={styles.skeletonLine} style={{ width: '36px', height: '20px', margin: '0 auto', borderRadius: '100px' }} />
                        </td>
                        <td className={styles.skeletonCell} style={{ textAlign: 'right' }}>
                          <div className={styles.skeletonLine} style={{ width: '48px', height: '13px', marginLeft: 'auto' }} />
                        </td>
                        <td className={styles.skeletonCell} style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <div className={styles.skeletonLine} style={{ width: '62px', height: '14px', marginLeft: 'auto' }} />
                        </td>
                        <td className={styles.skeletonCell} style={{ textAlign: 'center', paddingRight: '16px' }}>
                          <div className={styles.skeletonLine} style={{ width: '72px', height: '24px', margin: '0 auto', borderRadius: '6px' }} />
                        </td>
                      </tr>
                    ))}

                    {/* Skeleton Date Group 2 Header */}
                    <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                      <td colSpan={6} style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={styles.skeletonLine} style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
                            <div className={styles.skeletonLine} style={{ width: '110px', height: '14px' }} />
                            <div className={styles.skeletonLine} style={{ width: '60px', height: '12px' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div className={styles.skeletonLine} style={{ width: '60px', height: '13px' }} />
                            <div className={styles.skeletonLine} style={{ width: '75px', height: '15px' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Item Rows for Group 2 */}
                    {[1, 2, 3].map((sKey) => (
                      <tr key={`sg2-${sKey}`} className={styles.skeletonRow}>
                        <td className={styles.skeletonCell} style={{ paddingLeft: '28px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className={styles.skeletonLine} style={{ width: sKey % 2 === 0 ? '125px' : '150px', height: '14px' }} />
                            <div className={styles.skeletonPill} style={{ width: '45px', height: '16px', borderRadius: '5px' }} />
                          </div>
                        </td>
                        <td className={styles.skeletonCell}>
                          <div className={styles.skeletonPill} style={{ width: '55px', height: '20px', borderRadius: '6px' }} />
                        </td>
                        <td className={styles.skeletonCell} style={{ textAlign: 'center' }}>
                          <div className={styles.skeletonLine} style={{ width: '36px', height: '20px', margin: '0 auto', borderRadius: '100px' }} />
                        </td>
                        <td className={styles.skeletonCell} style={{ textAlign: 'right' }}>
                          <div className={styles.skeletonLine} style={{ width: '48px', height: '13px', marginLeft: 'auto' }} />
                        </td>
                        <td className={styles.skeletonCell} style={{ textAlign: 'right', paddingRight: '20px' }}>
                          <div className={styles.skeletonLine} style={{ width: '62px', height: '14px', marginLeft: 'auto' }} />
                        </td>
                        <td className={styles.skeletonCell} style={{ textAlign: 'center', paddingRight: '16px' }}>
                          <div className={styles.skeletonLine} style={{ width: '72px', height: '24px', margin: '0 auto', borderRadius: '6px' }} />
                        </td>
                      </tr>
                    ))}
                  </>
                ) : (
                  Array.from({ length: 8 }).map((_, sIdx) => (
                    <tr key={`sitem-${sIdx}`} className={styles.skeletonRow}>
                      <td className={styles.skeletonCell} style={{ paddingLeft: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className={styles.skeletonLine} style={{ width: sIdx % 2 === 0 ? '135px' : '110px', height: '14px' }} />
                          <div className={styles.skeletonPill} style={{ width: '45px', height: '16px', borderRadius: '5px' }} />
                        </div>
                      </td>
                      <td className={styles.skeletonCell}>
                        <div className={styles.skeletonPill} style={{ width: '55px', height: '20px', borderRadius: '6px' }} />
                      </td>
                      <td className={styles.skeletonCell} style={{ textAlign: 'center' }}>
                        <div className={styles.skeletonLine} style={{ width: '42px', height: '18px', margin: '0 auto', borderRadius: '6px' }} />
                      </td>
                      <td className={styles.skeletonCell} style={{ textAlign: 'center' }}>
                        <div className={styles.skeletonLine} style={{ width: '36px', height: '20px', margin: '0 auto', borderRadius: '100px' }} />
                      </td>
                      <td className={styles.skeletonCell} style={{ textAlign: 'right' }}>
                        <div className={styles.skeletonLine} style={{ width: '48px', height: '13px', marginLeft: 'auto' }} />
                      </td>
                      <td className={styles.skeletonCell} style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <div className={styles.skeletonLine} style={{ width: '62px', height: '14px', marginLeft: 'auto' }} />
                      </td>
                      <td className={styles.skeletonCell} style={{ textAlign: 'center', paddingRight: '16px' }}>
                        <div className={styles.skeletonLine} style={{ width: '72px', height: '24px', margin: '0 auto', borderRadius: '6px' }} />
                      </td>
                    </tr>
                  ))
                )
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={groupBy === 'item' ? 7 : 6} className={styles.td} style={{ textAlign: 'center', padding: '5rem 1rem', color: '#94a3b8', fontSize: '0.85rem', borderBottom: 'none' }}>
                    No item sales found for the selected filter.
                  </td>
                </tr>
              ) : groupBy === 'date' ? (
                (() => {
                  let rowCounter = 0;
                  return groupedByDate.map((group) => {
                    const groupIdx = rowCounter++;
                    return (
                      <React.Fragment key={group.dateKey}>
                        {/* Date Group Header Row */}
                        <motion.tr
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: Math.min(groupIdx * 0.025, 0.35) }}
                          style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}
                        >
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
                        </motion.tr>
                        {group.items.map((row) => {
                          const itemIdx = rowCounter++;
                          return (
                            <motion.tr
                              key={`${row.dateKey}_${row.name}_${row.variant || ''}`}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.22, delay: Math.min(itemIdx * 0.025, 0.4) }}
                              className={styles.tr}
                            >
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
                            </motion.tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()
              ) : (
                rows.map((row, idx) => (
                  <motion.tr
                    key={`${row.name}_${row.variant || ''}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.025, 0.4) }}
                    className={styles.tr}
                  >
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
                  </motion.tr>
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

      {/* ── Filter Popup Modal ── */}
      <AnimatePresence>
        {isFilterModalOpen && (
          <div className={styles.filterModalOverlay} onClick={() => setIsFilterModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.16 }}
              className={styles.filterModalCard}
              style={{ maxWidth: '480px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.filterModalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Filter size={16} color="#2563eb" />
                  <h3 className={styles.filterModalTitle}>Filter Item Summary</h3>
                  {draftActiveCount > 0 && (
                    <span className={styles.filterBadgeCount}>{draftActiveCount} active</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(false)}
                  className={styles.modalCloseBtn}
                  title="Close"
                >
                  <X size={15} />
                </button>
              </div>

              <div className={styles.filterModalBody}>
                {/* Search */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Search Item or Date</label>
                  <div className={styles.modalSearchWrap}>
                    <Search size={14} color="#94a3b8" />
                    <input
                      type="text"
                      placeholder="Search item name, category, or date..."
                      value={draftSearch}
                      onChange={(e) => setDraftSearch(e.target.value)}
                      className={styles.modalSearchInput}
                    />
                    {draftSearch && (
                      <button
                        type="button"
                        onClick={() => setDraftSearch('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date Preset */}
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Date Preset</label>
                  <select
                    value={draftDateFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftDateFilter(val);
                      if (val !== 'custom') {
                        setDraftStartDate('');
                        setDraftEndDate('');
                      } else if (!draftStartDate && !draftEndDate) {
                        const today = new Date().toISOString().slice(0, 10);
                        setDraftStartDate(today);
                        setDraftEndDate(today);
                      }
                    }}
                    className={styles.modalSelectField}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="this_month">This Month</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {/* Custom Date Pickers */}
                {draftDateFilter === 'custom' && (
                  <div className={styles.filterGrid} style={{ marginTop: '-4px' }}>
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel} style={{ fontSize: '0.68rem', color: '#64748b' }}>Start Date</label>
                      <input
                        type="date"
                        value={draftStartDate}
                        max={draftEndDate || undefined}
                        onChange={(e) => setDraftStartDate(e.target.value)}
                        className={styles.modalSelectField}
                        style={{ fontSize: '0.78rem' }}
                      />
                    </div>
                    <div className={styles.filterGroup}>
                      <label className={styles.filterLabel} style={{ fontSize: '0.68rem', color: '#64748b' }}>End Date</label>
                      <input
                        type="date"
                        value={draftEndDate}
                        min={draftStartDate || undefined}
                        onChange={(e) => setDraftEndDate(e.target.value)}
                        className={styles.modalSelectField}
                        style={{ fontSize: '0.78rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* Category & Status */}
                <div className={styles.filterGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Category</label>
                    <select
                      value={draftCategoryFilter}
                      onChange={(e) => setDraftCategoryFilter(e.target.value)}
                      className={styles.modalSelectField}
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Bill Status</label>
                    <select
                      value={draftStatusScope}
                      onChange={(e) => setDraftStatusScope(e.target.value)}
                      className={styles.modalSelectField}
                    >
                      <option value="completed">Completed Bills</option>
                      <option value="all">All Active + Completed</option>
                    </select>
                  </div>
                </div>

                {/* Grouping & Sort */}
                <div className={styles.filterGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Grouping</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <button
                        type="button"
                        onClick={() => setDraftGroupBy('date')}
                        style={{
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.38rem 0.5rem',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: draftGroupBy === 'date' ? '#2563eb' : 'transparent',
                          color: draftGroupBy === 'date' ? '#ffffff' : '#64748b',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Date Grouped
                      </button>
                      <button
                        type="button"
                        onClick={() => setDraftGroupBy('item')}
                        style={{
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.38rem 0.5rem',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: draftGroupBy === 'item' ? '#2563eb' : 'transparent',
                          color: draftGroupBy === 'item' ? '#ffffff' : '#64748b',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Item-Wise
                      </button>
                    </div>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Sort Order</label>
                    <select
                      value={draftSortBy}
                      onChange={(e) => setDraftSortBy(e.target.value)}
                      className={styles.modalSelectField}
                    >
                      <option value="date_desc">Newest Date</option>
                      <option value="qty_desc">Highest Qty</option>
                      <option value="sales_desc">Highest Sales</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.filterModalFooter}>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={styles.filterResetBtn}
                  disabled={draftActiveCount === 0 && activeFilterCount === 0}
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
