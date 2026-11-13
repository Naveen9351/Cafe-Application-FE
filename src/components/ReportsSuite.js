import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Printer,
  Calendar,
  PieChart,
  Award,
  ArrowUpRight,
  BookOpen,
  Search,
  X,
  Receipt,
  CheckCircle2,
  XCircle,
  Eye,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  TrendingDown,
  Layers,
  UtensilsCrossed,
  Clock,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_URL } from '../config/api';
import styles from './ReportsSuite.module.css';
import { printOrderBill } from '../utils/billPrinter';
import { openWhatsappBill } from '../utils/whatsappBillSender';
import ExecutiveReportModal from './ExecutiveReportModal';
import InvoiceModal from './InvoiceModal';
import { formatTableBadge } from './common/TableBadge';

export default function ReportsSuite({ initialOrders = [], tenantInfo: propTenantInfo = null, menuItems: propMenuItems = [] }) {
  const [orders, setOrders] = useState(() => (Array.isArray(initialOrders) && initialOrders.length > 0 ? initialOrders : []));
  const [khataRecords, setKhataRecords] = useState([]);
  const [dbTables, setDbTables] = useState([]);
  const [menuCatalog, setMenuCatalog] = useState(() => (Array.isArray(propMenuItems) && propMenuItems.length > 0 ? propMenuItems : []));
  const [loading, setLoading] = useState(() => !(Array.isArray(initialOrders) && initialOrders.length > 0));
  const [tenantInfo, setTenantInfo] = useState(propTenantInfo);

  // Sub-Navigation Tab: 'overview' | 'dailySales' | 'itemSummary'
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Overview Time Filter
  const [timeFilter, setTimeFilter] = useState('today');
  const [orderSearch, setOrderSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);

  // Pagination State for Orders
  const [reportsPage, setReportsPage] = useState(1);
  const reportsPageSize = 10;

  // Daily Sales Summary State
  const [dailyMode, setDailyMode] = useState('today'); // 'today' | 'yesterday' | 'custom'
  const [customDailyDate, setCustomDailyDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [dailyItemSearch, setDailyItemSearch] = useState('');

  // Item Performance Report State
  const [itemTimeFilter, setItemTimeFilter] = useState('today'); // 'today' | '7d' | '30d' | 'all'
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('all');

  useEffect(() => {
    setReportsPage(1);
  }, [timeFilter, orderSearch, tableFilter]);

  useEffect(() => {
    if (Array.isArray(initialOrders) && initialOrders.length > 0) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  useEffect(() => {
    if (propTenantInfo) setTenantInfo(propTenantInfo);
  }, [propTenantInfo]);

  useEffect(() => {
    if (Array.isArray(propMenuItems) && propMenuItems.length > 0) {
      setMenuCatalog(propMenuItems);
    }
  }, [propMenuItems]);

  useEffect(() => {
    fetchReportData(orders.length === 0);
  }, []);

  const fetchReportData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'x-auth-token': token,
        Authorization: `Bearer ${token}`
      };

      const [ordersRes, khataRes, tablesRes, menuRes, tenantRes] = await Promise.allSettled([
        axios.get(`${API_URL}/orders`, { headers }),
        axios.get(`${API_URL}/khata`, { headers }),
        axios.get(`${API_URL}/tables`, { headers }),
        axios.get(`${API_URL}/menu?includeUnavailable=true&includePosOnly=true`, { headers }),
        axios.get(`${API_URL}/tenants/me`, { headers })
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
        setOrders(ordersRes.value.data);
      }
      if (khataRes.status === 'fulfilled' && khataRes.value.data?.records) {
        setKhataRecords(khataRes.value.data.records);
      }
      if (tablesRes.status === 'fulfilled' && Array.isArray(tablesRes.value.data)) {
        setDbTables(tablesRes.value.data);
      }
      if (menuRes.status === 'fulfilled' && Array.isArray(menuRes.value.data)) {
        setMenuCatalog(menuRes.value.data);
      }
      if (tenantRes.status === 'fulfilled' && tenantRes.value.data) {
        setTenantInfo(tenantRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Robust order amount resolver across schemas
  const getOrderAmount = (ord) => {
    if (!ord) return 0;
    const val = Number(ord.settledAmount || ord.finalAmount || ord.total || ord.totalAmount || ord.subTotal);
    if (!isNaN(val) && val > 0) return val;
    if (Array.isArray(ord.items) && ord.items.length > 0) {
      return ord.items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    }
    return 0;
  };

  // -------------------------------------------------------------
  // OVERVIEW FILTERED DATA
  // -------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      if (timeFilter === 'all') return true;
      const ordDate = new Date(ord.createdAt);
      const now = new Date();
      if (timeFilter === 'today') {
        return ordDate.toDateString() === now.toDateString();
      }
      if (timeFilter === '7d') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return ordDate >= sevenDaysAgo;
      }
      if (timeFilter === '30d') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return ordDate >= thirtyDaysAgo;
      }
      return true;
    });
  }, [orders, timeFilter]);

  const completedOrders = useMemo(() => filteredOrders.filter(o => o.status === 'completed'), [filteredOrders]);
  const totalGrossRevenue = useMemo(() => completedOrders.reduce((acc, o) => acc + getOrderAmount(o), 0), [completedOrders]);
  const totalCompletedCount = completedOrders.length;
  const activeOrdersCount = useMemo(() => filteredOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length, [filteredOrders]);
  const totalOrdersCount = filteredOrders.length;
  const avgTicketSize = totalCompletedCount > 0 ? Math.round(totalGrossRevenue / totalCompletedCount) : 0;

  const paymentBreakdown = useMemo(() => {
    const pb = { Cash: 0, UPI: 0, Card: 0, Khata: 0 };
    completedOrders.forEach(ord => {
      const method = (ord.paymentMethod || 'Cash').toLowerCase();
      const amt = getOrderAmount(ord);
      if (method.includes('upi') || method.includes('gpay')) {
        pb.UPI += amt;
      } else if (method.includes('card')) {
        pb.Card += amt;
      } else if (method.includes('khata') || method.includes('borrow')) {
        pb.Khata += amt;
      } else {
        pb.Cash += amt;
      }
    });
    return pb;
  }, [completedOrders]);

  const outstandingKhata = useMemo(() => {
    return khataRecords
      .filter(k => k.status !== 'settled')
      .reduce((acc, k) => acc + (Number(k.borrowAmount || k.remainingAmount || k.totalBill) || 0), 0);
  }, [khataRecords]);

  // Top dishes for overview
  const topDishes = useMemo(() => {
    const dishSales = {};
    completedOrders.forEach(ord => {
      (ord.items || []).forEach(item => {
        const name = item.name || item.item?.name || 'Unknown Item';
        const qty = item.quantity || 1;
        const price = item.price || 0;
        if (!dishSales[name]) {
          dishSales[name] = { name, count: 0, revenue: 0 };
        }
        dishSales[name].count += qty;
        dishSales[name].revenue += (qty * price);
      });
    });
    return Object.values(dishSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [completedOrders]);

  // -------------------------------------------------------------
  // DAILY SALES BREAKDOWN (Requirement 3)
  // -------------------------------------------------------------
  const targetDailyDate = useMemo(() => {
    const d = new Date();
    if (dailyMode === 'today') {
      return d;
    }
    if (dailyMode === 'yesterday') {
      d.setDate(d.getDate() - 1);
      return d;
    }
    if (dailyMode === 'custom' && customDailyDate) {
      const [year, month, day] = customDailyDate.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return d;
  }, [dailyMode, customDailyDate]);

  const targetDailyDateStr = targetDailyDate.toDateString();

  const dailyOrders = useMemo(() => {
    return orders.filter(ord => {
      if (!ord.createdAt) return false;
      const d = new Date(ord.createdAt);
      return d.toDateString() === targetDailyDateStr;
    });
  }, [orders, targetDailyDateStr]);

  const dailyCompletedOrders = useMemo(() => dailyOrders.filter(o => o.status === 'completed'), [dailyOrders]);
  const dailyGrossRevenue = useMemo(() => dailyCompletedOrders.reduce((sum, o) => sum + getOrderAmount(o), 0), [dailyCompletedOrders]);
  const dailyTotalOrderCount = dailyOrders.length;
  const dailyCompletedCount = dailyCompletedOrders.length;
  const dailyCancelledCount = useMemo(() => dailyOrders.filter(o => o.status === 'cancelled').length, [dailyOrders]);
  const dailyAvgTicket = dailyCompletedCount > 0 ? Math.round(dailyGrossRevenue / dailyCompletedCount) : 0;

  const dailyPaymentSplit = useMemo(() => {
    const pb = { Cash: 0, UPI: 0, Card: 0, Khata: 0 };
    dailyCompletedOrders.forEach(ord => {
      const method = (ord.paymentMethod || 'Cash').toLowerCase();
      const amt = getOrderAmount(ord);
      if (method.includes('upi') || method.includes('gpay')) pb.UPI += amt;
      else if (method.includes('card')) pb.Card += amt;
      else if (method.includes('khata') || method.includes('borrow')) pb.Khata += amt;
      else pb.Cash += amt;
    });
    return pb;
  }, [dailyCompletedOrders]);

  // Date-filtered breakdown of items sold on that specific day
  const dailyDishBreakdown = useMemo(() => {
    const map = {};
    dailyCompletedOrders.forEach(ord => {
      (ord.items || []).forEach(it => {
        const name = it.name || it.item?.name || 'Dish Item';
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price || it.item?.price) || 0;
        const cat = it.category || it.item?.category || 'General';

        if (!map[name]) {
          map[name] = {
            name,
            category: cat,
            price,
            quantity: 0,
            revenue: 0
          };
        }
        map[name].quantity += qty;
        map[name].revenue += (qty * price);
      });
    });
    return Object.values(map).sort((a, b) => b.quantity - a.quantity);
  }, [dailyCompletedOrders]);

  const filteredDailyDishes = useMemo(() => {
    if (!dailyItemSearch) return dailyDishBreakdown;
    const q = dailyItemSearch.toLowerCase();
    return dailyDishBreakdown.filter(d => d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q));
  }, [dailyDishBreakdown, dailyItemSearch]);

  const handleExportDailyExcel = () => {
    if (dailyDishBreakdown.length === 0) {
      toast.error('No items sold on this date to export');
      return;
    }
    const rows = dailyDishBreakdown.map((d, idx) => ({
      'S.No': idx + 1,
      'Dish Name': d.name,
      'Category': d.category,
      'Unit Price (₹)': d.price,
      'Quantity Sold': d.quantity,
      'Total Revenue (₹)': d.revenue
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales');
    const dateFormatted = targetDailyDate.toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Daily_Sales_Summary_${dateFormatted}.xlsx`);
    toast.success(`Daily sales summary for ${dateFormatted} exported!`);
  };

  // -------------------------------------------------------------
  // ITEM SUMMARY REPORT (Requirement 2)
  // -------------------------------------------------------------
  const itemSummaryFilteredOrders = useMemo(() => {
    return orders.filter(ord => {
      if (ord.status !== 'completed') return false;
      if (itemTimeFilter === 'all') return true;
      const ordDate = new Date(ord.createdAt);
      const now = new Date();
      if (itemTimeFilter === 'today') {
        return ordDate.toDateString() === now.toDateString();
      }
      if (itemTimeFilter === '7d') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return ordDate >= sevenDaysAgo;
      }
      if (itemTimeFilter === '30d') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return ordDate >= thirtyDaysAgo;
      }
      return true;
    });
  }, [orders, itemTimeFilter]);

  // Aggregate item-wise statistics across catalog
  const fullCatalogPerformance = useMemo(() => {
    // 1. Build map of sales in the period
    const salesMap = {};
    itemSummaryFilteredOrders.forEach(ord => {
      (ord.items || []).forEach(it => {
        const rawName = (it.name || it.item?.name || '').trim();
        if (!rawName) return;
        const key = rawName.toLowerCase();
        const qty = Number(it.quantity) || 1;
        const price = Number(it.price || it.item?.price) || 0;

        if (!salesMap[key]) {
          salesMap[key] = { unitsSold: 0, revenue: 0 };
        }
        salesMap[key].unitsSold += qty;
        salesMap[key].revenue += (qty * price);
      });
    });

    // 2. Build list starting from catalog
    const result = [];
    const catalogSeen = new Set();

    (menuCatalog || []).forEach(catItem => {
      if (!catItem || !catItem.name) return;
      const key = catItem.name.trim().toLowerCase();
      catalogSeen.add(key);
      const sale = salesMap[key] || { unitsSold: 0, revenue: 0 };

      result.push({
        id: catItem._id || catItem.id,
        name: catItem.name,
        category: catItem.category || 'General',
        image: catItem.image,
        currentPrice: Number(catItem.price) || 0,
        unitsSold: sale.unitsSold,
        totalRevenue: sale.revenue,
        isAvailable: catItem.isAvailable !== false,
        isOpenMenu: Boolean(catItem.isOpenMenu || catItem.isPosOnly)
      });
    });

    // 3. Add items that were ordered but not found in active menu catalog
    Object.keys(salesMap).forEach(key => {
      if (!catalogSeen.has(key)) {
        const sale = salesMap[key];
        result.push({
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          category: 'Off-Menu / Custom',
          currentPrice: sale.unitsSold > 0 ? Math.round(sale.revenue / sale.unitsSold) : 0,
          unitsSold: sale.unitsSold,
          totalRevenue: sale.revenue,
          isAvailable: true,
          isOpenMenu: false
        });
      }
    });

    return result;
  }, [menuCatalog, itemSummaryFilteredOrders]);

  // Top-selling and low-performing dishes
  const topSellingDishes = useMemo(() => {
    return [...fullCatalogPerformance]
      .filter(d => d.unitsSold > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [fullCatalogPerformance]);

  const lowPerformingDishes = useMemo(() => {
    return [...fullCatalogPerformance]
      .sort((a, b) => a.unitsSold - b.unitsSold)
      .slice(0, 5);
  }, [fullCatalogPerformance]);

  const availableCategories = useMemo(() => {
    const cats = new Set(fullCatalogPerformance.map(i => i.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [fullCatalogPerformance]);

  const filteredCatalogPerformance = useMemo(() => {
    return fullCatalogPerformance.filter(it => {
      const matchesSearch = itemSearchQuery
        ? it.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) || it.category.toLowerCase().includes(itemSearchQuery.toLowerCase())
        : true;
      const matchesCat = itemCategoryFilter === 'all' || it.category.toLowerCase() === itemCategoryFilter.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [fullCatalogPerformance, itemSearchQuery, itemCategoryFilter]);

  const handleExportItemPerformanceExcel = () => {
    if (fullCatalogPerformance.length === 0) {
      toast.error('No catalog items available to export');
      return;
    }
    const rows = fullCatalogPerformance.map((item, idx) => ({
      'S.No': idx + 1,
      'Dish Name': item.name,
      'Category': item.category,
      'Current Price (₹)': item.currentPrice,
      'Units Sold': item.unitsSold,
      'Total Revenue (₹)': item.totalRevenue,
      'Stock Status': item.isAvailable ? 'In Stock' : 'Out of Stock',
      'Menu Visibility': item.isOpenMenu ? 'Counter / POS Only' : 'Public QR & POS'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dish Performance');
    const rangeLabel = itemTimeFilter === 'today' ? 'Daily' : itemTimeFilter === '7d' ? 'Weekly' : itemTimeFilter === '30d' ? 'Monthly' : 'All_Time';
    XLSX.writeFile(wb, `Item_Summary_Report_${rangeLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Catalog & Dish-Wise Performance report exported to Excel (.xlsx)!');
  };

  const handlePrintItemSummary = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>
            <BarChart3 size={26} color="#2563eb" />
            Revenue & Sales Reports
          </h2>
          <p>Real-time accounting, daily sales breakdowns, and dish-wise catalog analytics</p>
        </div>

        <div className={styles.controlsGroup}>
          <button
            type="button"
            className={styles.printBtn}
            onClick={() => setIsExecutiveReportOpen(true)}
            style={{
              backgroundColor: '#eff6ff',
              borderColor: '#bfdbfe',
              color: '#1d4ed8',
              fontWeight: 800
            }}
          >
            <Printer size={15} />
            Executive PDF Report
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className={styles.subNavBar}>
        <button
          type="button"
          className={`${styles.subTabBtn} ${activeSubTab === 'overview' ? styles.subTabActive : ''}`}
          onClick={() => setActiveSubTab('overview')}
        >
          <Layers size={16} />
          Overview & Settled Orders
        </button>

        <button
          type="button"
          className={`${styles.subTabBtn} ${activeSubTab === 'dailySales' ? styles.subTabActive : ''}`}
          onClick={() => setActiveSubTab('dailySales')}
        >
          <Calendar size={16} />
          Daily Sales Breakdown
        </button>

        <button
          type="button"
          className={`${styles.subTabBtn} ${activeSubTab === 'itemSummary' ? styles.subTabActive : ''}`}
          onClick={() => setActiveSubTab('itemSummary')}
        >
          <UtensilsCrossed size={16} />
          Item Summary & Dish Performance
        </button>
      </div>

      {/* TAB 1: OVERVIEW & GENERAL REPORT */}
      {activeSubTab === 'overview' && (
        <>
          {/* Controls: Date range filter buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: 8 }}>
            {['today', '7d', '30d', 'all'].map(tf => (
              <button
                key={tf}
                type="button"
                className={`${styles.dateFilterBtn} ${timeFilter === tf ? styles.dateFilterActive : ''}`}
                onClick={() => setTimeFilter(tf)}
              >
                {tf === 'today' ? 'Today' : tf === '7d' ? 'Last 7 Days' : tf === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* KPI Stats */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Total Gross Revenue</div>
                <div className={styles.kpiValue}>₹{totalGrossRevenue.toLocaleString()}</div>
                <div className={styles.kpiSubtitle}>
                  <ArrowUpRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  From {totalCompletedCount} Completed Orders
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <DollarSign size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Average Order Value</div>
                <div className={styles.kpiValue}>₹{avgTicketSize}</div>
                <div className={styles.kpiSubtitle} style={{ color: '#64748b' }}>
                  Per settled dining/takeaway ticket
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <TrendingUp size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Total Orders Volume</div>
                <div className={styles.kpiValue}>{totalOrdersCount}</div>
                <div className={styles.kpiSubtitle} style={{ color: '#64748b' }}>
                  {totalCompletedCount} Settled • {activeOrdersCount} in Kitchen/Active
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                <ShoppingBag size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Khata / Udhari Dues</div>
                <div className={styles.kpiValue} style={{ color: '#dc2626' }}>₹{outstandingKhata.toLocaleString()}</div>
                <div className={styles.kpiSubtitle} style={{ color: '#dc2626' }}>
                  {khataRecords.filter(k => k.status !== 'settled').length} Customers with pending balance
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
                <BookOpen size={18} />
              </div>
            </div>
          </div>

          {/* Grid: Payment Method Breakdown & Top Dishes */}
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <h3>Payment Method Breakdown</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Gross Share</span>
              </div>

              <div className={styles.breakdownList}>
                {[
                  { name: 'UPI / GPay / QR', amt: paymentBreakdown.UPI, color: '#2563eb' },
                  { name: 'Cash in Register', amt: paymentBreakdown.Cash, color: '#16a34a' },
                  { name: 'Debit / Credit Card', amt: paymentBreakdown.Card, color: '#8b5cf6' },
                  { name: 'Khata / Borrow Credit', amt: paymentBreakdown.Khata, color: '#d97706' }
                ].map(item => {
                  const pct = totalGrossRevenue > 0 ? Math.round((item.amt / totalGrossRevenue) * 100) : 0;
                  return (
                    <div key={item.name} className={styles.breakdownItem}>
                      <div className={styles.breakdownHeader}>
                        <span>{item.name}</span>
                        <span style={{ color: '#0f172a' }}>₹{item.amt.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className={styles.progressBarContainer}>
                        <div
                          className={styles.progressBar}
                          style={{ width: `${pct}%`, background: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <h3>Top Menu Performers</h3>
                <Award size={18} color="#d97706" />
              </div>

              {topDishes.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '0.85rem' }}>
                  No dish sales data available for this range.
                </div>
              ) : (
                <div className={styles.topDishesList}>
                  {topDishes.map((dish, i) => (
                    <div key={dish.name} className={styles.dishRow}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={styles.dishRank}>#{i + 1}</div>
                        <div>
                          <div className={styles.dishName}>{dish.name}</div>
                          <div className={styles.dishMeta}>{dish.count} orders sold</div>
                        </div>
                      </div>
                      <div className={styles.dishRevenue}>
                        ₹{dish.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order History & Details Section */}
          {(() => {
            const fromDb = (dbTables || []).map(t => String(t.tableNumber || '').replace(/^Table\s*/i, '').trim()).filter(Boolean);
            const fromOrders = (orders || []).map(o => String(o.tableNumber || o.table || '').replace(/^Table\s*/i, '').trim()).filter(Boolean);
            const uniqueTables = Array.from(new Set([...fromDb, ...fromOrders])).sort((a, b) => {
              return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
            });

            const q = orderSearch.trim().toLowerCase();
            const numQ = q.replace(/\D/g, '');

            const displayedOrders = completedOrders.filter(ord => {
              const ordNum = String(ord.orderNumber || ord._id?.slice(-5) || '').toLowerCase();
              const ordId = String(ord._id || '').toLowerCase();
              const custName = String(ord.customerName || ord.customerDetails?.name || '').toLowerCase();
              const rawPhone = String(ord.customerPhone || ord.customerDetails?.phone || '');
              const cleanPhone = rawPhone.replace(/\D/g, '');
              const itemsMatch = (ord.items || []).some(it => String(it.name || it.item?.name || '').toLowerCase().includes(q));

              const matchesSearch = q ? (
                ordNum.includes(q) ||
                ordId.includes(q) ||
                custName.includes(q) ||
                rawPhone.includes(q) ||
                (numQ.length >= 3 && cleanPhone.includes(numQ)) ||
                itemsMatch
              ) : true;

              const ordTbl = String(ord.tableNumber || ord.table || '').replace(/^Table\s*/i, '').trim();
              const matchesTable = tableFilter !== 'all' ? (ordTbl === String(tableFilter).replace(/^Table\s*/i, '').trim()) : true;
              return matchesSearch && matchesTable;
            });

            return (
              <div className={styles.chartCard} style={{ marginTop: '1.5rem' }}>
                <div className={styles.chartCardHeader} style={{ flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      Order History & Financial Details
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Showing {displayedOrders.length} settled orders
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="Search by order #, guest, phone..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        style={{
                          padding: '6px 10px 6px 28px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.8rem',
                          outline: 'none',
                          width: '210px'
                        }}
                      />
                      {orderSearch && (
                        <button
                          type="button"
                          onClick={() => setOrderSearch('')}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <select
                      value={tableFilter}
                      onChange={(e) => setTableFilter(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8rem',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        fontWeight: 600
                      }}
                    >
                      <option value="all">All Tables</option>
                      {uniqueTables.map(tNum => (
                        <option key={tNum} value={tNum}>{formatTableBadge(tNum)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                  <table className={styles.recentOrdersTable}>
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Table / Channel</th>
                        <th>Customer</th>
                        <th>Items Summary</th>
                        <th>Payment</th>
                        <th>Date & Time</th>
                        <th style={{ textAlign: 'right' }}>Final Amount</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            No orders match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        displayedOrders
                          .slice((reportsPage - 1) * reportsPageSize, reportsPage * reportsPageSize)
                          .map((ord, idx) => {
                            const orderNum = ord.orderNumber || (ord._id ? ord._id.slice(-6).toUpperCase() : `ORD-${idx + 1}`);
                            const displayAmount = getOrderAmount(ord);

                            return (
                              <tr key={ord._id || idx}>
                                <td style={{ fontWeight: 800, color: '#4f46e5' }}>
                                  #{orderNum}
                                </td>
                                <td style={{ fontWeight: 700, color: '#0f172a' }}>
                                  {ord.tableNumber ? formatTableBadge(ord.tableNumber) : 'Takeaway / POS'}
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700 }}>{ord.customerName || ord.customerDetails?.name || 'Walk-in Guest'}</div>
                                  {(ord.customerPhone || ord.customerDetails?.phone) && (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                      {ord.customerPhone || ord.customerDetails?.phone}
                                    </div>
                                  )}
                                </td>
                                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {(ord.items || []).map(it => `${it.quantity}x ${it.name || it.item?.name}`).join(', ')}
                                </td>
                                <td>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: ord.paymentMethod === 'Cash' ? '#ecfdf5' : '#eff6ff',
                                    color: ord.paymentMethod === 'Cash' ? '#059669' : '#2563eb'
                                  }}>
                                    {ord.paymentMethod || 'Cash'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  {new Date(ord.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                  ₹{displayAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'inline-flex', gap: '4px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrder(ord)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                        color: '#334155',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                    >
                                      <Eye size={12} /> View
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedInvoiceOrder(ord)}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #bfdbfe',
                                        background: '#eff6ff',
                                        color: '#1d4ed8',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                    >
                                      <FileText size={12} /> Invoice
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        openWhatsappBill(ord, tenantInfo);
                                        toast.success('WhatsApp E-Bill opened!');
                                      }}
                                      style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: '1px solid #bbf7d0',
                                        background: '#f0fdf4',
                                        color: '#166534',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                      title="Send WhatsApp E-Bill"
                                    >
                                      <MessageSquare size={12} /> WA Bill
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {Math.ceil(displayedOrders.length / reportsPageSize) > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                      Showing {((reportsPage - 1) * reportsPageSize) + 1} - {Math.min(reportsPage * reportsPageSize, displayedOrders.length)} of {displayedOrders.length} orders
                    </span>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <button
                        type="button"
                        disabled={reportsPage === 1}
                        onClick={() => setReportsPage(p => Math.max(1, p - 1))}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: reportsPage === 1 ? '#cbd5e1' : '#0f172a', fontWeight: 700, fontSize: '0.75rem', cursor: reportsPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        Prev
                      </button>
                      {Array.from({ length: Math.ceil(displayedOrders.length / reportsPageSize) }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setReportsPage(p)}
                          style={{ minWidth: '26px', height: '26px', padding: '0 4px', borderRadius: '6px', border: 'none', background: reportsPage === p ? '#4f46e5' : '#ffffff', color: reportsPage === p ? '#ffffff' : '#475569', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={reportsPage === Math.ceil(displayedOrders.length / reportsPageSize)}
                        onClick={() => setReportsPage(p => Math.min(Math.ceil(displayedOrders.length / reportsPageSize), p + 1))}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: reportsPage === Math.ceil(displayedOrders.length / reportsPageSize) ? '#cbd5e1' : '#0f172a', fontWeight: 700, fontSize: '0.75rem', cursor: reportsPage === Math.ceil(displayedOrders.length / reportsPageSize) ? 'not-allowed' : 'pointer' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* TAB 2: DAILY SALES SUMMARY (Date-Driven Sales Breakdown) */}
      {activeSubTab === 'dailySales' && (
        <div>
          {/* Date Selector Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`${styles.dateFilterBtn} ${dailyMode === 'today' ? styles.dateFilterActive : ''}`}
                onClick={() => setDailyMode('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`${styles.dateFilterBtn} ${dailyMode === 'yesterday' ? styles.dateFilterActive : ''}`}
                onClick={() => setDailyMode('yesterday')}
              >
                Yesterday
              </button>

              <div className={styles.datePickerGroup}>
                <Calendar size={14} color="#64748b" />
                <input
                  type="date"
                  className={styles.dateInput}
                  value={customDailyDate}
                  onChange={(e) => {
                    setCustomDailyDate(e.target.value);
                    setDailyMode('custom');
                  }}
                />
              </div>

              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', padding: '4px 8px', background: '#eff6ff', borderRadius: '6px' }}>
                Showing: {targetDailyDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className={styles.exportBtnGroup}>
              <button
                type="button"
                className={styles.excelBtn}
                onClick={handleExportDailyExcel}
              >
                <FileSpreadsheet size={15} />
                Export Daily Excel
              </button>
            </div>
          </div>

          {/* Daily Performance KPIs */}
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Daily Gross Revenue</div>
                <div className={styles.kpiValue}>₹{dailyGrossRevenue.toLocaleString()}</div>
                <div className={styles.kpiSubtitle}>
                  From {dailyCompletedCount} settled orders
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <DollarSign size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Total Orders Placed</div>
                <div className={styles.kpiValue}>{dailyTotalOrderCount}</div>
                <div className={styles.kpiSubtitle} style={{ color: '#64748b' }}>
                  {dailyCompletedCount} Completed • {dailyCancelledCount} Cancelled
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                <ShoppingBag size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Average Ticket Size</div>
                <div className={styles.kpiValue}>₹{dailyAvgTicket}</div>
                <div className={styles.kpiSubtitle} style={{ color: '#16a34a' }}>
                  Per settled order today
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <TrendingUp size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Dishes Sold Today</div>
                <div className={styles.kpiValue}>
                  {dailyDishBreakdown.reduce((sum, d) => sum + d.quantity, 0)}
                </div>
                <div className={styles.kpiSubtitle} style={{ color: '#64748b' }}>
                  Across {dailyDishBreakdown.length} unique catalog items
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#fae8ff', color: '#a855f7' }}>
                <UtensilsCrossed size={18} />
              </div>
            </div>
          </div>

          {/* Daily Payment Mode Split */}
          <div className={styles.chartCard} style={{ marginBottom: 16 }}>
            <div className={styles.chartCardHeader}>
              <h3>Payment Method Split ({targetDailyDate.toLocaleDateString()})</h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Daily Gross Split</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { name: 'UPI / Online', val: dailyPaymentSplit.UPI, color: '#2563eb' },
                { name: 'Cash in Register', val: dailyPaymentSplit.Cash, color: '#16a34a' },
                { name: 'Debit / Credit Card', val: dailyPaymentSplit.Card, color: '#8b5cf6' },
                { name: 'Khata Credit (Borrow)', val: dailyPaymentSplit.Khata, color: '#d97706' }
              ].map(p => {
                const pct = dailyGrossRevenue > 0 ? Math.round((p.val / dailyGrossRevenue) * 100) : 0;
                return (
                  <div key={p.name} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '3px 0' }}>₹{p.val.toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: p.color, fontWeight: 700 }}>{pct}% of daily gross</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date-Filtered Item Breakdown Table */}
          <div className={styles.chartCard}>
            <div className={styles.chartCardHeader} style={{ flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Items Sold on {targetDailyDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Breakdown of dishes, quantities, and revenue realized on this day
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Filter items sold today..."
                  value={dailyItemSearch}
                  onChange={(e) => setDailyItemSearch(e.target.value)}
                  style={{
                    padding: '6px 10px 6px 28px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    outline: 'none',
                    width: '210px'
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table className={styles.itemPerfTable}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Dish / Item Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Unit Price (₹)</th>
                    <th style={{ textAlign: 'center' }}>Quantity Sold</th>
                    <th style={{ textAlign: 'right' }}>Daily Revenue (₹)</th>
                    <th style={{ textAlign: 'right' }}>Revenue Share</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDailyDishes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No items sold on this date.
                      </td>
                    </tr>
                  ) : (
                    filteredDailyDishes.map((dish, idx) => {
                      const share = dailyGrossRevenue > 0 ? Math.round((dish.revenue / dailyGrossRevenue) * 100) : 0;
                      return (
                        <tr key={dish.name + idx}>
                          <td style={{ color: '#64748b', fontWeight: 600 }}>#{idx + 1}</td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>{dish.name}</td>
                          <td>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: 600 }}>
                              {dish.category}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{dish.price}</td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#2563eb' }}>
                            {dish.quantity}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{dish.revenue.toLocaleString()}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                            {share}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ITEM SUMMARY REPORT (Catalog & Dish-Wise Performance) */}
      {activeSubTab === 'itemSummary' && (
        <div>
          {/* Header Controls: Filters & Exports */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {['today', '7d', '30d', 'all'].map(tf => (
                <button
                  key={tf}
                  type="button"
                  className={`${styles.dateFilterBtn} ${itemTimeFilter === tf ? styles.dateFilterActive : ''}`}
                  onClick={() => setItemTimeFilter(tf)}
                >
                  {tf === 'today' ? 'Daily (Today)' : tf === '7d' ? 'Weekly (7 Days)' : tf === '30d' ? 'Monthly (30 Days)' : 'All Time'}
                </button>
              ))}

              <select
                value={itemCategoryFilter}
                onChange={(e) => setItemCategoryFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: '#ffffff',
                  outline: 'none'
                }}
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>

              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search catalog dishes..."
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  style={{
                    padding: '6px 10px 6px 28px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    outline: 'none',
                    width: '200px'
                  }}
                />
              </div>
            </div>

            <div className={styles.exportBtnGroup}>
              <button
                type="button"
                className={styles.excelBtn}
                onClick={handleExportItemPerformanceExcel}
              >
                <FileSpreadsheet size={15} />
                Export Excel (.xlsx)
              </button>

              <button
                type="button"
                className={styles.printBtn}
                onClick={handlePrintItemSummary}
              >
                <Printer size={15} />
                Print PDF Report
              </button>
            </div>
          </div>

          {/* Top-Selling & Low-Performing Highlights */}
          <div className={styles.performanceGrid}>
            {/* Top-Selling Dishes */}
            <div className={styles.performCard}>
              <div className={styles.performHeader}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#15803d' }}>
                  <Award size={18} color="#15803d" />
                  Top-Selling Dishes
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>By Units Sold</span>
              </div>

              {topSellingDishes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                  No dish sales recorded in this range
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topSellingDishes.map((dish, i) => (
                    <div key={dish.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                          #{i + 1}
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{dish.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{dish.category} • ₹{dish.currentPrice}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#15803d' }}>{dish.unitsSold} sold</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>₹{dish.totalRevenue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low-Performing Dishes */}
            <div className={styles.performCard}>
              <div className={styles.performHeader}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#b91c1c' }}>
                  <TrendingDown size={18} color="#b91c1c" />
                  Low-Performing Dishes
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Slow Moving / Zero Sales</span>
              </div>

              {lowPerformingDishes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.8rem' }}>
                  No low performing dishes detected
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lowPerformingDishes.map((dish, i) => (
                    <div key={dish.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                          •
                        </span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{dish.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{dish.category} • Price: ₹{dish.currentPrice}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: dish.unitsSold === 0 ? '#dc2626' : '#b45309' }}>
                          {dish.unitsSold === 0 ? '0 Units (Inactive)' : `${dish.unitsSold} sold`}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>₹{dish.totalRevenue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Full Catalog Performance Table */}
          <div className={styles.chartCard}>
            <div className={styles.chartCardHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                  Full Menu Catalog & Performance ({filteredCatalogPerformance.length} Dishes)
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Displaying units sold, current price, total revenue generated, category, and active stock status
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table className={styles.itemPerfTable}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Dish Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Current Price</th>
                    <th style={{ textAlign: 'center' }}>Units Sold</th>
                    <th style={{ textAlign: 'right' }}>Total Revenue</th>
                    <th style={{ textAlign: 'center' }}>Stock Status</th>
                    <th style={{ textAlign: 'center' }}>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalogPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No catalog items match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalogPerformance.map((dish, idx) => (
                      <tr key={dish.id || idx}>
                        <td style={{ color: '#64748b', fontWeight: 600 }}>#{idx + 1}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{dish.name}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: 600 }}>
                            {dish.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{dish.currentPrice}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: dish.unitsSold > 0 ? '#15803d' : '#94a3b8' }}>
                          {dish.unitsSold}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          ₹{dish.totalRevenue.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {dish.isAvailable ? (
                            <span className={styles.stockBadgeIn}>
                              <CheckCircle2 size={11} /> In Stock
                            </span>
                          ) : (
                            <span className={styles.stockBadgeOut}>
                              <XCircle size={11} /> Out of Stock
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {dish.isOpenMenu ? (
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#fef3c7', color: '#b45309', fontSize: '0.7rem', fontWeight: 700 }}>
                              Counter Only
                            </span>
                          ) : (
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', fontWeight: 700 }}>
                              Public QR
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          tenantInfo={tenantInfo}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Order Details & Bill Reprint Modal (Overview Tab) */}
      <AnimatePresence>
        {selectedOrder && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                maxWidth: '560px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.5rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                    Order #{selectedOrder.orderNumber || selectedOrder._id?.slice(-6).toUpperCase()}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                    {new Date(selectedOrder.createdAt).toLocaleString()} • {selectedOrder.tableNumber ? formatTableBadge(selectedOrder.tableNumber) : 'Takeaway'} ({selectedOrder.orderType || 'Dine-in'})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Guest Name: </span>
                  <strong>{selectedOrder.customerName || selectedOrder.customerDetails?.name || 'Walk-in Guest'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Phone: </span>
                  <strong>{selectedOrder.customerPhone || selectedOrder.customerDetails?.phone || 'Not provided'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Payment Method: </span>
                  <strong>{selectedOrder.paymentMethod || 'Cash'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Status: </span>
                  <strong style={{ color: '#16a34a', textTransform: 'capitalize' }}>{selectedOrder.status || 'completed'}</strong>
                </div>
              </div>

              {/* Item Breakdown */}
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                Item Breakdown ({selectedOrder.items?.length || 0})
              </h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Price</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((it, idx) => {
                      const itemPrice = Number(it.price) || 0;
                      const qty = Number(it.quantity) || 1;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0f172a' }}>{it.name || it.item?.name}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800 }}>{qty}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{itemPrice}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>₹{itemPrice * qty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Settlement summary */}
              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontWeight: 900, fontSize: '0.92rem', color: '#0f172a' }}>
                  <span>Final Settled Amount:</span>
                  <span style={{ color: '#e05c5c' }}>₹{selectedOrder.settledAmount || selectedOrder.finalAmount || selectedOrder.totalAmount || selectedOrder.total || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Printing customer bill receipt...');
                    printOrderBill(selectedOrder, tenantInfo?.name);
                  }}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={15} /> Reprint Bill
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoiceOrder(selectedOrder);
                  }}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={15} /> Tax Invoice
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openWhatsappBill(selectedOrder, tenantInfo);
                    toast.success('WhatsApp E-Bill opened!');
                  }}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <MessageSquare size={15} /> WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Executive PDF & 105B AI Report Modal */}
      <ExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        timeFilter={timeFilter}
        initialData={{
          metrics: {
            totalGrossRevenue,
            totalOrders: totalOrdersCount,
            avgTicketSize,
            outstandingKhata,
            paymentBreakdown,
            topDishes
          },
          completedOrders,
          businessName: tenantInfo?.businessName || tenantInfo?.name || 'DINEVIQ Partner Cafe'
        }}
      />
    </div>
  );
}
