import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './SuperAdminDashboard.module.css';
import {
    BarChart3, Users, CreditCard, Building, Plus, LogOut, Trash2, Zap,
    ChevronLeft, ChevronRight, ShieldAlert, Clock, AlertTriangle, CheckCircle2, History, X, Lock, Image, User, Mail, Phone, MapPin, Upload
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { API_URL as API } from '../config/api';

const SuperAdminDashboard = () => {
    const [tenants, setTenants] = useState([]);
    const [leads, setLeads] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Collapsible Sidebar State
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('businesses'); // 'businesses', 'inquiries', 'tickets', 'history'

    // Pagination State
    const [tenantsPage, setTenantsPage] = useState(1);
    const [tenantsPerPage, setTenantsPerPage] = useState(8);
    const [leadsPage, setLeadsPage] = useState(1);
    const [leadsPerPage, setLeadsPerPage] = useState(10);
    const [ticketsPage, setTicketsPage] = useState(1);
    const [ticketsPerPage, setTicketsPerPage] = useState(10);
    const [ticketFilter, setTicketFilter] = useState('all'); // 'all', 'open', 'in_progress', 'resolved', 'closed'

    // Modals
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [viewingScreenshot, setViewingScreenshot] = useState(null);

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
        logo: '',
        plan: '1_month',
        customPrice: 999
    });
    const [isOnboarding, setIsOnboarding] = useState(false);

    // Plan Management Form State
    const [selectedPlan, setSelectedPlan] = useState('1_month');
    const [customPriceVal, setCustomPriceVal] = useState(999);
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
    const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);
    const [ticketAdminNotes, setTicketAdminNotes] = useState('');

    // Stats
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        activesubs: 0,
        expiringSoonCount: 0,
        openTicketsCount: 0
    });

    const fetchTenantsAndLeads = async (silent = false) => {
        if (user?.role !== 'super_admin') return;

        try {
            const token = localStorage.getItem('token');
            const [tenantsRes, leadsRes, ticketsRes] = await Promise.allSettled([
                axios.get(`${API}/tenants`, { headers: { 'x-auth-token': token } }),
                axios.get(`${API}/leads`, { headers: { 'x-auth-token': token } }),
                axios.get(`${API}/tickets/all`, { headers: { 'x-auth-token': token } })
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

                let openCount = 0;
                if (ticketsRes.status === 'fulfilled') {
                    const resTickets = ticketsRes.value.data;
                    const ticketsList = Array.isArray(resTickets) ? resTickets : (resTickets?.tickets || []);
                    setTickets(ticketsList);
                    openCount = ticketsList.filter(t => t.status === 'open' || t.status === 'in_progress').length;
                }

                setStats({
                    totalRevenue: revenue,
                    totalOrders: orders,
                    activesubs: active,
                    expiringSoonCount: expiringSoon,
                    openTicketsCount: openCount
                });
            }

            if (leadsRes.status === 'fulfilled') {
                const resData = leadsRes.value.data;
                const leadsList = Array.isArray(resData) ? resData : (resData?.leads || []);
                setLeads(leadsList);
            }

            if (!silent) setLoading(false);
        } catch (err) {
            console.error("Failed to fetch super admin data", err);
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenantsAndLeads();
        // Real-time polling for tickets every 10 seconds
        const pollTimer = setInterval(() => {
            fetchTenantsAndLeads(true);
        }, 10000);
        return () => clearInterval(pollTimer);
    }, [user]);

    const handleUpdateTicketStatus = async (ticketId, newStatus, adminNotes) => {
        try {
            setIsUpdatingTicket(true);
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API}/tickets/${ticketId}/status`, {
                status: newStatus,
                adminNotes: adminNotes !== undefined ? adminNotes : ticketAdminNotes
            }, {
                headers: { 'x-auth-token': token }
            });

            toast.success(`Ticket status updated to ${newStatus.toUpperCase()}`);
            setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus, adminNotes: adminNotes !== undefined ? adminNotes : ticketAdminNotes } : t));
            if (selectedTicket?._id === ticketId) {
                setSelectedTicket(prev => ({ ...prev, status: newStatus, adminNotes: adminNotes !== undefined ? adminNotes : ticketAdminNotes }));
            }
        } catch (err) {
            console.error('Update ticket status error:', err);
            toast.error(err.response?.data?.error || 'Failed to update ticket status');
        } finally {
            setIsUpdatingTicket(false);
        }
    };

    // Handle Logo Image Upload via File Reader
    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Logo image must be under 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setOnboardForm(prev => ({ ...prev, logo: reader.result }));
                toast.success('Logo selected!');
            };
            reader.readAsDataURL(file);
        }
    };

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
                logo: '',
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

                        <button
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'tickets' ? styles.activeNavItem : ''}`}
                            onClick={() => setActiveTab('tickets')}
                            title="Support & Issue Tickets"
                        >
                            <ShieldAlert size={20} color={tickets.filter(t => t.status === 'open').length > 0 ? '#ef4444' : undefined} />
                            {!sidebarCollapsed && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span>Issue Tickets ({tickets.length})</span>
                                    {tickets.filter(t => t.status === 'open').length > 0 && (
                                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 900, padding: '2px 7px', borderRadius: '100px', marginLeft: 6 }}>
                                            {tickets.filter(t => t.status === 'open').length} NEW
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    </nav>
                </div>

                <div style={{ padding: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
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
                        <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                            <div className={`${styles.iconBox} ${styles.blueIcon}`}>
                                <Building size={24} />
                            </div>
                            <div className={styles.statInfo}>
                                <h3>Total Cafes</h3>
                                <p className={styles.statValue}>{tenants.length}</p>
                            </div>
                        </div>

                        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                            <div className={`${styles.iconBox} ${styles.greenIcon}`}>
                                <CreditCard size={24} />
                            </div>
                            <div className={styles.statInfo}>
                                <h3>Active Plans</h3>
                                <p className={styles.statValue}>{stats.activesubs}</p>
                            </div>
                        </div>

                        <div className={`${styles.statCard} ${styles.statCardPurple}`}>
                            <div className={`${styles.iconBox} ${styles.purpleIcon}`}>
                                <BarChart3 size={24} />
                            </div>
                            <div className={styles.statInfo}>
                                <h3>Total Platform Revenue</h3>
                                <p className={styles.statValue}>₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                            </div>
                        </div>

                        <div className={`${styles.statCard} ${styles.statCardAmber}`} style={{ borderColor: stats.expiringSoonCount > 0 ? '#f59e0b' : undefined }}>
                            <div className={`${styles.iconBox} ${styles.amberIcon}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <div className={styles.statInfo}>
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
                    {activeTab === 'businesses' && (() => {
                        const totalTenantsPages = Math.max(1, Math.ceil(tenants.length / tenantsPerPage));
                        const paginatedTenants = tenants.slice((tenantsPage - 1) * tenantsPerPage, tenantsPage * tenantsPerPage);

                        return (
                            <div className={styles.tableSection}>
                                <div className={styles.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2>Registered Cafes ({tenants.length})</h2>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Manage cafe subscriptions, activation, and status in real-time</p>
                                    </div>
                                    <button type="button" onClick={() => setShowOnboardModal(true)} className={styles.actionBtn}>
                                        + Onboard Cafe
                                    </button>
                                </div>

                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Cafe Name</th>
                                                <th>Owner / Contact</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Current Plan</th>
                                                <th>Status</th>
                                                <th>Expiry Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedTenants.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                                        No cafes registered yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedTenants.map(tenant => {
                                                    const sub = tenant.subscription || {};
                                                    const now = new Date();
                                                    const endDate = sub.endDate ? new Date(sub.endDate) : null;
                                                    const daysLeft = endDate ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)) : null;

                                                    const isExpiring3Days = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && sub.isActive;
                                                    const isExpired = endDate && endDate < now;

                                                    return (
                                                        <tr key={tenant._id}>
                                                            <td className={styles.tenantName}>{tenant.name}</td>
                                                            <td style={{ fontWeight: 600, color: '#334155' }}>
                                                                {tenant.adminName || tenant.ownerName || 'Admin'}
                                                            </td>
                                                            <td style={{ color: '#475569' }}>{tenant.email}</td>
                                                            <td style={{ color: '#475569' }}>{tenant.phone || '—'}</td>
                                                            <td>
                                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                    <span className={`${styles.badge} ${styles.planBadge}`}>
                                                                        {sub.plan ? sub.plan.replace('_', ' ').toUpperCase() : 'NO PLAN'}
                                                                    </span>
                                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
                                                                        ₹{sub.price !== undefined ? Number(sub.price).toLocaleString('en-IN') : 0}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {!sub.isActive ? (
                                                                    <span className={styles.badge} style={{ background: '#fee2e2', color: '#dc2626' }}>
                                                                        Deactivated
                                                                    </span>
                                                                ) : isExpiring3Days ? (
                                                                    <span className={styles.badge} style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d' }}>
                                                                        ⚠️ Expiring ({daysLeft}d)
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
                                                            <td style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                                                {endDate ? endDate.toLocaleDateString('en-IN') : 'N/A'}
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
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
                                                                        className={styles.historyBtn}
                                                                        onClick={() => handleViewHistory(tenant)}
                                                                        title="View Plan History"
                                                                    >
                                                                        <History size={14} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className={styles.deleteBtn}
                                                                        onClick={() => handleDeleteTenant(tenant._id, tenant.name)}
                                                                        title="Delete Tenant"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* PAGINATION CONTROLS */}
                                {tenants.length > 0 && (
                                    <div className={styles.paginationBar}>
                                        <div className={styles.paginationInfo}>
                                            Showing <strong>{Math.min((tenantsPage - 1) * tenantsPerPage + 1, tenants.length)}</strong> to <strong>{Math.min(tenantsPage * tenantsPerPage, tenants.length)}</strong> of <strong>{tenants.length}</strong> cafes
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#64748b' }}>
                                                <span>Per page:</span>
                                                <select
                                                    className={styles.pageSizeSelect}
                                                    value={tenantsPerPage}
                                                    onChange={(e) => {
                                                        setTenantsPerPage(Number(e.target.value));
                                                        setTenantsPage(1);
                                                    }}
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={8}>8</option>
                                                    <option value={10}>10</option>
                                                    <option value={20}>20</option>
                                                </select>
                                            </div>
                                            <div className={styles.paginationControls}>
                                                <button
                                                    type="button"
                                                    className={styles.pageBtn}
                                                    disabled={tenantsPage === 1}
                                                    onClick={() => setTenantsPage(p => Math.max(1, p - 1))}
                                                    title="Previous Page"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                {Array.from({ length: totalTenantsPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        type="button"
                                                        className={`${styles.pageBtn} ${tenantsPage === page ? styles.activePageBtn : ''}`}
                                                        onClick={() => setTenantsPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    className={styles.pageBtn}
                                                    disabled={tenantsPage === totalTenantsPages}
                                                    onClick={() => setTenantsPage(p => Math.min(totalTenantsPages, p + 1))}
                                                    title="Next Page"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* SECTION 2: DEMO INQUIRIES */}
                    {activeTab === 'inquiries' && (() => {
                        const totalLeadsPages = Math.max(1, Math.ceil(leads.length / leadsPerPage));
                        const paginatedLeads = leads.slice((leadsPage - 1) * leadsPerPage, leadsPage * leadsPerPage);

                        return (
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
                                            {paginatedLeads.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                                        No demo inquiries logged yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedLeads.map(lead => (
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

                                {/* PAGINATION CONTROLS FOR INQUIRIES */}
                                {leads.length > 0 && (
                                    <div className={styles.paginationBar}>
                                        <div className={styles.paginationInfo}>
                                            Showing <strong>{Math.min((leadsPage - 1) * leadsPerPage + 1, leads.length)}</strong> to <strong>{Math.min(leadsPage * leadsPerPage, leads.length)}</strong> of <strong>{leads.length}</strong> leads
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className={styles.paginationControls}>
                                                <button
                                                    type="button"
                                                    className={styles.pageBtn}
                                                    disabled={leadsPage === 1}
                                                    onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                                                    title="Previous Page"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                {Array.from({ length: totalLeadsPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        type="button"
                                                        className={`${styles.pageBtn} ${leadsPage === page ? styles.activePageBtn : ''}`}
                                                        onClick={() => setLeadsPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    className={styles.pageBtn}
                                                    disabled={leadsPage === totalLeadsPages}
                                                    onClick={() => setLeadsPage(p => Math.min(totalLeadsPages, p + 1))}
                                                    title="Next Page"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* SECTION 3: SUPPORT & AI ISSUE TICKETS */}
                    {activeTab === 'tickets' && (() => {
                        const filteredTickets = tickets.filter(t => {
                            if (ticketFilter === 'all') return true;
                            return t.status === ticketFilter;
                        });
                        const totalTicketsPages = Math.max(1, Math.ceil(filteredTickets.length / ticketsPerPage));
                        const paginatedTickets = filteredTickets.slice((ticketsPage - 1) * ticketsPerPage, ticketsPage * ticketsPerPage);

                        return (
                            <div className={styles.tableSection}>
                                <div className={styles.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <h2>Support & Issue Tickets ({tickets.length})</h2>
                                            {stats.openTicketsCount > 0 && (
                                                <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 900, padding: '2px 8px', borderRadius: '100px', border: '1px solid #fecaca' }}>
                                                    {stats.openTicketsCount} Active
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '2px 0 0 0' }}>
                                            Real-time issues, bug reports, and assistance requests submitted by cafe admins & staff via AI Copilot
                                        </p>
                                    </div>

                                    {/* Filter Pills */}
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {[
                                            { id: 'all', label: 'All' },
                                            { id: 'open', label: 'Open' },
                                            { id: 'in_progress', label: 'In Progress' },
                                            { id: 'resolved', label: 'Resolved' },
                                            { id: 'closed', label: 'Closed' }
                                        ].map(f => (
                                            <button
                                                key={f.id}
                                                type="button"
                                                onClick={() => {
                                                    setTicketFilter(f.id);
                                                    setTicketsPage(1);
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    border: ticketFilter === f.id ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                                                    background: ticketFilter === f.id ? '#eef2ff' : '#ffffff',
                                                    color: ticketFilter === f.id ? '#4338ca' : '#475569',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Ticket #</th>
                                                <th>Cafe Outlet</th>
                                                <th>Category</th>
                                                <th>Subject & Details</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                                <th>Submitted</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedTickets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                                        <CheckCircle2 size={32} color="#86efac" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                                                        No tickets match the selected filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedTickets.map(ticket => (
                                                    <tr key={ticket._id}>
                                                        <td style={{ fontWeight: 800, color: '#4f46e5' }}>
                                                            #{ticket.ticketNumber}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{ticket.tenantName || 'Cafe Outlet'}</div>
                                                            {ticket.contactPhone && (
                                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{ticket.contactPhone}</div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                                                                {ticket.category}
                                                            </span>
                                                        </td>
                                                        <td style={{ maxWidth: 260 }}>
                                                            <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {ticket.subject}
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {ticket.description}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                padding: '2px 8px',
                                                                borderRadius: '100px',
                                                                background: ticket.priority === 'urgent' ? '#fee2e2' : ticket.priority === 'high' ? '#fef3c7' : '#f0fdf4',
                                                                color: ticket.priority === 'urgent' ? '#dc2626' : ticket.priority === 'high' ? '#d97706' : '#16a34a'
                                                            }}>
                                                                {ticket.priority.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={styles.badge} style={{
                                                                background: ticket.status === 'open' ? '#fee2e2' : ticket.status === 'in_progress' ? '#fef3c7' : ticket.status === 'resolved' ? '#dcfce7' : '#f1f5f9',
                                                                color: ticket.status === 'open' ? '#dc2626' : ticket.status === 'in_progress' ? '#d97706' : ticket.status === 'resolved' ? '#16a34a' : '#64748b'
                                                            }}>
                                                                {(ticket.status || 'open').replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                                                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent'}
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className={styles.actionBtn}
                                                                onClick={() => {
                                                                    setSelectedTicket(ticket);
                                                                    setTicketAdminNotes(ticket.adminNotes || '');
                                                                }}
                                                                style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 800 }}
                                                            >
                                                                Review & Fix
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* PAGINATION CONTROLS FOR TICKETS */}
                                {filteredTickets.length > 0 && (
                                    <div className={styles.paginationBar}>
                                        <div className={styles.paginationInfo}>
                                            Showing <strong>{Math.min((ticketsPage - 1) * ticketsPerPage + 1, filteredTickets.length)}</strong> to <strong>{Math.min(ticketsPage * ticketsPerPage, filteredTickets.length)}</strong> of <strong>{filteredTickets.length}</strong> tickets
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div className={styles.paginationControls}>
                                                <button
                                                    type="button"
                                                    className={styles.pageBtn}
                                                    disabled={ticketsPage === 1}
                                                    onClick={() => setTicketsPage(p => Math.max(1, p - 1))}
                                                    title="Previous Page"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                {Array.from({ length: totalTicketsPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        type="button"
                                                        className={`${styles.pageBtn} ${ticketsPage === page ? styles.activePageBtn : ''}`}
                                                        onClick={() => setTicketsPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    className={styles.pageBtn}
                                                    disabled={ticketsPage === totalTicketsPages}
                                                    onClick={() => setTicketsPage(p => Math.min(totalTicketsPages, p + 1))}
                                                    title="Next Page"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                </div>
            </main>

            {/* MODAL 1: ONBOARD NEW CAFE */}
            {showOnboardModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: 540 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900 }}>Onboard New Cafe Outlet</h2>
                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Setup cafe credentials, custom logo, and instant subscription</p>
                            </div>
                            <button type="button" onClick={() => setShowOnboardModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                            {/* Cafe Name & Owner Name */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
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
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Email & Password */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
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
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Phone & Address */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                        Mobile Number
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. +91 98765 43210"
                                        value={onboardForm.phone}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
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
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Cafe Logo Upload Dropzone (Replaces URL fields) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                    Cafe Logo
                                </label>
                                <div className={styles.logoDropzone}>
                                    {onboardForm.logo ? (
                                        <img src={onboardForm.logo} alt="Preview" className={styles.logoThumb} />
                                    ) : (
                                        <div className={styles.logoPlaceholder}>
                                            <Building size={22} />
                                        </div>
                                    )}
                                    <div className={styles.logoUploadInfo}>
                                        <div className={styles.logoUploadTitle}>
                                            <Upload size={14} /> <span>{onboardForm.logo ? 'Change Cafe Logo' : 'Upload Cafe Logo'}</span>
                                        </div>
                                        <div className={styles.logoUploadSubtitle}>PNG, JPG, SVG or WebP (Max 5MB)</div>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                    />
                                    {onboardForm.logo && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOnboardForm(prev => ({ ...prev, logo: '' }));
                                            }}
                                            className={styles.logoRemoveBtn}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Subscription Plan Selection */}
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                                    Initial Subscription Plan
                                </label>
                                <select
                                    className={styles.select}
                                    style={{ margin: 0, padding: '9px 12px', fontSize: '13px' }}
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

                            <div className={styles.modalActions} style={{ marginTop: 8 }}>
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

            {/* MODAL 4: LOGOUT CONFIRMATION MODAL */}
            {showLogoutModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} style={{ maxWidth: 420, textAlign: 'center', padding: '2.2rem 2rem' }}>
                        <div style={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            background: '#fee2e2',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem auto'
                        }}>
                            <LogOut size={28} />
                        </div>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                            Confirm Sign Out
                        </h2>
                        <p style={{ margin: '0 0 1.75rem 0', fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
                            Are you sure you really want to log out from the Super Admin dashboard?
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(false)}
                                className={styles.cancelBtn}
                                style={{ flex: 1, padding: '10px 16px' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLogoutModal(false);
                                    handleLogout();
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px 16px',
                                    background: '#dc2626',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                                }}
                            >
                                Yes, Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 5: TICKET REVIEW & REAL-TIME RESOLUTION */}
            {selectedTicket && (
                <div className={styles.modalOverlay} onClick={() => setSelectedTicket(null)}>
                    <div className={styles.modalContent} style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                                        Ticket #{selectedTicket.ticketNumber}
                                    </h2>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        padding: '2px 8px',
                                        borderRadius: '100px',
                                        background: selectedTicket.priority === 'urgent' ? '#fee2e2' : selectedTicket.priority === 'high' ? '#fef3c7' : '#f0fdf4',
                                        color: selectedTicket.priority === 'urgent' ? '#dc2626' : selectedTicket.priority === 'high' ? '#d97706' : '#16a34a'
                                    }}>
                                        {selectedTicket.priority.toUpperCase()}
                                    </span>
                                </div>
                                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                                    Reported by <strong>{selectedTicket.tenantName}</strong> • {new Date(selectedTicket.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button type="button" onClick={() => setSelectedTicket(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                                CATEGORY: <span style={{ color: '#0f172a' }}>{selectedTicket.category}</span>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                                {selectedTicket.subject}
                            </div>
                            <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                {selectedTicket.description}
                            </div>

                            {/* Contact Details */}
                            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                                {selectedTicket.contactPhone && (
                                    <div>📞 Phone: <strong style={{ color: '#0f172a' }}>{selectedTicket.contactPhone}</strong></div>
                                )}
                                {selectedTicket.contactEmail && (
                                    <div>✉️ Email: <strong style={{ color: '#0f172a' }}>{selectedTicket.contactEmail}</strong></div>
                                )}
                            </div>
                        </div>

                        {/* Screenshot Attachment */}
                        {selectedTicket.screenshotUrl && (
                            <div style={{ marginBottom: '14px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Attached Screenshot:</div>
                                <div
                                    style={{ width: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                                    onClick={() => setViewingScreenshot(selectedTicket.screenshotUrl)}
                                >
                                    <img src={selectedTicket.screenshotUrl} alt="Issue screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            </div>
                        )}

                        {/* Resolution & Status Update Box */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                                Platform Admin Resolution Notes
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Explain what fix was applied or reply to the cafe team..."
                                value={ticketAdminNotes}
                                onChange={(e) => setTicketAdminNotes(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                            />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    type="button"
                                    disabled={isUpdatingTicket}
                                    onClick={() => handleUpdateTicketStatus(selectedTicket._id, 'in_progress')}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #fcd34d', background: '#fffbeb', color: '#d97706', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Mark In Progress
                                </button>
                                <button
                                    type="button"
                                    disabled={isUpdatingTicket}
                                    onClick={() => handleUpdateTicketStatus(selectedTicket._id, 'resolved')}
                                    style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#ffffff', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    ✅ Mark Resolved
                                </button>
                                <button
                                    type="button"
                                    disabled={isUpdatingTicket}
                                    onClick={() => handleUpdateTicketStatus(selectedTicket._id, 'closed')}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Close Ticket
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedTicket(null)}
                                className={styles.cancelBtn}
                                style={{ padding: '8px 16px', fontSize: '12px' }}
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 6: SCREENSHOT FULL PREVIEW */}
            {viewingScreenshot && (
                <div className={styles.modalOverlay} onClick={() => setViewingScreenshot(null)}>
                    <div style={{ position: 'relative', maxWidth: '85vw', maxHeight: '85vh', background: '#000', borderRadius: '12px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setViewingScreenshot(null)}
                            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <X size={18} />
                        </button>
                        <img src={viewingScreenshot} alt="Full screenshot preview" style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '85vh' }} />
                    </div>
                </div>
            )}

        </div>
    );
};

export default SuperAdminDashboard;
