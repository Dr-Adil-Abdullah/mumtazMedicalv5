import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ReceiptPreview from '../components/shared/ReceiptPreview';
import WhatsAppButton from '../components/shared/WhatsAppButton';
import { db } from '../db/index';
import { formatCurrency } from '../utils/currency';
import { printSaleReceipt } from '../utils/receipt';
import { buildBillSummaryMessage } from '../utils/whatsapp';
import { approveReturn, calculateReturnPreview, getReturnableItems, processReturn } from '../utils/returns';
import { useAuthStore } from '../store/authStore';
import usePermissions from '../hooks/usePermissions';
import { isSaleVisibleToUser } from '../utils/recordScope';

function returnItemKey(item) {
  return `${item.productId || ''}:${item.batchId || ''}:${item.name || ''}`;
}

function approvalBadgeClass(status) {
  if (status === 'approved') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'pending') return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  return 'border-white/10 bg-white/5 text-slate-200';
}

export default function PrintHistoryPage() {
  const user = useAuthStore((state) => state.user);
  const { can } = usePermissions();
  const canManageReturns = can('manage_returns');
  const canApproveReturns = can('approve_returns');
  const canViewAllPrintHistory = can('view_all_print_history');
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const sales = useLiveQuery(() => db.sales.orderBy('created_at').reverse().toArray(), []);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [returnError, setReturnError] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [actionError, setActionError] = useState('');

  const returnsByOriginal = useMemo(() => {
    const map = new Map();
    for (const sale of sales ?? []) {
      if (sale.is_return && sale.original_sale_id) {
        const current = map.get(sale.original_sale_id) ?? [];
        current.push(sale);
        map.set(sale.original_sale_id, current);
      }
    }
    return map;
  }, [sales]);

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase();
    const scopedSales = (sales ?? []).filter((sale) => isSaleVisibleToUser(sale, user, canViewAllPrintHistory));

    return scopedSales.filter((sale) => {
      if (!term) return true;
      return [
        sale.bill_number,
        sale.customer_name,
        sale.cashier_name,
        sale.payment_mode,
        sale.original_bill_number,
        sale.return_reason,
        sale.approval_status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [sales, search, canViewAllPrintHistory, user?.id, user?.name, user?.isEmergency]);

  const totals = useMemo(() => {
    return filteredSales.reduce(
      (acc, sale) => {
        acc.count += 1;
        acc.revenue += Number(sale.total || 0);
        acc.pending += Number(sale.balance_owed || 0);
        acc.returns += sale.is_return ? Math.abs(Number(sale.total || 0)) : 0;
        acc.pendingApprovals += sale.is_return && sale.approval_status !== 'approved' ? 1 : 0;
        return acc;
      },
      { count: 0, revenue: 0, pending: 0, returns: 0, pendingApprovals: 0 }
    );
  }, [filteredSales]);

  const returnableItems = useMemo(() => {
    if (!returnTarget) return [];
    return getReturnableItems(returnTarget, returnsByOriginal.get(returnTarget.id) ?? []);
  }, [returnTarget, returnsByOriginal]);

  const selectedSaleCustomer = useMemo(() => {
    if (!selectedSale?.customer_id) return null;
    return (customers ?? []).find((customer) => customer.id === selectedSale.customer_id) ?? null;
  }, [customers, selectedSale?.customer_id]);

  const returnPreview = useMemo(() => {
    if (!returnTarget) return null;

    const requestedItems = returnableItems
      .map((item) => ({ ...item, quantity: Number(returnQuantities[returnItemKey(item)] || 0) }))
      .filter((item) => item.quantity > 0);

    if (!requestedItems.length) return null;
    return calculateReturnPreview(returnTarget, requestedItems);
  }, [returnTarget, returnableItems, returnQuantities]);

  async function handleProcessReturn() {
    if (!returnTarget || !settings) return;
    setReturnError('');
    setActionStatus('');
    setActionError('');
    setReturnSubmitting(true);

    try {
      const requestedItems = returnableItems
        .map((item) => ({ ...item, quantity: Number(returnQuantities[returnItemKey(item)] || 0) }))
        .filter((item) => item.quantity > 0);

      const returnSale = await processReturn({
        originalSale: returnTarget,
        requestedItems,
        user,
        settings,
        reason: returnReason
      });

      setActionStatus(
        returnSale.approval_status === 'approved'
          ? `Return bill ${returnSale.bill_number} created and approved.`
          : `Return bill ${returnSale.bill_number} created and marked pending owner approval.`
      );
      setReturnTarget(null);
      setReturnQuantities({});
      setReturnReason('');
      setSelectedSale(returnSale);
    } catch (error) {
      setReturnError(error.message || 'Return could not be processed.');
    } finally {
      setReturnSubmitting(false);
    }
  }

  async function handleApproveReturn(sale) {
    setActionStatus('');
    setActionError('');

    try {
      const updated = await approveReturn({ returnSale: sale, actor: user });
      setActionStatus(`Return ${updated.bill_number} approved successfully.`);
      if (selectedSale?.id === updated.id) {
        setSelectedSale(updated);
      }
    } catch (error) {
      setActionError(error.message || 'Return approval failed.');
    }
  }

  return (
    <div className="space-y-6">
      {actionStatus ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          {actionStatus}
        </div>
      ) : null}
      {actionError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">
          {actionError}
        </div>
      ) : null}
      {!canViewAllPrintHistory ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          Your role can view only bills created by your own account.
        </div>
      ) : null}

      <div className="card-grid">
        <Card>
          <p className="text-sm text-slate-400">Bills</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{totals.count}</h3>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Net revenue</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{formatCurrency(totals.revenue, settings?.currency)}</h3>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Returns value</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{formatCurrency(totals.returns, settings?.currency)}</h3>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Pending approvals</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{totals.pendingApprovals}</h3>
        </Card>
      </div>

      <Card>
        <Input
          label="Search bill history"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by bill number, customer, cashier, payment mode"
        />
      </Card>

      <div className="space-y-4">
        {filteredSales.map((sale) => {
          const linkedReturns = returnsByOriginal.get(sale.id) ?? [];
          const pendingLinkedReturns = linkedReturns.filter((item) => item.approval_status !== 'approved').length;
          const returnableCount = sale.is_return ? 0 : getReturnableItems(sale, linkedReturns).length;
          const returnedValue = linkedReturns.reduce((sum, item) => sum + Math.abs(Number(item.total || 0)), 0);
          const customerPhone = (customers ?? []).find((customer) => customer.id === sale.customer_id)?.phone;

          return (
            <Card key={sale.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{sale.bill_number}</h3>
                    <Badge className={sale.is_return ? 'border-blue-500/30 bg-blue-500/10 text-blue-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}>
                      {sale.is_return ? 'RETURN' : 'SALE'}
                    </Badge>
                    {sale.is_return ? (
                      <Badge className={approvalBadgeClass(sale.approval_status)}>
                        {(sale.approval_status || 'pending').toUpperCase()}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {sale.customer_name || 'Walk-in Customer'} • {sale.cashier_name || 'Unknown cashier'} •{' '}
                    {new Date(sale.created_at).toLocaleString()}
                  </p>
                  {sale.is_return ? (
                    <>
                      <p className="mt-1 text-sm text-blue-300">Original bill: {sale.original_bill_number || sale.original_sale_id}</p>
                      {sale.return_reason ? <p className="mt-1 text-sm text-slate-400">Reason: {sale.return_reason}</p> : null}
                    </>
                  ) : linkedReturns.length ? (
                    <p className="mt-1 text-sm text-slate-400">
                      Returned so far: {formatCurrency(returnedValue, settings?.currency)} • {linkedReturns.length} return bill(s)
                      {pendingLinkedReturns ? ` • ${pendingLinkedReturns} pending approval` : ''}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${sale.is_return ? 'text-blue-300' : 'text-white'}`}>
                    {formatCurrency(sale.total, settings?.currency)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {sale.payment_mode.toUpperCase()} {sale.balance_owed ? `• Due ${formatCurrency(sale.balance_owed, settings?.currency)}` : ''}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => setSelectedSale(sale)}>Preview</Button>
                <Button variant="secondary" onClick={() => printSaleReceipt(sale, settings)}>
                  Print
                </Button>
                <WhatsAppButton
                  phone={customerPhone}
                  message={buildBillSummaryMessage({
                    sale,
                    settings,
                    customerPhone
                  })}
                  label="Send"
                />
                {!sale.is_return ? (
                  <Button
                    variant="secondary"
                    disabled={!returnableCount || !canManageReturns}
                    onClick={() => {
                      setReturnTarget(sale);
                      setReturnQuantities({});
                      setReturnReason('');
                      setReturnError('');
                    }}
                  >
                    {!canManageReturns ? 'Return restricted' : returnableCount ? 'Return / refund' : 'Fully returned'}
                  </Button>
                ) : null}
                {sale.is_return && sale.approval_status !== 'approved' && canApproveReturns ? (
                  <Button onClick={() => handleApproveReturn(sale)}>Approve return</Button>
                ) : null}
              </div>
            </Card>
          );
        })}

        {!filteredSales.length ? (
          <Card>
            <h3 className="text-lg font-semibold text-white">No bills found</h3>
            <p className="mt-2 text-sm text-slate-400">Complete a sale first or adjust the search terms.</p>
          </Card>
        ) : null}
      </div>

      <Modal open={!!selectedSale} onClose={() => setSelectedSale(null)} title="Bill preview" size="xl">
        {selectedSale ? (
          <div className="space-y-4">
            <div className="flex justify-end gap-3">
              {selectedSale.is_return && selectedSale.approval_status !== 'approved' && canApproveReturns ? (
                <Button variant="secondary" onClick={() => handleApproveReturn(selectedSale)}>
                  Approve return
                </Button>
              ) : null}
              <WhatsAppButton
                phone={selectedSaleCustomer?.phone}
                message={buildBillSummaryMessage({
                  sale: selectedSale,
                  settings,
                  customerPhone: selectedSaleCustomer?.phone
                })}
                label="Send"
              />
              <Button onClick={() => printSaleReceipt(selectedSale, settings)}>Print receipt</Button>
            </div>
            <ReceiptPreview sale={selectedSale} settings={settings} />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!returnTarget}
        onClose={() => {
          setReturnTarget(null);
          setReturnQuantities({});
          setReturnReason('');
          setReturnError('');
        }}
        title={returnTarget ? `Return / refund — ${returnTarget.bill_number}` : 'Return / refund'}
        size="xl"
      >
        {returnTarget ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
              Process a linked return bill. Returned items will be restocked automatically and any cash refund will be
              recorded as an expense entry.
              <div className="mt-2 font-semibold">
                {canApproveReturns
                  ? 'This return will be approved immediately because your role can approve returns.'
                  : 'This return will be created with pending owner approval.'}
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Return reason</span>
              <textarea
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                rows={3}
                placeholder="Why is this return being processed?"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
              />
            </label>

            <div className="space-y-3">
              {returnableItems.map((item) => {
                const key = returnItemKey(item);
                return (
                  <div key={key} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-400">
                          Sold {item.soldQty} • Already returned {item.alreadyReturnedQty} • Remaining {item.remainingQty}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          Batch {item.batchNumber || item.batchId} • {formatCurrency(item.salePrice, settings?.currency)} each
                        </div>
                      </div>
                      <Input
                        className="w-28"
                        label="Return qty"
                        type="number"
                        min="0"
                        max={item.remainingQty}
                        value={returnQuantities[key] ?? ''}
                        onChange={(event) =>
                          setReturnQuantities((current) => ({
                            ...current,
                            [key]: event.target.value
                          }))
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {returnPreview ? (
              <Card>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Return summary</p>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="text-slate-500">Return total</div>
                    <div className="mt-1 font-semibold text-white">{formatCurrency(returnPreview.total, settings?.currency)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="text-slate-500">Cash refund</div>
                    <div className="mt-1 font-semibold text-white">{formatCurrency(returnPreview.cashRefund, settings?.currency)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="text-slate-500">Pending reduced</div>
                    <div className="mt-1 font-semibold text-white">{formatCurrency(returnPreview.dueReduction, settings?.currency)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="text-slate-500">Approval</div>
                    <div className="mt-1 font-semibold text-white">{canApproveReturns ? 'Auto-approved' : 'Pending owner approval'}</div>
                  </div>
                </div>
              </Card>
            ) : null}

            {returnError ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{returnError}</div> : null}

            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setReturnTarget(null);
                  setReturnQuantities({});
                  setReturnReason('');
                  setReturnError('');
                }}
              >
                Cancel
              </Button>
              <Button disabled={!returnPreview || !returnReason.trim() || returnSubmitting} onClick={handleProcessReturn}>
                {returnSubmitting ? 'Processing...' : 'Create return bill'}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
