import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Trash2, Edit3, LayoutDashboard, ShoppingBag, QrCode, BarChart3, X, LogOut, Loader, TrendingUp, IndianRupee,
  UtensilsCrossed, Coffee, Pizza, Sandwich, IceCream, Croissant, GlassWater, Martini, Cake, Soup, Cookie, Beer, Wine, Grid
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeComponent from './QRCodeComponent';
import styles from './AdminPanel.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';

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

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <div className={styles.container}>

        {/* Sidebar Navigation - Fixed */}
        <nav className={styles.sidebar}>
          <div className={styles.header}>
            <div className={styles.logoSlot}>
              <h1>{user?.tenantName || "Dash"}</h1>
            </div>
          </div>

          <button className={activeTab === 'dashboard' ? styles.activeNav : ''} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> <span>Overview</span>
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

          <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={16} /> <span>Logout</span>
          </button>
        </nav>

        <div className={styles.contentWrapper}>
          <main className={styles.mainContent}>
            <AnimatePresence mode="wait">

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
                    <button className={styles.actionBtn} onClick={() => { setEditingItem(null); setNewItem({ name: '', description: '', price: '', category: '', image: null }); setIsPopupOpen(true); }}>
                      <Plus size={18} /> Add Item
                    </button>
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
                        <img src={item.image || "/placeholder-food.jpg"} alt={item.name} className={styles.itemImage} />
                        <div className={styles.itemInfo}>
                          <h3>{item.name}</h3>
                          <p className={styles.price}>₹{item.price}</p>
                          <p className={styles.itemDesc}>{item.description}</p>
                          <span className={styles.catBadge}>
                            {categories.find(c => c.id === item.category)?.name || item.category}
                          </span>
                          <div className={styles.actionRow}>
                            <button className={styles.editIconBtn} onClick={() => { setEditingItem(item); setNewItem(item); setIsPopupOpen(true); }}><Edit3 size={16} /></button>
                            <button className={styles.deleteIconBtn}><Trash2 size={16} /></button>
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

      </div>
    </div >
  );
}

export default AdminPanel;