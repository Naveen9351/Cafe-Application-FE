import React, { useState, useEffect } from 'react';
import {
  X, Printer, Download, MessageSquare, CheckCircle, ShieldCheck,
  Receipt, FileText, Share2, Copy
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import styles from './InvoiceModal.module.css';
import { printOrderBill } from '../utils/billPrinter';
import { openWhatsappBill, generateWhatsappBillText } from '../utils/whatsappBillSender';
import { formatTableBadge } from './common/TableBadge';

export default function InvoiceModal({ order, tenantInfo, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!order) return;
    generateOrFetchInvoice();
  }, [order]);

  const generateOrFetchInvoice = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/invoices/generate`,
        { orderId: order._id },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.success && res.data.invoice) {
        setInvoice(res.data.invoice);
      }
    } catch (err) {
      console.warn('Invoice auto-generation failed, falling back to client-calculated invoice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) return null;

  const cafeName = tenantInfo?.name || 'DINEVIQ CAFE & BISTRO';
  const cafeGst = tenantInfo?.gstNumber || invoice?.gstNumber || '08AABCB1234F1Z5';
  const cafeAddress = tenantInfo?.address || 'Main Road, Commercial Plaza, Ground Floor';
  const cafePhone = tenantInfo?.phone || '+91 96801 32562';

  const orderNum = order.orderNumber || order._id?.slice(-5) || 'ORD';
  const invNumber = invoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${orderNum}`;
  const invDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const rawTable = order.tableNumber || order.table || 'Counter Walk-in';
  const table = rawTable === 'Counter Walk-in' || String(rawTable).toLowerCase() === 'walk-in' ? 'Counter Walk-in' : formatTableBadge(rawTable);
  const channel = (order.orderType || order.channel || 'dine-in').toUpperCase();

  const custName = order.customerName || order.customerDetails?.name || 'Guest Diner';
  const custPhone = order.customerPhone || order.customerDetails?.phone || 'Not Provided';

  const subtotal = Number(
    order.subTotal ||
    order.subtotal ||
    (order.items || []).reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0) ||
    order.total ||
    0
  );

  const taxPercentage = tenantInfo?.settings?.taxPercentage ?? 5;
  const taxAmount = Number(order.taxAmount || invoice?.taxAmount || Math.round(subtotal * (taxPercentage / 100)));
  const cgst = Math.round(taxAmount / 2);
  const sgst = taxAmount - cgst;
  const discount = Number(order.discountAmount || 0);
  const grandTotal = Number(order.totalAmount || order.finalAmount || order.total || (subtotal + taxAmount - discount));
  const payMethod = (order.paymentMethod || invoice?.paymentMethod || 'Cash').toUpperCase();
  const payStatus = (order.paymentStatus || 'Paid').toUpperCase();

  const handlePrintA4 = () => {
    window.print();
  };

  const handleThermalPrint = () => {
    printOrderBill(order, cafeName);
  };

  const handleSendWhatsApp = () => {
    const sent = openWhatsappBill(order, tenantInfo);
    if (sent) {
      toast.success('WhatsApp E-Bill opened!');
    } else {
      toast.error('Could not open WhatsApp');
    }
  };

  const handleCopyText = () => {
    const text = generateWhatsappBillText(order, tenantInfo);
    navigator.clipboard.writeText(text);
    toast.success('Invoice details copied to clipboard!');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FileText size={20} color="#2563eb" />
            <span>Tax Invoice / GST Settlement</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Invoice Sheet */}
        <div className={styles.modalBody}>
          <div className={styles.invoicePaper}>
            {/* Header info */}
            <div className={styles.invoiceTop}>
              <div className={styles.brandInfo}>
                <h2>{cafeName}</h2>
                <div className={styles.brandMeta}>
                  <div>{cafeAddress}</div>
                  <div>Phone: {cafePhone}</div>
                  <div>GSTIN: <strong>{cafeGst}</strong></div>
                </div>
              </div>

              <div className={styles.invoiceBadge}>
                <span className={styles.taxInvoiceBadge}>TAX INVOICE</span>
                <div className={styles.invNumber}>{invNumber}</div>
                <div className={styles.invDate}>{invDate}</div>
              </div>
            </div>

            {/* Bill to metadata */}
            <div className={styles.billInfoGrid}>
              <div className={styles.infoCol}>
                <h4>Billed To</h4>
                <p><strong>{custName}</strong></p>
                <p>Mobile: {custPhone}</p>
              </div>
              <div className={styles.infoCol}>
                <h4>Order Details</h4>
                <p>Order #: <strong>#{orderNum}</strong></p>
                <p>Table / Channel: <strong>{table} ({channel})</strong></p>
                <p>Payment: <strong>{payMethod} ({payStatus})</strong></p>
              </div>
            </div>

            {/* Items Table */}
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', width: '45%' }}>Item Description</th>
                  <th style={{ textAlign: 'center', width: '15%' }}>Qty</th>
                  <th style={{ textAlign: 'right', width: '20%' }}>Rate (₹)</th>
                  <th style={{ textAlign: 'right', width: '20%' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((it, idx) => {
                  const qty = Number(it.quantity) || 1;
                  const rate = Number(it.price || it.item?.price || 0);
                  const lineTotal = qty * rate;
                  const name = it.name || it.item?.name || 'Dish Item';
                  const variantStr = it.variant?.name ? ` (${it.variant.name})` : '';

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{name}{variantStr}</td>
                      <td style={{ textAlign: 'center' }}>{qty}</td>
                      <td style={{ textAlign: 'right' }}>₹{rate}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{lineTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className={styles.summarySection}>
              <div className={styles.summaryRow}>
                <span>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className={styles.summaryRow} style={{ color: '#16a34a' }}>
                  <span>Special Discount:</span>
                  <span style={{ fontWeight: 600 }}>-₹{discount}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <>
                  <div className={styles.summaryRow}>
                    <span>CGST ({taxPercentage / 2}%):</span>
                    <span>+₹{cgst}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>SGST ({taxPercentage / 2}%):</span>
                    <span>+₹{sgst}</span>
                  </div>
                </>
              )}
              <div className={styles.grandTotalRow}>
                <span>FINAL INVOICE AMOUNT</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.78rem', color: '#64748b' }}>
              This is a computer-generated official tax invoice. Thank you for dining with {cafeName}!
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className={styles.modalFooter}>
          <button className={`${styles.actionBtn} ${styles.thermalBtn}`} onClick={handleCopyText} type="button">
            <Copy size={15} />
            Copy Details
          </button>

          <div className={styles.actionBtnGroup}>
            <button className={`${styles.actionBtn} ${styles.thermalBtn}`} onClick={handleThermalPrint} type="button">
              <Printer size={15} />
              Thermal Bill (80mm)
            </button>
            <button className={`${styles.actionBtn} ${styles.printBtn}`} onClick={handlePrintA4} type="button">
              <Download size={15} />
              Print / PDF (A4)
            </button>
            <button className={`${styles.actionBtn} ${styles.whatsappBtn}`} onClick={handleSendWhatsApp} type="button">
              <MessageSquare size={15} />
              Send WhatsApp E-Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

