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
import { useAuthStore } from '../store/authStore';
import usePermissions from '../hooks/usePermissions';
import { formatCurrency } from '../utils/currency';

function toTime(value) {
  return value ? new Date(value).getTime() : 0;
}

export default function DaySessionPage() {
  const user = useAuthStore((state) => state.user);
  const { can } = usePermissions();
  const canViewSessionHistory = can('view_day_session_history');
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const sessions = useLiveQuery(async () => {
    const rows = await db.day_sessions.toArray();
    return rows.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
  }, []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const partialPayments = useLiveQuery(() => db.partial_payments.toArray(), []);
  const expenses = useLiveQuery(() => db.expenses.toArray(), []);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [detailView, setDetailView] = useState('');

  const currentSession = useMemo(() => (sessions ?? []).find((session) => session.status === 'open') ?? null, [sessions]);

  const currentSessionMetrics = useMemo(() => {
    if (!currentSession) {
      return {
        salesCash: 0,
        partialCash: 0,
        expenseCash: 0,
        expectedCash: 0,
        billCount: 0,
        salesInSession: []
      };
    }

    const openedAt = toTime(currentSession.opened_at);
    const salesInSession = (sales ?? []).filter((sale) => toTime(sale.created_at) >= openedAt);
    const sessionPayments = (partialPayments ?? []).filter((payment) => toTime(payment.payment_date) >= openedAt);
    const sessionExpenses = (expenses ?? []).filter(
      (expense) => expense.is_enabled !== false && toTime(expense.created_at || expense.date) >= openedAt
    );
    const salesCash = salesInSession.reduce((sum, sale) => {
      if (sale.payment_mode === 'cash') return sum + Number(sale.total || 0);
      return sum + Number(sale.amount_paid || 0);
    }, 0);
    const partialCash = sessionPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const expenseCash = sessionExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      salesCash,
      partialCash,
      expenseCash,
      expectedCash: Number(currentSession.opening_cash || 0) + salesCash + partialCash - expenseCash,
      billCount: salesInSession.length,
      salesInSession,
      sessionPayments,
      sessionExpenses
    };
  }, [currentSession, sales, partialPayments, expenses]);

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

  async function openDay() {
    if (currentSession) {
      flash('A day session is already open.', true);
      return;
    }

    const now = new Date().toISOString();
    const record = {
      id: crypto.randomUUID(),
      opened_by: user?.isEmergency ? null : user?.id,
      opened_by_name: user?.name ?? 'Unknown',
      opened_at: now,
      opening_cash: Number(openingCash || 0),
      closed_by: null,
      closed_by_name: null,
      closed_at: null,
      closing_cash: null,
      expected_cash: null,
      difference: null,
      status: 'open'
    };

    await db.day_sessions.add(record);
    await db.logs.add({
      id: crypto.randomUUID(),
      action: 'DAY_OPEN',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: {
        opening_cash: record.opening_cash,
        session_id: record.id
      },
      timestamp: now
    });

    setOpeningCash('');
    flash('Day opened successfully.');
  }

  async function closeDay() {
    if (!currentSession) {
      flash('No open day session found.', true);
      return;
    }

    if (closingCash === '') {
      flash('Enter closing cash first.', true);
      return;
    }

    const now = new Date().toISOString();
    const expectedCash = currentSessionMetrics.expectedCash;
    const closingAmount = Number(closingCash || 0);
    const updated = {
      ...currentSession,
      closed_by: user?.isEmergency ? null : user?.id,
      closed_by_name: user?.name ?? 'Unknown',
      closed_at: now,
      closing_cash: closingAmount,
      expected_cash: expectedCash,
      difference: closingAmount - expectedCash,
      status: 'closed'
    };

    await db.day_sessions.put(updated);
    await db.logs.add({
      id: crypto.randomUUID(),
      action: 'DAY_CLOSE',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: {
        session_id: updated.id,
        expected_cash: updated.expected_cash,
        closing_cash: updated.closing_cash,
        difference: updated.difference
      },
      timestamp: now
    });

    setClosingCash('');
    flash('Day closed successfully.');
  }

  const detailSets = {
    bills: currentSessionMetrics.salesInSession,
    payments: currentSessionMetrics.sessionPayments,
    expenses: currentSessionMetrics.sessionExpenses,
    history: canViewSessionHistory ? sessions ?? [] : []
  };

  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Day session"
        title="Clean open and close workflow"
        description="Use the summary cards to jump into bill, payment, expense, and session details without cluttering the screen."
      />

      {status ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{status}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

      <div className="card-grid">
        <StatCard
          label="Session status"
          value={currentSession ? 'Open' : 'Closed'}
          hint={currentSession ? 'A day is active right now' : 'No active day session'}
          tone={currentSession ? 'success' : 'default'}
          icon="🕘"
        />
        <StatCard
          label="Expected cash"
          value={formatCurrency(currentSessionMetrics.expectedCash, settings?.currency)}
          hint="Calculated from opening + sales + payments - expenses"
          tone="info"
          icon="💵"
          onClick={() => setDetailView('expenses')}
          detailLabel="Session cash breakdown"
        />
        <StatCard
          label="Bills in session"
          value={currentSessionMetrics.billCount}
          hint="Tap to inspect bills counted in this session"
          tone="warning"
          icon="🧾"
          onClick={() => setDetailView('bills')}
        />
        <StatCard
          label="Session history"
          value={canViewSessionHistory ? sessions?.length ?? 0 : 'Restricted'}
          hint={canViewSessionHistory ? 'Open previous sessions and cash differences' : 'History is limited for your role'}
          tone="default"
          icon="📚"
          onClick={canViewSessionHistory ? () => setDetailView('history') : undefined}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Day control</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Open / close session</h2>
          <p className="mt-2 text-sm text-slate-400">Keep the workflow short here. Use the cards and history panel for deeper detail.</p>

          {!currentSession ? (
            <div className="mt-5 space-y-4">
              <Input
                label="Opening cash"
                type="number"
                min="0"
                value={openingCash}
                onChange={(event) => setOpeningCash(event.target.value)}
                placeholder="0"
              />
              <Button onClick={openDay}>Open day</Button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="panel-soft text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span>Opened by</span>
                  <span className="font-semibold text-white">{currentSession.opened_by_name || 'Unknown'}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>Opened at</span>
                  <span className="font-semibold text-white">{new Date(currentSession.opened_at).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>Opening cash</span>
                  <span className="font-semibold text-white">{formatCurrency(currentSession.opening_cash, settings?.currency)}</span>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="detail-item">
                  <div className="text-slate-500">Sales cash</div>
                  <div className="mt-1 font-semibold text-white">{formatCurrency(currentSessionMetrics.salesCash, settings?.currency)}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Partial payments</div>
                  <div className="mt-1 font-semibold text-white">{formatCurrency(currentSessionMetrics.partialCash, settings?.currency)}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Expenses</div>
                  <div className="mt-1 font-semibold text-white">{formatCurrency(currentSessionMetrics.expenseCash, settings?.currency)}</div>
                </div>
              </div>

              <Input
                label="Closing cash"
                type="number"
                min="0"
                value={closingCash}
                onChange={(event) => setClosingCash(event.target.value)}
                placeholder="Enter counted drawer cash"
              />
              <Button onClick={closeDay}>Close day</Button>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <SectionIntro
            eyebrow="Session list"
            title="Recent sessions"
            description={canViewSessionHistory ? 'Each session stays concise here. Open the summary cards above when you want related detail lists.' : 'Only higher roles can inspect full session history and historical cash differences.'}
          />

          {canViewSessionHistory
            ? (sessions ?? []).map((session) => (
                <Card key={session.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{new Date(session.opened_at).toLocaleDateString()}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Opened by {session.opened_by_name || 'Unknown'} • {new Date(session.opened_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={session.status === 'open' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-slate-500/30 bg-slate-500/10 text-slate-200'}>
                      {session.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <div className="detail-item">
                      <div className="text-slate-500">Opening</div>
                      <div className="mt-1 font-semibold text-white">{formatCurrency(session.opening_cash, settings?.currency)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="text-slate-500">Expected</div>
                      <div className="mt-1 font-semibold text-white">{session.expected_cash == null ? '—' : formatCurrency(session.expected_cash, settings?.currency)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="text-slate-500">Closing</div>
                      <div className="mt-1 font-semibold text-white">{session.closing_cash == null ? '—' : formatCurrency(session.closing_cash, settings?.currency)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="text-slate-500">Difference</div>
                      <div className={`mt-1 font-semibold ${Number(session.difference || 0) === 0 ? 'text-white' : Number(session.difference || 0) > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {session.difference == null ? '—' : formatCurrency(session.difference, settings?.currency)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            : (
              <Card>
                <h3 className="text-lg font-semibold text-white">Session history is restricted</h3>
                <p className="mt-2 text-sm text-slate-400">Your role can work with the current day, but cannot inspect historical sessions.</p>
              </Card>
            )}

          {!sessions?.length ? (
            <Card>
              <h3 className="text-lg font-semibold text-white">No sessions yet</h3>
              <p className="mt-2 text-sm text-slate-400">Open the first day session to start cash reconciliation.</p>
            </Card>
          ) : null}
        </div>
      </div>

      <Modal open={!!detailView} onClose={() => setDetailView('')} title="Session details" size="xl">
        <div className="space-y-4">
          {detailView === 'bills'
            ? detailSets.bills.map((sale) => (
                <div key={sale.id} className="detail-item">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{sale.bill_number}</div>
                      <div className="mt-1 text-xs text-slate-400">{sale.customer_name || 'Walk-in'} • {sale.payment_mode}</div>
                    </div>
                    <div className="font-semibold text-white">{formatCurrency(sale.total, settings?.currency)}</div>
                  </div>
                </div>
              ))
            : null}

          {detailView === 'history'
            ? detailSets.history.map((session) => (
                <div key={session.id} className="detail-item">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{new Date(session.opened_at).toLocaleDateString()}</div>
                      <div className="mt-1 text-xs text-slate-400">{session.status.toUpperCase()} • Opened by {session.opened_by_name || 'Unknown'}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-white">{formatCurrency(session.opening_cash, settings?.currency)}</div>
                      <div className="text-slate-400">Difference {session.difference == null ? '—' : formatCurrency(session.difference, settings?.currency)}</div>
                    </div>
                  </div>
                </div>
              ))
            : null}

          {detailView === 'expenses'
            ? (
              <>
                <div className="detail-item">
                  <div className="font-semibold text-white">Sales cash</div>
                  <div className="mt-1 text-slate-300">{formatCurrency(currentSessionMetrics.salesCash, settings?.currency)}</div>
                </div>
                <div className="detail-item">
                  <div className="font-semibold text-white">Partial payments</div>
                  <div className="mt-1 text-slate-300">{formatCurrency(currentSessionMetrics.partialCash, settings?.currency)}</div>
                </div>
                <div className="detail-item">
                  <div className="font-semibold text-white">Expenses</div>
                  <div className="mt-1 text-slate-300">{formatCurrency(currentSessionMetrics.expenseCash, settings?.currency)}</div>
                </div>
                <div className="detail-item">
                  <div className="font-semibold text-white">Expected cash</div>
                  <div className="mt-1 text-slate-300">{formatCurrency(currentSessionMetrics.expectedCash, settings?.currency)}</div>
                </div>
              </>
            )
            : null}

          {!detailView || !(detailSets[detailView]?.length ?? detailView === 'expenses') ? (
            detailView && detailView !== 'expenses' ? <div className="detail-item text-slate-400">No detail records available for this card.</div> : null
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
