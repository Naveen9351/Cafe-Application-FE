import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Clock, CheckCircle, RefreshCw, Smartphone, 
  RotateCcw, Sparkles, Filter, ChevronRight, AlertCircle, 
  Flame, Wine, Coffee, Utensils, Send, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './KOTMonitor.module.css';

export default function KOTMonitor({ orders = [], onUpdateStatus }) {
  const [activeStation, setActiveStation] = useState('All');
  const [orderChannel, setOrderChannel] = useState('All');
  const [isDualScreen, setIsDualScreen] = useState(false);
  const [guestPhoneStep, setGuestPhoneStep] = useState('placed'); // 'placed', 'preparing', 'served'
  
  // Local active orders state (synced with parent orders + simulated test orders)
  const [localOrders, setLocalOrders] = useState([]);

  // Initialize demo orders if none are present (in INR ₹)
  const defaultDemoOrders = [
    {
      _id: 'ord_163',
      tableNumber: '14',
      customerName: 'Sarah J.',
      station: 'Grill',
      orderType: 'dine-in',
      channel: 'Dine-in',
      status: 'pending',
      timeMinutes: 4,
      createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
      items: [
        { name: 'Dry-Aged Angus Truffle Burger', quantity: 1, modifiers: 'Brioche • Truffle Fries', price: 340.00 },
        { name: 'Crispy Calamari', quantity: 1, modifiers: 'Garlic Aioli Dip', price: 210.00 }
      ],
      specialInstructions: 'No onions in risotto, extra lemon on the side please.',
      totalAmount: 550.00
    },
    {
      _id: 'ord_184',
      tableNumber: '14',
      customerName: 'Michael B.',
      station: 'Grill',
      orderType: 'dine-in',
      channel: 'Dine-in',
      status: 'preparing',
      timeMinutes: 14,
      createdAt: new Date(Date.now() - 14 * 60000).toISOString(),
      items: [
        { name: 'Angus Truffle Burger', quantity: 2, modifiers: 'Brioche • Med Well', price: 680.00 },
        { name: 'Crispy Calamari', quantity: 1, modifiers: 'Garlic Aioli Dip', price: 210.00 }
      ],
      specialInstructions: '',
      totalAmount: 890.00
    },
    {
      _id: 'ord_103',
      tableNumber: '8',
      customerName: 'Server Liam',
      station: 'Bar',
      orderType: 'dine-in',
      channel: 'Dine-in',
      status: 'preparing',
      timeMinutes: 21,
      createdAt: new Date(Date.now() - 21 * 60000).toISOString(),
      items: [
        { name: 'Smoked Signature Bourbon Mocktail', quantity: 2, modifiers: 'Cedar Mist', price: 420.00 },
        { name: 'Ceremonial Matcha Latte', quantity: 1, modifiers: 'Oat Milk', price: 180.00 }
      ],
      specialInstructions: '',
      totalAmount: 600.00
    },
    {
      _id: 'ord_182',
      tableNumber: '22',
      customerName: 'Clara Rose',
      station: 'Grill',
      orderType: 'dine-in',
      channel: 'Dine-in',
      status: 'ready',
      timeMinutes: 25,
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      items: [
        { name: 'Artisan Margherita Pizza', quantity: 1, modifiers: 'Extra Basil Oil', price: 390.00 },
        { name: 'Burrata & Pesto Salad', quantity: 1, modifiers: 'Sourdough Toast', price: 280.00 }
      ],
      specialInstructions: 'Dressing on the side.',
      totalAmount: 670.00
    },
    {
      _id: 'ord_181',
      tableNumber: '4',
      customerName: 'Alex P.',
      station: 'Grill',
      orderType: 'takeaway',
      channel: 'Takeaway',
      status: 'completed',
      timeMinutes: 19,
      createdAt: new Date(Date.now() - 19 * 60000).toISOString(),
      items: [
        { name: 'Valrhona Chocolate Fondant', quantity: 2, modifiers: 'Vanilla Gelato', price: 320.00 }
      ],
      specialInstructions: '',
      totalAmount: 320.00
    }
  ];

  useEffect(() => {
    if (orders && orders.length > 0) {
      // Map API orders into enriched KDS format
      const formatted = orders.map((o, idx) => ({
        _id: o._id || `api_${idx}`,
        tableNumber: o.tableNumber || '1',
        customerName: o.customerName || `Guest ${idx + 1}`,
        station: idx % 3 === 0 ? 'Grill' : idx % 3 === 1 ? 'Bar' : 'Fryer',
        orderType: o.orderType || 'dine-in',
        channel: o.orderType === 'takeaway' ? 'Takeaway' : o.orderType === 'delivery' ? 'Delivery' : 'Dine-in',
        status: o.status === 'pending' ? 'pending' : o.status === 'preparing' ? 'preparing' : o.status === 'ready' ? 'ready' : o.status,
        timeMinutes: Math.max(2, Math.floor((Date.now() - new Date(o.createdAt || Date.now()).getTime()) / 60000)),
        createdAt: o.createdAt || new Date().toISOString(),
        items: o.items?.map(it => ({
          name: it.name || it.item?.name || 'Dish',
          quantity: it.quantity || 1,
          modifiers: it.variant?.name ? `Size: ${it.variant.name}` : 'Chef Special',
          price: (it.price || 0) * (it.quantity || 1)
        })) || [{ name: 'Gourmet Dish', quantity: 1, modifiers: 'Standard', price: 24 }],
        specialInstructions: o.specialInstructions || '',
        totalAmount: o.total || o.totalAmount || 35
      }));
      setLocalOrders(formatted);
    } else {
      setLocalOrders(defaultDemoOrders);
    }
  }, [orders]);

  const handleUpdateStage = (orderId, newStatus) => {
    setLocalOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    if (onUpdateStatus) onUpdateStatus(orderId, newStatus);
    toast.success(`Order moved to ${newStatus.toUpperCase()}`);
  };

  const handleAddTestOrder = () => {
    const tableNum = Math.floor(Math.random() * 20) + 1;
    const testStations = ['Grill', 'Bar', 'Fryer'];
    const randomStation = testStations[Math.floor(Math.random() * testStations.length)];
    const newTestOrder = {
      _id: `test_${Date.now().toString().slice(-4)}`,
      tableNumber: `${tableNum}`,
      customerName: `Guest Table ${tableNum}`,
      station: randomStation,
      orderType: 'dine-in',
      channel: 'Dine-in',
      status: 'pending',
      timeMinutes: 1,
      createdAt: new Date().toISOString(),
      items: [
        { name: 'Dry-Aged Angus Truffle Burger', quantity: 1, modifiers: 'Brioche • Truffle Fries', price: 28.00 },
        { name: 'Ceremonial Matcha Latte', quantity: 1, modifiers: 'Oat Milk', price: 8.50 }
      ],
      specialInstructions: 'Urgent order for VIP table.',
      totalAmount: 36.50
    };

    setLocalOrders(prev => [newTestOrder, ...prev]);
    toast.success('✨ New Test Order sent to Kitchen!');
  };

  // Filter orders by channel and station
  const filteredOrders = localOrders.filter(o => {
    const matchesStation = activeStation === 'All' || o.station === activeStation;
    const matchesChannel = orderChannel === 'All' || o.channel.toLowerCase() === orderChannel.toLowerCase();
    return matchesStation && matchesChannel;
  });

  // Buckets for 4 stages
  const newOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const inKitchenOrders = filteredOrders.filter(o => o.status === 'preparing');
  const readyOrders = filteredOrders.filter(o => o.status === 'ready');
  const servedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'served');

  return (
    <div className={styles.kdsWrapper}>
      {/* Top Banner & Mode Toggle */}
      <div className={styles.topControlBanner}>
        <div className={styles.bannerLeft}>
          <span className={styles.livePulseDot}></span>
          <span className={styles.bannerTag}>Interactive Dual-Screen Workflow</span>
          <span className={styles.liveBadge}>LIVE SYNC</span>
          <span className={styles.bannerSubtext}>
            Tap "Send Order to Kitchen" on phone (Left) to see it appear live in the New Orders column on the KDS board (Right).
          </span>
        </div>
        <div className={styles.bannerActions}>
          <button 
            type="button"
            className={`${styles.modeBtn} ${isDualScreen ? styles.modeActive : ''}`}
            onClick={() => setIsDualScreen(!isDualScreen)}
          >
            <Smartphone size={16} />
            <span>{isDualScreen ? 'Exit Dual Screen' : 'Dual Screen Sync Mode'}</span>
          </button>
        </div>
      </div>

      <div className={`${styles.mainKdsLayout} ${isDualScreen ? styles.splitLayout : ''}`}>
        
        {/* LEFT PANEL: GUEST DINING PHONE SIMULATION (Visible in Dual Screen Mode) */}
        {isDualScreen && (
          <div className={styles.guestPhonePanel}>
            <div className={styles.panelHeaderTitle}>
              <span className={styles.orangeDot}>●</span> 1. Guest Dining Phone
              <span className={styles.tableChip}>Table #14</span>
            </div>

            <div className={styles.phoneMockup}>
              {/* Phone Dynamic Island */}
              <div className={styles.phoneIsland}>
                <span className={styles.phoneTime}>9:41</span>
                <div className={styles.islandPill}></div>
                <span className={styles.phoneWifi}>● Wi-Fi</span>
              </div>

              {/* Phone Content */}
              <div className={styles.phoneBody}>
                <div className={styles.restaurantHeader}>
                  <div className={styles.restAvatar}>C</div>
                  <div>
                    <h4 className={styles.restName}>The Copper Chimney</h4>
                    <p className={styles.restSub}>Fine Casual Dining</p>
                  </div>
                  <span className={styles.tableBadge}>Table 14</span>
                </div>

                {/* Status Card */}
                <div className={styles.orderSuccessCard}>
                  <div className={styles.successIcon}>
                    <Check size={24} color="#10b981" />
                  </div>
                  <h3 className={styles.successTitle}>Order Sent to Kitchen!</h3>
                  <p className={styles.successSub}>Your meal is being prepared for Table 14.</p>

                  <div className={styles.receiptDetails}>
                    <div className={styles.receiptRow}>
                      <span>Status</span>
                      <strong className={styles.prepHighlight}>In Preparation</strong>
                    </div>
                    <div className={styles.receiptRow}>
                      <span>Items</span>
                      <strong>2 dishes</strong>
                    </div>
                    <div className={styles.receiptRow}>
                      <span>Total Bill</span>
                      <strong>₹550.00</strong>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className={styles.reorderBtn}
                    onClick={() => {
                      handleAddTestOrder();
                      toast.success('New simulated order sent from Guest Phone!');
                    }}
                  >
                    <RefreshCw size={14} /> Simulate Ordering Again
                  </button>
                </div>

                {/* Turnaround Pill */}
                <div className={styles.turnaroundNotification}>
                  <span>The Copper Chimney 2m ago</span>
                  <strong>Turned Table 14 in 38 mins • Saved 14 mins dead time</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT PANEL: 4-STAGE KITCHEN DISPLAY BOARD */}
        <div className={styles.kdsBoardPanel}>
          
          {/* Header Controls Bar */}
          <div className={styles.kdsHeaderRow}>
            <div className={styles.boardIdentity}>
              <div className={styles.gridIconBox}>
                <ChefHat size={18} color="#ffffff" />
              </div>
              <div>
                <div className={styles.boardTitleRow}>
                  <h2 className={styles.boardTitle}>Kitchen Display Board</h2>
                  <span className={styles.stagesBadge}>Live 4 Stages</span>
                </div>
                <p className={styles.boardSub}>Real-Time Kitchen Orders & Station Routing</p>
              </div>
            </div>

            {/* Station Filter Pills */}
            <div className={styles.stationFilters}>
              {['All', 'Grill', 'Bar', 'Fryer'].map(st => (
                <button
                  key={st}
                  type="button"
                  className={`${styles.stationPill} ${activeStation === st ? styles.activeStationPill : ''}`}
                  onClick={() => setActiveStation(st)}
                >
                  {st === 'Grill' && <Flame size={13} />}
                  {st === 'Bar' && <Wine size={13} />}
                  {st === 'Fryer' && <Utensils size={13} />}
                  <span>{st}</span>
                </button>
              ))}
            </div>

            {/* Top Action Buttons */}
            <div className={styles.boardActions}>
              <button type="button" className={styles.testOrderBtn} onClick={handleAddTestOrder}>
                + Test Order
              </button>
              <button 
                type="button" 
                className={styles.refreshIconBtn} 
                title="Refresh Board"
                onClick={() => toast.success('Kitchen feed synced with live tickets')}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Secondary Channel Filter Bar (Lumière Dining style) */}
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
              <span>Kitchen Performance:</span>
              <span className={styles.avgTimePill}>AVG 14m</span>
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
                {newOrders.map(order => (
                  <div key={order._id} className={`${styles.ticketCard} ${styles.cardNew}`}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order._id.slice(-4)}</small></div>
                        <div className={styles.stationTag}>Table QR • {order.station}</div>
                      </div>
                      <span className={`${styles.timerBadge} ${order.timeMinutes > 15 ? styles.timerLate : ''}`}>
                        <Clock size={12} /> {order.timeMinutes}:30
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
                ))}
                {newOrders.length === 0 && (
                  <div className={styles.emptyCol}>
                    <p>No new orders pending</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: IN KITCHEN */}
            <div className={styles.kanbanCol}>
              <div className={`${styles.colHeader} ${styles.colAmber}`}>
                <div className={styles.colTitleWrap}>
                  <span className={styles.colBullet}></span>
                  <span className={styles.colName}>In Kitchen</span>
                </div>
                <span className={`${styles.countBadge} ${styles.amberBadge}`}>{inKitchenOrders.length}</span>
              </div>

              <div className={styles.ticketsList}>
                {inKitchenOrders.map(order => (
                  <div key={order._id} className={`${styles.ticketCard} ${styles.cardPreparing}`}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order._id.slice(-4)}</small></div>
                        <div className={styles.stationTag}>Table QR • {order.station}</div>
                      </div>
                      <span className={`${styles.timerBadge} ${order.timeMinutes > 15 ? styles.timerLate : ''}`}>
                        <Clock size={12} /> {order.timeMinutes}:{order.timeMinutes > 15 ? '43' : '08'}
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
                        className={styles.markReadyBtn}
                        onClick={() => handleUpdateStage(order._id, 'ready')}
                      >
                        Mark Ready →
                      </button>
                    </div>
                  </div>
                ))}
                {inKitchenOrders.length === 0 && (
                  <div className={styles.emptyCol}>
                    <p>No dishes currently in preparation</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: PLATING READY */}
            <div className={styles.kanbanCol}>
              <div className={`${styles.colHeader} ${styles.colGreen}`}>
                <div className={styles.colTitleWrap}>
                  <span className={styles.colBullet}></span>
                  <span className={styles.colName}>Plating Ready</span>
                </div>
                <span className={`${styles.countBadge} ${styles.greenBadge}`}>{readyOrders.length}</span>
              </div>

              <div className={styles.ticketsList}>
                {readyOrders.map(order => (
                  <div key={order._id} className={`${styles.ticketCard} ${styles.cardReady}`}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order._id.slice(-4)}</small></div>
                        <div className={styles.stationTag}>Table QR • {order.station}</div>
                      </div>
                      <span className={`${styles.timerBadge} ${order.timeMinutes > 15 ? styles.timerLate : ''}`}>
                        <Clock size={12} /> {order.timeMinutes}:33
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
                        className={styles.serveTableBtn}
                        onClick={() => handleUpdateStage(order._id, 'completed')}
                      >
                        ✓ Serve to Table
                      </button>
                    </div>
                  </div>
                ))}
                {readyOrders.length === 0 && (
                  <div className={styles.emptyCol}>
                    <p>No plated orders waiting to be served</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 4: SERVED TO TABLE */}
            <div className={styles.kanbanCol}>
              <div className={`${styles.colHeader} ${styles.colNeutral}`}>
                <div className={styles.colTitleWrap}>
                  <span className={styles.colBullet}></span>
                  <span className={styles.colName}>Served to Table</span>
                </div>
                <span className={`${styles.countBadge} ${styles.neutralBadge}`}>{servedOrders.length}</span>
              </div>

              <div className={styles.ticketsList}>
                {servedOrders.map(order => (
                  <div key={order._id} className={`${styles.ticketCard} ${styles.cardServed}`}>
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.tableNumberTag}>Table {order.tableNumber} <small>#{order._id.slice(-4)}</small></div>
                        <div className={styles.stationTag}>Table QR • {order.station}</div>
                      </div>
                      <span className={styles.timerBadge}>
                        <Clock size={12} /> {order.timeMinutes}:30
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
                        className={styles.recallBtn}
                        onClick={() => handleUpdateStage(order._id, 'ready')}
                      >
                        <RotateCcw size={12} /> Recall
                      </button>
                    </div>
                  </div>
                ))}
                {servedOrders.length === 0 && (
                  <div className={styles.emptyCol}>
                    <p>Recent completed orders appear here</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Bottom KDS Performance Status Bar */}
          <footer className={styles.kdsBottomStatus}>
            <div className={styles.statusCounts}>
              <span className={styles.lateIndicator}>● 3 LATE ORDERS</span>
              <span className={styles.pendingIndicator}>● {newOrders.length + inKitchenOrders.length} PENDING</span>
              <span className={styles.readyIndicator}>● {readyOrders.length} READY FOR PICKUP</span>
            </div>
            <div className={styles.sysMeta}>
              <span>SYSTEM STATUS: <strong>OPTIMAL ☁️</strong></span>
              <span className={styles.hubVer}>KITCHEN HUB V4.2.0</span>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}
