import { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import PinPad from '../components/ui/PinPad';
import CameraScannerModal from '../components/shared/CameraScannerModal';
import { useAuthStore } from '../store/authStore';

export default function Login({ shopName }) {
  const login = useAuthStore((state) => state.login);
  const emergencyLogin = useAuthStore((state) => state.emergencyLogin);
  const [mode, setMode] = useState('staff');
  const [staffId, setStaffId] = useState('STAFF-001');
  const [pin, setPin] = useState('');
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  const [name, setName] = useState('Emergency User');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakePad, setShakePad] = useState(false);

  async function submitStaffLogin(currentPin = pin) {
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      await login({ staffId, pin: currentPin });
    } catch (err) {
      setError(err.message || 'Login failed.');
      setPin('');
      setShakePad(true);
      window.setTimeout(() => setShakePad(false), 420);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmergencySubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await emergencyLogin({ name, key });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-6xl overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-brand-300">Offline-first pharmacy POS</p>
              <h1 className="mt-4 text-5xl font-black leading-tight text-white">{shopName ?? 'Mumtaz Medical'}</h1>
              <p className="mt-4 max-w-xl text-slate-300">
                The starter app now includes a real PIN pad, role-aware navigation, protected routes, a live staff list,
                and an in-app activity log.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-2xl">🔢</div>
                <div className="mt-2 font-semibold text-white">PIN Pad</div>
                <div className="text-sm text-slate-400">Auto-submit on digit 4</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-2xl">🛡️</div>
                <div className="mt-2 font-semibold text-white">Route Guards</div>
                <div className="text-sm text-slate-400">Role-based sidebar + access</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-2xl">📋</div>
                <div className="mt-2 font-semibold text-white">Audit Trail</div>
                <div className="text-sm text-slate-400">Login and settings events stored</div>
              </div>
            </div>

            <div className="rounded-[28px] border border-brand-400/20 bg-brand-500/10 p-5 text-sm text-brand-100">
              Demo seed account: <span className="font-semibold text-white">STAFF-001</span> with PIN{' '}
              <span className="font-semibold text-white">1234</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-6">
            <div className="mb-6 flex gap-2 rounded-2xl bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('staff');
                  setError('');
                }}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  mode === 'staff' ? 'bg-brand-500 text-slate-950' : 'text-slate-300'
                }`}
              >
                Staff Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('emergency');
                  setError('');
                }}
                className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                  mode === 'emergency' ? 'bg-brand-500 text-slate-950' : 'text-slate-300'
                }`}
              >
                Emergency
              </button>
            </div>

            {mode === 'staff' ? (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Input label="Staff ID" value={staffId} onChange={(event) => setStaffId(event.target.value)} />
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="secondary" onClick={() => setCameraScannerOpen(true)}>
                      Scan staff barcode
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Enter 4-digit PIN</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStaffId('STAFF-001');
                        setPin('');
                        setError('');
                      }}
                      className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-300"
                    >
                      Reset demo
                    </button>
                  </div>
                  <PinPad
                    value={pin}
                    onChange={setPin}
                    onComplete={submitStaffLogin}
                    onSubmit={() => submitStaffLogin()}
                    disabled={loading}
                    shake={shakePad}
                  />
                </div>

                {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

                <Button type="button" className="w-full" disabled={loading || pin.length !== 4} onClick={() => submitStaffLogin()}>
                  {loading ? 'Please wait...' : 'Login to app'}
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleEmergencySubmit}>
                <Input label="Name for log entry" value={name} onChange={(event) => setName(event.target.value)} />
                <Input
                  label="Emergency key"
                  type="password"
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  placeholder="Enter magic key"
                />

                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Bootstrap keys: <span className="font-semibold">sorRy#13</span> (Super Admin),{' '}
                  <span className="font-semibold">manage@mm</span> (Manager),{' '}
                  <span className="font-semibold">sales@mm</span> (Salesperson)
                </div>

                {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Please wait...' : 'Enter emergency mode'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </Card>

      <CameraScannerModal
        open={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        title="Staff ID camera scanner"
        description="Scan a staff barcode card to fill the Staff ID field quickly."
        onDetected={(decodedText) => {
          setStaffId(String(decodedText || '').trim().toUpperCase());
          setMode('staff');
          setError('');
        }}
      />
    </div>
  );
}
