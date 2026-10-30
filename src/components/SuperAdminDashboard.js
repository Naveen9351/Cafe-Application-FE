import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import styles from './SuperAdminDashboard.module.css';
import {
    BarChart3, Users, CreditCard, Building, Plus, LogOut, Trash2, Zap,
    ChevronLeft, ChevronRight, ShieldAlert, Clock, AlertTriangle, CheckCircle2, History, X, Lock, Image, User, Mail, Phone, MapPin, Upload,
    Activity, TrendingUp, Globe, Smartphone, Laptop, Search, RefreshCw, Eye, ArrowUpRight, Filter,
    SlidersHorizontal, PowerOff, Power
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
    const [activeTab, setActiveTab] = useState('businesses'); // 'businesses', 'inquiries', 'tickets', 'analytics', 'history'

    // Analytics & Traffic State
    const [analyticsStats, setAnalyticsStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [activitiesTotal, setActivitiesTotal] = useState(0);
    const [activitiesPage, setActivitiesPage] = useState(1);
    const [activitiesPages, setActivitiesPages] = useState(1);
    const [activityCategory, setActivityCategory] = useState('all'); // 'all', 'Traffic', 'Lead', 'Orders', 'Auth'
    const [activitySearch, setActivitySearch] = useState('');
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

    // Pagination State
    const [tenantsPage, setTenantsPage] = useState(1);
    const [tenantsPerPage, setTenantsPerPage] = useState(5);
    const [leadsPage, setLeadsPage] = useState(1);
    const [leadsPerPage, setLeadsPerPage] = useState(5);
    const [ticketsPage, setTicketsPage] = useState(1);
    const [ticketsPerPage, setTicketsPerPage] = useState(5);
    const [ticketFilter, setTicketFilter] = useState('all'); // 'all', 'open', 'in_progress', 'resolved', 'closed'

    // Modals
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: 'danger', // 'danger' | 'warning'
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: () => { },
        loading: false
    });
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [viewingScreenshot, setViewingScreenshot] = useState(null);

    const [editingTenant, setEditingTenant] = useState(null);
    const [historyTenant, setHistoryTenant] = useState(null);
    const [tenantHistoryLogs, setTenantHistoryLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

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

    const fetchAnalyticsStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/analytics/stats`, {
                headers: { 'x-auth-token': token }
            });
            if (res.data?.success) {
                setAnalyticsStats(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch analytics stats", err);
        }
    };

    const fetchActivities = async (page = 1, category = activityCategory, search = activitySearch) => {
        setLoadingAnalytics(true);
        try {
            const token = localStorage.getItem('token');
            const params = {
                page,
                limit: 12,
                category: category !== 'all' ? category : undefined,
                search: search.trim() ? search.trim() : undefined
            };
            const res = await axios.get(`${API}/analytics/activities`, {
                headers: { 'x-auth-token': token },
                params
            });
            if (res.data?.success) {
                setActivities(res.data.activities || []);
                setActivitiesTotal(res.data.pagination?.total || 0);
                setActivitiesPage(res.data.pagination?.page || 1);
                setActivitiesPages(res.data.pagination?.pages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch activities", err);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    useEffect(() => {
        fetchTenantsAndLeads();
        fetchAnalyticsStats();
        // Real-time polling for tickets every 10 seconds
        const pollTimer = setInterval(() => {
            fetchTenantsAndLeads(true);
        }, 10000);
        return () => clearInterval(pollTimer);
    }, [user]);

    useEffect(() => {
        if (activeTab === 'analytics') {
            fetchAnalyticsStats();
            fetchActivities(1, activityCategory, activitySearch);
        }
    }, [activeTab]);

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        if (tab === 'businesses' || tab === 'inquiries' || tab === 'tickets') {
            setLoading(true);
            fetchTenantsAndLeads();
        } else if (tab === 'analytics') {
            fetchAnalyticsStats();
            fetchActivities(1, activityCategory, activitySearch);
        }
    };

    const formatActivityTime = (isoDate) => {
        if (!isoDate) return '—';
        try {
            const d = new Date(isoDate);
            return d.toLocaleString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '—';
        }
    };

    const getPageFriendlyTitle = (path = '') => {
        if (path === '/' || path === '') return 'Homepage & Hero Showcase';
        if (path.startsWith('/menu')) return 'Interactive QR Menu';
        if (path.startsWith('/pricing')) return 'Subscription Pricing & Plans';
        if (path.startsWith('/demo') || path.startsWith('/lead')) return 'Schedule Live Demo';
        if (path.startsWith('/super-admin')) return 'SuperAdmin Platform Console';
        if (path.startsWith('/admin')) return 'Cafe Management POS';
        if (path.startsWith('/order-status')) return 'Live Order Tracking';
        return path;
    };

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
        if (onboardForm.phone && !/^[0-9]{10}$/.test(onboardForm.phone.trim())) {
            toast.error("Mobile number must be exactly 10 digits");
            return;
        }

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

    // Handle Deactivate Plan with Custom UI Popup
    const handleDeactivatePlan = (tenantId, tenantName = 'this cafe') => {
        setConfirmModal({
            isOpen: true,
            type: 'warning',
            title: `Deactivate Plan?`,
            message: `Are you sure you want to deactivate the plan for "${tenantName}"? Cafe ordering and active POS operations will be paused until reactivated.`,
            confirmText: 'Yes, Deactivate',
            cancelText: 'Cancel',
            onConfirm: () => executeDeactivatePlan(tenantId)
        });
    };

    const executeDeactivatePlan = async (tenantId) => {
        try {
            setConfirmModal(prev => ({ ...prev, loading: true }));
            const token = localStorage.getItem('token');
            await axios.put(`${API}/tenants/${tenantId}/deactivate-subscription`, {}, {
                headers: { 'x-auth-token': token }
            });

            toast.success("Plan deactivated successfully");
            setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            if (showPlanModal) setShowPlanModal(false);
            fetchTenantsAndLeads();
        } catch (err) {
            console.error(err);
            toast.error("Failed to deactivate plan");
            setConfirmModal(prev => ({ ...prev, loading: false }));
        }
    };

    // View Subscription History
    const handleViewHistory = async (tenant) => {
        setHistoryTenant(tenant);
        setShowHistoryModal(true);
        setLoadingHistory(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API}/tenants/${tenant._id}/subscription-history`, {
                headers: { 'x-auth-token': token }
            });
            setTenantHistoryLogs(res.data.history || []);
        } catch (err) {
            console.error(err);
            setTenantHistoryLogs(tenant.subscriptionHistory || []);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Handle Delete Tenant with Custom UI Popup
    const handleDeleteTenant = (id, name) => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: `Delete "${name}"?`,
            message: `WARNING: Are you sure you want to permanently delete "${name}"? All menu items, active orders, and staff accounts will be permanently removed. This action cannot be undone.`,
            confirmText: 'Yes, Delete Permanently',
            cancelText: 'Cancel',
            onConfirm: () => executeDeleteTenant(id)
        });
    };

    const executeDeleteTenant = async (id) => {
        try {
            setConfirmModal(prev => ({ ...prev, loading: true }));
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/tenants/${id}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Business deleted successfully");
            setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            fetchTenantsAndLeads();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete business");
            setConfirmModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Handle Delete Lead with Custom UI Popup
    const handleDeleteLead = (id, name = 'this lead') => {
        setConfirmModal({
            isOpen: true,
            type: 'danger',
            title: `Delete Lead Inquiry?`,
            message: `Are you sure you want to permanently remove the inquiry from "${name}"?`,
            confirmText: 'Delete Lead',
            cancelText: 'Cancel',
            onConfirm: () => executeDeleteLead(id)
        });
    };

    const executeDeleteLead = async (id) => {
        try {
            setConfirmModal(prev => ({ ...prev, loading: true }));
            const token = localStorage.getItem('token');
            await axios.delete(`${API}/leads/${id}`, {
                headers: { 'x-auth-token': token }
            });
            toast.success("Lead inquiry deleted");
            setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
            fetchTenantsAndLeads();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete lead inquiry");
            setConfirmModal(prev => ({ ...prev, loading: false }));
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
                        <div className={styles.sidebarBrand} title="DineviQ Super Admin Console">
                            <div className={styles.brandLogoWrap}>
                                <img
                                    src="/logos/logo-without-bg.png"
                                    alt="DineviQ"
                                    className={styles.brandLogoImg}
                                    onError={(e) => {
                                        if (e.target.src.includes('logo-without-bg.png')) {
                                            e.target.src = '/logo.png';
                                        } else {
                                            e.target.style.display = 'none';
                                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                        }
                                    }}
                                />
                                <div className={styles.brandIconFallback} style={{ display: 'none' }}>
                                    DQ
                                </div>
                            </div>
                            {!sidebarCollapsed && (
                                <div className={styles.brandTextGroup}>
                                    <div className={styles.brandTitleRow}>
                                        <span className={styles.brandName}>DINEVIQ</span>
                                        <span className={styles.superAdminBadge}>Super Admin</span>
                                    </div>
                                    <span className={styles.brandSubtext}>Platform Console</span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className={styles.collapseToggleBtn}
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                        </button>
                    </div>

                    <nav className={styles.sidebarNav}>
                        <button
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'businesses' ? styles.activeNavItem : ''}`}
                            onClick={() => handleTabChange('businesses')}
                            title="Registered Cafes"
                        >
                            <Building size={16} />
                            {!sidebarCollapsed && <span>Registered Cafes ({tenants.length})</span>}
                        </button>

                        <button
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'inquiries' ? styles.activeNavItem : ''}`}
                            onClick={() => handleTabChange('inquiries')}
                            title="Demo Inquiries"
                        >
                            <Users size={16} />
                            {!sidebarCollapsed && <span>Demo Leads ({leads.length})</span>}
                        </button>

                        <button
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'tickets' ? styles.activeNavItem : ''}`}
                            onClick={() => handleTabChange('tickets')}
                            title="Support & Issue Tickets"
                        >
                            <ShieldAlert size={16} color={tickets.filter(t => t.status === 'open').length > 0 ? '#ef4444' : undefined} />
                            {!sidebarCollapsed && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span>Issue Tickets ({tickets.length})</span>
                                    {tickets.filter(t => t.status === 'open').length > 0 && (
                                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '100px', marginLeft: 4 }}>
                                            {tickets.filter(t => t.status === 'open').length} NEW
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>

                        <button
                            type="button"
                            className={`${styles.navItem} ${activeTab === 'analytics' ? styles.activeNavItem : ''}`}
                            onClick={() => handleTabChange('analytics')}
                            title="Traffic & User Activities"
                        >
                            <Activity size={16} color={activeTab === 'analytics' ? '#4f46e5' : '#059669'} />
                            {!sidebarCollapsed && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span>Traffic & Activities</span>
                                    <span style={{
                                        background: '#ecfdf5',
                                        color: '#059669',
                                        border: '1px solid #a7f3d0',
                                        fontSize: '9px',
                                        fontWeight: 600,
                                        padding: '1px 5px',
                                        borderRadius: '100px',
                                        marginLeft: 4
                                    }}>
                                        LIVE
                                    </span>
                                </div>
                            )}
                        </button>
                    </nav>
                </div>

                <div style={{ padding: '0.75rem' }}>
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(true)}
                        className={styles.logoutBtn}
                        style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                        title="Sign Out"
                    >
                        <LogOut size={15} />
                        {!sidebarCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className={styles.mainArea}>

                {/* TOP HEADER BAR */}
                <header className={styles.navbar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 className={styles.navTitle}>
                            {activeTab === 'analytics' ? 'Website Intelligence & SaaS Telemetry' : 'Platform Governance & SaaS Operations'}
                        </h2>
                    </div>

                    <div className={styles.navActions}>
                        <button
                            type="button"
                            onClick={() => setShowOnboardModal(true)}
                            className={styles.addBtn}
                        >
                            <Plus size={15} /> Onboard New Cafe
                        </button>
                    </div>
                </header>

                <div className={styles.content}>

                    {/* STATS CARDS */}
                    {activeTab !== 'analytics' && (
                        <div className={styles.statsGrid}>
                            <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                                <div className={`${styles.iconBox} ${styles.blueIcon}`}>
                                    <Building size={16} />
                                </div>
                                <div className={styles.statInfo}>
                                    <h3>Total Cafes</h3>
                                    <p className={styles.statValue}>{tenants.length}</p>
                                </div>
                            </div>

                            <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                                <div className={`${styles.iconBox} ${styles.greenIcon}`}>
                                    <CreditCard size={16} />
                                </div>
                                <div className={styles.statInfo}>
                                    <h3>Active Plans</h3>
                                    <p className={styles.statValue}>{stats.activesubs}</p>
                                </div>
                            </div>

                            <div className={`${styles.statCard} ${styles.statCardPurple}`}>
                                <div className={`${styles.iconBox} ${styles.purpleIcon}`}>
                                    <BarChart3 size={16} />
                                </div>
                                <div className={styles.statInfo}>
                                    <h3>Total Platform Revenue</h3>
                                    <p className={styles.statValue}>₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            <div className={`${styles.statCard} ${styles.statCardAmber}`} style={{ borderColor: stats.expiringSoonCount > 0 ? '#f59e0b' : undefined }}>
                                <div className={`${styles.iconBox} ${styles.amberIcon}`}>
                                    <AlertTriangle size={16} />
                                </div>
                                <div className={styles.statInfo}>
                                    <h3>Expiring in ≤ 3 Days</h3>
                                    <p className={styles.statValue} style={{ color: stats.expiringSoonCount > 0 ? '#d97706' : undefined }}>
                                        {stats.expiringSoonCount}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EXPIRING SOON WARNING BANNER */}
                    {activeTab !== 'analytics' && stats.expiringSoonCount > 0 && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '6px 12px', borderRadius: '8px', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: 8, color: '#92400e', fontSize: '12px', fontWeight: 500 }}>
                            <AlertTriangle size={15} color="#d97706" />
                            <span>
                                <strong>Alert:</strong> {stats.expiringSoonCount} cafe subscription(s) expire within 3 days.
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
                                    </div>

                                </div>

                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Cafe & Owner</th>
                                                <th>Contact</th>
                                                <th>Current Plan</th>
                                                <th>Status</th>
                                                <th>Expiry Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: 'center', padding: '0' }}>
                                                        <div className={styles.tableLoaderContainer}>
                                                            <div className={styles.tableSpinnerRing}></div>
                                                            <span className={styles.tableLoaderText}>Loading registered cafes...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : paginatedTenants.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
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
                                                            <td>
                                                                <div className={styles.tenantName}>{tenant.name}</div>
                                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                                                    {tenant.adminName || tenant.ownerName || 'Admin'}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '12px' }}>{tenant.email}</div>
                                                                <div style={{ color: '#64748b', fontSize: '11px' }}>{tenant.phone || '—'}</div>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                                    <span className={`${styles.badge} ${styles.planBadge}`}>
                                                                        {sub.plan ? sub.plan.replace('_', ' ').toUpperCase() : 'NO PLAN'}
                                                                    </span>
                                                                    <span style={{ fontSize: '11px', fontWeight: 550, color: '#334155' }}>
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
                                                                        Active ({daysLeft !== null ? `${daysLeft}d` : 'Unlimited'})
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                                                {endDate ? endDate.toLocaleDateString('en-IN') : 'N/A'}
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
                                                                    <button
                                                                        type="button"
                                                                        className={styles.managePlanBtn}
                                                                        onClick={() => {
                                                                            setEditingTenant(tenant);
                                                                            setSelectedPlan(sub.plan || '1_month');
                                                                            setCustomPriceVal(sub.price || 999);
                                                                            setShowPlanModal(true);
                                                                        }}
                                                                        title="Manage Plan & Pricing"
                                                                    >
                                                                        <SlidersHorizontal size={13} />
                                                                    </button>

                                                                    {sub.isActive ? (
                                                                        <button
                                                                            type="button"
                                                                            className={styles.deactivateIconBtn}
                                                                            onClick={() => handleDeactivatePlan(tenant._id)}
                                                                            title="Deactivate Plan"
                                                                        >
                                                                            <PowerOff size={13} />
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            className={styles.activateIconBtn}
                                                                            onClick={() => {
                                                                                setEditingTenant(tenant);
                                                                                setSelectedPlan(sub.plan || '1_month');
                                                                                setShowPlanModal(true);
                                                                            }}
                                                                            title="Activate Plan"
                                                                        >
                                                                            <Zap size={13} />
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        type="button"
                                                                        className={styles.historyBtn}
                                                                        onClick={() => handleViewHistory(tenant)}
                                                                        title="View Plan History"
                                                                    >
                                                                        <History size={13} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className={styles.deleteBtn}
                                                                        onClick={() => handleDeleteTenant(tenant._id, tenant.name)}
                                                                        title="Delete Tenant"
                                                                    >
                                                                        <Trash2 size={13} />
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
                                <div className={styles.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2>Website Demo Inquiries ({leads.length})</h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setLoading(true); fetchTenantsAndLeads(); }}
                                        className={styles.inlineRefreshBtn}
                                        title="Refresh demo inquiries"
                                    >
                                        <RefreshCw size={13} className={loading ? styles.spin : ''} />
                                    </button>
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
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '0' }}>
                                                        <div className={styles.tableLoaderContainer}>
                                                            <div className={styles.tableSpinnerRing}></div>
                                                            <span className={styles.tableLoaderText}>Loading demo inquiries...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : paginatedLeads.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                                        No demo inquiries logged yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedLeads.map(lead => (
                                                    <tr key={lead._id}>
                                                        <td style={{ fontWeight: 500, color: '#0f172a' }}>
                                                            {lead.fullName || lead.contactName || 'Lead'}
                                                        </td>
                                                        <td>{lead.workEmail || lead.email}</td>
                                                        <td>
                                                            <a href={`tel:${lead.phone}`} style={{ color: '#4f46e5', fontWeight: 550, textDecoration: 'none' }}>
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
                                                                title="Delete Lead"
                                                            >
                                                                <Trash2 size={13} />
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
                                                <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '100px', border: '1px solid #fecaca' }}>
                                                    {stats.openTicketsCount} Active
                                                </span>
                                            )}
                                        </div>

                                    </div>

                                    {/* Filter Pills */}
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
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
                                                    fontWeight: 500,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {f.label}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => { setLoading(true); fetchTenantsAndLeads(); }}
                                            className={styles.inlineRefreshBtn}
                                            title="Refresh issue tickets"
                                        >
                                            <RefreshCw size={13} className={loading ? styles.spin : ''} />
                                        </button>
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
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: 'center', padding: '0' }}>
                                                        <div className={styles.tableLoaderContainer}>
                                                            <div className={styles.tableSpinnerRing}></div>
                                                            <span className={styles.tableLoaderText}>Loading support & issue tickets...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : paginatedTickets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                                        <CheckCircle2 size={32} color="#86efac" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                                                        No tickets match the selected filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedTickets.map(ticket => (
                                                    <tr key={ticket._id}>
                                                        <td style={{ fontWeight: 550, color: '#4f46e5' }}>
                                                            #{ticket.ticketNumber}
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 550, color: '#0f172a' }}>{ticket.tenantName || 'Cafe Outlet'}</div>
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
                                                            <div style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {ticket.subject}
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {ticket.description}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span style={{
                                                                fontSize: '11px',
                                                                fontWeight: 550,
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
                                                                className={styles.reviewBtn}
                                                                onClick={() => {
                                                                    setSelectedTicket(ticket);
                                                                    setTicketAdminNotes(ticket.adminNotes || '');
                                                                }}
                                                                title="Review & Resolve Ticket"
                                                            >
                                                                <Eye size={13} />
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

                    {/* SECTION 4: TRAFFIC & USER ACTIVITIES INTELLIGENCE HUB */}
                    {activeTab === 'analytics' && (() => {
                        const summary = analyticsStats?.summary || {
                            todayViews: 0,
                            yesterdayViews: 0,
                            todayUnique: 0,
                            todayGrowth: 0,
                            totalLogs: 0,
                            todayLeads: 0,
                            todayOrders: 0
                        };

                        const dailyStats = analyticsStats?.dailyStats || [];
                        const maxDailyView = Math.max(1, ...dailyStats.map(d => Math.max(d.pageviews || 0, d.uniqueVisitors || 0)));
                        const topPages = analyticsStats?.topPages || [];
                        const devices = analyticsStats?.devices || { Mobile: 0, Desktop: 0, Tablet: 0 };
                        const totalDevices = Math.max(1, (devices.Mobile || 0) + (devices.Desktop || 0) + (devices.Tablet || 0));
                        const cities = analyticsStats?.cities || [];

                        return (
                            <div>
                                {/* ANALYTICS HEADER */}
                                <div className={styles.analyticsHeader}>
                                    <div className={styles.analyticsHeaderTitle}>
                                        <h2>
                                            <Activity size={18} color="#4f46e5" />
                                            Website Traffic & User Activity Intelligence
                                        </h2>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div className={styles.liveBadge}>
                                            <span className={styles.pulseDot}></span>
                                            Live Telemetry
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.refreshBtn}
                                            onClick={() => {
                                                fetchAnalyticsStats();
                                                fetchActivities(activitiesPage, activityCategory, activitySearch);
                                            }}
                                            title="Refresh Analytics & Activity Feed"
                                        >
                                            <RefreshCw size={13} className={loadingAnalytics ? styles.spin : ''} />
                                            <span>Refresh Data</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 4 KPI METRIC CARDS */}
                                <div className={styles.analyticsKpiGrid}>
                                    <div className={styles.kpiCard}>
                                        <div className={styles.kpiHeader}>
                                            <h3>Today's Unique Visitors</h3>
                                            <div className={styles.kpiIconBox} style={{ background: '#eef2ff', color: '#4f46e5' }}>
                                                <Users size={16} />
                                            </div>
                                        </div>
                                        <p className={styles.kpiValue}>{summary.todayUnique.toLocaleString('en-IN')}</p>
                                        <p className={styles.kpiSubtext}>
                                            <span className={`${styles.kpiTrendBadge} ${summary.todayGrowth >= 0 ? styles.trendUp : styles.trendDown}`}>
                                                {summary.todayGrowth >= 0 ? '↑' : '↓'} {Math.abs(summary.todayGrowth)}%
                                            </span>
                                            vs yesterday ({summary.yesterdayViews || 0} hits)
                                        </p>
                                    </div>

                                    <div className={styles.kpiCard}>
                                        <div className={styles.kpiHeader}>
                                            <h3>Today's Pageviews</h3>
                                            <div className={styles.kpiIconBox} style={{ background: '#e0f2fe', color: '#0284c7' }}>
                                                <Eye size={16} />
                                            </div>
                                        </div>
                                        <p className={styles.kpiValue}>{summary.todayViews.toLocaleString('en-IN')}</p>
                                        <p className={styles.kpiSubtext}>
                                            Total across homepage, demo & menus
                                        </p>
                                    </div>

                                    <div className={styles.kpiCard}>
                                        <div className={styles.kpiHeader}>
                                            <h3>Platform Actions Logged</h3>
                                            <div className={styles.kpiIconBox} style={{ background: '#ecfdf5', color: '#059669' }}>
                                                <Activity size={16} />
                                            </div>
                                        </div>
                                        <p className={styles.kpiValue}>{summary.totalLogs.toLocaleString('en-IN')}</p>
                                        <p className={styles.kpiSubtext}>
                                            Real-time user actions, clicks & orders
                                        </p>
                                    </div>

                                    <div className={styles.kpiCard}>
                                        <div className={styles.kpiHeader}>
                                            <h3>Conversions Today</h3>
                                            <div className={styles.kpiIconBox} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                                <TrendingUp size={16} />
                                            </div>
                                        </div>
                                        <p className={styles.kpiValue}>{(summary.todayLeads + summary.todayOrders).toLocaleString('en-IN')}</p>
                                        <p className={styles.kpiSubtext}>
                                            <strong>{summary.todayLeads}</strong> Demo Leads · <strong>{summary.todayOrders}</strong> Orders
                                        </p>
                                    </div>
                                </div>

                                {/* DAILY TRAFFIC TREND CHART */}
                                <div className={styles.analyticsCard}>
                                    <div className={styles.analyticsCardHeader}>
                                        <div className={styles.analyticsCardHeaderTitle}>
                                            <h3>
                                                <BarChart3 size={15} color="#4f46e5" />
                                                Daily Website Traffic & Visitor Volume (Last 7 Days)
                                            </h3>
                                        </div>
                                        <div className={styles.chartLegend}>
                                            <div className={styles.legendPill}>
                                                <span className={styles.legendDotViews}></span>
                                                <span>Pageviews</span>
                                            </div>
                                            <div className={styles.legendPill}>
                                                <span className={styles.legendDotVisitors}></span>
                                                <span>Unique Visitors</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.chartCanvasWrapper}>
                                        <div className={styles.barChartRow}>
                                            {dailyStats.map((day, idx) => {
                                                const viewsPct = Math.min(100, Math.max(10, Math.round((day.pageviews / maxDailyView) * 100)));
                                                const visitorsPct = Math.min(100, Math.max(8, Math.round((day.uniqueVisitors / maxDailyView) * 100)));
                                                const isHovered = hoveredBarIndex === idx;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={styles.dayColumn}
                                                        onMouseEnter={() => setHoveredBarIndex(idx)}
                                                        onMouseLeave={() => setHoveredBarIndex(null)}
                                                    >
                                                        {isHovered && (
                                                            <div className={styles.chartTooltip}>
                                                                <span style={{ color: '#a5b4fc', fontSize: '11px' }}>{day.date}</span>
                                                                <span>👁️ Pageviews: {day.pageviews}</span>
                                                                <span>👤 Unique Visitors: {day.uniqueVisitors}</span>
                                                            </div>
                                                        )}
                                                        <div className={styles.barsGroup}>
                                                            <div
                                                                className={`${styles.barFill} ${styles.barViews}`}
                                                                style={{ height: `${viewsPct}%` }}
                                                                title={`Pageviews: ${day.pageviews}`}
                                                            />
                                                            <div
                                                                className={`${styles.barFill} ${styles.barVisitors}`}
                                                                style={{ height: `${visitorsPct}%` }}
                                                                title={`Unique Visitors: ${day.uniqueVisitors}`}
                                                            />
                                                        </div>
                                                        <div className={styles.columnDateLabel}>{day.date.split(',')[0]}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* TWO COLUMN GRID: TOP PAGES & DEVICES / GEO */}
                                <div className={styles.twoColGrid}>
                                    {/* TOP PAGES */}
                                    <div className={styles.analyticsCard} style={{ margin: 0 }}>
                                        <div className={styles.analyticsCardHeader}>
                                            <div className={styles.analyticsCardHeaderTitle}>
                                                <h3>
                                                    <Globe size={18} color="#4f46e5" />
                                                    Top Visited Pages & Content Funnel
                                                </h3>
                                                <p>Most popular URLs and conversion checkpoints</p>
                                            </div>
                                        </div>
                                        <div>
                                            {topPages.length === 0 ? (
                                                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No pageview data recorded yet.</div>
                                            ) : (
                                                topPages.map((page, idx) => (
                                                    <div key={idx} className={styles.pageVisitItem}>
                                                        <div className={styles.pageVisitMeta}>
                                                            <div>
                                                                <span className={styles.pagePath}>{page.path}</span>
                                                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                                                    {getPageFriendlyTitle(page.path)}
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <span className={styles.pageViewsCount}>{page.count} visits</span>
                                                                <div style={{ fontSize: '11px', fontWeight: 550, color: '#4f46e5' }}>
                                                                    {page.percentage}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={styles.progressBarTrack}>
                                                            <div className={styles.progressBarFill} style={{ width: `${page.percentage}%` }} />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* DEVICES & LOCATIONS */}
                                    <div className={styles.analyticsCard} style={{ margin: 0 }}>
                                        <div className={styles.analyticsCardHeader}>
                                            <div className={styles.analyticsCardHeaderTitle}>
                                                <h3>
                                                    <Smartphone size={18} color="#0891b2" />
                                                    Device & Audience Distribution
                                                </h3>
                                                <p>Breakdown across devices and active visitor metros</p>
                                            </div>
                                        </div>
                                        <div className={styles.devicesList}>
                                            <div className={styles.deviceRow}>
                                                <div className={styles.deviceInfo}>
                                                    <div className={styles.deviceIcon}>
                                                        <Smartphone size={18} />
                                                    </div>
                                                    <div>
                                                        <div>Mobile Devices</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Smartphones & handheld QR scans</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div className={styles.deviceStats}>{devices.Mobile || 0} visits</div>
                                                    <div style={{ fontSize: '11px', fontWeight: 550, color: '#059669' }}>
                                                        {Math.round(((devices.Mobile || 0) / totalDevices) * 100)}%
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.deviceRow}>
                                                <div className={styles.deviceInfo}>
                                                    <div className={styles.deviceIcon}>
                                                        <Laptop size={18} />
                                                    </div>
                                                    <div>
                                                        <div>Desktop & Laptops</div>
                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>SaaS portal & POS terminals</div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div className={styles.deviceStats}>{devices.Desktop || 0} visits</div>
                                                    <div style={{ fontSize: '11px', fontWeight: 550, color: '#4f46e5' }}>
                                                        {Math.round(((devices.Desktop || 0) / totalDevices) * 100)}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* TOP CITIES PILLS */}
                                            <div style={{ marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 550, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '8px' }}>
                                                    Top Visitor Hubs
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {cities.map((city, cIdx) => (
                                                        <div key={cIdx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 500, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <MapPin size={12} color="#6366f1" />
                                                            {city.name} ({city.count})
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* GRANULAR USER ACTIVITY AUDIT LOG TABLE */}
                                <div className={styles.tableSection}>
                                    <div className={styles.tableHeader}>
                                        <div>
                                            <h2>User Activity & Event Audit Trail ({activitiesTotal})</h2>
                                            <p>Granular chronological log of actions performed by visitors, registered cafes, and admins</p>
                                        </div>
                                    </div>

                                    {/* SEARCH & CATEGORY FILTERS */}
                                    <div className={styles.searchFilterBar}>
                                        <div className={styles.searchInputWrapper}>
                                            <Search size={15} className={styles.searchIcon} />
                                            <input
                                                type="text"
                                                className={styles.searchInput}
                                                placeholder="Search by user, email, cafe, IP, city, or action..."
                                                value={activitySearch}
                                                onChange={(e) => {
                                                    setActivitySearch(e.target.value);
                                                    fetchActivities(1, activityCategory, e.target.value);
                                                }}
                                            />
                                        </div>

                                        <div className={styles.categoryPills}>
                                            {[
                                                { id: 'all', label: 'All Activities' },
                                                { id: 'Traffic', label: 'Traffic & Views' },
                                                { id: 'Orders', label: 'Customer Orders' },
                                                { id: 'Lead', label: 'Demo Leads' },
                                                { id: 'Auth', label: 'Admin & Auth' },
                                                { id: 'Operations', label: 'Operations' }
                                            ].map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    className={`${styles.categoryPill} ${activityCategory === cat.id ? styles.activeCategoryPill : ''}`}
                                                    onClick={() => {
                                                        setActivityCategory(cat.id);
                                                        fetchActivities(1, cat.id, activitySearch);
                                                    }}
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ACTIVITY STREAM TABLE */}
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Timestamp</th>
                                                    <th>User / Identity</th>
                                                    <th>Category</th>
                                                    <th>Action Performed</th>
                                                    <th>Page / Context</th>
                                                    <th>Device & Location</th>
                                                    <th>IP Address</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loadingAnalytics ? (
                                                    <tr>
                                                        <td colSpan={7} style={{ textAlign: 'center', padding: '0' }}>
                                                            <div className={styles.tableLoaderContainer}>
                                                                <div className={styles.tableSpinnerRing}></div>
                                                                <span className={styles.tableLoaderText}>Loading activity telemetry audit log...</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : activities.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                                            No activity matches the current search or filter.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    activities.map(act => {
                                                        const userObj = act.user || {};
                                                        const isGuest = !userObj.role || userObj.role === 'guest';
                                                        const isOrder = act.category === 'Orders';
                                                        const isLead = act.category === 'Lead';
                                                        const isAuth = act.category === 'Auth';

                                                        let badgeClass = styles.badgeTraffic;
                                                        if (isOrder) badgeClass = styles.badgeOrder;
                                                        else if (isLead) badgeClass = styles.badgeLead;
                                                        else if (isAuth) badgeClass = styles.badgeAuth;
                                                        else if (act.category === 'Operations') badgeClass = styles.badgeOperations;

                                                        return (
                                                            <tr key={act._id}>
                                                                <td style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', whiteSpace: 'nowrap' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                                        <Clock size={12} color="#94a3b8" />
                                                                        {formatActivityTime(act.timestamp)}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div>
                                                                        <div style={{ fontWeight: 550, color: '#0f172a', fontSize: '13px' }}>
                                                                            {userObj.name || (isGuest ? 'Guest Visitor' : 'User')}
                                                                            {userObj.role && (
                                                                                <span className={`${styles.userRoleBadge} ${userObj.role === 'super_admin' ? styles.roleSuperAdmin : userObj.role === 'admin' ? styles.roleOwner : styles.roleVisitor}`}>
                                                                                    {userObj.role.replace('_', ' ')}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                                            {userObj.tenantName && userObj.tenantName !== 'Public Web' ? (
                                                                                <span>🏪 {userObj.tenantName}</span>
                                                                            ) : (
                                                                                <span>{userObj.email}</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`${styles.eventBadge} ${badgeClass}`}>
                                                                        {act.category || 'General'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div style={{ fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>
                                                                        {act.action}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                                                                        {act.path || '/'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <div style={{ fontSize: '12px', color: '#334155' }}>
                                                                        <div style={{ fontWeight: 600 }}>{act.city || 'Bangalore'}, {act.country || 'India'}</div>
                                                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                                            {act.device || 'Desktop'} · {act.browser || 'Chrome'}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
                                                                    {act.ip || '127.0.0.1'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* ACTIVITIES PAGINATION */}
                                    {activitiesTotal > 0 && (
                                        <div className={styles.paginationBar}>
                                            <div className={styles.paginationInfo}>
                                                Showing <strong>{(activitiesPage - 1) * 12 + 1}</strong> to <strong>{Math.min(activitiesPage * 12, activitiesTotal)}</strong> of <strong>{activitiesTotal}</strong> events
                                            </div>
                                            <div className={styles.paginationControls}>
                                                <button
                                                    type="button"
                                                    className={styles.pageBtn}
                                                    disabled={activitiesPage === 1}
                                                    onClick={() => fetchActivities(Math.max(1, activitiesPage - 1), activityCategory, activitySearch)}
                                                    title="Previous Page"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                <span style={{ fontSize: '12px', fontWeight: 550, color: '#475569', padding: '0 8px' }}>
                                                    Page {activitiesPage} of {activitiesPages}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={styles.pageBtn}
                                                    disabled={activitiesPage === activitiesPages}
                                                    onClick={() => fetchActivities(Math.min(activitiesPages, activitiesPage + 1), activityCategory, activitySearch)}
                                                    title="Next Page"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600 }}>Onboard New Cafe Outlet</h2>
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
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
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
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
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
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
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
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
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
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
                                        Mobile Number
                                    </label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="10-digit Mobile Number"
                                        value={onboardForm.phone}
                                        onKeyDown={(e) => {
                                            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) && !e.ctrlKey && !e.metaKey) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
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
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
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
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
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
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>Manage Cafe Plan</h2>
                            <button type="button" onClick={() => setShowPlanModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
                            Activate or update subscription plan for <strong>{editingTenant.name}</strong>.
                        </p>

                        <form onSubmit={handleActivatePlan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
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
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 550, color: '#334155', marginBottom: 4 }}>
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
                            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>Subscription History</h2>
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
                                    {loadingHistory ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '0' }}>
                                                <div className={styles.tableLoaderContainer}>
                                                    <div className={styles.tableSpinnerRing}></div>
                                                    <span className={styles.tableLoaderText}>Loading subscription history...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (!tenantHistoryLogs || tenantHistoryLogs.length === 0) ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                                                No subscription history logged yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        tenantHistoryLogs.map((log, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 500 }}>{log.plan}</td>
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
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.35rem', fontWeight: 600, color: '#0f172a' }}>
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
                                    fontWeight: 550,
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
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0f172a' }}>
                                        Ticket #{selectedTicket.ticketNumber}
                                    </h2>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 550,
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
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#475569', marginBottom: '4px' }}>
                                CATEGORY: <span style={{ color: '#0f172a' }}>{selectedTicket.category}</span>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 550, color: '#0f172a', marginBottom: '8px' }}>
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
                                <div style={{ fontSize: '12px', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>Attached Screenshot:</div>
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
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>
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
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #fcd34d', background: '#fffbeb', color: '#d97706', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
                                >
                                    Mark In Progress
                                </button>
                                <button
                                    type="button"
                                    disabled={isUpdatingTicket}
                                    onClick={() => handleUpdateTicketStatus(selectedTicket._id, 'resolved')}
                                    style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#ffffff', fontSize: '12px', fontWeight: 550, cursor: 'pointer' }}
                                >
                                    ✅ Mark Resolved
                                </button>
                                <button
                                    type="button"
                                    disabled={isUpdatingTicket}
                                    onClick={() => handleUpdateTicketStatus(selectedTicket._id, 'closed')}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
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

            {/* MODAL 7: CUSTOM UI CONFIRMATION POPUP */}
            {confirmModal.isOpen && (
                <div className={styles.modalOverlay} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
                    <div
                        className={styles.modalContent}
                        style={{
                            maxWidth: 420,
                            textAlign: 'center',
                            padding: '1.75rem 1.6rem',
                            borderRadius: '16px',
                            background: '#ffffff',
                            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
                            border: '1px solid #e2e8f0'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            background: confirmModal.type === 'danger' ? '#fef2f2' : '#fffbeb',
                            color: confirmModal.type === 'danger' ? '#dc2626' : '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem auto',
                            border: confirmModal.type === 'danger' ? '4px solid #fee2e2' : '4px solid #fef3c7'
                        }}>
                            {confirmModal.type === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
                        </div>

                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 600, color: '#0f172a' }}>
                            {confirmModal.title}
                        </h3>

                        <p style={{ margin: '0 0 1.5rem 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                            {confirmModal.message}
                        </p>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button
                                type="button"
                                disabled={confirmModal.loading}
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className={styles.cancelBtn}
                                style={{ flex: 1, padding: '9px 14px', fontSize: '13px', fontWeight: 500 }}
                            >
                                {confirmModal.cancelText || 'Cancel'}
                            </button>
                            <button
                                type="button"
                                disabled={confirmModal.loading}
                                onClick={confirmModal.onConfirm}
                                style={{
                                    flex: 1,
                                    padding: '9px 14px',
                                    background: confirmModal.type === 'danger' ? '#dc2626' : '#d97706',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 550,
                                    fontSize: '13px',
                                    cursor: confirmModal.loading ? 'not-allowed' : 'pointer',
                                    opacity: confirmModal.loading ? 0.7 : 1,
                                    boxShadow: confirmModal.type === 'danger'
                                        ? '0 4px 12px rgba(220, 38, 38, 0.3)'
                                        : '0 4px 12px rgba(217, 119, 6, 0.3)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                }}
                            >
                                {confirmModal.loading ? 'Processing...' : confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SuperAdminDashboard;
