import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './SuperAdminDashboard.module.css';
import { BarChart3, Users, CreditCard, Building, Plus, LogOut, Trash2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : (process.env.REACT_APP_API_URL || 'https://cafe-application-be-1.onrender.com/api');

const SuperAdminDashboard = () => {
    const [tenants, setTenants] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [editingTenant, setEditingTenant] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Consolidated Stats
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        activesubs: 0
    });

    const fetchTenantsAndLeads = async () => {
        if (user?.role !== 'super_admin') return;

        try {
            const token = localStorage.getItem('token');
            const [tenantsRes, leadsRes] = await Promise.allSettled([
                axios.get(`${API}/tenants`, { headers: { 'x-auth-token': token } }),
                axios.get(`${API}/leads`, { headers: { 'x-auth-token': token } })
            ]);

            if (tenantsRes.status === 'fulfilled') {
                const fetchedTenants = tenantsRes.value.data;
                setTenants(fetchedTenants);

                const active = fetchedTenants.filter(t => t.subscription.isActive).length;
                const revenue = fetchedTenants.reduce((acc, t) => acc + (t.subscription.price || 0), 0);
                const orders = fetchedTenants.reduce((acc, t) => acc + (t.subscription.orderCount || 0), 0);

                setStats({
                    totalRevenue: revenue,
                    totalOrders: orders,
                    activesubs: active
                });
            }

            if (leadsRes.status === 'fulfilled') {
                setLeads(leadsRes.value.data || []);
            }

            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch super admin data", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenantsAndLeads();
    }, [user]);

    const handleUpdatePlan = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/tenants/${editingTenant._id}/subscription`, {
                plan: editingTenant.subscription.plan
            }, {
                headers: { 'x-auth-token': token }
            });
            setShowModal(false);
            setEditingTenant(null);
            fetchTenants(); // Refresh
        } catch (err) {
            alert("Failed to update plan");
        }
    };

    const handleDeleteTenant = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/tenants/${id}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Business deleted successfully");
            fetchTenants();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete business");
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={styles.container}>
            <Toaster position="top-right" />
            {/* Sidebar / Topbar */}
            <nav className={styles.navbar}>
                <div className={styles.brand}>
                    <div className={styles.logo}>
                        <Zap size={20} fill="#ffd700" />
                    </div>
                    <span>Super<span className={styles.accent}>Admin</span></span>
                </div>
                <div className={styles.navActions}>
                    <button onClick={() => navigate('/register-business')} className={styles.addBtn}>
                        <Plus size={18} /> New Business
                    </button>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </nav>

            <div className={styles.content}>


                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.iconBox} ${styles.blueIcon}`}>
                            <Building size={24} />
                        </div>
                        <div>
                            <h3>Total Businesses</h3>
                            <p className={styles.statValue}>{tenants.length}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.iconBox} ${styles.greenIcon}`}>
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h3>Active Subscriptions</h3>
                            <p className={styles.statValue}>{stats.activesubs}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.iconBox} ${styles.purpleIcon}`}>
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h3>Total Platform Revenue</h3>
                            <p className={styles.statValue}>₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.iconBox} ${styles.orangeIcon}`}>
                            <Users size={24} />
                        </div>
                        <div>
                            <h3>Total Orders Processed</h3>
                            <p className={styles.statValue}>{stats.totalOrders.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className={styles.tableSection}>
                    <div className={styles.tableHeader}>
                        <h2>Registered Businesses</h2>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Business Name</th>
                                    <th>Owner Email</th>
                                    <th>Plan</th>
                                    <th>Usage</th>
                                    <th>Expiry</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map(tenant => (
                                    <tr key={tenant._id}>
                                        <td className={styles.nameCell}>
                                            <div className={styles.avatar}>{tenant.name.charAt(0)}</div>
                                            <div>
                                                <div className={styles.tenantName}>{tenant.name}</div>
                                                <div className={styles.tenantId}>ID: {tenant._id.slice(-6)}</div>
                                            </div>
                                        </td>
                                        <td>{tenant.email}</td>
                                        <td>
                                            <span className={`${styles.badge} ${styles.planBadge}`}>
                                                {tenant.subscription.plan.toUpperCase().replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            {tenant.subscription.orderCount} / {tenant.subscription.orderLimit > 10000 ? '∞' : tenant.subscription.orderLimit}
                                        </td>
                                        <td>{tenant.subscription.endDate ? new Date(tenant.subscription.endDate).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className={styles.actionBtn} onClick={() => { setEditingTenant(tenant); setShowModal(true); }}>Manage Plan</button>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => {
                                                        if (window.confirm(`WARNING: Are you sure you want to delete "${tenant.name}"? This will permanently remove all their menu items, orders, and user accounts. This action cannot be undone.`)) {
                                                            handleDeleteTenant(tenant._id);
                                                        }
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DEMO INQUIRIES & LEADS SECTION */}
                <div className={styles.tableSection} style={{ marginTop: '2rem' }}>
                    <div className={styles.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2>Website Demo Inquiries ({leads.length})</h2>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Prospective restaurant owners who requested a live walkthrough</p>
                        </div>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Contact Name</th>
                                    <th>Restaurant</th>
                                    <th>Outlet Type</th>
                                    <th>City</th>
                                    <th>Phone / Email</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                            No demo requests yet. Submissions from the landing page will appear here in real-time.
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map(lead => (
                                        <tr key={lead._id || lead.id}>
                                            <td className={styles.nameCell}>
                                                <div className={styles.avatar} style={{ background: '#4f46e5' }}>
                                                    {(lead.name || 'L').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className={styles.tenantName}>{lead.name}</div>
                                                    <div className={styles.tenantId}>{lead.phone}</div>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: '600' }}>{lead.restaurantName || lead.outletName || 'N/A'}</td>
                                            <td>
                                                <span className={`${styles.badge}`} style={{ background: '#f1f5f9', color: '#334155' }}>
                                                    {lead.outletType || 'Cafe'}
                                                </span>
                                            </td>
                                            <td>{lead.city || 'India'}</td>
                                            <td>
                                                <div style={{ fontSize: '0.82rem' }}>
                                                    <a href={`tel:${lead.phone}`} style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>{lead.phone}</a>
                                                    {lead.email && <div style={{ color: '#64748b' }}>{lead.email}</div>}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                                            </td>
                                            <td>
                                                <span 
                                                    className={`${styles.badge}`} 
                                                    style={{ 
                                                        background: lead.status === 'converted' ? '#dcfce7' : lead.status === 'contacted' ? '#fef3c7' : '#e0e7ff',
                                                        color: lead.status === 'converted' ? '#166534' : lead.status === 'contacted' ? '#92400e' : '#3730a3',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {(lead.status || 'new').toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Plan Modal */}
            {showModal && editingTenant && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Manage Subscription</h2>
                        <p>Update plan for <strong>{editingTenant.name}</strong></p>

                        <form onSubmit={handleUpdatePlan}>
                            <select
                                className={styles.select}
                                value={editingTenant.subscription.plan}
                                onChange={(e) => setEditingTenant({ ...editingTenant, subscription: { ...editingTenant.subscription, plan: e.target.value } })}
                            >
                                <option value="free_trial">Free Trial (₹0)</option>
                                <option value="basic">Standard (₹100)</option>
                                <option value="enterprise">Premium (₹500)</option>
                            </select>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" className={styles.saveBtn}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
export default SuperAdminDashboard;
