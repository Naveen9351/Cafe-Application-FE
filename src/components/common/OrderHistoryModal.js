import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Receipt, ChevronRight, Utensils, CheckCircle2, AlertCircle, Sparkles, ExternalLink, Calendar, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL as API } from '../../config/api';
import { encodeTableToken } from '../../utils/tableToken';
import RestaurantCafeLottieLoader from '../RestaurantCafeLottieLoader';

export default function OrderHistoryModal({
  isOpen,
  onClose,
  tableNumber = '',
  tenantId = '',
  isDarkMode = false
}) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        let phone = localStorage.getItem('customer_phone') || localStorage.getItem('verified_customer_phone') || '';
        if (!phone) {
          try {
            const cu = JSON.parse(localStorage.getItem('customer_user') || '{}');
            if (cu?.phone) phone = cu.phone;
          } catch (e) {}
        }
        if (!phone) {
          try {
            const vc = JSON.parse(localStorage.getItem('verifiedCustomer') || '{}');
            if (vc?.phone) phone = vc.phone;
          } catch (e) {}
        }
        if (!phone) {
          try {
            const c = JSON.parse(localStorage.getItem('customer') || '{}');
            if (c?.phone) phone = c.phone;
          } catch (e) {}
        }
        phone = phone ? String(phone).replace(/[^0-9]/g, '') : '';

        let sessionIds = [];
        try {
          sessionIds = JSON.parse(localStorage.getItem('serviq_session_orders') || '[]');
        } catch (e) {}
        const lastOrd = localStorage.getItem('serviq_last_order_id');
        if (lastOrd && !sessionIds.includes(lastOrd)) sessionIds.push(lastOrd);

        const allFoundOrders = new Map();

        // Check local cache
        try {
          const cachedRaw = localStorage.getItem('serviq_order_history');
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (Array.isArray(parsed)) {
              parsed.forEach(ord => {
                if (ord && (ord._id || ord.orderNumber)) {
                  allFoundOrders.set(String(ord._id || ord.orderNumber), ord);
                }
              });
            }
          }
        } catch (e) {}

        // 1. Try /orders/history/customer
        try {
          const res = await axios.get(`${API}/orders/history/customer`, {
            params: {
              phone: phone || undefined,
              tableNumber: tableNumber || undefined,
              sessionIds: sessionIds.length > 0 ? sessionIds.join(',') : undefined,
              tenantId: tenantId || localStorage.getItem('tenantId') || undefined
            },
            timeout: 4500
          });
          if (Array.isArray(res.data)) {
            res.data.forEach(ord => {
              if (ord && (ord._id || ord.orderNumber)) {
                allFoundOrders.set(String(ord._id || ord.orderNumber), ord);
              }
            });
          }
        } catch (e) {}

        // 2. Try /orders/active-session
        try {
          const activeRes = await axios.get(`${API}/orders/active-session`, {
            params: {
              phone: phone || undefined,
              tableNumber: tableNumber || undefined,
              tenantId: tenantId || localStorage.getItem('tenantId') || undefined
            },
            timeout: 4500
          });
          if (activeRes.data) {
            if (Array.isArray(activeRes.data.sessionOrders)) {
              activeRes.data.sessionOrders.forEach(ord => {
                if (ord && (ord._id || ord.orderNumber)) {
                  allFoundOrders.set(String(ord._id || ord.orderNumber), ord);
                }
              });
            } else if (activeRes.data._id) {
              allFoundOrders.set(String(activeRes.data._id), activeRes.data);
            }
          }
        } catch (e) {}

        // 3. Fallback: query individual session orders
        if (sessionIds.length > 0) {
          const promises = sessionIds.map(oid => 
            axios.get(`${API}/orders/status/${oid}`, { timeout: 4500 }).catch(() => null)
          );
          const results = await Promise.allSettled(promises);
          results.forEach(r => {
            if (r.status === 'fulfilled' && r.value?.data?._id) {
              allFoundOrders.set(String(r.value.data._id), r.value.data);
            }
          });
        }

        const merged = Array.from(allFoundOrders.values());
        merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setOrders(merged);
      } catch (err) {
        console.warn('Failed to load order history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, tableNumber, tenantId]);

  if (!isOpen) return null;

  const bgModal = isDarkMode ? '#1a130e' : '#ffffff';
  const cardBg = isDarkMode ? '#241c14' : '#f8fafc';
  const borderCol = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
  const textMain = isDarkMode ? '#f8fafc' : '#0f172a';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9998
          }}
        />

        {/* Modal Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          style={{
            position: 'relative',
            zIndex: 9999,
            width: '100%',
            maxWidth: '520px',
            backgroundColor: bgModal,
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.35)',
            border: `1px solid ${borderCol}`
          }}
        >
          {/* Grab Handle */}
          <div style={{ width: '40px', height: '4px', borderRadius: '4px', backgroundColor: isDarkMode ? '#475569' : '#cbd5e1', margin: '12px auto 0 auto' }} />

          {/* Header */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${borderCol}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Receipt size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: textMain }}>Your Order History</h3>
                <span style={{ fontSize: '0.75rem', color: textMuted }}>
                  {orders.length} {orders.length === 1 ? 'order placed' : 'orders placed'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: textMain
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* Body / List */}
          <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ padding: '10px 0', width: '100%' }}>
                <RestaurantCafeLottieLoader
                  tableNumber={tableNumber}
                  isDarkMode={isDarkMode}
                  compact={true}
                />
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: textMuted }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDarkMode ? '#241c14' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#ea580c' }}>
                  <Utensils size={28} />
                </div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800, color: textMain }}>No Past Orders Found</h4>
                <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.5 }}>
                  You haven't placed any orders yet. Once you place an order, it will show up here with live status and receipts!
                </p>
              </div>
            ) : (
              orders.map((ord) => {
                const isActive = ['pending', 'confirmed', 'preparing', 'ready'].includes(ord.status) && ord.paymentStatus !== 'paid';
                const isReady = ord.status === 'ready';
                const isCompleted = ord.status === 'completed';
                const isPaid = ord.paymentStatus === 'paid';
                const dateStr = ord.createdAt
                  ? new Date(ord.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : 'Recent';

                return (
                  <div
                    key={ord._id}
                    onClick={() => {
                      if (isActive) {
                        onClose();
                        const tbl = ord.tableNumber || tableNumber;
                        const token = tbl ? encodeTableToken(tbl) : '';
                        navigate(`/order/status/${ord._id}${token ? `?t=${encodeURIComponent(token)}` : ''}`);
                      }
                    }}
                    style={{
                      backgroundColor: cardBg,
                      border: `1px solid ${isActive ? 'rgba(234, 88, 12, 0.45)' : borderCol}`,
                      borderRadius: '18px',
                      padding: '14px 16px',
                      boxShadow: isActive ? '0 6px 20px rgba(234, 88, 12, 0.15)' : 'none',
                      cursor: isActive ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, #ea580c, #f59e0b, #ea580c)'
                      }} />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 900, color: textMain }}>
                            #{ord.orderNumber || ord._id?.slice(-5).toUpperCase()}
                          </span>
                          {ord.tableNumber && (
                            <span style={{
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                              color: textMain
                            }}>
                              Table {ord.tableNumber}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: textMuted, marginTop: '2px' }}>
                          <Clock size={11} />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div style={{
                        padding: '3px 9px',
                        borderRadius: '100px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: isActive
                          ? (isReady ? 'rgba(22, 163, 74, 0.15)' : 'rgba(234, 88, 12, 0.15)')
                          : (isCompleted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(220, 38, 38, 0.12)'),
                        color: isActive
                          ? (isReady ? '#16a34a' : '#ea580c')
                          : (isCompleted ? '#10b981' : '#dc2626')
                      }}>
                        {isActive && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isReady ? '#16a34a' : '#ea580c' }} />
                        )}
                        <span>{isActive ? (isReady ? 'Ready to Serve' : 'Kitchen Cooking') : (isCompleted ? 'Served' : ord.status)}</span>
                      </div>
                    </div>

                    {/* Items snippet */}
                    <div style={{
                      backgroundColor: isDarkMode ? '#17120e' : '#f8fafc',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      margin: '6px 0 8px 0'
                    }}>
                      {ord.items?.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ color: textMain, fontWeight: 600 }}>
                            <strong style={{ color: '#ea580c', marginRight: '4px' }}>{it.quantity}x</strong>
                            {it.name}
                          </span>
                          <span style={{ color: textMain, fontWeight: 700 }}>
                            ₹{Math.round((it.price || 0) * (it.quantity || 1))}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom row: Total & Payment */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: `1px solid ${borderCol}` }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '5px',
                        backgroundColor: isPaid ? 'rgba(22, 163, 74, 0.14)' : (isDarkMode ? 'rgba(234, 88, 12, 0.14)' : '#fff7ed'),
                        color: isPaid ? '#16a34a' : '#ea580c'
                      }}>
                        {isPaid ? '✓ Paid Online' : '● Pay at Counter'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '0.66rem', color: textMuted, fontWeight: 700, textTransform: 'uppercase' }}>Total</span>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: textMain }}>
                          ₹{Math.round(ord.settledAmount || ord.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
