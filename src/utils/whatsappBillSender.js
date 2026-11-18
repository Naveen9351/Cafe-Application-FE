/**
 * SERVIQ Cafe OS - WhatsApp E-Bill & Digital Invoice Dispatcher
 * Formats a clean, high-conversion WhatsApp digital invoice with items breakdown,
 * taxes, discount, payment status, and background dispatch via server-linked WhatsApp.
 */

import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';

export const generateWhatsappBillText = (order, tenantInfo = null) => {
  if (!order) return '';

  const cafeName = tenantInfo?.name || 'DINEVIQ CAFE & BISTRO';
  const gstin = tenantInfo?.gstNumber || '';
  const orderNum = order.orderNumber || order._id?.slice(-5) || 'ORD';
  const rawTable = order.tableNumber || order.table || 'Counter Walk-in';
  const table = (!rawTable || rawTable === 'Counter Walk-in' || String(rawTable).toLowerCase() === 'walk-in')
    ? 'Counter Walk-in'
    : `T ${String(rawTable).replace(/^table[\s-_]*/i, '').replace(/^t\s+/i, '').trim()}`;
  const channel = (order.orderType || order.channel || 'dine-in').toUpperCase();
  
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : new Date().toLocaleString('en-IN');

  const custName = order.customerName || order.customerDetails?.name || 'Valued Guest';

  const subtotal = Number(
    order.subTotal ||
    order.subtotal ||
    (order.items || []).reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0) ||
    order.total ||
    0
  );
  const tax = Number(order.taxAmount || 0);
  const discount = Number(order.discountAmount || 0);
  const total = Number(order.totalAmount || order.finalAmount || order.total || (subtotal + tax - discount));
  const payMethod = (order.paymentMethod || 'Cash').toUpperCase();
  const payStatus = (order.paymentStatus || 'Paid').toUpperCase();

  const itemsList = (order.items || []).map(it => {
    const qty = Number(it.quantity) || 1;
    const price = Number(it.price || it.item?.price || 0);
    const itemTotal = qty * price;
    const itemName = it.name || it.item?.name || 'Dish Item';
    const variantStr = it.variant?.name ? ` (${it.variant.name})` : '';
    return `• ${qty}x ${itemName}${variantStr} - ₹${itemTotal}`;
  }).join('\n');

  let text = `🧾 *TAX INVOICE / E-BILL*\n`;
  text += `*${cafeName.toUpperCase()}*\n`;
  if (gstin) text += `GSTIN: ${gstin}\n`;
  text += `──────────────────────\n`;
  text += `*Order #:* ${orderNum}\n`;
  text += `*Date:* ${dateStr}\n`;
  text += `*Table / Type:* ${table} (${channel})\n`;
  text += `*Guest:* ${custName}\n`;
  text += `──────────────────────\n`;
  text += `*ITEMS ORDERED:*\n${itemsList || '• Order Items'}\n`;
  text += `──────────────────────\n`;
  text += `Subtotal: ₹${subtotal}\n`;
  if (discount > 0) text += `Discount: -₹${discount}\n`;
  if (tax > 0) text += `Taxes & GST: +₹${tax}\n`;
  text += `*GRAND TOTAL: ₹${total}*\n`;
  text += `Payment: ${payMethod} (${payStatus === 'PAID' ? 'PAID ✅' : payStatus})\n`;
  text += `──────────────────────\n`;
  text += `✨ Thank you for dining with us! We hope to welcome you again soon. ☕🍕`;

  return text;
};

export const getWhatsappBillUrl = (order, tenantInfo = null, overridePhone = '') => {
  if (!order) return '#';
  const rawPhone = overridePhone || order.customerPhone || order.customerDetails?.phone || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '');
  const text = generateWhatsappBillText(order, tenantInfo);

  if (cleanPhone && cleanPhone.length >= 10) {
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  }

  // Fallback to general web share if phone is not on file
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

/**
 * Send WhatsApp digital bill directly from the Cafe's linked server device.
 * Dispatches silently in background without opening WhatsApp Web and without cashier login.
 */
export const sendDirectWhatsappBill = async (order, tenantInfo = null, overridePhone = '') => {
  if (!order) {
    toast.error('Order details are missing.');
    return { success: false, error: 'Order details missing' };
  }

  const rawPhone = overridePhone || order.customerPhone || order.customerDetails?.phone || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '');

  if (!cleanPhone || cleanPhone.length < 10) {
    toast.error('Customer phone number is missing or has fewer than 10 digits.');
    return { success: false, error: 'Invalid phone' };
  }

  const toastId = toast.loading('Sending bill via WhatsApp...');

  try {
    const text = generateWhatsappBillText(order, tenantInfo);
    const token = localStorage.getItem('token');
    const tenantId = tenantInfo?._id || order.tenantId;

    const response = await axios.post(
      `${API_URL}/whatsapp/send-bill`,
      {
        orderId: order._id,
        phone: cleanPhone,
        message: text,
        tenantId
      },
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantId ? { 'x-tenant-id': tenantId } : {})
        },
        timeout: 18000
      }
    );

    if (response.data?.success) {
      toast.success(`Bill sent to +${response.data.phone || cleanPhone} via WhatsApp! 📱`, { id: toastId });
      return { success: true, phone: response.data.phone };
    } else {
      throw new Error(response.data?.error || 'Failed to dispatch WhatsApp message');
    }
  } catch (err) {
    const isNotConnected = err.response?.data?.notConnected || err.response?.status === 503;
    const errorMsg = err.response?.data?.error || err.message || 'Error sending WhatsApp bill';

    if (isNotConnected) {
      toast.error('Cafe WhatsApp is not linked yet. Please scan QR in Restaurant Settings.', { id: toastId, duration: 6000 });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('serviq_open_whatsapp_modal', { detail: { tenantInfo } }));
      }
    } else {
      toast.error(errorMsg, { id: toastId });
    }

    return {
      success: false,
      notConnected: isNotConnected,
      error: errorMsg
    };
  }
};

/**
 * Universal dispatcher:
 * Sends silently in the background directly from the cafe's linked server number.
 * No WhatsApp Web login or window open is performed.
 */
export const openWhatsappBill = async (order, tenantInfo = null, overridePhone = '') => {
  let phoneToSend = overridePhone || order?.customerPhone || order?.customerDetails?.phone || '';
  const cleanDigits = String(phoneToSend).replace(/\D/g, '');
  
  if (!cleanDigits || cleanDigits.length < 10) {
    const userInput = window.prompt("Enter your 10-digit WhatsApp number to receive your digital bill:");
    if (!userInput) return false;
    phoneToSend = userInput.replace(/\D/g, '');
    if (!phoneToSend || phoneToSend.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return false;
    }
  }

  const result = await sendDirectWhatsappBill(order, tenantInfo, phoneToSend);
  if (result.success) {
    return true;
  }

  // Only if server WhatsApp is not linked yet, offer fallback so operations aren't blocked
  if (result.notConnected) {
    const fallbackUrl = getWhatsappBillUrl(order, tenantInfo, phoneToSend);
    const confirmFallback = window.confirm(
      "WhatsApp is not linked on the Cafe server yet.\n\n" +
      "Would you like to open WhatsApp Web as a temporary fallback, or cancel and link the Cafe's phone in Restaurant Settings?"
    );
    if (confirmFallback && fallbackUrl && fallbackUrl !== '#') {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      return true;
    }
  }

  return false;
};
