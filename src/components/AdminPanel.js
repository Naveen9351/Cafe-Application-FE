import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit3, LayoutDashboard, ShoppingBag, QrCode, BarChart3, X, LogOut, Loader, TrendingUp, IndianRupee,
  UtensilsCrossed, Coffee, Pizza, Sandwich, IceCream, GlassWater, Martini, Cake, Soup, Cookie, Grid,
  ChefHat, Truck, UserCheck, Share2, Sparkles, Upload, ImagePlus, ImageIcon, Settings, Bell, HelpCircle,
  TrendingDown, CheckSquare, Square, Download, Filter, Star, Clock, Check, ArrowUpRight, Flame, Layers
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

// Available Categories with Icons
const availableCategories = [
  { id: "all", name: "All Items", icon: "UtensilsCrossed", Component: UtensilsCrossed },
  { id: "appetizers", name: "Appetizers", count: 12, icon: "Cookie", Component: Cookie },
  { id: "main-courses", name: "Main Courses", count: 24, icon: "UtensilsCrossed", Component: UtensilsCrossed },
  { id: "desserts", name: "Desserts", count: 8, icon: "Cake", Component: Cake },
  { id: "beverages", name: "Beverages", count: 15, icon: "GlassWater", Component: GlassWater },
  { id: "burger", name: "Burgers & Sandwiches", count: 9, icon: "Sandwich", Component: Sandwich },
  { id: "pizza", name: "Artisan Pizza", count: 7, icon: "Pizza", Component: Pizza },
  { id: "coffee", name: "Specialty Coffee", count: 11, icon: "Coffee", Component: Coffee },
];

// Rich default dishes for gourmet presentation
const defaultGourmetItems = [
  {
    _id: 'item_1',
    name: 'Wagyu Truffle Burger',
    description: 'Premium wagyu beef patty, black truffle oil, fontina cheese, and arugula on a toasted brioche bun.',
    price: 28.00,
    basePrice: 32.00,
    category: 'main-courses',
    isVeg: false,
    isRecommended: true,
    prepTime: '15-20 min',
    rating: 4.9,
    available: true,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600'
  },
  {
    _id: 'item_2',
    name: 'Classic Pomodoro',
    description: 'Handmade fettuccine tossed in a slow-simmered San Marzano tomato sauce with fresh basil and aged parmesan.',
    price: 19.50,
    basePrice: 19.50,
    category: 'main-courses',
    isVeg: true,
    isRecommended: false,
    prepTime: '12-15 min',
    rating: 4.7,
    available: true,
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=600'
  },
  {
    _id: 'item_3',
    name: 'Grilled Norwegian Salmon',
    description: 'Sustainable Atlantic salmon, charcoal-grilled, served with seasonal asparagus and lemon beurre blanc.',
    price: 34.00,
    basePrice: 34.00,
    category: 'main-courses',
    isVeg: false,
    isRecommended: false,
    prepTime: '20-25 min',
    rating: 4.8,
    available: false, // Out of Stock demonstration
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=600'
  },
  {
    _id: 'item_4',
    name: 'Crispy Truffle Calamari',
    description: 'Lightly dusted tender calamari served with charred lemon and house-made roasted garlic aioli dip.',
    price: 16.50,
    basePrice: 18.00,
    category: 'appetizers',
    isVeg: false,
    isRecommended: true,
    prepTime: '10-12 min',
    rating: 4.9,
    available: true,
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&q=80&w=600'
  },
  {
    _id: 'item_5',
    name: 'Burrata Caprese Salad',
    description: 'Creamy pugliese burrata, heirloom cherry tomatoes, cold-pressed olive oil, aged balsamic, and toasted sourdough.',
    price: 17.00,
    basePrice: 17.00,
    category: 'appetizers',
    isVeg: true,
    isRecommended: false,
    prepTime: '8-10 min',
    rating: 4.6,
    available: true,
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&q=80&w=600'
  },
  {
    _id: 'item_6',
    name: 'Valrhona Chocolate Fondant',
    description: 'Molten dark chocolate lava cake served warm with Madagascar vanilla bean gelato and berry coulis.',
    price: 14.00,
    basePrice: 14.00,
    category: 'desserts',
    isVeg: true,
    isRecommended: true,
    prepTime: '12-14 min',
    rating: 5.0,
    available: true,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600'
  }
];

export const getValidFoodImage = (item) => {
  const img = item?.image;
  if (img && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/uploads'))) {
    return img;
  }
  if (item?.name) {
    return `https://image.pollinations.ai/prompt/gourmet%20dish%20of%20${encodeURIComponent(item.name)}%20restaurant%20plating?width=600&height=400&nologo=true`;
  }
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';
};

function AdminPanel() {
  const { user, tenantId, socket, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'menu', 'kds', 'pos', 'inventory', 'crm', 'aggregators', 'settings', 'qrcodes'
  const [items, setItems] = useState(defaultGourmetItems);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);

  // Menu Management State
  const [selectedCategory, setSelectedCategory] = useState('main-courses');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('low-to-high');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Drawer Form State
  const [drawerForm, setDrawerForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    salePrice: '',
    category: 'main-courses',
    isVeg: false,
    isRecommended: false,
    available: true,
    image: ''
  });

  // Daily Performance Checklist State
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Morning Inventory Sync', time: '06:00 AM', done: true, overdue: false },
    { id: 2, text: 'Staff Shift Handover', time: '14:00 PM', done: false, overdue: true },
    { id: 3, text: 'Review Nightly Closure Reports', time: '10:00 PM', done: false, overdue: false }
  ]);

  // QR Code State
  const [qrCount, setQrCount] = useState(10);
  const [generatedQrs, setGeneratedQrs] = useState(10);

  useEffect(() => {
    if (!user || !tenantId) return;
    const token = localStorage.getItem('token');

    // Fetch Tenant Info
    axios.get(`${API}/tenants/public/${tenantId}`)
      .then((res) => setTenantInfo(res.data))
      .catch((err) => console.error(err));

    // Fetch Menu Items from API, merge with defaults if empty
    axios.get(`${API}/menu?tenantId=${tenantId}`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const enriched = res.data.map(d => ({
            ...d,
            salePrice: d.price,
            basePrice: d.basePrice || d.price,
            category: d.category || 'main-courses',
            prepTime: d.prepTime || '15-20 min',
            rating: d.rating || 4.8,
            available: d.available !== undefined ? d.available : true,
            isVeg: d.isVeg || false,
            isRecommended: d.isRecommended || false
          }));
          setItems(enriched);
        }
      })
      .catch((err) => console.error('Fetch menu error:', err));

    // Fetch Orders
    axios.get(`${API}/orders`, { headers: { 'x-auth-token': token } })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err));

    // Fetch Analytics
    axios.get(`${API}/orders/analytics`, { headers: { 'x-auth-token': token } })
      .then(res => setAnalytics(res.data))
      .catch(err => console.error(err));

    // Sockets
    if (socket) {
      socket.on('newOrder', (newOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
        toast.success("New Order Received!");
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
  }, [user, tenantId, socket]);

  // Handlers for Drawer & Menu Items
  const handleOpenAddDrawer = () => {
    setEditingItem(null);
    setDrawerForm({
      name: '',
      description: '',
      basePrice: '',
      salePrice: '',
      category: selectedCategory === 'all' ? 'main-courses' : selectedCategory,
      isVeg: false,
      isRecommended: false,
      available: true,
      image: ''
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (item) => {
    setEditingItem(item);
    setDrawerForm({
      name: item.name,
      description: item.description || '',
      basePrice: item.basePrice || item.price,
      salePrice: item.salePrice || item.price,
      category: item.category || 'main-courses',
      isVeg: item.isVeg || false,
      isRecommended: item.isRecommended || false,
      available: item.available !== undefined ? item.available : true,
      image: item.image || ''
    });
    setIsDrawerOpen(true);
  };

  const handleSaveDrawerItem = async (e) => {
    e.preventDefault();
    if (!drawerForm.name || !drawerForm.salePrice) {
      toast.error('Please provide item name and price');
      return;
    }

    const itemData = {
      ...drawerForm,
      price: Number(drawerForm.salePrice),
      basePrice: Number(drawerForm.basePrice || drawerForm.salePrice),
      salePrice: Number(drawerForm.salePrice),
      rating: editingItem?.rating || 4.9,
      prepTime: editingItem?.prepTime || '15-20 min'
    };

    if (editingItem) {
      setItems(prev => prev.map(it => it._id === editingItem._id ? { ...it, ...itemData } : it));
      toast.success(`Updated "${itemData.name}"`);
    } else {
      const newItem = {
        ...itemData,
        _id: `dish_${Date.now()}`
      };
      setItems(prev => [newItem, ...prev]);
      toast.success(`Added new dish "${itemData.name}"`);
    }

    setIsDrawerOpen(false);
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/orders/${orderId}/status`, { status }, { headers: { 'x-auth-token': token } });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success(`Order updated to ${status}`);
    } catch (err) {
      console.error('Update status error:', err);
      // Update locally for smooth offline / demo simulation
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    }
  };

  const handleToggleItemAvailability = (itemId) => {
    setItems(prev => prev.map(it => {
      if (it._id === itemId) {
        const nextState = !it.available;
        toast.success(nextState ? `"${it.name}" marked In Stock` : `"${it.name}" marked Out of Stock`);
        return { ...it, available: nextState };
      }
      return it;
    }));
  };

  const handleDeleteItem = (itemId, itemName) => {
    if (!window.confirm(`Delete dish "${itemName}"?`)) return;
    setItems(prev => prev.filter(it => it._id !== itemId));
    setSelectedItemIds(prev => prev.filter(id => id !== itemId));
    toast.success(`"${itemName}" deleted`);
  };

  const handleToggleSelectItem = (itemId) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedItemIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedItemIds.length} selected dishes?`)) return;
    setItems(prev => prev.filter(it => !selectedItemIds.includes(it._id)));
    setSelectedItemIds([]);
    toast.success('Selected items deleted');
  };

  const handleToggleChecklist = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, done: !item.done, overdue: false } : item
    ));
  };

  // Filtered menu items
  const filteredMenuItems = items.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(menuSearchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  }).sort((a, b) => {
    if (sortOption === 'low-to-high') return (a.salePrice || a.price) - (b.salePrice || b.price);
    if (sortOption === 'high-to-low') return (b.salePrice || b.price) - (a.salePrice || a.price);
    return 0;
  });

  return (
    <div className={styles.adminLayout}>
      <Toaster position="top-right" />

      {/* TOP GLOBAL BAR (MaitreD Pro style) */}
      <header className={styles.topGlobalBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.brandTitleWrap} onClick={() => navigate('/')}>
            <div className={styles.brandIconSquare}>GB</div>
            <div>
              <span className={styles.brandTitle}>The Grand Bistro</span>
              <span className={styles.brandSub}>ADMIN TERMINAL</span>
            </div>
          </div>
        </div>

        {/* Global Search Input */}
        <div className={styles.topSearchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search analytics, orders, or staff..." 
            className={styles.topSearchInput}
          />
        </div>

        {/* Right User Actions */}
        <div className={styles.topBarRight}>
          <button type="button" className={styles.iconCircleBtn} title="Notifications">
            <Bell size={18} />
          </button>
          <button type="button" className={styles.supportBtn}>
            <HelpCircle size={16} /> <span>Support</span>
          </button>
          <div className={styles.profileBadge}>
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" 
              alt="Alex Mercer" 
              className={styles.profileAvatar} 
            />
            <div className={styles.profileText}>
              <span className={styles.profileName}>{user?.name || "Alex Mercer"}</span>
              <span className={styles.profileRole}>OWNER</span>
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
              <span className={styles.navPill}>4</span>
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
              onClick={() => { logout(); navigate('/login'); }}
            >
              <LogOut size={16} /> <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN BODY CONTENT AREA */}
        <main className={styles.contentBody}>
          <AnimatePresence mode="wait">

            {/* ========================================================= */}
            {/* 1. EXECUTIVE ADMIN DASHBOARD (MaitreD Pro Reference)     */}
            {/* ========================================================= */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dash" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className={styles.dashboardView}
              >
                {/* 4 TOP METRIC CARDS WITH SPARKLINES */}
                <div className={styles.metricsGrid}>
                  {/* Card 1: Gross Sales */}
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>GROSS SALES</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ 12.4%</span>
                    </div>
                    <div className={styles.kpiValue}>$42,850<small>.00</small></div>
                    <div className={styles.sparklineBarRow}>
                      <div className={styles.sparkBar} style={{ height: '30%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '45%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '40%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '60%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '55%' }}></div>
                      <div className={`${styles.sparkBar} ${styles.sparkHighlight}`} style={{ height: '90%' }}></div>
                      <div className={`${styles.sparkBar} ${styles.sparkHighlight}`} style={{ height: '100%' }}></div>
                    </div>
                  </div>

                  {/* Card 2: Net Profit */}
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>NET PROFIT</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ 8.2%</span>
                    </div>
                    <div className={styles.kpiValue}>$18,320<small>.00</small></div>
                    <div className={styles.sparklineBarRow}>
                      <div className={styles.sparkBar} style={{ height: '25%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '35%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '40%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '45%' }}></div>
                      <div className={`${styles.sparkBar} ${styles.sparkPurple}`} style={{ height: '70%' }}></div>
                      <div className={`${styles.sparkBar} ${styles.sparkPurple}`} style={{ height: '85%' }}></div>
                      <div className={`${styles.sparkBar} ${styles.sparkPurple}`} style={{ height: '95%' }}></div>
                    </div>
                  </div>

                  {/* Card 3: Avg Ticket */}
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>AVG TICKET</span>
                      <span className={`${styles.trendBadge} ${styles.trendDown}`}>↘ 1.5%</span>
                    </div>
                    <div className={styles.kpiValue}>$64<small>.20</small></div>
                    <div className={styles.sparklineBarRow}>
                      <div className={styles.sparkBar} style={{ height: '65%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '70%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '60%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '75%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '55%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '60%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '50%' }}></div>
                    </div>
                  </div>

                  {/* Card 4: Total Orders */}
                  <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>TOTAL ORDERS</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ 24.0%</span>
                    </div>
                    <div className={styles.kpiValue}>682</div>
                    <div className={styles.sparklineBarRow}>
                      <div className={styles.sparkBar} style={{ height: '30%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '40%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '50%' }}></div>
                      <div className={styles.sparkBar} style={{ height: '65%' }}></div>
                      <div className={`${styles.sparkBar} ${styles.sparkDark}`} style={{ height: '80%' }}></div>
                      <div className={`${styles.sparkBar} ${styles.sparkDark}`} style={{ height: '90%' }}></div>
                      <div className={`${styles.sparkBar} ${styles.sparkDark}`} style={{ height: '100%' }}></div>
                    </div>
                  </div>
                </div>

                {/* MIDDLE SPLIT: REVENUE PERFORMANCE CHART + LIVE ORDERS SIDEBAR */}
                <div className={styles.dashSplitGrid}>
                  
                  {/* Left: Revenue Performance Interactive Curve */}
                  <div className={styles.chartPanelCard}>
                    <div className={styles.chartHeader}>
                      <div>
                        <h3>Revenue Performance</h3>
                        <p>Real-time tracking over last 24 hours</p>
                      </div>
                      <div className={styles.chartLegend}>
                        <span className={styles.legendDotBlack}>● Revenue</span>
                        <span className={styles.legendDotPurple}>● Orders</span>
                      </div>
                    </div>

                    <div className={styles.chartAreaWrapper}>
                      <svg className={styles.svgCurve} viewBox="0 0 700 240" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="revGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Background gridlines */}
                        <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="140" x2="700" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                        <line x1="0" y1="190" x2="700" y2="190" stroke="#f1f5f9" strokeWidth="1" />

                        {/* Revenue line */}
                        <path 
                          d="M 30,200 Q 120,180 200,195 T 330,140 T 450,150 T 570,120 T 670,80" 
                          fill="none" 
                          stroke="#0f172a" 
                          strokeWidth="3.5" 
                          strokeLinecap="round" 
                        />

                        {/* Orders dashed curve */}
                        <path 
                          d="M 30,220 Q 120,210 200,215 T 330,170 T 450,160 T 570,140 T 670,110" 
                          fill="none" 
                          stroke="#6366f1" 
                          strokeWidth="2.5" 
                          strokeDasharray="5,5" 
                          strokeLinecap="round" 
                        />

                        {/* Peak indicator */}
                        <circle cx="330" cy="140" r="14" fill="#e2e8f0" fillOpacity="0.6" />
                        <circle cx="330" cy="140" r="5" fill="#0f172a" />
                      </svg>

                      {/* Time markers */}
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

                  {/* Right: Live Orders Widget (MaitreD style) */}
                  <div className={styles.liveOrdersPanelCard}>
                    <div className={styles.panelHeadRow}>
                      <div>
                        <h3>Live Orders</h3>
                        <span className={styles.activeDotPill}>● 14 Active</span>
                      </div>
                      <Filter size={16} color="#64748b" style={{ cursor: 'pointer' }} />
                    </div>

                    <div className={styles.liveOrdersMiniList}>
                      {/* Ticket 1 */}
                      <div className={styles.miniOrderTicket}>
                        <div className={styles.ticketTopRow}>
                          <span className={styles.orderCode}>#ORD-2849</span>
                          <span className={`${styles.statusChip} ${styles.prepChip}`}>PREPARING</span>
                        </div>
                        <div className={styles.ticketSubRow}>
                          <span>Table 12 • 4 items</span>
                          <span className={styles.timeMuted}>8m ago</span>
                        </div>
                        <div className={styles.ticketPrice}>$124.50</div>
                      </div>

                      {/* Ticket 2 */}
                      <div className={styles.miniOrderTicket}>
                        <div className={styles.ticketTopRow}>
                          <span className={styles.orderCode}>#ORD-2850</span>
                          <span className={`${styles.statusChip} ${styles.readyChip}`}>READY</span>
                        </div>
                        <div className={styles.ticketSubRow}>
                          <span>Pickup • 2 items</span>
                          <span className={styles.timeMuted}>3m ago</span>
                        </div>
                        <div className={styles.ticketPrice}>$42.00</div>
                      </div>

                      {/* Ticket 3 */}
                      <div className={styles.miniOrderTicket}>
                        <div className={styles.ticketTopRow}>
                          <span className={styles.orderCode}>#ORD-2845</span>
                          <span className={`${styles.statusChip} ${styles.deliveryChip}`}>OUT FOR DELIVERY</span>
                        </div>
                        <div className={styles.ticketSubRow}>
                          <span>Delivery • 7 items</span>
                          <span className={styles.timeMuted}>15m ago</span>
                        </div>
                        <div className={styles.ticketPrice}>$210.80</div>
                      </div>

                      {/* Ticket 4 */}
                      <div className={styles.miniOrderTicket}>
                        <div className={styles.ticketTopRow}>
                          <span className={styles.orderCode}>#ORD-2851</span>
                          <span className={`${styles.statusChip} ${styles.prepChip}`}>PREPARING</span>
                        </div>
                        <div className={styles.ticketSubRow}>
                          <span>Table 4 • 1 item</span>
                          <span className={styles.timeMuted}>Just now</span>
                        </div>
                        <div className={styles.ticketPrice}>$18.00</div>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className={styles.viewAllOrdersBtn}
                      onClick={() => setActiveTab('kds')}
                    >
                      View All Active Orders
                    </button>
                  </div>
                </div>

                {/* BOTTOM ROW: AI INSIGHTS & DAILY CHECKLIST */}
                <div className={styles.bottomDashGrid}>
                  
                  {/* AI Predictive Scaling Card */}
                  <div className={styles.aiInsightCard}>
                    <div className={styles.aiIconSquare}>
                      <TrendingUp size={22} color="#4f46e5" />
                    </div>
                    <div>
                      <h4>Predictive Scaling</h4>
                      <p>Busy hour expected at 7 PM. Recommend +2 staff on floor.</p>
                    </div>
                  </div>

                  {/* AI Upsell Opportunity Card (Dark) */}
                  <div className={`${styles.aiInsightCard} ${styles.aiDarkCard}`}>
                    <div className={styles.aiDarkIconSquare}>
                      <Sparkles size={22} color="#ffffff" />
                    </div>
                    <div>
                      <h4>AI Upsell Opportunity</h4>
                      <p>Dessert pairings are currently at 12%. Trigger promo at 8 PM?</p>
                    </div>
                  </div>

                  {/* Daily Performance Checklist */}
                  <div className={styles.checklistCard}>
                    <h4>DAILY PERFORMANCE CHECKLIST</h4>
                    <div className={styles.checkItemsList}>
                      {checklist.map(chk => (
                        <div 
                          key={chk.id} 
                          className={`${styles.checkItemRow} ${chk.done ? styles.checkDone : ''}`}
                          onClick={() => handleToggleChecklist(chk.id)}
                        >
                          <div className={styles.checkLeft}>
                            {chk.done ? (
                              <CheckSquare size={16} color="#0f172a" />
                            ) : (
                              <Square size={16} color="#94a3b8" />
                            )}
                            <span>{chk.text}</span>
                          </div>
                          {chk.overdue ? (
                            <span className={styles.overdueBadge}>OVERDUE</span>
                          ) : (
                            <span className={styles.checkTime}>{chk.time}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MaitreD Pro Premium Promotion */}
                  <div className={styles.premiumPromoCard}>
                    <h4>MaitreD Pro Premium</h4>
                    <p>Unlock AI-powered inventory forecasting and payroll automation.</p>
                    <div className={styles.trialRow}>
                      <span>Trial progress</span>
                      <strong>85%</strong>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: '85%' }}></div>
                    </div>
                    <button type="button" className={styles.upgradeNowBtn}>Upgrade Now</button>
                  </div>

                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 2. MENU MANAGEMENT & SLIDE-OVER DRAWER (Reference 5)      */}
            {/* ========================================================= */}
            {activeTab === 'menu' && (
              <motion.div 
                key="menu" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className={styles.menuMgmtView}
              >
                <div className={styles.menuSplitLayout}>
                  
                  {/* Left Category Navigation Sidebar */}
                  <aside className={styles.categoryNavAside}>
                    <div className={styles.catAsideHead}>
                      <span>CATEGORIES</span>
                      <button type="button" className={styles.editCatsLink}>EDIT</button>
                    </div>

                    <div className={styles.catNavList}>
                      {availableCategories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`${styles.catNavItem} ${selectedCategory === cat.id ? styles.activeCatNavItem : ''}`}
                          onClick={() => setSelectedCategory(cat.id)}
                        >
                          <div className={styles.catTitleLeft}>
                            <Grid size={14} />
                            <span>{cat.name}</span>
                          </div>
                          {cat.count && <span className={styles.catCountPill}>{cat.count}</span>}
                        </button>
                      ))}
                    </div>

                    <button 
                      type="button" 
                      className={styles.addCategoryBtn}
                      onClick={() => toast.success('Category creator opened')}
                    >
                      + Add Category
                    </button>
                  </aside>

                  {/* Right Menu Items Content */}
                  <div className={styles.menuMainContent}>
                    
                    {/* Breadcrumbs & Header Actions */}
                    <div className={styles.menuHeaderRow}>
                      <div>
                        <div className={styles.menuBreadcrumb}>MENU &gt; {selectedCategory.toUpperCase().replace('-', ' ')}</div>
                        <h2 className={styles.menuPageTitle}>{availableCategories.find(c => c.id === selectedCategory)?.name || 'Main Courses'}</h2>
                        <p className={styles.menuPageSub}>Manage your signature entrées, steaks, and pasta dishes.</p>
                      </div>

                      <div className={styles.menuHeaderButtons}>
                        <button type="button" className={styles.exportCsvBtn}>
                          <Download size={14} /> Export CSV
                        </button>
                        <button 
                          type="button" 
                          className={styles.addMenuItemBtn}
                          onClick={handleOpenAddDrawer}
                        >
                          + Add Menu Item
                        </button>
                      </div>
                    </div>

                    {/* Filter & Search Toolbar */}
                    <div className={styles.menuToolbar}>
                      <div className={styles.toolbarSearch}>
                        <Search size={16} color="#94a3b8" />
                        <input 
                          type="text" 
                          placeholder="Filter by name, ingredients, or tags..."
                          value={menuSearchQuery}
                          onChange={(e) => setMenuSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className={styles.toolbarRight}>
                        <select 
                          className={styles.sortSelect}
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value)}
                        >
                          <option value="low-to-high">Price: Low to High</option>
                          <option value="high-to-low">Price: High to Low</option>
                        </select>
                        <button type="button" className={styles.filtersBtn}>
                          <Filter size={14} /> Filters
                        </button>
                      </div>
                    </div>

                    {/* Bulk Selection Bar (Shows when items selected) */}
                    {selectedItemIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className={styles.bulkActionBar}
                      >
                        <div className={styles.bulkLeft}>
                          <input type="checkbox" checked={true} readOnly />
                          <span>{selectedItemIds.length} items selected</span>
                        </div>
                        <div className={styles.bulkActions}>
                          <button type="button" className={styles.bulkBtn}><Edit3 size={14} /> Bulk Edit</button>
                          <button type="button" className={styles.bulkBtn}><Layers size={14} /> Move to Category</button>
                          <button type="button" className={styles.bulkDeleteBtn} onClick={handleBulkDelete}><Trash2 size={14} /> Delete</button>
                          <button type="button" className={styles.bulkCloseBtn} onClick={() => setSelectedItemIds([])}><X size={16} /></button>
                        </div>
                      </motion.div>
                    )}

                    {/* FOOD CARDS GRID */}
                    <div className={styles.foodCardsGrid}>
                      {filteredMenuItems.map(item => (
                        <div 
                          key={item._id} 
                          className={`${styles.gourmetCard} ${!item.available ? styles.cardOutOfStock : ''}`}
                        >
                          {/* Image Container with Badges */}
                          <div className={styles.cardImageContainer}>
                            <img 
                              src={getValidFoodImage(item)} 
                              alt={item.name} 
                              className={styles.cardImage} 
                            />
                            
                            {/* Badges */}
                            <div className={styles.imageBadges}>
                              {item.isRecommended && (
                                <span className={styles.recommendedBadge}>RECOMMENDED</span>
                              )}
                              <span className={item.isVeg ? styles.vegBadge : styles.nonVegBadge}>
                                ● {item.isVeg ? 'VEG' : 'NON-VEG'}
                              </span>
                            </div>

                            {/* Select checkbox */}
                            <input 
                              type="checkbox" 
                              className={styles.itemSelectBox}
                              checked={selectedItemIds.includes(item._id)}
                              onChange={() => handleToggleSelectItem(item._id)}
                            />

                            {/* Out of Stock Overlay Banner */}
                            {!item.available && (
                              <div className={styles.outOfStockOverlay}>
                                <span>OUT OF STOCK</span>
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className={styles.cardBody}>
                            <div className={styles.cardTitlePriceRow}>
                              <h3 className={styles.dishName} onClick={() => handleOpenEditDrawer(item)}>{item.name}</h3>
                              <div className={styles.priceTagGroup}>
                                <span className={styles.salePrice}>${Number(item.salePrice || item.price).toFixed(2)}</span>
                                {item.basePrice && item.basePrice > (item.salePrice || item.price) && (
                                  <span className={styles.strikeBasePrice}>${Number(item.basePrice).toFixed(2)}</span>
                                )}
                              </div>
                            </div>

                            <p className={styles.dishDesc}>{item.description}</p>

                            {/* Meta row & Availability Switch */}
                            <div className={styles.cardMetaRow}>
                              <div className={styles.timeRating}>
                                <span className={styles.metaChip}><Clock size={12} /> {item.prepTime || '15-20 min'}</span>
                                <span className={styles.metaChip}><Star size={12} color="#f59e0b" fill="#f59e0b" /> {item.rating || '4.9'}</span>
                              </div>

                              <div className={styles.availabilityToggle}>
                                <span className={styles.availText}>Available</span>
                                <label className={styles.switch}>
                                  <input 
                                    type="checkbox" 
                                    checked={item.available !== false} 
                                    onChange={() => handleToggleItemAvailability(item._id)} 
                                  />
                                  <span className={styles.slider}></span>
                                </label>
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className={styles.cardBottomActions}>
                              <button 
                                type="button" 
                                className={styles.editCardBtn}
                                onClick={() => handleOpenEditDrawer(item)}
                              >
                                <Edit3 size={13} /> Edit Dish
                              </button>
                              <button 
                                type="button" 
                                className={styles.deleteCardBtn}
                                onClick={() => handleDeleteItem(item._id, item.name)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* + Add New Item Dashed Card */}
                      <div className={styles.addNewItemCard} onClick={handleOpenAddDrawer}>
                        <div className={styles.addPlusCircle}>+</div>
                        <h4>Add New Item</h4>
                        <p>Click to create a new dish in this category</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* SLIDE-OVER DRAWER: EDIT / ADD MENU ITEM (Reference 5) */}
                <AnimatePresence>
                  {isDrawerOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className={styles.drawerBackdrop}
                        onClick={() => setIsDrawerOpen(false)}
                      />
                      <motion.aside 
                        initial={{ x: '100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={styles.slideDrawer}
                      >
                        <div className={styles.drawerHeader}>
                          <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
                          <button 
                            type="button" 
                            className={styles.drawerCloseBtn}
                            onClick={() => setIsDrawerOpen(false)}
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <form onSubmit={handleSaveDrawerItem} className={styles.drawerForm}>
                          {/* Image Banner */}
                          <div className={styles.drawerImagePreview}>
                            <img 
                              src={drawerForm.image || (editingItem ? getValidFoodImage(editingItem) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600')} 
                              alt="Dish Preview" 
                            />
                            <label className={styles.changePhotoBtn}>
                              <Upload size={14} /> Change Photo
                              <input 
                                type="file" 
                                accept="image/*" 
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const url = URL.createObjectURL(e.target.files[0]);
                                    setDrawerForm({ ...drawerForm, image: url });
                                    toast.success('Photo updated');
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {/* Item Name */}
                          <div className={styles.drawerField}>
                            <label>Item Name</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Wagyu Truffle Burger"
                              value={drawerForm.name}
                              onChange={(e) => setDrawerForm({ ...drawerForm, name: e.target.value })}
                              required
                            />
                          </div>

                          {/* Description */}
                          <div className={styles.drawerField}>
                            <label>Description</label>
                            <textarea 
                              rows={4}
                              placeholder="Describe the dish ingredients, preparation style, and allergens..."
                              value={drawerForm.description}
                              onChange={(e) => setDrawerForm({ ...drawerForm, description: e.target.value })}
                            />
                          </div>

                          {/* Base Price & Sale Price */}
                          <div className={styles.drawerPriceRow}>
                            <div className={styles.drawerField}>
                              <label>Base Price ($)</label>
                              <input 
                                type="number" 
                                step="0.01"
                                placeholder="32.00"
                                value={drawerForm.basePrice}
                                onChange={(e) => setDrawerForm({ ...drawerForm, basePrice: e.target.value })}
                              />
                            </div>
                            <div className={styles.drawerField}>
                              <label>Sale Price ($)</label>
                              <input 
                                type="number" 
                                step="0.01"
                                placeholder="28.00"
                                value={drawerForm.salePrice}
                                onChange={(e) => setDrawerForm({ ...drawerForm, salePrice: e.target.value })}
                                required
                              />
                            </div>
                          </div>

                          {/* Dietary & Recommended Switches */}
                          <div className={styles.drawerTogglesRow}>
                            <label className={styles.checkboxLabel}>
                              <input 
                                type="checkbox" 
                                checked={drawerForm.isVeg}
                                onChange={(e) => setDrawerForm({ ...drawerForm, isVeg: e.target.checked })}
                              />
                              <span>Vegetarian Dish (VEG)</span>
                            </label>
                            <label className={styles.checkboxLabel}>
                              <input 
                                type="checkbox" 
                                checked={drawerForm.isRecommended}
                                onChange={(e) => setDrawerForm({ ...drawerForm, isRecommended: e.target.checked })}
                              />
                              <span>Feature as "RECOMMENDED"</span>
                            </label>
                          </div>

                          {/* Drawer Actions */}
                          <div className={styles.drawerFooter}>
                            <button 
                              type="button" 
                              className={styles.drawerCancelBtn}
                              onClick={() => setIsDrawerOpen(false)}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              className={styles.drawerSaveBtn}
                            >
                              Save Changes
                            </button>
                          </div>
                        </form>
                      </motion.aside>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 3. 4-STAGE KITCHEN DISPLAY & LIVE ORDERS (Ref 1 & 3)      */}
            {/* ========================================================= */}
            {activeTab === 'kds' && (
              <motion.div key="kds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KOTMonitor orders={orders} onUpdateStatus={handleStatusUpdate} />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 4. RESTAURANT SETTINGS & BRANDING (Reference 4)           */}
            {/* ========================================================= */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RestaurantSettings tenantInfo={tenantInfo} />
              </motion.div>
            )}

            {/* POS Billing Tab */}
            {activeTab === 'pos' && (
              <motion.section key="pos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
                <POSTerminal 
                  tenantId={tenantId} 
                  menuItems={items} 
                  onOrderPlaced={() => {
                    const token = localStorage.getItem('token');
                    axios.get(`${API}/orders`, { headers: { 'x-auth-token': token } })
                      .then((res) => setOrders(res.data))
                      .catch((err) => console.error(err));
                  }} 
                />
              </motion.section>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <motion.section key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <InventoryRecipes tenantId={tenantId} menuItems={items} />
              </motion.section>
            )}

            {/* CRM & Loyalty Tab */}
            {activeTab === 'crm' && (
              <motion.section key="crm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CRMLoyalty tenantId={tenantId} />
              </motion.section>
            )}

            {/* Table QR Codes Tab */}
            {activeTab === 'qrcodes' && (
              <motion.section key="qrcodes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.qrSection}>
                <div className={styles.sectionHeader}>
                  <h2>Table QR Codes Generator</h2>
                </div>
                <div className={styles.qrControls}>
                  <label>Number of Tables (Max 30): </label>
                  <input
                    type="number"
                    value={qrCount}
                    onChange={(e) => setQrCount(e.target.value)}
                    className={styles.inputSmall}
                    max="30"
                    min="1"
                  />
                  <button className={styles.actionBtn} onClick={() => { setGeneratedQrs(Number(qrCount)); toast.success(`Generated ${qrCount} Table QRs!`); }}>Generate QRs</button>
                  <button className={styles.printBtn} onClick={() => window.print()}>Print All</button>
                </div>
                <div className={styles.qrGrid}>
                  {Array.from({ length: generatedQrs }, (_, i) => i + 1).map((n) => (
                    <div key={n} className={styles.qrCard}>
                      <QRCodeComponent url={`${window.location.origin}/menu?table=${n}&tenant=${tenantId || 'demo'}`} />
                      <h3>Table {n}</h3>
                      <a href={`${window.location.origin}/menu?table=${n}&tenant=${tenantId || 'demo'}`} target="_blank" rel="noopener noreferrer" className={styles.qrLink}>
                        Open Table Link
                      </a>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;