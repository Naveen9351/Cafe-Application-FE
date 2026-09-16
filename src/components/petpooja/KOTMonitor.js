import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Clock, CheckCircle, RefreshCw, 
  RotateCcw, Sparkles, Filter, ChevronRight, AlertCircle, 
  Coffee, Utensils, Send, Check, Flame, ShoppingBag, Trash2, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './KOTMonitor.module.css';

export default function KOTMonitor({ orders = [], onUpdateStatus, onDeleteOrder }) {
  const [orderChannel, setOrderChannel] = useState('All');
  const [now, setNow] = useState(Date.now());
  const [localOrders, setLocalOrders] = useState([]);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [orderToPrep, setOrderToPrep] = useState(null);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(20);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [editTimeMinutes, setEditTimeMinutes] = useState(20);

  // Live Timer ticker: updates every second with proper lifecycle cleanup
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      const formatted = orders.map((o, idx) => ({
        _id: o._id || `ord_${idx}`,
        orderNumber: o.orderNumber || String(o._id).slice(-4),
        tableNumber: o.tableNumber || '1',
        customerName: o.customerDetails?.name || o.customerName || `Guest ${idx + 1}`,
        orderType: o.orderType || 'dine-in',
        channel: o.channel || (o.orderType === 'takeaway' ? 'Takeaway' : o.orderType === 'delivery' ? 'Delivery' : 'Dine-in'),
        status: o.status || 'pending',
        createdAt: o.createdAt || new Date().toISOString(),
        estimatedTime: Number(o.estimatedTime) || 20,
        items: o.items?.map(it => ({
          name: it.name || it.item?.name || 'Dish',
          quantity: it.quantity || 1,
          modifiers: it.variant?.name ? `Size: ${it.variant.name}` : (it.addons && it.addons.length > 0 ? it.addons.map(a => a.name).join(', ') : ''),
          price: (it.price || 0) * (it.quantity || 1)
        })) || [{ name: 'Item', quantity: 1, modifiers: '', price: 100 }],
        specialInstructions: o.specialInstructions || '',
        totalAmount: o.total || o.totalAmount || 0
      }));
      setLocalOrders(formatted);
    } else {
      setLocalOrders([]);
    }
  }, [orders]);

  // Format Elapsed Time as mm:ss
  const formatElapsedTime = (createdAtStr) => {
    if (!createdAtStr) return '00:00';
    const elapsedSeconds = Math.max(0, Math.floor((now - new Date(createdAtStr).getTime()) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getElapsedMinutes = (createdAtStr) => {
    if (!createdAtStr) return 0;
    return Math.floor((now - new Date(createdAtStr).getTime()) / 60000);
  };

  const handleUpdateStage = (orderId, newStatus, estimatedTime) => {
    setLocalOrders(prev => prev.map(o => o._id === orderId ? {
      ...o,
      status: newStatus,
      ...(estimatedTime ? { estimatedTime } : {})
    } : o));
    if (onUpdateStatus) onUpdateStatus(orderId, newStatus, estimatedTime);
  };

  const handleConfirmPrep = () => {
    if (!orderToPrep) return;
    const mins = Number(prepTimeMinutes) || 20;
    handleUpdateStage(orderToPrep._id, 'preparing', mins);
    toast.success(`Started prep for Table ${orderToPrep.tableNumber} (Est: ${mins}m)`);
    setOrderToPrep(null);
  };

  const handleConfirmEditTime = () => {
    if (!orderToEdit) return;
    const mins = Number(editTimeMinutes) || 20;
    // Update only estimatedTime, keep status as 'preparing'
    setLocalOrders(prev => prev.map(o =>
      o._id === orderToEdit._id ? { ...o, estimatedTime: mins } : o
    ));
    if (onUpdateStatus) onUpdateStatus(orderToEdit._id, 'preparing', mins);
    toast.success(`⏱️ Prep time updated to ${mins}m for Table ${orderToEdit.tableNumber}`);
    setOrderToEdit(null);
  };

  const confirmDeleteOrder = () => {
    if (!orderToDelete) return;
    setLocalOrders(prev => prev.filter(o => o._id !== orderToDelete._id));
    if (onDeleteOrder) onDeleteOrder(orderToDelete._id);
    toast.success(`Order #${orderToDelete.orderNumber || ''} removed`);
    setOrderToDelete(null);
  };

  // Filter orders by channel
  const filteredOrders = localOrders.filter(o => {
    if (orderChannel === 'All') return true;
    return (o.channel || '').toLowerCase() === orderChannel.toLowerCase();
  });

  // Buckets for 4 stages
  const newOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const inKitchenOrders = filteredOrders.filter(o => o.status === 'preparing');
  const readyOrders = filteredOrders.filter(o => o.status === 'ready');
  const servedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'served');

  return (
    <div className={styles.kdsWrapper}>
      {/* Top Banner Bar */}
      <div className={styles.topControlBanner}>
        <div className={styles.bannerLeft}>
          <span className={styles.livePulseDot}></span>
          <span className={styles.bannerTag}>Kitchen Display System (KDS)</span>
          <span className={styles.liveBadge}>LIVE TELEMETRY</span>
          <span className={styles.bannerSubtext}>
            Paperless zero-latency ticket dispatch with real-time cooking countdowns.
          </span>
        </div>
        <div className={styles.bannerActions}>
          <button 
            type="button" 
            className={styles.refreshIconBtn} 
            title="Refresh Board"
            onClick={() => toast.success('Kitchen queue synced with live tickets')}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className={styles.mainKdsLayout}>
        <div className={styles.kdsBoardColumn}>
          
          {/* Channel Filter Bar */}
          <div className={styles.channelBar}>
            <div className={styles.channelTabs}>
              {['All', 'Dine-in', 'Takeaway', 'Delivery'].map(ch => (
                <button
                  key={ch}
                  type="button"
                  className={`${styles.channelTab} ${orderChannel === ch ? styles.activeChannelTab : ''}`}
                  onClick={() => setOrderChannel(ch)}
                >
                  {ch === 'All' ? 'All Orders' : ch}
                </button>
              ))}
            </div>

            <div className={styles.perfMetric}>
              <span>Active In Prep:</span>
              <span className={styles.avgTimePill}>{inKitchenOrders.length} Tickets</span>
            </div>
          </div>

          {/* 4-STAGE KANBAN COLUMNS */}
          <div className={styles.kanbanGrid}>
            
            {/* COLUMN 1: NEW ORDERS */}
            <div className={styles.kanbanCol}>
              <div className={`${styles.colHeader} ${styles.colBlue}`}>
                <div className={styles.colTitleWrap}>
                  <span className={styles.colBullet}></span>
                  <span className={styles.colName}>New Orders</span>
                </div>
                <span className={`${styles.countBadge} ${styles.blueBadge}`}>{newOrders.length}</span>
              </div>

              <div className={styles.ticketsList}>
                {newOrders.map(order => {
                  const elapsedMins = getElapsedMinutes(order.createdAt);
                  const isLate = elapsedMins >= 15;

                  return (
                    <div key={order._id} className={`${styles.ticketCard} ${styles.cardNew}`}>
                      <div className={styles.cardHeader}>
                        <div>
                          <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order.orderNumber}</small></div>
                          <div className={styles.stationTag}>{order.channel} • Table QR</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`${styles.timerBadge} ${isLate ? styles.timerLate : ''}`}>
                            <Clock size={12} /> {formatElapsedTime(order.createdAt)}
                          </span>
                          <button 
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}
                            title="Delete Order"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.orderItems}>
                        {order.items.map((it, i) => (
                          <div key={i} className={styles.itemRow}>
                            <div className={styles.itemMain}>
                              <span className={styles.itemName}>{it.name}</span>
                              {it.modifiers && <span className={styles.itemModifier}>↳ {it.modifiers}</span>}
                            </div>
                            <span className={styles.itemQty}>x{it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className={styles.specialInstructionsBox}>
                          <span className={styles.instructionLabel}>ⓘ SPECIAL INSTRUCTIONS</span>
                          <p>{order.specialInstructions}</p>
                        </div>
                      )}

                      <div className={styles.cardFooter} style={{ gap: 6 }}>
                        <span className={styles.cardPrice}>₹{Math.round(order.totalAmount || order.total || 0)}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            type="button"
                            onClick={() => handleUpdateStage(order._id, 'cancelled')}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            title="Cancel Order"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            className={styles.acceptPrepBtn}
                            onClick={() => {
                              setOrderToPrep(order);
                              setPrepTimeMinutes(order.estimatedTime || 20);
                            }}
                          >
                            Accept & Prep →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {newOrders.length === 0 && (
                  <div className={styles.emptyCol}>
                    <p>No new orders pending</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: IN KITCHEN (PREPARING) */}
            <div className={styles.kanbanCol}>
              <div className={`${styles.colHeader} ${styles.colAmber}`}>
                <div className={styles.colTitleWrap}>
                  <span className={styles.colBullet}></span>
                  <span className={styles.colName}>In Kitchen</span>
                </div>
                <span className={`${styles.countBadge} ${styles.amberBadge}`}>{inKitchenOrders.length}</span>
              </div>

              <div className={styles.ticketsList}>
                {inKitchenOrders.map(order => {
                  const targetMins = order.estimatedTime || 20;
                  const elapsedMins = getElapsedMinutes(order.createdAt);
                  const isLate = elapsedMins >= targetMins;
                  const progressPct = Math.min(100, Math.round((elapsedMins / targetMins) * 100));

                  return (
                    <div key={order._id} className={`${styles.ticketCard} ${styles.cardPreparing}`}>
                      <div className={styles.cardHeader}>
                        <div>
                          <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order.orderNumber}</small></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span 
                            className={`${styles.timerBadge} ${styles.timerBadgeClickable} ${isLate ? styles.timerLate : ''}`} 
                            title="Click to edit cooking target time"
                            onClick={() => {
                              setOrderToEdit(order);
                              setEditTimeMinutes(order.estimatedTime || 20);
                            }}
                          >
                            <Clock size={12} /> {formatElapsedTime(order.createdAt)} / {targetMins}m
                          </span>
                          <button 
                            type="button"
                            onClick={() => handleDelete(order._id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}
                            title="Delete Order"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.orderItems}>
                        {order.items.map((it, i) => (
                          <div key={i} className={styles.itemRow}>
                            <div className={styles.itemMain}>
                              <span className={styles.itemName}>{it.name}</span>
                              {it.modifiers && <span className={styles.itemModifier}>↳ {it.modifiers}</span>}
                            </div>
                            <span className={styles.itemQty}>x{it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className={styles.specialInstructionsBox}>
                          <span className={styles.instructionLabel}>ⓘ SPECIAL INSTRUCTIONS</span>
                          <p>{order.specialInstructions}</p>
                        </div>
                      )}

                      <div className={styles.cardFooter} style={{ gap: 6 }}>
                        <span className={styles.cardPrice}>₹{Math.round(order.totalAmount || order.total || 0)}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button 
                            type="button"
                            onClick={() => handleUpdateStage(order._id, 'cancelled')}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            title="Cancel Order"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            className={styles.markReadyBtn}
                            onClick={() => handleUpdateStage(order._id, 'ready')}
                          >
                            Mark Ready ✔
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {inKitchenOrders.length === 0 && (
                  <div className={styles.emptyCol}>
                    <p>No orders currently prepping</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: READY FOR PICKUP */}
            <div className={styles.kanbanCol}>
              <div className={`${styles.colHeader} ${styles.colGreen}`}>
                <div className={styles.colTitleWrap}>
                  <span className={styles.colBullet}></span>
                  <span className={styles.colName}>Ready for Pass</span>
                </div>
                <span className={`${styles.countBadge} ${styles.greenBadge}`}>{readyOrders.length}</span>
              </div>

              <div className={styles.ticketsList}>
                {readyOrders.map(order => (
                  <div key={order._id} className={`${styles.ticketCard} ${styles.cardReady}`}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order.orderNumber}</small></div>
                        <div className={styles.stationTag}>{order.channel} • Ready to Serve</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`${styles.timerBadge} ${styles.timerReady}`}>
                          <Check size={12} /> Plated
                        </span>
                        <button 
                          type="button"
                          onClick={() => setOrderToDelete(order)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}
                          title="Delete Order"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.orderItems}>
                      {order.items.map((it, i) => (
                        <div key={i} className={styles.itemRow}>
                          <div className={styles.itemMain}>
                            <span className={styles.itemName}>{it.name}</span>
                            {it.modifiers && <span className={styles.itemModifier}>↳ {it.modifiers}</span>}
                          </div>
                          <span className={styles.itemQty}>x{it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardPrice}>₹{Math.round(order.totalAmount || order.total || 0)}</span>
                      <button 
                        type="button" 
                        className={styles.completeOrderBtn}
                        onClick={() => handleUpdateStage(order._id, 'completed')}
                      >
                        Served to Guest ✓
                      </button>
                    </div>
                  </div>
                ))}
                {readyOrders.length === 0 && (
                  <div className={styles.emptyCol}>
                    <p>No dishes waiting on expo counter</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 4: SERVED / COMPLETED */}
            <div className={styles.kanbanCol}>
              <div className={`${styles.colHeader} ${styles.colGray}`}>
                <div className={styles.colTitleWrap}>
                  <span className={styles.colBullet}></span>
                  <span className={styles.colName}>Served (Completed)</span>
                </div>
                <span className={`${styles.countBadge} ${styles.grayBadge}`}>{servedOrders.length}</span>
              </div>

              <div className={styles.ticketsList}>
                {servedOrders.slice(0, 10).map(order => (
                  <div key={order._id} className={`${styles.ticketCard} ${styles.cardServed}`}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order.orderNumber}</small></div>
                        <div className={styles.stationTag}>{order.channel} • Completed</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={styles.completedPill}>Delivered</span>
                        <button 
                          type="button"
                          onClick={() => setOrderToDelete(order)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
                          title="Delete Order"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.orderItems}>
                      {order.items.map((it, i) => (
                        <div key={i} className={styles.itemRow}>
                          <div className={styles.itemMain}>
                            <span className={styles.itemName}>{it.name}</span>
                          </div>
                          <span className={styles.itemQty}>x{it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardPrice}>₹{Math.round(order.totalAmount || order.total || 0)}</span>
                    </div>
                  </div>
                ))}
                {servedOrders.length === 0 && (
                  <div className={styles.emptyCol}>
                    <p>Completed orders will appear here</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* CUSTOM CONFIRM DELETE ORDER MODAL */}
      <AnimatePresence>
        {orderToDelete && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }} onClick={() => setOrderToDelete(null)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '2rem',
                width: '100%',
                maxWidth: '420px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <Trash2 size={26} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                Delete Order #{orderToDelete.orderNumber}?
              </h3>
              
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.75rem 0', lineHeight: 1.5 }}>
                Are you sure you want to remove this ticket from kitchen telemetry? This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteOrder}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ESTIMATE PREPARATION TIME MODAL */}
      <AnimatePresence>
        {orderToPrep && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }} onClick={() => setOrderToPrep(null)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '460px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Flame size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Set Kitchen Prep Time
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Table {orderToPrep.tableNumber} • Order #{orderToPrep.orderNumber}
                  </span>
                </div>
              </div>

              {/* Dish Items summary */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                border: '1px solid #e2e8f0',
                marginBottom: '1.25rem',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Dishes to Cook ({orderToPrep.items.length})
                </span>
                {orderToPrep.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: '#1e293b', padding: '2px 0' }}>
                    <span>{it.name}</span>
                    <span style={{ color: '#059669', fontWeight: 800 }}>x{it.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Quick Time Presets */}
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 8 }}>
                Estimated Time for Customer (Minutes):
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: '1rem' }}>
                {[10, 15, 20, 25, 30].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setPrepTimeMinutes(mins)}
                    style={{
                      padding: '8px 0',
                      borderRadius: '8px',
                      border: prepTimeMinutes === mins ? '2px solid #059669' : '1px solid #cbd5e1',
                      background: prepTimeMinutes === mins ? '#ecfdf5' : '#ffffff',
                      color: prepTimeMinutes === mins ? '#047857' : '#334155',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Custom:</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontWeight: 800,
                    fontSize: '14px',
                    textAlign: 'center',
                    color: '#0f172a'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>minutes</span>
              </div>

              <p style={{ fontSize: '11px', color: '#047857', background: '#ecfdf5', padding: '8px 12px', borderRadius: '8px', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✓</span> This preparation estimate will be broadcasted in real-time to the customer tracking screen.
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setOrderToPrep(null)}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPrep}
                  style={{
                    flex: 1.5,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <Flame size={16} /> Start Cooking ({prepTimeMinutes}m)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ESTIMATED TIME MODAL (Admin only — mid-cook adjustment) */}
      <AnimatePresence>
        {orderToEdit && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }} onClick={() => setOrderToEdit(null)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '1.75rem',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: '#eff6ff', color: '#1d4ed8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Update Prep Time
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Table {orderToEdit.tableNumber} • Order #{orderToEdit.orderNumber} • Currently: {orderToEdit.estimatedTime}m
                  </span>
                </div>
              </div>

              {/* Admin notice */}
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '8px 12px', marginBottom: '1.25rem', fontSize: '12px', color: '#92400e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚠️</span> Admin only — the updated time will broadcast immediately to the customer tracking screen.
              </div>

              {/* Quick presets */}
              <label style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: 8 }}>
                New Estimated Time (Minutes):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: '1rem' }}>
                {[10, 15, 20, 25, 30].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEditTimeMinutes(mins)}
                    style={{
                      padding: '8px 0',
                      borderRadius: '8px',
                      border: editTimeMinutes === mins ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                      background: editTimeMinutes === mins ? '#eff6ff' : '#ffffff',
                      color: editTimeMinutes === mins ? '#1d4ed8' : '#334155',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Custom:</span>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={editTimeMinutes}
                  onChange={(e) => setEditTimeMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    fontWeight: 800,
                    fontSize: '14px',
                    textAlign: 'center',
                    color: '#0f172a'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>minutes</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setOrderToEdit(null)}
                  style={{
                    flex: 1,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEditTime}
                  style={{
                    flex: 1.5,
                    padding: '11px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#1d4ed8',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.3)'
                  }}
                >
                  <Clock size={15} /> Update & Broadcast
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
