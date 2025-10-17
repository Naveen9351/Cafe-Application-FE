import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
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
  const [activeTab, setActiveTab] = useState('items');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const navigate = useNavigate();

  // Calculate progress for each order
  useEffect(() => {
    const calculateProgress = () => {
      const newProgress = {};
      orders.forEach((order) => {
        if (order.status === 'preparing' && order.estimatedTime && order.timeSetAt) {
          const timeSetAt = new Date(order.timeSetAt).getTime();
          const estimatedMs = order.estimatedTime * 60 * 1000;
          const elapsedMs = Date.now() - timeSetAt;
          const progressPercent = Math.min((elapsedMs / estimatedMs) * 100, 100);
          newProgress[order._id] = progressPercent;
        } else {
          newProgress[order._id] = 0;
        }
      });
      setProgress(newProgress);
    };

    const interval = setInterval(calculateProgress, 1000);
    calculateProgress();

    return () => clearInterval(interval);
  }, [orders]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Fetch menu items
    axios
      .get(`${API}/menu`)
      .then((res) => setItems(res.data))
      .catch((err) => console.error('Fetch menu error:', err));

    // Fetch orders
    axios
      .get(`${API}/admin/orders`, { headers: { 'x-auth-token': token } })
      .then((res) => setOrders(res.data))
      .catch(() => navigate('/admin/login'));

    // Socket listeners
    socket.on('newOrder', (newOrder) => {
      setOrders((prevOrders) => [newOrder, ...prevOrders]);
    });

    socket.on('orderUpdate', (updatedOrder) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order._id === updatedOrder._id ? updatedOrder : order))
      );
    });

    socket.on('orderDeleted', ({ id }) => {
      setOrders((prevOrders) => prevOrders.filter((order) => order._id !== id));
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderUpdate');
      socket.off('orderDeleted');
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
      let res;
      if (editingItem) {
        res = await axios.put(`${API}/admin/items/${editingItem._id}`, formData, config);
      } else {
        res = await axios.post(`${API}/admin/items`, formData, config);
      }
      setNewItem({ name: '', description: '', price: '', category: '', image: null });
      setEditingItem(null);
      setIsPopupOpen(false);
      axios
        .get(`${API}/menu`)
        .then((res) => setItems(res.data))
        .catch((err) => console.error('Fetch menu error:', err));
    } catch (err) {
      console.error('Save item error:', err.response?.data || err.message);
      alert('Error saving item');
    }
  };

  const handleEditItem = (item) => {
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: null,
    });
    setEditingItem(item);
    setIsPopupOpen(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/items/${id}`, {
        headers: { 'x-auth-token': token },
      });
      axios
        .get(`${API}/menu`)
        .then((res) => setItems(res.data))
        .catch((err) => console.error('Fetch menu error:', err));
    } catch (err) {
      console.error('Delete item error:', err.response?.data || err.message);
      alert('Error deleting item');
    }
  };

  const handleTimeUpdate = async (orderId) => {
    const time = timeUpdate[orderId];
    if (!time || isNaN(time) || Number(time) <= 0) {
      alert('Please enter a valid time in minutes');
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
    } catch (err) {
      console.error('Update time error:', err.response?.data || err.message);
      alert('Error updating time');
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/orders/${orderId}/status`,
        { status },
        { headers: { 'x-auth-token': token } }
      );
    } catch (err) {
      console.error('Update status error:', err.response?.data || err.message);
      alert('Error updating status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/orders/${orderId}`, {
        headers: { 'x-auth-token': token },
      });
    } catch (err) {
      console.error('Delete order error:', err.response?.data || err.message);
      alert('Error deleting order');
    }
  };

  // Generate URLs for 12 tables
  const getQRUrl = (tableNum) => {
    return `https://cafe-application-fe.vercel.app/menu?table=${tableNum}`;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Panel</h1>

      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'items' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Items
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'orders' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'qrcodes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('qrcodes')}
        >
          QR Codes
        </button>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.subtitle}>Menu Items</h2>
            <button
              className={styles.button}
              onClick={() => {
                setNewItem({ name: '', description: '', price: '', category: '', image: null });
                setEditingItem(null);
                setIsPopupOpen(true);
              }}
            >
              Add Item
            </button>
          </div>
          <div className={styles.ordersGrid}>
            {items.map((item) => (
              <div key={item._id} className={styles.orderCard}>
                <img src={item.image} alt={item.name} className={styles.image} />
                <p className={styles.orderText}><span className={styles.orderLabel}>Name:</span> {item.name}</p>
                <p className={styles.orderText}><span className={styles.orderLabel}>Description:</span> {item.description}</p>
                <p className={styles.orderText}><span className={styles.orderLabel}>Price:</span> ${item.price.toFixed(2)}</p>
                <p className={styles.orderText}><span className={styles.orderLabel}>Category:</span> {item.category}</p>
                <div className={styles.orderActions}>
                  <button
                    onClick={() => handleEditItem(item)}
                    className={styles.updateButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <section className={styles.section}>
          <h2 className={styles.subtitle}>Orders</h2>
          <div className={styles.ordersGrid}>
            {orders.map((order) => (
              <div key={order._id} className={styles.orderCard}>
                <p className={styles.orderText}><span className={styles.orderLabel}>Table:</span> {order.tableNumber}</p>
                <p className={styles.orderText}>
                  <span className={styles.orderLabel}>Status:</span> 
                  <span className={order.status === 'done' ? styles.statusDone : styles.statusPreparing}>
                    {order.status}
                  </span>
                </p>
                {order.status === 'preparing' && order.estimatedTime && order.timeSetAt ? (
                  <>
                    <p className={styles.orderText}>
                      Time Remaining: {Math.max(0, Math.ceil((order.estimatedTime * 60 - (Date.now() - new Date(order.timeSetAt).getTime()) / 1000) / 60))} mins
                    </p>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${progress[order._id] || 0}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <p className={styles.orderText}><span className={styles.orderLabel}>Estimated Time:</span> {order.estimatedTime ? `${order.estimatedTime} mins` : 'N/A'}</p>
                )}
                <p className={styles.orderText}>
                  <span className={styles.orderLabel}>Items:</span> 
                  {order.items.map((item, i) => `${item.name} x ${order.quantities[i]}`).join(', ')}
                </p>
                <p className={styles.orderText}><span className={styles.orderLabel}>Total:</span> ${order.total.toFixed(2)}</p>
                <div className={styles.orderActions}>
                  <input
                    type="number"
                    placeholder="Time (mins)"
                    value={timeUpdate[order._id] || ''}
                    onChange={(e) => setTimeUpdate({ ...timeUpdate, [order._id]: e.target.value })}
                    className={styles.timeInput}
                    disabled={['done', 'canceled'].includes(order.status)}
                    min="1"
                    step="1"
                  />
                  <button
                    onClick={() => handleTimeUpdate(order._id)}
                    className={styles.updateButton}
                    disabled={['done', 'canceled'].includes(order.status)}
                  >
                    Update Time
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'done')}
                    className={styles.statusButton}
                    disabled={['done', 'canceled'].includes(order.status)}
                  >
                    Mark as Done
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'canceled')}
                    className={styles.cancelButton}
                    disabled={['done', 'canceled'].includes(order.status)}
                  >
                    Cancel Order
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order._id)}
                    className={styles.deleteButton}
                  >
                    Delete Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* QR Codes Tab */}
      {activeTab === 'qrcodes' && (
        <section className={styles.section}>
          <h2 className={styles.subtitle}>Table QR Codes</h2>
          <p>Download QR codes for tables 1 to 12 to place on each table.</p>
          <div className={styles.qrGrid}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((tableNum) => (
              <div key={tableNum} className={styles.qrCard}>
                <QRCodeComponent url={getQRUrl(tableNum)} tableNumber={tableNum.toString()} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popup Form for Adding/Editing Item */}
      {isPopupOpen && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <button
              className={styles.closeButton}
              onClick={() => setIsPopupOpen(false)}
            >
              &times;
            </button>
            <h2 className={styles.subtitle}>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
            <form onSubmit={handleSaveItem} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>Item Name</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Item Name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="price" className={styles.label}>Price</label>
                  <input
                    type="number"
                    id="price"
                    placeholder="Price"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className={styles.input}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="category" className={styles.label}>Category</label>
                  <input
                    type="text"
                    id="category"
                    placeholder="Category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="description" className={styles.label}>Description</label>
                  <textarea
                    id="description"
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className={styles.textarea}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="image" className={styles.label}>Image {editingItem ? '(Optional)' : ''}</label>
                  {editingItem && <img src={editingItem.image} alt="Current" className={styles.imagePreview} />}
                  <input
                    type="file"
                    id="image"
                    onChange={(e) => setNewItem({ ...newItem, image: e.target.files[0] })}
                    className={styles.fileInput}
                    required={!editingItem}
                  />
                </div>
              </div>
              <button type="submit" className={styles.button}>{editingItem ? 'Save Changes' : 'Add Item'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;