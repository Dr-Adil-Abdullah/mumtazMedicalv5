import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { db } from '../db/index';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'login', label: 'Login' },
  { id: 'staff', label: 'Staff' },
  { id: 'sales', label: 'Sales' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'day', label: 'Day Session' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'system', label: 'System' }
];

function matchFilter(log, filter) {
  if (filter === 'all') return true;
  if (filter === 'login') return ['LOGIN', 'LOGOUT', 'FAILED_LOGIN', 'PIN_CHANGE', 'PIN_RESET'].includes(log.action);
  if (filter === 'staff') {
    return ['STAFF_CREATE', 'STAFF_UPDATE', 'STAFF_DEACTIVATE', 'STAFF_REACTIVATE', 'PIN_RESET'].includes(log.action);
  }
  if (filter === 'sales') return ['SALE', 'RETURN', 'RETURN_APPROVED'].includes(log.action);
  if (filter === 'inventory') {
    return ['PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DEACTIVATE', 'PRODUCT_REACTIVATE', 'STOCK_IN'].includes(
      log.action
    );
  }
  if (filter === 'ledger') {
    return ['CUSTOMER_CREATE', 'SUPPLIER_CREATE', 'PARTIAL_PAYMENT'].includes(log.action);
  }
  if (filter === 'expenses') {
    return ['EXPENSE_CREATE', 'EXPENSE_TOGGLE'].includes(log.action);
  }
  if (filter === 'day') {
    return ['DAY_OPEN', 'DAY_CLOSE'].includes(log.action);
  }
  if (filter === 'emergency') return ['EMERGENCY_LOGIN', 'FAILED_EMERGENCY_LOGIN'].includes(log.action);
  if (filter === 'system') {
    return ['SEED', 'SEED_PRODUCTS', 'SETTING_CHANGE', 'BACKUP', 'RESTORE', 'SYNC_PUSH', 'SYNC_PULL', 'SYNC_ERROR', 'SYNC_LISTENER_START', 'SYNC_LISTENER_STOP'].includes(log.action);
  }
  return true;
}

function badgeStyle(action) {
  if (action.includes('FAILED')) return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  if (action.includes('EMERGENCY')) return 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200';
  if (action === 'SALE') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (action === 'RETURN') return 'border-blue-500/30 bg-blue-500/10 text-blue-200';
  if (action === 'RETURN_APPROVED') return 'border-green-500/30 bg-green-500/10 text-green-200';
  if (['DAY_OPEN', 'DAY_CLOSE'].includes(action)) return 'border-violet-500/30 bg-violet-500/10 text-violet-200';
  if (['CUSTOMER_CREATE', 'SUPPLIER_CREATE', 'PARTIAL_PAYMENT'].includes(action)) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  }
  if (['EXPENSE_CREATE', 'EXPENSE_TOGGLE'].includes(action)) {
    return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
  }
  if (action.startsWith('STAFF_') || action === 'PIN_RESET') {
    return 'border-orange-500/30 bg-orange-500/10 text-orange-100';
  }
  if (action.includes('PRODUCT') || action === 'STOCK_IN') return 'border-brand-500/30 bg-brand-500/10 text-brand-200';
  if (['BACKUP', 'RESTORE'].includes(action)) {
    return 'border-lime-500/30 bg-lime-500/10 text-lime-100';
  }
  if (action.startsWith('SYNC_')) {
    return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-100';
  }
  if (action === 'PIN_CHANGE' || action.startsWith('SEED') || action === 'SETTING_CHANGE') {
    return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
  }
  return 'border-white/10 bg-white/5 text-slate-200';
}

export default function ActivityLogPage() {
  const [filter, setFilter] = useState('all');
  const logs = useLiveQuery(async () => {
    const rows = await db.logs.orderBy('timestamp').reverse().toArray();
    return rows.slice(0, 200);
  }, []);

  const filteredLogs = useMemo(() => (logs ?? []).filter((log) => matchFilter(log, filter)), [logs, filter]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Immutable activity stream</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Audit log now tracks staff CRUD and PIN resets too</h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-400">
              Logins, staff security actions, products, stock-in, ledger changes, expenses, day sessions, returns, and
              completed sales are stored locally in Dexie. Next we can still add CSV export and cloud sync for immutable history.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
            Showing {filteredLogs.length} entries
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            variant={filter === item.id ? 'primary' : 'secondary'}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={badgeStyle(log.action)}>{log.action}</Badge>
                  <span className="text-sm text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{log.user_name ?? 'Unknown user'}</h3>
              </div>
              {log.user_id ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-xs text-slate-400">
                  User ID: {log.user_id}
                </div>
              ) : null}
            </div>

            {log.details ? (
              <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-300">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            ) : null}
          </Card>
        ))}

        {!filteredLogs.length ? (
          <Card>
            <h3 className="text-lg font-semibold text-white">No log entries for this filter</h3>
            <p className="mt-2 text-sm text-slate-400">
              Perform login, staff, inventory, ledger, expense, day session, or sale actions to generate records.
            </p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
