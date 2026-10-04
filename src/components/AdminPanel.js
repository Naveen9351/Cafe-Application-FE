import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit3, LayoutDashboard, ShoppingBag, QrCode, BarChart3, X, LogOut, Loader, TrendingUp, IndianRupee,
  UtensilsCrossed, Coffee, Pizza, Sandwich, IceCream, GlassWater, Martini, Cake, Soup, Cookie, Grid,
  ChefHat, Truck, UserCheck, Share2, Sparkles, Upload, ImagePlus, ImageIcon, Settings, Bell, HelpCircle,
  TrendingDown, CheckSquare, Square, Download, Filter, Star, Clock, Check, ArrowUpRight, Flame, Layers,
  ChevronRight, ChevronLeft, RefreshCw, Smartphone, CreditCard, Calendar, Percent, DollarSign, AlertTriangle, CheckCircle2,
  Activity, Zap, Eye, ArrowRight, ShieldCheck, Award, Users, Receipt, PieChart, Minus, BookOpen
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeComponent from './QRCodeComponent';
import TableOperationsHub from './TableOperationsHub';
import POSTerminal from './petpooja/POSTerminal';
import KOTMonitor from './petpooja/KOTMonitor';
import OrdersManagement from './petpooja/OrdersManagement';
import CRMLoyalty from './petpooja/CRMLoyalty';
import OnlineAggregators from './petpooja/OnlineAggregators';
import RestaurantSettings from './RestaurantSettings';
import StaffManager from './StaffManager';
import ReportsSuite from './ReportsSuite';
import KhataLedger from './KhataLedger';
import SupportModal from './SupportModal';
import CafeAICopilotChatbot from './CafeAICopilotChatbot';
import { TableMatrixSkeleton, MetricsGridSkeleton, DishGridSkeleton } from './common/SkeletonLoader';
import styles from './AdminPanel.module.css';
import BrandLogo from './BrandLogo';
import usePWAInstall from '../hooks/usePWAInstall';
import PWAInstallModal from './pwa/PWAInstallModal';
import { API_URL as API } from '../config/api';
import { playOrderChime } from '../utils/audioChime';

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

export const AVAILABLE_CATEGORY_ICONS = [
  { id: 'UtensilsCrossed', label: 'Mains', Component: UtensilsCrossed },
  { id: 'Pizza', label: 'Pizza', Component: Pizza },
  { id: 'Sandwich', label: 'Burgers & Wraps', Component: Sandwich },
  { id: 'Coffee', label: 'Coffee & Tea', Component: Coffee },
  { id: 'Cake', label: 'Desserts', Component: Cake },
  { id: 'GlassWater', label: 'Beverages', Component: GlassWater },
  { id: 'Martini', label: 'Cocktails/Bar', Component: Martini },
  { id: 'Cookie', label: 'Appetizers', Component: Cookie },
  { id: 'Soup', label: 'Soups', Component: Soup },
  { id: 'IceCream', label: 'Ice Cream', Component: IceCream },
  { id: 'Sparkles', label: 'Specials', Component: Sparkles },
  { id: 'Flame', label: 'Grill & Spicy', Component: Flame },
  { id: 'ChefHat', label: 'Chef Specials', Component: ChefHat },
  { id: 'Layers', label: 'Combos', Component: Layers },
  { id: 'Star', label: 'Popular', Component: Star }
];

const CATEGORY_ICON_MAP = {
  UtensilsCrossed,
  Sparkles,
  Cookie,
  Cake,
  GlassWater,
  Sandwich,
  Pizza,
  Coffee,
  Soup,
  Martini,
  IceCream,
  Grid,
  Flame,
  ChefHat,
  Layers,
  Star
};

export const getCategoryIconComponent = (cat) => {
  if (cat && typeof cat.Component === 'function') {
    return cat.Component;
  }
  if (cat && cat.icon && typeof cat.icon === 'string' && CATEGORY_ICON_MAP[cat.icon]) {
    return CATEGORY_ICON_MAP[cat.icon];
  }
  return UtensilsCrossed;
};

const itemMatchesCategory = (item, catId, customCats = []) => {
  if (catId === 'all') return true;
  const itemCat = (item.category || '').toLowerCase().trim();
  const allCats = customCats && customCats.length > 0 ? customCats : standardCategories;
  const catObj = allCats.find(c => c.id === catId || (c.name && c.name.toLowerCase() === catId.toLowerCase()));
  if (catObj) {
    if (catObj.aliases && Array.isArray(catObj.aliases) && catObj.aliases.some(a => itemCat.includes(a.toLowerCase()) || a.toLowerCase().includes(itemCat))) {
      return true;
    }
    if (catObj.name && catObj.name.toLowerCase() === itemCat) return true;
    if (catObj.id && catObj.id.toLowerCase() === itemCat) return true;
  }
  return itemCat === String(catId).toLowerCase();
};

export const getCustomerFirstName = (customerNameOrObj, fallback = '') => {
  if (!customerNameOrObj) return fallback;
  let fullName = '';
  if (typeof customerNameOrObj === 'object') {
    fullName = customerNameOrObj.name || customerNameOrObj.fullName || customerNameOrObj.customerName || '';
  } else {
    fullName = String(customerNameOrObj);
  }
  const clean = fullName.trim();
  if (!clean || clean.toLowerCase() === 'guest' || clean.toLowerCase() === 'walk-in guest' || clean.toLowerCase() === 'walk-in customer' || clean.toLowerCase() === 'undefined' || clean.toLowerCase() === 'null') {
    return fallback;
  }
  const firstName = clean.split(/\s+/)[0];
  return firstName || fallback;
};

export const getOrderAmount = (ord) => {
  if (!ord) return 0;
  const val = Number(ord.settledAmount || ord.finalAmount || ord.total || ord.totalAmount || ord.subTotal);
  if (!isNaN(val) && val > 0) return val;
  if (Array.isArray(ord.items) && ord.items.length > 0) {
    return ord.items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
  }
  return 0;
};

export const getValidFoodImage = (item) => {
  const img = item?.image;
  if (img && !img.toLowerCase().includes('policy') && !img.toLowerCase().includes('document') && !img.toLowerCase().includes('reminder') &&
    (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/uploads') || img.startsWith('data:image'))) {
    return img;
  }
  if (item?.name) {
    return `https://image.pollinations.ai/prompt/delicious%20gourmet%20dish%20${encodeURIComponent(item.name)}%20restaurant%20food%20plating?width=600&height=400&nologo=true`;
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';
};

export default function AdminPanel() {
  const { user, tenantId, socket, logout } = useAuth();
  const navigate = useNavigate();

  const {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    isOnline,
    isModalOpen,
    setIsModalOpen,
    promptInstall,
    deferredPrompt
  } = usePWAInstall();

  const [posSelectedTable, setPosSelectedTable] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState(true);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Master module tab configuration with permission keys
  const ALL_TABS_CONFIG = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permKey: 'access_dashboard', adminOnly: true },
    { id: 'pos', label: 'POS Terminal', icon: IndianRupee, permKey: 'access_pos' },
    { id: 'kds', label: 'Live Orders', icon: ChefHat, permKey: 'access_live_orders', badge: true },
    { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed, permKey: 'access_menu' },
    { id: 'qrcodes', label: 'Table QR Codes', icon: QrCode, permKey: 'access_tables' },
    { id: 'crm', label: 'Customer CRM', icon: Users, permKey: 'access_crm', adminOnly: true },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, permKey: 'access_orders' },
    { id: 'staff', label: 'Staff Management', icon: Users, permKey: 'access_staff', adminOnly: true },
    { id: 'reports', label: 'Reports Suite', icon: BarChart3, permKey: 'access_reports' },
    { id: 'khata', label: 'Khata Ledger', icon: BookOpen, permKey: 'access_khata', requiresSetting: 'enableKhata' },
    { id: 'settings', label: 'Settings', icon: Settings, permKey: 'access_settings' },
  ], []);

  // Compute strictly allowed tabs for current user based on permission bucket
  const allowedTabs = useMemo(() => {
    if (isAdmin) {
      return ALL_TABS_CONFIG.filter(t => {
        if (t.requiresSetting && !tenantInfo?.settings?.[t.requiresSetting]) return false;
        return true;
      });
    }
    const perms = user?.permissions || {};
    return ALL_TABS_CONFIG.filter(t => {
      if (t.adminOnly) return false;
      if (t.requiresSetting && !tenantInfo?.settings?.[t.requiresSetting]) return false;
      return Boolean(perms[t.permKey] || (t.id === 'orders' && perms['access_live_orders']));
    });
  }, [isAdmin, user?.permissions, tenantInfo?.settings, ALL_TABS_CONFIG]);

  const { tab } = useParams();
  const activeTab = useMemo(() => {
    if (!tab) {
      if (!isAdmin && allowedTabs.length > 0) return allowedTabs[0].id;
      return 'dashboard';
    }
    const t = tab.toLowerCase();
    if (t === 'live-orders') return 'kds';
    const validTabs = ['dashboard', 'pos', 'kds', 'orders', 'menu', 'qrcodes', 'crm', 'staff', 'reports', 'khata', 'settings'];
    return validTabs.includes(t) ? t : (isAdmin ? 'dashboard' : (allowedTabs[0]?.id || 'pos'));
  }, [tab, isAdmin, allowedTabs]);

  const hasAccessToCurrentTab = isAdmin || allowedTabs.some(t => t.id === activeTab);

  // Auto-redirect staff to their first permitted tab if navigating to an unauthorized route
  useEffect(() => {
    if (user && !isAdmin && allowedTabs.length > 0) {
      const hasPerm = allowedTabs.some(t => t.id === activeTab);
      if (!hasPerm) {
        navigate(`/admin/${allowedTabs[0].id}`, { replace: true });
      }
    }
  }, [user, isAdmin, allowedTabs, activeTab, navigate]);

  const handleTabChange = (newTab) => {
    navigate(`/admin/${newTab}`);
  };

  // User identity metadata for top navbar display
  const userEmail = user?.email || user?.username || (isAdmin ? 'admin@serviq.in' : 'staff@serviq.in');
  const userRoleLabel = (user?.designation || user?.role || (isAdmin ? 'Admin' : 'Staff')).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const userInitials = (user?.name || user?.fullName || userEmail.split('@')[0] || 'U').slice(0, 2).toUpperCase();

  // Dashboard Date Filter State
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', 'this_week', 'this_month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Dynamic Categories State (loaded from localStorage or defaults)
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('serviq_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.log('Error reading custom categories:', e);
    }
    return standardCategories;
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState('add'); // 'add' or 'edit'
  const [editingCategoryData, setEditingCategoryData] = useState(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('UtensilsCrossed');
  const [categoryToDelete, setCategoryToDelete] = useState(null);

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
  const [dietaryFilter, setDietaryFilter] = useState('all'); // 'all', 'veg', 'non-veg'
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in-stock', 'out-of-stock'
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


  // Dashboard-specific Orders State (Controlled by Dashboard Date Filter only)
  const [dashboardOrders, setDashboardOrders] = useState([]);

  // 7-Day Notification History State
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Fetch Master Orders (unfiltered / latest active & recent) for POS, Tables & KDS
  const fetchOrders = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API}/orders`, { headers: { 'x-auth-token': token } });
      if (res.data && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      console.log('Master orders fetch error:', err.message);
    }
  };

  // Fetch Dashboard Orders based on dashboard dateRange filter
  const fetchDashboardOrders = async () => {
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
        setDashboardOrders(res.data);
      }
    } catch (err) {
      console.log('Dashboard orders fetch error:', err.message);
    } finally {
      setIsFilterLoading(false);
    }
  };

  // Fetch 7-Day Notification History
  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/notifications`, {
        headers: { 'x-auth-token': token }
      });
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        const readIds = JSON.parse(localStorage.getItem('serviq_read_notifs') || '[]');
        const unread = res.data.notifications.filter(n => !readIds.includes(n.id)).length;
        setUnreadNotifsCount(unread);
      }
    } catch (e) {
      console.log('Failed to fetch notifications:', e.message);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotificationsDrawer(true);
    fetchNotifications();
  };

  const handleMarkAllNotifsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('serviq_read_notifs', JSON.stringify(allIds));
    setUnreadNotifsCount(0);
    toast.success('All notifications marked as read');
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

  // Helper: Get ALL active orders for a specific table
  const getActiveOrdersForTable = useCallback((tbl) => {
    if (!tbl) return [];
    const rawNum = String(tbl.tableNumber || tbl.table || '').trim().toLowerCase();
    const numOnly = rawNum.replace(/[^0-9]/g, '');
    return (orders || []).filter(o => {
      if (o.status === 'completed' || o.status === 'cancelled') return false;
      const orderTbl = String(o.tableNumber || o.table || '').trim().toLowerCase();
      const orderNumOnly = orderTbl.replace(/[^0-9]/g, '');
      return orderTbl === rawNum || (numOnly && orderNumOnly && numOnly === orderNumOnly) || orderTbl === `table ${numOnly}`;
    });
  }, [orders]);

  const getActiveOrderForTable = useCallback((tbl) => {
    const list = getActiveOrdersForTable(tbl);
    return list.length > 0 ? list[0] : null;
  }, [getActiveOrdersForTable]);

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
    // Fetch Tenant Info with robust fallback
    let tid = tenantId || user?.tenantId;
    if (!tid) {
      try {
        const u = localStorage.getItem('user');
        if (u) tid = JSON.parse(u)?.tenantId;
      } catch (e) { }
    }
    if (tid) {
      axios.get(`${API}/tenants/public/${tid}`)
        .then((res) => {
          if (res.data) {
            const fetchedLogo = res.data.logo || res.data.settings?.logo || localStorage.getItem('restaurant_logo');
            setTenantInfo({
              ...res.data,
              logo: fetchedLogo || null
            });
            if (fetchedLogo) localStorage.setItem('restaurant_logo', fetchedLogo);
          }
        })
        .catch((err) => console.log('Tenant info fetch error:', err));
    }

    fetchMenu();
    fetchOrders();
    fetchTables();
    fetchNotifications();

    // Live Sockets
    if (socket) {
      socket.on('newOrder', (newOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
        setDashboardOrders((prev) => [newOrder, ...prev]);
        toast.success(`New order received: #${newOrder.orderNumber || newOrder._id?.slice(-4)}`);
        playOrderChime();
        fetchTables();
        fetchNotifications();
      });
      socket.on('orderUpdate', (updatedOrder) => {
        setOrders((prev) => prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)));
        setDashboardOrders((prev) => prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)));
      });
    }

    return () => {
      if (socket) {
        socket.off('newOrder');
        socket.off('orderUpdate');
      }
    };
  }, [user, tenantId, socket]);

  // Dedicated Dashboard Date Filter Hook - updates ONLY dashboardOrders without affecting other tabs
  useEffect(() => {
    fetchDashboardOrders();
  }, [dateRange, customStartDate, customEndDate]);

  // Daily Performance Checklist State
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Morning Station & Inventory Sync', time: '08:00 AM', done: true, overdue: false, category: 'Opening' },
    { id: 2, text: 'Staff Shift Handover & KDS Calibration', time: '02:00 PM', done: false, overdue: false, category: 'Shift' },
    { id: 3, text: 'Review Daily P&L & Recipe Depletions', time: '10:00 PM', done: false, overdue: false, category: 'Closing' }
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [chartMetricTab, setChartMetricTab] = useState('revenue'); // 'revenue' or 'orders'
  const [chartDisplayType, setChartDisplayType] = useState('area'); // 'area' | 'bar'
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  // Clock ticker for live relative time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Real-time live active kitchen orders across the cafe (NEVER filtered by date filter)
  const liveActiveOrders = useMemo(() => {
    return (orders || []).filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  }, [orders]);
  const liveActiveOrdersCount = liveActiveOrders.length;

  // Dynamic Metric Calculations based on real filtered orders & real time buckets from global dateRange
  const metrics = useMemo(() => {
    const targetOrders = dateRange === 'all' ? (orders.length > 0 ? orders : dashboardOrders) : dashboardOrders;
    const completedOrders = targetOrders.filter(o => o.status === 'completed');
    const activeOrders = targetOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const cancelledOrders = targetOrders.filter(o => o.status === 'cancelled');

    // Realized Gross Sales from Settled Orders (matches Reports Suite & Bills)
    const grossSales = completedOrders.reduce((sum, o) => sum + getOrderAmount(o), 0);
    const activePipelineSales = activeOrders.reduce((sum, o) => sum + getOrderAmount(o), 0);
    const totalOrdersCount = targetOrders.length;
    const avgTicket = completedOrders.length > 0 ? Math.round(grossSales / completedOrders.length) : (totalOrdersCount > 0 ? Math.round((grossSales + activePipelineSales) / totalOrdersCount) : 0);
    const netProfit = Math.round(grossSales * 0.42);

    const occupiedTablesList = tables.filter(t => {
      const rawNum = String(t.tableNumber || '').trim().toLowerCase();
      const numOnly = rawNum.replace(/[^0-9]/g, '');
      return activeOrders.some(o => {
        const orderTbl = String(o.tableNumber || o.table || '').trim().toLowerCase();
        const orderNumOnly = orderTbl.replace(/[^0-9]/g, '');
        return orderTbl === rawNum || (numOnly && orderNumOnly && numOnly === orderNumOnly) || orderTbl === `table ${numOnly}`;
      });
    });
    const occupiedTablesCount = occupiedTablesList.length;

    // Dynamic Time Buckets driven directly by global dashboard dateRange filter
    let timeBuckets = [];

    if (dateRange === 'this_week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      // Create buckets for each of the last 7 days ending today
      const now = new Date();
      timeBuckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(now.getDate() - (6 - i));
        const dayName = days[d.getDay()];
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
        return {
          label: `${dayName} (${dateStr})`,
          shortLabel: dayName,
          dateKey: d.toDateString(),
          revenue: 0,
          orders: 0
        };
      });

      targetOrders.forEach(o => {
        const d = o.createdAt ? new Date(o.createdAt) : new Date();
        const b = timeBuckets.find(bucket => bucket.dateKey === d.toDateString());
        if (b) {
          if (o.status === 'completed') {
            b.revenue += getOrderAmount(o);
          }
          if (o.status !== 'cancelled') {
            b.orders += 1;
          }
        }
      });
    } else if (dateRange === 'this_month') {
      timeBuckets = [
        { label: 'Week 1 (1-7)', shortLabel: 'W1', startD: 1, endD: 7, revenue: 0, orders: 0 },
        { label: 'Week 2 (8-14)', shortLabel: 'W2', startD: 8, endD: 14, revenue: 0, orders: 0 },
        { label: 'Week 3 (15-21)', shortLabel: 'W3', startD: 15, endD: 21, revenue: 0, orders: 0 },
        { label: 'Week 4 (22-31)', shortLabel: 'W4', startD: 22, endD: 31, revenue: 0, orders: 0 }
      ];

      targetOrders.forEach(o => {
        const d = o.createdAt ? new Date(o.createdAt) : new Date();
        const dateNum = d.getDate();
        const b = timeBuckets.find(bucket => dateNum >= bucket.startD && dateNum <= bucket.endD) || timeBuckets[timeBuckets.length - 1];
        if (b) {
          if (o.status === 'completed') {
            b.revenue += getOrderAmount(o);
          }
          if (o.status !== 'cancelled') {
            b.orders += 1;
          }
        }
      });
    } else if (dateRange === 'all') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const now = new Date();
      timeBuckets = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return {
          label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
          shortLabel: monthNames[d.getMonth()],
          year: d.getFullYear(),
          month: d.getMonth(),
          revenue: 0,
          orders: 0
        };
      });

      targetOrders.forEach(o => {
        const d = o.createdAt ? new Date(o.createdAt) : new Date();
        const b = timeBuckets.find(bucket => bucket.year === d.getFullYear() && bucket.month === d.getMonth());
        if (b) {
          if (o.status === 'completed') {
            b.revenue += getOrderAmount(o);
          }
          if (o.status !== 'cancelled') {
            b.orders += 1;
          }
        }
      });
    } else if (dateRange === 'custom') {
      if (customStartDate && customEndDate && customStartDate === customEndDate) {
        timeBuckets = [
          { label: '12:00 AM - 04:00 AM', shortLabel: '12:00 AM', startH: 0, endH: 3, revenue: 0, orders: 0 },
          { label: '04:00 AM - 08:00 AM', shortLabel: '04:00 AM', startH: 4, endH: 7, revenue: 0, orders: 0 },
          { label: '08:00 AM - 12:00 PM', shortLabel: '08:00 AM', startH: 8, endH: 11, revenue: 0, orders: 0 },
          { label: '12:00 PM - 04:00 PM', shortLabel: '12:00 PM', startH: 12, endH: 15, revenue: 0, orders: 0 },
          { label: '04:00 PM - 08:00 PM', shortLabel: '04:00 PM', startH: 16, endH: 19, revenue: 0, orders: 0 },
          { label: '08:00 PM - 11:59 PM', shortLabel: '08:00 PM', startH: 20, endH: 23, revenue: 0, orders: 0 }
        ];

        targetOrders.forEach(o => {
          const d = o.createdAt ? new Date(o.createdAt) : new Date();
          const hour = d.getHours();
          const amt = Number(o.total || o.totalAmount) || 0;
          const b = timeBuckets.find(bucket => hour >= bucket.startH && hour <= bucket.endH) || timeBuckets[timeBuckets.length - 1];
          b.revenue += amt;
          b.orders += 1;
        });
      } else {
        const s = customStartDate ? new Date(customStartDate) : new Date();
        const e = customEndDate ? new Date(customEndDate) : new Date();
        const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);

        if (diffDays <= 7) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          timeBuckets = Array.from({ length: diffDays }, (_, i) => {
            const d = new Date(s);
            d.setDate(s.getDate() + i);
            const dayName = days[d.getDay()];
            const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
            return {
              label: `${dayName} (${dateStr})`,
              shortLabel: `${d.getDate()}/${d.getMonth() + 1}`,
              dateKey: d.toDateString(),
              revenue: 0,
              orders: 0
            };
          });

          targetOrders.forEach(o => {
            const d = o.createdAt ? new Date(o.createdAt) : new Date();
            const b = timeBuckets.find(bucket => bucket.dateKey === d.toDateString());
            if (b) {
              b.revenue += Number(o.total || o.totalAmount) || 0;
              b.orders += 1;
            }
          });
        } else {
          timeBuckets = [
            { label: 'Period 1', shortLabel: 'P1', fraction: 0.25, revenue: 0, orders: 0 },
            { label: 'Period 2', shortLabel: 'P2', fraction: 0.5, revenue: 0, orders: 0 },
            { label: 'Period 3', shortLabel: 'P3', fraction: 0.75, revenue: 0, orders: 0 },
            { label: 'Period 4', shortLabel: 'P4', fraction: 1.0, revenue: 0, orders: 0 }
          ];
          const totalSpan = Math.max(1, e.getTime() - s.getTime());
          targetOrders.forEach(o => {
            const d = o.createdAt ? new Date(o.createdAt) : new Date();
            const progress = (d.getTime() - s.getTime()) / totalSpan;
            const bIndex = Math.min(3, Math.max(0, Math.floor(progress * 4)));
            timeBuckets[bIndex].revenue += Number(o.total || o.totalAmount) || 0;
            timeBuckets[bIndex].orders += 1;
          });
        }
      }
    } else {
      // Default: 'today' - 24-Hour Breakdown starting from 12:00 AM (Midnight)
      timeBuckets = [
        { label: '12:00 AM - 04:00 AM', shortLabel: '12:00 AM', startH: 0, endH: 3, revenue: 0, orders: 0 },
        { label: '04:00 AM - 08:00 AM', shortLabel: '04:00 AM', startH: 4, endH: 7, revenue: 0, orders: 0 },
        { label: '08:00 AM - 12:00 PM', shortLabel: '08:00 AM', startH: 8, endH: 11, revenue: 0, orders: 0 },
        { label: '12:00 PM - 04:00 PM', shortLabel: '12:00 PM', startH: 12, endH: 15, revenue: 0, orders: 0 },
        { label: '04:00 PM - 08:00 PM', shortLabel: '04:00 PM', startH: 16, endH: 19, revenue: 0, orders: 0 },
        { label: '08:00 PM - 11:59 PM', shortLabel: '08:00 PM', startH: 20, endH: 23, revenue: 0, orders: 0 }
      ];

      targetOrders.forEach(o => {
        const d = o.createdAt ? new Date(o.createdAt) : new Date();
        const hour = d.getHours();
        const amt = Number(o.total || o.totalAmount) || 0;
        const b = timeBuckets.find(bucket => hour >= bucket.startH && hour <= bucket.endH) || timeBuckets[timeBuckets.length - 1];
        b.revenue += amt;
        b.orders += 1;
      });
    }

    const maxBucketRev = Math.max(1, ...timeBuckets.map(b => b.revenue));
    const maxBucketOrd = Math.max(1, ...timeBuckets.map(b => b.orders));

    // Peak rush computation
    const peakBucket = [...timeBuckets].sort((a, b) => b.revenue - a.revenue)[0];
    const peakInsight = peakBucket && peakBucket.revenue > 0
      ? `🔥 Peak Rush: ${peakBucket.shortLabel} (₹${peakBucket.revenue.toLocaleString('en-IN')} • ${peakBucket.orders} orders)`
      : null;

    // Dynamic telemetry SVG points for 700x185 canvas
    const bucketCount = timeBuckets.length;
    const xCoords = timeBuckets.map((_, idx) => Math.round(30 + idx * ((700 - 60) / Math.max(1, bucketCount - 1))));

    const revPoints = timeBuckets.map((b, idx) => {
      const y = grossSales > 0 ? Math.round(155 - (b.revenue / maxBucketRev) * 115) : 155;
      return { x: xCoords[idx], y, val: b.revenue, orders: b.orders, label: b.label, shortLabel: b.shortLabel };
    });

    const ordPoints = timeBuckets.map((b, idx) => {
      const y = totalOrdersCount > 0 ? Math.round(155 - (b.orders / maxBucketOrd) * 115) : 155;
      return { x: xCoords[idx], y, val: b.orders, revenue: b.revenue, label: b.label, shortLabel: b.shortLabel };
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
    const revAreaPath = `${revPath} L ${xCoords[xCoords.length - 1]},170 L ${xCoords[0]},170 Z`;

    const ordPath = makeSvgPath(ordPoints);
    const ordAreaPath = `${ordPath} L ${xCoords[xCoords.length - 1]},170 L ${xCoords[0]},170 Z`;

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
      occupiedTablesCount,
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
      topItemName,
      topSellingItems,
      catList,
      peakInsight
    };
  }, [orders, dashboardOrders, items, tables, dateRange, customStartDate, customEndDate]);

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
      imageFile: null,
      variants: []
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (item) => {
    setEditingItem(item);
    const discount = item.discount || {};
    const itemVariants = Array.isArray(item.variants)
      ? item.variants.map(v => ({ name: v.name || '', price: v.price !== undefined ? String(v.price) : '' }))
      : [];
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
      imageFile: null,
      variants: itemVariants
    });
    setIsDrawerOpen(true);
  };

  const handleAddVariant = () => {
    setDrawerForm(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { name: '', price: '' }]
    }));
  };

  const handleUpdateVariant = (index, field, val) => {
    setDrawerForm(prev => {
      const updated = [...(prev.variants || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: val };
      }
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveVariant = (index) => {
    setDrawerForm(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index)
    }));
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

    // Variants validation & packaging
    let validVariants = [];
    if (drawerForm.variants && drawerForm.variants.length > 0) {
      for (let i = 0; i < drawerForm.variants.length; i++) {
        const v = drawerForm.variants[i];
        const vName = String(v.name || '').trim();
        const vPrice = Number(v.price);
        if (!vName && (v.price === '' || v.price === undefined)) {
          // Ignore completely blank row
          continue;
        }
        if (!vName) {
          toast.error(`Please provide a label name for variation #${i + 1}`);
          return;
        }
        if (isNaN(vPrice) || vPrice < 0) {
          toast.error(`Please enter a valid price for variation "${vName}"`);
          return;
        }
        validVariants.push({ name: vName, price: vPrice });
      }
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
      formData.append('variants', JSON.stringify(validVariants));

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
        variants: validVariants,
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

  const handleBulkSetAvailability = async (newAvailability) => {
    if (selectedItemIds.length === 0) return;
    const token = localStorage.getItem('token');
    setItems(prev => prev.map(it => selectedItemIds.includes(it._id) ? { ...it, available: newAvailability } : it));
    toast.success(`${selectedItemIds.length} dishes marked ${newAvailability ? 'In Stock' : 'Out of Stock'}`);
    for (const id of selectedItemIds) {
      if (token && !id.startsWith('dish_')) {
        try {
          await axios.put(`${API}/menu/${id}`, { isAvailable: newAvailability }, { headers: { 'x-auth-token': token } });
        } catch (e) { }
      }
    }
    setSelectedItemIds([]);
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

  // Filtered menu items with multi-dimension filtering and sorting
  const filteredMenuItems = useMemo(() => {
    return items.filter(item => {
      const matchesCat = itemMatchesCategory(item, selectedCategory, categories);
      const searchLower = menuSearchQuery.toLowerCase().trim();
      const matchesSearch = !searchLower ||
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower));

      const matchesDiet =
        dietaryFilter === 'all' ? true :
          dietaryFilter === 'veg' ? Boolean(item.isVeg) :
            !item.isVeg;

      const matchesStock =
        stockFilter === 'all' ? true :
          stockFilter === 'in-stock' ? Boolean(item.available) :
            !item.available;

      return matchesCat && matchesSearch && matchesDiet && matchesStock;
    }).sort((a, b) => {
      if (sortOption === 'low-to-high') return a.price - b.price;
      if (sortOption === 'high-to-low') return b.price - a.price;
      if (sortOption === 'discount') {
        const discA = a.discount?.isDiscounted ? (Number(a.discount?.value) || 0) : 0;
        const discB = b.discount?.isDiscounted ? (Number(b.discount?.value) || 0) : 0;
        return discB - discA;
      }
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [items, selectedCategory, categories, menuSearchQuery, dietaryFilter, stockFilter, sortOption]);

  // Category Manager Handlers (Add, Edit, Delete)
  const handleOpenAddCategoryModal = () => {
    setCategoryModalMode('add');
    setEditingCategoryData(null);
    setNewCatName('');
    setNewCatIcon('UtensilsCrossed');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategoryModal = (cat, e) => {
    if (e) e.stopPropagation();
    setCategoryModalMode('edit');
    setEditingCategoryData(cat);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon || 'UtensilsCrossed');
    setIsCategoryModalOpen(true);
  };

  const handleOpenDeleteCategoryModal = (cat, e) => {
    if (e) e.stopPropagation();
    if (cat.id === 'all') {
      toast.error('Cannot delete "All Items" master catalog tab');
      return;
    }
    setCategoryToDelete(cat);
  };

  const handleExecuteDeleteCategory = () => {
    if (!categoryToDelete) return;
    const catId = categoryToDelete.id;
    const catName = categoryToDelete.name || catId;

    const affectedDishes = items.filter(i => itemMatchesCategory(i, catId, categories));

    // Safely reassign all dishes belonging to this category to 'uncategorized' so they are NEVER lost
    setItems(prev => prev.map(item => {
      if (itemMatchesCategory(item, catId, categories) || item.category === catId || item.category === catName) {
        const updatedItem = { ...item, category: 'uncategorized' };
        if (item._id && !item._id.startsWith('dish_')) {
          const token = localStorage.getItem('token');
          axios.put(`${API}/menu/${item._id}`, { category: 'uncategorized' }, { headers: { 'x-auth-token': token } }).catch(e => {});
        }
        return updatedItem;
      }
      return item;
    }));

    const updated = categories.filter(c => c.id !== catId);
    setCategories(updated);
    localStorage.setItem('serviq_custom_categories', JSON.stringify(updated));
    if (selectedCategory === catId) {
      setSelectedCategory('all');
    }
    setCategoryToDelete(null);
    toast.success(`Category "${catName}" deleted. ${affectedDishes.length} dish(es) preserved in "All Items".`);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    const cleanName = newCatName.trim();
    if (!cleanName) {
      toast.error('Please enter a category name');
      return;
    }

    const selectedIconComp = CATEGORY_ICON_MAP[newCatIcon] || UtensilsCrossed;

    if (categoryModalMode === 'add') {
      const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (categories.some(c => c.id === id || c.name.toLowerCase() === cleanName.toLowerCase())) {
        toast.error('Category with this name already exists');
        return;
      }
      const newCat = {
        id,
        name: cleanName,
        icon: newCatIcon,
        Component: selectedIconComp,
        aliases: [id, cleanName.toLowerCase()],
        isCustom: true
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      localStorage.setItem('serviq_custom_categories', JSON.stringify(updated));
      setSelectedCategory(id);
      toast.success(`Category "${cleanName}" created!`);
    } else if (categoryModalMode === 'edit' && editingCategoryData) {
      const oldId = editingCategoryData.id;
      const oldName = editingCategoryData.name;

      const updated = categories.map(c => {
        if (c.id === editingCategoryData.id) {
          return {
            ...c,
            name: cleanName,
            icon: newCatIcon,
            Component: selectedIconComp,
            aliases: Array.from(new Set([...(c.aliases || []), cleanName.toLowerCase(), oldName.toLowerCase(), oldId]))
          };
        }
        return c;
      });
      setCategories(updated);
      localStorage.setItem('serviq_custom_categories', JSON.stringify(updated));

      // Reassign all dishes in this category to the new category name
      setItems(prev => prev.map(item => {
        if (itemMatchesCategory(item, oldId, categories) || item.category === oldId || item.category === oldName) {
          const updatedItem = { ...item, category: cleanName };
          if (item._id && !item._id.startsWith('dish_')) {
            const token = localStorage.getItem('token');
            axios.put(`${API}/menu/${item._id}`, { category: cleanName }, { headers: { 'x-auth-token': token } }).catch(e => {});
          }
          return updatedItem;
        }
        return item;
      }));

      toast.success(`Category renamed to "${cleanName}" and dishes updated!`);
    }
    setIsCategoryModalOpen(false);
    setNewCatName('');
  };

  const handleSaveTenantSettings = async (updatedSettings) => {
    const token = localStorage.getItem('token');
    const tid = tenantId || user?.tenantId || tenantInfo?._id;
    try {
      if (token && tid) {
        await axios.put(`${API}/tenants/${tid}`, updatedSettings, {
          headers: { 'x-auth-token': token }
        });
      }
    } catch (err) {
      console.log('API update tenant settings error:', err.message);
    }
    const logoToSave = updatedSettings.logo || updatedSettings.settings?.logo;
    if (logoToSave) {
      localStorage.setItem('restaurant_logo', logoToSave);
    }
    setTenantInfo(prev => {
      const prevSettings = prev?.settings || {};
      const newSettings = updatedSettings.settings || {};
      return {
        ...prev,
        ...updatedSettings,
        settings: {
          ...prevSettings,
          ...newSettings,
          enableEstimatedPrepTime: updatedSettings.enableEstimatedPrepTime !== undefined
            ? updatedSettings.enableEstimatedPrepTime
            : (newSettings.enableEstimatedPrepTime !== undefined ? newSettings.enableEstimatedPrepTime : prevSettings.enableEstimatedPrepTime),
          enableKhata: updatedSettings.enableKhata !== undefined
            ? updatedSettings.enableKhata
            : (newSettings.enableKhata !== undefined ? newSettings.enableKhata : prevSettings.enableKhata),
          operatingHours: updatedSettings.operatingHours || newSettings.operatingHours || prevSettings.operatingHours,
          logo: logoToSave || newSettings.logo || prevSettings.logo,
        },
        name: updatedSettings.name || updatedSettings.restaurantName || prev?.name,
        logo: logoToSave || prev?.logo,
        address: updatedSettings.address || updatedSettings.storeAddress || prev?.address,
        phone: updatedSettings.phone || updatedSettings.primaryPhone || prev?.phone,
        email: updatedSettings.email || updatedSettings.publicEmail || prev?.email,
        gstNumber: updatedSettings.gstNumber || prev?.gstNumber,
      };
    });
    toast.success('Restaurant configuration saved successfully!');
  };

  const restaurantDisplayName = tenantInfo?.name || user?.restaurantName || tenantInfo?.restaurantName || user?.tenantName || user?.name || "ServiQ";
  const restaurantLogo = tenantInfo?.logo || tenantInfo?.settings?.logo || user?.restaurantLogo || user?.logo || tenantInfo?.logoUrl || localStorage.getItem('restaurant_logo') || null;
  const restaurantInitials = restaurantDisplayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const ownerName = tenantInfo?.ownerName || user?.name || "Cafe Admin";
  const ownerAvatar = tenantInfo?.ownerImage || user?.avatar || user?.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100";

  return (
    <div className={styles.adminLayout}>
      <Toaster position="top-right" containerStyle={{ zIndex: 9999999 }} toastOptions={{ style: { zIndex: 9999999 } }} />

      {/* 1. FIXED LEFT SIDEBAR - ONLY RENDERED FOR ADMIN */}
      {isAdmin && (
        <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
          {/* Brand Header inside Top of Sidebar */}
          <div className={styles.sidebarHeader}>
            <div className={styles.brandTitleWrap} onClick={() => handleTabChange('dashboard')}>
              {restaurantLogo ? (
                <img
                  src={restaurantLogo}
                  alt="Restaurant Logo"
                  className={styles.tenantLogoImg}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fb = e.target.parentElement?.querySelector(`.${styles.brandIconSquare}`);
                    if (fb) fb.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={styles.brandIconSquare}
                style={restaurantLogo ? { display: 'none' } : {}}
              >
                {restaurantInitials || 'SQ'}
              </div>
              {!sidebarCollapsed && (
                <div className={styles.brandTextGroup}>
                  <span className={styles.brandTitle}>{restaurantDisplayName}</span>
                  <span className={styles.brandSub}>SERVIQ OS</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Navigation Section */}
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
              onClick={() => handleTabChange('dashboard')}
              title="Dashboard"
            >
              <LayoutDashboard size={18} /> {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'pos' ? styles.activeNavLink : ''}`}
              onClick={() => {
                setPosSelectedTable(null);
                handleTabChange('pos');
              }}
              title="POS Terminal & Tables"
            >
              <IndianRupee size={18} /> {!sidebarCollapsed && <span>POS Terminal</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'kds' ? styles.activeNavLink : ''}`}
              onClick={() => handleTabChange('kds')}
              title="Live Orders & KDS"
            >
              <ChefHat size={18} /> {!sidebarCollapsed && <span>Live Orders</span>}
              {!sidebarCollapsed && <span className={styles.navPill}>{liveActiveOrdersCount}</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'orders' ? styles.activeNavLink : ''}`}
              onClick={() => handleTabChange('orders')}
              title="All Orders Directory & Management"
            >
              <ShoppingBag size={18} /> {!sidebarCollapsed && <span>Orders</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'menu' ? styles.activeNavLink : ''}`}
              onClick={() => handleTabChange('menu')}
              title="Menu Management"
            >
              <UtensilsCrossed size={18} /> {!sidebarCollapsed && <span>Menu Management</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'qrcodes' ? styles.activeNavLink : ''}`}
              onClick={() => handleTabChange('qrcodes')}
              title="Table QR Codes"
            >
              <QrCode size={18} /> {!sidebarCollapsed && <span>Table QR Codes</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'crm' ? styles.activeNavLink : ''}`}
              onClick={() => handleTabChange('crm')}
              title="Customer Management & CRM"
            >
              <Users size={18} /> {!sidebarCollapsed && <span>Customer CRM</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'staff' ? styles.activeNavLink : ''}`}
              onClick={() => handleTabChange('staff')}
              title="Staff & Role Management"
            >
              <Users size={18} /> {!sidebarCollapsed && <span>Staff Management</span>}
            </button>
            <button
              className={`${styles.navLink} ${activeTab === 'reports' ? styles.activeNavLink : ''}`}
              onClick={() => handleTabChange('reports')}
              title="Reports & Analytics"
            >
              <BarChart3 size={18} /> {!sidebarCollapsed && <span>Reports Suite</span>}
            </button>
            {tenantInfo?.settings?.enableKhata && (
              <button
                className={`${styles.navLink} ${activeTab === 'khata' ? styles.activeNavLink : ''}`}
                onClick={() => handleTabChange('khata')}
                title="Customer Khata / Borrow Ledger"
              >
                <BookOpen size={18} /> {!sidebarCollapsed && <span>Khata Ledger</span>}
              </button>
            )}
            <button
              className={`${styles.navLink} ${activeTab === 'settings' ? styles.activeNavLink : ''}`}
              onClick={() => handleTabChange('settings')}
              title="Settings"
            >
              <Settings size={18} /> {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </div>

          {/* Sidebar Footer */}
          <div className={styles.sidebarFooter}>
            {!isStandalone && (
              <button
                type="button"
                className={styles.sidebarPwaBtn}
                onClick={promptInstall}
                title={isInstalled ? "SERVIQ App is Downloaded" : "Download & Install Admin App"}
                style={isInstalled ? { borderColor: '#86efac', background: '#f0fdf4', color: '#15803d', fontWeight: 700 } : {}}
              >
                {isInstalled ? <CheckCircle2 size={16} style={{ color: '#16a34a' }} /> : <Smartphone size={16} />}
                {!sidebarCollapsed && <span>{isInstalled ? 'App is Downloaded' : 'Download App'}</span>}
              </button>
            )}

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
      )}

      {/* 2. RIGHT CONTENT WRAPPER (TOP BAR + MAIN CONTENT BODY) */}
      <div className={`${styles.contentWrapper} ${!isAdmin ? styles.contentWrapperFull : ''}`}>
        {/* TOP GLOBAL BAR */}
        <header className={styles.topGlobalBar}>
          {!isAdmin ? (
            <div className={styles.staffNavbarLeft}>
              <div
                className={styles.staffBrandWrap}
                onClick={() => allowedTabs.length > 0 && handleTabChange(allowedTabs[0].id)}
              >
                {restaurantLogo ? (
                  <img
                    src={restaurantLogo}
                    alt="Restaurant Logo"
                    className={styles.tenantLogoImg}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className={styles.brandIconSquare}>
                    {restaurantInitials || 'SQ'}
                  </div>
                )}
                <div className={styles.brandTextGroup}>
                  <span className={styles.brandTitle}>{restaurantDisplayName}</span>
                  <span className={styles.brandSub}>SERVIQ OS</span>
                </div>
              </div>
            </div>
          ) : (
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
          )}

          {/* Staff Navigation Tabs in Navbar */}
          {!isAdmin && allowedTabs.length > 0 && (
            <nav className={styles.staffNavbarTabs}>
              {allowedTabs.map((t) => {
                const IconComponent = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (t.id === 'pos') setPosSelectedTable(null);
                      handleTabChange(t.id);
                    }}
                    className={`${styles.staffNavTabBtn} ${isActive ? styles.staffNavTabBtnActive : ''}`}
                    title={t.label}
                  >
                    <IconComponent size={15} />
                    <span>{t.label}</span>
                    {t.badge && liveActiveOrdersCount > 0 && (
                      <span className={styles.staffTabBadge}>{liveActiveOrdersCount}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right User Actions (User Identity Pill, Notifications, Support, Sign Out) */}
          <div className={styles.topBarRight}>
            {/* Logged in User Identity Badge */}
            <div className={styles.userProfilePill} title={`Signed in as ${userEmail} (${userRoleLabel})`}>
              <div className={styles.userAvatarCircle}>
                {userInitials}
              </div>
              <div className={styles.userMetaText}>
                <span className={styles.userEmailText}>{userEmail}</span>
                <span className={`${styles.userRoleBadge} ${isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeStaff}`}>
                  {userRoleLabel}
                </span>
              </div>
            </div>

            <button
              type="button"
              className={styles.iconCircleBtn}
              title="7-Day Notification History"
              onClick={handleOpenNotifications}
              style={{ position: 'relative' }}
            >
              <Bell size={18} />
              {unreadNotifsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 900,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              className={styles.supportBtn}
              onClick={() => setShowSupportModal(true)}
              title="Help & Support Ticket Desk"
            >
              <HelpCircle size={16} /> <span>Support</span>
            </button>

            {!isAdmin && (
              <button
                type="button"
                className={styles.staffSignOutBtn}
                onClick={() => logout()}
                title="Sign Out"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className={`${styles.mainContent} ${(activeTab === 'pos' || activeTab === 'kds' || activeTab === 'orders' || activeTab === 'crm') ? styles.mainContentFitScreen : ''}`}>
          {!hasAccessToCurrentTab ? (
            <div className={styles.accessRestrictedWrap}>
              <div className={styles.accessRestrictedCard}>
                <div className={styles.accessRestrictedIcon}>
                  <ShieldCheck size={32} />
                </div>
                <h3>Access Restricted</h3>
                <p>
                  You are signed in as <strong>{userRoleLabel}</strong> ({userEmail}). You do not have permission to access the <strong>{activeTab}</strong> section.
                </p>
                {allowedTabs.length > 0 && (
                  <button
                    type="button"
                    className={styles.goToPermittedBtn}
                    onClick={() => handleTabChange(allowedTabs[0].id)}
                  >
                    Go to {allowedTabs[0].label}
                  </button>
                )}
              </div>
            </div>
          ) : (
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
                {/* PWA Quick Install Banner - only shown when not standalone and not installed */}
                {/* {!isStandalone && !isInstalled && showPwaBanner && (
                  <div className={styles.pwaBannerCard}>
                    <div className={styles.pwaBannerLeft}>
                      <div className={styles.pwaBannerIcon}>
                        <Smartphone size={22} />
                      </div>
                      <div className={styles.pwaBannerText}>
                        <h4>Install SERVIQ Admin for Desktop & Mobile</h4>
                        <p>Run full-screen with offline POS billing, fast thermal receipt printing & zero-latency launch.</p>
                      </div>
                    </div>
                    <div className={styles.pwaBannerActions}>
                      <button
                        type="button"
                        className={styles.pwaBannerInstallBtn}
                        onClick={promptInstall}
                      >
                        <Download size={14} /> <span>Install App</span>
                      </button>
                      <button
                        type="button"
                        className={styles.pwaBannerDismissBtn}
                        onClick={() => setShowPwaBanner(false)}
                        title="Dismiss banner"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )} */}

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
                      <span className={`${styles.kpiPillBadge} ${liveActiveOrdersCount > 0 ? styles.kpiPillPositive : styles.kpiPillNeutral}`} title="Active orders in kitchen & dining floor">
                        {liveActiveOrdersCount} In Kitchen Queue
                      </span>
                    </div>
                    <div className={styles.kpiTitleGroup}>
                      <span className={styles.kpiCardTag}>
                        Total Orders ({dateRange === 'today' ? 'Today' : dateRange === 'this_week' ? 'This Week' : dateRange === 'this_month' ? 'This Month' : dateRange === 'all' ? 'All Time' : 'Filtered'})
                      </span>
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
                      <span>{isFilterLoading ? 'Updating count...' : `${metrics.completedOrders?.length || 0} completed • ${liveActiveOrdersCount} in kitchen`}</span>
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
                  <div className={styles.chartPanelCardModern} style={{ position: 'relative' }}>
                    {/* Top Bar with Title, Insight Chip & Controls */}
                    <div className={styles.chartTopBar}>
                      <div className={styles.chartTitleWrap}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0 }}>Revenue Velocity & Telemetry</h3>
                          {metrics.peakInsight && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 9px',
                              borderRadius: '100px',
                              background: '#ecfdf5',
                              color: '#059669',
                              border: '1px solid #d1fae5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              {metrics.peakInsight}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '3px 0 0 0' }}>
                          {dateRange === 'today' ? 'Real-time hourly telemetry for today' :
                            dateRange === 'this_week' ? '7-day daily telemetry breakdown' :
                              dateRange === 'this_month' ? '4-week monthly telemetry breakdown' :
                                dateRange === 'all' ? 'All-time monthly telemetry breakdown' :
                                  `Custom range telemetry (${customStartDate || ''} to ${customEndDate || ''})`}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Chart Style Toggle (Line vs Bars) */}
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: 2, border: '1px solid #e2e8f0' }}>
                          <button
                            type="button"
                            onClick={() => setChartDisplayType('area')}
                            title="Spline Line Chart"
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: chartDisplayType === 'area' ? '#ffffff' : 'transparent',
                              color: chartDisplayType === 'area' ? '#4f46e5' : '#64748b',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: chartDisplayType === 'area' ? '0 1px 3px rgba(79, 70, 229, 0.08)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Line
                          </button>
                          <button
                            type="button"
                            onClick={() => setChartDisplayType('bar')}
                            title="Column Bar Chart"
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: chartDisplayType === 'bar' ? '#ffffff' : 'transparent',
                              color: chartDisplayType === 'bar' ? '#4f46e5' : '#64748b',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: chartDisplayType === 'bar' ? '0 1px 3px rgba(79, 70, 229, 0.08)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Bars
                          </button>
                        </div>

                        {/* Metric Mode Switcher (Revenue vs Orders) */}
                        <div className={styles.chartModeSwitch} style={{ border: '1px solid #e2e8f0' }}>
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
                    </div>

                    {/* Chart Box with Floating Tooltip and SVG Engine */}
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
                            Loading Telemetry...
                          </span>
                        </div>
                      )}

                      {/* Floating Interactive Tooltip on Hover */}
                      {hoveredDataPoint && (
                        <div style={{
                          position: 'absolute',
                          left: `${Math.min(80, Math.max(10, (hoveredDataPoint.x / 700) * 100))}%`,
                          top: `${Math.max(10, (hoveredDataPoint.y / 185) * 100 - 35)}%`,
                          transform: 'translate(-50%, -100%)',
                          background: '#0f172a',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          pointerEvents: 'none',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                          zIndex: 20,
                          whiteSpace: 'nowrap'
                        }}>
                          <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: 2 }}>{hoveredDataPoint.label}</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ color: '#38bdf8', fontWeight: 800 }}>₹{hoveredDataPoint.revenue ? hoveredDataPoint.revenue.toLocaleString('en-IN') : (hoveredDataPoint.val || 0).toLocaleString('en-IN')}</span>
                            <span>•</span>
                            <span style={{ color: '#4ade80' }}>{hoveredDataPoint.orders !== undefined ? hoveredDataPoint.orders : hoveredDataPoint.val} Orders</span>
                          </div>
                        </div>
                      )}

                      {/* Empty Zero Sales State Banner */}
                      {metrics.grossSales === 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '38%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e2e8f0',
                          padding: '6px 16px',
                          borderRadius: '100px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: '#64748b',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          pointerEvents: 'none'
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                          Live Telemetry Ready • Graph streams with first order
                        </div>
                      )}

                      <svg
                        className={styles.svgHighTech}
                        viewBox="0 0 700 185"
                        preserveAspectRatio="none"
                        onMouseLeave={() => setHoveredDataPoint(null)}
                      >
                        <defs>
                          <linearGradient id="glowRevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.06" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="glowOrderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="barRevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#6366f1" />
                          </linearGradient>
                          <linearGradient id="barOrderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                        </defs>

                        {/* Background Grid Lines */}
                        <line x1="0" y1="35" x2="700" y2="35" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="75" x2="700" y2="75" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="115" x2="700" y2="115" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="155" x2="700" y2="155" stroke="#e2e8f0" strokeWidth="1.2" strokeDasharray={metrics.grossSales === 0 ? "4 4" : "none"} />

                        {/* BAR COLUMNS MODE */}
                        {chartDisplayType === 'bar' ? (
                          (chartMetricTab === 'revenue' ? metrics.revPoints : metrics.ordPoints)?.map((pt, i) => {
                            const barWidth = Math.min(38, 700 / (metrics.timeBuckets.length * 2.2));
                            const barHeight = Math.max(4, 155 - pt.y);
                            const isHovered = hoveredDataPoint && hoveredDataPoint.label === pt.label;

                            return (
                              <g
                                key={i}
                                style={{ cursor: 'pointer' }}
                                onMouseEnter={() => setHoveredDataPoint({
                                  ...pt,
                                  revenue: chartMetricTab === 'revenue' ? pt.val : pt.revenue,
                                  orders: chartMetricTab === 'orders' ? pt.val : pt.orders
                                })}
                              >
                                <rect
                                  x={pt.x - barWidth / 2}
                                  y={pt.y}
                                  width={barWidth}
                                  height={barHeight}
                                  rx="5"
                                  fill={pt.val > 0 ? (chartMetricTab === 'revenue' ? 'url(#barRevGrad)' : 'url(#barOrderGrad)') : '#f1f5f9'}
                                  opacity={isHovered ? 1 : 0.88}
                                  style={{ transition: 'all 0.2s ease' }}
                                />
                                {pt.val > 0 && (
                                  <text
                                    x={pt.x}
                                    y={pt.y - 6}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontWeight="700"
                                    fill="#475569"
                                  >
                                    {chartMetricTab === 'revenue' ? `₹${pt.val}` : pt.val}
                                  </text>
                                )}
                              </g>
                            );
                          })
                        ) : (
                          /* AREA SPLINE MODE */
                          chartMetricTab === 'revenue' ? (
                            <>
                              <path
                                d={metrics.revAreaPath}
                                fill="url(#glowRevGrad)"
                              />
                              <path
                                d={metrics.revPath}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              {metrics.revPoints?.map((pt, i) => (
                                <g
                                  key={i}
                                  style={{ cursor: 'pointer' }}
                                  onMouseEnter={() => setHoveredDataPoint({
                                    ...pt,
                                    revenue: pt.val,
                                    orders: pt.orders
                                  })}
                                >
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={hoveredDataPoint?.label === pt.label ? 7 : (pt.val > 0 ? 5 : 3.5)}
                                    fill="#3b82f6"
                                    stroke="#ffffff"
                                    strokeWidth="2.5"
                                    style={{ transition: 'all 0.15s ease' }}
                                  />
                                </g>
                              ))}
                            </>
                          ) : (
                            <>
                              <path
                                d={metrics.ordAreaPath}
                                fill="url(#glowOrderGrad)"
                              />
                              <path
                                d={metrics.ordPath}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                              {metrics.ordPoints?.map((pt, i) => (
                                <g
                                  key={i}
                                  style={{ cursor: 'pointer' }}
                                  onMouseEnter={() => setHoveredDataPoint({
                                    ...pt,
                                    revenue: pt.revenue,
                                    orders: pt.val
                                  })}
                                >
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={hoveredDataPoint?.label === pt.label ? 7 : (pt.val > 0 ? 5 : 3.5)}
                                    fill="#10b981"
                                    stroke="#ffffff"
                                    strokeWidth="2.5"
                                    style={{ transition: 'all 0.15s ease' }}
                                  />
                                </g>
                              ))}
                            </>
                          )
                        )}
                      </svg>

                      {/* Dynamic Bottom Time/Date Axis */}
                      <div className={styles.chartBottomAxis}>
                        {metrics.timeBuckets?.map((b, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontWeight: hoveredDataPoint?.label === b.label ? 800 : 600,
                              color: hoveredDataPoint?.label === b.label ? '#0f172a' : '#64748b',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={() => {
                              const pt = (chartMetricTab === 'revenue' ? metrics.revPoints : metrics.ordPoints)[idx];
                              if (pt) setHoveredDataPoint({ ...pt, revenue: pt.val || pt.revenue, orders: pt.orders || pt.val });
                            }}
                          >
                            {b.shortLabel}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Summary Metric Bar */}
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
                        <span className={styles.summaryStatLabel}>Occupied Floor</span>
                        <span className={styles.summaryStatVal} style={{ color: (metrics.occupiedTablesCount || 0) > 0 ? '#b45309' : '#059669' }}>
                          {isFilterLoading ? (
                            <Loader size={14} className={styles.spinIcon} color="#059669" />
                          ) : (metrics.occupiedTablesCount || 0) > 0 ? (
                            `${metrics.occupiedTablesCount}/${tables.length || 4} Tables Busy`
                          ) : (
                            'All Tables Free'
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
                          ● {liveActiveOrdersCount} Active
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
                      {liveActiveOrders.slice(0, 5).map((order) => {
                        const orderCode = order.orderNumber ? `#ORD-${order.orderNumber}` : `#${order._id?.slice(-5) || 'ORD'}`;
                        const totalAmt = Number(order.total || order.totalAmount) || 0;
                        const itemsCount = (order.items || []).reduce((s, it) => s + (it.quantity || 1), 0);
                        const tableText = order.tableNumber ? `Table ${order.tableNumber}` : 'Counter Walk-in';

                        return (
                          <div key={order._id} className={styles.liveTicketCard}>
                            <div className={styles.ticketHead}>
                              <span className={styles.ticketIdBadge}>{orderCode}</span>
                              <span className={`${styles.ticketStatusPill} ${order.status === 'completed'
                                ? styles.readyChip
                                : order.status === 'preparing'
                                  ? styles.prepChip
                                  : styles.deliveryChip
                                }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className={styles.ticketBody}>
                              <span>{tableText}</span>
                            </div>
                          </div>
                        );
                      })}

                      {liveActiveOrders.length === 0 && (
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
                  const occupiedTables = tables.filter(t => getActiveOrdersForTable(t).length > 0);
                  const availableTables = tables.filter(t => getActiveOrdersForTable(t).length === 0);
                  const billReadyTables = tables.filter(t => {
                    const tableOrds = getActiveOrdersForTable(t);
                    return tableOrds.length > 0 && tableOrds.every(o => o.paymentStatus === 'paid' || o.status === 'served');
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
                            onClick={() => {
                              setPosSelectedTable(null);
                              handleTabChange('pos');
                            }}
                            style={{
                              border: 'none',
                              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '11px',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                            }}
                          >
                            <Grid size={13} /> POS Terminal & Floor Plan →
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Grid of Real Tables (Petpooja Style: 3 Clean Colors) */}
                      {tables.length === 0 ? (
                        <TableMatrixSkeleton count={8} />
                      ) : (
                        <div className={styles.tableGridContainer}>
                          {previewTables.map((tbl) => {
                            const tableOrders = getActiveOrdersForTable(tbl);
                            const isOccupied = tableOrders.length > 0;
                            const isServed = isOccupied && tableOrders.every(o => o.paymentStatus === 'paid' || o.status === 'served');
                            const firstOrder = tableOrders[0];
                            const elapsedMins = firstOrder?.createdAt
                              ? Math.max(1, Math.round((new Date() - new Date(firstOrder.createdAt)) / 60000))
                              : 5;

                            const totalSum = tableOrders.reduce((s, o) => s + (Number(o.total || o.totalAmount) || 0), 0);
                            const orderTotal = Math.round(totalSum * 100) / 100;
                            const rawCustName = firstOrder?.customerDetails?.name || firstOrder?.customerName || '';

                            // 1. FREE / EMPTY CARD
                            if (!isOccupied) {
                              return (
                                <div
                                  key={tbl._id || tbl.tableNumber}
                                  onClick={() => {
                                    setPosSelectedTable(tbl.tableNumber);
                                    handleTabChange('pos');
                                  }}
                                  style={{
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '100px',
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    border: '1.5px dashed #cbd5e1',
                                    background: '#ffffff',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title={`Table ${tbl.tableNumber} - Clean & Ready. Click to take order.`}
                                >
                                  <span style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>{tbl.seatingCapacity || 4} Seats</span>
                                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', margin: '4px 0' }}>
                                    Table {tbl.tableNumber}
                                  </span>
                                  <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 700 }}>+ Take Order</span>
                                </div>
                              );
                            }

                            // 2. PAID / SERVED CARD (Soft Green)
                            if (isServed) {
                              return (
                                <div
                                  key={tbl._id || tbl.tableNumber}
                                  onClick={() => {
                                    setPosSelectedTable(tbl.tableNumber);
                                    handleTabChange('pos');
                                  }}
                                  style={{
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '100px',
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #10b981',
                                    background: '#ecfdf5',
                                    color: '#065f46',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.12)'
                                  }}
                                  title={`Table ${tbl.tableNumber} - All Orders Served/Paid. Click to open POS.`}
                                >
                                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#047857' }}>
                                    ✓ {elapsedMins} Min
                                  </div>
                                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#065f46', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {getCustomerFirstName(rawCustName, `Table ${tbl.tableNumber}`)}
                                  </span>
                                  {getCustomerFirstName(rawCustName) && (
                                    <span style={{ fontSize: '10px', color: '#047857', fontWeight: 700 }}>
                                      Table {tbl.tableNumber}
                                    </span>
                                  )}
                                  <strong style={{ fontSize: '12.5px', fontWeight: 800, color: '#047857' }}>₹{orderTotal.toLocaleString('en-IN')}</strong>
                                </div>
                              );
                            }

                            // 3. OCCUPIED / RUNNING CARD (Orange / Warm Amber)
                            return (
                              <div
                                key={tbl._id || tbl.tableNumber}
                                onClick={() => {
                                  setPosSelectedTable(tbl.tableNumber);
                                  handleTabChange('pos');
                                }}
                                style={{
                                  position: 'relative',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  minHeight: '100px',
                                  padding: '10px 12px',
                                  borderRadius: '12px',
                                  border: '1.5px solid #f59e0b',
                                  background: '#fef3c7',
                                  color: '#78350f',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.12)'
                                }}
                                title={`Table ${tbl.tableNumber} - Running Order ₹${orderTotal}. Click to open POS.`}
                              >
                                <div style={{ fontSize: '10px', fontWeight: 700, color: '#92400e' }}>
                                  ⏱️ {elapsedMins} Min
                                </div>
                                <span style={{ fontSize: '1rem', fontWeight: 900, color: '#78350f', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {getCustomerFirstName(rawCustName, `Table ${tbl.tableNumber}`)}
                                </span>
                                {getCustomerFirstName(rawCustName) && (
                                  <span style={{ fontSize: '10px', color: '#92400e', fontWeight: 700 }}>
                                    Table {tbl.tableNumber}
                                  </span>
                                )}
                                <strong style={{ fontSize: '12.5px', fontWeight: 800, color: '#92400e' }}>₹{orderTotal.toLocaleString('en-IN')}</strong>
                              </div>
                            );
                          })}

                          {/* 8th Position "View More" Interactive Card */}
                          {hasMoreTables && (
                            <div
                              onClick={() => {
                                setPosSelectedTable(null);
                                handleTabChange('pos');
                              }}
                              style={{
                                background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                                borderRadius: '12px',
                                border: '1.5px dashed #3b82f6',
                                padding: '10px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                cursor: 'pointer',
                                minHeight: '100px',
                                transition: 'all 0.2s ease'
                              }}
                              title="Click to view all tables in POS Terminal"
                            >
                              <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                                +{remainingCount} More
                              </span>
                              <span style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: 800, marginTop: 3 }}>
                                Open POS Floor →
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {displayTables.length === 0 && tables.length > 0 && (
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
                          {(selectedTableModal.activeOrder?.status === 'ready' || selectedTableModal.activeOrder?.status === 'served') ? (
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
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                await handleUpdateOrderStatus(selectedTableModal.activeOrder?._id, 'ready');
                              }}
                              style={{
                                flex: 1.4,
                                padding: '11px',
                                borderRadius: '10px',
                                border: 'none',
                                background: '#3b82f6',
                                color: '#ffffff',
                                fontWeight: 800,
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                              }}
                            >
                              🍽️ Mark as Served
                            </button>
                          )}
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
                        onClick={() => handleTabChange('menu')}
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
                    handleTabChange('pos');
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
                style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
              >
                <KOTMonitor
                  orders={orders}
                  onUpdateStatus={handleStatusUpdate}
                  onDeleteOrder={handleDeleteOrder}
                  enableEstimatedPrepTime={tenantInfo?.settings?.enableEstimatedPrepTime || false}
                />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 2.5 ALL ORDERS DIRECTORY & MANAGEMENT                     */}
            {/* ========================================================= */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
              >
                <OrdersManagement
                  orders={orders}
                  onUpdateStatus={handleUpdateOrderStatus}
                  onNavigateTab={handleTabChange}
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
                  {categories.map((cat) => {
                    const IconComp = getCategoryIconComponent(cat);
                    const isActive = selectedCategory === cat.id;
                    const count = cat.id === 'all'
                      ? items.length
                      : items.filter(i => itemMatchesCategory(i, cat.id, categories)).length;

                    return (
                      <div
                        key={cat.id}
                        className={`${styles.categoryPill} ${isActive ? styles.activeCategoryPill : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <IconComp size={15} />
                        <span>{cat.name}</span>
                        <span className={styles.catCountBadge}>{count}</span>

                        {cat.id !== 'all' && (
                          <div className={styles.categoryPillActions}>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditCategoryModal(cat, e)}
                              title={`Edit "${cat.name}" category`}
                              className={styles.catActionBtn}
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenDeleteCategoryModal(cat, e)}
                              title={`Delete "${cat.name}" category`}
                              className={`${styles.catActionBtn} ${styles.catDeleteBtn}`}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleOpenAddCategoryModal}
                    className={styles.addCategoryBtn}
                  >
                    <Plus size={14} /> Add Category
                  </button>
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
                        whileHover={{ y: -3 }}
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
                              {isSelected ? <CheckSquare size={16} color="#4f46e5" /> : <Square size={16} color="#ffffff" />}
                            </button>
                            <div className={styles.dishBadges}>
                              <span className={item.isVeg ? styles.vegPill : styles.nonVegPill}>
                                {item.isVeg ? '● VEG' : '▲ NON-VEG'}
                              </span>
                              {hasDiscount && (
                                <span style={{
                                  background: '#ef4444',
                                  color: '#ffffff',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '100px',
                                  letterSpacing: '0.03em'
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
                                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>₹{discountedPrice}</span>
                                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '4px' }}>₹{item.price}</span>
                                </div>
                              ) : (
                                <div className={styles.dishPrice}>
                                  {item.variants && item.variants.length > 0 ? `From ₹${Math.min(...item.variants.map(v => Number(v.price) || item.price))}` : `₹${item.price}`}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ marginTop: '1px', marginBottom: '1px', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                            {item.category === 'uncategorized' && (
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                                ⚠️ Uncategorized
                              </span>
                            )}
                            {item.variants && item.variants.length > 0 && (
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '1px 5px', borderRadius: '4px', border: '1px solid #c7d2fe' }}>
                                {item.variants.length} Sizes/Options
                              </span>
                            )}
                          </div>
                          <p className={styles.dishDescription}>{item.description}</p>

                          {/* Stock Toggle & Quick Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                            <div
                              onClick={() => handleToggleItemAvailability(item)}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
                              title={item.available ? "In Stock (Click to turn off)" : "Out of Stock (Click to turn on)"}
                            >
                              <div style={{
                                width: 28,
                                height: 16,
                                borderRadius: 100,
                                background: item.available ? '#10b981' : '#cbd5e1',
                                position: 'relative',
                                transition: 'background 0.2s ease'
                              }}>
                                <div style={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  background: '#ffffff',
                                  position: 'absolute',
                                  top: 2,
                                  left: item.available ? 14 : 2,
                                  transition: 'left 0.2s ease',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }} />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditDrawer(item)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '5px',
                                  border: '1px solid #e2e8f0',
                                  background: '#ffffff',
                                  color: '#334155',
                                  fontSize: '10.5px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit3 size={11} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmItem(item)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '5px',
                                  border: '1px solid #fee2e2',
                                  background: '#fef2f2',
                                  color: '#ef4444',
                                  fontSize: '10.5px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {filteredMenuItems.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1', marginTop: '1.5rem', display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
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
                style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
              >
                <POSTerminal
                  tenantId={tenantId}
                  tenantInfo={tenantInfo}
                  menuItems={items}
                  orders={orders}
                  initialTable={posSelectedTable}
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
                style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
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
                <QRCodeComponent orders={orders} initialTables={tables} />
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

            {/* ========================================================= */}
            {/* 9. STAFF & ROLE-BASED ACCESS CONTROL (RBAC)               */}
            {/* ========================================================= */}
            {activeTab === 'staff' && (
              <motion.div
                key="staff"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <StaffManager />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 10. REVENUE & FINANCIAL REPORTS SUITE                     */}
            {/* ========================================================= */}
            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ReportsSuite initialOrders={orders} />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 11. CUSTOMER KHATA & BORROW (UDHARI) LEDGER               */}
            {/* ========================================================= */}
            {activeTab === 'khata' && (
              <motion.div
                key="khata"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <KhataLedger />
              </motion.div>
            )}

          </AnimatePresence>
        )}
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
                    value={drawerForm.category || 'uncategorized'}
                    onChange={(e) => setDrawerForm({ ...drawerForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
                  >
                    <option value="uncategorized">-- Uncategorized (Assign Later) --</option>
                    {categories.filter(c => c.id !== 'all').map(c => (
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

              {/* Portion Sizes & Pricing Labels (Variants) */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (drawerForm.variants && drawerForm.variants.length > 0) ? '10px' : '4px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Layers size={14} color="#4f46e5" /> Portion Sizes & Custom Labels
                    </span>

                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid #c7d2fe',
                      background: '#eef2ff',
                      color: '#4f46e5',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={13} /> Add Label
                  </button>
                </div>

                {drawerForm.variants && drawerForm.variants.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {drawerForm.variants.map((variant, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#ffffff',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            placeholder="e.g. Regular / Large / Cheese"
                            value={variant.name}
                            onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          />
                        </div>
                        <div style={{ width: '95px' }}>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>₹</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              placeholder="Price"
                              value={variant.price}
                              onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                              style={{
                                width: '100%',
                                padding: '7px 8px 7px 20px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '12px',
                                fontWeight: 700
                              }}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            border: '1px solid #fee2e2',
                            background: '#fef2f2',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          title="Remove label"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                  </div>
                ) : (
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    No variation labels added. Base price (₹{drawerForm.price || '0'}) will apply for all orders.
                  </p>
                )}
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

      {/* PWA Install Guide Modal */}
      <PWAInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        deferredPrompt={deferredPrompt}
        isInstalled={isInstalled}
        isIOS={isIOS}
        isAndroid={isAndroid}
      />

      {/* Support Ticket Modal with optional screenshot upload */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        tenantInfo={tenantInfo}
      />

      {/* 7-DAY NOTIFICATION HISTORY SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {showNotificationsDrawer && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(3px)',
              zIndex: 99999,
              display: 'flex',
              justifyContent: 'flex-end'
            }}
            onClick={() => setShowNotificationsDrawer(false)}
          >
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '420px',
                height: '100%',
                backgroundColor: '#ffffff',
                boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Drawer Header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      Notifications
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                      Activity log of the last 7 days
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllNotifsRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotificationsDrawer(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
                {isLoadingNotifications ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                    <Loader size={24} className={styles.spinIcon} color="#2563eb" style={{ margin: '0 auto 10px auto' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Loading 7-day notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                    <Bell size={36} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#475569', fontWeight: 700 }}>
                      No notifications in the last 7 days
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                      New customer orders, KOT status transitions, and table settlements will appear here.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {notifications.map((notif) => {
                      const notifDate = new Date(notif.timestamp);
                      const isToday = notifDate.toDateString() === new Date().toDateString();
                      const readIds = JSON.parse(localStorage.getItem('serviq_read_notifs') || '[]');
                      const isUnread = !readIds.includes(notif.id);

                      let IconComp = Bell;
                      let iconColor = '#2563eb';
                      let iconBg = '#eff6ff';

                      if (notif.type === 'new_order') {
                        IconComp = ShoppingBag;
                        iconColor = '#4f46e5';
                        iconBg = '#eef2ff';
                      } else if (notif.type === 'preparing') {
                        IconComp = ChefHat;
                        iconColor = '#d97706';
                        iconBg = '#fef3c7';
                      } else if (notif.type === 'ready') {
                        IconComp = CheckCircle2;
                        iconColor = '#16a34a';
                        iconBg = '#dcfce7';
                      } else if (notif.type === 'completed') {
                        IconComp = Receipt;
                        iconColor = '#059669';
                        iconBg = '#ecfdf5';
                      }

                      return (
                        <div
                          key={notif.id}
                          onClick={() => {
                            const updated = Array.from(new Set([...readIds, notif.id]));
                            localStorage.setItem('serviq_read_notifs', JSON.stringify(updated));
                            setUnreadNotifsCount(prev => Math.max(0, prev - 1));
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: isUnread ? '1.5px solid #bfdbfe' : '1px solid #e2e8f0',
                            backgroundColor: isUnread ? '#f8faff' : '#ffffff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}
                        >
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '10px',
                            background: iconBg,
                            color: iconColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2
                          }}>
                            <IconComp size={17} />
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                color: '#0f172a',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {notif.title}
                              </h4>
                              {isUnread && (
                                <span style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  background: '#2563eb',
                                  flexShrink: 0,
                                  marginTop: 4
                                }} />
                              )}
                            </div>

                            <p style={{
                              margin: '3px 0 6px 0',
                              fontSize: '0.78rem',
                              color: '#475569',
                              lineHeight: 1.4
                            }}>
                              {notif.message}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
                              <span>
                                {isToday
                                  ? `Today at ${notifDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                  : notifDate.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                              {notif.amount > 0 && (
                                <strong style={{ color: '#0f172a', fontWeight: 800 }}>
                                  ₹{notif.amount}
                                </strong>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div style={{
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
                color: '#64748b'
              }}>
                <span>Total: {notifications.length} events logged</span>
                <button
                  type="button"
                  onClick={() => {
                    fetchNotifications();
                    toast.success('Notifications refreshed');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Manager Modal (Add / Edit Category) */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              style={{ position: 'relative', width: '92%', maxWidth: '480px', background: '#ffffff', borderRadius: '18px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', zIndex: 10 }}
            >
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {categoryModalMode === 'add' ? <Plus size={18} /> : <Edit3 size={18} />}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    {categoryModalMode === 'add' ? 'Add New Category' : `Edit Category: ${editingCategoryData?.name || ''}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  style={{ border: 'none', background: '#f1f5f9', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} style={{ padding: '20px 24px' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Starters, Milkshakes, Coolers, Breads"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none', fontWeight: 600, color: '#0f172a' }}
                  />
                  <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                    {categoryModalMode === 'edit'
                      ? 'Renaming will automatically update all existing dishes linked to this category.'
                      : 'This category will appear across your Menu Catalog, POS Terminal, and Table QR Menus.'}
                  </p>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Select Category Icon
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {AVAILABLE_CATEGORY_ICONS.map((iconItem) => {
                      const IconComponent = iconItem.Component;
                      const isSelected = newCatIcon === iconItem.id;
                      return (
                        <button
                          key={iconItem.id}
                          type="button"
                          onClick={() => setNewCatIcon(iconItem.id)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            padding: '8px 4px',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                            background: isSelected ? '#eef2ff' : '#f8fafc',
                            color: isSelected ? '#4f46e5' : '#64748b',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <IconComponent size={18} />
                          <span style={{ fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                            {iconItem.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '9px 22px', borderRadius: '10px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {categoryModalMode === 'add' ? <Plus size={14} /> : <Check size={14} />}
                    {categoryModalMode === 'add' ? 'Create Category' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Delete Confirmation Modal */}
      <AnimatePresence>
        {categoryToDelete && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCategoryToDelete(null)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              style={{ position: 'relative', width: '92%', maxWidth: '440px', background: '#ffffff', borderRadius: '18px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', zIndex: 10, padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                    Delete Category?
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Category: <strong style={{ color: '#0f172a' }}>{categoryToDelete.name}</strong>
                  </p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 16px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                {(() => {
                  const affectedCount = items.filter(i => itemMatchesCategory(i, categoryToDelete.id, categories)).length;
                  if (affectedCount > 0) {
                    return (
                      <div>
                        ⚠️ <strong>{affectedCount} dish(es)</strong> in this category will be preserved safely in <strong>"All Items"</strong> as Uncategorized. You can reassign them anytime.
                      </div>
                    );
                  }
                  return <div>This category has 0 dishes and will be safely removed from your menu.</div>;
                })()}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDeleteCategory}
                  style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)' }}
                >
                  <Trash2 size={14} /> Delete Category
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating 105B AI Copilot & Real-Time Issue Desk */}
      <CafeAICopilotChatbot tenantInfo={tenantInfo} />

    </div>
  );
}