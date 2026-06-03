import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { navItems } from '../../constants/navigation';
import { db } from '../../db/index';
import OfflineBadge from './OfflineBadge';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import SyncIndicator from '../shared/SyncIndicator';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { ROLE_BADGE_STYLES, ROLE_LABELS } from '../../constants/roles';
import { useAuthStore } from '../../store/authStore';

export default function Header({ settings, user, onLogout }) {
  const location = useLocation();
  const updateOwnPin = useAuthStore((state) => state.updateOwnPin);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const openSession = useLiveQuery(async () => {
    const sessions = await db.day_sessions.where('status').equals('open').toArray();
    return sessions[0] ?? null;
  }, []);
  const pendingReturnCount = useLiveQuery(
    async () => db.sales.where('is_return').equals(true).filter((sale) => sale.approval_status !== 'approved').count(),
    []
  );
  const canApproveReturns = ['owner', 'super_admin'].includes(user?.role);

  const page = useMemo(
    () => navItems.find((item) => location.pathname.startsWith(item.path)) ?? navItems[0],
    [location.pathname]
  );

  function resetPinModal() {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    setPinSuccess('');
    setSavingPin(false);
  }

  async function handlePinSubmit(event) {
    event.preventDefault();
    setPinError('');
    setPinSuccess('');
    setSavingPin(true);

    try {
      await updateOwnPin({ currentPin, newPin, confirmPin });
      setPinSuccess('Your PIN has been changed successfully.');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (error) {
      setPinError(error.message || 'PIN could not be changed.');
    } finally {
      setSavingPin(false);
    }
  }

  return (
    <>
      <header className="glass sticky top-0 z-20 mb-6 flex flex-col gap-4 rounded-3xl px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-300">{settings?.shop_name ?? 'Mumtaz Medical'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{page.label}</h1>
            <span className="hidden text-slate-400 md:inline">{page.description}</span>
            {user?.mustChangePin ? (
              <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-100">PIN change pending</Badge>
            ) : null}
            <Badge className={openSession ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-slate-500/30 bg-slate-500/10 text-slate-200'}>
              {openSession ? 'Day Open' : 'Day Closed'}
            </Badge>
            {canApproveReturns && (pendingReturnCount ?? 0) > 0 ? (
              <Link to="/return-approvals">
                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-100">
                  {pendingReturnCount} pending return approval{pendingReturnCount === 1 ? '' : 's'}
                </Badge>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <OfflineBadge />
          <SyncIndicator />
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
            <span className="font-semibold text-white">{user.name}</span>
            <span className="mx-2 text-slate-500">•</span>
            <span className="uppercase tracking-wide text-brand-300">{ROLE_LABELS[user.role] ?? user.role}</span>
            {user.isEmergency ? <span className="ml-2 text-fuchsia-300">⚡</span> : null}
          </div>
          <Badge className={ROLE_BADGE_STYLES[user.role] ?? 'border-white/10 bg-white/5 text-white'}>
            {ROLE_LABELS[user.role] ?? user.role}
          </Badge>
          {!user.isEmergency ? (
            <Button
              variant="secondary"
              onClick={() => {
                resetPinModal();
                setPinModalOpen(true);
              }}
            >
              Change PIN
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>

      <Modal
        open={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          resetPinModal();
        }}
        title="Change your PIN"
        size="sm"
      >
        <form className="space-y-4" onSubmit={handlePinSubmit}>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            Update the PIN for <span className="font-semibold text-white">{user?.name}</span>. Your current PIN is required,
            and weak patterns like 1111 or 1234 are blocked.
          </div>

          <Input
            label="Current PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={currentPin}
            onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
          />
          <Input
            label="New PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
          />
          <Input
            label="Confirm new PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
          />

          {pinError ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{pinError}</div> : null}
          {pinSuccess ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {pinSuccess}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={savingPin || currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}>
              {savingPin ? 'Updating...' : 'Update PIN'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPinModalOpen(false);
                resetPinModal();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
