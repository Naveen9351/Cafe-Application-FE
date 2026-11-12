/**
 * DineviQ OS - Day-End Z-Report & Cash Settlement Printer
 * Formatted for 80mm/58mm thermal slip receipt printers and A4 audit sheets.
 */

export const printDayCloseZReport = (reportData, format = 'thermal') => {
  if (!reportData) return;

  const {
    restaurantName = 'DINEVIQ CAFE & BISTRO',
    restaurantAddress = 'Jaipur, Rajasthan',
    restaurantPhone = '',
    gstin = '',
    reportDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    cashierName = 'Manager / Admin',
    openingFloat = 0,
    cashSales = 0,
    upiSales = 0,
    cardSales = 0,
    khataCredit = 0,
    khataRecovered = 0,
    expectedCash = 0,
    actualCash = 0,
    cashVariance = 0,
    grossRevenue = 0,
    netSales = 0,
    taxAmount = 0,
    discountAmount = 0,
    totalOrders = 0,
    cancelledOrders = 0,
    avgTicketSize = 0,
    categoryBreakdown = [],
    notes = ''
  } = reportData;

  const printTimeStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const varianceStatus = cashVariance === 0 
    ? 'BALANCED (₹0)' 
    : cashVariance > 0 
      ? `EXCESS (+₹${cashVariance.toLocaleString('en-IN')})` 
      : `SHORT (-₹${Math.abs(cashVariance).toLocaleString('en-IN')})`;

  const varianceColor = cashVariance === 0 ? '#16a34a' : cashVariance > 0 ? '#ca8a04' : '#dc2626';

  const isThermal = format === 'thermal';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Z-Report - ${reportDate} - ${restaurantName}</title>
      <style>
        @page {
          size: ${isThermal ? '80mm auto' : 'A4 portrait'};
          margin: ${isThermal ? '4mm' : '15mm'};
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: ${isThermal ? '"Courier New", Courier, monospace' : '"Inter", system-ui, -apple-system, sans-serif'};
          font-size: ${isThermal ? '12px' : '13px'};
          line-height: ${isThermal ? '1.35' : '1.5'};
          color: #0f172a;
          background: #ffffff;
          padding: ${isThermal ? '6px' : '20px'};
          max-width: ${isThermal ? '320px' : '800px'};
          margin: 0 auto;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .divider-double {
          border-top: 2px dashed #000;
          margin: 8px 0;
        }
        .divider-single {
          border-top: 1px dashed #64748b;
          margin: 6px 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }
        .section-header {
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin: 6px 0 3px 0;
          font-size: ${isThermal ? '11px' : '12px'};
          color: #0f172a;
        }
        .variance-box {
          border: 1px dashed #0f172a;
          padding: 6px 8px;
          margin: 6px 0;
          background-color: #f8fafc;
          border-radius: 4px;
        }
        .signature-grid {
          display: flex;
          justify-content: space-between;
          margin-top: ${isThermal ? '20px' : '40px'};
          padding-top: 10px;
        }
        .signature-line {
          width: 45%;
          border-top: 1px solid #000;
          text-align: center;
          font-size: 11px;
          padding-top: 4px;
        }
        .footer {
          margin-top: 14px;
          text-align: center;
          font-size: 10px;
          color: #475569;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 4px 0;
        }
        th, td {
          padding: 3px 0;
          font-size: ${isThermal ? '11px' : '12px'};
        }
        th { border-bottom: 1px dashed #000; text-align: left; }
      </style>
    </head>
    <body>
      <div class="text-center">
        <h2 style="font-size: ${isThermal ? '16px' : '22px'}; font-weight: 900; letter-spacing: 0.5px;">${restaurantName}</h2>
        ${restaurantAddress ? `<div style="font-size: 11px; color: #334155;">${restaurantAddress}</div>` : ''}
        ${restaurantPhone ? `<div style="font-size: 11px; color: #334155;">Tel: ${restaurantPhone}</div>` : ''}
        ${gstin ? `<div style="font-size: 10px; color: #475569;">GSTIN: ${gstin}</div>` : ''}
      </div>

      <div class="divider-double"></div>

      <div class="text-center">
        <div style="font-size: ${isThermal ? '13px' : '16px'}; font-weight: 800; letter-spacing: 1px;">DAILY Z-REPORT / SHIFT CLOSE</div>
        <div style="font-size: 10px; color: #64748b;">OFFICIAL FINANCIAL END-OF-DAY AUDIT</div>
      </div>

      <div class="divider-single"></div>

      <div class="row">
        <span>Report Date:</span>
        <span class="font-bold">${reportDate}</span>
      </div>
      <div class="row">
        <span>Printed At:</span>
        <span>${printTimeStr}</span>
      </div>
      <div class="row">
        <span>Terminal / Shift:</span>
        <span>MAIN COUNTER POS</span>
      </div>
      <div class="row">
        <span>Audited By:</span>
        <span class="font-bold">${cashierName}</span>
      </div>

      <div class="divider-single"></div>
      <div class="section-header">-- FINANCIAL REVENUE --</div>

      <div class="row">
        <span>Gross Billed Sales:</span>
        <span class="font-bold">₹${grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${discountAmount > 0 ? `
      <div class="row">
        <span>Discounts Allowed:</span>
        <span>-₹${discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      <div class="row">
        <span>Net Sales (Excl. Tax):</span>
        <span>₹${netSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="row">
        <span>Total Tax (GST):</span>
        <span>₹${taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="row" style="font-size: ${isThermal ? '13px' : '15px'}; font-weight: 800; border-top: 1px dashed #000; padding-top: 4px; margin-top: 2px;">
        <span>TOTAL SETTLED SALES:</span>
        <span>₹${grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>

      <div class="divider-single"></div>
      <div class="section-header">-- TENDER & PAYMENT MODES --</div>

      <div class="row">
        <span>Cash in Drawer:</span>
        <span class="font-bold">₹${cashSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="row">
        <span>UPI / QR Settlements:</span>
        <span class="font-bold">₹${upiSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="row">
        <span>Debit / Credit Cards:</span>
        <span class="font-bold">₹${cardSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="row">
        <span>Customer Khata Extended:</span>
        <span>₹${khataCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${khataRecovered > 0 ? `
      <div class="row">
        <span>Khata Cash Recovered:</span>
        <span class="font-bold" style="color: #16a34a;">+₹${khataRecovered.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}

      <div class="divider-single"></div>
      <div class="section-header">-- CASH REGISTER RECONCILIATION --</div>

      <div class="row">
        <span>Opening Float (Cash):</span>
        <span>₹${openingFloat.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="row">
        <span>(+) Cash Sales Collected:</span>
        <span>+₹${cashSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      ${khataRecovered > 0 ? `
      <div class="row">
        <span>(+) Khata Cash Settled:</span>
        <span>+₹${khataRecovered.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>` : ''}
      <div class="row font-bold" style="border-top: 1px dashed #64748b; padding-top: 2px;">
        <span>(=) Expected Cash in Drawer:</span>
        <span>₹${expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="row font-bold">
        <span>Actual Counted Cash:</span>
        <span>₹${actualCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
      </div>

      <div class="variance-box">
        <div class="row font-bold" style="color: ${varianceColor}; font-size: ${isThermal ? '12px' : '13px'};">
          <span>VARIANCE STATUS:</span>
          <span>${varianceStatus}</span>
        </div>
      </div>

      <div class="divider-single"></div>
      <div class="section-header">-- ORDER AUDIT METRICS --</div>

      <div class="row">
        <span>Total Settled Orders:</span>
        <span class="font-bold">${totalOrders}</span>
      </div>
      <div class="row">
        <span>Average Order Value:</span>
        <span>₹${avgTicketSize.toLocaleString('en-IN')}</span>
      </div>
      <div class="row">
        <span>Void / Cancelled Orders:</span>
        <span>${cancelledOrders}</span>
      </div>

      ${categoryBreakdown && categoryBreakdown.length > 0 ? `
      <div class="divider-single"></div>
      <div class="section-header">-- CATEGORY SALES CONTRIBUTION --</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Sales</th>
          </tr>
        </thead>
        <tbody>
          ${categoryBreakdown.slice(0, 8).map(c => `
            <tr>
              <td>${c.name}</td>
              <td class="text-center">${c.qty}</td>
              <td class="text-right font-bold">₹${c.revenue.toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      ${notes ? `
      <div class="divider-single"></div>
      <div style="font-size: 10px; color: #334155; margin: 4px 0;">
        <strong>Manager Notes:</strong> ${notes}
      </div>` : ''}

      <div class="divider-double"></div>

      <div class="signature-grid">
        <div class="signature-line">Cashier Signature</div>
        <div class="signature-line">Manager Signature</div>
      </div>

      <div class="footer">
        <div>*** Powered by DineviQ OS ***</div>
        <div>Autonomous Restaurant & Khata Cloud Management</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', isThermal ? 'width=420,height=750' : 'width=850,height=900');
  if (!printWindow) {
    alert('Please allow popups to print the Day-End Z-Report.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

