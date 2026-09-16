import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit3, LayoutDashboard, ShoppingBag, QrCode, BarChart3, X, LogOut, Loader, TrendingUp, IndianRupee,
  UtensilsCrossed, Coffee, Pizza, Sandwich, IceCream, GlassWater, Martini, Cake, Soup, Cookie, Grid,
  ChefHat, Truck, UserCheck, Share2, Sparkles, Upload, ImagePlus, ImageIcon, Settings, Bell, HelpCircle,
  TrendingDown, CheckSquare, Square, Download, Filter, Star, Clock, Check, ArrowUpRight, Flame, Layers,
  ChevronRight, ChevronLeft, RefreshCw, Smartphone, CreditCard, Calendar, Percent, DollarSign, AlertTriangle, CheckCircle2,
  Activity, Zap, Eye, ArrowRight, ShieldCheck, Award, Users, Receipt, PieChart, Minus
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeComponent from './QRCodeComponent';
import TableOperationsHub from './TableOperationsHub';
import POSTerminal from './petpooja/POSTerminal';
import KOTMonitor from './petpooja/KOTMonitor';
import CRMLoyalty from './petpooja/CRMLoyalty';
import OnlineAggregators from './petpooja/OnlineAggregators';
import RestaurantSettings from './RestaurantSettings';
import styles from './AdminPanel.module.css';
import BrandLogo from './BrandLogo';
import { API_URL as API } from '../config/api';

// Standard Categories with Icons
const standardCategories = [
  { id: "all", name: "All Items", icon: "UtensilsCrossed", Component: UtensilsCrossed },
  { id: "combos", name: "Combos & Offers", aliases: ['combos', 'combo', 'offers', 'offer', 'deal', 'deals', 'special'], icon: "Sparkles", Component: Sparkles },
  { id: "main-courses", name: "Main Courses", aliases: ['main-courses', 'main_courses', 'main-course', 'main_course', 'mains', 'main', 'pasta', 'curry', 'rice', 'entree', 'food'], icon: "UtensilsCrossed", Component: UtensilsCrossed },
  { id: "appetizers", name: "Appetizers", aliases: ['appetizer', 'appetizers', 'starter', 'starters', 'snack', 'snacks', 'salad', 'salads'], icon: "Cookie", Component: Cookie },
  { id: "desserts", name: "Desserts", aliases: ['dessert', 'desserts', 'sweet', 'sweets', 'cake', 'ice_cream', 'pastry'], icon: "Cake", Component: Cake },
  { id: "beverages", name: "Beverages", aliases: ['beverage', 'beverages', 'drink', 'drinks', 'mocktail', 'cocktail', 'cold drink', 'shake', 'beverage/drinks'], icon: "GlassWater", Component: GlassWater },
  { id: "burger", name: "Burgers & Sandwiches", aliases: ['burger', 'burgers', 'sandwich', 'sandwiches', 'wrap', 'wraps'], icon: "Sandwich", Component: Sandwich },
  { id: "pizza", name: "Artisan Pizza", aliases: ['pizza', 'pizzas'], icon: "Pizza", Component: Pizza },
  { id: "coffee", name: "Specialty Coffee", aliases: ['coffee', 'hot coffee', 'cold brew', 'latte', 'espresso', 'cappuccino', 'tea'], icon: "Coffee", Component: Coffee },
];

const itemMatchesCategory = (item, catId) => {
  if (catId === 'all') return true;
  const itemCat = (item.category || '').toLowerCase().trim();
  const catObj = standardCategories.find(c => c.id === catId);
  if (catObj && catObj.aliases) {
    return catObj.aliases.some(a => itemCat.includes(a) || a.includes(itemCat));
  }
  return itemCat === catId.toLowerCase();
};

export const getValidFoodImage = (item) => {
  const img = item?.image;
  if (img && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/uploads') || img.startsWith('data:image'))) {
    return img;
  }
  if (item?.name) {
    return `https://image.pollinations.ai/prompt/gourmet%20dish%20of%20${encodeURIComponent(item.name)}%20restaurant%20plating?width=600&height=400&nologo=true`;
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';
};

export default function AdminPanel() {
  const { user, tenantId, socket, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dashboard Date Filter State
  const [dateRange, setDateRange] = useState('today'); // 'today', 'this_week', 'this_month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleCustomStartDateChange = (val) => {
    if (val > todayStr) {
      toast.error('Future dates cannot be selected. Please select a past or current date.');
      return;
    }
    setCustomStartDate(val);
    if (customEndDate && customEndDate < val) {
      setCustomEndDate(val);
    }
  };

  const handleCustomEndDateChange = (val) => {
    if (val > todayStr) {
      toast.error('Future dates cannot be selected. Please select a past or current date.');
      return;
    }
    if (customStartDate && val < customStartDate) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }
    setCustomEndDate(val);
  };

  // Menu Management State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingDish, setIsSavingDish] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drawer Form State
  const [drawerForm, setDrawerForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main-courses',
    isVeg: true,
    available: true,
    hasDiscount: false,
    discountType: 'percentage', // 'percentage' or 'amount'
    discountValue: '',
    image: '',
    imageFile: null
  });

  const fileInputRef = useRef(null);

  // Fetch Menu Items from API
  const fetchMenu = async () => {
    try {
      const res = await axios.get(`${API}/menu${tenantId ? `?tenantId=${tenantId}&includeUnavailable=true` : '?includeUnavailable=true'}`);
      if (res.data && Array.isArray(res.data)) {
        const enriched = res.data.map(d => ({
          ...d,
          price: Number(d.price) || 0,
          category: d.category || 'main-courses',
          prepTime: d.prepTime || '15-20 min',
          rating: d.rating || 4.8,
          available: d.isAvailable !== undefined ? d.isAvailable : (d.available !== undefined ? d.available : true),
          isVeg: d.isVeg !== undefined ? d.isVeg : true,
          discount: d.discount || { isDiscounted: false, type: 'percentage', value: 0 }
        }));
        setItems(enriched);
      }
    } catch (err) {
      console.log('Fetch menu error:', err.message);
    }
  };

  // Fetch Orders from API based on dateRange
  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsFilterLoading(true);

    try {
      let url = `${API}/orders?range=${dateRange}`;
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const res = await axios.get(url, { headers: { 'x-auth-token': token } });
      if (res.data && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      console.log('Orders fetch error:', err.message);
    } finally {
      setTimeout(() => {
        setIsFilterLoading(false);
      }, 350);
    }
  };

  // Real Tables State from Database
  const [tables, setTables] = useState([]);
  const [tableFilterTab, setTableFilterTab] = useState('all'); // 'all', 'available', 'occupied', 'bill'
  const [selectedTableModal, setSelectedTableModal] = useState(null);
  const [isSettlingTable, setIsSettlingTable] = useState(false);

  // Fetch Tables from API
  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/tables`, {
        headers: { 'x-auth-token': token }
      });
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTables(res.data);
      } else {
        setTables([
          { _id: 't1', tableNumber: '1', seatingCapacity: 4, status: 'available' },
          { _id: 't2', tableNumber: '2', seatingCapacity: 4, status: 'available' },
          { _id: 't3', tableNumber: '3', seatingCapacity: 4, status: 'available' },
          { _id: 't4', tableNumber: '4', seatingCapacity: 4, status: 'available' }
        ]);
      }
    } catch (err) {
      console.log('Error fetching tables:', err.message);
      if (tables.length === 0) {
        setTables([
          { _id: 't1', tableNumber: '1', seatingCapacity: 4, status: 'available' },
          { _id: 't2', tableNumber: '2', seatingCapacity: 4, status: 'available' },
          { _id: 't3', tableNumber: '3', seatingCapacity: 4, status: 'available' },
          { _id: 't4', tableNumber: '4', seatingCapacity: 4, status: 'available' }
        ]);
      }
    }
  };

  const getActiveOrderForTable = useCallback((tbl) => {
    const rawNum = String(tbl.tableNumber || '').trim().toLowerCase();
    const numOnly = rawNum.replace(/[^0-9]/g, '');
    return orders.find(o => {
      if (o.status === 'completed' || o.status === 'cancelled') return false;
      const orderTbl = String(o.tableNumber || o.table || '').trim().toLowerCase();
      const orderNumOnly = orderTbl.replace(/[^0-9]/g, '');
      return orderTbl === rawNum || (numOnly && orderNumOnly && numOnly === orderNumOnly) || orderTbl === `table ${numOnly}`;
    });
  }, [orders]);

  const handleSettleTable = async (tableNumber) => {
    if (!tableNumber) return;
    setIsSettlingTable(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/orders/table/${encodeURIComponent(tableNumber)}/settle`, {
        paymentMethod: 'cash',
        paymentStatus: 'paid'
      }, {
        headers: { 'x-auth-token': token }
      });
      toast.success(`Table ${tableNumber} settled & marked available!`);
      setSelectedTableModal(null);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to settle table: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSettlingTable(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/orders/${orderId}/status`, { status: newStatus }, {
        headers: { 'x-auth-token': token }
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Order status updated to ${newStatus}`);
      if (selectedTableModal && selectedTableModal.activeOrder?._id === orderId) {
        setSelectedTableModal(prev => ({
          ...prev,
          activeOrder: { ...prev.activeOrder, status: newStatus }
        }));
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAddTableFromHub = async (tableData) => {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${API}/tables`, tableData, {
      headers: { 'x-auth-token': token }
    });
    setTables(prev => [...prev, res.data]);
  };

  const handleDeleteTableFromHub = async (tableId) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/tables/${tableId}`, {
        headers: { 'x-auth-token': token }
      });
      setTables(prev => prev.filter(t => t._id !== tableId && t.tableNumber !== tableId));
      toast.success("Table deleted successfully");
    } catch (err) {
      toast.error("Failed to delete table");
    }
  };

  useEffect(() => {
    // Fetch Tenant Info
    if (tenantId) {
      axios.get(`${API}/tenants/public/${tenantId}`)
        .then((res) => setTenantInfo(res.data))
        .catch((err) => console.log('Tenant info fetch error:', err));
    }

    fetchMenu();
    fetchOrders();
    fetchTables();

    // Live Sockets
    if (socket) {
      socket.on('newOrder', (newOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
        toast.success(`New order received: #${newOrder.orderNumber || newOrder._id?.slice(-4)}`);
        fetchTables();
      });
      socket.on('orderUpdate', (updatedOrder) => {
        setOrders((prev) => prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)));
      });
    }

    return () => {
      if (socket) {
        socket.off('newOrder');
        socket.off('orderUpdate');
      }
    };
  }, [user, tenantId, socket, dateRange, customStartDate, customEndDate]);

  // Daily Performance Checklist State
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Morning Station & Inventory Sync', time: '08:00 AM', done: true, overdue: false, category: 'Opening' },
    { id: 2, text: 'Staff Shift Handover & KDS Calibration', time: '02:00 PM', done: false, overdue: false, category: 'Shift' },
    { id: 3, text: 'Review Daily P&L & Recipe Depletions', time: '10:00 PM', done: false, overdue: false, category: 'Closing' }
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [chartMetricTab, setChartMetricTab] = useState('revenue'); // 'revenue' or 'orders'

  // Clock ticker for live relative time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Metric Calculations based on real filtered orders & real time buckets
  const metrics = useMemo(() => {
    const grossSales = orders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0);
    const totalOrdersCount = orders.length;
    const avgTicket = totalOrdersCount > 0 ? Math.round(grossSales / totalOrdersCount) : 0;
    const netProfit = Math.round(grossSales * 0.42);
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const completedOrders = orders.filter(o => o.status === 'completed');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');

    // 6 Dynamic Time Buckets for Velocity Telemetry
    const timeBuckets = [
      { label: '08:00 AM', startH: 0, endH: 9, revenue: 0, orders: 0 },
      { label: '11:00 AM', startH: 10, endH: 12, revenue: 0, orders: 0 },
      { label: '02:00 PM', startH: 13, endH: 15, revenue: 0, orders: 0 },
      { label: '05:00 PM', startH: 16, endH: 18, revenue: 0, orders: 0 },
      { label: '08:00 PM', startH: 19, endH: 21, revenue: 0, orders: 0 },
      { label: '11:00 PM', startH: 22, endH: 23, revenue: 0, orders: 0 }
    ];

    orders.forEach(o => {
      const d = o.createdAt ? new Date(o.createdAt) : new Date();
      const hour = d.getHours();
      const amt = Number(o.total || o.totalAmount) || 0;
      const b = timeBuckets.find(bucket => hour >= bucket.startH && hour <= bucket.endH) || timeBuckets[timeBuckets.length - 1];
      b.revenue += amt;
      b.orders += 1;
    });

    const maxBucketRev = Math.max(1, ...timeBuckets.map(b => b.revenue));
    const maxBucketOrd = Math.max(1, ...timeBuckets.map(b => b.orders));

    // Dynamic telemetry SVG points for 700x185 canvas
    const xCoords = [30, 150, 270, 390, 510, 670];
    const revPoints = timeBuckets.map((b, idx) => {
      const y = grossSales > 0 ? Math.round(155 - (b.revenue / maxBucketRev) * 115) : 155;
      return { x: xCoords[idx], y, val: b.revenue };
    });

    const ordPoints = timeBuckets.map((b, idx) => {
      const y = totalOrdersCount > 0 ? Math.round(155 - (b.orders / maxBucketOrd) * 115) : 155;
      return { x: xCoords[idx], y, val: b.orders };
    });

    // Helper to generate SVG smooth path from points
    const makeSvgPath = (pts) => {
      if (pts.length === 0) return '';
      let path = `M ${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const midX = (prev.x + curr.x) / 2;
        path += ` C ${midX},${prev.y} ${midX},${curr.y} ${curr.x},${curr.y}`;
      }
      return path;
    };

    const revPath = makeSvgPath(revPoints);
    const revAreaPath = `${revPath} L 670,170 L 30,170 Z`;

    const ordPath = makeSvgPath(ordPoints);
    const ordAreaPath = `${ordPath} L 670,170 L 30,170 Z`;

    // Dynamic Mini Sparklines for KPI Cards (viewBox 0 0 80 26)
    const makeMiniSparkline = (vals, color) => {
      const maxVal = Math.max(1, ...vals);
      const pts = [
        { x: 0, y: Math.round(22 - ((vals[0] || 0) / maxVal) * 18) },
        { x: 26, y: Math.round(22 - ((vals[1] || 0) / maxVal) * 18) },
        { x: 54, y: Math.round(22 - ((vals[3] || 0) / maxVal) * 18) },
        { x: 80, y: Math.round(22 - ((vals[5] || 0) / maxVal) * 18) }
      ];
      return `M 0,${pts[0].y} Q 26,${pts[1].y} 54,${pts[2].y} T 80,${pts[3].y}`;
    };

    const revSparkline = makeMiniSparkline(timeBuckets.map(b => b.revenue), '#10b981');
    const profitSparkline = makeMiniSparkline(timeBuckets.map(b => b.revenue * 0.42), '#6366f1');
    const ticketSparkline = makeMiniSparkline(timeBuckets.map(b => (b.orders > 0 ? b.revenue / b.orders : 0)), '#d97706');
    const orderSparkline = makeMiniSparkline(timeBuckets.map(b => b.orders), '#0284c7');

    // Top Selling Items breakdown dynamically from orders
    const itemMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        const name = it.name || it.item?.name || 'Special Dish';
        const qty = it.quantity || 1;
        const price = Number(it.price) || (Number(it.item?.price) || 0);
        if (!itemMap[name]) {
          itemMap[name] = { name, count: 0, revenue: 0 };
        }
        itemMap[name].count += qty;
        itemMap[name].revenue += (qty * price);
      });
    });

    let topSellingItems = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    if (topSellingItems.length === 0 && items.length > 0) {
      topSellingItems = items.slice(0, 4).map((it) => ({
        name: it.name,
        count: 0,
        revenue: 0
      }));
    }

    const topItemName = topSellingItems[0]?.name || (items[0]?.name || 'Live Menu');

    // Dynamic Category Distribution from orders & menu
    const catMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        const cat = it.category || it.item?.category || 'Main Courses';
        const amt = (it.quantity || 1) * (Number(it.price) || Number(it.item?.price) || 0);
        catMap[cat] = (catMap[cat] || 0) + amt;
      });
    });

    const totalCatRev = Object.values(catMap).reduce((s, v) => s + v, 0);
    const catColors = ['#6366f1', '#059669', '#d97706', '#0284c7', '#ec4899'];
    let catList = Object.entries(catMap).map(([name, rev], idx) => ({
      name,
      percent: totalCatRev > 0 ? Math.round((rev / totalCatRev) * 100) : 0,
      color: catColors[idx % catColors.length]
    }));

    if (catList.length === 0) {
      catList = [
        { name: 'Main Courses', percent: 0, color: '#6366f1' },
        { name: 'Beverages', percent: 0, color: '#059669' },
        { name: 'Desserts', percent: 0, color: '#d97706' },
        { name: 'Starters', percent: 0, color: '#0284c7' }
      ];
    }

    return {
      grossSales,
      totalOrdersCount,
      avgTicket,
      netProfit,
      activeOrders,
      completedOrders,
      cancelledOrders,
      timeBuckets,
      revPoints,
      ordPoints,
      revPath,
      revAreaPath,
      ordPath,
      ordAreaPath,
      revSparkline,
      profitSparkline,
      ticketSparkline,
      orderSparkline,
      topItemName,
      topSellingItems,
      catList
    };
  }, [orders, items]);

  // Drawer Handlers
  const handleOpenAddDrawer = () => {
    setEditingItem(null);
    setDrawerForm({
      name: '',
      description: '',
      price: '',
      category: selectedCategory === 'all' ? 'main-courses' : selectedCategory,
      isVeg: true,
      available: true,
      hasDiscount: false,
      discountType: 'percentage',
      discountValue: '',
      image: '',
      imageFile: null
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (item) => {
    setEditingItem(item);
    const discount = item.discount || {};
    setDrawerForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price || ''),
      category: item.category || 'main-courses',
      isVeg: item.isVeg !== undefined ? item.isVeg : true,
      available: item.available !== undefined ? item.available : true,
      hasDiscount: Boolean(discount.isDiscounted),
      discountType: discount.type || 'percentage',
      discountValue: discount.value ? String(discount.value) : '',
      image: item.image || '',
      imageFile: null
    });
    setIsDrawerOpen(true);
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setDrawerForm(prev => ({
      ...prev,
      image: previewUrl,
      imageFile: file
    }));
  };

  const handleRemoveImage = () => {
    setDrawerForm(prev => ({
      ...prev,
      image: '',
      imageFile: null
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveDrawerItem = async (e) => {
    e.preventDefault();
    if (!drawerForm.name.trim() || !drawerForm.price) {
      toast.error('Please provide item name and price');
      return;
    }

    const numPrice = Number(drawerForm.price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Please enter a valid price (non-negative number)');
      return;
    }

    // Discount validation
    let discountPayload = { isDiscounted: false, type: 'percentage', value: 0 };
    if (drawerForm.hasDiscount) {
      const numDiscount = Number(drawerForm.discountValue);
      if (isNaN(numDiscount) || numDiscount <= 0) {
        toast.error('Please enter a valid discount value greater than 0');
        return;
      }
      if (drawerForm.discountType === 'percentage' && numDiscount >= 100) {
        toast.error('Percentage discount must be less than 100%');
        return;
      }
      if (drawerForm.discountType === 'amount' && numDiscount >= numPrice) {
        toast.error(`Discount amount (₹${numDiscount}) must be strictly less than the original price (₹${numPrice})`);
        return;
      }
      discountPayload = {
        isDiscounted: true,
        type: drawerForm.discountType,
        value: numDiscount
      };
    }

    setIsSavingDish(true);
    const token = localStorage.getItem('token');

    try {
      const formData = new FormData();
      formData.append('name', drawerForm.name.trim());
      formData.append('description', drawerForm.description.trim());
      formData.append('price', numPrice);
      formData.append('category', drawerForm.category);
      formData.append('isVeg', drawerForm.isVeg);
      formData.append('isAvailable', drawerForm.available);
      formData.append('discount', JSON.stringify(discountPayload));

      if (drawerForm.imageFile) {
        formData.append('image', drawerForm.imageFile);
      } else if (drawerForm.image && !drawerForm.image.startsWith('blob:')) {
        formData.append('image', drawerForm.image);
      }

      if (editingItem && editingItem._id && !editingItem._id.startsWith('dish_')) {
        // Edit existing in backend
        const res = await axios.put(`${API}/menu/${editingItem._id}`, formData, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success(`Updated "${drawerForm.name}"`);
      } else {
        // Add new in backend
        const res = await axios.post(`${API}/menu`, formData, {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success(`Added "${drawerForm.name}" to menu!`);
      }

      await fetchMenu();
      setIsDrawerOpen(false);
    } catch (err) {
      console.error('Save menu item error:', err);
      // Local fallback if API fails
      const fallbackItem = {
        _id: editingItem ? editingItem._id : `dish_${Date.now()}`,
        name: drawerForm.name.trim(),
        description: drawerForm.description.trim(),
        price: numPrice,
        category: drawerForm.category,
        isVeg: drawerForm.isVeg,
        available: drawerForm.available,
        discount: discountPayload,
        image: drawerForm.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'
      };
      if (editingItem) {
        setItems(prev => prev.map(it => it._id === editingItem._id ? fallbackItem : it));
      } else {
        setItems(prev => [fallbackItem, ...prev]);
      }
      toast.success(`Saved "${drawerForm.name}"`);
      setIsDrawerOpen(false);
    } finally {
      setIsSavingDish(false);
    }
  };

  const handleToggleItemAvailability = async (item) => {
    const nextState = !item.available;
    const token = localStorage.getItem('token');

    setItems(prev => prev.map(it => it._id === item._id ? { ...it, available: nextState } : it));
    toast.success(nextState ? `"${item.name}" marked In Stock` : `"${item.name}" marked Out of Stock`);

    if (token && item._id && !item._id.startsWith('dish_')) {
      try {
        await axios.put(`${API}/menu/${item._id}`, { isAvailable: nextState }, {
          headers: { 'x-auth-token': token }
        });
      } catch (err) {
        console.log('Update stock state error:', err.message);
      }
    }
  };

  const confirmDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    setIsDeleting(true);
    const token = localStorage.getItem('token');

    try {
      if (token && deleteConfirmItem._id && !deleteConfirmItem._id.startsWith('dish_')) {
        await axios.delete(`${API}/menu/${deleteConfirmItem._id}`, {
          headers: { 'x-auth-token': token }
        });
      }
      setItems(prev => prev.filter(it => it._id !== deleteConfirmItem._id));
      setSelectedItemIds(prev => prev.filter(id => id !== deleteConfirmItem._id));
      toast.success(`"${deleteConfirmItem.name}" deleted successfully`);
    } catch (err) {
      console.error('Delete item error:', err);
      toast.error('Failed to delete item from server');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmItem(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedItemIds.length} selected dishes?`)) return;

    const token = localStorage.getItem('token');
    for (const id of selectedItemIds) {
      if (token && !id.startsWith('dish_')) {
        try {
          await axios.delete(`${API}/menu/${id}`, { headers: { 'x-auth-token': token } });
        } catch (e) { }
      }
    }

    setItems(prev => prev.filter(it => !selectedItemIds.includes(it._id)));
    setSelectedItemIds([]);
    toast.success('Selected dishes deleted');
  };

  const handleToggleSelectItem = (itemId) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleStatusUpdate = async (orderId, status, estimatedTime) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = { status };
        if (estimatedTime) payload.estimatedTime = Number(estimatedTime);
        await axios.put(`${API}/orders/${orderId}/status`, payload, { headers: { 'x-auth-token': token } });
      }
    } catch (err) {
      console.log('Update status on server failed, updating local state:', err.message);
    }
    setOrders(prev => prev.map(o => o._id === orderId ? {
      ...o,
      status,
      ...(estimatedTime ? { estimatedTime: Number(estimatedTime) } : {})
    } : o));
    toast.success(`Order status updated to ${status.toUpperCase()}${estimatedTime ? ` (${estimatedTime} min prep)` : ''}`);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.delete(`${API}/orders/${orderId}`, { headers: { 'x-auth-token': token } });
      }
    } catch (err) {
      console.log('Delete order on server failed, updating local state:', err.message);
    }
    setOrders(prev => prev.filter(o => o._id !== orderId));
    toast.success('Order deleted');
  };

  const handleToggleChecklist = (id) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, done: !item.done, overdue: false } : item
    ));
  };

  const handleAddChecklistItem = (e) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    const newItem = {
      id: Date.now(),
      text: newChecklistText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      done: false,
      overdue: false
    };
    setChecklist(prev => [...prev, newItem]);
    setNewChecklistText('');
    toast.success('Task added to checklist');
  };

  // Filtered menu items with robust search
  const filteredMenuItems = items.filter(item => {
    const matchesCat = itemMatchesCategory(item, selectedCategory);
    const searchLower = menuSearchQuery.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      item.name.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower));
    return matchesCat && matchesSearch;
  }).sort((a, b) => {
    if (sortOption === 'low-to-high') return a.price - b.price;
    if (sortOption === 'high-to-low') return b.price - a.price;
    return 0;
  });

  const handleSaveTenantSettings = async (updatedSettings) => {
    const token = localStorage.getItem('token');
    try {
      if (token && (tenantId || tenantInfo?._id)) {
        const idToUpdate = tenantId || tenantInfo?._id;
        await axios.put(`${API}/tenants/${idToUpdate}`, updatedSettings, {
          headers: { 'x-auth-token': token }
        });
      }
    } catch (err) {
      console.log('API update tenant settings error:', err.message);
    }
    setTenantInfo(prev => ({
      ...prev,
      ...updatedSettings,
      name: updatedSettings.name || updatedSettings.restaurantName || prev?.name,
      logo: updatedSettings.logo || prev?.logo,
      address: updatedSettings.address || updatedSettings.storeAddress || prev?.address,
      phone: updatedSettings.phone || updatedSettings.primaryPhone || prev?.phone,
      email: updatedSettings.email || updatedSettings.publicEmail || prev?.email,
      gstNumber: updatedSettings.gstNumber || prev?.gstNumber,
    }));
    toast.success('Restaurant configuration saved successfully!');
  };

  const restaurantDisplayName = tenantInfo?.name || user?.restaurantName || tenantInfo?.restaurantName || "Deepak's Restaurant";
  const restaurantLogo = tenantInfo?.logo || user?.restaurantLogo || tenantInfo?.logoUrl || null;
  const restaurantInitials = restaurantDisplayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const ownerName = tenantInfo?.ownerName || user?.name || "Deepak";
  const ownerAvatar = tenantInfo?.ownerImage || user?.avatar || user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100";

  return (
    <div className={styles.adminLayout}>
      <Toaster position="top-right" />

      {/* TOP GLOBAL BAR */}
      <header className={styles.topGlobalBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.brandTitleWrap} onClick={() => navigate('/')}>
            {restaurantLogo ? (
              <img src={restaurantLogo} alt="Restaurant Logo" className={styles.tenantLogoImg} />
            ) : (
              <div className={styles.brandIconSquare}>{restaurantInitials || 'SQ'}</div>
            )}
            <div>
              <span className={styles.brandTitle}>{restaurantDisplayName}</span>
              <span className={styles.brandSub}>SERVIQ OS</span>
            </div>
          </div>
        </div>

        {/* Global Search Input */}
        <div className={styles.topSearchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search dishes, orders, or tables..."
            className={styles.topSearchInput}
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
          />
          {menuSearchQuery && (
            <button
              type="button"
              onClick={() => setMenuSearchQuery('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right User Actions */}
        <div className={styles.topBarRight}>
          <button
            type="button"
            className={styles.iconCircleBtn}
            title="Notifications"
            onClick={() => toast.success(`SERVIQ active • ${metrics.activeOrders.length} live orders in queue`)}
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            className={styles.supportBtn}
            onClick={() => window.open('https://wa.me/919680132562?text=Hello%20SERVIQ%20Support', '_blank')}
          >
            <HelpCircle size={16} /> <span>Support</span>
          </button>
          <div className={styles.profileBadge}>
            <img
              src={ownerAvatar}
              alt="Owner Avatar"
              className={styles.profileAvatar}
            />
            <div className={styles.profileText}>
              <span className={styles.profileName}>{ownerName}</span>
              <span className={styles.profileRole}>RESTAURANT OWNER</span>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.mainContainer}>

        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
          <div className={styles.navSection}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px 4px' }}>
              {!sidebarCollapsed && <span className={styles.navLabel}>MAIN MENU</span>}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>

            <button
              className={`${styles.navLink} ${activeTab === 'dashboard' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('dashboard')}
              title="Dashboard"
            >
              <LayoutDashboard size={18} /> {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'tables_hub' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('tables_hub')}
              title="Tables & Floor Operations Hub"
            >
              <Grid size={18} /> {!sidebarCollapsed && <span>Tables & Floor Hub</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'kds' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('kds')}
              title="Live Orders & KDS"
            >
              <ChefHat size={18} /> {!sidebarCollapsed && <span>Live Orders & KDS</span>}
              {!sidebarCollapsed && <span className={styles.navPill}>{metrics.activeOrders.length}</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'menu' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('menu')}
              title="Menu Management"
            >
              <UtensilsCrossed size={18} /> {!sidebarCollapsed && <span>Menu Management</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'pos' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('pos')}
              title="POS Terminal"
            >
              <IndianRupee size={18} /> {!sidebarCollapsed && <span>POS Terminal</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'qrcodes' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('qrcodes')}
              title="Table QR Codes"
            >
              <QrCode size={18} /> {!sidebarCollapsed && <span>Table QR Codes</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'settings' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('settings')}
              title="Settings"
            >
              <Settings size={18} /> {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </div>

          <div className={styles.sidebarFooter}>

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={() => logout()}
              title="Sign Out"
            >
              <LogOut size={16} /> {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <main className={styles.mainContent}>
          <AnimatePresence mode="wait">

            {/* ========================================================= */}
            {/* 1. ULTRA-MODERN LUXURY DASHBOARD VIEW                     */}
            {/* ========================================================= */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={styles.dashboardView}
              >
                {/* 1. CONTROL BAR: DATE FILTER PILLS */}
                <div className={styles.dashControlBar}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Performance Overview</h3>
                      {isFilterLoading && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#eef2ff',
                          color: '#4f46e5',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          <RefreshCw size={11} className={styles.spinIcon} /> Updating...
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '2px 0 0 0' }}>Showing metrics for {dateRange.replace('_', ' ')}</p>
                  </div>

                  <div className={styles.datePillsWrap}>
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'this_week', label: 'This Week' },
                      { id: 'this_month', label: 'This Month' },
                      { id: 'all', label: 'All Time' },
                      { id: 'custom', label: 'Custom' }
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          if (dateRange !== r.id) {
                            setDateRange(r.id);
                          }
                        }}
                        className={`${styles.datePillBtn} ${dateRange === r.id ? styles.datePillBtnActive : ''}`}
                      >
                        {dateRange === r.id && isFilterLoading && (
                          <RefreshCw size={11} className={styles.spinIcon} />
                        )}
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range Picker */}
                {dateRange === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}
                  >
                    <Calendar size={16} color="#64748b" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>From:</span>
                    <input
                      type="date"
                      max={todayStr}
                      value={customStartDate}
                      onChange={(e) => handleCustomStartDateChange(e.target.value)}
                      style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>To:</span>
                    <input
                      type="date"
                      min={customStartDate || undefined}
                      max={todayStr}
                      value={customEndDate}
                      onChange={(e) => handleCustomEndDateChange(e.target.value)}
                      style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={fetchOrders}
                      style={{ padding: '5px 14px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Apply Filter
                    </button>
                  </motion.div>
                )}

                {/* 3-DAY EXPIRY & DEACTIVATION ALERT BANNER */}
                {(() => {
                  const sub = tenantInfo?.subscription;
                  if (!sub) return null;
                  const now = new Date();
                  const endDate = sub.endDate ? new Date(sub.endDate) : null;
                  const daysLeft = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;
                  const isExpiring3Days = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && sub.isActive;
                  const isExpired = endDate && endDate < now;

                  if (!sub.isActive || isExpired || isExpiring3Days) {
                    return (
                      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '12px 18px', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10, color: '#92400e', fontSize: '13px', fontWeight: 700 }}>
                        <AlertTriangle size={20} color="#d97706" />
                        <span>
                          {!sub.isActive || isExpired
                            ? `⚠️ Subscription Alert: Your cafe subscription plan is currently ${!sub.isActive ? 'deactivated' : 'expired'}. Please contact SuperAdmin to renew your plan.`
                            : `⚠️ Subscription Alert: Your subscription plan will expire in ${daysLeft} day(s) (on ${endDate ? endDate.toLocaleDateString('en-IN') : ''}). Please contact SuperAdmin support to renew.`}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* 5. 4 LUXURY DYNAMIC KPI METRIC CARDS */}
                <div className={styles.kpiGridModern}>
                  {/* Card 1: Gross Revenue */}
                  <div className={`${styles.kpiCardModern} ${styles.kpiCardEmerald}`}>
                    <div className={styles.kpiTopRow}>
                      <div className={`${styles.kpiIconBox} ${styles.kpiIconEmerald}`}>
                        <IndianRupee size={22} />
                      </div>
                      <span className={`${styles.kpiPillBadge} ${metrics.grossSales > 0 ? styles.kpiPillPositive : styles.kpiPillNeutral}`}>
                        {metrics.grossSales > 0 ? (
                          <>
                            <ArrowUpRight size={13} /> Active
                          </>
                        ) : (
                          '● Live Sales'
                        )}
                      </span>
                    </div>
                    <div className={styles.kpiTitleGroup}>
                      <span className={styles.kpiCardTag}>Gross Revenue</span>
                      <div className={styles.kpiBigNum}>
                        {isFilterLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: '32px' }}>
                            <Loader size={20} className={styles.spinIcon} color="#059669" />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Loading...</span>
                          </div>
                        ) : (
                          `₹${Math.round(metrics.grossSales || 0).toLocaleString('en-IN')}`
                        )}
                      </div>
                    </div>
                    <div className={styles.kpiFooterMeta}>
                      <span>{isFilterLoading ? 'Refreshing orders...' : `${metrics.completedOrders.length} settled orders`}</span>
                      {isFilterLoading ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }}>
                          <Loader size={12} className={styles.spinIcon} />
                        </div>
                      ) : metrics.grossSales > 0 ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0'
                        }} title="Positive Trend">
                          <TrendingUp size={13} strokeWidth={2.5} />
                        </div>
                      ) : metrics.grossSales < 0 ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca'
                        }} title="Negative Trend">
                          <TrendingDown size={13} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }} title="Neutral / Live Telemetry">
                          <Activity size={13} strokeWidth={2.2} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Estimated Net Profit */}
                  <div className={`${styles.kpiCardModern} ${styles.kpiCardIndigo}`}>
                    <div className={styles.kpiTopRow}>
                      <div className={`${styles.kpiIconBox} ${styles.kpiIconIndigo}`}>
                        <TrendingUp size={22} />
                      </div>
                      <span className={`${styles.kpiPillBadge} ${styles.kpiPillPositive}`}>
                        <Percent size={12} /> 42% Net
                      </span>
                    </div>
                    <div className={styles.kpiTitleGroup}>
                      <span className={styles.kpiCardTag}>Estimated Profit (42%)</span>
                      <div className={styles.kpiBigNum}>
                        {isFilterLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: '32px' }}>
                            <Loader size={20} className={styles.spinIcon} color="#4f46e5" />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Loading...</span>
                          </div>
                        ) : (
                          `₹${Math.round(metrics.netProfit || 0).toLocaleString('en-IN')}`
                        )}
                      </div>
                    </div>
                    <div className={styles.kpiFooterMeta}>
                      <span>{isFilterLoading ? 'Recalculating margin...' : 'Estimated cafe margin'}</span>
                      {isFilterLoading ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }}>
                          <Loader size={12} className={styles.spinIcon} />
                        </div>
                      ) : metrics.netProfit > 0 ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#eef2ff',
                          color: '#4f46e5',
                          border: '1px solid #c7d2fe'
                        }} title="Positive Margin">
                          <TrendingUp size={13} strokeWidth={2.5} />
                        </div>
                      ) : metrics.netProfit < 0 ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca'
                        }} title="Negative Margin">
                          <TrendingDown size={13} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }} title="Neutral / Live Telemetry">
                          <Activity size={13} strokeWidth={2.2} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Avg Ticket Value */}
                  <div className={`${styles.kpiCardModern} ${styles.kpiCardAmber}`}>
                    <div className={styles.kpiTopRow}>
                      <div className={`${styles.kpiIconBox} ${styles.kpiIconAmber}`}>
                        <Receipt size={22} />
                      </div>
                      <span className={`${styles.kpiPillBadge} ${styles.kpiPillNeutral}`}>
                        {metrics.totalOrdersCount} Tabs
                      </span>
                    </div>
                    <div className={styles.kpiTitleGroup}>
                      <span className={styles.kpiCardTag}>Avg Ticket Value</span>
                      <div className={styles.kpiBigNum}>
                        {isFilterLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: '32px' }}>
                            <Loader size={20} className={styles.spinIcon} color="#d97706" />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Loading...</span>
                          </div>
                        ) : (
                          `₹${Math.round(metrics.avgTicket || 0).toLocaleString('en-IN')}`
                        )}
                      </div>
                    </div>
                    <div className={styles.kpiFooterMeta}>
                      <span>{isFilterLoading ? 'Updating average...' : 'Per order average'}</span>
                      {isFilterLoading ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }}>
                          <Loader size={12} className={styles.spinIcon} />
                        </div>
                      ) : metrics.avgTicket > 0 ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#fffbeb',
                          color: '#d97706',
                          border: '1px solid #fde68a'
                        }} title="Positive Average">
                          <TrendingUp size={13} strokeWidth={2.5} />
                        </div>
                      ) : metrics.avgTicket < 0 ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca'
                        }} title="Negative Average">
                          <TrendingDown size={13} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }} title="Neutral / Live Telemetry">
                          <Activity size={13} strokeWidth={2.2} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Total Orders */}
                  <div className={`${styles.kpiCardModern} ${styles.kpiCardSky}`}>
                    <div className={styles.kpiTopRow}>
                      <div className={`${styles.kpiIconBox} ${styles.kpiIconSky}`}>
                        <ShoppingBag size={22} />
                      </div>
                      <span className={`${styles.kpiPillBadge} ${metrics.activeOrders.length > 0 ? styles.kpiPillPositive : styles.kpiPillNeutral}`}>
                        {metrics.activeOrders.length} In Queue
                      </span>
                    </div>
                    <div className={styles.kpiTitleGroup}>
                      <span className={styles.kpiCardTag}>Total Orders</span>
                      <div className={styles.kpiBigNum}>
                        {isFilterLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: '32px' }}>
                            <Loader size={20} className={styles.spinIcon} color="#0284c7" />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>Loading...</span>
                          </div>
                        ) : (
                          metrics.totalOrdersCount
                        )}
                      </div>
                    </div>
                    <div className={styles.kpiFooterMeta}>
                      <span>{isFilterLoading ? 'Updating count...' : `${metrics.completedOrders?.length || 0} completed orders`}</span>
                      {isFilterLoading ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }}>
                          <Loader size={12} className={styles.spinIcon} />
                        </div>
                      ) : metrics.totalOrdersCount > 0 ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#f0f9ff',
                          color: '#0284c7',
                          border: '1px solid #bae6fd'
                        }} title="Active Volume">
                          <TrendingUp size={13} strokeWidth={2.5} />
                        </div>
                      ) : metrics.totalOrdersCount < 0 ? (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca'
                        }} title="Negative Volume">
                          <TrendingDown size={13} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: '#64748b',
                          border: '1px solid #e2e8f0'
                        }} title="Neutral / Live Telemetry">
                          <Activity size={13} strokeWidth={2.2} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. MIDDLE SPLIT: HIGH-TECH REVENUE CHART + LIVE ORDERS FEED */}
                <div className={styles.dashSplitGridModern}>
                  {/* Left: High-Tech Dynamic Chart Panel */}
                  <div className={styles.chartPanelCardModern}>
                    <div className={styles.chartTopBar}>
                      <div className={styles.chartTitleWrap}>
                        <h3>Revenue Velocity & Volume Telemetry</h3>
                        <p>Real-time hourly breakdown across {dateRange.replace('_', ' ')}</p>
                      </div>

                      <div className={styles.chartModeSwitch}>
                        <button
                          type="button"
                          className={`${styles.chartModeBtn} ${chartMetricTab === 'revenue' ? styles.chartModeBtnActive : ''}`}
                          onClick={() => setChartMetricTab('revenue')}
                        >
                          Revenue (₹)
                        </button>
                        <button
                          type="button"
                          className={`${styles.chartModeBtn} ${chartMetricTab === 'orders' ? styles.chartModeBtnActive : ''}`}
                          onClick={() => setChartMetricTab('orders')}
                        >
                          Orders (#)
                        </button>
                      </div>
                    </div>

                    <div className={styles.chartCanvasBox} style={{ position: 'relative' }}>
                      {isFilterLoading && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(255, 255, 255, 0.88)',
                          backdropFilter: 'blur(3px)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                          borderRadius: '12px',
                          gap: 10
                        }}>
                          <Loader size={26} className={styles.spinIcon} color="#4f46e5" />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                            Loading {dateRange.replace('_', ' ')} Telemetry...
                          </span>
                        </div>
                      )}
                      <svg className={styles.svgHighTech} viewBox="0 0 700 185" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="glowRevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.32" />
                            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="glowOrderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        {/* Background Grid Lines */}
                        <line x1="0" y1="35" x2="700" y2="35" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="75" x2="700" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="115" x2="700" y2="115" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="155" x2="700" y2="155" stroke="#f1f5f9" strokeWidth="1" />

                        {chartMetricTab === 'revenue' ? (
                          <>
                            {/* Dynamic Revenue Gradient Fill Area */}
                            <path
                              d={metrics.revAreaPath}
                              fill="url(#glowRevGrad)"
                            />
                            {/* Dynamic Revenue Main Curve */}
                            <path
                              d={metrics.revPath}
                              fill="none"
                              stroke="#4f46e5"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            {/* Peak Glowing Nodes */}
                            {metrics.revPoints?.map((pt, i) => (
                              <g key={i}>
                                <circle cx={pt.x} cy={pt.y} r={pt.val > 0 ? 5 : 3} fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
                              </g>
                            ))}
                          </>
                        ) : (
                          <>
                            {/* Dynamic Orders Gradient Fill Area */}
                            <path
                              d={metrics.ordAreaPath}
                              fill="url(#glowOrderGrad)"
                            />
                            {/* Dynamic Orders Main Curve */}
                            <path
                              d={metrics.ordPath}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />
                            {/* Peak Glowing Nodes */}
                            {metrics.ordPoints?.map((pt, i) => (
                              <g key={i}>
                                <circle cx={pt.x} cy={pt.y} r={pt.val > 0 ? 5 : 3} fill="#059669" stroke="#ffffff" strokeWidth="2" />
                              </g>
                            ))}
                          </>
                        )}
                      </svg>

                      <div className={styles.chartBottomAxis}>
                        <span>08:00 AM</span>
                        <span>11:00 AM</span>
                        <span>02:00 PM</span>
                        <span>05:00 PM</span>
                        <span>08:00 PM</span>
                        <span>11:00 PM</span>
                        <strong>Live</strong>
                      </div>
                    </div>

                    <div className={styles.chartSummaryFooter}>
                      <div className={styles.summaryStatItem}>
                        <span className={styles.summaryStatLabel}>Gross Sales</span>
                        <span className={styles.summaryStatVal}>
                          {isFilterLoading ? <Loader size={14} className={styles.spinIcon} color="#4f46e5" /> : `₹${Math.round(metrics.grossSales).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div className={styles.summaryStatItem}>
                        <span className={styles.summaryStatLabel}>Avg Ticket</span>
                        <span className={styles.summaryStatVal}>
                          {isFilterLoading ? <Loader size={14} className={styles.spinIcon} color="#d97706" /> : `₹${Math.round(metrics.avgTicket).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div className={styles.summaryStatItem}>
                        <span className={styles.summaryStatLabel}>Total Volume</span>
                        <span className={styles.summaryStatVal}>
                          {isFilterLoading ? <Loader size={14} className={styles.spinIcon} color="#0284c7" /> : `${metrics.totalOrdersCount} Orders`}
                        </span>
                      </div>
                      <div className={styles.summaryStatItem}>
                        <span className={styles.summaryStatLabel}>Operating Efficiency</span>
                        <span className={styles.summaryStatVal} style={{ color: '#059669' }}>
                          {isFilterLoading ? (
                            <Loader size={14} className={styles.spinIcon} color="#059669" />
                          ) : (
                            `${metrics.totalOrdersCount > 0 ? Math.round(((metrics.totalOrdersCount - (metrics.cancelledOrders?.length || 0)) / metrics.totalOrdersCount) * 100) : 100}% Optimal`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Kitchen & Orders Feed */}
                  <div className={styles.liveOrdersPanelModern}>
                    <div className={styles.liveHeaderRow}>
                      <div className={styles.liveTitleBlock}>
                        <h3>Live Orders Queue</h3>
                        <span className={styles.liveCountPill}>
                          ● {metrics.activeOrders.length} Active
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.liveRefreshBtn}
                        onClick={() => { fetchOrders(); toast.success("Refreshed live queue"); }}
                        title="Refresh Queue"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>

                    <div className={styles.liveCardsStream}>
                      {orders.slice(0, 5).map((order) => {
                        const orderCode = order.orderNumber ? `#ORD-${order.orderNumber}` : `#${order._id?.slice(-5) || 'ORD'}`;
                        const totalAmt = Number(order.total || order.totalAmount) || 0;
                        const itemsCount = (order.items || []).reduce((s, it) => s + (it.quantity || 1), 0);
                        const tableText = order.tableNumber ? `Table ${order.tableNumber}` : 'Counter Walk-in';

                        return (
                          <div key={order._id} className={styles.liveTicketCard}>
                            <div className={styles.ticketHead}>
                              <span className={styles.ticketIdBadge}>{orderCode}</span>
                              <span className={`${styles.ticketStatusPill} ${
                                order.status === 'completed'
                                  ? styles.readyChip
                                  : order.status === 'preparing'
                                  ? styles.prepChip
                                  : styles.deliveryChip
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className={styles.ticketBody}>
                              <span>{tableText} • {itemsCount} items</span>
                              <span className={styles.ticketPrice}>₹{Math.round(totalAmt).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        );
                      })}

                      {orders.length === 0 && (
                        <div className={styles.emptyLiveRadar}>
                          <div className={styles.radarPulseCircle}>
                            <Coffee size={24} />
                          </div>
                          <strong style={{ fontSize: '0.85rem', color: '#1e293b' }}>No active orders in queue</strong>
                          <span style={{ fontSize: '0.72rem' }}>New orders from QR codes or POS will appear here instantly.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 7. REAL-DATA LIVE FLOOR & TABLE MATRIX */}
                {(() => {
                  const occupiedTables = tables.filter(t => !!getActiveOrderForTable(t));
                  const availableTables = tables.filter(t => !getActiveOrderForTable(t));
                  const billReadyTables = tables.filter(t => {
                    const o = getActiveOrderForTable(t);
                    return o && (o.status === 'ready' || o.status === 'served');
                  });

                  let displayTables = tables;
                  if (tableFilterTab === 'occupied') displayTables = occupiedTables;
                  else if (tableFilterTab === 'available') displayTables = availableTables;
                  else if (tableFilterTab === 'bill') displayTables = billReadyTables;

                  // Sort serial-wise naturally (Table 1, Table 2, Table 3... Table 10, Table 11)
                  const sortedDisplayTables = [...displayTables].sort((a, b) => {
                    return String(a.tableNumber || '').localeCompare(String(b.tableNumber || ''), undefined, { numeric: true, sensitivity: 'base' });
                  });

                  // If > 8 tables, show first 7 tables and 8th tile is "View More" card
                  const hasMoreTables = sortedDisplayTables.length > 8;
                  const previewTables = hasMoreTables ? sortedDisplayTables.slice(0, 7) : sortedDisplayTables.slice(0, 8);
                  const remainingCount = sortedDisplayTables.length - 7;

                  const occupancyRate = tables.length > 0 ? Math.round((occupiedTables.length / tables.length) * 100) : 0;

                  return (
                    <div className={styles.floorMatrixCard}>
                      {/* Matrix Header Row */}
                      <div className={styles.floorHeaderRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Grid size={19} color="#4f46e5" />
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                              Live Dining Floor & Table Matrix
                            </h3>
                          </div>
                          
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '100px',
                            background: occupancyRate > 60 ? '#fef2f2' : occupancyRate > 0 ? '#fffbeb' : '#ecfdf5',
                            color: occupancyRate > 60 ? '#b91c1c' : occupancyRate > 0 ? '#b45309' : '#047857',
                            border: '1px solid currentColor'
                          }}>
                            {occupancyRate}% Occupied ({occupiedTables.length}/{tables.length} Tables Active)
                          </span>
                        </div>

                        {/* Filter Tabs & Quick Action */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', gap: '2px' }}>
                            <button
                              type="button"
                              onClick={() => setTableFilterTab('all')}
                              style={{
                                border: 'none',
                                background: tableFilterTab === 'all' ? '#ffffff' : 'transparent',
                                color: tableFilterTab === 'all' ? '#0f172a' : '#64748b',
                                fontWeight: 700,
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                boxShadow: tableFilterTab === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                              }}
                            >
                              All ({tables.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setTableFilterTab('available')}
                              style={{
                                border: 'none',
                                background: tableFilterTab === 'available' ? '#ffffff' : 'transparent',
                                color: tableFilterTab === 'available' ? '#059669' : '#64748b',
                                fontWeight: 700,
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                boxShadow: tableFilterTab === 'available' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                              }}
                            >
                              Free ({availableTables.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setTableFilterTab('occupied')}
                              style={{
                                border: 'none',
                                background: tableFilterTab === 'occupied' ? '#ffffff' : 'transparent',
                                color: tableFilterTab === 'occupied' ? '#d97706' : '#64748b',
                                fontWeight: 700,
                                fontSize: '11px',
                                padding: '4px 10px',
                                borderRadius: '7px',
                                cursor: 'pointer',
                                boxShadow: tableFilterTab === 'occupied' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                              }}
                            >
                              Busy ({occupiedTables.length})
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveTab('tables_hub')}
                            style={{
                              border: 'none',
                              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '11px',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
                            }}
                          >
                            <Layers size={13} /> Tables & Floor Operations Hub →
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Grid of Real Tables (Max 8 slots / 2 rows) */}
                      <div className={styles.tableGridContainer}>
                        {previewTables.map((tbl) => {
                          const activeOrder = getActiveOrderForTable(tbl);
                          const isOccupied = !!activeOrder;
                          const elapsedMins = activeOrder?.createdAt
                            ? Math.max(1, Math.round((new Date() - new Date(activeOrder.createdAt)) / 60000))
                            : 5;

                          const orderTotal = Math.round(activeOrder?.total || activeOrder?.totalAmount || 0);

                          return (
                            <div
                              key={tbl._id || tbl.tableNumber}
                              className={`${styles.tableTile} ${isOccupied ? styles.tableTileOccupied : styles.tableTileAvailable}`}
                              style={{
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: '100px',
                                padding: '10px 12px',
                                borderRadius: '12px',
                                border: isOccupied ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                                background: '#ffffff',
                                boxShadow: isOccupied ? '0 3px 12px rgba(245, 158, 11, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)',
                                overflow: 'hidden'
                              }}
                            >
                              {isOccupied && (
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '3px',
                                  background: 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                }} />
                              )}

                              <div>
                                <div className={styles.tableTileTop} style={{ marginBottom: 4 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span className={styles.tableTileNum} style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                                      Table {tbl.tableNumber}
                                    </span>
                                    <span style={{ fontSize: '9.5px', color: '#475569', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                      👥 {tbl.seatingCapacity || 4}
                                    </span>
                                  </div>

                                  <span
                                    className={styles.tableTileStatus}
                                    style={{
                                      color: isOccupied ? '#b45309' : '#047857',
                                      background: isOccupied ? '#fef3c7' : '#ecfdf5',
                                      border: isOccupied ? '1px solid #fde68a' : '1px solid #a7f3d0',
                                      padding: '2px 6px',
                                      borderRadius: '100px',
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3
                                    }}
                                  >
                                    <span style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: isOccupied ? '#f59e0b' : '#10b981' }} />
                                    {isOccupied ? `⚡ Due (${elapsedMins}m)` : 'Free'}
                                  </span>
                                </div>

                                <div className={styles.tableTileMeta} style={{ marginTop: '4px' }}>
                                  {isOccupied ? (
                                    <div style={{ background: '#fffdf5', padding: '5px 7px', borderRadius: '7px', border: '1px solid #fef3c7' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                        <strong style={{ color: '#0f172a', fontSize: '13px', fontWeight: 900 }}>
                                          ₹{orderTotal}
                                        </strong>
                                        <span style={{ fontSize: '9.5px', color: '#d97706', fontWeight: 800, textTransform: 'capitalize', background: '#fef3c7', padding: '1px 4px', borderRadius: '3px' }}>
                                          {activeOrder.status}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: '10.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {activeOrder.items?.map(it => `${it.quantity || 1}x ${it.name}`).join(', ') || 'Dine-in items'}
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
                                      <Coffee size={12} color="#94a3b8" />
                                      <span style={{ color: '#94a3b8', fontSize: '10.5px', fontWeight: 600 }}>
                                        Clean & Ready
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Card Action Bar */}
                              <div style={{ display: 'flex', gap: 4, marginTop: '6px', paddingTop: '5px', borderTop: '1px solid #f1f5f9' }}>
                                {isOccupied ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTableModal({ table: tbl, activeOrder });
                                      }}
                                      style={{
                                        padding: '4px 6px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#334155',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                      title="View Bill Details"
                                    >
                                      👁️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSettleTable(tbl.tableNumber);
                                      }}
                                      style={{
                                        flex: 1,
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: '#ffffff',
                                        fontSize: '10.5px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 3,
                                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                                      }}
                                      title="Settle & Free Table"
                                    >
                                      <CreditCard size={10} /> Settle (₹{orderTotal})
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTab('pos');
                                      toast.success(`Opened POS for Table ${tbl.tableNumber}`);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #a7f3d0',
                                      background: '#ecfdf5',
                                      color: '#059669',
                                      fontSize: '10.5px',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 3
                                    }}
                                  >
                                    <Plus size={11} /> Take Order
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* 8th Position "View More" Interactive Card */}
                        {hasMoreTables && (
                          <div
                            onClick={() => setActiveTab('tables_hub')}
                            style={{
                              background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
                              borderRadius: '12px',
                              border: '1.5px dashed #818cf8',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              cursor: 'pointer',
                              minHeight: '100px',
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.06)'
                            }}
                            title="Click to view all tables in Floor Operations Hub"
                          >
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '9px',
                              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 5,
                              boxShadow: '0 3px 8px rgba(79, 70, 229, 0.28)'
                            }}>
                              <Layers size={16} />
                            </div>
                            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                              +{remainingCount} More Tables
                            </span>
                            <span style={{ fontSize: '10.5px', color: '#4f46e5', fontWeight: 800, marginTop: 3 }}>
                              View All ({tables.length}) Hub →
                            </span>
                          </div>
                        )}
                      </div>

                      {displayTables.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '13px' }}>
                          No tables found matching the filter "{tableFilterTab}".
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* REAL TABLE ORDER DETAILS & BILL SETTLE MODAL */}
                <AnimatePresence>
                  {selectedTableModal && (
                    <div style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(15, 23, 42, 0.65)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 9999,
                      padding: '1rem'
                    }} onClick={() => setSelectedTableModal(null)}>
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: '#ffffff',
                          borderRadius: '20px',
                          padding: '1.75rem',
                          width: '100%',
                          maxWidth: '480px',
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                          maxHeight: '90vh',
                          overflowY: 'auto'
                        }}
                      >
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                          <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                              Table {selectedTableModal.table?.tableNumber} • Active Order
                            </h3>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Order #{selectedTableModal.activeOrder?.orderNumber || selectedTableModal.activeOrder?._id?.slice(-5)} • {selectedTableModal.table?.seatingCapacity || 4} Guests
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedTableModal(null)}
                            style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {/* Order Status Ribbon */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f8fafc',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          marginBottom: '1rem'
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Current Kitchen Status:</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(selectedTableModal.activeOrder?._id, 'preparing')}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #fde68a',
                                background: selectedTableModal.activeOrder?.status === 'preparing' ? '#f59e0b' : '#fffbeb',
                                color: selectedTableModal.activeOrder?.status === 'preparing' ? '#ffffff' : '#b45309',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Cooking
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateOrderStatus(selectedTableModal.activeOrder?._id, 'ready')}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #a7f3d0',
                                background: selectedTableModal.activeOrder?.status === 'ready' ? '#10b981' : '#ecfdf5',
                                color: selectedTableModal.activeOrder?.status === 'ready' ? '#ffffff' : '#047857',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Served
                            </button>
                          </div>
                        </div>

                        {/* Itemized Dish List */}
                        <div style={{ marginBottom: '1.25rem' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Itemized Dishes
                          </span>
                          <div style={{ marginTop: '8px', border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                            {(selectedTableModal.activeOrder?.items || []).map((it, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px 14px',
                                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                  borderBottom: idx === (selectedTableModal.activeOrder?.items?.length - 1) ? 'none' : '1px solid #f1f5f9'
                                }}
                              >
                                <div>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>
                                    {it.name || it.item?.name || 'Dish Item'}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                                    Qty: {it.quantity || 1} × ₹{Number(it.price || it.item?.price || 0)}
                                  </span>
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                                  ₹{Math.round((it.quantity || 1) * (Number(it.price || it.item?.price || 0)))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bill Total Summary */}
                        <div style={{
                          background: '#f8fafc',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          border: '1px solid #e2e8f0',
                          marginBottom: '1.25rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: 4 }}>
                            <span>Subtotal</span>
                            <span>₹{Math.round(selectedTableModal.activeOrder?.subtotal || selectedTableModal.activeOrder?.total || 0)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: 6 }}>
                            <span>Taxes & GST (5%)</span>
                            <span>₹{Math.round((selectedTableModal.activeOrder?.total || 0) * 0.05)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                            <span>Total Payable</span>
                            <span style={{ color: '#4f46e5' }}>₹{Math.round(selectedTableModal.activeOrder?.total || 0)}</span>
                          </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => {
                              toast.success("KOT sent to kitchen printer");
                              window.print();
                            }}
                            style={{
                              flex: 1,
                              padding: '11px',
                              borderRadius: '10px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            🖨️ Print Bill
                          </button>
                          <button
                            type="button"
                            disabled={isSettlingTable}
                            onClick={() => handleSettleTable(selectedTableModal.table?.tableNumber)}
                            style={{
                              flex: 1.4,
                              padding: '11px',
                              borderRadius: '10px',
                              border: 'none',
                              background: '#10b981',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '13px',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            {isSettlingTable ? 'Settling...' : '✓ Settle & Free Table'}
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                {/* 8. BOTTOM SECTION: OPERATIONAL CHECKLIST + TOP SELLING DISHES */}
                <div className={styles.dashBottomGridModern}>
                  {/* Left: Operational Checklist */}
                  <div className={styles.opsChecklistCard}>
                    <div className={styles.opsHeaderRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle2 size={18} color="#4f46e5" />
                        <h3>Daily Operational Checklist</h3>
                      </div>
                      <span className={styles.opsProgressPill}>
                        {checklist.filter(c => c.done).length} / {checklist.length} Completed
                      </span>
                    </div>

                    <div className={styles.opsProgressBarTrack}>
                      <div
                        className={styles.opsProgressBarFill}
                        style={{
                          width: `${(checklist.filter(c => c.done).length / (checklist.length || 1)) * 100}%`
                        }}
                      />
                    </div>

                    <div className={styles.opsCheckList}>
                      {checklist.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleChecklist(item.id)}
                          className={`${styles.opsItemRow} ${item.done ? styles.opsItemRowDone : ''}`}
                        >
                          <div className={styles.opsItemLeft}>
                            <div className={`${styles.opsCheckbox} ${item.done ? styles.opsCheckboxChecked : ''}`}>
                              {item.done && <Check size={12} />}
                            </div>
                            <span className={`${styles.opsItemText} ${item.done ? styles.opsItemTextDone : ''}`}>
                              {item.text}
                            </span>
                          </div>
                          <span className={styles.opsItemTime}>{item.time}</span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddChecklistItem} className={styles.opsAddForm}>
                      <input
                        type="text"
                        placeholder="Add quick operational task..."
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        className={styles.opsInput}
                      />
                      <button type="submit" className={styles.opsAddBtn}>
                        Add
                      </button>
                    </form>
                  </div>

                  {/* Right: Top Selling Items & Category Share */}
                  <div className={styles.topSellingCard}>
                    <div className={styles.opsHeaderRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Flame size={18} color="#e11d48" />
                        <h3>Popular Menu Performers</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('menu')}
                        style={{ background: 'transparent', border: 'none', color: '#4f46e5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Manage Menu →
                      </button>
                    </div>

                    <div className={styles.topSellingList}>
                      {metrics.topSellingItems?.map((it, idx) => {
                        const totalRev = metrics.grossSales || 1;
                        const pct = Math.min(100, Math.round((it.revenue / totalRev) * 100)) || (40 - idx * 8);

                        return (
                          <div key={idx} className={styles.topDishRow}>
                            <div className={`${styles.dishRankCircle} ${idx === 0 ? styles.dishRankTop : ''}`}>
                              #{idx + 1}
                            </div>
                            <div className={styles.dishInfoBlock}>
                              <span className={styles.dishName}>{it.name}</span>
                              <span className={styles.dishMeta}>{it.count} units sold</span>
                            </div>
                            <div className={styles.dishBarWrap}>
                              <div className={styles.dishBarFill} style={{ width: `${pct}%` }} />
                            </div>
                            <div className={styles.dishRevenue}>
                              ₹{Math.round(it.revenue).toLocaleString('en-IN')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 1.5. DINING FLOOR & TABLE OPERATIONS HUB                   */}
            {/* ========================================================= */}
            {activeTab === 'tables_hub' && (
              <motion.div
                key="tables_hub"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <TableOperationsHub
                  tables={tables}
                  orders={orders}
                  tenantInfo={tenantInfo}
                  tenantId={tenantId || user?.tenantId}
                  onSettleTable={handleSettleTable}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onOpenPOS={(tableNum) => {
                    setActiveTab('pos');
                    toast.success(`POS opened for Table ${tableNum}`);
                  }}
                  onRefresh={() => {
                    fetchTables();
                    fetchOrders();
                    toast.success("Live floor & orders refreshed");
                  }}
                  onAddTable={handleAddTableFromHub}
                  onDeleteTable={handleDeleteTableFromHub}
                />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 2. LIVE ORDERS & KITCHEN DISPLAY SYSTEM (KDS)             */}
            {/* ========================================================= */}
            {activeTab === 'kds' && (
              <motion.div
                key="kds"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <KOTMonitor
                  orders={orders}
                  onUpdateStatus={handleStatusUpdate}
                  onDeleteOrder={handleDeleteOrder}
                />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 3. MENU MANAGEMENT & CATALOG                              */}
            {/* ========================================================= */}
            {activeTab === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={styles.menuManagementView}
              >
                {/* Top Action Header */}
                <div className={styles.menuHeaderRow}>
                  <div>
                    <h2 className={styles.sectionHeading}>Menu Catalog & Digital Availability Sync</h2>
                    <p className={styles.sectionSubtitle}>Manage dish prices in ₹, discounts, veg/non-veg tags, and live out-of-stock items.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {selectedItemIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleBulkDelete}
                        className={styles.bulkDeleteBtn}
                      >
                        <Trash2 size={16} /> Delete Selected ({selectedItemIds.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleOpenAddDrawer}
                      className={styles.addNewItemBtn}
                    >
                      <Plus size={16} /> Add New Dish
                    </button>
                  </div>
                </div>

                {/* Categories Bar */}
                <div className={styles.categoriesPillRow}>
                  {standardCategories.map((cat) => {
                    const IconComp = cat.Component;
                    const isActive = selectedCategory === cat.id;
                    const count = cat.id === 'all'
                      ? items.length
                      : items.filter(i => itemMatchesCategory(i, cat.id)).length;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`${styles.categoryPill} ${isActive ? styles.activeCategoryPill : ''}`}
                      >
                        <IconComp size={15} />
                        <span>{cat.name}</span>
                        <span className={styles.catCountBadge}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Items Grid */}
                <div className={styles.menuItemsGrid}>
                  {filteredMenuItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item._id);
                    const discount = item.discount || {};
                    const hasDiscount = Boolean(discount.isDiscounted && discount.value > 0);

                    let discountedPrice = item.price;
                    if (hasDiscount) {
                      if (discount.type === 'percentage') {
                        discountedPrice = Math.max(0, Math.round(item.price * (1 - discount.value / 100)));
                      } else {
                        discountedPrice = Math.max(0, item.price - discount.value);
                      }
                    }

                    return (
                      <motion.div
                        key={item._id}
                        whileHover={{ y: -4 }}
                        className={`${styles.dishCard} ${!item.available ? styles.dishOutOfStock : ''}`}
                      >
                        <div className={styles.dishImageWrap}>
                          <img
                            src={getValidFoodImage(item)}
                            alt={item.name}
                            className={styles.dishImage}
                            loading="lazy"
                          />
                          <div className={styles.dishImageOverlay}>
                            <button
                              type="button"
                              onClick={() => handleToggleSelectItem(item._id)}
                              className={styles.selectCheckboxBtn}
                            >
                              {isSelected ? <CheckSquare size={18} color="#4f46e5" /> : <Square size={18} color="#ffffff" />}
                            </button>
                            <div className={styles.dishBadges}>
                              <span className={item.isVeg ? styles.vegPill : styles.nonVegPill}>
                                {item.isVeg ? '● VEG' : '▲ NON-VEG'}
                              </span>
                              {hasDiscount && (
                                <span style={{
                                  background: '#ef4444',
                                  color: '#ffffff',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: '100px',
                                  letterSpacing: '0.04em'
                                }}>
                                  {discount.type === 'percentage' ? `${discount.value}% OFF` : `₹${discount.value} OFF`}
                                </span>
                              )}
                              {!item.available && (
                                <span className={styles.soldOutPill}>OUT OF STOCK</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.dishBody}>
                          <div className={styles.dishTitleRow}>
                            <h4 className={styles.dishName}>{item.name}</h4>
                            <div style={{ textAlign: 'right' }}>
                              {hasDiscount ? (
                                <div>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>₹{discountedPrice}</span>
                                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>₹{item.price}</span>
                                </div>
                              ) : (
                                <div className={styles.dishPrice}>₹{item.price}</div>
                              )}
                            </div>
                          </div>
                          <p className={styles.dishDescription}>{item.description}</p>

                          {/* Stock Toggle & Quick Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                            <div
                              onClick={() => handleToggleItemAvailability(item)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                            >
                              <div style={{
                                width: 34,
                                height: 18,
                                borderRadius: 100,
                                background: item.available ? '#10b981' : '#cbd5e1',
                                position: 'relative',
                                transition: 'background 0.2s ease'
                              }}>
                                <div style={{
                                  width: 14,
                                  height: 14,
                                  borderRadius: '50%',
                                  background: '#ffffff',
                                  position: 'absolute',
                                  top: 2,
                                  left: item.available ? 18 : 2,
                                  transition: 'left 0.2s ease',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }} />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: item.available ? '#059669' : '#64748b' }}>
                                {item.available ? 'Available' : 'Out of Stock'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditDrawer(item)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  background: '#ffffff',
                                  color: '#334155',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmItem(item)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #fee2e2',
                                  background: '#fef2f2',
                                  color: '#ef4444',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredMenuItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', marginTop: '1.5rem' }}>
                    <UtensilsCrossed size={36} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', margin: 0 }}>No dishes found</h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
                      {menuSearchQuery ? `No items match "${menuSearchQuery}"` : 'Click "+ Add New Dish" above to create your first menu item.'}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 4. POS BILLING TERMINAL                                   */}
            {/* ========================================================= */}
            {activeTab === 'pos' && (
              <motion.div
                key="pos"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <POSTerminal
                  tenantId={tenantId}
                  tenantInfo={tenantInfo}
                  menuItems={items}
                  orders={orders}
                  onOrderPlaced={(newOrd) => {
                    // For settlement (_refreshAll flag), just re-fetch to clear table
                    if (newOrd?._refreshAll) {
                      fetchOrders();
                      return;
                    }
                    setOrders(prev => {
                      const exists = prev.some(o => o._id === newOrd._id);
                      if (exists) {
                        return prev.map(o => o._id === newOrd._id ? newOrd : o);
                      }
                      return [newOrd, ...prev];
                    });
                    fetchOrders();
                  }}
                  onOrderCreated={(newOrd) => {
                    // Always re-fetch to get latest state (new round or settlement)
                    fetchOrders();
                  }}
                />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 6. CRM & LOYALTY                                          */}
            {/* ========================================================= */}
            {activeTab === 'crm' && (
              <motion.div
                key="crm"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <CRMLoyalty orders={orders} />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 7. DYNAMIC TABLE QR CODES MANAGER                         */}
            {/* ========================================================= */}
            {activeTab === 'qrcodes' && (
              <motion.div
                key="qrcodes"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <QRCodeComponent orders={orders} />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 8. RESTAURANT SETTINGS                                    */}
            {/* ========================================================= */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <RestaurantSettings
                  tenantInfo={tenantInfo}
                  onSave={handleSaveTenantSettings}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* DRAWER FOR ADDING / EDITING DISH */}
      {isDrawerOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setIsDrawerOpen(false)}>
          <motion.div
            initial={{ x: 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 450, opacity: 0 }}
            className={styles.drawerContainer}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '480px', overflowY: 'auto' }}
          >
            <div className={styles.drawerHeader}>
              <h3>{editingItem ? 'Edit Dish' : 'Add New Dish'}</h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className={styles.closeDrawerBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDrawerItem} className={styles.drawerForm} style={{ padding: '1.25rem' }}>

              {/* Dish Name */}
              <div className={styles.formGroup}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wagyu Truffle Burger"
                  value={drawerForm.name}
                  onChange={(e) => setDrawerForm({ ...drawerForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients and flavour profile..."
                  value={drawerForm.description}
                  onChange={(e) => setDrawerForm({ ...drawerForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              {/* Price & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 350"
                    value={drawerForm.price}
                    onChange={(e) => setDrawerForm({ ...drawerForm, price: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Category</label>
                  <select
                    value={drawerForm.category}
                    onChange={(e) => setDrawerForm({ ...drawerForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                  >
                    {standardCategories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Veg / Non-Veg Toggle (Radio Controls) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Dietary Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setDrawerForm({ ...drawerForm, isVeg: true })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: drawerForm.isVeg ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      background: drawerForm.isVeg ? '#f0fdf4' : '#ffffff',
                      color: drawerForm.isVeg ? '#16a34a' : '#64748b',
                      fontWeight: 800,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    ● Vegetarian (Veg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerForm({ ...drawerForm, isVeg: false })}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: !drawerForm.isVeg ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      background: !drawerForm.isVeg ? '#fef2f2' : '#ffffff',
                      color: !drawerForm.isVeg ? '#dc2626' : '#64748b',
                      fontWeight: 800,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer'
                    }}
                  >
                    ▲ Non-Vegetarian
                  </button>
                </div>
              </div>

              {/* Discount Section (OFF / ON Toggle) */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Percent size={14} color="#4f46e5" /> Promotional Discount
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Apply temporary price reduction</span>
                  </div>
                  <div
                    onClick={() => setDrawerForm({ ...drawerForm, hasDiscount: !drawerForm.hasDiscount })}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 100,
                      background: drawerForm.hasDiscount ? '#4f46e5' : '#cbd5e1',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: 3,
                      left: drawerForm.hasDiscount ? 21 : 3,
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </div>

                {drawerForm.hasDiscount && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setDrawerForm({ ...drawerForm, discountType: 'percentage' })}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: drawerForm.discountType === 'percentage' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                          background: drawerForm.discountType === 'percentage' ? '#eef2ff' : '#ffffff',
                          color: drawerForm.discountType === 'percentage' ? '#4f46e5' : '#64748b',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDrawerForm({ ...drawerForm, discountType: 'amount' })}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: drawerForm.discountType === 'amount' ? '2px solid #4f46e5' : '1px solid #cbd5e1',
                          background: drawerForm.discountType === 'amount' ? '#eef2ff' : '#ffffff',
                          color: drawerForm.discountType === 'amount' ? '#4f46e5' : '#64748b',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Fixed Amount (₹)
                      </button>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                        {drawerForm.discountType === 'percentage' ? 'Discount Percentage (e.g. 15 for 15%)' : 'Discount Amount in ₹ (e.g. 50)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder={drawerForm.discountType === 'percentage' ? '15' : '50'}
                        value={drawerForm.discountValue}
                        onChange={(e) => setDrawerForm({ ...drawerForm, discountValue: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Direct Device Image Upload */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Dish Photograph (Device Upload)</label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  style={{ display: 'none' }}
                />

                {drawerForm.image ? (
                  <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <img
                      src={drawerForm.image}
                      alt="Dish Preview"
                      style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#0f172a', color: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '10px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      background: '#f8fafc',
                      cursor: 'pointer'
                    }}
                  >
                    <ImagePlus size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#334155', margin: '0 0 2px 0' }}>Click to upload image from device</p>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>PNG, JPG, WEBP up to 5MB</span>
                  </div>
                )}
              </div>

              {/* Availability Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Item Availability</span>
                <div
                  onClick={() => setDrawerForm({ ...drawerForm, available: !drawerForm.available })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: drawerForm.available ? '#10b981' : '#64748b' }}>
                    {drawerForm.available ? 'Available (In Stock)' : 'Out of Stock'}
                  </span>
                  <div style={{
                    width: 36,
                    height: 20,
                    borderRadius: 100,
                    background: drawerForm.available ? '#10b981' : '#cbd5e1',
                    position: 'relative',
                    transition: 'background 0.2s'
                  }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: 3,
                      left: drawerForm.available ? 19 : 3,
                      transition: 'left 0.2s'
                    }} />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDish}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {isSavingDish ? 'Saving Dish...' : 'Save Dish'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmItem && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }} onClick={() => setDeleteConfirmItem(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '18px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                textAlign: 'center'
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>Delete "{deleteConfirmItem.name}"?</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem 0' }}>This will permanently remove the dish from your restaurant menu catalog.</p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteItem}
                  disabled={isDeleting}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}