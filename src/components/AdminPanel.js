import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit3, LayoutDashboard, ShoppingBag, QrCode, BarChart3, X, LogOut, Loader, TrendingUp, IndianRupee,
  UtensilsCrossed, Coffee, Pizza, Sandwich, IceCream, Croissant, GlassWater, Martini, Cake, Soup, Cookie, Beer, Wine, Grid,
  ChefHat, Truck, UserCheck, Share2, Sparkles, Upload, ImagePlus, ImageIcon, RefreshCw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeComponent from './QRCodeComponent';
import POSTerminal from './petpooja/POSTerminal';
import KOTMonitor from './petpooja/KOTMonitor';
import InventoryRecipes from './petpooja/InventoryRecipes';
import CRMLoyalty from './petpooja/CRMLoyalty';
import OnlineAggregators from './petpooja/OnlineAggregators';
import styles from './AdminPanel.module.css';

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

// Available Icons for Categories
const availableCategories = [
  { id: "all", name: "All", icon: "UtensilsCrossed", Component: UtensilsCrossed },
  { id: "chai", name: "Chai", icon: "Coffee", Component: Coffee },
  { id: "hot-coffee", name: "Hot Coffee", icon: "Coffee", Component: Coffee },
  { id: "cold-coffee", name: "Cold Coffee", icon: "Coffee", Component: Coffee },
  { id: "burger", name: "Burger", icon: "Sandwich", Component: Sandwich },
  { id: "pizza", name: "Pizza", icon: "Pizza", Component: Pizza },
  { id: "chinese", name: "Chinese", icon: "Soup", Component: Soup },
  { id: "sandwich", name: "Sandwich", icon: "Sandwich", Component: Sandwich },
  { id: "snacks", name: "Snacks", icon: "Cookie", Component: Cookie },
  { id: "wraps", name: "Wraps", icon: "Sandwich", Component: Sandwich },
  { id: "pasta", name: "Pasta", icon: "UtensilsCrossed", Component: UtensilsCrossed },
  { id: "cold-drinks", name: "Drinks", icon: "GlassWater", Component: GlassWater },
  { id: "mocktails", name: "Mocktails", icon: "Martini", Component: Martini },
  { id: "shakes", name: "Shakes", icon: "IceCream", Component: IceCream },
  { id: "desserts", name: "Desserts", icon: "Cake", Component: Cake },
];

const fallbacks = {
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=500',
  sandwich: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=500',
  pasta: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=500',
  desserts: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=500',
  drinks: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=500',
  'cold-drinks': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=500',
  'hot-coffee': 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&q=80&w=500',
  'cold-coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=500',
  chai: 'https://images.unsplash.com/photo-1571934811356-5cc561b6821f?auto=format&fit=crop&q=80&w=500',
  shakes: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=500',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=500'
};

export const getValidFoodImage = (item) => {
  const img = item?.image;
  if (img && (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/uploads'))) {
    return img;
  }
  if (item?.name) {
    return `https://image.pollinations.ai/prompt/delicious%20food%20photo%20of%20${encodeURIComponent(item.name)}%20gourmet%20dish?width=500&height=400&nologo=true`;
  }
  return 'https://image.pollinations.ai/prompt/delicious%20gourmet%20food%20dish?width=500&height=400&nologo=true';
};

function AdminPanel() {
  const { user, tenantId, socket, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Category State
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // QR Code State
  const [qrCount, setQrCount] = useState(10);
  const [generatedQrs, setGeneratedQrs] = useState(10);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
  });
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);

  // AI Copilot States
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotMessages, setCopilotMessages] = useState([]);

  // AI Menu Image Extractor States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importingFile, setImportingFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStageText, setExtractionStageText] = useState('');

  useEffect(() => {
    if (user) {
      setCopilotMessages([
        { role: 'assistant', text: `Hello ${user.name || 'Partner'}! I found 4 things you should know today:\n\n📈 Cappuccino sales are up 24%.\n⚠️ Milk inventory may run out tomorrow.\n💰 Tuesday revenue is 12% below average.\n🎯 18 customers haven't visited in 30 days.` }
      ]);
    }
  }, [user]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !tenantId) return;
    const token = localStorage.getItem('token');

    // Fetch Tenant Info
    axios.get(`${API}/tenants/public/${tenantId}`)
      .then((res) => {
        setTenantInfo(res.data);
        if (res.data.settings?.categories) {
          setCategories(res.data.settings.categories);
        }
      })
      .catch((err) => console.error(err));

    // Fetch Menu Items
    axios.get(`${API}/menu?tenantId=${tenantId}`)
      .then((res) => setItems(res.data))
      .catch((err) => console.error('Fetch menu error:', err));

    // Fetch Orders
    axios.get(`${API}/orders`, { headers: { 'x-auth-token': token } })
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err));

    // Fetch Analytics if on dashboard
    if (activeTab === 'dashboard') {
      axios.get(`${API}/orders/analytics`, { headers: { 'x-auth-token': token } })
        .then(res => setAnalytics(res.data))
        .catch(err => console.error(err));
    }

    // Socket Listeners
    if (socket) {
      socket.on('newOrder', (newOrder) => {
        setOrders((prev) => [newOrder, ...prev]);
        toast.success("New Order Received!");
        // Refresh analytics on new order
        if (activeTab === 'dashboard') {
          axios.get(`${API}/orders/analytics`, { headers: { 'x-auth-token': token } }).then(res => setAnalytics(res.data));
        }
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
  }, [user, tenantId, socket, activeTab]);

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newItem).forEach((key) => {
      if (newItem[key] !== null) formData.append(key, newItem[key]);
    });

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' },
      };

      if (editingItem) {
        await axios.put(`${API}/menu/${editingItem._id}`, formData, config);
      } else {
        await axios.post(`${API}/menu`, formData, config);
      }

      setIsPopupOpen(false);
      // Refresh items
      axios.get(`${API}/menu?tenantId=${tenantId}`).then((res) => setItems(res.data));
      toast.success(editingItem ? 'Item updated' : 'Item added');
    } catch (err) {
      console.error(err);
      toast.error('Error saving item');
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/menu/${itemId}`, {
        headers: { 'x-auth-token': token }
      });
      setItems((prev) => prev.filter((item) => item._id !== itemId));
      toast.success(`"${itemName}" and its image deleted successfully`);
    } catch (err) {
      console.error('Delete item error:', err);
      toast.error('Failed to delete item');
    }
  };

  const handleUploadItemImage = async (itemId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Uploading & updating image on Cloudinary...');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/menu/${itemId}`, formData, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
      });
      setItems((prev) => prev.map((item) => item._id === itemId ? res.data : item));
      toast.success('Image updated successfully!', { id: toastId });
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Failed to upload image', { id: toastId });
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/orders/${orderId}/status`, { status }, { headers: { 'x-auth-token': token } });
      toast.success(`Order marked as ${status}`);
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  const handleTimeUpdate = async (orderId, time) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/orders/${orderId}/time`, { time }, { headers: { 'x-auth-token': token } });
      toast.success(`Estimated time updated to ${time} mins`);
    } catch (err) {
      toast.error('Error updating time');
    }
  };

  // --- Category Management ---
  const saveCategories = async (newCategories) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/tenants/settings`, { categories: newCategories }, {
        headers: { 'x-auth-token': token }
      });
      setCategories(newCategories);
      toast.success("Categories updated!");
    } catch (err) {
      toast.error("Failed to update categories");
    }
  };

  const addCategory = (preset) => {
    // Check if exists
    if (categories.some(c => c.id === preset.id)) {
      toast.error("Category already exists");
      return;
    }
    const newCats = [...categories, { name: preset.name, id: preset.id, icon: preset.icon }];
    saveCategories(newCats);
  };

  const removeCategory = (id) => {
    const newCats = categories.filter(c => c.id !== id);
    saveCategories(newCats);
  };

  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!logoFile) return;
    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/tenants/settings`, formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success("Logo updated successfully!");
      setIsLogoModalOpen(false);
      // Refresh tenant info
      const res = await axios.get(`${API}/tenants/public/${tenantId}`);
      setTenantInfo(res.data);
    } catch (err) {
      toast.error("Failed to upload logo");
    }
  };

  const handleGenerateQR = () => {
    const count = parseInt(qrCount);
    if (count > 30) {
      toast.error("Maximum 30 tables allowed");
      return;
    }
    if (count < 1) {
      toast.error("At least 1 table required");
      return;
    }
    setGeneratedQrs(count);
    toast.success(`Generated QR codes for ${count} tables`);
  };

  const handleCopilotSubmit = async (e) => {
    e.preventDefault();
    if (!copilotQuery.trim()) return;

    const userMessage = { role: 'user', text: copilotQuery };
    setCopilotMessages(prev => [...prev, userMessage]);
    const query = copilotQuery;
    setCopilotQuery('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/copilot`, { query }, {
        headers: { 'x-auth-token': token }
      });
      setCopilotMessages(prev => [...prev, { role: 'assistant', text: response.data.reply }]);
    } catch (err) {
      setCopilotMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an issue analyzing the data. Please try again." }]);
    }
  };

  const handleImportMenu = async (e) => {
    e.preventDefault();
    if (!importingFile) return;

    setIsExtracting(true);
    setExtractionProgress(10);
    setExtractionStageText("Preprocessing Image & Pre-scanning Document Layout...");

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', importingFile);

      setExtractionProgress(25);
      setExtractionStageText("Analyzing Menu Card with Gemini Vision & Bounding Boxes...");

      // Stage 1: Menu Document Layout Extraction
      const response = await axios.post(`${API}/ai/extract-menu`, formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });

      const extractedList = response.data?.menu?.items || response.data?.items || [];
      setExtractedItems(extractedList);
      setExtractionProgress(40);
      setExtractionStageText(`Extracted ${extractedList.length} items! Searching Web CDNs & AI Photos...`);

      toast.success(`Extracted ${extractedList.length} items! Fetching Dish Photos...`);

      // Stage 2: Decoupled Web CDN & AI Image Enrichment in Chunks with % progress
      let completedCount = 0;
      const totalCount = extractedList.length;

      for (let i = 0; i < extractedList.length; i += 2) {
        const batch = extractedList.slice(i, i + 2);
        await Promise.all(batch.map(async (item) => {
          try {
            const enrichRes = await axios.post(`${API}/ai/enrich-image`, {
              itemId: item.id,
              itemName: item.name,
              category: item.category,
              type: item.type
            }, {
              headers: { 'x-auth-token': token }
            });

            if (enrichRes.data?.success && enrichRes.data?.image?.url) {
              setExtractedItems((prev) =>
                prev.map((it) => it.id === item.id ? { ...it, image: enrichRes.data.image.url } : it)
              );
            }
          } catch (enrichErr) {
            console.error(`Image enrichment failed for ${item.name}:`, enrichErr);
          } finally {
            completedCount++;
            const pct = 40 + Math.round((completedCount / (totalCount || 1)) * 60);
            setExtractionProgress(pct);
            setExtractionStageText(`Enriching Dish Photos: ${completedCount} / ${totalCount} (${pct}%)...`);
          }
        }));
        await new Promise(r => setTimeout(r, 600));
      }

      setExtractionProgress(100);
      setExtractionStageText("Extraction Complete! Review & Edit Below Before Publishing.");

    } catch (err) {
      console.error("Extraction error:", err);
      toast.error("AI menu extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRefetchSingleImage = async (itemId, itemName, category, type) => {
    const toastId = toast.loading(`Refetching photo for "${itemName}"...`);
    try {
      const token = localStorage.getItem('token');
      const enrichRes = await axios.post(`${API}/ai/enrich-image`, {
        itemId, itemName, category, type
      }, {
        headers: { 'x-auth-token': token }
      });

      if (enrichRes.data?.success && enrichRes.data?.image?.url) {
        setExtractedItems((prev) =>
          prev.map((it) => it.id === itemId ? { ...it, image: enrichRes.data.image.url } : it)
        );
        toast.success(`Updated photo for "${itemName}"`, { id: toastId });
      } else {
        toast.error(`Could not fetch photo for "${itemName}"`, { id: toastId });
      }
    } catch (err) {
      toast.error("Photo refetch failed", { id: toastId });
    }
  };

  const handleUpdateExtractedItem = (index, field, value) => {
    setExtractedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveExtractedItem = (index) => {
    setExtractedItems((prev) => prev.filter((_, idx) => idx !== index));
    toast.success("Item removed from import batch");
  };

  const handleSaveExtracted = async () => {
    try {
      const token = localStorage.getItem('token');
      for (const item of extractedItems) {
        const itemImage = item.image || `https://image.pollinations.ai/prompt/delicious%20food%20photo%20of%20${encodeURIComponent(item.name)}%20gourmet%20dish?width=500&height=400&nologo=true`;
        await axios.post(`${API}/menu`, {
          name: item.name,
          price: item.price,
          type: item.type || 'veg',
          category: item.category || 'snacks',
          description: item.description || `Fresh ${item.name}`,
          image: itemImage
        }, {
          headers: { 'x-auth-token': token }
        });
      }
      toast.success("Successfully imported items to your menu!");
      setIsImportModalOpen(false);
      setExtractedItems([]);
      setImportingFile(null);
      const res = await axios.get(`${API}/menu?tenantId=${tenantId}`);
      setItems(res.data);
    } catch (err) {
      console.error("Save extracted items error:", err);
      toast.error("Failed to save menu items");
    }
  };

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <div className={styles.container}>

        {/* Sidebar Navigation - Fixed */}
        <nav className={styles.sidebar}>
          <div className={styles.header}>
            <div className={styles.logoContainer}>
              <div className={styles.logoBox}>F</div>
              <div className={styles.logoText}>
                <span className={styles.logoTitle}>Feast</span>
                <span className={styles.logoSub}>SAAS PLATFORM</span>
              </div>
            </div>
          </div>

          <button 
            style={{
              background: '#84cc16',
              color: '#1a2e05',
              marginBottom: '1rem',
              fontWeight: '800',
              border: 'none',
              borderRadius: '12px',
              padding: '0.8rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer'
            }} 
            onClick={() => setIsCopilotOpen(true)}
          >
            <Sparkles size={20} /> <span>✨ Ask Feast AI</span>
          </button>

          <button className={activeTab === 'dashboard' ? styles.activeNav : ''} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> <span>Overview</span>
          </button>
          <button className={activeTab === 'pos' ? styles.activeNav : ''} onClick={() => setActiveTab('pos')}>
            <IndianRupee size={20} /> <span>POS Billing</span>
          </button>
          <button className={activeTab === 'kot' ? styles.activeNav : ''} onClick={() => setActiveTab('kot')}>
            <ChefHat size={20} /> <span>KOT Monitor</span>
          </button>
          <button className={activeTab === 'inventory' ? styles.activeNav : ''} onClick={() => setActiveTab('inventory')}>
            <Truck size={20} /> <span>Inventory & PO</span>
          </button>
          <button className={activeTab === 'crm' ? styles.activeNav : ''} onClick={() => setActiveTab('crm')}>
            <UserCheck size={20} /> <span>CRM & Loyalty</span>
          </button>
          <button className={activeTab === 'aggregators' ? styles.activeNav : ''} onClick={() => setActiveTab('aggregators')}>
            <Share2 size={20} /> <span>Aggregator Sim</span>
          </button>
          <button className={activeTab === 'orders' ? styles.activeNav : ''} onClick={() => setActiveTab('orders')}>
            <ShoppingBag size={20} /> <span>Orders</span>
            {orders.filter(o => o.status === 'pending').length > 0 &&
              <span className={styles.badge}>{orders.filter(o => o.status === 'pending').length}</span>
            }
          </button>
          <button className={activeTab === 'items' ? styles.activeNav : ''} onClick={() => setActiveTab('items')}>
            <BarChart3 size={20} /> <span>Menu Items</span>
          </button>
          <button className={activeTab === 'categories' ? styles.activeNav : ''} onClick={() => setActiveTab('categories')}>
            <Grid size={20} /> <span>Categories</span>
          </button>
          <button className={activeTab === 'qrcodes' ? styles.activeNav : ''} onClick={() => setActiveTab('qrcodes')}>
            <QrCode size={20} /> <span>QR Codes</span>
          </button>

          <div className={styles.sidebarUser}>
            <div className={styles.userAvatar}>
              {(user?.tenantName || "D").charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.tenantName || "Deepak's Bistro"}</span>
              <span className={styles.userRole}>Administrator</span>
            </div>
          </div>

          <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={16} /> <span>Logout</span>
          </button>
        </nav>

        <div className={styles.contentWrapper}>
          <main className={styles.mainContent}>
            <AnimatePresence mode="wait">

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

              {/* KOT Monitor Tab */}
              {activeTab === 'kot' && (
                <motion.section key="kot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <KOTMonitor 
                    orders={orders} 
                    onUpdateStatus={handleStatusUpdate} 
                  />
                </motion.section>
              )}

              {/* Inventory & Recipes Tab */}
              {activeTab === 'inventory' && (
                <motion.section key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <InventoryRecipes 
                    tenantId={tenantId} 
                    menuItems={items} 
                  />
                </motion.section>
              )}

              {/* CRM & Loyalty Tab */}
              {activeTab === 'crm' && (
                <motion.section key="crm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CRMLoyalty 
                    tenantId={tenantId} 
                  />
                </motion.section>
              )}

              {/* Aggregator Sim Tab */}
              {activeTab === 'aggregators' && (
                <motion.section key="aggregators" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <OnlineAggregators 
                    tenantId={tenantId} 
                  />
                </motion.section>
              )}

              {/* DASHBOARD TAB (Revenue) */}
              {activeTab === 'dashboard' && (
                <motion.section key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.sectionHeader}>
                    <h2>Business Overview</h2>
                  </div>

                  {!analytics ? <div className={styles.loading}><Loader className={styles.spin} /> Loading Stats...</div> : (
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <div className={`${styles.iconBox} ${styles.greenIcon}`}>
                          <IndianRupee size={24} />
                        </div>
                        <div>
                          <span className={styles.statLabel}>Total Revenue</span>
                          <p className={styles.statValue}>₹{analytics.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={`${styles.iconBox} ${styles.blueIcon}`}>
                          <ShoppingBag size={24} />
                        </div>
                        <div>
                          <span className={styles.statLabel}>Total Orders</span>
                          <p className={styles.statValue}>{analytics.totalOrders}</p>
                        </div>
                      </div>
                      <div className={styles.statCard}>
                        <div className={`${styles.iconBox} ${styles.orangeIcon}`}>
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <span className={styles.statLabel}>Avg Order Value</span>
                          <p className={styles.statValue}>₹{analytics.totalOrders > 0 ? (analytics.totalRevenue / analytics.totalOrders).toFixed(0) : 0}</p>
                        </div>
                      </div>
                      {/* Logo Section for Enterprise/Premium */}
                      {user?.plan === 'enterprise' && (
                        <div className={styles.statCard}>
                          <div className={`${styles.iconBox} ${styles.blueIcon}`}>
                            <LayoutDashboard size={24} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <span className={styles.statLabel}>Business Branding</span>
                            <div className={styles.brandingActions}>
                              {tenantInfo?.logo ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <img src={tenantInfo.logo} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                  <button className={styles.uploadMiniBtn} onClick={() => setIsLogoModalOpen(true)}>Change Logo</button>
                                </div>
                              ) : (
                                <button className={styles.uploadMiniBtn} onClick={() => setIsLogoModalOpen(true)}>Upload Business Logo</button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.recentOrders}>
                    <h3>Recent Activity</h3>
                    <div className={styles.simpleList}>
                      {orders.slice(0, 5).map(o => (
                        <div key={o._id} className={styles.listItem}>
                          <span className={styles.orderId}>Order #{o._id.slice(-6).toUpperCase()}</span>
                          <span className={`${styles.statusBadge} ${styles[o.status]}`}>{o.status}</span>
                          <span className={styles.itemPrice}>₹{o.total}</span>
                        </div>
                      ))}
                      {orders.length === 0 && <p className={styles.subtext}>No recent orders to display.</p>}
                    </div>
                  </div>
                </motion.section>
              )}

              {/* MENU TAB */}
              {activeTab === 'items' && (
                <motion.section key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.sectionHeader}>
                    <h2>Menu Items</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className={styles.actionBtn} style={{ background: '#10b981', border: 'none', color: 'white' }} onClick={() => setIsImportModalOpen(true)}>
                        📷 Import Menu Image
                      </button>
                      <button className={styles.actionBtn} onClick={() => { setEditingItem(null); setNewItem({ name: '', description: '', price: '', category: '', image: null }); setIsPopupOpen(true); }}>
                        <Plus size={18} /> Add Item
                      </button>
                    </div>
                  </div>
                  <motion.div
                    layout
                    className={styles.itemsGrid}
                  >
                    {items.map((item, idx) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={item._id}
                        className={styles.itemCard}
                      >
                        {getValidFoodImage(item) ? (
                          <div style={{ position: 'relative', width: '100%', height: '180px' }}>
                            <img 
                              src={getValidFoodImage(item)} 
                              alt={item.name} 
                              className={styles.itemImage} 
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div style={{ display: 'none', height: '180px', width: '100%', backgroundColor: '#1e1814', borderBottom: '1px solid var(--border-color)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
                              <ImageIcon size={32} color="#c67c4e" />
                              <span style={{ color: '#c67c4e', fontWeight: '700', fontSize: '0.85rem' }}>Image Not Found</span>
                              <label htmlFor={`replace-file-${item._id}`} style={{ background: 'linear-gradient(135deg, #c67c4e, #a05a2c)', color: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Upload size={14} /> Upload Image
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div style={{ height: '180px', width: '100%', backgroundColor: '#1e1814', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.6rem' }}>
                            <ImageIcon size={36} color="#c67c4e" />
                            <span style={{ color: '#c67c4e', fontWeight: '700', fontSize: '0.85rem' }}>No Image Uploaded</span>
                            <label htmlFor={`replace-file-${item._id}`} style={{ background: 'linear-gradient(135deg, #c67c4e, #a05a2c)', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(198, 124, 78, 0.3)' }}>
                              <Upload size={14} /> Upload Image
                            </label>
                          </div>
                        )}
                        <div className={styles.itemInfo}>
                          <h3>{item.name}</h3>
                          <p className={styles.price}>₹{item.price}</p>
                          <p className={styles.itemDesc}>{item.description}</p>
                          <span className={styles.catBadge}>
                            {categories.find(c => c.id === item.category)?.name || item.category}
                          </span>
                          <div className={styles.actionRow}>
                            <input 
                              type="file" 
                              id={`replace-file-${item._id}`} 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={(e) => { if (e.target.files[0]) handleUploadItemImage(item._id, e.target.files[0]); }} 
                            />
                            <button className={styles.editIconBtn} title="Replace Image" onClick={() => document.getElementById(`replace-file-${item._id}`)?.click()}>
                              <ImagePlus size={16} />
                            </button>
                            <button className={styles.editIconBtn} title="Edit Item Details" onClick={() => { setEditingItem(item); setNewItem(item); setIsPopupOpen(true); }}>
                              <Edit3 size={16} />
                            </button>
                            <button className={styles.deleteIconBtn} title="Delete Item" onClick={() => handleDeleteItem(item._id, item.name)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.section>
              )}

              {/* CATEGORIES TAB */}
              {activeTab === 'categories' && (
                <motion.section key="categories" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.sectionHeader}>
                    <h2>Manage Categories</h2>
                  </div>

                  <div className={styles.categoryManageWrapper}>
                    {/* Active Categories */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.activeCategoriesSection}>
                      <h3>Active Categories</h3>
                      <div className={styles.activeCatsGrid}>
                        <AnimatePresence>
                          {categories.map((cat) => (
                            <motion.div
                              key={cat.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={styles.activeCatChip}
                            >
                              <span>{cat.name}</span>
                              <button onClick={() => removeCategory(cat.id)} className={styles.removeCatBtn}><X size={14} /></button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    {/* Presets */}
                    <div className={styles.presetsSection}>
                      <h3>Add Category</h3>
                      <p className={styles.subtext}>Click on a category to add it to your menu.</p>
                      <motion.div
                        layout
                        className={styles.presetGrid}
                      >
                        {availableCategories.map((preset, idx) => {
                          const Icon = preset.Component;
                          const isActive = categories.some(c => c.id === preset.id);
                          return (
                            <motion.button
                              key={preset.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className={`${styles.presetBtn} ${isActive ? styles.presetDisabled : ''}`}
                              onClick={() => !isActive && addCategory(preset)}
                            >
                              <Icon size={20} />
                              <span>{preset.name}</span>
                              {isActive && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className={styles.addedCheck}>✓</motion.span>}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <motion.section key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.sectionHeader}>
                    <h2>Live Orders</h2>
                  </div>
                  <motion.div layout className={styles.ordersGrid}>
                    {orders.length === 0 ? <p className={styles.emptyState}>No orders yet.</p> : orders.map((order, idx) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={order._id}
                        className={`${styles.orderCard} ${styles[order.status]}`}
                      >
                        <div className={styles.statusSidebar}></div>
                        <div className={styles.orderBody}>
                          <div className={styles.orderHeader}>
                            <span className={styles.tableTag}>Table {order.tableNumber}</span>
                            <span className={styles.statusBadge}>{order.status}</span>
                          </div>
                          <div className={styles.orderItems}>
                            {order.items.map((it, i) => (
                              <div key={i} className={styles.orderItemRow}>
                                <span>{it.quantity}x {it.name || it.item?.name}</span>
                                <span>₹{(it.price || 0) * it.quantity}</span>
                              </div>
                            ))}
                          </div>
                          <div className={styles.orderFooter}>
                            <div className={styles.orderTotal}>₹{order.total}</div>
                            <div className={styles.orderTime}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>

                          {(order.status === 'pending' || order.status === 'preparing') && (
                            <div className={styles.timeUpdateRow}>
                              <p>Estimated Prep Time</p>
                              <input
                                type="number"
                                placeholder="Mins"
                                className={styles.inputSmall}
                                defaultValue={order.estimatedTime || 20}
                                onBlur={(e) => handleTimeUpdate(order._id, e.target.value)}
                              />
                            </div>
                          )}

                          <div className={styles.orderActions}>
                            {order.status === 'pending' && <button className={styles.acceptBtn} onClick={() => handleStatusUpdate(order._id, 'preparing')}>Accept Order</button>}
                            {order.status === 'preparing' && <button className={styles.readyBtn} onClick={() => handleStatusUpdate(order._id, 'ready')}>Mark as Ready</button>}
                            {order.status === 'ready' && <button className={styles.completeBtn} onClick={() => handleStatusUpdate(order._id, 'completed')}>Complete Payment</button>}
                            {order.status !== 'completed' && order.status !== 'cancelled' && <button className={styles.cancelBtn} onClick={() => handleStatusUpdate(order._id, 'cancelled')}>Cancel</button>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.section>
              )}

              {/* QR CODES TAB */}
              {activeTab === 'qrcodes' && (
                <motion.section key="qrcodes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.sectionHeader}>
                    <h2>Table QR Codes</h2>
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
                    <button className={styles.actionBtn} onClick={handleGenerateQR}>Generate QRs</button>
                    <button className={styles.printBtn} onClick={() => window.print()}>Print All</button>
                  </div>

                  <div className={styles.qrGrid}>
                    {Array.from({ length: generatedQrs }, (_, i) => i + 1).map((n) => (
                      <div key={n} className={styles.qrCard}>
                        <QRCodeComponent url={`${window.location.origin}/menu?table=${n}&tenant=${tenantId}`} />
                        <h3>Table {n}</h3>
                        <a
                          href={`${window.location.origin}/menu?table=${n}&tenant=${tenantId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.qrLink}
                        >
                          Visit Table Link
                        </a>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

            </AnimatePresence>
          </main>
        </div>

        {/* ADD/EDIT ITEM POPUP */}
        {isPopupOpen && (
          <div className={styles.modalOverlay}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>{editingItem ? 'Edit Dish' : 'Add New Dish'}</h2>
                <button className={styles.closeBtn} onClick={() => setIsPopupOpen(false)}><X /></button>
              </div>

              <form onSubmit={handleSaveItem} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label>Dish name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vanilla Latte"
                    className={styles.input}
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.row}>
                  <div className={styles.inputGroup} style={{ flex: 1 }}>
                    <label>Price (₹)</label>
                    <input
                      type="number"
                      placeholder="199"
                      className={styles.input}
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.inputGroup} style={{ flex: 1 }}>
                    <label>Category</label>
                    <select
                      className={styles.input}
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Description</label>
                  <textarea
                    placeholder="Describe the flavors..."
                    className={styles.textarea}
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Product Image</label>
                  <div className={styles.fileUpload}>
                    <input type="file" onChange={(e) => setNewItem({ ...newItem, image: e.target.files[0] })} />
                    <p>{newItem.image ? `Image Selected: ${newItem.image.name}` : 'Click to upload or drag image'}</p>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn}>
                  {editingItem ? 'Update Item' : 'Add Item to Menu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* LOGO UPLOAD MODAL */}
        {isLogoModalOpen && (
          <div className={styles.modalOverlay}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2>Update Branding</h2>
                <button className={styles.closeBtn} onClick={() => setIsLogoModalOpen(false)}><X /></button>
              </div>
              <form onSubmit={handleLogoUpload} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label>Business Logo</label>
                  <div className={styles.fileUpload}>
                    <input type="file" onChange={(e) => setLogoFile(e.target.files[0])} accept="image/*" />
                    <p>{logoFile ? `File: ${logoFile.name}` : 'Click to select business logo'}</p>
                  </div>
                </div>
                <button type="submit" className={styles.submitBtn} disabled={!logoFile}>
                  Save Branding
                </button>
              </form>
            </motion.div>
          </div>
        )}
        {/* AI MENU IMAGE IMPORT MODAL */}
        {isImportModalOpen && (
          <div className={styles.modalOverlay}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.modalContent} style={{ maxWidth: '850px', width: '92%' }}>
              <div className={styles.modalHeader}>
                <h2>📷 Import Menu via Feast AI</h2>
                <button className={styles.closeBtn} onClick={() => { setIsImportModalOpen(false); setExtractedItems([]); setExtractionProgress(0); }}><X /></button>
              </div>

              {/* REAL-TIME PERCENTAGE PROGRESS BAR */}
              {(isExtracting || (extractionProgress > 0 && extractionProgress < 100)) && (
                <div style={{ margin: '1rem 0', backgroundColor: '#1e1814', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(198, 124, 78, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: '800', fontSize: '0.85rem' }}>
                    <span style={{ color: '#c67c4e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Loader size={16} className={styles.spin} /> {extractionStageText}
                    </span>
                    <span style={{ color: '#ffffff', fontWeight: '900' }}>{extractionProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#2a221d', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${extractionProgress}%`, height: '100%', background: 'linear-gradient(90deg, #c67c4e, #d97706)', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )}

              {extractedItems.length === 0 ? (
                <form onSubmit={handleImportMenu} className={styles.form}>
                  <p style={{ color: '#b5a494', fontSize: '0.85rem' }}>Upload an image of your physical paper menu card. Feast AI will automatically extract items, prices, search Web CDNs & AI photos, and draft pre-publish cards for your review.</p>
                  <div className={styles.inputGroup}>
                    <label>Menu Card Image</label>
                    <div className={styles.fileUpload}>
                      <input type="file" onChange={(e) => setImportingFile(e.target.files[0])} accept="image/*" />
                      <p>{importingFile ? `File Selected: ${importingFile.name}` : 'Click to select menu card image'}</p>
                    </div>
                  </div>
                  <button type="submit" className={styles.submitBtn} disabled={!importingFile || isExtracting}>
                    {isExtracting ? 'Analyzing Menu Card & Web CDNs...' : 'Scan & Extract Items'}
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ color: '#10b981', fontWeight: '700', fontSize: '0.9rem' }}>
                      ✓ Feast AI extracted {extractedItems.length} items. Review & edit details before publishing:
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#b5a494', background: '#1e1814', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(198,124,78,0.15)' }}>
                      Inline Editing Enabled
                    </span>
                  </div>

                  {/* PRE-PUBLISH EDITABLE CARD GRID */}
                  <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem', paddingRight: '4px' }}>
                    {extractedItems.map((item, idx) => (
                      <div key={item.id || idx} style={{ backgroundColor: '#120e0c', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(217, 119, 6, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#1e1814', border: '1px solid var(--border-color)' }}>
                            {item.image ? (
                              <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <Loader size={18} className={styles.spin} color="#c67c4e" />
                                <span style={{ fontSize: '0.6rem', color: '#c67c4e', fontWeight: '700' }}>Fetching...</span>
                              </div>
                            )}
                            <div style={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', gap: '3px' }}>
                              <button title="Re-fetch Web/AI Photo" onClick={() => handleRefetchSingleImage(item.id, item.name, item.category, item.type)} style={{ background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '6px', color: '#c67c4e', padding: '4px', cursor: 'pointer' }}>
                                <RefreshCw size={12} />
                              </button>
                            </div>
                          </div>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input 
                                type="text" 
                                value={item.name} 
                                onChange={(e) => handleUpdateExtractedItem(idx, 'name', e.target.value)} 
                                style={{ background: '#1e1814', border: '1px solid rgba(198,124,78,0.25)', color: '#ffffff', fontWeight: '800', fontSize: '0.85rem', padding: '4px 8px', borderRadius: '6px', width: '100%' }} 
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span style={{ color: '#d97706', fontWeight: '900', fontSize: '0.85rem' }}>₹</span>
                              <input 
                                type="number" 
                                value={item.price} 
                                onChange={(e) => handleUpdateExtractedItem(idx, 'price', parseFloat(e.target.value) || 0)} 
                                style={{ background: '#1e1814', border: '1px solid rgba(198,124,78,0.25)', color: '#d97706', fontWeight: '900', fontSize: '0.85rem', padding: '4px 8px', borderRadius: '6px', width: '80px' }} 
                              />
                              <button 
                                onClick={() => handleUpdateExtractedItem(idx, 'type', item.type === 'veg' ? 'non-veg' : 'veg')}
                                style={{ background: item.type === 'veg' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: item.type === 'veg' ? '1px solid #10b981' : '1px solid #ef4444', color: item.type === 'veg' ? '#10b981' : '#ef4444', fontSize: '0.65rem', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', textTransform: 'uppercase' }}
                              >
                                {item.type || 'veg'}
                              </button>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveExtractedItem(idx)} title="Delete Item" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select 
                            value={item.category} 
                            onChange={(e) => handleUpdateExtractedItem(idx, 'category', e.target.value)}
                            style={{ background: '#1e1814', border: '1px solid rgba(198,124,78,0.25)', color: '#b5a494', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', width: '50%' }}
                          >
                            <option value="hot-coffee">Hot Coffee</option>
                            <option value="cold-coffee">Cold Coffee</option>
                            <option value="burger">Burger</option>
                            <option value="pizza">Pizza</option>
                            <option value="sandwich">Sandwich</option>
                            <option value="snacks">Snacks</option>
                            <option value="wraps">Wraps</option>
                            <option value="pasta">Pasta</option>
                            <option value="cold-drinks">Cold Drinks</option>
                            <option value="mocktails">Mocktails</option>
                            <option value="shakes">Shakes</option>
                            <option value="desserts">Desserts</option>
                          </select>
                        </div>

                        <textarea 
                          value={item.description} 
                          onChange={(e) => handleUpdateExtractedItem(idx, 'description', e.target.value)} 
                          style={{ background: '#1e1814', border: '1px solid rgba(198,124,78,0.25)', color: '#b5a494', fontSize: '0.75rem', padding: '6px 8px', borderRadius: '6px', resize: 'vertical', minHeight: '42px', fontFamily: 'inherit' }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <button onClick={handleSaveExtracted} className={styles.submitBtn} style={{ flex: 1 }}>
                      Publish {extractedItems.length} Items to Restaurant Menu
                    </button>
                    <button onClick={() => { setExtractedItems([]); setExtractionProgress(0); }} className={styles.actionBtn} style={{ background: '#232530', color: '#b5a494', flex: 0.3 }}>
                      Re-scan
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* FEAST AI COPILOT FLYOUT DRAWER */}
        <AnimatePresence>
          {isCopilotOpen && (
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setIsCopilotOpen(false)}>
              <motion.div 
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                style={{ width: '420px', backgroundColor: '#ffffff', borderLeft: '1px solid #e4e5e1', padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.05)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e4e5e1', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ background: '#ecfccb', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                      <Sparkles size={20} color="#84cc16" />
                    </div>
                    <div>
                      <span style={{ color: '#1e293b', fontWeight: '800', fontSize: '1.15rem', display: 'block' }}>Feast AI Copilot</span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '500' }}>Smart Cafe Insights</span>
                    </div>
                  </div>
                  <button onClick={() => setIsCopilotOpen(false)} style={{ background: '#f4f4f0', border: '1px solid #e4e5e1', borderRadius: '10px', color: '#64748b', cursor: 'pointer', padding: '6px' }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Messages Log */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', paddingRight: '5px' }}>
                  {copilotMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.role === 'user' ? '#84cc16' : '#f4f4f0',
                        color: msg.role === 'user' ? '#1a2e05' : '#1e293b',
                        padding: '1rem 1.25rem',
                        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        maxWidth: '88%',
                        fontSize: '0.88rem',
                        lineHeight: '1.55',
                        border: msg.role === 'user' ? 'none' : '1px solid #e4e5e1',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        whiteSpace: 'pre-wrap',
                        fontWeight: '500'
                      }}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Input Field */}
                <form onSubmit={handleCopilotSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Ask Feast AI anything..." 
                    value={copilotQuery}
                    onChange={(e) => setCopilotQuery(e.target.value)}
                    style={{ flex: 1, backgroundColor: '#f4f4f0', border: '1px solid #e4e5e1', borderRadius: '14px', padding: '0.85rem 1.15rem', color: '#1e293b', fontSize: '0.88rem', outline: 'none' }}
                  />
                  <button type="submit" style={{ background: '#84cc16', border: 'none', borderRadius: '14px', padding: '0.85rem 1.25rem', color: '#1a2e05', fontWeight: '800', cursor: 'pointer', boxShadow: 'none' }}>
                    Send
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div >
  );
}

export default AdminPanel;