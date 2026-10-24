/**
 * SERVIQ Cafe OS - Professional Thermal Bill & KOT Receipt Printer
 * Opens a dedicated receipt window formatted for 80mm/58mm thermal printers and A4 prints,
 * preventing printing of the application UI / dashboard.
 */

export const printOrderBill = (order, tenantName = 'SERVIQ CAFE & BISTRO') => {
  if (!order) return;

  const orderNum = order.orderNumber || order._id?.slice(-5) || 'ORD';
  const table = order.tableNumber || order.table || 'Counter Walk-in';
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
  const custName = order.customerName || order.customerDetails?.name || 'Guest Diner';
  const custPhone = order.customerPhone || order.customerDetails?.phone || '';

  const subtotal = Number(
    order.subTotal || 
    order.subtotal || 
    (order.items || []).reduce((s, i) => s + ((Number(i.price) || 0) * (Number(i.quantity) || 1)), 0) || 
    order.total || 
    0
  );
  const tax = Number(order.taxAmount || 0);
  const discount = Number(order.discountAmount || 0);
  const total = Number(order.totalAmount || order.finalAmount || order.total || subtotal);
  const payMethod = (order.paymentMethod || 'Cash').toUpperCase();
  const payStatus = (order.paymentStatus || 'Paid').toUpperCase();

  const itemsHtml = (order.items || []).map(it => {
    const qty = Number(it.quantity) || 1;
    const price = Number(it.price || it.item?.price || 0);
    const itemTotal = qty * price;
    const itemName = it.name || it.item?.name || 'Dish';
    const variantStr = it.variant?.name ? ` (${it.variant.name})` : '';

    return `
      <tr>
        <td style="padding: 5px 0; text-align: left; vertical-align: top;">
          <div style="font-weight: 600;">${itemName}${variantStr}</div>
        </td>
        <td style="padding: 5px 0; text-align: center; vertical-align: top;">${qty}</td>
        <td style="padding: 5px 0; text-align: right; vertical-align: top;">₹${price}</td>
        <td style="padding: 5px 0; text-align: right; vertical-align: top; font-weight: 700;">₹${itemTotal}</td>
      </tr>
    `;
  }).join('');

  const printWindow = window.open('', '_blank', 'width=420,height=680');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt_#${orderNum}</title>
        <style>
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            width: 78mm;
            max-width: 100%;
            margin: 0 auto;
            padding: 12px 10px;
            color: #111827;
            background: #ffffff;
            font-size: 11.5px;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .divider { border-top: 1px dashed #9ca3af; margin: 8px 0; }
          .double-divider { border-top: 1.5px solid #111827; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 4px 0; }
          .bold { font-weight: 700; }
          .flex-between { display: flex; justify-content: space-between; align-items: center; margin: 2px 0; }
          .brand-name { font-size: 16px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 2px 0; text-transform: uppercase; }
          .meta-row { display: flex; justify-content: space-between; font-size: 10.5px; color: #374151; margin: 2px 0; }
          @media print {
            body { padding: 4mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="brand-name">${tenantName}</div>
          <div style="font-size: 10px; color: #6b7280; font-weight: 500;">SERVIQ — Autonomous Restaurant OS</div>
          <div class="divider"></div>
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.5px;">TAX INVOICE / SETTLEMENT RECEIPT</div>
          <div style="font-size: 11px; font-weight: 700; margin-top: 2px; color: #1f2937;">Order #${orderNum}</div>
        </div>

        <div class="divider"></div>
        <div class="meta-row">
          <span><strong>Table:</strong> ${table}</span>
          <span><strong>Type:</strong> ${channel}</span>
        </div>
        <div class="meta-row">
          <span><strong>Date:</strong> ${dateStr}</span>
        </div>
        ${custName ? `
          <div class="meta-row">
            <span><strong>Guest:</strong> ${custName}</span>
            ${custPhone ? `<span>${custPhone}</span>` : ''}
          </div>
        ` : ''}
        <div class="divider"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px dashed #9ca3af; font-size: 10.5px; color: #4b5563;">
              <th style="text-align: left; padding-bottom: 4px;">Item</th>
              <th style="text-align: center; padding-bottom: 4px;">Qty</th>
              <th style="text-align: right; padding-bottom: 4px;">Rate</th>
              <th style="text-align: right; padding-bottom: 4px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>
        <div class="flex-between">
          <span style="color: #4b5563;">Items Subtotal:</span>
          <span class="bold">₹${subtotal}</span>
        </div>
        ${discount > 0 ? `
          <div class="flex-between" style="color: #059669;">
            <span>Discount Applied:</span>
            <span>-₹${discount}</span>
          </div>
        ` : ''}
        ${tax > 0 ? `
          <div class="flex-between" style="color: #4b5563;">
            <span>Taxes & GST (5%):</span>
            <span>+₹${tax}</span>
          </div>
        ` : `
          <div class="flex-between" style="font-size: 10px; color: #6b7280;">
            <span>Taxes & Levies:</span>
            <span>₹0 (Inclusive)</span>
          </div>
        `}

        <div class="double-divider"></div>
        <div class="flex-between bold" style="font-size: 14px;">
          <span>FINAL AMOUNT:</span>
          <span style="color: #111827;">₹${total}</span>
        </div>
        <div class="double-divider"></div>

        <div style="font-size: 10.5px; margin: 4px 0;">
          <div class="flex-between">
            <span><strong>Payment Method:</strong></span>
            <span>${payMethod}</span>
          </div>
          <div class="flex-between">
            <span><strong>Payment Status:</strong></span>
            <span style="color: ${payStatus === 'PAID' ? '#059669' : '#dc2626'}; font-weight: 700;">${payStatus}</span>
          </div>
        </div>

        <div class="divider"></div>
        <div class="text-center" style="font-size: 10.5px; color: #4b5563; margin-top: 10px;">
          <p style="margin: 0; font-weight: 600;">Thank you for dining with us!</p>
          <p style="margin: 3px 0 0 0; font-size: 9.5px; color: #6b7280;">Powered by SERVIQ OS</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
