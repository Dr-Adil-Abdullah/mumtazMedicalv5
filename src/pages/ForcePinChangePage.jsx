import { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

export default function ForcePinChangePage({ user }) {
  const updateOwnPin = useAuthStore((state) => state.updateOwnPin);
  const logout = useAuthStore((state) => state.logout);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateOwnPin({ newPin, confirmPin, skipCurrentPin: true });
      setSuccess('PIN updated successfully. You can continue to the app now.');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setError(err.message || 'PIN could not be changed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-4xl overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-amber-300">Security step required</p>
            <h1 className="mt-4 text-4xl font-black text-white">Change your default PIN before using the app.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              The bootstrap account for <span className="font-semibold text-white">{user?.name}</span> is still using a
              temporary PIN. For safety, you need to replace it now.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-2xl">🔐</div>
                <div className="mt-2 font-semibold text-white">4 digits only</div>
                <div className="mt-1 text-sm text-slate-400">Use a new private PIN</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-2xl">⛔</div>
                <div className="mt-2 font-semibold text-white">No weak patterns</div>
                <div className="mt-1 text-sm text-slate-400">1111, 1234, 4321, etc. are blocked</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-2xl">🧾</div>
                <div className="mt-2 font-semibold text-white">Audit logged</div>
                <div className="mt-1 text-sm text-slate-400">PIN update is recorded in activity logs</div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
            <h2 className="text-2xl font-bold text-white">Set a new PIN</h2>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
                label="Confirm PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
              />

              {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}
              {success ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{success}</div> : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}>
                  {loading ? 'Updating...' : 'Update PIN'}
                </Button>
                <Button variant="secondary" type="button" onClick={logout}>
                  Logout
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}
