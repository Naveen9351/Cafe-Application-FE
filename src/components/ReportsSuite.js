import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  Printer, 
  Calendar, 
  PieChart, 
  Award, 
  ArrowUpRight,
  BookOpen,
  Search,
  X,
  Receipt,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../config/api';
import styles from './ReportsSuite.module.css';

export default function ReportsSuite() {
  const [orders, setOrders] = useState([]);
  const [khataRecords, setKhataRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'today', '7d', '30d', 'all'
  const [orderSearch, setOrderSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [ordersRes, khataRes] = await Promise.allSettled([
        axios.get(`${API_URL}/orders`, { headers }),
        axios.get(`${API_URL}/khata`, { headers })
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
        setOrders(ordersRes.value.data);
      }
      if (khataRes.status === 'fulfilled' && khataRes.value.data?.records) {
        setKhataRecords(khataRes.value.data.records);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date
  const filteredOrders = orders.filter(ord => {
    if (timeFilter === 'all') return true;
    const ordDate = new Date(ord.createdAt);
    const now = new Date();
    if (timeFilter === 'today') {
      return ordDate.toDateString() === now.toDateString();
    }
    if (timeFilter === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return ordDate >= sevenDaysAgo;
    }
    if (timeFilter === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return ordDate >= thirtyDaysAgo;
    }
    return true;
  });

  // Robust order amount resolver across schemas and fallbacks
  const getOrderAmount = (ord) => {
    if (!ord) return 0;
    const val = Number(ord.settledAmount || ord.finalAmount || ord.total || ord.totalAmount || ord.subTotal);
    if (!isNaN(val) && val > 0) return val;
    if (Array.isArray(ord.items) && ord.items.length > 0) {
      return ord.items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    }
    return 0;
  };

  // Calculate metrics
  const completedOrders = filteredOrders.filter(o => o.status === 'completed');
  const totalGrossRevenue = completedOrders.reduce((acc, o) => acc + getOrderAmount(o), 0);
  const totalOrdersCount = completedOrders.length;
  const avgTicketSize = totalOrdersCount > 0 ? Math.round(totalGrossRevenue / totalOrdersCount) : 0;

  // Payment Breakdown
  const paymentBreakdown = {
    Cash: 0,
    UPI: 0,
    Card: 0,
    Khata: 0
  };

  completedOrders.forEach(ord => {
    const method = (ord.paymentMethod || 'Cash').toLowerCase();
    const amt = getOrderAmount(ord);
    if (method.includes('upi') || method.includes('gpay')) {
      paymentBreakdown.UPI += amt;
    } else if (method.includes('card')) {
      paymentBreakdown.Card += amt;
    } else if (method.includes('khata') || method.includes('borrow')) {
      paymentBreakdown.Khata += amt;
    } else {
      paymentBreakdown.Cash += amt;
    }
  });

  // Khata Total Outstanding
  const outstandingKhata = khataRecords
    .filter(k => k.status !== 'settled')
    .reduce((acc, k) => acc + (Number(k.borrowAmount || k.remainingAmount || k.totalBill) || 0), 0);

  // Top Dishes
  const dishSales = {};
  completedOrders.forEach(ord => {
    (ord.items || []).forEach(item => {
      const name = item.name || item.item?.name || 'Unknown Item';
      const qty = item.quantity || 1;
      const price = item.price || 0;
      if (!dishSales[name]) {
        dishSales[name] = { name, count: 0, revenue: 0 };
      }
      dishSales[name].count += qty;
      dishSales[name].revenue += (qty * price);
    });
  });

  const topDishes = Object.values(dishSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2>
            <BarChart3 size={26} color="#2563eb" />
            Revenue & Sales Reports Suite
          </h2>
          <p>Comprehensive financial intelligence, payment mode settlements, peak metrics, and dish performance.</p>
        </div>

        <div className={styles.controlsGroup}>
          {['today', '7d', '30d', 'all'].map(tf => (
            <button
              key={tf}
              type="button"
              className={`${styles.dateFilterBtn} ${timeFilter === tf ? styles.dateFilterActive : ''}`}
              onClick={() => setTimeFilter(tf)}
            >
              {tf === 'today' ? 'Today' : tf === '7d' ? 'Last 7 Days' : tf === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}

          <button type="button" className={styles.printBtn} onClick={handlePrint}>
            <Printer size={15} />
            Print Report
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiTitle}>Total Gross Revenue</div>
            <div className={styles.kpiValue}>₹{totalGrossRevenue.toLocaleString()}</div>
            <div className={styles.kpiSubtitle}>
              <ArrowUpRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
              From {totalOrdersCount} Completed Orders
            </div>
          </div>
          <div className={styles.kpiIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <DollarSign size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiTitle}>Average Order Value</div>
            <div className={styles.kpiValue}>₹{avgTicketSize}</div>
            <div className={styles.kpiSubtitle} style={{ color: '#64748b' }}>
              Per settled dining/takeaway ticket
            </div>
          </div>
          <div className={styles.kpiIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <TrendingUp size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiTitle}>Total Orders Volume</div>
            <div className={styles.kpiValue}>{totalOrdersCount}</div>
            <div className={styles.kpiSubtitle} style={{ color: '#64748b' }}>
              {filteredOrders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length} Currently Active
            </div>
          </div>
          <div className={styles.kpiIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div>
            <div className={styles.kpiTitle}>Khata / Udhari Dues</div>
            <div className={styles.kpiValue} style={{ color: '#dc2626' }}>₹{outstandingKhata.toLocaleString()}</div>
            <div className={styles.kpiSubtitle} style={{ color: '#dc2626' }}>
              {khataRecords.filter(k => k.status !== 'settled').length} Customers with pending balance
            </div>
          </div>
          <div className={styles.kpiIcon} style={{ background: '#fee2e2', color: '#dc2626' }}>
            <BookOpen size={22} />
          </div>
        </div>
      </div>

      {/* Grid: Payment Method Breakdown & Top Dishes */}
      <div className={styles.chartsGrid}>
        {/* Payment Methods */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <h3>Payment Method Breakdown</h3>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Gross Share</span>
          </div>

          <div className={styles.breakdownList}>
            {[
              { name: 'UPI / GPay / QR', amt: paymentBreakdown.UPI, color: '#2563eb' },
              { name: 'Cash in Register', amt: paymentBreakdown.Cash, color: '#16a34a' },
              { name: 'Debit / Credit Card', amt: paymentBreakdown.Card, color: '#8b5cf6' },
              { name: 'Khata / Borrow Credit', amt: paymentBreakdown.Khata, color: '#d97706' }
            ].map(item => {
              const pct = totalGrossRevenue > 0 ? Math.round((item.amt / totalGrossRevenue) * 100) : 0;
              return (
                <div key={item.name} className={styles.breakdownItem}>
                  <div className={styles.breakdownHeader}>
                    <span>{item.name}</span>
                    <span style={{ color: '#0f172a' }}>₹{item.amt.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBar}
                      style={{ width: `${pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Dish Performers */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <h3>Top Menu Performers</h3>
            <Award size={18} color="#d97706" />
          </div>

          {topDishes.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '0.85rem' }}>
              No dish sales data available for this range.
            </div>
          ) : (
            <div className={styles.topDishesList}>
              {topDishes.map((dish, i) => (
                <div key={dish.name} className={styles.dishRow}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className={styles.dishRank}>#{i + 1}</div>
                    <div>
                      <div className={styles.dishName}>{dish.name}</div>
                      <div className={styles.dishMeta}>{dish.count} orders sold</div>
                    </div>
                  </div>
                  <div className={styles.dishRevenue}>
                    ₹{dish.revenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order History & Details Section */}
      {(() => {
        const uniqueTables = Array.from(new Set(orders.map(o => o.tableNumber).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
        const q = orderSearch.toLowerCase();
        const displayedOrders = completedOrders.filter(ord => {
          const matchesSearch = q ? (
            (ord.orderNumber && String(ord.orderNumber).toLowerCase().includes(q)) ||
            (ord._id && ord._id.toLowerCase().includes(q)) ||
            (ord.customerName && ord.customerName.toLowerCase().includes(q)) ||
            (ord.customerPhone && ord.customerPhone.includes(q)) ||
            ((ord.items || []).some(it => (it.name || it.item?.name || '').toLowerCase().includes(q)))
          ) : true;

          const matchesTable = tableFilter !== 'all' ? (String(ord.tableNumber) === String(tableFilter)) : true;
          return matchesSearch && matchesTable;
        });

        return (
          <div className={styles.chartCard} style={{ marginTop: '1.5rem' }}>
            <div className={styles.chartCardHeader} style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Order History & Financial Details
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Showing {displayedOrders.length} settled orders
                </span>
              </div>

              {/* Search & Table Filter Controls */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search by order #, guest, phone..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    style={{
                      padding: '6px 10px 6px 28px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8rem',
                      outline: 'none',
                      width: '210px'
                    }}
                  />
                  {orderSearch && (
                    <button
                      type="button"
                      onClick={() => setOrderSearch('')}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    fontWeight: 600
                  }}
                >
                  <option value="all">All Tables</option>
                  {uniqueTables.map(tNum => (
                    <option key={tNum} value={tNum}>Table {tNum}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table className={styles.recentOrdersTable}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Table / Channel</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Items Summary</th>
                    <th>Payment Mode</th>
                    <th>Date & Time</th>
                    <th style={{ textAlign: 'right' }}>Final Amount</th>
                    <th style={{ textAlign: 'center' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        No orders match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    displayedOrders.slice(0, 50).map((ord, idx) => {
                      const isVerified = ord.isPhoneVerified || ord.customerDetails?.isPhoneVerified;
                      const orderNum = ord.orderNumber || (ord._id ? ord._id.slice(-6).toUpperCase() : `ORD-${idx + 1}`);
                      const displayAmount = getOrderAmount(ord);

                      return (
                        <tr key={ord._id || idx}>
                          <td style={{ fontWeight: 800, color: '#4f46e5' }}>
                            #{orderNum}
                          </td>
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            {ord.tableNumber ? `Table ${ord.tableNumber}` : 'Takeaway / POS'}
                            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                              {ord.source || (ord.tableNumber ? 'Table QR Code' : 'Staff / Waiter')}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{ord.customerName || ord.customerDetails?.name || 'Walk-in Guest'}</div>
                            {(ord.customerPhone || ord.customerDetails?.phone) && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {ord.customerPhone || ord.customerDetails?.phone}
                              </div>
                            )}
                          </td>
                          <td>
                            {isVerified ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700 }}>
                                <CheckCircle2 size={11} /> Verified
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 600 }}>
                                Standard
                              </span>
                            )}
                          </td>
                          <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {(ord.items || []).map(it => `${it.quantity}x ${it.name || it.item?.name}`).join(', ')}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: ord.paymentMethod === 'Cash' ? '#ecfdf5' : '#eff6ff',
                              color: ord.paymentMethod === 'Cash' ? '#059669' : '#2563eb'
                            }}>
                              {ord.paymentMethod || 'Cash'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {new Date(ord.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            ₹{displayAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(ord)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#334155',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Order Details & Bill Reprint Modal */}
            <AnimatePresence>
              {selectedOrder && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 99999,
                  padding: '1rem'
                }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '16px',
                      maxWidth: '560px',
                      width: '100%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      padding: '1.5rem',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
                    }}
                  >
                    {/* Modal Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                          Order #{selectedOrder.orderNumber || selectedOrder._id?.slice(-6).toUpperCase()}
                        </h3>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                          {new Date(selectedOrder.createdAt).toLocaleString()} • Table {selectedOrder.tableNumber || 'Takeaway'} ({selectedOrder.orderType || 'Dine-in'})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Customer & Service Metadata */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Guest Name: </span>
                        <strong>{selectedOrder.customerName || selectedOrder.customerDetails?.name || 'Walk-in Guest'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Phone: </span>
                        <strong>{selectedOrder.customerPhone || selectedOrder.customerDetails?.phone || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Verification: </span>
                        <strong style={{ color: (selectedOrder.isPhoneVerified || selectedOrder.customerDetails?.isPhoneVerified) ? '#16a34a' : '#64748b' }}>
                          {(selectedOrder.isPhoneVerified || selectedOrder.customerDetails?.isPhoneVerified) ? 'Verified' : 'Unverified'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Source: </span>
                        <strong>{selectedOrder.source || (selectedOrder.tableNumber ? 'Table QR Code' : 'Staff / Waiter POS')}</strong>
                      </div>
                    </div>

                    {/* Item Breakdown */}
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      Item Breakdown ({selectedOrder.items?.length || 0})
                    </h4>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                          <tr>
                            <th style={{ padding: '6px 10px', textAlign: 'left' }}>Item</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '6px 10px', textAlign: 'right' }}>Price</th>
                            <th style={{ padding: '6px 10px', textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedOrder.items || []).map((it, idx) => {
                            const varLabel = it.variant ? (typeof it.variant === 'object' ? it.variant.name : String(it.variant)) : '';
                            const addonsLabel = Array.isArray(it.addons) ? it.addons.map(a => a.name).join(', ') : '';
                            const notes = it.specialNotes || it.notes;
                            const itemPrice = Number(it.price) || 0;
                            const qty = Number(it.quantity) || 1;

                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 10px' }}>
                                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{it.name || it.item?.name}</div>
                                  {varLabel && <div style={{ fontSize: '0.7rem', color: '#4f46e5' }}>Size: {varLabel}</div>}
                                  {addonsLabel && <div style={{ fontSize: '0.7rem', color: '#059669' }}>Add-ons: {addonsLabel}</div>}
                                  {notes && <div style={{ fontSize: '0.7rem', color: '#ea580c', fontStyle: 'italic' }}>Note: {notes}</div>}
                                </td>
                                <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800 }}>{qty}</td>
                                <td style={{ padding: '6px 10px', textAlign: 'right' }}>₹{itemPrice}</td>
                                <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 800 }}>₹{itemPrice * qty}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Financials & Settlement */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ color: '#64748b' }}>Original Bill Total:</span>
                        <span>₹{selectedOrder.totalAmount || selectedOrder.total || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ color: '#64748b' }}>Payment Method:</span>
                        <strong>{selectedOrder.paymentMethod || 'Cash'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span style={{ color: '#64748b' }}>Payment Status:</span>
                        <strong style={{ color: '#16a34a', textTransform: 'capitalize' }}>{selectedOrder.paymentStatus || 'paid'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 0', marginTop: '4px', borderTop: '1px solid #e2e8f0', fontWeight: 900, fontSize: '0.92rem', color: '#0f172a' }}>
                        <span>Final Settled Amount:</span>
                        <span style={{ color: '#e05c5c' }}>₹{selectedOrder.settledAmount || selectedOrder.finalAmount || selectedOrder.totalAmount || selectedOrder.total || 0}</span>
                      </div>
                    </div>

                    {/* Action: Reprint Bill */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          toast.success('Reprinting bill...');
                          window.print();
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#0f172a',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Printer size={15} /> Reprint Bill
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#f1f5f9',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      })()}
    </div>
  );
}
