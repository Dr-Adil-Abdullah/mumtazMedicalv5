import { formatCurrency } from '../../utils/currency';

export default function ReceiptPreview({ sale, settings }) {
  if (!sale) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white p-6 text-slate-900 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-2xl font-black">{settings?.shop_name ?? 'Mumtaz Medical'}</div>
          <div className="mt-1 text-sm text-slate-500">{settings?.address || 'Shop address'}</div>
          <div className="text-sm text-slate-500">{settings?.phone || 'Phone not set'}</div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-semibold uppercase tracking-[0.3em] ${sale.is_return ? 'text-blue-600' : 'text-emerald-600'}`}>
            {sale.is_return ? 'Return Receipt' : 'Receipt'}
          </div>
          <div className="mt-2 text-lg font-bold">{sale.bill_number}</div>
          <div className="text-sm text-slate-500">{new Date(sale.created_at).toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Cashier</div>
          <div className="mt-1 font-semibold">{sale.cashier_name || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Customer</div>
          <div className="mt-1 font-semibold">{sale.customer_name || 'Walk-in Customer'}</div>
        </div>
      </div>

      {sale.is_return ? (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <div className="font-semibold">Linked original bill: {sale.original_bill_number || sale.original_sale_id}</div>
          <div className="mt-2">Cash Refund: {formatCurrency(sale.refund_cash || sale.return_amount || 0, settings?.currency)}</div>
          <div>Pending Reduced: {formatCurrency(sale.due_adjustment || 0, settings?.currency)}</div>
          {sale.return_reason ? <div className="mt-2">Reason: {sale.return_reason}</div> : null}
          <div className="mt-2">Approval: {(sale.approval_status || 'pending').toUpperCase()}</div>
          {sale.approved_by_name ? <div>Approved by: {sale.approved_by_name}</div> : null}
        </div>
      ) : null}

      {!sale.is_return && Number(sale.loyalty_points_awarded || 0) > 0 ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="font-semibold">Loyalty earned</div>
          <div className="mt-2">Points Awarded: {sale.loyalty_points_awarded}</div>
          <div>Customer Total Points: {sale.customer_loyalty_points_after || sale.loyalty_points_awarded}</div>
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {(sale.items ?? []).map((item, index) => (
              <tr key={`${item.batchId}-${index}`} className="border-t border-slate-200">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.unit || '—'} {item.batchNumber ? `• Batch ${item.batchNumber}` : ''}</div>
                </td>
                <td className="px-4 py-3 text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.salePrice, settings?.currency)}</td>
                <td className="px-4 py-3 text-right">
                  {formatCurrency(Number(item.salePrice) * Number(item.quantity), settings?.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatCurrency(sale.subtotal, settings?.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Discount</span>
          <span>{formatCurrency(sale.discount_amount, settings?.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Tax</span>
          <span>{formatCurrency(sale.tax_amount, settings?.currency)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
          <span>Total</span>
          <span>{formatCurrency(sale.total, settings?.currency)}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-100 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Payment</div>
          <div className="mt-1 font-semibold uppercase">{sale.payment_mode}</div>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Paid</div>
          <div className="mt-1 font-semibold">{formatCurrency(sale.amount_paid, settings?.currency)}</div>
        </div>
        <div className="rounded-2xl bg-slate-100 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Return / Due</div>
          <div className="mt-1 font-semibold">
            {sale.payment_mode === 'pending'
              ? formatCurrency(sale.balance_owed, settings?.currency)
              : formatCurrency(sale.return_amount, settings?.currency)}
          </div>
        </div>
      </div>
    </div>
  );
}
