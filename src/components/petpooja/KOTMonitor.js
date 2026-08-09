import React from 'react';
import { ChefHat, Clock, CheckCircle } from 'lucide-react';
import styles from './KOTMonitor.module.css';

export default function KOTMonitor({ orders, onUpdateStatus }) {
  // We only show pending, confirmed, preparing, ready orders in the Kitchen monitor
  const activeOrders = orders.filter(o => 
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  ).reverse(); // Oldest first

  const getElapsedTime = (createdAt) => {
    const elapsed = Math.floor((new Date() - new Date(createdAt)) / 60000);
    return `${elapsed}m ago`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return `${styles.statusPill} ${styles.pendingStatus}`;
      case 'confirmed': return `${styles.statusPill} ${styles.pendingStatus}`;
      case 'preparing': return `${styles.statusPill} ${styles.preparingStatus}`;
      case 'ready': return `${styles.statusPill} ${styles.readyStatus}`;
      default: return styles.statusPill;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>
          <div className={styles.iconWrap}>
            <ChefHat size={22} />
          </div>
          <span>Kitchen Order Ticket (KOT) Monitor</span>
        </h2>
        <span className={styles.badge}>
          Active Tickets: {activeOrders.length}
        </span>
      </div>

      {activeOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <ChefHat size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>No active kitchen orders. Everything is served!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {activeOrders.map(order => (
            <div 
              key={order._id} 
              className={styles.ticketCard}
            >
              <div>
                {/* Header */}
                <div className={styles.cardTop}>
                  <div>
                    <h3 className={styles.tableTitle}>
                      {order.tableNumber.includes('Online') ? order.tableNumber : `Table ${order.tableNumber}`}
                    </h3>
                    <span className={styles.orderId}>ID: ...{order._id.substring(order._id.length - 6)}</span>
                  </div>
                  <span className={getStatusBadgeClass(order.status)}>
                    {order.status}
                  </span>
                </div>

                {/* Meta details */}
                <div className={styles.metaRow}>
                   <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={12} /> {getElapsedTime(order.createdAt)}</span>
                   <span style={{ textTransform: 'uppercase', fontWeight: '800', fontSize: '0.65rem', color: '#3f6212' }}>{order.orderType}</span>
                </div>
 
                {/* Items List */}
                <div className={styles.itemsList}>
                  {order.items.map((itm, idx) => (
                    <div key={idx} className={styles.itemRow}>
                      <div style={{ maxWidth: '80%' }}>
                        <span className={styles.itemName}>{itm.name}</span>
                        {itm.variant && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Size: {itm.variant.name}</div>
                        )}
                        {itm.addons && itm.addons.length > 0 && (
                          <div style={{ fontSize: '0.7rem', color: '#059669' }}>Addons: {itm.addons.map(a => a.name).join(', ')}</div>
                        )}
                      </div>
                      <span className={styles.itemQty}>
                        x{itm.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
 
              {/* Status Actions */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e4e5e1' }}>
                {order.status === 'pending' && (
                  <button 
                    onClick={() => onUpdateStatus(order._id, 'preparing')}
                    className={styles.actionBtn}
                    style={{ background: '#84cc16', color: '#1a2e05' }}
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button 
                    onClick={() => onUpdateStatus(order._id, 'ready')}
                    className={styles.actionBtn}
                    style={{ background: '#10b981', color: 'white' }}
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button 
                    onClick={() => onUpdateStatus(order._id, 'completed')}
                    className={styles.actionBtn}
                    style={{ background: '#ecfccb', color: '#3f6212', border: '1px solid #84cc16' }}
                  >
                    <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} /> Complete Order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
