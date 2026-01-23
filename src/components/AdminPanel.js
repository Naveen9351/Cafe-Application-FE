import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  LayoutDashboard,
  ShoppingBag,
  QrCode,
  BarChart3,
  Clock,
  MoreHorizontal,
  X,
  Upload,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeComponent from './QRCodeComponent';
import styles from './AdminPanel.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';
const socket = io(process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com');

function AdminPanel() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null,
  });
  const [editingItem, setEditingItem] = useState(null);
  const [timeUpdate, setTimeUpdate] = useState({});
  const [progress, setProgress] = useState({});
  const [activeTab, setActiveTab] = useState('items'); // items, orders, qrcodes, analytics
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [analytics, setAnalytics] = useState({
    allTime: 0,
    today: 0,
    thisMonth: 0,
    thisYear: 0,
    filter: 'today',
    selectedDate: '',
    filteredIncome: '0.00',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Fetch menu items
    axios.get(`${API}/menu`)
      .then((res) => setItems(res.data))
      .catch((err) => console.error('Fetch menu error:', err));

    // Fetch orders
    axios.get(`${API}/admin/orders`, { headers: { 'x-auth-token': token } })
      .then((res) => setOrders(res.data))
      .catch(() => navigate('/admin/login'));

    // Socket listeners
    socket.on('newOrder', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
      toast.success("New Order Received!");
    });

    socket.on('orderUpdate', (updatedOrder) => {
      setOrders((prev) => prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)));
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderUpdate');
    };
  }, [navigate]);

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
        await axios.put(`${API}/admin/items/${editingItem._id}`, formData, config);
      } else {
        await axios.post(`${API}/admin/items`, formData, config);
      }
      setIsPopupOpen(false);
      // Refresh items
      axios.get(`${API}/menu`).then((res) => setItems(res.data));
    } catch (err) {
      alert('Error saving item');
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/orders/${orderId}/status`, { status }, { headers: { 'x-auth-token': token } });
      toast.success(`Order marked as ${status}`);
    } catch (err) {
      console.error('Update status error:', err);
      toast.error('Error updating status');
    }
  };

  const handleTimeUpdate = async (orderId) => {
    const time = timeUpdate[orderId];
    if (!time || isNaN(time) || Number(time) <= 0) {
      toast.error('Please enter a valid time in minutes');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/orders/${orderId}/time`,
        { time: parseFloat(time) },
        { headers: { 'x-auth-token': token } }
      );
      setTimeUpdate((prev) => ({ ...prev, [orderId]: '' }));
      toast.success("Time updated!");
    } catch (err) {
      console.error('Update time error:', err);
      toast.error('Error updating time');
    }
  };

  return (
    <div className={styles.page}>
      <Toaster position="top-right" />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <LayoutDashboard size={32} color="var(--primary)" />
            <h1 className={styles.title}>Admin Control</h1>
          </div>
          <button className={styles.button} onClick={() => { localStorage.removeItem('token'); navigate('/admin/login'); }}>
            Logout
          </button>
        </header>

        <div className={styles.tabContainer}>
          <button className={`${styles.tabButton} ${activeTab === 'items' ? styles.activeTab : ''}`} onClick={() => setActiveTab('items')}>
            <BarChart3 size={18} style={{ display: 'inline', marginRight: '8px' }} /> Items
          </button>
          <button className={`${styles.tabButton} ${activeTab === 'orders' ? styles.activeTab : ''}`} onClick={() => setActiveTab('orders')}>
            <ShoppingBag size={18} style={{ display: 'inline', marginRight: '8px' }} /> Orders
          </button>
          <button className={`${styles.tabButton} ${activeTab === 'qrcodes' ? styles.activeTab : ''}`} onClick={() => setActiveTab('qrcodes')}>
            <QrCode size={18} style={{ display: 'inline', marginRight: '8px' }} /> Table QR
          </button>
        </div>

        <main>
          <AnimatePresence mode="wait">
            {activeTab === 'items' && (
              <motion.section
                key="items"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className={styles.sectionHeader}>
                  <h2 className={styles.subtitle}>Menu Management</h2>
                  <button className={styles.button} onClick={() => { setEditingItem(null); setNewItem({ name: '', description: '', price: '', category: '', image: null }); setIsPopupOpen(true); }}>
                    <Plus size={18} /> Add New Item
                  </button>
                </div>
                <div className={styles.grid}>
                  {items.map((item) => (
                    <div key={item._id} className={styles.card}>
                      <img src={item.image} alt="" className={styles.itemImage} />
                      <div className={styles.itemInfo}>
                        <h3>{item.name}</h3>
                        <p className={styles.itemPrice}>₹{item.price}</p>
                        <div className={styles.orderActions}>
                          <button className={`${styles.button} ${styles.buttonOutline}`} onClick={() => { setEditingItem(item); setNewItem({ ...item, image: null }); setIsPopupOpen(true); }}>
                            <Edit3 size={16} /> Edit
                          </button>
                          <button className={`${styles.button} ${styles.buttonDanger}`}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {activeTab === 'orders' && (
              <motion.section
                key="orders"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className={styles.sectionHeader}>
                  <h2 className={styles.subtitle}>Active Orders</h2>
                </div>
                <div className={styles.grid}>
                  {orders.map((order) => (
                    <div key={order._id} className={styles.card}>
                      <div className={styles.orderMeta}>
                        <span className={styles.tableTag}>Table #{order.tableNumber}</span>
                        <span className={`${styles.statusIndicator} ${styles['status' + order.status.charAt(0).toUpperCase() + order.status.slice(1)]}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className={styles.orderItems}>
                        {order.items.map((it, i) => (
                          <p key={i}>{it.name} x {order.quantities[i]}</p>
                        ))}
                      </div>
                      <p className={styles.itemPrice}>Total: ₹{order.total}</p>
                      <div className={styles.orderActions}>
                        <div className={styles.timeUpdateRow}>
                          <input
                            type="number"
                            placeholder="Mins"
                            className={styles.input}
                            style={{ width: '80px', padding: '0.4rem' }}
                            value={timeUpdate[order._id] || ''}
                            onChange={(e) => setTimeUpdate({ ...timeUpdate, [order._id]: e.target.value })}
                          />
                          <button
                            className={`${styles.button} ${styles.buttonSmall}`}
                            onClick={() => handleTimeUpdate(order._id)}
                          >
                            Set Time
                          </button>
                        </div>
                        <div className={styles.statusButtonsGroup}>
                          <button className={styles.button} onClick={() => handleStatusUpdate(order._id, 'preparing')}>Prepare</button>
                          <button className={styles.button} onClick={() => handleStatusUpdate(order._id, 'ready')}>Ready</button>
                          <button className={styles.button} onClick={() => handleStatusUpdate(order._id, 'done')}>Serve</button>
                          <button className={`${styles.button} ${styles.buttonDanger}`} onClick={() => handleStatusUpdate(order._id, 'cancelled')}>Cancel</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {activeTab === 'qrcodes' && (
              <motion.section
                key="qrcodes"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <h2 className={styles.subtitle}>Table Assignments</h2>
                <div className={styles.qrGrid}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <div key={n} className={`${styles.card} ${styles.qrCard}`}>
                      <QRCodeComponent url={`${window.location.origin}/menu?table=${n}`} />
                      <span className={styles.qrNumber}>Table {n}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {isPopupOpen && (
            <div className={styles.modal}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={styles.modalContent}
              >
                <div className={styles.sectionHeader}>
                  <h2 className={styles.subtitle}>{editingItem ? 'Edit Item' : 'New Menu Item'}</h2>
                  <button onClick={() => setIsPopupOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                </div>
                <form onSubmit={handleSaveItem}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Name</label>
                    <input className={styles.input} value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Price</label>
                    <input className={styles.input} type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Category</label>
                    <input className={styles.input} value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Description</label>
                    <textarea className={styles.input} value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Image</label>
                    <input type="file" onChange={(e) => setNewItem({ ...newItem, image: e.target.files[0] })} />
                  </div>
                  <button type="submit" className={styles.button} style={{ width: '100%', marginTop: '1rem' }}>Save Item</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AdminPanel;