import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Utensils, ShoppingBag, Receipt, User } from 'lucide-react';
import { useCartContext } from '../../context/CartContext';
import { encodeTableToken } from '../../utils/tableToken';

export default function CustomerBottomNav({
  tableNumber = '',
  tenantId = '',
  isDarkMode = false,
  isCartBouncing = false
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems } = useCartContext();

  const cartTotalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Determine active tab from URL pathname
  let activeTab = null;
  if (location.pathname.includes('/order')) {
    activeTab = null; // No tab selected when tracking a specific order status
  } else if (location.pathname.includes('/history')) {
    activeTab = 'history';
  } else if (location.pathname.includes('/profile')) {
    activeTab = 'profile';
  } else if (location.pathname.includes('/cart')) {
    activeTab = 'cart';
  } else if (location.pathname === '/' || location.pathname.includes('/menu')) {
    activeTab = 'menu';
  }

  const handleTabClick = (tabKey) => {
    const token = tableNumber ? encodeTableToken(tableNumber) : '';
    const query = token ? `?t=${encodeURIComponent(token)}` : '';

    if (tabKey === 'menu') {
      if (location.pathname === '/menu' || location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate(`/menu${query}`);
      }
    } else if (tabKey === 'cart') {
      navigate(`/cart${query}`);
    } else if (tabKey === 'history') {
      navigate(`/history${query}`);
    } else if (tabKey === 'profile') {
      navigate(`/profile${query}`);
    }
  };

  const navItems = [
    { key: 'menu', label: 'Menu', icon: Utensils },
    { key: 'cart', label: 'Cart', icon: ShoppingBag, badge: cartTotalItems },
    { key: 'history', label: 'Orders', icon: Receipt },
    { key: 'profile', label: 'Profile', icon: User }
  ];

  const barBg = isDarkMode ? 'rgba(20, 16, 12, 0.94)' : 'rgba(255, 255, 255, 0.96)';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.08)';
  const activeColor = '#ea580c';
  const inactiveColor = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '520px',
        backgroundColor: barBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1.5px solid ${borderCol}`,
        borderLeft: `1px solid ${borderCol}`,
        borderRight: `1px solid ${borderCol}`,
        borderTopLeftRadius: '22px',
        borderTopRightRadius: '22px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        padding: '8px 8px env(safe-area-inset-bottom, 8px) 8px',
        zIndex: 990,
        boxShadow: '0 -6px 25px rgba(0, 0, 0, 0.12)',
        boxSizing: 'border-box'
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        const isCart = item.key === 'cart';

        return (
          <motion.button
            key={item.key}
            id={isCart ? "bottom-nav-cart-btn" : undefined}
            data-bottom-tab={item.key}
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => handleTabClick(item.key)}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 0',
              position: 'relative',
              color: isActive ? activeColor : inactiveColor,
              transition: 'color 0.2s ease'
            }}
          >
            {/* Active Indicator Top Dot / Line */}
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                style={{
                  position: 'absolute',
                  top: '-6px',
                  width: '24px',
                  height: '3px',
                  borderRadius: '3px',
                  backgroundColor: activeColor
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {/* Icon Container with optional Badge */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Dynamic Ripple Wave when item lands in Cart */}
              {isCart && isCartBouncing && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0.9 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  style={{
                    position: 'absolute',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '2.5px solid #ea580c',
                    backgroundColor: 'rgba(234, 88, 12, 0.25)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                />
              )}

              <motion.div
                animate={isCart && isCartBouncing ? {
                  scale: [1, 0.75, 1.45, 0.9, 1.15, 1],
                  y: [0, 3, -4, 2, 0],
                  rotate: [0, -12, 12, -6, 0]
                } : { scale: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.5 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? activeColor : inactiveColor}
                />
              </motion.div>

              {/* Badge (for Cart items count) */}
              {item.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={isCart && isCartBouncing ? { scale: [1, 1.5, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-8px',
                    backgroundColor: activeColor,
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.4)',
                    lineHeight: 1
                  }}
                >
                  {item.badge}
                </motion.span>
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: isActive ? 800 : 600,
                letterSpacing: '0.2px',
                lineHeight: 1
              }}
            >
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
