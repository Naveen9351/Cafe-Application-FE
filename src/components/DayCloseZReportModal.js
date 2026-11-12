import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import styles from './DayCloseZReportModal.module.css';
import { printDayCloseZReport } from '../utils/zReportPrinter';

export default function DayCloseZReportModal({
  isOpen,
  onClose,
  allOrders = [],
  khataRecords = [],
  tenantInfo = null,
  categoriesData = []
}) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [openingFloat, setOpeningFloat] = useState(1000);
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');

  // Filter orders for the selected date
  const dayOrders = useMemo(() => {
    return allOrders.filter(ord => {
      if (!ord.createdAt) return false;
      const dStr = new Date(ord.createdAt).toISOString().slice(0, 10);
      return dStr === selectedDate;
    });
  }, [allOrders, selectedDate]);

  // Robust order amount resolver
  const getOrderAmount = (ord) => {
    if (!ord) return 0;
    const val = Number(ord.settledAmount || ord.finalAmount || ord.total || ord.totalAmount || ord.subTotal);
    if (!isNaN(val) && val > 0) return val;
    if (Array.isArray(ord.items) && ord.items.length > 0) {
      return ord.items.reduce((sum, it) => sum + ((Number(it.price) || 0) * (Number(it.quantity) || 1)), 0);
    }
    return 0;
  };

  const completedOrders = useMemo(() => {
    return dayOrders.filter(o => o.status === 'completed');
  }, [dayOrders]);

  const cancelledOrdersCount = useMemo(() => {
    return dayOrders.filter(o => o.status === 'cancelled').length;
  }, [dayOrders]);

  // Financial aggregates
  const financials = useMemo(() => {
    let gross = 0;
    let net = 0;
    let tax = 0;
    let cash = 0;
    let upi = 0;
    let card = 0;
    let khata = 0;

    completedOrders.forEach(ord => {
      const amt = getOrderAmount(ord);
      gross += amt;
      tax += Number(ord.taxAmount || 0);
      net += Number(ord.subTotal || (amt - (Number(ord.taxAmount) || 0)));

      const method = (ord.paymentMethod || 'Cash').toLowerCase();
      if (method.includes('upi') || method.includes('gpay')) {
        upi += amt;
      } else if (method.includes('card')) {
        card += amt;
      } else if (method.includes('khata') || method.includes('borrow')) {
        khata += amt;
      } else {
        cash += amt;
      }
    });

    // Check khata settlements on this date
    let khataRecovered = 0;
    khataRecords.forEach(k => {
      if (k.transactions && Array.isArray(k.transactions)) {
        k.transactions.forEach(t => {
          if (t.type === 'settle' || t.type === 'payment') {
            const tDate = t.date ? new Date(t.date).toISOString().slice(0, 10) : '';
            if (tDate === selectedDate) {
              khataRecovered += Number(t.amount || 0);
            }
          }
        });
      }
    });

    const expectedCashInDrawer = Number(openingFloat || 0) + cash + khataRecovered;
    const actualCashNum = actualCash !== '' ? Number(actualCash) : expectedCashInDrawer;
    const variance = actualCashNum - expectedCashInDrawer;

    return {
      gross,
      net: net > 0 ? net : gross - tax,
      tax,
      cash,
      upi,
      card,
      khata,
      khataRecovered,
      expectedCashInDrawer,
      actualCashNum,
      variance,
      totalOrders: completedOrders.length,
      avgTicket: completedOrders.length > 0 ? Math.round(gross / completedOrders.length) : 0
    };
  }, [completedOrders, openingFloat, actualCash, khataRecords, selectedDate]);

  if (!isOpen) return null;

  const currentVariance = actualCash !== '' 
    ? (Number(actualCash) - financials.expectedCashInDrawer) 
    : 0;

  const handlePrintThermal = () => {
    const reportData = {
      restaurantName: tenantInfo?.businessName || tenantInfo?.name || 'DINEVIQ CAFE & BISTRO',
      restaurantAddress: tenantInfo?.address || tenantInfo?.settings?.address || 'Jaipur, Rajasthan',
      restaurantPhone: tenantInfo?.phone || tenantInfo?.settings?.phone || '',
      gstin: tenantInfo?.gstin || tenantInfo?.settings?.gstin || '',
      reportDate: new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      cashierName: JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Manager / Cashier',
      openingFloat: Number(openingFloat || 0),
      cashSales: financials.cash,
      upiSales: financials.upi,
      cardSales: financials.card,
      khataCredit: financials.khata,
      khataRecovered: financials.khataRecovered,
      expectedCash: financials.expectedCashInDrawer,
      actualCash: actualCash !== '' ? Number(actualCash) : financials.expectedCashInDrawer,
      cashVariance: currentVariance,
      grossRevenue: financials.gross,
      netSales: financials.net,
      taxAmount: financials.tax,
      totalOrders: financials.totalOrders,
      cancelledOrders: cancelledOrdersCount,
      avgTicketSize: financials.avgTicket,
      categoryBreakdown: categoriesData,
      notes: notes.trim()
    };
    printDayCloseZReport(reportData, 'thermal');
  };

  const handlePrintA4 = () => {
    const reportData = {
      restaurantName: tenantInfo?.businessName || tenantInfo?.name || 'DINEVIQ CAFE & BISTRO',
      restaurantAddress: tenantInfo?.address || tenantInfo?.settings?.address || 'Jaipur, Rajasthan',
      restaurantPhone: tenantInfo?.phone || tenantInfo?.settings?.phone || '',
      gstin: tenantInfo?.gstin || tenantInfo?.settings?.gstin || '',
      reportDate: new Date(selectedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      cashierName: JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Manager / Cashier',
      openingFloat: Number(openingFloat || 0),
      cashSales: financials.cash,
      upiSales: financials.upi,
      cardSales: financials.card,
      khataCredit: financials.khata,
      khataRecovered: financials.khataRecovered,
      expectedCash: financials.expectedCashInDrawer,
      actualCash: actualCash !== '' ? Number(actualCash) : financials.expectedCashInDrawer,
      cashVariance: currentVariance,
      grossRevenue: financials.gross,
      netSales: financials.net,
      taxAmount: financials.tax,
      totalOrders: financials.totalOrders,
      cancelledOrders: cancelledOrdersCount,
      avgTicketSize: financials.avgTicket,
      categoryBreakdown: categoriesData,
      notes: notes.trim()
    };
    printDayCloseZReport(reportData, 'a4');
  };

  const handleExportExcel = () => {
    try {
      const summaryRows = [
        ['DINEVIQ OS - DAILY DAY CLOSE Z-REPORT', ''],
        ['Restaurant', tenantInfo?.name || 'DineviQ Cafe'],
        ['Report Date', selectedDate],
        ['Audited By', JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Manager'],
        ['Generated At', new Date().toLocaleString()],
        ['', ''],
        ['FINANCIAL SUMMARY', 'AMOUNT (INR)'],
        ['Gross Sales', financials.gross],
        ['Net Sales (Pre-Tax)', financials.net],
        ['Total GST / Tax', financials.tax],
        ['Total Settled Orders', financials.totalOrders],
        ['Average Ticket Size', financials.avgTicket],
        ['Cancelled Orders', cancelledOrdersCount],
        ['', ''],
        ['TENDER SUMMARY', 'AMOUNT (INR)'],
        ['Cash in Register', financials.cash],
        ['UPI / Dynamic QR', financials.upi],
        ['Credit / Debit Cards', financials.card],
        ['Customer Khata Credit Extended', financials.khata],
        ['Khata Cash Recovered', financials.khataRecovered],
        ['', ''],
        ['CASH DRAWER RECONCILIATION', 'AMOUNT (INR)'],
        ['Opening Cash Float', Number(openingFloat || 0)],
        ['(+) Cash Sales Collected', financials.cash],
        ['(+) Khata Cash Recovered', financials.khataRecovered],
        ['(=) Expected Cash in Drawer', financials.expectedCashInDrawer],
        ['Actual Counted Cash', actualCash !== '' ? Number(actualCash) : financials.expectedCashInDrawer],
        ['Cash Variance', currentVariance],
        ['Variance Status', currentVariance === 0 ? 'Balanced' : currentVariance > 0 ? 'Excess' : 'Shortage'],
        ['', ''],
        ['Manager Notes', notes || 'No remarks recorded.']
      ];

      const ordersRows = [
        ['Order #', 'Table/Channel', 'Customer', 'Phone', 'Items Summary', 'Payment Mode', 'Time', 'Amount (INR)']
      ];

      completedOrders.forEach(o => {
        ordersRows.push([
          o.orderNumber || (o._id ? o._id.slice(-6).toUpperCase() : 'ORD'),
          o.tableNumber ? `Table ${o.tableNumber}` : 'Takeaway / POS',
          o.customerName || o.customerDetails?.name || 'Guest',
          o.customerPhone || o.customerDetails?.phone || '',
          (o.items || []).map(i => `${i.quantity}x ${i.name || i.item?.name}`).join(', '),
          o.paymentMethod || 'Cash',
          new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          getOrderAmount(o)
        ]);
      });

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      const wsOrders = XLSX.utils.aoa_to_sheet(ordersRows);

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Z-Report Summary');
      XLSX.utils.book_append_sheet(wb, wsOrders, 'Day Orders Ledger');

      XLSX.writeFile(wb, `Z_Report_${selectedDate}.xlsx`);
      toast.success('Day Close Z-Report exported to Excel successfully!');
    } catch (err) {
      console.error('Z-Report Excel Export Error:', err);
      toast.error('Failed to export Z-report to Excel.');
    }
  };

  const getQuickYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return y.toISOString().slice(0, 10);
  };

  return (
    <div className={styles.overlay}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={styles.modal}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.titleArea}>
            <h3>
              <Receipt size={20} color="#2563eb" />
              Day-End Z-Report & Cash Drawer Reconciliation
            </h3>
            <p>
              Official end-of-day register closure, financial tender audit, and thermal slip printing
            </p>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Date Selector Bar */}
          <div className={styles.dateBar}>
            <div className={styles.dateInputGroup}>
              <Calendar size={16} color="#64748b" />
              <span>Shift Audit Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.dateInput}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`${styles.quickDayBtn} ${selectedDate === todayStr ? styles.quickDayBtnActive : ''}`}
                onClick={() => setSelectedDate(todayStr)}
              >
                Today
              </button>
              <button
                type="button"
                className={`${styles.quickDayBtn} ${selectedDate === getQuickYesterday() ? styles.quickDayBtnActive : ''}`}
                onClick={() => setSelectedDate(getQuickYesterday())}
              >
                Yesterday
              </button>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.cardLabel}>Total Gross Sales</div>
              <div className={styles.cardValue}>₹{financials.gross.toLocaleString('en-IN')}</div>
              <div className={styles.cardSubtitle}>From {financials.totalOrders} Settled Orders</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardLabel}>Net Sales (Pre-Tax)</div>
              <div className={styles.cardValue}>₹{financials.net.toLocaleString('en-IN')}</div>
              <div className={styles.cardSubtitle}>GST: ₹{financials.tax.toLocaleString('en-IN')}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.cardLabel}>Average Order Value</div>
              <div className={styles.cardValue}>₹{financials.avgTicket.toLocaleString('en-IN')}</div>
              <div className={styles.cardSubtitle}>{cancelledOrdersCount} Cancelled / Void</div>
            </div>
          </div>

          {/* Tender Breakdown */}
          <div className={styles.tenderSection}>
            <div className={styles.sectionHeading}>
              <Layers size={14} />
              Tender & Payment Collections
            </div>
            <div className={styles.tenderPillsGrid}>
              <div className={styles.tenderPill}>
                <div className={styles.tenderPillLabel}>💵 Cash Sales</div>
                <div className={styles.tenderPillAmt}>₹{financials.cash.toLocaleString('en-IN')}</div>
              </div>
              <div className={styles.tenderPill}>
                <div className={styles.tenderPillLabel}>📱 UPI / Dynamic QR</div>
                <div className={styles.tenderPillAmt} style={{ color: '#2563eb' }}>
                  ₹{financials.upi.toLocaleString('en-IN')}
                </div>
              </div>
              <div className={styles.tenderPill}>
                <div className={styles.tenderPillLabel}>💳 Cards</div>
                <div className={styles.tenderPillAmt} style={{ color: '#8b5cf6' }}>
                  ₹{financials.card.toLocaleString('en-IN')}
                </div>
              </div>
              <div className={styles.tenderPill}>
                <div className={styles.tenderPillLabel}>📖 Khata Extended</div>
                <div className={styles.tenderPillAmt} style={{ color: '#d97706' }}>
                  ₹{financials.khata.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Cash Drawer Reconciliation */}
          <div className={styles.reconciliationBox}>
            <div className={styles.sectionHeading} style={{ color: '#0f172a' }}>
              <Coins size={14} color="#16a34a" />
              Cash Drawer Physical Count & Variance
            </div>

            <div className={styles.reconGrid}>
              <div className={styles.reconInputGroup}>
                <label>Opening Cash Float (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
                  className={styles.reconInput}
                  placeholder="e.g. 1000"
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Base cash placed in register at morning start
                </span>
              </div>

              <div className={styles.reconInputGroup}>
                <label>Actual Counted Cash in Register (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className={styles.reconInput}
                  placeholder={`Expected: ₹${financials.expectedCashInDrawer}`}
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Physical physical notes & coins counted right now
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '6px 0', borderTop: '1px dashed #e2e8f0', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>
                Float (₹{openingFloat}) + Cash Sales (₹{financials.cash}) {financials.khataRecovered > 0 ? `+ Khata Settled (₹${financials.khataRecovered})` : ''} =
              </span>
              <strong style={{ color: '#0f172a' }}>
                Expected Cash: ₹{financials.expectedCashInDrawer.toLocaleString('en-IN')}
              </strong>
            </div>

            {/* Variance Banner */}
            <div className={`${styles.varianceBanner} ${currentVariance === 0 ? styles.varianceBalanced : currentVariance > 0 ? styles.varianceExcess : styles.varianceShort}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {currentVariance === 0 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>
                  {currentVariance === 0
                    ? 'Cash Drawer Perfectly Balanced (₹0 Variance)'
                    : currentVariance > 0
                      ? `Cash Excess: +₹${currentVariance.toLocaleString('en-IN')}`
                      : `Cash Shortage: -₹${Math.abs(currentVariance).toLocaleString('en-IN')}`}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                {currentVariance === 0 ? 'Verified' : 'Audit Required'}
              </span>
            </div>

            {/* Manager Remarks */}
            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                Shift Close Remarks / Variance Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. ₹50 tip kept by cashier, petty cash for milk ₹120..."
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Close
          </button>
          <div className={styles.btnGroup}>
            <button
              type="button"
              onClick={handleExportExcel}
              className={styles.secondaryPrintBtn}
              style={{ color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5' }}
            >
              <FileSpreadsheet size={15} />
              Export Excel
            </button>
            <button
              type="button"
              onClick={handlePrintA4}
              className={styles.secondaryPrintBtn}
            >
              <Printer size={15} />
              Print A4 Audit
            </button>
            <button
              type="button"
              onClick={handlePrintThermal}
              className={styles.primaryPrintBtn}
            >
              <Printer size={15} />
              Print 80mm Thermal Slip
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
