const tones = {
  default: 'border-white/10 bg-slate-900/80 text-white',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-50',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-50',
  danger: 'border-rose-500/20 bg-rose-500/10 text-rose-50',
  info: 'border-sky-500/20 bg-sky-500/10 text-sky-50'
};

export default function StatCard({
  label,
  value,
  hint = '',
  icon = '',
  tone = 'default',
  onClick,
  detailLabel = 'View details'
}) {
  const clickable = typeof onClick === 'function';
  const className = `${tones[tone] ?? tones.default} rounded-3xl border p-5 text-left transition ${
    clickable ? 'hover:-translate-y-0.5 hover:border-brand-400/30 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400/40' : ''
  }`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <h3 className="mt-2 text-2xl font-bold">{value}</h3>
        </div>
        {icon ? <div className="text-2xl opacity-80">{icon}</div> : null}
      </div>
      {hint ? <p className="mt-3 text-sm text-slate-300">{hint}</p> : null}
      {clickable ? <div className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-brand-300">{detailLabel}</div> : null}
    </>
  );

  if (clickable) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
