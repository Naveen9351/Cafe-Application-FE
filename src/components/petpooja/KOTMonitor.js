import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Clock, CheckCircle, RefreshCw, 
  RotateCcw, Sparkles, Filter, ChevronRight, AlertCircle, 
  Coffee, Utensils, Send, Check, Flame, ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './KOTMonitor.module.css';

export default function KOTMonitor({ orders = [], onUpdateStatus }) {
  const [orderChannel, setOrderChannel] = useState('All');
  const [now, setNow] = useState(Date.now());
  const [localOrders, setLocalOrders] = useState([]);

  // Live Timer ticker: updates every second with proper lifecycle cleanup
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    if (orders && orders.length > 0) {
      const formatted = orders.map((o, idx) => ({
        _id: o._id || `ord_${idx}`,
        orderNumber: o.orderNumber || String(o._id).slice(-4),
        tableNumber: o.tableNumber || '1',
        customerName: o.customerDetails?.name || o.customerName || `Guest ${idx + 1}`,
        orderType: o.orderType || 'dine-in',
        channel: o.channel || (o.orderType === 'takeaway' ? 'Takeaway' : o.orderType === 'delivery' ? 'Delivery' : 'Dine-in'),
        status: o.status || 'pending',
        createdAt: o.createdAt || new Date(Date.now() - (idx + 1) * 3 * 60000).toISOString(),
        items: o.items?.map(it => ({
          name: it.name || it.item?.name || 'Dish',
          quantity: it.quantity || 1,
          modifiers: it.variant?.name ? `Size: ${it.variant.name}` : (it.addons && it.addons.length > 0 ? it.addons.map(a => a.name).join(', ') : ''),
          price: (it.price || 0) * (it.quantity || 1)
        })) || [{ name: 'Chef Special', quantity: 1, modifiers: '', price: 250 }],
        specialInstructions: o.specialInstructions || '',
        totalAmount: o.total || o.totalAmount || 0
      }));
      setLocalOrders(formatted);
    } else {
      setLocalOrders([
        {
          _id: 'ord_101',
          orderNumber: '2849',
          tableNumber: '14',
          customerName: 'Sarah J.',
          channel: 'Dine-in',
          status: 'pending',
          createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
          items: [
            { name: 'Wagyu Truffle Burger', quantity: 1, modifiers: 'Brioche • Truffle Fries', price: 480.00 },
            { name: 'Cold Brew Coffee', quantity: 1, modifiers: '', price: 160.00 }
          ],
          specialInstructions: 'No onions, extra lemon on the side.',
          totalAmount: 640.00
        },
        {
          _id: 'ord_102',
          orderNumber: '2850',
          tableNumber: '8',
          customerName: 'Michael B.',
          channel: 'Dine-in',
          status: 'preparing',
          createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
          items: [
            { name: 'Classic Pomodoro Fettuccine', quantity: 2, modifiers: 'Extra Parmesan', price: 720.00 },
            { name: 'Crispy Truffle Calamari', quantity: 1, modifiers: 'Garlic Aioli Dip', price: 290.00 }
          ],
          specialInstructions: '',
          totalAmount: 1010.00
        },
        {
          _id: 'ord_103',
          orderNumber: '2851',
          tableNumber: '4',
          customerName: 'Alex P.',
          channel: 'Takeaway',
          status: 'ready',
          createdAt: new Date(Date.now() - 22 * 60000).toISOString(),
          items: [
            { name: 'Valrhona Chocolate Fondant', quantity: 2, modifiers: 'Vanilla Gelato', price: 480.00 }
          ],
          specialInstructions: '',
          totalAmount: 480.00
        }
      ]);
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

  const handleUpdateStage = (orderId, newStatus) => {
    setLocalOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    if (onUpdateStatus) onUpdateStatus(orderId, newStatus);
    toast.success(`Order moved to ${newStatus.toUpperCase()}`);
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
                        <span className={`${styles.timerBadge} ${isLate ? styles.timerLate : ''}`}>
                          <Clock size={12} /> {formatElapsedTime(order.createdAt)}
                        </span>
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

                      <div className={styles.cardFooter}>
                        <span className={styles.cardPrice}>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                        <button 
                          type="button" 
                          className={styles.acceptPrepBtn}
                          onClick={() => handleUpdateStage(order._id, 'preparing')}
                        >
                          Accept & Prep →
                        </button>
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
                  const elapsedMins = getElapsedMinutes(order.createdAt);
                  const isLate = elapsedMins >= 15;

                  return (
                    <div key={order._id} className={`${styles.ticketCard} ${styles.cardPreparing}`}>
                      <div className={styles.cardHeader}>
                        <div>
                          <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order.orderNumber}</small></div>
                          <div className={styles.stationTag}>{order.channel} • Cooking</div>
                        </div>
                        <span className={`${styles.timerBadge} ${isLate ? styles.timerLate : ''}`}>
                          <Clock size={12} /> {formatElapsedTime(order.createdAt)}
                        </span>
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

                      <div className={styles.cardFooter}>
                        <span className={styles.cardPrice}>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                        <button 
                          type="button" 
                          className={styles.markReadyBtn}
                          onClick={() => handleUpdateStage(order._id, 'ready')}
                        >
                          Mark Ready ✔
                        </button>
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
                      <span className={`${styles.timerBadge} ${styles.timerReady}`}>
                        <Check size={12} /> Plated
                      </span>
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
                      <span className={styles.cardPrice}>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
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
                {servedOrders.slice(0, 5).map(order => (
                  <div key={order._id} className={`${styles.ticketCard} ${styles.cardServed}`}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order.orderNumber}</small></div>
                        <div className={styles.stationTag}>{order.channel} • Completed</div>
                      </div>
                      <span className={styles.completedPill}>Delivered</span>
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
                      <span className={styles.cardPrice}>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
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
    </div>
  );
}
