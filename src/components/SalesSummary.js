import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Printer,
  Calendar,
  Award,
  ArrowUpRight,
  BookOpen,
  Search,
  X,
  Receipt,
  CheckCircle2,
  Eye,
  Clock,
  Utensils,
  Sparkles,
  FileSpreadsheet,
  Coffee,
  Sun,
  Moon,
  History,
  ListFilter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { API_URL } from '../config/api';
import styles from './SalesSummary.module.css';
import { printOrderBill } from '../utils/billPrinter';
import ExecutiveReportModal from './ExecutiveReportModal';
import DayCloseZReportModal from './DayCloseZReportModal';

export default function SalesSummary({ initialOrders = [] }) {
  const [orders, setOrders] = useState(() => (Array.isArray(initialOrders) && initialOrders.length > 0 ? initialOrders : []));
  const [khataRecords, setKhataRecords] = useState([]);
  const [dbTables, setDbTables] = useState([]);
  const [menuCatalog, setMenuCatalog] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(() => !(Array.isArray(initialOrders) && initialOrders.length > 0));

  // Navigation Sub-tabs: 'overview' | 'items' | 'categories' | 'hourly' | 'daily' | 'orders'
  const [activeTab, setActiveTab] = useState('overview');

  // Time Filter State (default '7d' so date-wise item breakdown shows multi-day history immediately)
  const [timeFilter, setTimeFilter] = useState('7d'); // 'today' | 'yesterday' | '7d' | '30d' | 'thisMonth' | 'all' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Item-Wise & Date-Wise Tab State
  const [itemViewMode, setItemViewMode] = useState('datewise'); // 'datewise' | 'leaderboard'
  const [itemSortBy, setItemSortBy] = useState('revenue'); // 'revenue' | 'qty' | 'name'
  const [collapsedDates, setCollapsedDates] = useState({});
  const [selectedDishHistory, setSelectedDishHistory] = useState(null);

  // Search & Filter State
  const [orderSearch, setOrderSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dishSearch, setDishSearch] = useState('');

  // Modals State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  // Pagination for Orders Table
  const [reportsPage, setReportsPage] = useState(1);
  const reportsPageSize = 10;

  useEffect(() => {
    setReportsPage(1);
  }, [timeFilter, customStartDate, customEndDate, orderSearch, tableFilter, activeTab]);

  useEffect(() => {
    if (Array.isArray(initialOrders) && initialOrders.length > 0) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

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

      const tid = localStorage.getItem('tenantId') || (JSON.parse(localStorage.getItem('user') || '{}')?.tenantId);

      const [ordersRes, khataRes, tablesRes, menuRes, tenantRes] = await Promise.allSettled([
        axios.get(`${API_URL}/orders`, { headers }),
        axios.get(`${API_URL}/khata`, { headers }),
        axios.get(`${API_URL}/tables`, { headers }),
        axios.get(`${API_URL}/menu?tenantId=${tid || ''}&includeUnavailable=true&includePosOnly=true`, { headers }),
        tid ? axios.get(`${API_URL}/tenants/public/${tid}`) : Promise.reject('No tenant')
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
      console.error('Failed to load sales summary data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Robust order amount resolver across schemas and fallbacks
  const getOrderAmount = (ord) => {
    if (!ord) return 0;
    const val = Number(ord.settledAmount || ord.finalAmount || ord.total || ord.totalAmount || ord.subTotal);
    if (!isNaN(val) && val > 0) return val;
    if (Array.isArray(ord.items) && ord.items.length > 0) {
      return ord.items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    }
    return 0;
  };

  // Filter orders by date presets and custom range
  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter(ord => {
      if (!ord.createdAt) return false;
      const ordDate = new Date(ord.createdAt);

      if (timeFilter === 'all') return true;

      if (timeFilter === 'today') {
        return ordDate.toDateString() === now.toDateString();
      }

      if (timeFilter === 'yesterday') {
        const yest = new Date();
        yest.setDate(now.getDate() - 1);
        return ordDate.toDateString() === yest.toDateString();
      }

      if (timeFilter === '7d') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return ordDate >= sevenDaysAgo;
      }

      if (timeFilter === '30d') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        return ordDate >= thirtyDaysAgo;
      }

      if (timeFilter === 'thisMonth') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        return ordDate >= startOfMonth;
      }

      if (timeFilter === 'custom') {
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date('2020-01-01');
        const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date();
        return ordDate >= start && ordDate <= end;
      }

      return true;
    });
  }, [orders, timeFilter, customStartDate, customEndDate]);

  // Financial and KPI calculations
  const completedOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'completed');
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'cancelled');
  }, [filteredOrders]);

  const activeOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  }, [filteredOrders]);

  const totalGrossRevenue = useMemo(() => {
    return completedOrders.reduce((acc, o) => acc + getOrderAmount(o), 0);
  }, [completedOrders]);

  const totalTaxAmount = useMemo(() => {
    return completedOrders.reduce((acc, o) => acc + (Number(o.taxAmount) || 0), 0);
  }, [completedOrders]);

  const totalNetSales = useMemo(() => {
    const calculatedNet = completedOrders.reduce((acc, o) => {
      const sub = Number(o.subTotal);
      if (!isNaN(sub) && sub > 0) return acc + sub;
      return acc + (getOrderAmount(o) - (Number(o.taxAmount) || 0));
    }, 0);
    return calculatedNet > 0 ? calculatedNet : Math.max(0, totalGrossRevenue - totalTaxAmount);
  }, [completedOrders, totalGrossRevenue, totalTaxAmount]);

  const totalCompletedCount = completedOrders.length;
  const activeOrdersCount = activeOrders.length;
  const totalOrdersCount = filteredOrders.length;
  const avgTicketSize = totalCompletedCount > 0 ? Math.round(totalGrossRevenue / totalCompletedCount) : 0;

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const breakdown = {
      UPI: 0,
      Cash: 0,
      Card: 0,
      Khata: 0
    };

    completedOrders.forEach(ord => {
      const method = (ord.paymentMethod || 'Cash').toLowerCase();
      const amt = getOrderAmount(ord);
      if (method.includes('upi') || method.includes('gpay') || method.includes('qr')) {
        breakdown.UPI += amt;
      } else if (method.includes('card')) {
        breakdown.Card += amt;
      } else if (method.includes('khata') || method.includes('borrow')) {
        breakdown.Khata += amt;
      } else {
        breakdown.Cash += amt;
      }
    });

    return breakdown;
  }, [completedOrders]);

  // Khata Total Outstanding
  const outstandingKhata = useMemo(() => {
    return khataRecords
      .filter(k => k.status !== 'settled')
      .reduce((acc, k) => acc + (Number(k.borrowAmount || k.remainingAmount || k.totalBill) || 0), 0);
  }, [khataRecords]);

  // Channel & Dining Split
  const channelBreakdown = useMemo(() => {
    const channels = {
      dineIn: { name: 'Dine-In (Tables)', count: 0, revenue: 0 },
      takeaway: { name: 'Takeaway / Parcel', count: 0, revenue: 0 },
      delivery: { name: 'Delivery / Online', count: 0, revenue: 0 },
      posDirect: { name: 'Quick POS Counter', count: 0, revenue: 0 }
    };

    completedOrders.forEach(ord => {
      const amt = getOrderAmount(ord);
      const type = String(ord.orderType || ord.channel || '').toLowerCase();
      const hasTable = Boolean(ord.tableNumber && ord.tableNumber !== 'Takeaway' && ord.tableNumber !== 'Direct');

      if (type.includes('delivery')) {
        channels.delivery.count += 1;
        channels.delivery.revenue += amt;
      } else if (type.includes('takeaway') || type.includes('parcel') || type.includes('pickup')) {
        channels.takeaway.count += 1;
        channels.takeaway.revenue += amt;
      } else if (hasTable || type.includes('dine')) {
        channels.dineIn.count += 1;
        channels.dineIn.revenue += amt;
      } else {
        channels.posDirect.count += 1;
        channels.posDirect.revenue += amt;
      }
    });

    return channels;
  }, [completedOrders]);

  // Menu Categories Mapping
  const menuMap = useMemo(() => {
    const map = {};
    menuCatalog.forEach(m => {
      if (m && m.name) {
        map[m.name.trim().toLowerCase()] = {
          category: m.category || m.categoryId || 'General',
          isVeg: m.isVeg !== false
        };
      }
    });
    return map;
  }, [menuCatalog]);

  // Category, Consolidated Dish Leaderboard, and Date-Wise Item Sales Aggregators
  const { categorySalesList, dishSalesList, topDishes, dateWiseItemSales, totalUnitsSold } = useMemo(() => {
    const catMap = {};
    const dishMap = {};
    const dateMap = {};
    let unitsSum = 0;

    // Sort completedOrders newest first so history arrays are naturally newest first
    const sortedOrders = [...completedOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sortedOrders.forEach(ord => {
      const ordDateObj = new Date(ord.createdAt);
      const dateKey = ordDateObj.toISOString().slice(0, 10);
      const displayDate = ordDateObj.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = ordDateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const orderNum = ord.orderNumber || (ord._id ? ord._id.slice(-6).toUpperCase() : 'ORD');
      const tableLabel = ord.tableNumber ? `Table ${ord.tableNumber}` : 'Takeaway / POS';
      const custName = ord.customerName || ord.customerDetails?.name || 'Walk-in Guest';
      const payMethod = ord.paymentMethod || 'Cash';

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          dateKey,
          displayDate,
          orderIds: new Set(),
          totalQty: 0,
          totalRevenue: 0,
          itemsMap: {}
        };
      }
      dateMap[dateKey].orderIds.add(ord._id || orderNum);

      (ord.items || []).forEach(item => {
        const dishName = (item.name || item.item?.name || 'Unknown Item').trim();
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price || item.item?.price) || 0;
        const lineTotal = qty * price;
        unitsSum += qty;

        const catalogEntry = menuMap[dishName.toLowerCase()];
        const category = (item.category || item.item?.category || catalogEntry?.category || 'General').trim();

        // 1. Category accumulator
        if (!catMap[category]) {
          catMap[category] = { name: category, qty: 0, revenue: 0 };
        }
        catMap[category].qty += qty;
        catMap[category].revenue += lineTotal;

        // 2. Consolidated Dish accumulator (with full date/time history)
        if (!dishMap[dishName]) {
          dishMap[dishName] = {
            name: dishName,
            category,
            count: 0,
            revenue: 0,
            price,
            lastSoldAt: ord.createdAt,
            history: []
          };
        }
        dishMap[dishName].count += qty;
        dishMap[dishName].revenue += lineTotal;
        dishMap[dishName].history.push({
          dateKey,
          displayDate,
          timeStr,
          createdAt: ord.createdAt,
          orderNum,
          tableLabel,
          customerName: custName,
          qty,
          price,
          lineTotal,
          payMethod
        });

        // 3. Date-wise Item accumulator
        dateMap[dateKey].totalQty += qty;
        dateMap[dateKey].totalRevenue += lineTotal;
        if (!dateMap[dateKey].itemsMap[dishName]) {
          dateMap[dateKey].itemsMap[dishName] = {
            name: dishName,
            category,
            qty: 0,
            price,
            revenue: 0,
            timings: []
          };
        }
        dateMap[dateKey].itemsMap[dishName].qty += qty;
        dateMap[dateKey].itemsMap[dishName].revenue += lineTotal;
        dateMap[dateKey].itemsMap[dishName].timings.push({ timeStr, qty, orderNum });
      });
    });

    const categorySalesList = Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
    const dishSalesList = Object.values(dishMap).sort((a, b) => b.revenue - a.revenue);
    const topDishes = dishSalesList.slice(0, 5);

    const dateWiseItemSales = Object.values(dateMap)
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
      .map(d => ({
        dateKey: d.dateKey,
        displayDate: d.displayDate,
        ordersCount: d.orderIds.size,
        totalQty: d.totalQty,
        totalRevenue: d.totalRevenue,
        items: Object.values(d.itemsMap).sort((a, b) => b.revenue - a.revenue)
      }));

    return {
      categorySalesList,
      dishSalesList,
      topDishes,
      dateWiseItemSales,
      totalUnitsSold: unitsSum
    };
  }, [completedOrders, menuMap]);

  // Hourly Sales & Peak Rush Engine (08:00 to 23:00)
  const { hourlyDistribution, peakRushHour, mealSessions } = useMemo(() => {
    const hours = Array.from({ length: 16 }, (_, i) => i + 8);
    const distMap = {};
    hours.forEach(h => {
      distMap[h] = { hour: h, count: 0, revenue: 0 };
    });

    const sessions = {
      breakfast: { name: 'Morning / Breakfast', time: '08:00 - 11:59', count: 0, revenue: 0, icon: Sun },
      lunch: { name: 'Lunch Rush', time: '12:00 - 15:59', count: 0, revenue: 0, icon: Utensils },
      evening: { name: 'Evening Snacks & Brews', time: '16:00 - 18:59', count: 0, revenue: 0, icon: Coffee },
      dinner: { name: 'Dinner Peak Rush', time: '19:00 - 23:59', count: 0, revenue: 0, icon: Moon }
    };

    let maxHourRev = 0;
    let busiestHour = 20;

    completedOrders.forEach(ord => {
      const d = new Date(ord.createdAt);
      const h = d.getHours();
      const amt = getOrderAmount(ord);

      if (distMap[h]) {
        distMap[h].count += 1;
        distMap[h].revenue += amt;
      }

      if (h >= 8 && h < 12) {
        sessions.breakfast.count += 1;
        sessions.breakfast.revenue += amt;
      } else if (h >= 12 && h < 16) {
        sessions.lunch.count += 1;
        sessions.lunch.revenue += amt;
      } else if (h >= 16 && h < 19) {
        sessions.evening.count += 1;
        sessions.evening.revenue += amt;
      } else if (h >= 19 && h <= 23) {
        sessions.dinner.count += 1;
        sessions.dinner.revenue += amt;
      }
    });

    Object.values(distMap).forEach(dh => {
      if (dh.revenue > maxHourRev) {
        maxHourRev = dh.revenue;
        busiestHour = dh.hour;
      }
    });

    const startHStr = busiestHour % 12 === 0 ? 12 : busiestHour % 12;
    const endHStr = (busiestHour + 1) % 12 === 0 ? 12 : (busiestHour + 1) % 12;
    const ampm = busiestHour >= 12 ? 'PM' : 'AM';
    const endAmpm = (busiestHour + 1) >= 12 ? 'PM' : 'AM';

    const peakRushHour = {
      hourLabel: `${startHStr}:00 ${ampm} - ${endHStr}:00 ${endAmpm}`,
      revenue: maxHourRev,
      orders: distMap[busiestHour]?.count || 0
    };

    return {
      hourlyDistribution: Object.values(distMap),
      peakRushHour,
      mealSessions: Object.values(sessions)
    };
  }, [completedOrders]);

  // Daily Timeline Engine (Grouped by Date YYYY-MM-DD)
  const dailyTimelineList = useMemo(() => {
    const daysMap = {};

    completedOrders.forEach(ord => {
      const dateKey = new Date(ord.createdAt).toISOString().slice(0, 10);
      const amt = getOrderAmount(ord);
      const tax = Number(ord.taxAmount) || 0;
      const method = (ord.paymentMethod || 'Cash').toLowerCase();
      const isCash = method.includes('cash');

      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          dateKey,
          displayDate: new Date(ord.createdAt).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          count: 0,
          gross: 0,
          tax: 0,
          net: 0,
          cash: 0,
          digital: 0
        };
      }

      daysMap[dateKey].count += 1;
      daysMap[dateKey].gross += amt;
      daysMap[dateKey].tax += tax;
      daysMap[dateKey].net += (amt - tax);
      if (isCash) {
        daysMap[dateKey].cash += amt;
      } else {
        daysMap[dateKey].digital += amt;
      }
    });

    return Object.values(daysMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [completedOrders]);

  const maxHourlyRevenue = useMemo(() => {
    return Math.max(...hourlyDistribution.map(h => h.revenue), 100);
  }, [hourlyDistribution]);

  // Excel Export Engine (Multi-Sheet Workbook including Date-Wise Item Sales)
  const handleExportFullExcel = () => {
    try {
      toast.loading('Generating comprehensive Sales Excel workbook...', { id: 'excel-export' });

      const summaryAoa = [
        ['DINEVIQ OS - SALES SUMMARY REPORT', ''],
        ['Restaurant', tenantInfo?.businessName || tenantInfo?.name || 'DineviQ Cafe'],
        ['Reporting Window', timeFilter.toUpperCase()],
        ['Exported On', new Date().toLocaleString()],
        ['', ''],
        ['EXECUTIVE KPI METRICS', 'VALUE'],
        ['Total Gross Revenue', totalGrossRevenue],
        ['Net Sales (Pre-Tax)', totalNetSales],
        ['Total GST / Tax Collected', totalTaxAmount],
        ['Average Order Value (AOV)', avgTicketSize],
        ['Total Settled Orders', totalCompletedCount],
        ['Total Units / Items Sold', totalUnitsSold],
        ['Active / In-Kitchen Orders', activeOrdersCount],
        ['Cancelled / Void Orders', cancelledOrders.length],
        ['Customer Khata Outstanding', outstandingKhata],
        ['', ''],
        ['PAYMENT TENDER SHARE', 'AMOUNT (INR)'],
        ['UPI / Dynamic QR', paymentBreakdown.UPI],
        ['Cash in Register', paymentBreakdown.Cash],
        ['Credit / Debit Cards', paymentBreakdown.Card],
        ['Khata / Credit Extended', paymentBreakdown.Khata]
      ];

      // Date-Wise Item Sales Sheet
      const dateWiseItemsAoa = [
        ['Date', 'Dish Name', 'Category', 'Qty Sold', 'Unit Price (INR)', 'Total Revenue (INR)', 'Sold Timings']
      ];
      dateWiseItemSales.forEach(dGroup => {
        dGroup.items.forEach(it => {
          const timingsStr = it.timings.map(t => `${t.timeStr} (x${t.qty})`).join(', ');
          dateWiseItemsAoa.push([
            dGroup.displayDate,
            it.name,
            it.category,
            it.qty,
            it.price,
            it.revenue,
            timingsStr
          ]);
        });
      });

      const dishAoa = [
        ['Rank', 'Dish Name', 'Category', 'Total Units Sold', 'Unit Price', 'Total Sales (INR)', 'Share %', 'Last Sold']
      ];
      dishSalesList.forEach((d, idx) => {
        const pct = totalGrossRevenue > 0 ? ((d.revenue / totalGrossRevenue) * 100).toFixed(1) : 0;
        dishAoa.push([
          idx + 1,
          d.name,
          d.category,
          d.count,
          d.price,
          d.revenue,
          `${pct}%`,
          d.lastSoldAt ? new Date(d.lastSoldAt).toLocaleString('en-IN') : ''
        ]);
      });

      const categoryAoa = [
        ['Category', 'Total Units Sold', 'Total Revenue (INR)', 'Revenue Share %']
      ];
      categorySalesList.forEach(c => {
        const pct = totalGrossRevenue > 0 ? ((c.revenue / totalGrossRevenue) * 100).toFixed(1) : 0;
        categoryAoa.push([c.name, c.qty, c.revenue, `${pct}%`]);
      });

      const ordersAoa = [
        ['Order #', 'Table / Channel', 'Guest Name', 'Mobile Phone', 'Items Summary', 'Payment Mode', 'Date & Time', 'Subtotal', 'Tax', 'Final Settled Amount']
      ];
      completedOrders.forEach(ord => {
        const orderNum = ord.orderNumber || (ord._id ? ord._id.slice(-6).toUpperCase() : 'ORD');
        const amt = getOrderAmount(ord);
        ordersAoa.push([
          orderNum,
          ord.tableNumber ? `Table ${ord.tableNumber}` : 'Takeaway / POS',
          ord.customerName || ord.customerDetails?.name || 'Guest Diner',
          ord.customerPhone || ord.customerDetails?.phone || '',
          (ord.items || []).map(i => `${i.quantity}x ${i.name || i.item?.name}`).join(', '),
          ord.paymentMethod || 'Cash',
          new Date(ord.createdAt).toLocaleString(),
          ord.subTotal || (amt - (Number(ord.taxAmount) || 0)),
          Number(ord.taxAmount) || 0,
          amt
        ]);
      });

      const dailyAoa = [
        ['Date', 'Settled Orders', 'Gross Sales (INR)', 'Net Sales', 'Tax (GST)', 'Cash Sales', 'Digital (UPI/Card)']
      ];
      dailyTimelineList.forEach(dy => {
        dailyAoa.push([dy.displayDate, dy.count, dy.gross, dy.net, dy.tax, dy.cash, dy.digital]);
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryAoa), 'Executive Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dateWiseItemsAoa), 'Date-Wise Item Sales');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dishAoa), 'Item Leaderboard');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(categoryAoa), 'Category Sales');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dailyAoa), 'Daily Timeline');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ordersAoa), 'Orders Ledger');

      XLSX.writeFile(wb, `DineviQ_Sales_Summary_${timeFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.dismiss('excel-export');
      toast.success('Complete Sales & Date-Wise Item Excel downloaded!');
    } catch (err) {
      console.error('Full Excel Export Error:', err);
      toast.dismiss('excel-export');
      toast.error('Failed to export Excel report.');
    }
  };

  // Collect unique tables for filtering
  const uniqueTables = useMemo(() => {
    const fromDb = (dbTables || []).map(t => String(t.tableNumber || '').replace(/^Table\s*/i, '').trim()).filter(Boolean);
    const fromOrders = (orders || []).map(o => String(o.tableNumber || o.table || '').replace(/^Table\s*/i, '').trim()).filter(Boolean);
    return Array.from(new Set([...fromDb, ...fromOrders])).sort((a, b) => {
      return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [dbTables, orders]);

  // Filtered orders for Orders Ledger tab
  const displayedOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    const numQ = q.replace(/\D/g, '');

    return completedOrders.filter(ord => {
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
  }, [completedOrders, orderSearch, tableFilter]);

  // Filtered & sorted dishes for Item-Wise Leaderboard
  const displayedDishes = useMemo(() => {
    const q = dishSearch.trim().toLowerCase();
    const filtered = dishSalesList.filter(d => {
      const matchesCat = categoryFilter === 'all' || d.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesSearch = !q || d.name.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });

    if (itemSortBy === 'qty') {
      return [...filtered].sort((a, b) => b.count - a.count);
    }
    if (itemSortBy === 'name') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return [...filtered].sort((a, b) => b.revenue - a.revenue);
  }, [dishSalesList, categoryFilter, dishSearch, itemSortBy]);

  // Filtered Date-Wise Item Groups
  const filteredDateWiseGroups = useMemo(() => {
    const q = dishSearch.trim().toLowerCase();
    return dateWiseItemSales
      .map(group => {
        const items = group.items.filter(it => {
          const matchesCat = categoryFilter === 'all' || it.category.toLowerCase() === categoryFilter.toLowerCase();
          const matchesSearch = !q || it.name.toLowerCase().includes(q);
          return matchesCat && matchesSearch;
        });
        if (items.length === 0) return null;
        return {
          ...group,
          items,
          filteredQty: items.reduce((s, i) => s + i.qty, 0),
          filteredRevenue: items.reduce((s, i) => s + i.revenue, 0)
        };
      })
      .filter(Boolean);
  }, [dateWiseItemSales, categoryFilter, dishSearch]);

  const toggleDateCollapse = (dateKey) => {
    setCollapsedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const openDishHistoryByName = (dishName) => {
    const found = dishSalesList.find(d => d.name.toLowerCase() === dishName.toLowerCase());
    if (found) setSelectedDishHistory(found);
  };

  return (
    <div className={styles.container}>
      {/* Clean 2-Row Header & Filter Toolbar */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <div className={styles.titleGroup}>
            <h2>
              <TrendingUp size={24} color="#2563eb" />
              Sales Summary & Item-Wise Analytics
            </h2>
            <p>
              Complete date-wise item sales, category insights, peak rush hours, day-end Z-report & Excel exports
            </p>
          </div>

          <div className={styles.controlsGroup}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.excelBtn}`}
              onClick={handleExportFullExcel}
              title="Download multi-sheet Excel with Date-Wise Item Sales"
            >
              <FileSpreadsheet size={15} />
              Export Excel
            </button>

            <button
              type="button"
              className={`${styles.actionBtn} ${styles.zReportBtn}`}
              onClick={() => setIsZReportOpen(true)}
              title="Cash drawer shift close & 80mm thermal Z-slip"
            >
              <Receipt size={15} />
              Day-End Z-Report
            </button>

            <button
              type="button"
              className={`${styles.actionBtn} ${styles.pdfBtn}`}
              onClick={() => setIsExecutiveReportOpen(true)}
              title="Executive PDF Audit Report"
            >
              <Printer size={15} />
              Executive PDF
            </button>
          </div>
        </div>

        {/* Dedicated Date Filter Toolbar */}
        <div className={styles.filterToolbar}>
          <div className={styles.datePresetsGroup}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
              <Calendar size={14} /> Period:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom Range' }
            ].map(tf => (
              <button
                key={tf.id}
                type="button"
                className={`${styles.dateFilterBtn} ${timeFilter === tf.id ? styles.dateFilterActive : ''}`}
                onClick={() => setTimeFilter(tf.id)}
              >
                {tf.label}
              </button>
            ))}

            {timeFilter === 'custom' && (
              <div className={styles.customDateBox}>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={styles.customDateInput}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={styles.customDateInput}
                />
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span>🧾 <strong>{totalCompletedCount}</strong> Bills</span>
            <span>🍽️ <strong>{totalUnitsSold}</strong> Items Sold</span>
            <span style={{ color: '#2563eb' }}>💰 <strong>₹{totalGrossRevenue.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation Bar */}
      <div className={styles.subTabsContainer}>
        {[
          { id: 'overview', label: 'Executive Overview', icon: BarChart3, count: null },
          { id: 'items', label: 'Item-Wise & Date-Wise Sales', icon: Utensils, count: dishSalesList.length },
          { id: 'categories', label: 'Category Breakdown', icon: ListFilter, count: categorySalesList.length },
          { id: 'hourly', label: 'Hourly Rush & Peak Trends', icon: Clock, count: null },
          { id: 'daily', label: 'Daily Sales Timeline', icon: Calendar, count: dailyTimelineList.length },
          { id: 'orders', label: 'Order Bills Ledger', icon: Receipt, count: completedOrders.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.subTabBtn} ${isActive ? styles.subTabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={isActive ? styles.subTabBadge : styles.subTabBadgeInactive}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: EXECUTIVE OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div>
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Total Gross Revenue</div>
                <div className={styles.kpiValue}>₹{totalGrossRevenue.toLocaleString('en-IN')}</div>
                <div className={styles.kpiSubtitle}>
                  <ArrowUpRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  {totalCompletedCount} Settled Tickets
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <DollarSign size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Net Sales (Pre-Tax)</div>
                <div className={styles.kpiValue}>₹{Math.round(totalNetSales).toLocaleString('en-IN')}</div>
                <div className={styles.kpiSubtitle} style={{ color: '#0284c7' }}>
                  GST Collected: ₹{totalTaxAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#f0f9ff', color: '#0284c7' }}>
                <TrendingUp size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Average Order Value</div>
                <div className={styles.kpiValue}>₹{avgTicketSize}</div>
                <div className={styles.kpiSubtitle} style={{ color: '#64748b' }}>
                  {totalUnitsSold} total items sold
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <Award size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Total Orders Volume</div>
                <div className={styles.kpiValue}>{totalOrdersCount}</div>
                <div className={styles.kpiSubtitle} style={{ color: '#64748b' }}>
                  {totalCompletedCount} Settled • {activeOrdersCount} in Kitchen
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                <ShoppingBag size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Khata Credit Dues</div>
                <div className={styles.kpiValue} style={{ color: '#dc2626' }}>
                  ₹{outstandingKhata.toLocaleString('en-IN')}
                </div>
                <div className={styles.kpiSubtitle} style={{ color: '#dc2626' }}>
                  {khataRecords.filter(k => k.status !== 'settled').length} Active Customers
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
                <BookOpen size={18} />
              </div>
            </div>

            <div className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTitle}>Peak Rush Hour</div>
                <div className={styles.kpiValue} style={{ fontSize: '1.05rem', marginTop: '3px' }}>
                  {peakRushHour.orders > 0 ? peakRushHour.hourLabel : 'Routine Flow'}
                </div>
                <div className={styles.kpiSubtitle} style={{ color: '#7c3aed' }}>
                  {peakRushHour.orders > 0 ? `₹${peakRushHour.revenue.toLocaleString('en-IN')} (${peakRushHour.orders} bills)` : 'Steady dining rhythm'}
                </div>
              </div>
              <div className={styles.kpiIcon} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <Clock size={18} />
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <h3>
                  <CreditCard size={17} color="#2563eb" />
                  Payment Tender Distribution
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Gross Share</span>
              </div>

              <div className={styles.breakdownList}>
                {[
                  { name: 'UPI / Dynamic QR / Net Banking', amt: paymentBreakdown.UPI, color: '#2563eb' },
                  { name: 'Cash in Register', amt: paymentBreakdown.Cash, color: '#16a34a' },
                  { name: 'Debit / Credit Card', amt: paymentBreakdown.Card, color: '#8b5cf6' },
                  { name: 'Customer Khata Credit Extended', amt: paymentBreakdown.Khata, color: '#d97706' }
                ].map(item => {
                  const pct = totalGrossRevenue > 0 ? Math.round((item.amt / totalGrossRevenue) * 100) : 0;
                  return (
                    <div key={item.name} className={styles.breakdownItem}>
                      <div className={styles.breakdownHeader}>
                        <span>{item.name}</span>
                        <span style={{ color: '#0f172a' }}>
                          ₹{item.amt.toLocaleString('en-IN')} ({pct}%)
                        </span>
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

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <div className={styles.chartCardHeader} style={{ marginBottom: '8px' }}>
                  <h3>
                    <Utensils size={16} color="#d97706" />
                    Channel & Dining Mode Split
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Fulfillment</span>
                </div>
                <div className={styles.channelGrid}>
                  {Object.values(channelBreakdown).map(ch => {
                    const pct = totalGrossRevenue > 0 ? Math.round((ch.revenue / totalGrossRevenue) * 100) : 0;
                    return (
                      <div key={ch.name} className={styles.channelCard}>
                        <div className={styles.channelTitle}>{ch.name}</div>
                        <div className={styles.channelValue}>₹{ch.revenue.toLocaleString('en-IN')}</div>
                        <div className={styles.channelMeta}>{ch.count} orders • {pct}% share</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <h3>
                  <Award size={18} color="#d97706" />
                  Top Menu Performers
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Item-Wise & Date-Wise &rarr;
                </button>
              </div>

              {topDishes.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '0.85rem' }}>
                  No dish sales data available for this range.
                </div>
              ) : (
                <div className={styles.topDishesList}>
                  {topDishes.map((dish, i) => (
                    <div
                      key={dish.name}
                      className={styles.dishRow}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedDishHistory(dish)}
                      title="Click to see exact dates & times sold"
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={styles.dishRank}>#{i + 1}</div>
                        <div>
                          <div className={styles.dishName}>{dish.name}</div>
                          <div className={styles.dishMeta}>
                            {dish.count} sold • {dish.category}
                          </div>
                        </div>
                      </div>
                      <div className={styles.dishRevenue}>
                        ₹{dish.revenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ITEM-WISE & DATE-WISE SALES (KIS DATE KO KAUNSA ITEM KITNA BIKA) ── */}
      {activeTab === 'items' && (
        <div>
          {/* Filter & View Mode Toolbar */}
          <div className={styles.chartCard} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div className={styles.viewToggleGroup}>
                <button
                  type="button"
                  className={`${styles.viewToggleBtn} ${itemViewMode === 'datewise' ? styles.viewToggleActive : ''}`}
                  onClick={() => setItemViewMode('datewise')}
                >
                  <Calendar size={14} />
                  Date-Wise Item Breakdown
                </button>
                <button
                  type="button"
                  className={`${styles.viewToggleBtn} ${itemViewMode === 'leaderboard' ? styles.viewToggleActive : ''}`}
                  onClick={() => setItemViewMode('leaderboard')}
                >
                  <Award size={14} />
                  Item-Wise Leaderboard
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search item name..."
                    value={dishSearch}
                    onChange={(e) => setDishSearch(e.target.value)}
                    style={{
                      padding: '6px 10px 6px 28px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      outline: 'none',
                      width: '190px'
                    }}
                  />
                  {dishSearch && (
                    <button
                      type="button"
                      onClick={() => setDishSearch('')}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
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
                  <option value="all">All Categories ({categorySalesList.length})</option>
                  {categorySalesList.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                {itemViewMode === 'leaderboard' && (
                  <select
                    value={itemSortBy}
                    onChange={(e) => setItemSortBy(e.target.value)}
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
                    <option value="revenue">Sort: Highest Revenue</option>
                    <option value="qty">Sort: Most Qty Sold</option>
                    <option value="name">Sort: Name (A-Z)</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* VIEW A: DATE-WISE ITEM BREAKDOWN */}
          {itemViewMode === 'datewise' && (
            <div className={styles.dateGroupList}>
              {filteredDateWiseGroups.length === 0 ? (
                <div className={styles.chartCard} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No item sales found for the selected date range or search filter.
                </div>
              ) : (
                filteredDateWiseGroups.map(group => {
                  const isCollapsed = Boolean(collapsedDates[group.dateKey]);
                  return (
                    <div key={group.dateKey} className={styles.dateGroupCard}>
                      <div className={styles.dateGroupHeader} onClick={() => toggleDateCollapse(group.dateKey)}>
                        <div className={styles.dateGroupTitle}>
                          <Calendar size={17} color="#2563eb" />
                          <span>{group.displayDate}</span>
                          {isCollapsed ? <ChevronDown size={16} color="#64748b" /> : <ChevronUp size={16} color="#64748b" />}
                        </div>
                        <div className={styles.dateGroupStats}>
                          <span className={styles.statPill}>{group.ordersCount} Bills</span>
                          <span className={styles.statPill}>{group.items.length} Unique Dishes</span>
                          <span className={styles.statPill}>{group.filteredQty} Units Sold</span>
                          <span className={`${styles.statPill} ${styles.statPillPrimary}`}>
                            ₹{group.filteredRevenue.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div style={{ overflowX: 'auto' }}>
                          <table className={styles.recentOrdersTable}>
                            <thead>
                              <tr>
                                <th style={{ width: '44px' }}>#</th>
                                <th>Item / Dish Name</th>
                                <th>Category</th>
                                <th style={{ textAlign: 'center' }}>Qty Sold</th>
                                <th style={{ textAlign: 'right' }}>Unit Price</th>
                                <th style={{ textAlign: 'right' }}>Day Revenue</th>
                                <th>Sold Timings (Kab Bika)</th>
                                <th style={{ textAlign: 'center' }}>History</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((it, idx) => (
                                <tr key={it.name}>
                                  <td style={{ fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
                                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{it.name}</td>
                                  <td>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      background: '#f1f5f9',
                                      color: '#334155'
                                    }}>
                                      {it.category}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 800 }}>
                                    <span style={{
                                      background: '#eff6ff',
                                      color: '#2563eb',
                                      padding: '2px 9px',
                                      borderRadius: '100px',
                                      fontSize: '0.74rem'
                                    }}>
                                      ×{it.qty}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'right', color: '#64748b' }}>₹{it.price}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                    ₹{it.revenue.toLocaleString('en-IN')}
                                  </td>
                                  <td style={{ maxWidth: '280px' }}>
                                    {it.timings.slice(0, 4).map((tm, ti) => (
                                      <span key={ti} className={styles.timeChip}>
                                        {tm.timeStr} (×{tm.qty})
                                      </span>
                                    ))}
                                    {it.timings.length > 4 && (
                                      <span className={styles.timeChip} style={{ background: '#eff6ff', color: '#2563eb' }}>
                                        +{it.timings.length - 4} more
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => openDishHistoryByName(it.name)}
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
                                        gap: '4px'
                                      }}
                                    >
                                      <History size={12} /> Timeline
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW B: CONSOLIDATED ITEM-WISE LEADERBOARD */}
          {itemViewMode === 'leaderboard' && (
            <div className={styles.chartCard}>
              <div className={styles.chartCardHeader}>
                <div>
                  <h3>
                    <Utensils size={17} color="#2563eb" />
                    Consolidated Item-Wise Sales Leaderboard
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Click &ldquo;Timeline&rdquo; on any item to see exact dates, times, and bills when it was sold
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
                <table className={styles.recentOrdersTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Rank</th>
                      <th>Dish / Item Name</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Total Qty Sold</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Total Revenue</th>
                      <th style={{ textAlign: 'right' }}>Share %</th>
                      <th>Last Sold</th>
                      <th style={{ textAlign: 'center' }}>Date/Time Log</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedDishes.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                          No menu items found matching the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      displayedDishes.map((dish, idx) => {
                        const sharePct = totalGrossRevenue > 0 ? ((dish.revenue / totalGrossRevenue) * 100).toFixed(1) : 0;
                        return (
                          <tr key={dish.name}>
                            <td style={{ fontWeight: 800, color: idx < 3 ? '#2563eb' : '#64748b' }}>
                              #{idx + 1}
                            </td>
                            <td style={{ fontWeight: 700, color: '#0f172a' }}>{dish.name}</td>
                            <td>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background: '#f1f5f9',
                                color: '#334155'
                              }}>
                                {dish.category}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 800 }}>
                              <span style={{
                                background: '#eff6ff',
                                color: '#2563eb',
                                padding: '2px 9px',
                                borderRadius: '100px',
                                fontSize: '0.74rem'
                              }}>
                                {dish.count} sold
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', color: '#64748b' }}>₹{dish.price}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              ₹{dish.revenue.toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                              {sharePct}%
                            </td>
                            <td style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {dish.lastSoldAt ? new Date(dish.lastSoldAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedDishHistory(dish)}
                                style={{
                                  padding: '4px 9px',
                                  borderRadius: '6px',
                                  border: '1px solid #bfdbfe',
                                  background: '#eff6ff',
                                  color: '#1d4ed8',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <History size={12} /> {dish.history.length} Sales
                              </button>
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
        </div>
      )}

      {/* ── TAB 3: CATEGORY BREAKDOWN ── */}
      {activeTab === 'categories' && (
        <div>
          <div className={styles.categoriesGrid}>
            {categorySalesList.length === 0 ? (
              <div className={styles.chartCard} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                No category sales data available for this period.
              </div>
            ) : (
              categorySalesList.map(cat => {
                const pct = totalGrossRevenue > 0 ? Math.round((cat.revenue / totalGrossRevenue) * 100) : 0;
                return (
                  <div key={cat.name} className={styles.categoryCard}>
                    <div className={styles.categoryName}>
                      <span>{cat.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#2563eb' }}>{pct}% share</span>
                    </div>
                    <div className={styles.categoryRevenue}>₹{cat.revenue.toLocaleString('en-IN')}</div>
                    <div className={styles.categoryMeta}>{cat.qty} units sold in this period</div>
                    <div className={styles.progressBarContainer}>
                      <div className={styles.progressBar} style={{ width: `${pct}%`, background: '#2563eb' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: HOURLY RUSH & PEAK TRENDS ── */}
      {activeTab === 'hourly' && (
        <div>
          <div className={styles.peakRushBanner}>
            <div>
              <div className={styles.peakRushTitle}>
                <Sparkles size={18} color="#2563eb" />
                Busiest Peak Rush Dining Window
              </div>
              <div className={styles.peakRushSubtitle}>
                Highest customer orders volume occurred during <strong>{peakRushHour.hourLabel}</strong> with <strong>₹{peakRushHour.revenue.toLocaleString('en-IN')}</strong> generated across <strong>{peakRushHour.orders} completed bills</strong>.
              </div>
            </div>
            <div className={styles.peakBadge}>
              🔥 Peak Hour: {peakRushHour.hourLabel}
            </div>
          </div>

          <div className={styles.hourlyChartBox}>
            <div className={styles.chartCardHeader}>
              <h3>
                <Clock size={17} color="#2563eb" />
                Hourly Sales Distribution (08:00 AM - 11:00 PM)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hourly Gross Revenue (INR)</span>
            </div>

            <div className={styles.hourlyBarsWrapper}>
              {hourlyDistribution.map(hd => {
                const heightPct = Math.max(6, Math.round((hd.revenue / maxHourlyRevenue) * 100));
                const isBusiest = hd.revenue === peakRushHour.revenue && hd.revenue > 0;
                const hourFormatted = hd.hour > 12 ? `${hd.hour - 12} PM` : hd.hour === 12 ? '12 PM' : `${hd.hour} AM`;

                return (
                  <div key={hd.hour} className={styles.hourlyBarCol}>
                    <div className={styles.hourlyBarTooltip}>
                      <strong>{hourFormatted}</strong>
                      <span>₹{hd.revenue.toLocaleString('en-IN')}</span>
                      <span>{hd.count} orders</span>
                    </div>
                    <div
                      className={styles.hourlyBarFill}
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: isBusiest ? '#2563eb' : hd.revenue > 0 ? '#93c5fd' : '#e2e8f0'
                      }}
                    />
                    <div className={styles.hourlyBarLabel}>{hourFormatted}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.sessionGrid}>
            {mealSessions.map(sess => {
              const Icon = sess.icon;
              const pct = totalGrossRevenue > 0 ? Math.round((sess.revenue / totalGrossRevenue) * 100) : 0;
              const aov = sess.count > 0 ? Math.round(sess.revenue / sess.count) : 0;

              return (
                <div key={sess.name} className={styles.sessionCard}>
                  <div className={styles.sessionCardHeader}>
                    <div className={styles.sessionTitle}>
                      <Icon size={16} color="#2563eb" />
                      {sess.name}
                    </div>
                    <div className={styles.sessionTime}>{sess.time}</div>
                  </div>
                  <div className={styles.sessionRevenue}>₹{sess.revenue.toLocaleString('en-IN')}</div>
                  <div className={styles.sessionMeta}>
                    {sess.count} orders • AOV ₹{aov} • <strong>{pct}% of period</strong>
                  </div>
                  <div className={styles.progressBarContainer} style={{ marginTop: '8px' }}>
                    <div className={styles.progressBar} style={{ width: `${pct}%`, background: '#2563eb' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 5: DAILY SALES TIMELINE ── */}
      {activeTab === 'daily' && (
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <div>
              <h3>
                <Calendar size={17} color="#2563eb" />
                Day-by-Day Financial Sales Ledger
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Chronological revenue, tax, and tender audit across {dailyTimelineList.length} operating days
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className={styles.recentOrdersTable}>
              <thead>
                <tr>
                  <th>Operating Date</th>
                  <th style={{ textAlign: 'center' }}>Settled Tickets</th>
                  <th style={{ textAlign: 'right' }}>Gross Revenue</th>
                  <th style={{ textAlign: 'right' }}>Net Sales</th>
                  <th style={{ textAlign: 'right' }}>GST Collected</th>
                  <th style={{ textAlign: 'right' }}>Cash Tender</th>
                  <th style={{ textAlign: 'right' }}>Digital (UPI/Card)</th>
                  <th style={{ textAlign: 'right' }}>Avg Ticket (AOV)</th>
                </tr>
              </thead>
              <tbody>
                {dailyTimelineList.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No daily records found for the selected date window.
                    </td>
                  </tr>
                ) : (
                  dailyTimelineList.map(dy => {
                    const aov = dy.count > 0 ? Math.round(dy.gross / dy.count) : 0;
                    return (
                      <tr key={dy.dateKey}>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>
                          {dy.displayDate}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>
                          <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '100px', fontSize: '0.74rem' }}>
                            {dy.count} bills
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          ₹{dy.gross.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', color: '#334155' }}>
                          ₹{Math.round(dy.net).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', color: '#64748b' }}>
                          ₹{dy.tax.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                          ₹{dy.cash.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>
                          ₹{dy.digital.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#7c3aed' }}>
                          ₹{aov}
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

      {/* ── TAB 6: ORDER BILLS LEDGER ── */}
      {activeTab === 'orders' && (
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader} style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3>
                <Receipt size={17} color="#2563eb" />
                Customer Order Bills Ledger & Audit
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Showing {displayedOrders.length} settled orders in selected window
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
                <option value="all">All Tables ({uniqueTables.length})</option>
                {uniqueTables.map(tNum => (
                  <option key={tNum} value={tNum}>Table {tNum}</option>
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
                  <th>Status</th>
                  <th>Items Summary</th>
                  <th>Payment Mode</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Final Amount</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No orders match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayedOrders
                    .slice((reportsPage - 1) * reportsPageSize, reportsPage * reportsPageSize)
                    .map((ord, idx) => {
                      const isVerified = ord.isPhoneVerified || ord.customerDetails?.isPhoneVerified;
                      const orderNum = ord.orderNumber || (ord._id ? ord._id.slice(-6).toUpperCase() : `ORD-${idx + 1}`);
                      const displayAmount = getOrderAmount(ord);

                      return (
                        <tr key={ord._id || idx}>
                          <td style={{ fontWeight: 800, color: '#4f46e5' }}>
                            #{orderNum}
                          </td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            {ord.tableNumber ? `Table ${ord.tableNumber}` : 'Takeaway / POS'}
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                              {ord.source || (ord.tableNumber ? 'Table QR Code' : 'Staff / Waiter')}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{ord.customerName || ord.customerDetails?.name || 'Walk-in Guest'}</div>
                            {(ord.customerPhone || ord.customerDetails?.phone) && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {ord.customerPhone || ord.customerDetails?.phone}
                              </div>
                            )}
                          </td>
                          <td>
                            {isVerified ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700 }}>
                                <CheckCircle2 size={11} /> Verified
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 600 }}>
                                Standard
                              </span>
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
                          <td style={{ textAlign: 'center' }}>
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
                                gap: '4px'
                              }}
                            >
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

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
                    style={{ minWidth: '26px', height: '26px', padding: '0 4px', borderRadius: '6px', border: 'none', background: reportsPage === p ? '#4f46e5' : '#ffffff', color: reportsPage === p ? '#ffffff' : '#475569', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', boxShadow: reportsPage === p ? 'none' : '0 1px 2px rgba(0,0,0,0.05)' }}
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
      )}

      {/* Item Sales Date/Time Drill-Down Modal */}
      <AnimatePresence>
        {selectedDishHistory && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
                maxWidth: '680px',
                width: '100%',
                maxHeight: '88vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={18} color="#2563eb" />
                    {selectedDishHistory.name} — Date & Time Sales Log
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px' }}>
                    Category: <strong>{selectedDishHistory.category}</strong> • Total Sold: <strong>{selectedDishHistory.count} units</strong> • Total Revenue: <strong>₹{selectedDishHistory.revenue.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDishHistory(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ overflowY: 'auto', padding: '16px 20px' }}>
                <table className={styles.recentOrdersTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Order #</th>
                      <th>Table / Guest</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th>Payment</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDishHistory.history.map((h, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{h.displayDate}</td>
                        <td style={{ color: '#2563eb', fontWeight: 700 }}>{h.timeStr}</td>
                        <td style={{ fontWeight: 700, color: '#4f46e5' }}>#{h.orderNum}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{h.tableLabel}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{h.customerName}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800 }}>×{h.qty}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: h.payMethod === 'Cash' ? '#ecfdf5' : '#eff6ff',
                            color: h.payMethod === 'Cash' ? '#059669' : '#2563eb'
                          }}>
                            {h.payMethod}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          ₹{h.lineTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Details & Bill Reprint Modal */}
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
                    {new Date(selectedOrder.createdAt).toLocaleString()} • Table {selectedOrder.tableNumber || 'Takeaway'} ({selectedOrder.orderType || 'Dine-in'})
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
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Verification: </span>
                  <strong style={{ color: (selectedOrder.isPhoneVerified || selectedOrder.customerDetails?.isPhoneVerified) ? '#16a34a' : '#64748b' }}>
                    {(selectedOrder.isPhoneVerified || selectedOrder.customerDetails?.isPhoneVerified) ? 'Verified' : 'Unverified'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Source: </span>
                  <strong>{selectedOrder.source || (selectedOrder.tableNumber ? 'Table QR Code' : 'Staff / Waiter POS')}</strong>
                </div>
              </div>

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
                      const varLabel = it.variant ? (typeof it.variant === 'object' ? it.variant.name : String(it.variant)) : '';
                      const addonsLabel = Array.isArray(it.addons) ? it.addons.map(a => a.name).join(', ') : '';
                      const notes = it.specialNotes || it.notes;
                      const itemPrice = Number(it.price) || 0;
                      const qty = Number(it.quantity) || 1;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 10px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.name || it.item?.name}</div>
                            {varLabel && <div style={{ fontSize: '0.7rem', color: '#4f46e5' }}>Size: {varLabel}</div>}
                            {addonsLabel && <div style={{ fontSize: '0.7rem', color: '#059669' }}>Add-ons: {addonsLabel}</div>}
                            {notes && <div style={{ fontSize: '0.7rem', color: '#ea580c', fontStyle: 'italic' }}>Note: {notes}</div>}
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800 }}>{qty}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{itemPrice}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>₹{itemPrice * qty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ color: '#64748b' }}>Original Bill Subtotal:</span>
                  <span>₹{selectedOrder.subTotal || selectedOrder.total || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ color: '#64748b' }}>Tax / GST:</span>
                  <span>₹{selectedOrder.taxAmount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span style={{ color: '#64748b' }}>Payment Method:</span>
                  <strong>{selectedOrder.paymentMethod || 'Cash'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 0', marginTop: '4px', borderTop: '1px solid #e2e8f0', fontWeight: 900, fontSize: '0.92rem', color: '#0f172a' }}>
                  <span>Final Settled Amount:</span>
                  <span style={{ color: '#2563eb' }}>₹{getOrderAmount(selectedOrder)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Printing customer bill receipt...');
                    printOrderBill(selectedOrder, tenantInfo?.businessName || tenantInfo?.name);
                  }}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)'
                  }}
                >
                  <Printer size={16} /> Reprint Bill Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Day-End Z-Report Cash Reconciliation Modal */}
      <DayCloseZReportModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        allOrders={orders}
        khataRecords={khataRecords}
        tenantInfo={tenantInfo}
        categoriesData={categorySalesList}
      />

      {/* Executive PDF & Strategic AI Report Modal */}
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
