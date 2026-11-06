import React, { useState, useEffect, useMemo } from 'react';
import {
  ChefHat, Clock, CheckCircle, RefreshCw,
  RotateCcw, Sparkles, Filter, ChevronRight, AlertCircle,
  Coffee, Utensils, Send, Check, Flame, ShoppingBag, Trash2, XCircle, X,
  LayoutGrid, Table as TableIcon, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './KOTMonitor.module.css';

// Pipeline stage order for directional validation
const STAGE_ORDER = {
  pending: 0,
  confirmed: 0,
  preparing: 1,
  ready: 2,
  completed: 3,
  served: 3
};

const STAGE_LABELS = {
  pending: 'New Orders',
  preparing: 'In Kitchen',
  ready: 'Ready for Pass',
  served: 'Served',
  completed: 'Completed'
};

export default function KOTMonitor({ orders = [], onUpdateStatus, onDeleteOrder, enableEstimatedPrepTime = false }) {
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [tableStatusTab, setTableStatusTab] = useState('all'); // 'all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [orderChannel, setOrderChannel] = useState('All');
  const [now, setNow] = useState(Date.now());
  const [localOrders, setLocalOrders] = useState([]);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [orderToPrep, setOrderToPrep] = useState(null);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(20);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [editTimeMinutes, setEditTimeMinutes] = useState(20);
  const [servedKanbanPage, setServedKanbanPage] = useState(1);
  const [tableOrdersPage, setTableOrdersPage] = useState(1);
  const servedLimit = 20;

  // Drag & Drop State
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [revertConfirmModal, setRevertConfirmModal] = useState(null);
  const [isItemSummaryOpen, setIsItemSummaryOpen] = useState(false);

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
        orderNumber: o.orderNumber || String(o._id).slice(-5),
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

  // Format Elapsed Time dynamically across seconds, minutes, hours, and days
  // Format table badge cleanly e.g. "T 1", "T Roof", "T Outdoor"
  const formatCardTableNumber = (tableNum) => {
    if (!tableNum) return 'T 1';
    let str = String(tableNum).trim();
    if (/^table\s*/i.test(str)) {
      str = str.replace(/^table\s*/i, '');
    } else if (/^t\s*/i.test(str)) {
      str = str.replace(/^t\s*/i, '');
    }
    str = str.trim();
    if (!str) return 'T 1';
    const formatted = str.charAt(0).toUpperCase() + str.slice(1);
    return `T ${formatted}`;
  };

  const formatElapsedTime = (createdAtStr) => {
    if (!createdAtStr) return '0s';
    const elapsedSeconds = Math.max(0, Math.floor((now - new Date(createdAtStr).getTime()) / 1000));
    const days = Math.floor(elapsedSeconds / 86400);
    const hours = Math.floor((elapsedSeconds % 86400) / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;

    if (days > 0) {
      return hours > 0 ? `${days}d ${hours}h` : `${days}d ${mins}m`;
    }
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    if (mins > 0) {
      return `${mins}m ${String(secs).padStart(2, '0')}s`;
    }
    return `${secs}s`;
  };

  const formatOrderTimestamp = (createdAtStr) => {
    if (!createdAtStr) return '';
    try {
      const d = new Date(createdAtStr);
      return `Placed: ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}, ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
    } catch (e) {
      return '';
    }
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

  // Drag & Drop Handlers
  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.setData('text/plain', order._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedOrder(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDragLeave = (e, colKey) => {
    if (dragOverCol === colKey) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedOrder) return;

    const currentStatus = (draggedOrder.status || 'pending').toLowerCase();
    const curStageIdx = STAGE_ORDER[currentStatus] ?? 0;
    const tgtStageIdx = STAGE_ORDER[targetStatus] ?? 0;

    if (currentStatus === targetStatus || (curStageIdx === tgtStageIdx && (currentStatus === 'completed' || currentStatus === 'served'))) {
      setDraggedOrder(null);
      return;
    }

    if (tgtStageIdx > curStageIdx) {
      // Forward drag -> directly update status!
      handleUpdateStage(draggedOrder._id, targetStatus);
      toast.success(`Order #${draggedOrder.orderNumber} moved to ${STAGE_LABELS[targetStatus]}`);
    } else {
      // Backward drag -> prompt with confirmation modal!
      setRevertConfirmModal({
        order: draggedOrder,
        targetStatus,
        sourceStatus: currentStatus,
        sourceLabel: STAGE_LABELS[currentStatus] || currentStatus,
        targetLabel: STAGE_LABELS[targetStatus] || targetStatus
      });
    }
    setDraggedOrder(null);
  };

  const handleConfirmRevert = () => {
    if (!revertConfirmModal) return;
    const { order, targetStatus, targetLabel } = revertConfirmModal;
    handleUpdateStage(order._id, targetStatus);
    toast.success(`Order #${order.orderNumber} reverted back to ${targetLabel}`);
    setRevertConfirmModal(null);
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

  // Keyboard listener for Escape to close Item Summary drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isItemSummaryOpen) {
        setIsItemSummaryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isItemSummaryOpen]);

  // Aggregate item quantities across orders in "pending" (New) and "preparing" (In Kitchen)
  const kitchenItemSummary = useMemo(() => {
    const activeOrders = localOrders.filter(o =>
      o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing'
    );

    const map = new Map();

    activeOrders.forEach(order => {
      const isNew = order.status === 'pending' || order.status === 'confirmed';
      const isKitchen = order.status === 'preparing';
      const tableRaw = String(order.tableNumber || '1').trim();
      const formattedTable = tableRaw.toLowerCase().startsWith('table')
        ? tableRaw.replace(/^table\s*/i, 'T ')
        : (tableRaw.toLowerCase().startsWith('t ') ? tableRaw : `T ${tableRaw}`);

      (order.items || []).forEach(it => {
        const rawName = String(it.name || 'Dish').trim();
        if (!rawName) return;

        const qty = Number(it.quantity) || 1;
        const normKey = rawName.toLowerCase();

        if (!map.has(normKey)) {
          map.set(normKey, {
            name: rawName,
            totalQty: 0,
            newQty: 0,
            kitchenQty: 0,
            modifiers: new Set(),
            tables: []
          });
        }

        const entry = map.get(normKey);
        entry.totalQty += qty;
        if (isNew) entry.newQty += qty;
        if (isKitchen) entry.kitchenQty += qty;

        if (it.modifiers && it.modifiers.trim()) {
          entry.modifiers.add(it.modifiers.trim());
        }

        entry.tables.push({
          table: formattedTable,
          qty,
          orderNumber: order.orderNumber,
          isNew,
          isKitchen
        });
      });
    });

    // Sort descending by totalQty ("most valued on top")
    return Array.from(map.values()).sort((a, b) => b.totalQty - a.totalQty);
  }, [localOrders]);

  const totalPrepItemsCount = useMemo(() => {
    return kitchenItemSummary.reduce((sum, it) => sum + it.totalQty, 0);
  }, [kitchenItemSummary]);

  const totalNewItemsCount = useMemo(() => {
    return kitchenItemSummary.reduce((sum, it) => sum + it.newQty, 0);
  }, [kitchenItemSummary]);

  const totalCookingItemsCount = useMemo(() => {
    return kitchenItemSummary.reduce((sum, it) => sum + it.kitchenQty, 0);
  }, [kitchenItemSummary]);

  // Filter orders by channel
  const filteredOrders = localOrders.filter(o => {
    if (orderChannel === 'All') return true;
    return (o.channel || '').toLowerCase() === orderChannel.toLowerCase();
  });

  // Buckets for 4 stages
  const newOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const inKitchenOrders = filteredOrders.filter(o => o.status === 'preparing');
  const readyOrders = filteredOrders.filter(o => o.status === 'ready');
  const servedOrders = filteredOrders.filter(o => o.status === 'served');

  // Filtered orders for Table View based on secondary status toggle + channel + search
  const displayedTableOrders = localOrders.filter(ord => {
    // 1. Channel filter
    if (orderChannel !== 'All' && (ord.channel || '').toLowerCase() !== orderChannel.toLowerCase()) {
      return false;
    }
    // 2. Status filter
    if (tableStatusTab === 'pending') {
      if (ord.status !== 'pending' && ord.status !== 'confirmed') return false;
    } else if (tableStatusTab === 'preparing') {
      if (ord.status !== 'preparing') return false;
    } else if (tableStatusTab === 'ready') {
      if (ord.status !== 'ready') return false;
    } else if (tableStatusTab === 'completed') {
      if (ord.status !== 'completed' && ord.status !== 'served') return false;
    } else if (tableStatusTab === 'cancelled') {
      if (ord.status !== 'cancelled') return false;
    }
    // 3. Search query
    if (tableSearchQuery.trim()) {
      const q = tableSearchQuery.toLowerCase();
      const matchOrderNum = String(ord.orderNumber || '').toLowerCase().includes(q);
      const matchTable = String(ord.tableNumber || '').toLowerCase().includes(q);
      const matchCust = String(ord.customerName || '').toLowerCase().includes(q);
      const matchItems = (ord.items || []).some(it => String(it.name || '').toLowerCase().includes(q));
      if (!matchOrderNum && !matchTable && !matchCust && !matchItems) return false;
    }
    return true;
  });

  return (
    <div className={styles.kdsWrapper}>
      <div className={styles.mainKdsLayout}>
        <div className={styles.kdsBoardColumn}>

          {/* Top Bar: Channels & Refresh */}
          <div className={styles.channelBar}>
            <div className={styles.channelTabs}>
              {['All', 'Dine-in', 'Takeaway', 'Delivery'].map(ch => (
                <button
                  key={ch}
                  type="button"
                  className={`${styles.channelTab} ${orderChannel === ch ? styles.activeChannelTab : ''}`}
                  onClick={() => setOrderChannel(ch)}
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsItemSummaryOpen(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '5px 13px',
                  borderRadius: '9px',
                  border: isItemSummaryOpen ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                  background: isItemSummaryOpen ? '#fff7ed' : '#ffffff',
                  color: isItemSummaryOpen ? '#c2410c' : '#0f172a',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease'
                }}
                title="Toggle Live Kitchen Prep Item Counter"
              >
                <Flame size={15} color="#ea580c" />
                <span>Item Counter</span>
                {totalPrepItemsCount > 0 ? (
                  <span style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '1px 7px',
                    borderRadius: '100px',
                    lineHeight: 1.2
                  }}>
                    {totalPrepItemsCount}
                  </span>
                ) : (
                  <span style={{
                    background: '#f1f5f9',
                    color: '#64748b',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '100px'
                  }}>
                    0
                  </span>
                )}
              </button>

              <button
                type="button"
                className={styles.refreshIconBtn}
                title="Refresh Board"
                onClick={() => toast.success('Kitchen queue synced with live tickets')}
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {viewMode === 'card' ? (
            /* 4-STAGE KANBAN COLUMNS WITH DRAG & DROP */
            <div className={styles.kanbanGrid}>

              {/* COLUMN 1: NEW ORDERS */}
              <div
                className={`${styles.kanbanCol} ${dragOverCol === 'pending' ? styles.kanbanColDragOver : ''}`}
                onDragOver={(e) => handleDragOver(e, 'pending')}
                onDragLeave={(e) => handleDragLeave(e, 'pending')}
                onDrop={(e) => handleDrop(e, 'pending')}
              >
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
                    const isDraggingThis = draggedOrder?._id === order._id;

                    return (
                      <div
                        key={order._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                        onDragEnd={handleDragEnd}
                        className={`${styles.ticketCard} ${styles.ticketCardDraggable} ${isDraggingThis ? styles.ticketCardDragging : ''} ${styles.cardNew}`}
                        title="Drag and drop to move between stages"
                      >
                        <div className={styles.cardHeader}>
                          <div className={styles.cardHeaderLeft}>
                            <div className={styles.tableTitleRow}>
                              <span className={styles.tableBadge}>
                                {formatCardTableNumber(order.tableNumber)}
                              </span>
                              <span className={styles.orderIdPill}>
                                #{order.orderNumber}
                              </span>
                            </div>
                            <div className={styles.stationTag}>
                              {order.channel || 'Dine-in'} • Table QR
                            </div>
                          </div>
                          <div className={styles.cardHeaderRight}>
                            <span
                              className={`${styles.timerBadge} ${isLate ? styles.timerLate : ''}`}
                              title={formatOrderTimestamp(order.createdAt)}
                            >
                              <Clock size={12} />
                              <span>{formatElapsedTime(order.createdAt)}</span>
                            </span>
                          </div>
                        </div>

                        <div className={styles.orderItems}>
                          {order.items.map((it, i) => (
                            <div key={i} className={styles.itemRow}>
                              <div className={styles.itemMain}>
                                <span className={styles.itemName}>{it.name}</span>
                                {it.modifiers && <span className={styles.itemModifier}>{String(it.modifiers).replace(/^[↳\s]+/, '')}</span>}
                              </div>
                              <span className={styles.itemQty}>×{it.quantity}</span>
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
                              onClick={(e) => { e.stopPropagation(); handleUpdateStage(order._id, 'cancelled'); }}
                              className={styles.cancelOrderBtn}
                              title="Cancel Order"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className={styles.acceptPrepBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (enableEstimatedPrepTime) {
                                  setOrderToPrep(order);
                                  setPrepTimeMinutes(order.estimatedTime || 20);
                                } else {
                                  handleUpdateStage(order._id, 'preparing', 0);
                                  toast.success(`Order for Table ${order.tableNumber} sent to kitchen`);
                                }
                              }}
                            >
                              Accept
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
              <div
                className={`${styles.kanbanCol} ${dragOverCol === 'preparing' ? styles.kanbanColDragOver : ''}`}
                onDragOver={(e) => handleDragOver(e, 'preparing')}
                onDragLeave={(e) => handleDragLeave(e, 'preparing')}
                onDrop={(e) => handleDrop(e, 'preparing')}
              >
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
                    const isDraggingThis = draggedOrder?._id === order._id;

                    return (
                      <div
                        key={order._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                        onDragEnd={handleDragEnd}
                        className={`${styles.ticketCard} ${styles.ticketCardDraggable} ${isDraggingThis ? styles.ticketCardDragging : ''} ${styles.cardPreparing}`}
                        title="Drag and drop to move between stages"
                      >
                        <div className={styles.cardHeader}>
                          <div className={styles.cardHeaderLeft}>
                            <div className={styles.tableTitleRow}>
                              <span className={styles.tableBadge}>
                                {formatCardTableNumber(order.tableNumber)}
                              </span>
                              <span className={styles.orderIdPill}>
                                #{order.orderNumber}
                              </span>
                            </div>
                            <div className={styles.stationTag}>
                              {order.channel || 'Dine-in'} • In Kitchen
                            </div>
                          </div>
                          <div className={styles.cardHeaderRight}>
                            {enableEstimatedPrepTime ? (
                              <span
                                className={`${styles.timerBadge} ${styles.timerBadgeClickable} ${isLate ? styles.timerLate : ''}`}
                                title={formatOrderTimestamp(order.createdAt) ? `${formatOrderTimestamp(order.createdAt)} • Click to edit cooking target time` : 'Click to edit cooking target time'}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrderToEdit(order);
                                  setEditTimeMinutes(order.estimatedTime || 20);
                                }}
                              >
                                <Clock size={12} />
                                <span>{formatElapsedTime(order.createdAt)} / {targetMins}m</span>
                              </span>
                            ) : (
                              <span
                                className={`${styles.timerBadge} ${isLate ? styles.timerLate : ''}`}
                                title={formatOrderTimestamp(order.createdAt)}
                              >
                                <Clock size={12} />
                                <span>{formatElapsedTime(order.createdAt)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={styles.orderItems}>
                          {order.items.map((it, i) => (
                            <div key={i} className={styles.itemRow}>
                              <div className={styles.itemMain}>
                                <span className={styles.itemName}>{it.name}</span>
                                {it.modifiers && <span className={styles.itemModifier}>{String(it.modifiers).replace(/^[↳\s]+/, '')}</span>}
                              </div>
                              <span className={styles.itemQty}>×{it.quantity}</span>
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
                              onClick={(e) => { e.stopPropagation(); handleUpdateStage(order._id, 'cancelled'); }}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fee2e2', background: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                              title="Cancel Order"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className={styles.markReadyBtn}
                              onClick={(e) => { e.stopPropagation(); handleUpdateStage(order._id, 'ready'); }}
                            >
                              Mark Ready
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
              <div
                className={`${styles.kanbanCol} ${dragOverCol === 'ready' ? styles.kanbanColDragOver : ''}`}
                onDragOver={(e) => handleDragOver(e, 'ready')}
                onDragLeave={(e) => handleDragLeave(e, 'ready')}
                onDrop={(e) => handleDrop(e, 'ready')}
              >
                <div className={`${styles.colHeader} ${styles.colGreen}`}>
                  <div className={styles.colTitleWrap}>
                    <span className={styles.colBullet}></span>
                    <span className={styles.colName}>Ready for Pass</span>
                  </div>
                  <span className={`${styles.countBadge} ${styles.greenBadge}`}>{readyOrders.length}</span>
                </div>

                <div className={styles.ticketsList}>
                  {readyOrders.map(order => {
                    const isDraggingThis = draggedOrder?._id === order._id;
                    return (
                      <div
                        key={order._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, order)}
                        onDragEnd={handleDragEnd}
                        className={`${styles.ticketCard} ${styles.ticketCardDraggable} ${isDraggingThis ? styles.ticketCardDragging : ''} ${styles.cardReady}`}
                        title="Drag and drop to move between stages"
                      >
                        <div className={styles.cardHeader}>
                          <div className={styles.cardHeaderLeft}>
                            <div className={styles.tableTitleRow}>
                              <span className={styles.tableBadge}>
                                {formatCardTableNumber(order.tableNumber)}
                              </span>
                              <span className={styles.orderIdPill}>
                                #{order.orderNumber}
                              </span>
                            </div>
                            <div className={styles.stationTag}>
                              {order.channel || 'Dine-in'} • Ready to Serve
                            </div>
                          </div>
                          <div className={styles.cardHeaderRight}>
                            <span className={`${styles.timerBadge} ${styles.timerReady}`}>
                              <Check size={12} />
                              <span>Plated</span>
                            </span>
                          </div>
                        </div>

                        <div className={styles.orderItems}>
                          {order.items.map((it, i) => (
                            <div key={i} className={styles.itemRow}>
                              <div className={styles.itemMain}>
                                <span className={styles.itemName}>{it.name}</span>
                                {it.modifiers && <span className={styles.itemModifier}>{String(it.modifiers).replace(/^[↳\s]+/, '')}</span>}
                              </div>
                              <span className={styles.itemQty}>×{it.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className={styles.cardFooter}>
                          <span className={styles.cardPrice}>₹{Math.round(order.totalAmount || order.total || 0)}</span>
                          <button
                            type="button"
                            className={styles.completeOrderBtn}
                            onClick={(e) => { e.stopPropagation(); handleUpdateStage(order._id, 'served'); }}
                          >
                            Served to Guest ✓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {readyOrders.length === 0 && (
                    <div className={styles.emptyCol}>
                      <p>No dishes waiting on expo counter</p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 4: SERVED */}
              <div
                className={`${styles.kanbanCol} ${(dragOverCol === 'served' || dragOverCol === 'completed') ? styles.kanbanColDragOver : ''}`}
                onDragOver={(e) => handleDragOver(e, 'served')}
                onDragLeave={(e) => handleDragLeave(e, 'served')}
                onDrop={(e) => handleDrop(e, 'served')}
              >
                <div className={`${styles.colHeader} ${styles.colGray}`}>
                  <div className={styles.colTitleWrap}>
                    <span className={styles.colBullet}></span>
                    <span className={styles.colName}>Served</span>
                  </div>
                  <span className={`${styles.countBadge} ${styles.grayBadge}`}>{servedOrders.length}</span>
                </div>

                <div className={styles.ticketsList}>
                  {servedOrders.slice((servedKanbanPage - 1) * servedLimit, servedKanbanPage * servedLimit).map(order => (
                    <div key={order._id} className={`${styles.ticketCard} ${styles.cardServed}`}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderLeft}>
                          <div className={styles.tableTitleRow}>
                            <span className={styles.tableBadge}>
                              {formatCardTableNumber(order.tableNumber)}
                            </span>
                            <span className={styles.orderIdPill}>
                              #{order.orderNumber}
                            </span>
                          </div>
                          <div className={styles.stationTag}>
                            {order.channel || 'Dine-in'} • Served
                          </div>
                        </div>
                        <div className={styles.cardHeaderRight}>
                          <span className={styles.completedPill}>
                            Delivered
                          </span>
                        </div>
                      </div>

                      <div className={styles.orderItems}>
                        {order.items.map((it, i) => (
                          <div key={i} className={styles.itemRow}>
                            <div className={styles.itemMain}>
                              <span className={styles.itemName}>{it.name}</span>
                            </div>
                            <span className={styles.itemQty}>×{it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className={styles.cardFooter}>
                        <span className={styles.cardPrice}>₹{Math.round(order.totalAmount || order.total || 0)}</span>
                      </div>
                    </div>
                  ))}

                  {servedOrders.length > servedLimit && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      marginTop: '6px',
                      fontSize: '11px',
                      color: '#64748b'
                    }}>
                      <span>
                        {((servedKanbanPage - 1) * servedLimit) + 1} - {Math.min(servedKanbanPage * servedLimit, servedOrders.length)} of {servedOrders.length}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          disabled={servedKanbanPage === 1}
                          onClick={() => setServedKanbanPage(p => Math.max(1, p - 1))}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            background: servedKanbanPage === 1 ? '#f8fafc' : '#ffffff',
                            color: servedKanbanPage === 1 ? '#94a3b8' : '#0f172a',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: servedKanbanPage === 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Prev
                        </button>
                        <span style={{ fontWeight: 700 }}>{servedKanbanPage} / {Math.ceil(servedOrders.length / servedLimit)}</span>
                        <button
                          type="button"
                          disabled={servedKanbanPage >= Math.ceil(servedOrders.length / servedLimit)}
                          onClick={() => setServedKanbanPage(p => Math.min(Math.ceil(servedOrders.length / servedLimit), p + 1))}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            background: servedKanbanPage >= Math.ceil(servedOrders.length / servedLimit) ? '#f8fafc' : '#ffffff',
                            color: servedKanbanPage >= Math.ceil(servedOrders.length / servedLimit) ? '#94a3b8' : '#0f172a',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: servedKanbanPage >= Math.ceil(servedOrders.length / servedLimit) ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {servedOrders.length === 0 && (
                    <div className={styles.emptyCol}>
                      <p>Served orders will appear here</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            /* TABLE VIEW */
            <div className={styles.tableKdsContainer}>
              {/* Secondary Status Filter Tabs + Search */}
              <div className={styles.tableFilterBar}>
                <div className={styles.statusTabsGroup}>
                  {[
                    { id: 'all', label: 'All Orders', count: localOrders.length, color: '#4f46e5' },
                    { id: 'pending', label: 'New Orders', count: newOrders.length, color: '#2563eb' },
                    { id: 'preparing', label: 'In Kitchen', count: inKitchenOrders.length, color: '#d97706' },
                    { id: 'ready', label: 'Ready for Pass', count: readyOrders.length, color: '#16a34a' },
                    { id: 'completed', label: 'Served', count: servedOrders.length, color: '#64748b' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`${styles.statusTabBtn} ${tableStatusTab === tab.id ? styles.statusTabBtnActive : ''}`}
                      onClick={() => { setTableStatusTab(tab.id); setTableOrdersPage(1); }}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={styles.statusTabBadge}
                        style={{
                          backgroundColor: tableStatusTab === tab.id ? tab.color : '#e2e8f0',
                          color: tableStatusTab === tab.id ? '#ffffff' : '#475569'
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="Search order #, table, dish..."
                      value={tableSearchQuery}
                      onChange={(e) => setTableSearchQuery(e.target.value)}
                      style={{
                        padding: '6px 10px 6px 30px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.78rem',
                        outline: 'none',
                        width: '190px'
                      }}
                    />
                  </div>

                  {/* Channel quick filter */}
                  <select
                    value={orderChannel}
                    onChange={(e) => setOrderChannel(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.78rem',
                      background: '#ffffff',
                      fontWeight: 600,
                      outline: 'none',
                      color: '#334155'
                    }}
                  >
                    <option value="All">All Channels</option>
                    <option value="Dine-in">Dine-in</option>
                    <option value="Takeaway">Takeaway</option>
                    <option value="Delivery">Delivery</option>
                  </select>
                </div>
              </div>

              {/* Table of Orders */}
              <div className={styles.kdsTableWrap}>
                <table className={styles.kdsDataTable}>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Table / Channel</th>
                      <th>Customer</th>
                      <th>Items & Modifiers</th>
                      <th>Date & Time</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTableOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={styles.emptyTableState}>
                          No orders found matching the filter criteria ({tableStatusTab.replace('_', ' ')}).
                        </td>
                      </tr>
                    ) : (
                      displayedTableOrders.slice((tableOrdersPage - 1) * 20, tableOrdersPage * 20).map((order) => {
                        const elapsedMins = getElapsedMinutes(order.createdAt);
                        const isLate = elapsedMins >= (order.estimatedTime || 15);
                        const isNew = order.status === 'pending' || order.status === 'confirmed';
                        const isPrep = order.status === 'preparing';
                        const isReady = order.status === 'ready';
                        const isDone = order.status === 'completed' || order.status === 'served';
                        const isCancelled = order.status === 'cancelled';

                        return (
                          <tr key={order._id}>
                            <td>
                              <div className={styles.tableOrderNum}>
                                #{order.orderNumber}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                ID: {order._id.slice(-6)}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                Table {order.tableNumber}
                              </div>
                              <span className={styles.tableChannelBadge}>
                                {order.channel || 'Dine-in'}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#1e293b' }}>
                                {order.customerName || 'Walk-in Guest'}
                              </div>
                            </td>
                            <td style={{ maxWidth: '280px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {order.items.map((it, idx) => (
                                  <div key={idx} className={styles.tableDishItem}>
                                    <span className={styles.tableDishQty}>x{it.quantity}</span>
                                    <span>{it.name}</span>
                                    {it.modifiers && (
                                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>({it.modifiers})</span>
                                    )}
                                  </div>
                                ))}
                                {order.specialInstructions && (
                                  <div style={{ fontSize: '0.68rem', color: '#ea580c', fontStyle: 'italic', marginTop: '2px' }}>
                                    Note: {order.specialInstructions}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700 }}>
                                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '1px' }}>
                                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                                ₹{Math.round(order.totalAmount || order.total || 0)}
                              </div>
                            </td>
                            <td>
                              {isNew && (
                                <span className={styles.statusPillNew}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }}></span>
                                  New Order
                                </span>
                              )}
                              {isPrep && (
                                <span className={styles.statusPillPrep}>
                                  <Flame size={11} /> In Kitchen
                                </span>
                              )}
                              {isReady && (
                                <span className={styles.statusPillReady}>
                                  <Check size={11} /> Ready
                                </span>
                              )}
                              {isDone && (
                                <span className={styles.statusPillServed}>
                                  Delivered
                                </span>
                              )}
                              {isCancelled && (
                                <span className={styles.statusPillCancelled}>
                                  Cancelled
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                {isNew && (
                                  <>
                                    <button
                                      type="button"
                                      className={styles.tblBtnPrep}
                                      onClick={() => {
                                        if (enableEstimatedPrepTime) {
                                          setOrderToPrep(order);
                                          setPrepTimeMinutes(order.estimatedTime || 20);
                                        } else {
                                          handleUpdateStage(order._id, 'preparing', 20);
                                          toast.success(`Cooking started for Table ${order.tableNumber}`);
                                        }
                                      }}
                                    >
                                      <Flame size={12} /> Accept
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.tblBtnCancel}
                                      onClick={() => handleUpdateStage(order._id, 'cancelled')}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {isPrep && (
                                  <>
                                    <button
                                      type="button"
                                      className={styles.tblBtnReady}
                                      onClick={() => handleUpdateStage(order._id, 'ready')}
                                    >
                                      <Check size={12} /> Mark Ready
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.tblBtnCancel}
                                      onClick={() => handleUpdateStage(order._id, 'cancelled')}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {isReady && (
                                  <button
                                    type="button"
                                    className={styles.tblBtnServed}
                                    onClick={() => handleUpdateStage(order._id, 'served')}
                                  >
                                    <CheckCircle size={12} /> Mark Served
                                  </button>
                                )}
                                {!isDone && (
                                  <button
                                    type="button"
                                    onClick={() => setOrderToDelete(order)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#94a3b8',
                                      cursor: 'pointer',
                                      padding: '4px'
                                    }}
                                    title="Delete Order"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {displayedTableOrders.length > 20 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderTop: '1px solid #f1f5f9',
                    background: '#f8fafc',
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    <span>
                      Showing {((tableOrdersPage - 1) * 20) + 1} - {Math.min(tableOrdersPage * 20, displayedTableOrders.length)} of {displayedTableOrders.length} orders
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={tableOrdersPage === 1}
                        onClick={() => setTableOrdersPage(p => Math.max(1, p - 1))}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: tableOrdersPage === 1 ? '#f8fafc' : '#ffffff',
                          color: tableOrdersPage === 1 ? '#94a3b8' : '#0f172a',
                          fontWeight: 700,
                          cursor: tableOrdersPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ fontWeight: 700 }}>
                        Page {tableOrdersPage} of {Math.ceil(displayedTableOrders.length / 20) || 1}
                      </span>
                      <button
                        type="button"
                        disabled={tableOrdersPage >= Math.ceil(displayedTableOrders.length / 20)}
                        onClick={() => setTableOrdersPage(p => Math.min(Math.ceil(displayedTableOrders.length / 20), p + 1))}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: tableOrdersPage >= Math.ceil(displayedTableOrders.length / 20) ? '#f8fafc' : '#ffffff',
                          color: tableOrdersPage >= Math.ceil(displayedTableOrders.length / 20) ? '#94a3b8' : '#0f172a',
                          fontWeight: 700,
                          cursor: tableOrdersPage >= Math.ceil(displayedTableOrders.length / 20) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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

      {/* REVERT / BACKWARD DRAG CONFIRMATION MODAL */}
      <AnimatePresence>
        {revertConfirmModal && (
          <div
            className={styles.revertModalOverlay}
            onClick={() => setRevertConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={styles.revertModalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.revertModalHeader}>
                <div className={styles.revertModalIcon}>
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h3 className={styles.revertModalTitle}>Revert Order Stage?</h3>
                  <span className={styles.revertModalSubtitle}>
                    Order #{revertConfirmModal.order.orderNumber} • Table {revertConfirmModal.order.tableNumber}
                  </span>
                </div>
              </div>

              <div className={styles.revertModalBody}>
                You are dragging this order backward from <strong>{revertConfirmModal.sourceLabel}</strong> back to <strong>{revertConfirmModal.targetLabel}</strong>.
                <br /><br />
                Do you really want to drag back this order?
              </div>

              <div className={styles.revertModalActions}>
                <button
                  type="button"
                  className={styles.revertCancelBtn}
                  onClick={() => setRevertConfirmModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.revertConfirmBtn}
                  onClick={handleConfirmRevert}
                >
                  <RotateCcw size={14} /> Yes, Revert Stage
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING RIGHT EDGE HANDLE FOR FAST ACCESS */}
      {!isItemSummaryOpen && totalPrepItemsCount > 0 && (
        <button
          type="button"
          onClick={() => setIsItemSummaryOpen(true)}
          style={{
            position: 'fixed',
            right: 0,
            top: '45%',
            transform: 'translateY(-50%)',
            zIndex: 998,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            border: 'none',
            borderTopLeftRadius: '14px',
            borderBottomLeftRadius: '14px',
            padding: '14px 10px',
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.25)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s ease'
          }}
          title="Open Kitchen Prep Item Counter"
        >
          <div style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 900
          }}>
            {totalPrepItemsCount}
          </div>
          <span style={{
            writingMode: 'vertical-rl',
            fontSize: '10.5px',
            fontWeight: 800,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: '#cbd5e1'
          }}>
            Prep Items
          </span>
        </button>
      )}

      {/* OVERLAPPING SLIDE-OUT DRAWER: KITCHEN PREP ITEM COUNTER */}
      <AnimatePresence>
        {isItemSummaryOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsItemSummaryOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(3px)',
                zIndex: 9998
              }}
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '400px',
                maxWidth: '92vw',
                background: '#ffffff',
                boxShadow: '-12px 0 40px rgba(15, 23, 42, 0.25)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Drawer Header */}
              <div style={{
                padding: '1.1rem 1.25rem',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#fff7ed',
                    border: '1px solid #fed7aa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ea580c'
                  }}>
                    <Flame size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                      Live Prep Items
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      New & In-Kitchen summary
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsItemSummaryOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Close Counter (Esc)"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Status Breakdown Chips */}
              {totalPrepItemsCount > 0 && (
                <div style={{
                  padding: '8px 1.25rem',
                  background: '#ffffff',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '100px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #dbeafe',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                    {totalNewItemsCount} in New Orders
                  </span>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '100px',
                    background: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fef3c7',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                    {totalCookingItemsCount} In Kitchen
                  </span>
                </div>
              )}

              {/* Drawer Body: Aggregated Items List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
                {kitchenItemSummary.length === 0 ? (
                  /* Empty state when no orders in new or kitchen */
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: '#94a3b8',
                    padding: '2rem 1rem'
                  }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: '#f8fafc',
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                      color: '#94a3b8'
                    }}>
                      <ChefHat size={30} />
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#334155' }}>
                      Kitchen Queue is Empty
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', maxWidth: '240px', lineHeight: 1.5 }}>
                      No active items in "New Orders" or "In Kitchen". When orders arrive, dishes will be counted here automatically.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {kitchenItemSummary.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#ffffff',
                          borderRadius: '12px',
                          border: '1.5px solid #e2e8f0',
                          padding: '12px 14px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Left: Item Info + Table Breakdown */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              color: idx === 0 ? '#ea580c' : '#64748b',
                              background: idx === 0 ? '#fff7ed' : '#f1f5f9',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              #{idx + 1}
                            </span>
                            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', wordBreak: 'break-word', lineHeight: 1.25 }}>
                              {item.name}
                            </span>
                          </div>

                          {/* Modifiers / Variants if any */}
                          {item.modifiers.size > 0 && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: 6, fontStyle: 'italic' }}>
                              {Array.from(item.modifiers).join(' • ')}
                            </div>
                          )}

                          {/* Tables breakdown (e.g. T 1 x2, T 3 x1) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                            {item.tables.map((tInfo, tIdx) => (
                              <span
                                key={tIdx}
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  background: tInfo.isKitchen ? '#fef3c7' : '#eff6ff',
                                  color: tInfo.isKitchen ? '#92400e' : '#1d4ed8',
                                  border: `1px solid ${tInfo.isKitchen ? '#fde68a' : '#dbeafe'}`
                                }}
                                title={`Order #${tInfo.orderNumber} (${tInfo.isKitchen ? 'In Kitchen' : 'New'})`}
                              >
                                {tInfo.table} ×{tInfo.qty}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Right: Big Bold Total Quantity Badge */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '50px',
                          padding: '6px 12px',
                          background: idx === 0 ? '#ea580c' : '#0f172a',
                          color: '#ffffff',
                          borderRadius: '10px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          flexShrink: 0
                        }}>
                          <span style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1 }}>
                            {item.totalQty}
                          </span>
                          <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.85, marginTop: 2 }}>
                            Total
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {kitchenItemSummary.length > 0 && (
                <div style={{
                  padding: '12px 1.25rem',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#475569',
                  flexShrink: 0
                }}>
                  <span>Distinct Dishes: <strong style={{ color: '#0f172a' }}>{kitchenItemSummary.length}</strong></span>
                  <span>Total Portions: <strong style={{ color: '#ea580c', fontSize: '14px' }}>{totalPrepItemsCount}</strong></span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
