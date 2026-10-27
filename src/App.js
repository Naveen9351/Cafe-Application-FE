import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import PageLoader from './components/PageLoader';
import ScrollToTop from './components/common/ScrollToTop';
import SEOManager from './components/common/SEOManager';
import LandingChatbot from './components/LandingChatbot';
import LeadCaptureModal from './components/interactive/LeadCaptureModal';
import { isBillingOrAdminSubdomain } from './utils/subdomain';

// Route-level code splitting for non-landing pages (reduces initial JS payload by ~70%)
const Menu = lazy(() => import('./components/Menu'));
const Cart = lazy(() => import('./components/Cart'));
const OrderStatus = lazy(() => import('./components/OrderStatus'));
const OrderHistoryPage = lazy(() => import('./components/OrderHistoryPage'));
const CustomerProfilePage = lazy(() => import('./components/CustomerProfilePage'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdminDashboard'));
const TenantRegister = lazy(() => import('./components/TenantRegister'));
const BookDemoPage = lazy(() => import('./components/BookDemoPage'));
const PricingPage = lazy(() => import('./components/PricingPage'));
const ProductsPage = lazy(() => import('./components/ProductsPage'));
const SolutionsPage = lazy(() => import('./components/SolutionsPage'));

const POSBillingPage = lazy(() => import('./components/FeaturePages').then(m => ({ default: m.POSBillingPage })));
const KitchenOpsPage = lazy(() => import('./components/FeaturePages').then(m => ({ default: m.KitchenOpsPage })));
const InventoryPage = lazy(() => import('./components/FeaturePages').then(m => ({ default: m.InventoryPage })));
const CRMLoyaltyPage = lazy(() => import('./components/FeaturePages').then(m => ({ default: m.CRMLoyaltyPage })));
const AICopilotPage = lazy(() => import('./components/FeaturePages').then(m => ({ default: m.AICopilotPage })));

const AboutPage = lazy(() => import('./components/InfoPages').then(m => ({ default: m.AboutPage })));
const CareersPage = lazy(() => import('./components/InfoPages').then(m => ({ default: m.CareersPage })));
const PressKitPage = lazy(() => import('./components/InfoPages').then(m => ({ default: m.PressKitPage })));
const ContactPage = lazy(() => import('./components/InfoPages').then(m => ({ default: m.ContactPage })));

const ALL_STAFF_ROLES = ['admin', 'manager', 'cashier', 'chef', 'waiter', 'staff', 'kitchen', 'custom', 'super_admin'];

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader duration={400} />;
  }

  if (!user) {
    if (isBillingOrAdminSubdomain()) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const effectiveRoles = allowedRoles || ALL_STAFF_ROLES;
  const userRole = (user.role || 'staff').toLowerCase();

  if (!effectiveRoles.includes(userRole) && userRole !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Helper to detect if app is running in Electron Desktop App
export const isDesktopApp = () => {
  return (
    (typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron)) ||
    (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron'))
  );
};

// Home Route: Auto-redirect logged-in users directly to their Dashboard
// If on desktop application or billing subdomain (billing.dineviq.com), render Login directly at root URL (clean URL, no /login)
const HomeRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader duration={400} />;
  }

  if (user) {
    if (user.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  // On billing.dineviq.com, render Login immediately at the root URL / (No /login appended)
  if (isDesktopApp() || isBillingOrAdminSubdomain()) {
    return (
      <PublicOnlyRoute>
        <Login />
      </PublicOnlyRoute>
    );
  }

  return <LandingPage />;
};

// Public Only Route: Prevents logged-in users from seeing the login screen on back / re-open
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader duration={400} />;
  }

  if (user) {
    if (user.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

// Dedicated Login Route:
// If accessed via main domain (dineviq.com / www.dineviq.com) in production, route directly to billing.dineviq.com
// If on billing.dineviq.com/login, redirect to root / so the browser URL stays clean: billing.dineviq.com
const LoginRoute = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('dineviq.com') && !host.startsWith('billing.') && !host.startsWith('admin.')) {
      window.location.replace('https://billing.dineviq.com');
      return <PageLoader duration={300} />;
    }
    if (isBillingOrAdminSubdomain()) {
      return <Navigate to="/" replace />;
    }
  }

  return (
    <PublicOnlyRoute>
      <Login />
    </PublicOnlyRoute>
  );
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader duration={200} />}>
      <Routes>
        {/* Root Route: If on billing.dineviq.com, opens Login directly; else shows Landing Page */}
        <Route path="/" element={<HomeRoute />} />

        {/* Customer Ordering Routes */}
        <Route path="/menu" element={<Menu />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/history" element={<OrderHistoryPage />} />
        <Route path="/profile" element={<CustomerProfilePage />} />
        <Route path="/order/status/:id" element={<OrderStatus />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <TenantRegister />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register-business"
          element={
            <PublicOnlyRoute>
              <TenantRegister />
            </PublicOnlyRoute>
          }
        />

        {/* Marketing / Landing Subpages */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/demo" element={<BookDemoPage />} />
        <Route path="/book-demo" element={<BookDemoPage />} />

        {/* Feature Pages */}
        <Route path="/whatsapp" element={<CRMLoyaltyPage />} />
        <Route path="/features/pos-billing" element={<POSBillingPage />} />
        <Route path="/features/kitchen-ops" element={<KitchenOpsPage />} />
        <Route path="/features/inventory" element={<InventoryPage />} />
        <Route path="/features/crm-loyalty" element={<CRMLoyaltyPage />} />
        <Route path="/features/ai-copilot" element={<AICopilotPage />} />

        {/* Info / Company Pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/press-kit" element={<PressKitPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Protected Admin Routes with Real Dynamic URLs (/admin/dashboard, /admin/pos, /admin/kds, /admin/menu, etc.) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={ALL_STAFF_ROLES}>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/:tab"
          element={
            <ProtectedRoute allowedRoles={ALL_STAFF_ROLES}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Protected Route */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// Global Public Chatbot Wrapper
// Renders the Khushi AI Sales & Support Chatbot across all public screens / website pages
const PublicChatbotWrapper = () => {
  const location = useLocation();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const pathname = (location.pathname || '').toLowerCase();

  // Suppress on desktop Electron POS
  if (isDesktopApp()) {
    return null;
  }

  // Suppress on dedicated billing / admin subdomains (e.g. billing.dineviq.com)
  if (isBillingOrAdminSubdomain()) {
    return null;
  }

  // Hide on internal staff & super-admin operational dashboards
  if (pathname.startsWith('/admin') || pathname.startsWith('/super-admin')) {
    return null;
  }

  // Hide on customer table ordering and dining session screens
  if (
    pathname.startsWith('/menu') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/order') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/profile')
  ) {
    return null;
  }

  return (
    <>
      <LandingChatbot onOpenDemo={() => setIsDemoModalOpen(true)} />
      <LeadCaptureModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="Schedule a Personalized DINEVIQ Walkthrough"
        subtitle="See how DINEVIQ cuts table turn times and automates your kitchen in under 15 minutes."
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <SEOManager />
          <ScrollToTop />
          <AppRoutes />
          <PublicChatbotWrapper />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;