import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './SuperAdminDashboard.module.css';
import { 
  BarChart3, Users, CreditCard, Building, Plus, LogOut, Trash2, Zap, 
  ChevronLeft, ChevronRight, ShieldAlert, Clock, AlertTriangle, CheckCircle2, History, X, Lock, Image, User, Mail, Phone, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { API_URL as API } from '../config/api';

const SuperAdminDashboard = () => {
    const [tenants, setTenants] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Collapsible Sidebar State
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('businesses'); // 'businesses', 'inquiries', 'history'

    // Modals
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const [editingTenant, setEditingTenant] = useState(null);
    const [historyTenant, setHistoryTenant] = useState(null);
    const [tenantHistoryLogs, setTenantHistoryLogs] = useState([]);

    // Onboarding Form State
    const [onboardForm, setOnboardForm] = useState({
        businessName: '',
        adminName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        plan: '1_month',
        customPrice: 999
    });
    const [isOnboarding, setIsOnboarding] = useState(false);

    // Plan Management Form State
    const [selectedPlan, setSelectedPlan] = useState('1_month');
    const [customPriceVal, setCustomPriceVal] = useState(999);
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        activesubs: 0,
        expiringSoonCount: 0
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
                const resTenants = tenantsRes.value.data;
                const fetchedTenants = Array.isArray(resTenants) ? resTenants : (resTenants?.tenants || []);
                setTenants(fetchedTenants);

                let active = 0;
                let revenue = 0;
                let orders = 0;
                let expiringSoon = 0;

                const now = new Date();

                fetchedTenants.forEach(t => {
                    const sub = t.subscription || {};
                    if (sub.isActive) active++;
                    revenue += Number(sub.price || 0);
                    orders += Number(sub.orderCount || 0);

                    if (sub.endDate) {
                        const daysLeft = Math.ceil((new Date(sub.endDate) - now) / (1000 * 60 * 60 * 24));
                        if (daysLeft >= 0 && daysLeft <= 3 && sub.isActive) {
                            expiringSoon++;
                        }
                    }
                });

                setStats({
                    totalRevenue: revenue,
                    totalOrders: orders,
                    activesubs: active,
                    expiringSoonCount: expiringSoon
                });
            }

            if (leadsRes.status === 'fulfilled') {
                const resData = leadsRes.value.data;
                const leadsList = Array.isArray(resData) ? resData : (resData?.leads || []);
                setLeads(leadsList);
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

    // Handle Onboard Submission
    const handleOnboardSubmit = async (e) => {
        e.preventDefault();
        setIsOnboarding(true);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API}/tenants/onboard`, onboardForm, {
                headers: { 'x-auth-token': token }
            });

            toast.success(`Cafe "${onboardForm.businessName}" onboarded successfully!`);
            setShowOnboardModal(false);
            setOnboardForm({
                businessName: '',
                adminName: '',
                email: '',
                password: '',
                phone: '',
                address: '',
                logo: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400',
                profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
                plan: '1_month',
                customPrice: 999
            });
            fetchTenantsAndLeads();
        } catch (err) {
            console.error("Onboarding error:", err);
            toast.error(err.response?.data?.error || "Failed to onboard cafe");
        } finally {
            setIsOnboarding(false);
        }
    };

    // Handle Activate Plan
    const handleActivatePlan = async (e) => {
        e.preventDefault();
        if (!editingTenant) return;
        setIsUpdatingPlan(true);

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/tenants/${editingTenant._id}/subscription`, {
                plan: selectedPlan,
                customPrice: customPriceVal
            }, {
                headers: { 'x-auth-token': token }
            });

            toast.success(`Plan activated for ${editingTenant.name}`);
            setShowPlanModal(false);
            setEditingTenant(null);
            fetchTenantsAndLeads();
        } catch (err) {
            console.error(err);
            toast.error("Failed to activate plan");
        } finally {
            setIsUpdatingPlan(false);
        }
    };

    // Handle Deactivate Plan
    const handleDeactivatePlan = async (tenantId) => {
        if (!window.confirm("Are you sure you want to deactivate this cafe's plan? Cafe operations will be paused.")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API}/tenants/${tenantId}/deactivate-subscription`, {}, {
                headers: { 'x-auth-token': token }
            });

            toast.success("Plan deactivated successfully");
            if (showPlanModal) setShowPlanModal(false);
            fetchTenantsAndLeads();
        } catch (err) {
            console.error(err);
            toast.error("Failed to deactivate plan");
        }
    };

    // View Subscription History
    const handleViewHistory = async (tenant) => {
        setHistoryTenant(tenant);
        setShowHistoryModal(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/tenants/${tenant._id}/subscription-history`, {
                headers: { 'x-auth-token': token }
            });
            setTenantHistoryLogs(res.data.history || []);
        } catch (err) {
            console.error(err);
            setTenantHistoryLogs(tenant.subscriptionHistory || []);
        }
    };

    const handleDeleteTenant = async (id, name) => {
        if (!window.confirm(`WARNING: Are you sure you want to delete "${name}"? All menu items, orders, and staff accounts will be permanently removed.`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/tenants/${id}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Business deleted successfully");
            fetchTenantsAndLeads();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete business");
        }
    };

    const handleDeleteLead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/leads/${id}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Lead inquiry deleted");
            fetchTenantsAndLeads();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete lead inquiry");
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={styles.adminWrapper}>
            <Toaster position="top-right" />

            {/* COLLAPSIBLE SIDEBAR */}
            <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
                <div>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.sidebarBrand}>
                            <div className={styles.logo}>
                                <Zap size={20} fill="#ffd700" />
                            </div>
                            {!sidebarCollapsed && <span>SERVIQ <span style={{ color: '#6366f1' }}>SuperAdmin</span></span>}
                        </div>
                        <button 
                            type="button" 
                            className={styles.collapseToggleBtn} 
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    </div>

                    <nav className={styles.sidebarNav}>
                        <button 
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'businesses' ? styles.activeNavItem : ''}`}
                            onClick={() => setActiveTab('businesses')}
                            title="Registered Cafes"
                        >
                            <Building size={20} />
                            {!sidebarCollapsed && <span>Registered Cafes ({tenants.length})</span>}
                        </button>

                        <button 
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'inquiries' ? styles.activeNavItem : ''}`}
                            onClick={() => setActiveTab('inquiries')}
                            title="Demo Inquiries"
                        >
                            <Users size={20} />
                            {!sidebarCollapsed && <span>Demo Leads ({leads.length})</span>}
                        </button>
                    </nav>
                </div>

                <div style={{ padding: '1rem' }}>
                    <button 
                        type="button" 
                        onClick={handleLogout} 
                        className={styles.logoutBtn}
                        style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                        title="Sign Out"
                    >
                        <LogOut size={18} />
                        {!sidebarCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className={styles.mainArea}>
                
                {/* TOP HEADER BAR */}
                <header className={styles.navbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                            Platform Governance & SaaS Operations
                        </h2>
                    </div>

                    <div className={styles.navActions}>
                        <button 
                            type="button" 
                            onClick={() => setShowOnboardModal(true)} 
                            className={styles.addBtn}
                        >
                            <Plus size={18} /> Onboard New Cafe
                        </button>
                    </div>
                </header>

                <div className={styles.content}>
                    
                    {/* STATS CARDS */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={`${styles.iconBox} ${styles.blueIcon}`}>
                                <Building size={24} />
                            </div>
                            <div>
                                <h3>Total Cafes</h3>
                                <p className={styles.statValue}>{tenants.length}</p>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.iconBox} ${styles.greenIcon}`}>
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h3>Active Plans</h3>
                                <p className={styles.statValue}>{stats.activesubs}</p>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.iconBox} ${styles.purpleIcon}`}>
                                <BarChart3 size={24} />
                            </div>
                            <div>
                                <h3>Total Platform Revenue</h3>
                                <p className={styles.statValue}>₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        <div className={styles.statCard} style={{ borderColor: stats.expiringSoonCount > 0 ? '#f59e0b' : undefined }}>
                            <div className={`${styles.iconBox}`} style={{ background: '#fef3c7', color: '#d97706' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3>Expiring in ≤ 3 Days</h3>
                                <p className={styles.statValue} style={{ color: stats.expiringSoonCount > 0 ? '#d97706' : undefined }}>
                                    {stats.expiringSoonCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* EXPIRING SOON WARNING BANNER */}
                    {stats.expiringSoonCount > 0 && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '14px 20px', borderRadius: '16px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: 12, color: '#92400e', fontSize: '13px', fontWeight: 700 }}>
                            <AlertTriangle size={20} color="#d97706" />
                            <span>
                                <strong>Notification Alert:</strong> {stats.expiringSoonCount} cafe subscription(s) will expire within the next 3 days. Please review and renew their plans to prevent service interruption.
                            </span>
                        </div>
                    )}

                    {/* SECTION 1: REGISTERED CAFES */}
                    {activeTab === 'businesses' && (
                        <div className={styles.tableSection}>
                            <div className={styles.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2>Registered Cafes ({tenants.length})</h2>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Manage cafe subscriptions, activation, history, and logo/branding</p>
                                </div>
                                <button type="button" onClick={() => setShowOnboardModal(true)} className={styles.actionBtn}>
                                    + Onboard Cafe
                                </button>
                            </div>

                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Cafe & Logo</th>
                                            <th>Owner Admin</th>
                                            <th>Current Plan</th>
                                            <th>Status & Alerts</th>
                                            <th>Expiry Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenants.map(tenant => {
                                            const sub = tenant.subscription || {};
                                            const logo = tenant.settings?.logo || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400';
                                            
                                            const now = new Date();
                                            const endDate = sub.endDate ? new Date(sub.endDate) : null;
                                            const daysLeft = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;

                                            const isExpiring3Days = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && sub.isActive;
                                            const isExpired = endDate && endDate < now;

                                            return (
                                                <tr key={tenant._id}>
                                                    <td className={styles.nameCell}>
                                                        <img 
                                                            src={logo} 
                                                            alt="Cafe Logo" 
                                                            style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1px solid #e2e8f0' }} 
                                                        />
                                                        <div>
                                                            <div className={styles.tenantName}>{tenant.name}</div>
                                                            <div className={styles.tenantId}>ID: #{tenant._id.slice(-6)}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{tenant.email}</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{tenant.phone || 'No phone'}</div>
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.badge} ${styles.planBadge}`}>
                                                            {sub.plan ? sub.plan.replace('_', ' ').toUpperCase() : 'NO PLAN'} (₹{sub.price || 0})
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {!sub.isActive ? (
                                                            <span className={styles.badge} style={{ background: '#fee2e2', color: '#dc2626' }}>
                                                                Deactivated
                                                            </span>
                                                        ) : isExpiring3Days ? (
                                                            <span className={styles.badge} style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d' }}>
                                                                ⚠️ Expiring in {daysLeft} Days
                                                            </span>
                                                        ) : isExpired ? (
                                                            <span className={styles.badge} style={{ background: '#fee2e2', color: '#dc2626' }}>
                                                                Expired
                                                            </span>
                                                        ) : (
                                                            <span className={styles.badge} style={{ background: '#dcfce7', color: '#166534' }}>
                                                                Active ({daysLeft !== null ? `${daysLeft} days` : 'Unlimited'})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ fontSize: '13px', fontWeight: 600 }}>
                                                        {endDate ? endDate.toLocaleDateString('en-IN') : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            <button 
                                                                type="button"
                                                                className={styles.actionBtn} 
                                                                onClick={() => {
                                                                    setEditingTenant(tenant);
                                                                    setSelectedPlan(sub.plan || '1_month');
                                                                    setCustomPriceVal(sub.price || 999);
                                                                    setShowPlanModal(true);
                                                                }}
                                                            >
                                                                Manage Plan
                                                            </button>

                                                            {sub.isActive ? (
                                                                <button 
                                                                    type="button"
                                                                    className={styles.deleteBtn}
                                                                    style={{ color: '#d97706', borderColor: '#fcd34d', background: '#fffbeb' }}
                                                                    onClick={() => handleDeactivatePlan(tenant._id)}
                                                                >
                                                                    Deactivate
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    type="button"
                                                                    className={styles.actionBtn}
                                                                    style={{ color: '#166534', borderColor: '#86efac', background: '#f0fdf4' }}
                                                                    onClick={() => {
                                                                        setEditingTenant(tenant);
                                                                        setSelectedPlan(sub.plan || '1_month');
                                                                        setShowPlanModal(true);
                                                                    }}
                                                                >
                                                                    Activate
                                                                </button>
                                                            )}

                                                            <button 
                                                                type="button"
                                                                className={styles.actionBtn}
                                                                onClick={() => handleViewHistory(tenant)}
                                                                title="View Plan History"
                                                            >
                                                                <History size={14} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className={styles.deleteBtn}
                                                                onClick={() => handleDeleteTenant(tenant._id, tenant.name)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: DEMO INQUIRIES */}
                    {activeTab === 'inquiries' && (
                        <div className={styles.tableSection}>
                            <div className={styles.tableHeader}>
                                <h2>Website Demo Inquiries ({leads.length})</h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Requests submitted via the website demo form</p>
                            </div>

                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Contact Name</th>
                                            <th>Email</th>
                                            <th>Phone Number</th>
                                            <th>Date Received</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leads.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                                    No demo inquiries logged yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            leads.map(lead => (
                                                <tr key={lead._id}>
                                                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                                                        {lead.fullName || lead.contactName || 'Lead'}
                                                    </td>
                                                    <td>{lead.workEmail || lead.email}</td>
                                                    <td>
                                                        <a href={`tel:${lead.phone}`} style={{ color: '#4f46e5', fontWeight: 800, textDecoration: 'none' }}>
                                                            {lead.phone}
                                                        </a>
                                                    </td>
                                                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                                                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                                                    </td>
                                                    <td>
                                                        <button 
                                                            type="button"
                                                            className={styles.deleteBtn}
                                                            onClick={() => handleDeleteLead(lead._id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* MODAL 1: ONBOARD NEW CAFE */}
            {showOnboardModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Onboard New Cafe Outlet</h2>
                            <button type="button" onClick={() => setShowOnboardModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                            Setup cafe details, admin owner credentials, logo images, and activate subscription.
                        </p>

                        <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            
                            {/* Cafe Name & Owner Name */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                        Cafe / Business Name *
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. Royal Bistro"
                                        value={onboardForm.businessName}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, businessName: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                        Admin Owner Name *
                                    </label>
                                    <input 
                                        type="text" 
                                        required 
                                        placeholder="e.g. Vikram Sharma"
                                        value={onboardForm.adminName}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, adminName: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            {/* Email & Password */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                        Admin Login Email *
                                    </label>
                                    <input 
                                        type="email" 
                                        required 
                                        placeholder="admin@royalbistro.com"
                                        value={onboardForm.email}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                        Account Password *
                                    </label>
                                    <input 
                                        type="password" 
                                        required 
                                        placeholder="Min 6 chars"
                                        value={onboardForm.password}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            {/* Phone & Address */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                        Mobile Number
                                    </label>
                                    <input 
                                        type="tel" 
                                        placeholder="e.g. +91 98765 43210"
                                        value={onboardForm.phone}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                        Address / Location
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Connaught Place, New Delhi"
                                        value={onboardForm.address}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, address: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            {/* Cafe Logo URL & Admin Profile Image URL */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                        Cafe Logo Image URL
                                    </label>
                                    <input 
                                        type="url" 
                                        placeholder="https://..."
                                        value={onboardForm.logo}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, logo: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                        Admin Profile Picture URL
                                    </label>
                                    <input 
                                        type="url" 
                                        placeholder="https://..."
                                        value={onboardForm.profileImage}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, profileImage: e.target.value })}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            {/* Subscription Plan Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                    Initial Subscription Plan
                                </label>
                                <select 
                                    className={styles.select}
                                    style={{ margin: 0, padding: '10px 12px', fontSize: '13px' }}
                                    value={onboardForm.plan}
                                    onChange={(e) => {
                                        const p = e.target.value;
                                        let pr = 999;
                                        if (p === '6_months') pr = 4999;
                                        if (p === '1_year') pr = 10999;
                                        if (p === 'free_trial') pr = 0;
                                        setOnboardForm({ ...onboardForm, plan: p, customPrice: pr });
                                    }}
                                >
                                    <option value="1_month">1 Month Starter @ ₹999</option>
                                    <option value="6_months">6 Months Saver @ ₹4,999</option>
                                    <option value="1_year">1 Year Ultimate Pro @ ₹10,999</option>
                                    <option value="free_trial">14-Day Free Trial @ ₹0</option>
                                </select>
                            </div>

                            <div className={styles.modalActions} style={{ marginTop: 12 }}>
                                <button type="button" onClick={() => setShowOnboardModal(false)} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" disabled={isOnboarding} className={styles.saveBtn}>
                                    {isOnboarding ? 'Onboarding...' : 'Confirm & Create Cafe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: MANAGE & ACTIVATE PLAN */}
            {showPlanModal && editingTenant && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Manage Cafe Plan</h2>
                            <button type="button" onClick={() => setShowPlanModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                            Activate or update subscription plan for <strong>{editingTenant.name}</strong>.
                        </p>

                        <form onSubmit={handleActivatePlan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                    Select Plan Tier
                                </label>
                                <select
                                    className={styles.select}
                                    style={{ margin: 0, padding: '12px' }}
                                    value={selectedPlan}
                                    onChange={(e) => {
                                        const p = e.target.value;
                                        setSelectedPlan(p);
                                        if (p === '1_month') setCustomPriceVal(999);
                                        if (p === '6_months') setCustomPriceVal(4999);
                                        if (p === '1_year') setCustomPriceVal(10999);
                                        if (p === 'free_trial') setCustomPriceVal(0);
                                    }}
                                >
                                    <option value="1_month">1 Month Starter (₹999)</option>
                                    <option value="6_months">6 Months Saver (₹4,999)</option>
                                    <option value="1_year">1 Year Ultimate Pro (₹10,999)</option>
                                    <option value="free_trial">14-Day Free Trial (₹0)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                    Price (₹)
                                </label>
                                <input 
                                    type="number"
                                    value={customPriceVal}
                                    onChange={(e) => setCustomPriceVal(Number(e.target.value))}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                            </div>

                            <div className={styles.modalActions} style={{ marginTop: 12 }}>
                                <button type="button" onClick={() => setShowPlanModal(false)} className={styles.cancelBtn}>Cancel</button>
                                <button type="submit" disabled={isUpdatingPlan} className={styles.saveBtn}>
                                    {isUpdatingPlan ? 'Activating...' : 'Activate Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: SUBSCRIPTION HISTORY VIEW */}
            {showHistoryModal && historyTenant && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: 640 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Subscription History</h2>
                            <button type="button" onClick={() => setShowHistoryModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                            Historical plan activations and changes for <strong>{historyTenant.name}</strong>
                        </p>

                        <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                            <table className={styles.table} style={{ fontSize: '12px' }}>
                                <thead>
                                    <tr>
                                        <th>Plan Name</th>
                                        <th>Price</th>
                                        <th>Start Date</th>
                                        <th>End Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!tenantHistoryLogs || tenantHistoryLogs.length === 0) ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                                                No subscription history logged yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        tenantHistoryLogs.map((log, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 700 }}>{log.plan}</td>
                                                <td>₹{log.price}</td>
                                                <td>{log.startDate ? new Date(log.startDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                                                <td>{log.endDate ? new Date(log.endDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                                                <td>
                                                    <span className={styles.badge} style={{ 
                                                        background: log.status === 'active' ? '#dcfce7' : '#fee2e2', 
                                                        color: log.status === 'active' ? '#166534' : '#dc2626' 
                                                    }}>
                                                        {(log.status || 'active').toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: 20, textAlign: 'right' }}>
                            <button type="button" onClick={() => setShowHistoryModal(false)} className={styles.cancelBtn}>Close</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SuperAdminDashboard;
