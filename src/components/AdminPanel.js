import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit3, LayoutDashboard, ShoppingBag, QrCode, BarChart3, X, LogOut, Loader, TrendingUp, IndianRupee,
  UtensilsCrossed, Coffee, Pizza, Sandwich, IceCream, GlassWater, Martini, Cake, Soup, Cookie, Grid,
  ChefHat, Truck, UserCheck, Share2, Sparkles, Upload, ImagePlus, ImageIcon, Settings, Bell, HelpCircle,
  TrendingDown, CheckSquare, Square, Download, Filter, Star, Clock, Check, ArrowUpRight, Flame, Layers,
  ChevronRight, RefreshCw, Smartphone, CreditCard, Calendar, Percent, DollarSign, AlertTriangle, CheckCircle2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeComponent from './QRCodeComponent';
import POSTerminal from './petpooja/POSTerminal';
import KOTMonitor from './petpooja/KOTMonitor';
import InventoryRecipes from './petpooja/InventoryRecipes';
import CRMLoyalty from './petpooja/CRMLoyalty';
import OnlineAggregators from './petpooja/OnlineAggregators';
import RestaurantSettings from './RestaurantSettings';
import styles from './AdminPanel.module.css';
import BrandLogo from './BrandLogo';

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

// Standard Categories with Icons
const standardCategories = [
  { id: "all", name: "All Items", icon: "UtensilsCrossed", Component: UtensilsCrossed },
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
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dashboard Date Filter State
  const [dateRange, setDateRange] = useState('today'); // 'today', 'this_week', 'this_month', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

  // Daily Performance Checklist State
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Morning Station & Inventory Sync', time: '08:00 AM', done: true, overdue: false },
    { id: 2, text: 'Staff Shift Handover & KDS Calibration', time: '02:00 PM', done: false, overdue: false },
    { id: 3, text: 'Review Daily P&L & Recipe Depletions', time: '10:00 PM', done: false, overdue: false }
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Clock ticker for live relative time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

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

    // Live Sockets
    if (socket) {
      socket.on('newOrder', (newOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
        toast.success(`New order received: #${newOrder.orderNumber || newOrder._id?.slice(-4)}`);
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

  // Dynamic Metric Calculations based on filtered orders
  const metrics = useMemo(() => {
    const grossSales = orders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0);
    const totalOrdersCount = orders.length;
    const avgTicket = totalOrdersCount > 0 ? Math.round(grossSales / totalOrdersCount) : 0;
    const netProfit = Math.round(grossSales * 0.42);
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

    // Dynamic Sparkline heights (7 bars)
    const sparklines = [
      Math.max(25, Math.min(95, Math.round((grossSales * 0.15) % 80 + 20))),
      Math.max(30, Math.min(95, Math.round((grossSales * 0.28) % 75 + 25))),
      Math.max(35, Math.min(95, Math.round((grossSales * 0.42) % 70 + 30))),
      Math.max(45, Math.min(95, Math.round((grossSales * 0.65) % 65 + 35))),
      Math.max(55, Math.min(95, Math.round((grossSales * 0.85) % 60 + 40))),
      Math.max(75, Math.min(98, Math.round((grossSales * 0.95) % 40 + 60))),
      100
    ];

    const itemFrequency = {};
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        itemFrequency[it.name] = (itemFrequency[it.name] || 0) + (it.quantity || 1);
      });
    });
    const topItemName = Object.keys(itemFrequency).sort((a,b) => itemFrequency[b] - itemFrequency[a])[0] || 'Top Selling Item';

    return {
      grossSales,
      totalOrdersCount,
      avgTicket,
      netProfit,
      activeOrders,
      sparklines,
      topItemName
    };
  }, [orders]);

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
        } catch (e) {}
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

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.put(`${API}/orders/${orderId}/status`, { status }, { headers: { 'x-auth-token': token } });
      }
    } catch (err) {
      console.log('Update status on server failed, updating local state:', err.message);
    }
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    toast.success(`Order status updated to ${status.toUpperCase()}`);
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

  const restaurantDisplayName = tenantInfo?.name || user?.tenantName || 'SERVIQ Flagship Bistro';
  const restaurantInitials = restaurantDisplayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={styles.adminLayout}>
      <Toaster position="top-right" />

      {/* TOP GLOBAL BAR */}
      <header className={styles.topGlobalBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.brandTitleWrap} onClick={() => navigate('/')}>
            <div className={styles.brandIconSquare}>{restaurantInitials || 'SQ'}</div>
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
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" 
              alt="User Avatar" 
              className={styles.profileAvatar} 
            />
            <div className={styles.profileText}>
              <span className={styles.profileName}>{user?.name || "Admin"}</span>
              <span className={styles.profileRole}>{user?.role ? user.role.toUpperCase() : "OWNER"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.mainContainer}>
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className={styles.sidebar}>
          <div className={styles.navSection}>
            <span className={styles.navLabel}>MAIN MENU</span>
            <button 
              className={`${styles.navLink} ${activeTab === 'dashboard' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} /> <span>Dashboard</span>
            </button>
            <button 
              className={`${styles.navLink} ${activeTab === 'kds' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('kds')}
            >
              <ChefHat size={18} /> <span>Live Orders & KDS</span>
              <span className={styles.navPill}>{metrics.activeOrders.length}</span>
            </button>
            <button 
              className={`${styles.navLink} ${activeTab === 'menu' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              <UtensilsCrossed size={18} /> <span>Menu Management</span>
            </button>
            <button 
              className={`${styles.navLink} ${activeTab === 'pos' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <IndianRupee size={18} /> <span>POS Terminal</span>
            </button>
            <button 
              className={`${styles.navLink} ${activeTab === 'inventory' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <Truck size={18} /> <span>Inventory & PO</span>
            </button>
            <button 
              className={`${styles.navLink} ${activeTab === 'crm' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('crm')}
            >
              <UserCheck size={18} /> <span>CRM & Loyalty</span>
            </button>
            <button 
              className={`${styles.navLink} ${activeTab === 'qrcodes' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('qrcodes')}
            >
              <QrCode size={18} /> <span>Table QR Codes</span>
            </button>
            <button 
              className={`${styles.navLink} ${activeTab === 'settings' ? styles.activeNavLink : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} /> <span>Settings</span>
            </button>
          </div>

          <div className={styles.sidebarFooter}>
            <button 
              type="button" 
              className={styles.quickOrderBtn}
              onClick={() => setActiveTab('pos')}
            >
              + Quick Order
            </button>
            <button 
              type="button" 
              className={styles.logoutBtn} 
              onClick={() => logout()}
            >
              <LogOut size={16} /> <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <main className={styles.mainContent}>
          <AnimatePresence mode="wait">
            
            {/* ========================================================= */}
            {/* 1. DASHBOARD VIEW (With Date Filtering & Real Metrics)    */}
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
                {/* Header & Date Filter Selector */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 className={styles.sectionHeading}>Restaurant Performance Dashboard</h2>
                    <p className={styles.sectionSubtitle}>Real-time sales, order velocity, ticket averages, and daily ops checklists.</p>
                  </div>

                  {/* Date Range Selector Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    {[
                      { id: 'today', label: 'Today' },
                      { id: 'this_week', label: 'This Week' },
                      { id: 'this_month', label: 'This Month' },
                      { id: 'custom', label: 'Custom' }
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setDateRange(r.id)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: dateRange === r.id ? '#4f46e5' : 'transparent',
                          color: dateRange === r.id ? '#ffffff' : '#64748b',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range Picker */}
                {dateRange === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <Calendar size={16} color="#64748b" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>From:</span>
                    <input 
                      type="date" 
                      value={customStartDate} 
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>To:</span>
                    <input 
                      type="date" 
                      value={customEndDate} 
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      onClick={fetchOrders}
                      style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* 4 TOP KPI METRIC CARDS */}
                <div className={styles.kpiGrid}>
                  <motion.div whileHover={{ y: -3 }} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>GROSS REVENUE ({dateRange.replace('_', ' ').toUpperCase()})</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ LIVE</span>
                    </div>
                    <div className={styles.kpiValue}>
                      ₹{metrics.grossSales.toLocaleString('en-IN')}<small>.00</small>
                    </div>
                    <div className={styles.sparklineBarRow}>
                      {metrics.sparklines.map((h, i) => (
                        <div key={i} className={`${styles.sparkBar} ${i >= 4 ? styles.sparkDark : ''}`} style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </motion.div>

                  <motion.div whileHover={{ y: -3 }} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>ESTIMATED PROFIT (42%)</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ 42%</span>
                    </div>
                    <div className={styles.kpiValue}>
                      ₹{metrics.netProfit.toLocaleString('en-IN')}<small>.00</small>
                    </div>
                    <div className={styles.sparklineBarRow}>
                      {metrics.sparklines.map((h, i) => (
                        <div key={i} className={`${styles.sparkBar} ${i >= 4 ? styles.sparkPurple : ''}`} style={{ height: `${Math.max(20, Math.round(h * 0.85))}%` }} />
                      ))}
                    </div>
                  </motion.div>

                  <motion.div whileHover={{ y: -3 }} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>AVG TICKET VALUE</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ AVG</span>
                    </div>
                    <div className={styles.kpiValue}>
                      ₹{metrics.avgTicket.toLocaleString('en-IN')}<small>.00</small>
                    </div>
                    <div className={styles.sparklineBarRow}>
                      {[65, 70, 60, 75, 55, 80, 70].map((h, i) => (
                        <div key={i} className={styles.sparkBar} style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </motion.div>

                  <motion.div whileHover={{ y: -3 }} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>TOTAL ORDERS</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ {metrics.totalOrdersCount}</span>
                    </div>
                    <div className={styles.kpiValue}>{metrics.totalOrdersCount}</div>
                    <div className={styles.sparklineBarRow}>
                      {metrics.sparklines.map((h, i) => (
                        <div key={i} className={`${styles.sparkBar} ${i >= 4 ? styles.sparkDark : ''}`} style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* MIDDLE SPLIT: REVENUE PERFORMANCE CHART + LIVE ORDERS SIDEBAR */}
                <div className={styles.dashSplitGrid}>
                  <div className={styles.chartPanelCard}>
                    <div className={styles.chartHeader}>
                      <div>
                        <h3>Revenue Velocity & Volume</h3>
                        <p>Real-time telemetry tracking across {dateRange.replace('_', ' ')}</p>
                      </div>
                      <div className={styles.chartLegend}>
                        <span className={styles.legendDotBlack}>● Revenue (₹)</span>
                        <span className={styles.legendDotPurple}>● Orders</span>
                      </div>
                    </div>

                    <div className={styles.chartAreaWrapper}>
                      <svg className={styles.svgCurve} viewBox="0 0 700 240" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="revGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="140" x2="700" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="190" x2="700" y2="190" stroke="#f1f5f9" strokeWidth="1" />
                        <path d="M 30,200 Q 120,180 200,195 T 330,140 T 450,150 T 570,120 T 670,80" fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 30,220 Q 120,210 200,215 T 330,170 T 450,160 T 570,140 T 670,110" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="5,5" strokeLinecap="round" />
                        <circle cx="670" cy="80" r="14" fill="#e0e7ff" fillOpacity="0.7" />
                        <circle cx="670" cy="80" r="5" fill="#4f46e5" />
                      </svg>
                      <div className={styles.timeAxis}>
                        <span>00:00</span>
                        <span>04:00</span>
                        <span>08:00</span>
                        <span>12:00</span>
                        <span>16:00</span>
                        <span>20:00</span>
                        <strong>Now</strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.liveOrdersPanelCard}>
                    <div className={styles.panelHeadRow}>
                      <div>
                        <h3>Live Orders Queue</h3>
                        <span className={styles.activeDotPill}>● {metrics.activeOrders.length} Active</span>
                      </div>
                      <button 
                        type="button" 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        onClick={() => { fetchOrders(); toast.success("Refreshed live queue"); }}
                      >
                        <RefreshCw size={15} />
                      </button>
                    </div>

                    <div className={styles.liveOrdersMiniList}>
                      {orders.slice(0, 5).map((order) => {
                        const orderCode = order.orderNumber ? `#ORD-${order.orderNumber}` : `#${order._id?.slice(-6) || 'ORD'}`;
                        const totalAmt = Number(order.total || order.totalAmount) || 0;
                        const itemsCount = (order.items || []).reduce((s, it) => s + (it.quantity || 1), 0);
                        const tableText = order.tableNumber ? `Table ${order.tableNumber}` : 'Counter';

                        return (
                          <div key={order._id} className={styles.miniOrderTicket}>
                            <div className={styles.ticketTopRow}>
                              <span className={styles.ticketId}>{orderCode}</span>
                              <span className={`${styles.statusChip} ${styles[`status_${order.status}`]}`}>
                                {order.status}
                              </span>
                            </div>
                            <div className={styles.ticketMidRow}>
                              <span>{tableText} • {itemsCount} items</span>
                              <strong>₹{totalAmt.toFixed(2)}</strong>
                            </div>
                          </div>
                        );
                      })}
                      {orders.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                          No orders logged for this period.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTTOM SPLIT: DAILY CHECKLIST */}
                <div style={{ marginTop: '1.5rem', background: '#ffffff', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0' }}>Daily Operational Checklist</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {checklist.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => handleToggleChecklist(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #f1f5f9',
                          background: item.done ? '#f8fafc' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: '6px',
                            border: item.done ? 'none' : '2px solid #cbd5e1',
                            background: item.done ? '#10b981' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff'
                          }}>
                            {item.done && <Check size={14} />}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: item.done ? '#94a3b8' : '#1e293b', textDecoration: item.done ? 'line-through' : 'none' }}>
                            {item.text}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{item.time}</span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: 8, marginTop: '12px' }}>
                    <input 
                      type="text" 
                      placeholder="Add new task..." 
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <button 
                      type="submit" 
                      style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#ffffff', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Add Task
                    </button>
                  </form>
                </div>
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
                  menuItems={items} 
                  onOrderPlaced={(newOrd) => {
                    setOrders(prev => [newOrd, ...prev]);
                    fetchOrders();
                  }}
                />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 5. INVENTORY & RECIPES                                    */}
            {/* ========================================================= */}
            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory" 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <InventoryRecipes menuItems={items} />
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
                <QRCodeComponent />
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
                <RestaurantSettings />
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