import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit3, LayoutDashboard, ShoppingBag, QrCode, BarChart3, X, LogOut, Loader, TrendingUp, IndianRupee,
  UtensilsCrossed, Coffee, Pizza, Sandwich, IceCream, GlassWater, Martini, Cake, Soup, Cookie, Grid,
  ChefHat, Truck, UserCheck, Share2, Sparkles, Upload, ImagePlus, ImageIcon, Settings, Bell, HelpCircle,
  TrendingDown, CheckSquare, Square, Download, Filter, Star, Clock, Check, ArrowUpRight, Flame, Layers,
  ChevronRight, RefreshCw, Smartphone, CreditCard
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

// Available Categories with Icons and match aliases
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

// Rich gourmet items
const defaultGourmetItems = [
  {
    _id: 'item_1',
    name: 'Wagyu Truffle Burger',
    description: 'Premium wagyu patty, black truffle oil, fontina cheese, and arugula on toasted brioche.',
    price: 480.00,
    basePrice: 520.00,
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
    name: 'Classic Pomodoro Fettuccine',
    description: 'Handmade pasta tossed in slow-simmered San Marzano tomato sauce with fresh basil and aged parmesan.',
    price: 360.00,
    basePrice: 360.00,
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
    name: 'Grilled Atlantic Salmon',
    description: 'Charcoal-grilled Atlantic salmon served with seasonal asparagus and lemon herb reduction.',
    price: 640.00,
    basePrice: 680.00,
    category: 'main-courses',
    isVeg: false,
    isRecommended: false,
    prepTime: '20-25 min',
    rating: 4.8,
    available: true,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=600'
  },
  {
    _id: 'item_4',
    name: 'Crispy Truffle Calamari',
    description: 'Lightly dusted tender calamari served with charred lemon and house-made roasted garlic aioli dip.',
    price: 290.00,
    basePrice: 320.00,
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
    description: 'Creamy pugliese burrata, heirloom cherry tomatoes, cold-pressed olive oil, aged balsamic, and sourdough.',
    price: 310.00,
    basePrice: 310.00,
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
    price: 240.00,
    basePrice: 240.00,
    category: 'desserts',
    isVeg: true,
    isRecommended: true,
    prepTime: '12-14 min',
    rating: 5.0,
    available: true,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600'
  }
];

// Initial dynamic live orders seed
const initialDynamicOrders = [
  {
    _id: 'ORD-2849',
    orderNumber: '2849',
    tableNumber: '12',
    channel: 'Dine-in',
    status: 'preparing',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    totalAmount: 640.00,
    total: 640.00,
    items: [
      { name: 'Wagyu Truffle Burger', quantity: 1, price: 480 },
      { name: 'Cold Brew Coffee', quantity: 1, price: 160 }
    ]
  },
  {
    _id: 'ORD-2850',
    orderNumber: '2850',
    tableNumber: 'Pickup',
    channel: 'Takeaway',
    status: 'ready',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    totalAmount: 280.00,
    total: 280.00,
    items: [
      { name: 'Valrhona Chocolate Fondant', quantity: 1, price: 240 },
      { name: 'Espresso', quantity: 1, price: 40 }
    ]
  },
  {
    _id: 'ORD-2845',
    orderNumber: '2845',
    tableNumber: 'Delivery',
    channel: 'Zomato',
    status: 'out_for_delivery',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    totalAmount: 1250.00,
    total: 1250.00,
    items: [
      { name: 'Grilled Atlantic Salmon', quantity: 1, price: 640 },
      { name: 'Classic Pomodoro Fettuccine', quantity: 1, price: 360 },
      { name: 'Crispy Calamari', quantity: 1, price: 250 }
    ]
  },
  {
    _id: 'ORD-2851',
    orderNumber: '2851',
    tableNumber: '4',
    channel: 'Dine-in',
    status: 'preparing',
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
    totalAmount: 180.00,
    total: 180.00,
    items: [
      { name: 'Specialty Coffee Latte', quantity: 1, price: 180 }
    ]
  },
  {
    _id: 'ORD-2840',
    orderNumber: '2840',
    tableNumber: '8',
    channel: 'Dine-in',
    status: 'completed',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    totalAmount: 920.00,
    total: 920.00,
    items: [
      { name: 'Wagyu Truffle Burger', quantity: 1, price: 480 },
      { name: 'Burrata Caprese Salad', quantity: 1, price: 310 },
      { name: 'Mineral Water', quantity: 1, price: 130 }
    ]
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

export default function AdminPanel() {
  const { user, tenantId, socket, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [items, setItems] = useState(defaultGourmetItems);
  const [orders, setOrders] = useState(initialDynamicOrders);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Menu Management State
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Fetch Tenant Info
    if (tenantId) {
      axios.get(`${API}/tenants/public/${tenantId}`)
        .then((res) => setTenantInfo(res.data))
        .catch((err) => console.log('Tenant info fetch error:', err));
    }

    // Fetch Menu Items from API
    axios.get(`${API}/menu${tenantId ? `?tenantId=${tenantId}` : ''}`)
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
      .catch((err) => console.log('Fetch menu error, keeping gourmet items:', err));

    // Fetch Orders from API
    if (token) {
      axios.get(`${API}/orders`, { headers: { 'x-auth-token': token } })
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setOrders(res.data);
          }
        })
        .catch((err) => console.log('Orders fetch error, using dynamic orders state:', err));
    }

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
  }, [user, tenantId, socket]);

  // ── Dynamic Metric Calculations ──
  const metrics = useMemo(() => {
    const grossSales = orders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0);
    const totalOrdersCount = orders.length;
    const avgTicket = totalOrdersCount > 0 ? Math.round(grossSales / totalOrdersCount) : 0;
    const netProfit = Math.round(grossSales * 0.42); // estimated 42% restaurant margin
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

    // Dynamic Sparkline heights (7 bars across 24h)
    const sparklines = [
      Math.max(25, Math.min(95, Math.round((grossSales * 0.15) % 80 + 20))),
      Math.max(30, Math.min(95, Math.round((grossSales * 0.28) % 75 + 25))),
      Math.max(35, Math.min(95, Math.round((grossSales * 0.42) % 70 + 30))),
      Math.max(45, Math.min(95, Math.round((grossSales * 0.65) % 65 + 35))),
      Math.max(55, Math.min(95, Math.round((grossSales * 0.85) % 60 + 40))),
      Math.max(75, Math.min(98, Math.round((grossSales * 0.95) % 40 + 60))),
      100
    ];

    // Dynamic Top Item
    const itemFrequency = {};
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        itemFrequency[it.name] = (itemFrequency[it.name] || 0) + (it.quantity || 1);
      });
    });
    const topItemName = Object.keys(itemFrequency).sort((a,b) => itemFrequency[b] - itemFrequency[a])[0] || 'Wagyu Truffle Burger';

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

  // Relative Time Helper
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const diffMs = currentTime - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

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
      if (token) {
        await axios.put(`${API}/orders/${orderId}/status`, { status }, { headers: { 'x-auth-token': token } });
      }
    } catch (err) {
      console.log('Update status on server failed, updating local state:', err);
    }
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    toast.success(`Order status updated to ${status.toUpperCase()}`);
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

  // Filtered menu items
  const filteredMenuItems = items.filter(item => {
    const matchesCat = itemMatchesCategory(item, selectedCategory);
    const matchesSearch = item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(menuSearchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  }).sort((a, b) => {
    if (sortOption === 'low-to-high') return (a.salePrice || a.price) - (b.salePrice || b.price);
    if (sortOption === 'high-to-low') return (b.salePrice || b.price) - (a.salePrice || a.price);
    return 0;
  });

  const restaurantDisplayName = tenantInfo?.name || user?.restaurantName || 'SARVIQ Flagship Bistro';
  const restaurantInitials = restaurantDisplayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={styles.adminLayout}>
      <Toaster position="top-right" />

      {/* TOP GLOBAL BAR */}
      <header className={styles.topGlobalBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.brandTitleWrap} onClick={() => navigate('/')}>
            <div className={styles.brandIconSquare}>{restaurantInitials}</div>
            <div>
              <span className={styles.brandTitle}>{restaurantDisplayName}</span>
              <span className={styles.brandSub}>SARVIQ AI TERMINAL</span>
            </div>
          </div>
        </div>

        {/* Global Search Input */}
        <div className={styles.topSearchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search orders, dishes, customers, or KDS stations..." 
            className={styles.topSearchInput}
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
          />
        </div>

        {/* Right User Actions */}
        <div className={styles.topBarRight}>
          <button 
            type="button" 
            className={styles.iconCircleBtn} 
            title="Notifications"
            onClick={() => toast.success(`SARVIQ telemetry active • ${metrics.activeOrders.length} live orders`)}
          >
            <Bell size={18} />
          </button>
          <button 
            type="button" 
            className={styles.supportBtn}
            onClick={() => window.open('https://wa.me/919680132562?text=Hello%20SARVIQ%20Support', '_blank')}
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
            {/* 1. EXECUTIVE ADMIN DASHBOARD                             */}
            {/* ========================================================= */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dash" 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={styles.dashboardView}
              >
                {/* 4 TOP METRIC CARDS WITH DYNAMIC VALUES & SPARKLINES */}
                <div className={styles.metricsGrid}>
                  {/* Card 1: Gross Sales */}
                  <motion.div whileHover={{ y: -3 }} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>GROSS SALES</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ 12.4%</span>
                    </div>
                    <div className={styles.kpiValue}>
                      ₹{metrics.grossSales.toLocaleString('en-IN')}<small>.00</small>
                    </div>
                    <div className={styles.sparklineBarRow}>
                      {metrics.sparklines.map((h, i) => (
                        <div 
                          key={i} 
                          className={`${styles.sparkBar} ${i >= 5 ? styles.sparkHighlight : ''}`} 
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Card 2: Net Profit */}
                  <motion.div whileHover={{ y: -3 }} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>EST. NET PROFIT</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ 8.2%</span>
                    </div>
                    <div className={styles.kpiValue}>
                      ₹{metrics.netProfit.toLocaleString('en-IN')}<small>.00</small>
                    </div>
                    <div className={styles.sparklineBarRow}>
                      {metrics.sparklines.map((h, i) => (
                        <div 
                          key={i} 
                          className={`${styles.sparkBar} ${i >= 4 ? styles.sparkPurple : ''}`} 
                          style={{ height: `${Math.max(20, Math.round(h * 0.85))}%` }}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Card 3: Avg Ticket */}
                  <motion.div whileHover={{ y: -3 }} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>AVG TICKET</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ 4.5%</span>
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

                  {/* Card 4: Total Orders */}
                  <motion.div whileHover={{ y: -3 }} className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                      <span className={styles.kpiLabel}>TOTAL ORDERS</span>
                      <span className={`${styles.trendBadge} ${styles.trendUp}`}>↗ 24.0%</span>
                    </div>
                    <div className={styles.kpiValue}>{metrics.totalOrdersCount}</div>
                    <div className={styles.sparklineBarRow}>
                      {metrics.sparklines.map((h, i) => (
                        <div 
                          key={i} 
                          className={`${styles.sparkBar} ${i >= 4 ? styles.sparkDark : ''}`} 
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* MIDDLE SPLIT: REVENUE PERFORMANCE CHART + LIVE ORDERS SIDEBAR */}
                <div className={styles.dashSplitGrid}>
                  
                  {/* Left: Revenue Performance Dynamic Curve */}
                  <div className={styles.chartPanelCard}>
                    <div className={styles.chartHeader}>
                      <div>
                        <h3>Revenue Performance</h3>
                        <p>Real-time telemetry tracking over last 24 hours</p>
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
                        <circle cx="670" cy="80" r="14" fill="#e0e7ff" fillOpacity="0.7" />
                        <circle cx="670" cy="80" r="5" fill="#4f46e5" />
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

                  {/* Right: Live Orders Dynamic Widget */}
                  <div className={styles.liveOrdersPanelCard}>
                    <div className={styles.panelHeadRow}>
                      <div>
                        <h3>Live Orders</h3>
                        <span className={styles.activeDotPill}>● {metrics.activeOrders.length} Active</span>
                      </div>
                      <button 
                        type="button" 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        onClick={() => toast.success("Refreshed live queue")}
                      >
                        <RefreshCw size={15} />
                      </button>
                    </div>

                    <div className={styles.liveOrdersMiniList}>
                      {orders.slice(0, 4).map((order) => {
                        const orderCode = order.orderNumber ? `#ORD-${order.orderNumber}` : `#${order._id?.slice(-6) || 'ORD'}`;
                        const totalAmt = Number(order.total || order.totalAmount) || 0;
                        const itemsCount = (order.items || []).reduce((s, it) => s + (it.quantity || 1), 0);
                        const tableText = order.tableNumber ? (order.tableNumber.toLowerCase().includes('pickup') || order.tableNumber.toLowerCase().includes('delivery') ? order.tableNumber : `Table ${order.tableNumber}`) : (order.channel || 'Dine-in');

                        const isPrep = order.status === 'preparing' || order.status === 'pending';
                        const isReady = order.status === 'ready';
                        const isDelivery = order.status === 'out_for_delivery' || order.channel === 'Zomato';

                        return (
                          <motion.div 
                            key={order._id}
                            whileHover={{ scale: 1.02, x: 2 }}
                            className={styles.miniOrderTicket}
                            onClick={() => setActiveTab('kds')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className={styles.ticketTopRow}>
                              <span className={styles.orderCode}>{orderCode}</span>
                              <span className={`${styles.statusChip} ${isPrep ? styles.prepChip : isReady ? styles.readyChip : isDelivery ? styles.deliveryChip : styles.prepChip}`}>
                                {(order.status || 'pending').replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className={styles.ticketSubRow}>
                              <span>{tableText} • {itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                              <span className={styles.timeMuted}>{getRelativeTime(order.createdAt)}</span>
                            </div>
                            <div className={styles.ticketPrice}>₹{totalAmt.toFixed(2)}</div>
                          </motion.div>
                        );
                      })}
                    </div>

                    <button 
                      type="button" 
                      className={styles.viewAllOrdersBtn}
                      onClick={() => setActiveTab('kds')}
                    >
                      View All Active Orders ({orders.length})
                    </button>
                  </div>
                </div>

                {/* BOTTOM ROW: AI INSIGHTS & DAILY CHECKLIST */}
                <div className={styles.bottomDashGrid}>
                  
                  {/* AI Predictive Scaling Card */}
                  <motion.div whileHover={{ y: -3 }} className={styles.aiInsightCard}>
                    <div className={styles.aiIconSquare}>
                      <TrendingUp size={22} color="#4f46e5" />
                    </div>
                    <div>
                      <h4>SARVIQ Predictive Scaling</h4>
                      <p>Peak dining velocity predicted at 7:30 PM. Bestseller is <strong>{metrics.topItemName}</strong>.</p>
                    </div>
                  </motion.div>

                  {/* AI Upsell Opportunity Card (Dark) */}
                  <motion.div whileHover={{ y: -3 }} className={`${styles.aiInsightCard} ${styles.aiDarkCard}`}>
                    <div className={styles.aiDarkIconSquare}>
                      <Sparkles size={22} color="#ffffff" />
                    </div>
                    <div>
                      <h4>AI Upsell Intelligence</h4>
                      <p>Guest table QR modifier attachments are up +24%. High conversion on Truffle Aioli.</p>
                    </div>
                  </motion.div>

                  {/* Daily Performance Checklist Card */}
                  <div className={styles.checklistCard}>
                    <div className={styles.checklistHead}>
                      <h4>Daily Shift Checklist</h4>
                      <span className={styles.taskCountBadge}>
                        {checklist.filter(c => c.done).length}/{checklist.length} Complete
                      </span>
                    </div>

                    <div className={styles.checklistItems}>
                      {checklist.map((item) => (
                        <div 
                          key={item.id} 
                          className={`${styles.checkItemRow} ${item.done ? styles.checkDone : ''}`}
                          onClick={() => handleToggleChecklist(item.id)}
                        >
                          <div className={styles.checkboxSquare}>
                            {item.done ? <CheckSquare size={16} color="#4f46e5" /> : <Square size={16} color="#94a3b8" />}
                          </div>
                          <div className={styles.checkTextWrap}>
                            <span className={styles.checkText}>{item.text}</span>
                            <span className={styles.checkTime}>{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <input 
                        type="text" 
                        placeholder="+ Add task..."
                        value={newChecklistText}
                        onChange={(e) => setNewChecklistText(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <button 
                        type="submit" 
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: '#4f46e5',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Add
                      </button>
                    </form>
                  </div>

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
                transition={{ duration: 0.3 }}
              >
                <KOTMonitor 
                  orders={orders} 
                  onUpdateStatus={handleStatusUpdate} 
                />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 3. MENU MANAGEMENT & 86 ITEM SYNC                         */}
            {/* ========================================================= */}
            {activeTab === 'menu' && (
              <motion.div 
                key="menu" 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={styles.menuManagementView}
              >
                {/* Top Action Header */}
                <div className={styles.menuHeaderRow}>
                  <div>
                    <h2 className={styles.sectionHeading}>Menu Catalog & Digital 86 Sync</h2>
                    <p className={styles.sectionSubtitle}>Manage pricing in ₹, modifiers, dietary badges, and live out-of-stock items.</p>
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
                              {!item.available && (
                                <span className={styles.soldOutPill}>OUT OF STOCK</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.dishBody}>
                          <div className={styles.dishTitleRow}>
                            <h4 className={styles.dishName}>{item.name}</h4>
                            <div className={styles.dishPrice}>₹{(item.salePrice || item.price).toFixed(2)}</div>
                          </div>
                          <p className={styles.dishDescription}>{item.description}</p>
                          
                          <div className={styles.dishMetaRow}>
                            <span className={styles.prepTimeBadge}>
                              <Clock size={12} /> {item.prepTime || '15-20 min'}
                            </span>
                            <span className={styles.ratingBadge}>
                              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {item.rating || 4.8}
                            </span>
                          </div>

                          <div className={styles.dishActionsRow}>
                            <button
                              type="button"
                              onClick={() => handleToggleItemAvailability(item._id)}
                              className={`${styles.toggleStockBtn} ${item.available ? styles.stockActive : styles.stockInactive}`}
                            >
                              {item.available ? 'Mark Out of Stock' : 'Mark In Stock'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditDrawer(item)}
                              className={styles.editDishBtn}
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item._id, item.name)}
                              className={styles.deleteDishBtn}
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 4. POINT OF SALE (POS) TERMINAL                           */}
            {/* ========================================================= */}
            {activeTab === 'pos' && (
              <motion.div 
                key="pos" 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <POSTerminal 
                  menuItems={items} 
                  onOrderCreated={(newOrder) => {
                    setOrders(prev => [newOrder, ...prev]);
                    toast.success("Order punched to KDS!");
                  }} 
                />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 5. INVENTORY & RECIPE DEPLETION                           */}
            {/* ========================================================= */}
            {activeTab === 'inventory' && (
              <motion.div 
                key="inventory" 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <InventoryRecipes orders={orders} />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 6. CRM & WHATSAPP GUEST LOYALTY                           */}
            {/* ========================================================= */}
            {activeTab === 'crm' && (
              <motion.div 
                key="crm" 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CRMLoyalty orders={orders} />
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* 7. TABLE QR CODES GENERATOR                               */}
            {/* ========================================================= */}
            {activeTab === 'qrcodes' && (
              <motion.div 
                key="qrcodes" 
                initial={{ opacity: 0, y: 12 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
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
                transition={{ duration: 0.3 }}
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
            initial={{ x: 400, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: 400, opacity: 0 }}
            className={styles.drawerContainer} 
            onClick={(e) => e.stopPropagation()}
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

            <form onSubmit={handleSaveDrawerItem} className={styles.drawerForm}>
              <div className={styles.formGroup}>
                <label>Dish Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Wagyu Truffle Burger"
                  value={drawerForm.name}
                  onChange={(e) => setDrawerForm({ ...drawerForm, name: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  rows={3}
                  placeholder="Ingredients and flavour profile..."
                  value={drawerForm.description}
                  onChange={(e) => setDrawerForm({ ...drawerForm, description: e.target.value })}
                />
              </div>

              <div className={styles.formRow2}>
                <div className={styles.formGroup}>
                  <label>Sale Price (₹) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="340"
                    value={drawerForm.salePrice}
                    onChange={(e) => setDrawerForm({ ...drawerForm, salePrice: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Base / MRP Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="380"
                    value={drawerForm.basePrice}
                    onChange={(e) => setDrawerForm({ ...drawerForm, basePrice: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <select 
                  value={drawerForm.category}
                  onChange={(e) => setDrawerForm({ ...drawerForm, category: e.target.value })}
                >
                  {standardCategories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Image URL</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/..."
                  value={drawerForm.image}
                  onChange={(e) => setDrawerForm({ ...drawerForm, image: e.target.value })}
                />
              </div>

              <div className={styles.formCheckboxRow}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={drawerForm.isVeg}
                    onChange={(e) => setDrawerForm({ ...drawerForm, isVeg: e.target.checked })}
                  />
                  <span>Vegetarian Dish (Veg)</span>
                </label>
              </div>

              <div className={styles.drawerActions}>
                <button 
                  type="button" 
                  onClick={() => setIsDrawerOpen(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.saveBtn}
                >
                  Save Dish
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}