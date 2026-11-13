/**
 * SERVIQ Cafe OS - WhatsApp E-Bill & Digital Invoice Dispatcher
 * Formats a clean, high-conversion WhatsApp digital invoice with items breakdown,
 * taxes, discount, payment status, and 1-click wa.me dispatch link.
 */

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

export const openWhatsappBill = (order, tenantInfo = null, overridePhone = '') => {
  const url = getWhatsappBillUrl(order, tenantInfo, overridePhone);
  if (url && url !== '#') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  return false;
};

