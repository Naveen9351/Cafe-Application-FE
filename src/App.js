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
import LandingPage from './components/LandingPage'; // Import Landing Page

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ fontWeight: 700, color: '#64748b' }}>Authenticating...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
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
      <Route path="/" element={<LandingPage />} /> {/* Default to Landing Page */}
      <Route path="/menu" element={<Menu />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/order/status/:id" element={<OrderStatus />} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      {/* Redirect /admin/login to /login */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/register-business" element={<TenantRegister />} />

      {/* Protected Routes */}

      {/* Business Admin Dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      {/* Catch-all for /admin -> redirect to dashboard */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />

      {/* Super Admin Dashboard */}
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