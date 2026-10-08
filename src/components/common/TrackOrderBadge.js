import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { encodeTableToken } from '../../utils/tableToken';

// Animated Dining Cloche / Order Tracking Dish Symbol
export function OrderTrackSymbol({ size = 18, color = "currentColor", strokeWidth = 2.2, hasActive = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, overflow: 'visible' }}
    >
      {/* Animated Steam Line Left */}
      <motion.path
        d="M8.5 2.8c0 .8.5 1.2.5 1.7"
        animate={{ y: [0, -2, 0], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Cloche Knob / Center Handle */}
      <motion.path
        d="M12 4v2"
        animate={hasActive ? { y: [0, -1, 0] } : {}}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Animated Steam Line Right */}
      <motion.path
        d="M15.5 2.8c0 .8-.5 1.2-.5 1.7"
        animate={{ y: [0, -2, 0], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />

      {/* Cloche Dome Cover */}
      <motion.path
        d="M18 15H6a2 2 0 0 1-2-2 8 8 0 0 1 16 0 2 2 0 0 1-2 2z"
        animate={hasActive ? { rotate: [0, -2, 2, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Platter Base */}
      <path d="M4 18.5h16" />
    </svg>
  );
}

export default function TrackOrderBadge({
  activeRunningOrder = null,
  tableNumber = '',
  isDarkMode = false,
  className = '',
  style = {}
}) {
  const navigate = useNavigate();

  // Only render tracking badge if there is an active running order
  if (!activeRunningOrder) {
    return null;
  }

  const handleTrackClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (activeRunningOrder?._id) {
      const tbl = activeRunningOrder.tableNumber || tableNumber;
      const token = tbl ? encodeTableToken(tbl) : '';
      navigate(`/order/status/${activeRunningOrder._id}${token ? `?t=${encodeURIComponent(token)}` : ''}`);
    }
  };

  const hasActive = true;
  const isReady = activeRunningOrder?.status === 'ready';

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.12, rotate: [0, -6, 6, 0] }}
      whileTap={{ scale: 0.9 }}
      animate={
        hasActive
          ? {
              scale: [1, 1.06, 1],
              boxShadow: [
                isDarkMode ? '0 0 0px rgba(234, 88, 12, 0)' : '0 0 0px rgba(234, 88, 12, 0)',
                isDarkMode ? '0 0 12px rgba(234, 88, 12, 0.45)' : '0 0 12px rgba(234, 88, 12, 0.35)',
                isDarkMode ? '0 0 0px rgba(234, 88, 12, 0)' : '0 0 0px rgba(234, 88, 12, 0)',
              ]
            }
          : {
              scale: [1, 1.03, 1]
            }
      }
      transition={{
        duration: hasActive ? 1.8 : 3.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      onClick={handleTrackClick}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        backgroundColor: hasActive
          ? (isDarkMode ? 'rgba(234, 88, 12, 0.22)' : '#fff7ed')
          : (isDarkMode ? 'rgba(255, 255, 255, 0.07)' : '#f1f5f9'),
        border: `1px solid ${
          hasActive
            ? (isDarkMode ? 'rgba(234, 88, 12, 0.55)' : '#fb923c')
            : (isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.07)')
        }`,
        color: hasActive
          ? (isDarkMode ? '#fb923c' : '#ea580c')
          : (isDarkMode ? '#cbd5e1' : '#475569'),
        cursor: 'pointer',
        padding: 0,
        outline: 'none',
        userSelect: 'none',
        boxSizing: 'border-box',
        ...style
      }}
      title={hasActive ? "Track Active Order (In Progress)" : "Track Order Status"}
    >
      <OrderTrackSymbol size={18} hasActive={hasActive} />
    </motion.button>
  );
}
