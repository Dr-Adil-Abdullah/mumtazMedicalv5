import { formatCurrency } from './currency';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateReceiptHTML(sale, settings = {}) {
  const currency = settings.currency ?? 'Rs.';
  const itemsRows = (sale.items ?? [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#0f172a;">${escapeHtml(item.name)}</div>
            <div style="font-size:12px;color:#64748b;">${escapeHtml(item.unit || '')} ${item.batchNumber ? `• Batch ${escapeHtml(item.batchNumber)}` : item.batchId ? `• Batch ${escapeHtml(item.batchId)}` : ''}</div>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(item.quantity)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(formatCurrency(item.salePrice, currency))}</td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(
            formatCurrency(Number(item.salePrice) * Number(item.quantity), currency)
          )}</td>
        </tr>
      `
    )
    .join('');

  const dueBlock =
    sale.payment_mode === 'pending'
      ? `
      <div style="margin-top:16px;padding:12px;border-radius:12px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;">
        <div style="font-weight:700;">Pending Bill</div>
        <div style="margin-top:6px;">Balance Owed: ${escapeHtml(formatCurrency(sale.balance_owed, currency))}</div>
        <div>Payback Date: ${escapeHtml(sale.payback_date || 'Not set')}</div>
      </div>
    `
      : '';

  const returnBlock =
    sale.is_return
      ? `
      <div style="margin-top:16px;padding:12px;border-radius:12px;background:#eff6ff;border:1px solid #93c5fd;color:#1d4ed8;">
        <div style="font-weight:700;">Return / Refund Bill</div>
        <div style="margin-top:6px;">Original Bill: ${escapeHtml(sale.original_bill_number || sale.original_sale_id || '')}</div>
        <div>Cash Refund: ${escapeHtml(formatCurrency(sale.refund_cash || sale.return_amount || 0, currency))}</div>
        <div>Pending Reduced: ${escapeHtml(formatCurrency(sale.due_adjustment || 0, currency))}</div>
        ${sale.return_reason ? `<div>Reason: ${escapeHtml(sale.return_reason)}</div>` : ''}
        <div>Approval: ${escapeHtml(String(sale.approval_status || 'pending').toUpperCase())}</div>
        ${sale.approved_by_name ? `<div>Approved by: ${escapeHtml(sale.approved_by_name)}</div>` : ''}
      </div>
    `
      : '';

  const loyaltyBlock =
    !sale.is_return && Number(sale.loyalty_points_awarded || 0) > 0
      ? `
      <div style="margin-top:16px;padding:12px;border-radius:12px;background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46;">
        <div style="font-weight:700;">Loyalty Earned</div>
        <div style="margin-top:6px;">Points Awarded: ${escapeHtml(sale.loyalty_points_awarded)}</div>
        <div>Customer Total Points: ${escapeHtml(sale.customer_loyalty_points_after || sale.loyalty_points_awarded)}</div>
      </div>
    `
      : '';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(sale.bill_number)} - Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          .sheet { max-width: 760px; margin: 0 auto; }
          .card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 24px; }
          table { width: 100%; border-collapse: collapse; }
          .muted { color: #64748b; font-size: 13px; }
          .totals-row { display:flex; justify-content:space-between; margin-top:8px; }
          @media print { body { padding: 0; } .card { border: 0; } }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="card">
            <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
              <div>
                <div style="font-size:28px;font-weight:800;">${escapeHtml(settings.shop_name || 'Mumtaz Medical')}</div>
                <div class="muted">${escapeHtml(settings.address || '')}</div>
                <div class="muted">${escapeHtml(settings.phone || '')}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.18em;color:${sale.is_return ? '#2563eb' : '#059669'};">${
                  sale.is_return ? 'Return Receipt' : 'Receipt'
                }</div>
                <div style="margin-top:6px;font-weight:700;">${escapeHtml(sale.bill_number)}</div>
                <div class="muted">${escapeHtml(new Date(sale.created_at).toLocaleString())}</div>
              </div>
            </div>

            <div style="margin-top:18px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
              <div>
                <div class="muted">Cashier</div>
                <div style="font-weight:600;">${escapeHtml(sale.cashier_name || 'Unknown')}</div>
              </div>
              <div>
                <div class="muted">Customer</div>
                <div style="font-weight:600;">${escapeHtml(sale.customer_name || 'Walk-in Customer')}</div>
              </div>
            </div>

            <table style="margin-top:20px;">
              <thead>
                <tr>
                  <th style="text-align:left;padding-bottom:10px;border-bottom:2px solid #cbd5e1;">Item</th>
                  <th style="text-align:center;padding-bottom:10px;border-bottom:2px solid #cbd5e1;">Qty</th>
                  <th style="text-align:right;padding-bottom:10px;border-bottom:2px solid #cbd5e1;">Price</th>
                  <th style="text-align:right;padding-bottom:10px;border-bottom:2px solid #cbd5e1;">Line Total</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
            </table>

            <div style="margin-top:18px;border-top:1px solid #e2e8f0;padding-top:12px;">
              <div class="totals-row"><span class="muted">Subtotal</span><strong>${escapeHtml(
                formatCurrency(sale.subtotal, currency)
              )}</strong></div>
              <div class="totals-row"><span class="muted">Discount</span><strong>${escapeHtml(
                formatCurrency(sale.discount_amount, currency)
              )}</strong></div>
              <div class="totals-row"><span class="muted">Tax</span><strong>${escapeHtml(
                formatCurrency(sale.tax_amount, currency)
              )}</strong></div>
              <div class="totals-row" style="font-size:20px;margin-top:12px;"><span>Total</span><strong>${escapeHtml(
                formatCurrency(sale.total, currency)
              )}</strong></div>
            </div>

            <div style="margin-top:18px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
              <div><div class="muted">Payment Mode</div><div style="font-weight:700;text-transform:uppercase;">${escapeHtml(
                sale.payment_mode
              )}</div></div>
              <div><div class="muted">Amount Paid</div><div style="font-weight:700;">${escapeHtml(
                formatCurrency(sale.amount_paid, currency)
              )}</div></div>
              <div><div class="muted">Return Amount</div><div style="font-weight:700;">${escapeHtml(
                formatCurrency(sale.return_amount, currency)
              )}</div></div>
            </div>

            ${dueBlock}
            ${returnBlock}
            ${loyaltyBlock}

            <div style="margin-top:24px;text-align:center;color:#64748b;font-size:12px;">Thank you for choosing ${escapeHtml(
              settings.shop_name || 'Mumtaz Medical'
            )}</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function printSaleReceipt(sale, settings = {}) {
  const html = generateReceiptHTML(sale, settings);
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
  return true;
}
