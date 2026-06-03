import Card from '../components/ui/Card';

export default function PlaceholderPage({ title, badge, bullets = [] }) {
  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-300">{badge}</p>
            <h2 className="mt-2 text-3xl font-bold text-white">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              This route is scaffolded and ready for implementation. The foundation now matches the uploaded
              blueprint, and we can fill this module feature-by-feature next.
            </p>
          </div>
          <div className="rounded-3xl border border-brand-400/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-200">
            Route connected successfully
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <h3 className="text-lg font-semibold text-white">Planned items</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {bullets.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 text-brand-400">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white">Starter status</h3>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">React + Router are wired up.</div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">Dexie database is ready for expansion.</div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">Auth, first launch, and settings already work.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
