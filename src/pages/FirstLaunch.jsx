import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function FirstLaunch({ onCreate }) {
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      await onCreate();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-4xl overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-brand-300">Welcome</p>
            <h1 className="mt-4 text-4xl font-black text-white">Mumtaz Medical starter is ready to initialize.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              I used the uploaded blueprint, tracker, and stack recommendation to scaffold the project foundation.
              This setup will seed the shop profile, the owner account, and the first audit log entry.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-2xl">📦</div>
                <div className="mt-2 font-semibold text-white">Dexie ready</div>
                <div className="mt-1 text-sm text-slate-400">Local-first bootstrap</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-2xl">🔐</div>
                <div className="mt-2 font-semibold text-white">Auth starter</div>
                <div className="mt-1 text-sm text-slate-400">PIN + emergency key</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-2xl">🧭</div>
                <div className="mt-2 font-semibold text-white">Routes wired</div>
                <div className="mt-1 text-sm text-slate-400">Pages scaffolded</div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-brand-400/20 bg-brand-500/10 p-6">
            <h2 className="text-xl font-bold text-white">Bootstrap seed</h2>
            <div className="mt-5 space-y-4 text-sm text-slate-200">
              <div>
                <div className="font-semibold text-white">Staff ID</div>
                <div>STAFF-001</div>
              </div>
              <div>
                <div className="font-semibold text-white">PIN</div>
                <div>1234</div>
              </div>
              <div>
                <div className="font-semibold text-white">Emergency Key</div>
                <div>sorRy#13</div>
              </div>
            </div>

            <Button className="mt-8 w-full" onClick={handleCreate} disabled={loading}>
              {loading ? 'Initializing...' : 'Initialize app'}
            </Button>
            <p className="mt-4 text-xs text-slate-300">
              Next milestone: replace the bootstrap PIN with a mandatory PIN change flow and extend Dexie to all 12
              planned tables.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
