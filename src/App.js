import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Menu from './components/Menu';
import Cart from './components/Cart';
import OrderStatus from './components/OrderStatus';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order/status/:id" element={<OrderStatus />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={<Menu />} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;