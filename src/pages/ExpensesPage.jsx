import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import SectionIntro from '../components/shared/SectionIntro';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { db } from '../db/index';
import { enqueueSync } from '../db/queue';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import usePermissions from '../hooks/usePermissions';

function initialExpenseForm() {
  return {
    type: 'daily',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    supplier_id: ''
  };
}

export default function ExpensesPage() {
  const user = useAuthStore((state) => state.user);
  const { can } = usePermissions();
  const canManageExpenses = can('manage_expenses');
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray(), []);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const [form, setForm] = useState(initialExpenseForm());
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [detailView, setDetailView] = useState('');

  const sortedSuppliers = useMemo(
    () =>
      [...(suppliers ?? [])].sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'preferred' ? -1 : 1;
      }),
    [suppliers]
  );

  const derived = useMemo(() => {
    const all = expenses ?? [];
    const enabled = all.filter((expense) => expense.is_enabled !== false);
    const disabled = all.filter((expense) => expense.is_enabled === false);
    const purchases = enabled.filter((item) => item.type === 'medicine_purchase');
    const monthly = enabled.filter((item) => item.type === 'monthly');

    return {
      all,
      enabled,
      disabled,
      purchases,
      monthly,
      totals: {
        total: enabled.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        monthly: monthly.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        purchases: purchases.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        disabled: disabled.length
      }
    };
  }, [expenses]);

  function flash(message, isError = false) {
    if (isError) {
      setError(message);
      setStatus('');
    } else {
      setStatus(message);
      setError('');
    }

    window.setTimeout(() => {
      setStatus('');
      setError('');
    }, 3000);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const now = new Date().toISOString();

    if (!canManageExpenses) {
      flash('Your role cannot create expenses.', true);
      return;
    }

    if (!form.description.trim()) {
      flash('Expense description is required.', true);
      return;
    }

    if (!Number(form.amount) || Number(form.amount) <= 0) {
      flash('Enter a valid amount.', true);
      return;
    }

    if (form.type === 'medicine_purchase' && !form.supplier_id) {
      flash('Select a supplier for medicine purchase expenses.', true);
      return;
    }

    const record = {
      id: crypto.randomUUID(),
      type: form.type,
      description: form.description.trim(),
      amount: Number(form.amount),
      date: form.date,
      supplier_id: form.type === 'medicine_purchase' ? form.supplier_id : null,
      is_enabled: true,
      sale_id: null,
      created_at: now,
      updated_at: now
    };

    await db.expenses.add(record);
    await enqueueSync({ tableName: 'expenses', action: 'INSERT', recordId: record.id, data: record });
    await db.logs.add({
      id: crypto.randomUUID(),
      action: 'EXPENSE_CREATE',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: {
        type: record.type,
        amount: record.amount,
        supplier_id: record.supplier_id,
        description: record.description
      },
      timestamp: now
    });

    setForm(initialExpenseForm());
    flash('Expense saved.');
  }

  async function toggleExpense(expense) {
    if (!canManageExpenses) {
      flash('Your role cannot change expense status.', true);
      return;
    }

    const now = new Date().toISOString();
    const updated = {
      ...expense,
      is_enabled: expense.is_enabled === false ? true : false,
      updated_at: now
    };

    await db.expenses.put(updated);
    await enqueueSync({ tableName: 'expenses', action: 'UPDATE', recordId: updated.id, data: updated });
    await db.logs.add({
      id: crypto.randomUUID(),
      action: 'EXPENSE_TOGGLE',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: {
        expense_id: updated.id,
        enabled: updated.is_enabled,
        amount: updated.amount,
        description: updated.description
      },
      timestamp: now
    });

    flash(updated.is_enabled ? 'Expense enabled.' : 'Expense disabled from totals.');
  }

  function getSupplierName(supplierId) {
    return sortedSuppliers.find((supplier) => supplier.id === supplierId)?.name ?? '—';
  }

  const detailSets = {
    enabled: derived.enabled,
    purchases: derived.purchases,
    monthly: derived.monthly,
    disabled: derived.disabled
  };

  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Expenses"
        title="Simple expense tracking with clear detail views"
        description="Use the summary cards to open related records instantly. Keep the screen clean, then drill into only what you need."
      />

      <div className="card-grid">
        <StatCard
          label="Enabled expenses"
          value={formatCurrency(derived.totals.total, settings?.currency)}
          hint={`${derived.enabled.length} active entries`}
          tone="info"
          icon="💰"
          onClick={() => setDetailView('enabled')}
        />
        <StatCard
          label="Medicine purchases"
          value={formatCurrency(derived.totals.purchases, settings?.currency)}
          hint={`${derived.purchases.length} purchase expenses`}
          tone="warning"
          icon="📦"
          onClick={() => setDetailView('purchases')}
        />
        <StatCard
          label="Monthly expenses"
          value={formatCurrency(derived.totals.monthly, settings?.currency)}
          hint={`${derived.monthly.length} monthly entries`}
          tone="default"
          icon="🗓️"
          onClick={() => setDetailView('monthly')}
        />
        <StatCard
          label="Disabled entries"
          value={derived.totals.disabled}
          hint="Visible but excluded from totals"
          tone="danger"
          icon="⏸️"
          onClick={() => setDetailView('disabled')}
        />
      </div>

      {status ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{status}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Quick add</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Create expense</h2>
          <p className="mt-2 text-sm text-slate-400">Keep this form short and focused. All deeper detail stays in the list view.</p>

          {!canManageExpenses ? (
            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              Expense creation and status changes are restricted for your current role.
            </div>
          ) : null}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Type</span>
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
                <option value="medicine_purchase">Medicine Purchase</option>
                <option value="return_payment">Return Payment</option>
              </select>
            </label>

            <Input
              label="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Electricity bill / Supplier invoice / Counter misc"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              />
              <Input
                label="Date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              />
            </div>

            {form.type === 'medicine_purchase' ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Supplier</span>
                <select
                  value={form.supplier_id}
                  onChange={(event) => setForm((current) => ({ ...current, supplier_id: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">Select supplier</option>
                  {sortedSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.type === 'preferred' ? '★ ' : ''}
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={!canManageExpenses}>Save expense</Button>
              <Button variant="secondary" type="button" onClick={() => setForm(initialExpenseForm())}>
                Reset form
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <SectionIntro
            eyebrow="Expense list"
            title="Latest records"
            description="Each record stays compact. Toggle it or open the summary cards above for filtered detail."
          />

          {(expenses ?? []).map((expense) => (
            <Card key={expense.id} className={expense.is_enabled === false ? 'opacity-70' : ''}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{expense.description}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {expense.date} • {expense.type.replaceAll('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{formatCurrency(expense.amount, settings?.currency)}</div>
                  <div className="mt-2 flex justify-end gap-2">
                    <Badge className={expense.is_enabled === false ? 'border-slate-500/30 bg-slate-500/10 text-slate-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}>
                      {expense.is_enabled === false ? 'Disabled' : 'Enabled'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="detail-item">
                  <div className="text-slate-500">Supplier</div>
                  <div className="mt-1 font-semibold text-white">{expense.supplier_id ? getSupplierName(expense.supplier_id) : '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Included in totals</div>
                  <div className="mt-1 font-semibold text-white">{expense.is_enabled === false ? 'No' : 'Yes'}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Created</div>
                  <div className="mt-1 font-semibold text-white">{new Date(expense.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <Button
                  variant={expense.is_enabled === false ? 'primary' : 'secondary'}
                  onClick={() => toggleExpense(expense)}
                  disabled={!canManageExpenses}
                >
                  {expense.is_enabled === false ? 'Enable in totals' : 'Disable from totals'}
                </Button>
              </div>
            </Card>
          ))}

          {!expenses?.length ? (
            <Card>
              <h3 className="text-lg font-semibold text-white">No expenses yet</h3>
              <p className="mt-2 text-sm text-slate-400">Create your first expense to start tracking spend in reports.</p>
            </Card>
          ) : null}
        </div>
      </div>

      <Modal open={!!detailView} onClose={() => setDetailView('')} title="Expense details" size="xl">
        <div className="space-y-4">
          {(detailSets[detailView] ?? []).map((expense) => (
            <div key={expense.id} className="detail-item">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{expense.description}</div>
                  <div className="mt-1 text-xs text-slate-400">{expense.date} • {expense.type.replaceAll('_', ' ')}</div>
                </div>
                <div className="font-semibold text-white">{formatCurrency(expense.amount, settings?.currency)}</div>
              </div>
            </div>
          ))}
          {!(detailSets[detailView] ?? []).length ? (
            <div className="detail-item text-slate-400">No matching expense records for this summary.</div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
