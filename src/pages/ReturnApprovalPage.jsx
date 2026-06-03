import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import SectionIntro from '../components/shared/SectionIntro';
import ReceiptPreview from '../components/shared/ReceiptPreview';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { db } from '../db/index';
import { approveReturn } from '../utils/returns';
import { formatCurrency } from '../utils/currency';
import usePermissions from '../hooks/usePermissions';

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'all', label: 'All returns' }
];

function approvalBadgeClass(status) {
  if (status === 'approved') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'pending') return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  return 'border-white/10 bg-white/5 text-slate-200';
}

function ageLabel(dateValue) {
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ReturnApprovalPage() {
  const { user, can } = usePermissions();
  const canApproveReturns = can('approve_returns');
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const sales = useLiveQuery(() => db.sales.orderBy('created_at').reverse().toArray(), []);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [selectedOriginalSale, setSelectedOriginalSale] = useState(null);
  const [detailView, setDetailView] = useState('');
  const [actionStatus, setActionStatus] = useState('');
  const [actionError, setActionError] = useState('');
  const [approvingId, setApprovingId] = useState('');
  const [bulkApproving, setBulkApproving] = useState(false);

  const originalSalesMap = useMemo(() => {
    return new Map((sales ?? []).map((sale) => [sale.id, sale]));
  }, [sales]);

  const returnSales = useMemo(() => {
    return (sales ?? [])
      .filter((sale) => sale.is_return)
      .map((sale) => ({
        ...sale,
        originalSale: originalSalesMap.get(sale.original_sale_id) ?? null
      }));
  }, [sales, originalSalesMap]);

  const pendingReturns = useMemo(
    () => returnSales.filter((sale) => sale.approval_status !== 'approved'),
    [returnSales]
  );

  const approvedReturns = useMemo(
    () => returnSales.filter((sale) => sale.approval_status === 'approved'),
    [returnSales]
  );

  const filteredReturns = useMemo(() => {
    const term = search.trim().toLowerCase();
    const scoped =
      filter === 'pending'
        ? pendingReturns
        : filter === 'approved'
          ? approvedReturns
          : returnSales;

    return scoped.filter((sale) => {
      if (!term) return true;
      return [
        sale.bill_number,
        sale.original_bill_number,
        sale.customer_name,
        sale.cashier_name,
        sale.return_reason,
        sale.approval_status,
        sale.originalSale?.bill_number,
        sale.originalSale?.cashier_name
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [filter, search, pendingReturns, approvedReturns, returnSales]);

  const summary = useMemo(() => {
    const pendingRefundCash = pendingReturns.reduce((sum, sale) => sum + Number(sale.refund_cash || sale.return_amount || 0), 0);
    const pendingDueReduction = pendingReturns.reduce((sum, sale) => sum + Number(sale.due_adjustment || 0), 0);
    const approvedToday = approvedReturns.filter((sale) => {
      const now = new Date();
      const approvedAt = sale.approved_at ? new Date(sale.approved_at) : null;
      return approvedAt && approvedAt.toDateString() === now.toDateString();
    }).length;
    const oldestPending = [...pendingReturns].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];

    return {
      pendingCount: pendingReturns.length,
      pendingRefundCash,
      pendingDueReduction,
      approvedToday,
      oldestPending
    };
  }, [pendingReturns, approvedReturns]);

  async function handleApprove(sale) {
    if (!canApproveReturns) return;

    setApprovingId(sale.id);
    setActionStatus('');
    setActionError('');

    try {
      const updated = await approveReturn({ returnSale: sale, actor: user });
      const enriched = {
        ...updated,
        originalSale: sale.originalSale ?? selectedSale?.originalSale ?? originalSalesMap.get(updated.original_sale_id) ?? null
      };
      setActionStatus(`Return ${updated.bill_number} approved successfully.`);
      if (selectedSale?.id === updated.id) {
        setSelectedSale(enriched);
      }
    } catch (error) {
      setActionError(error.message || 'Return approval failed.');
    } finally {
      setApprovingId('');
    }
  }

  async function handleApproveVisible() {
    if (!canApproveReturns) return;

    const visiblePending = filteredReturns.filter((sale) => sale.approval_status !== 'approved');
    if (!visiblePending.length) return;

    const confirmed = window.confirm(`Approve ${visiblePending.length} visible pending return(s)?`);
    if (!confirmed) return;

    setBulkApproving(true);
    setActionStatus('');
    setActionError('');

    try {
      for (const sale of visiblePending) {
        await approveReturn({ returnSale: sale, actor: user });
      }
      setActionStatus(`${visiblePending.length} pending return(s) approved successfully.`);
      if (selectedSale && visiblePending.some((sale) => sale.id === selectedSale.id)) {
        setSelectedSale(null);
      }
    } catch (error) {
      setActionError(error.message || 'Bulk approval failed.');
    } finally {
      setBulkApproving(false);
    }
  }

  const detailSets = {
    pending: pendingReturns,
    approved: approvedReturns,
    refunds: [...pendingReturns].sort((a, b) => Number(b.refund_cash || 0) - Number(a.refund_cash || 0)),
    due: [...pendingReturns].sort((a, b) => Number(b.due_adjustment || 0) - Number(a.due_adjustment || 0))
  };

  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Return approvals"
        title="Owner approval dashboard for pending return bills"
        description="Review pending returns, see cash refund exposure, inspect linked original bills, and approve one-by-one or in bulk from a single focused screen."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setFilter('pending')}>
              Focus pending
            </Button>
            <Link
              to="/print-history"
              className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-brand-400"
            >
              Open print history
            </Link>
          </div>
        }
      />

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

      {summary.pendingCount ? (
        <Card className="border border-amber-500/20 bg-amber-500/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Attention needed</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{summary.pendingCount} pending return approval(s)</h2>
              <p className="mt-2 text-sm text-amber-100">
                Pending cash refund exposure is {formatCurrency(summary.pendingRefundCash, settings?.currency)} and the oldest request was created{' '}
                {summary.oldestPending ? ageLabel(summary.oldestPending.created_at) : 'just now'}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleApproveVisible} disabled={bulkApproving || !filteredReturns.some((sale) => sale.approval_status !== 'approved')}>
                {bulkApproving ? 'Approving...' : 'Approve visible'}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border border-emerald-500/20 bg-emerald-500/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Queue clear</p>
              <h2 className="mt-2 text-2xl font-bold text-white">No pending return approvals right now.</h2>
              <p className="mt-2 text-sm text-emerald-100">
                All currently visible return bills are already approved.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="card-grid">
        <StatCard
          label="Pending approvals"
          value={summary.pendingCount}
          hint="Tap to inspect pending return bills"
          tone={summary.pendingCount ? 'warning' : 'success'}
          icon="⏳"
          onClick={() => setDetailView('pending')}
        />
        <StatCard
          label="Pending cash refunds"
          value={formatCurrency(summary.pendingRefundCash, settings?.currency)}
          hint="Tap to inspect biggest refund exposure"
          tone="danger"
          icon="💸"
          onClick={() => setDetailView('refunds')}
        />
        <StatCard
          label="Pending due reductions"
          value={formatCurrency(summary.pendingDueReduction, settings?.currency)}
          hint="Tap to inspect due adjustments"
          tone="info"
          icon="📉"
          onClick={() => setDetailView('due')}
        />
        <StatCard
          label="Approved today"
          value={summary.approvedToday}
          hint="Tap to inspect approved return bills"
          tone="success"
          icon="✅"
          onClick={() => setDetailView('approved')}
        />
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[280px] flex-1">
            <Input
              label="Search returns"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by return bill, original bill, customer, cashier, or reason"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button key={item.id} variant={filter === item.id ? 'primary' : 'secondary'} onClick={() => setFilter(item.id)}>
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredReturns.map((sale) => {
          const originalSale = sale.originalSale;
          const isPending = sale.approval_status !== 'approved';
          return (
            <Card key={sale.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{sale.bill_number}</h3>
                    <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-200">RETURN</Badge>
                    <Badge className={approvalBadgeClass(sale.approval_status)}>
                      {(sale.approval_status || 'pending').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    Original bill {sale.original_bill_number || originalSale?.bill_number || sale.original_sale_id} • {sale.customer_name || 'Walk-in Customer'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Created by {sale.cashier_name || 'Unknown cashier'} • {new Date(sale.created_at).toLocaleString()} • {ageLabel(sale.created_at)}
                  </p>
                  {sale.return_reason ? <p className="mt-3 text-sm text-slate-300">Reason: {sale.return_reason}</p> : null}
                  {sale.approved_by_name ? (
                    <p className="mt-2 text-sm text-emerald-200">
                      Approved by {sale.approved_by_name} • {sale.approved_at ? new Date(sale.approved_at).toLocaleString() : 'Recorded'}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2 text-right text-sm">
                  <div>
                    <div className="text-slate-500">Return total</div>
                    <div className="font-semibold text-white">{formatCurrency(Math.abs(Number(sale.total || 0)), settings?.currency)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Cash refund</div>
                    <div className="font-semibold text-white">{formatCurrency(sale.refund_cash || sale.return_amount || 0, settings?.currency)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Pending reduced</div>
                    <div className="font-semibold text-white">{formatCurrency(sale.due_adjustment || 0, settings?.currency)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <div className="detail-item">
                  <div className="text-slate-500">Items returned</div>
                  <div className="mt-1 font-semibold text-white">{sale.items?.length ?? 0}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Original cashier</div>
                  <div className="mt-1 font-semibold text-white">{originalSale?.cashier_name || '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Original payment mode</div>
                  <div className="mt-1 font-semibold text-white">{originalSale?.payment_mode?.toUpperCase() || '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Original total</div>
                  <div className="mt-1 font-semibold text-white">{formatCurrency(originalSale?.total || 0, settings?.currency)}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => setSelectedSale(sale)}>
                  Preview return bill
                </Button>
                {originalSale ? (
                  <Button variant="secondary" onClick={() => setSelectedOriginalSale(originalSale)}>
                    View original bill
                  </Button>
                ) : null}
                {isPending ? (
                  <Button onClick={() => handleApprove(sale)} disabled={approvingId === sale.id || bulkApproving || !canApproveReturns}>
                    {approvingId === sale.id ? 'Approving...' : 'Approve return'}
                  </Button>
                ) : null}
              </div>
            </Card>
          );
        })}

        {!filteredReturns.length ? (
          <Card>
            <h3 className="text-lg font-semibold text-white">No return bills found</h3>
            <p className="mt-2 text-sm text-slate-400">
              Adjust the filter or search terms. Return bills created from Print History will appear here automatically.
            </p>
          </Card>
        ) : null}
      </div>

      <Modal open={!!selectedSale} onClose={() => setSelectedSale(null)} title="Return bill preview" size="xl">
        {selectedSale ? (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-end gap-3">
              {selectedSale.originalSale ? (
                <Button variant="secondary" onClick={() => setSelectedOriginalSale(selectedSale.originalSale)}>
                  View original bill
                </Button>
              ) : null}
              {selectedSale.approval_status !== 'approved' ? (
                <Button onClick={() => handleApprove(selectedSale)} disabled={approvingId === selectedSale.id || bulkApproving}>
                  {approvingId === selectedSale.id ? 'Approving...' : 'Approve return'}
                </Button>
              ) : null}
            </div>
            <ReceiptPreview sale={selectedSale} settings={settings} />
          </div>
        ) : null}
      </Modal>

      <Modal open={!!selectedOriginalSale} onClose={() => setSelectedOriginalSale(null)} title="Original bill preview" size="xl">
        {selectedOriginalSale ? <ReceiptPreview sale={selectedOriginalSale} settings={settings} /> : null}
      </Modal>

      <Modal open={!!detailView} onClose={() => setDetailView('')} title="Return approval details" size="xl">
        <div className="space-y-4">
          {(detailSets[detailView] ?? []).map((sale) => (
            <div key={sale.id} className="detail-item">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{sale.bill_number}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {sale.customer_name || 'Walk-in Customer'} • {sale.original_bill_number || sale.original_sale_id} • {new Date(sale.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold text-white">{formatCurrency(Math.abs(Number(sale.total || 0)), settings?.currency)}</div>
                  <div className="text-slate-400">Refund {formatCurrency(sale.refund_cash || sale.return_amount || 0, settings?.currency)}</div>
                </div>
              </div>
            </div>
          ))}
          {!(detailSets[detailView] ?? []).length ? (
            <div className="detail-item text-slate-400">No return records match this summary.</div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
