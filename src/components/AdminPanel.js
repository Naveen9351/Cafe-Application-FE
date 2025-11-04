import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import QRCodeComponent from './QRCodeComponent';
import styles from './AdminPanel.module.css';

const API = process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api';
const socket = io(API);

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
  const [selectedMonth, setSelectedMonth] = useState('');
  const [monthlyData, setMonthlyData] = useState([]);
  const navigate = useNavigate();

  // Progress Bar
  useEffect(() => {
    const calculateProgress = () => {
      const newProgress = {};
      orders.forEach(order => {
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

  // Fetch Data + Socket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/admin/login');

    axios.get(`${API}/menu`).then(res => setItems(res.data)).catch(console.error);
    axios.get(`${API}/admin/orders`, { headers: { 'x-auth-token': token } })
      .then(res => setOrders(res.data))
      .catch(() => navigate('/admin/login'));

    socket.on('newOrder', newOrder => setOrders(prev => [newOrder, ...prev]));
    socket.on('orderUpdate', updatedOrder =>
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o))
    );
    socket.on('orderDeleted', ({ id }) =>
      setOrders(prev => prev.filter(o => o._id !== id))
    );

    return () => {
      socket.off('newOrder');
      socket.off('orderUpdate');
      socket.off('orderDeleted');
    };
  }, [navigate]);

  // Save Item
  const handleSaveItem = async e => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newItem).forEach(key => {
      if (newItem[key] !== null) formData.append(key, newItem[key]);
    });

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' } };
      editingItem
        ? await axios.put(`${API}/admin/items/${editingItem._id}`, formData, config)
        : await axios.post(`${API}/admin/items`, formData, config);

      resetForm();
      axios.get(`${API}/menu`).then(res => setItems(res.data));
    } catch {
      alert('Error saving item');
    }
  };

  const resetForm = () => {
    setNewItem({ name: '', description: '', price: '', category: '', image: null });
    setEditingItem(null);
    setIsPopupOpen(false);
  };

  const handleEditItem = item => {
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

  const handleDeleteItem = async id => {
    if (!window.confirm('Delete item?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/items/${id}`, { headers: { 'x-auth-token': token } });
      axios.get(`${API}/menu`).then(res => setItems(res.data));
    } catch {
      alert('Error deleting item');
    }
  };

  const handleTimeUpdate = async orderId => {
    const time = timeUpdate[orderId];
    if (!time || isNaN(time) || Number(time) <= 0) return alert('Enter valid minutes');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/orders/${orderId}/time`, { time: parseFloat(time) }, { headers: { 'x-auth-token': token } });
      setTimeUpdate(prev => ({ ...prev, [orderId]: '' }));
    } catch {
      alert('Error updating time');
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/orders/${orderId}/status`, { status }, { headers: { 'x-auth-token': token } });
    } catch {
      alert('Error updating status');
    }
  };

  const handleDeleteOrder = async orderId => {
    if (!window.confirm('Delete order?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/orders/${orderId}`, { headers: { 'x-auth-token': token } });
    } catch {
      alert('Error deleting order');
    }
  };

  // Monthly Income Table
  const completedOrders = orders.filter(o => o.status === 'done' && o.createdAt);

  const calculateIncome = (start, end) =>
    completedOrders.reduce((sum, o) => {
      const date = new Date(o.createdAt);
      return date >= start && date <= end ? sum + o.total : sum;
    }, 0);

  useEffect(() => {
    if (!selectedMonth) return;
    const [year, month] = selectedMonth.split('-');
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0); // Last day of month

    const daysInMonth = end.getDate();
    const data = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const nextDay = new Date(year, month - 1, day + 1);
      const income = calculateIncome(date, nextDay);
      data.push({ date: date.toLocaleDateString(), income: income.toFixed(2) });
    }

    setMonthlyData(data);
  }, [selectedMonth, orders]);

  // Table Config
  const tables = {
    roof: Array.from({ length: 6 }, (_, i) => `R${i + 1}`),
    hall: Array.from({ length: 12 }, (_, i) => `H${i + 1}`),
    open: Array.from({ length: 6 }, (_, i) => `O${i + 1}`),
  };

  const getQRUrl = id => `https://cafe-application-fe.vercel.app/menu?table=${id}`;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Panel</h1>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        {['items', 'orders', 'qrcodes', 'income'].map(tab => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'items' ? 'Items' : tab === 'orders' ? 'Orders' : tab === 'qrcodes' ? 'QR Codes' : 'Income'}
          </button>
        ))}
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.subtitle}>Menu Items</h2>
            <button className={styles.button} onClick={() => { resetForm(); setIsPopupOpen(true); }}>
              Add Item
            </button>
          </div>
          <div className={styles.ordersGrid}>
            {items.map(item => (
              <div key={item._id} className={styles.orderCard}>
                <img src={item.image} alt={item.name} className={styles.image} />
                <p className={styles.orderText}><span className={styles.orderLabel}>Name:</span> {item.name}</p>
                <p className={styles.orderText}><span className={styles.orderLabel}>Desc:</span> {item.description}</p>
                <p className={styles.orderText}><span className={styles.orderLabel}>Price:</span> ₹{item.price.toFixed(2)}</p>
                <p className={styles.orderText}><span className={styles.orderLabel}>Cat:</span> {item.category}</p>
                <div className={styles.orderActions}>
                  <button onClick={() => handleEditItem(item)} className={styles.updateButton}>Edit</button>
                  <button onClick={() => handleDeleteItem(item._id)} className={styles.deleteButton}>Delete</button>
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
            {orders.map(order => (
              <div key={order._id} className={styles.orderCard}>
                <p className={styles.orderText}><span className={styles.orderLabel}>Table:</span> {order.tableNumber}</p>
                <p className={styles.orderText}>
                  <span className={styles.orderLabel}>Status:</span>{' '}
                  <span className={order.status === 'done' ? styles.statusDone : styles.statusPreparing}>
                    {order.status}
                  </span>
                </p>
                {order.status === 'preparing' && order.estimatedTime && order.timeSetAt ? (
                  <>
                    <p className={styles.orderText}>
                      Time Left: {Math.max(0, Math.ceil((order.estimatedTime * 60 - (Date.now() - new Date(order.timeSetAt).getTime()) / 1000) / 60))} mins
                    </p>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${progress[order._id] || 0}%` }}></div>
                    </div>
                  </>
                ) : (
                  <p className={styles.orderText}><span className={styles.orderLabel}>Est. Time:</span> {order.estimatedTime ? `${order.estimatedTime} mins` : 'N/A'}</p>
                )}
                <p className={styles.orderText}>
                  <span className={styles.orderLabel}>Items:</span> {order.items.map((it, i) => `${it.name} x${order.quantities[i]}`).join(', ')}
                </p>
                <p className={styles.orderText}><span className={styles.orderLabel}>Total:</span> ₹{order.total.toFixed(2)}</p>
                <div className={styles.orderActions}>
                  <input
                    type="number"
                    placeholder="Mins"
                    value={timeUpdate[order._id] || ''}
                    onChange={e => setTimeUpdate({ ...timeUpdate, [order._id]: e.target.value })}
                    className={styles.timeInput}
                    disabled={['done', 'canceled'].includes(order.status)}
                    min="1"
                  />
                  <button onClick={() => handleTimeUpdate(order._id)} className={styles.updateButton} disabled={['done', 'canceled'].includes(order.status)}>
                    Set Time
                  </button>
                  <button onClick={() => handleStatusUpdate(order._id, 'done')} className={styles.statusButton} disabled={['done', 'canceled'].includes(order.status)}>
                    Done
                  </button>
                  <button onClick={() => handleStatusUpdate(order._id, 'canceled')} className={styles.cancelButton} disabled={['done', 'canceled'].includes(order.status)}>
                    Cancel
                  </button>
                  <button onClick={() => handleDeleteOrder(order._id)} className={styles.deleteButton}>
                    Delete
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
          <p>Print and place on tables</p>
          {Object.entries(tables).map(([area, ids]) => (
            <div key={area} style={{ marginBottom: '2rem' }}>
              <h3 style={{ textTransform: 'capitalize', margin: '1rem 0 0.5rem', color: '#1f2937', fontWeight: '600' }}>
                {area === 'roof' ? 'Roof (R1–R6)' : area === 'hall' ? 'Hall (H1–H12)' : 'Open Area (O1–O6)'}
              </h3>
              <div className={styles.qrGrid}>
                {ids.map(id => (
                  <div key={id} className={styles.qrCard}>
                    <QRCodeComponent url={getQRUrl(id)} tableNumber={id} />
                    <p style={{ marginTop: '8px', fontWeight: '600', fontSize: '0.9rem' }}>{id}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Income Tab */}
      {activeTab === 'income' && (
        <section className={styles.section}>
          <h2 className={styles.subtitle}>Monthly Income</h2>
          <div style={{ marginBottom: '24px' }}>
            <label className={styles.label}>Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className={styles.input}
            />
          </div>
          {selectedMonth && monthlyData.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', boxShadow: '0 1px 6px rgba(0,0,0,0.1)' }}>
                <thead>
                  <tr style={{ background: '#1d4ed8', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Income (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{row.date}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>₹{row.income}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0f7ff', fontWeight: 'bold' }}>
                    <td style={{ padding: '12px' }}>Total</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      ₹{monthlyData.reduce((sum, d) => sum + parseFloat(d.income), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Add/Edit Item Popup */}
      {isPopupOpen && (
        <div className={styles.popup}>
          <div className={styles.popupContent}>
            <button className={styles.closeButton} onClick={() => setIsPopupOpen(false)}>×</button>
            <h2 className={styles.subtitle}>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            <form onSubmit={handleSaveItem} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Name</label>
                  <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className={styles.input} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Price (₹)</label>
                  <input type="number" step="0.01" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} className={styles.input} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Category</label>
                  <input type="text" value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className={styles.input} required />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.label}>Description</label>
                  <textarea value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className={styles.textarea} required />
                </div>
                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                  <label className={styles.label}>Image {editingItem && '(Optional)'}</label>
                  {editingItem && <img src={editingItem.image} alt="Current" className={styles.imagePreview} />}
                  <input type="file" accept="image/*" onChange={e => setNewItem({ ...newItem, image: e.target.files[0] })} className={styles.fileInput} {...(!editingItem && { required: true })} />
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