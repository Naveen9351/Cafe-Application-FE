import React, { lazy, Suspense, useState, useEffect } from 'react';
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
import AuthCallback from './components/AuthCallback';
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
const PrivacyPolicy = lazy(() => import('./components/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/legal/TermsOfService'));

const ALL_STAFF_ROLES = ['admin', 'manager', 'cashier', 'chef', 'waiter', 'staff', 'kitchen', 'custom', 'super_admin'];

// Helper to detect if app is running in Electron Desktop App
export const isDesktopApp = () => {
  return (
    (typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron)) ||
    (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron'))
  );
};

// Subdomain Route Guard:
// If accessed via billing.dineviq.com, only / and /login are allowed.
// Any other route (e.g. /super-admin, /admin, /menu, /pricing) redirects to www.dineviq.com
const SubdomainGuard = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && isBillingOrAdminSubdomain()) {
      const pathname = location.pathname.toLowerCase();
      if (pathname !== '/' && pathname !== '/login') {
        window.location.replace(`https://www.dineviq.com${location.pathname}${location.search}`);
      }
    }
  }, [location]);

  return null;
};

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader duration={400} />;
  }

  // If on billing.dineviq.com, all operational dashboards MUST run on www.dineviq.com
  if (typeof window !== 'undefined' && isBillingOrAdminSubdomain()) {
    window.location.replace(`https://www.dineviq.com${window.location.pathname}${window.location.search}`);
    return <PageLoader duration={300} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const effectiveRoles = allowedRoles || ALL_STAFF_ROLES;
  const userRole = (user.role || 'staff').toLowerCase();

  if (!effectiveRoles.includes(userRole) && userRole !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Home Route:
// 1. If on billing.dineviq.com:
//    - If logged in -> redirect to www.dineviq.com/super-admin (or /admin/dashboard)
//    - If not logged in -> render Login form at root
// 2. If on main domain (www.dineviq.com / dineviq.com / localhost):
//    - If logged in -> redirect to /super-admin (or /admin/dashboard)
//    - If not logged in -> render LandingPage
const HomeRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader duration={400} />;
  }

  // On billing.dineviq.com
  if (isBillingOrAdminSubdomain()) {
    if (user) {
      const dest = user.role === 'super_admin' ? '/super-admin' : '/admin/dashboard';
      if (typeof window !== 'undefined') {
        window.location.replace(`https://www.dineviq.com${dest}`);
        return <PageLoader duration={300} />;
      }
      return <Navigate to={dest} replace />;
    }
    return <Login />;
  }

  // Desktop application
  if (isDesktopApp()) {
    if (user) {
      return <Navigate to={user.role === 'super_admin' ? '/super-admin' : '/admin/dashboard'} replace />;
    }
    return <Login />;
  }

  // On main domain (www.dineviq.com / dineviq.com / localhost)
  // If user is already logged in, go straight to their dashboard
  if (user) {
    if (user.role === 'super_admin') {
      return <Navigate to="/super-admin" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
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
    const dest = user.role === 'super_admin' ? '/super-admin' : '/admin/dashboard';
    if (typeof window !== 'undefined' && isBillingOrAdminSubdomain()) {
      window.location.replace(`https://www.dineviq.com${dest}`);
      return <PageLoader duration={300} />;
    }
    return <Navigate to={dest} replace />;
  }

  return children;
};

// Dedicated Login Route:
// 1. If user already logged in -> redirect to dashboard on www.dineviq.com
// 2. If on main domain in production -> redirect to billing.dineviq.com/login
// 3. Otherwise (on billing subdomain or local dev) -> render Login
const LoginRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader duration={400} />;
  }

  if (user) {
    const dest = user.role === 'super_admin' ? '/super-admin' : '/admin/dashboard';
    if (typeof window !== 'undefined' && isBillingOrAdminSubdomain()) {
      window.location.replace(`https://www.dineviq.com${dest}`);
      return <PageLoader duration={300} />;
    }
    return <Navigate to={dest} replace />;
  }



  return <Login />;
};

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader duration={200} />}>
      <Routes>
        {/* Root Route: If on billing.dineviq.com, opens Login directly; else shows Landing Page (or dashboard if logged in) */}
        <Route path="/" element={<HomeRoute />} />

        {/* Cross-Domain Auth Token Handoff Callback */}
        <Route path="/auth-callback" element={<AuthCallback />} />

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

        {/* Info / Company & Legal Pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/press-kit" element={<PressKitPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/terms" element={<TermsOfService />} />

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
          <SubdomainGuard />
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
