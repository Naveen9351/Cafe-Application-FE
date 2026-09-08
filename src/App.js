import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Menu from './components/Menu';
import Cart from './components/Cart';
import OrderStatus from './components/OrderStatus';
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

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader duration={800} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Or forbidden page
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public / Customer Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/order/status/:id" element={<OrderStatus />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<TenantRegister />} />
      <Route path="/register-business" element={<TenantRegister />} />

      {/* Marketing / Landing Subpages */}
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/solutions" element={<SolutionsPage />} />
      <Route path="/demo" element={<BookDemoPage />} />
      <Route path="/book-demo" element={<BookDemoPage />} />

      {/* Feature / Marketing Pages */}
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

      {/* Protected Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppRoutes />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;