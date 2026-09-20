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
  BookOpen
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';
import styles from './ReportsSuite.module.css';

export default function ReportsSuite() {
  const [orders, setOrders] = useState([]);
  const [khataRecords, setKhataRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all'); // 'today', '7d', '30d', 'all'

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

  // Calculate metrics
  const completedOrders = filteredOrders.filter(o => o.status === 'completed');
  const totalGrossRevenue = completedOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
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
    const amt = ord.totalAmount || 0;
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
    .filter(k => k.status === 'pending' || k.status === 'partial')
    .reduce((acc, k) => acc + (k.remainingAmount || 0), 0);

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

      {/* Recent Settled Orders Table */}
      <div className={styles.chartCard}>
        <div className={styles.chartCardHeader}>
          <h3>Recent Settled Transactions</h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Latest 10 bills</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className={styles.recentOrdersTable}>
            <thead>
              <tr>
                <th>Table / Channel</th>
                <th>Customer</th>
                <th>Items Summary</th>
                <th>Payment Mode</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {completedOrders.slice(0, 10).map((ord) => (
                <tr key={ord._id}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    {ord.tableNumber ? `Table ${ord.tableNumber}` : 'Takeaway / POS'}
                  </td>
                  <td>
                    <div>{ord.customerName || 'Walk-in Guest'}</div>
                    {ord.customerPhone && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ord.customerPhone}</div>}
                  </td>
                  <td style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(ord.items || []).map(it => `${it.quantity}x ${it.name || it.item?.name}`).join(', ')}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
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
                    ₹{ord.totalAmount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
