import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Menu from './components/Menu';
import Cart from './components/Cart';
import OrderStatus from './components/OrderStatus';
import OrderHistoryPage from './components/OrderHistoryPage';
import CustomerProfilePage from './components/CustomerProfilePage';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import TenantRegister from './components/TenantRegister';
import LandingPage from './components/LandingPage';
import BookDemoPage from './components/BookDemoPage';
import PricingPage from './components/PricingPage';
import ProductsPage from './components/ProductsPage';
import SolutionsPage from './components/SolutionsPage';
import { POSBillingPage, KitchenOpsPage, InventoryPage, CRMLoyaltyPage, AICopilotPage } from './components/FeaturePages';
import { AboutPage, CareersPage, PressKitPage, ContactPage } from './components/InfoPages';
import PageLoader from './components/PageLoader';
import ScrollToTop from './components/common/ScrollToTop';
import SEOManager from './components/common/SEOManager';
import { isBillingOrAdminSubdomain } from './utils/subdomain';

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
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <SEOManager />
          <ScrollToTop />
          <AppRoutes />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;