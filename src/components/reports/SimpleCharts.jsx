const DONUT_COLORS = ['#10b981', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#e11d48'];

function buildPolylinePoints(data, key, maxValue) {
  if (!data.length) return '';
  return data
    .map((item, index) => {
      const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
      const value = Number(item?.[key] || 0);
      const y = 100 - (value / maxValue) * 100;
      return `${x},${Number.isFinite(y) ? y : 100}`;
    })
    .join(' ');
}

export function LineChart({ data = [], lines = [], height = 240 }) {
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => lines.map((line) => Number(item?.[line.key] || 0)))
  );

  if (!data.length || !lines.length) {
    return <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">No chart data available.</div>;
  }

  const labelStep = data.length > 16 ? 4 : data.length > 10 ? 2 : 1;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
          {[20, 40, 60, 80].map((line) => (
            <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="rgba(148,163,184,0.15)" strokeWidth="0.6" />
          ))}
          {lines.map((line) => {
            const points = buildPolylinePoints(data, line.key, maxValue);
            return (
              <g key={line.key}>
                <polyline
                  fill="none"
                  stroke={line.color}
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={points}
                />
                {data.map((item, index) => {
                  const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
                  const y = 100 - (Number(item?.[line.key] || 0) / maxValue) * 100;
                  return <circle key={`${line.key}-${index}`} cx={x} cy={y} r="1.9" fill={line.color} />;
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        {lines.map((line) => (
          <div key={line.key} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
            <span>{line.label}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-2 text-xs text-slate-500" style={{ gridTemplateColumns: `repeat(${Math.min(data.length, 12)}, minmax(0, 1fr))` }}>
        {data.map((item, index) => (
          <div key={`${item.label}-${index}`} className="truncate text-center">
            {index % labelStep === 0 || index === data.length - 1 ? item.label : ' '}
          </div>
        ))}
      </div>
    </div>
  );
}

export function VerticalBarChart({ items = [], valueKey = 'value', labelKey = 'label', color = '#10b981', height = 220 }) {
  const maxValue = Math.max(1, ...items.map((item) => Number(item?.[valueKey] || 0)));

  if (!items.length) {
    return <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">No chart data available.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/70 p-4" style={{ minHeight: height }}>
        {items.map((item) => {
          const value = Number(item?.[valueKey] || 0);
          const barHeight = `${Math.max(8, (value / maxValue) * (height - 70))}px`;
          return (
            <div key={`${item[labelKey]}-${value}`} className="flex min-w-[72px] flex-1 flex-col items-center justify-end gap-3">
              <div className="text-xs text-slate-400">{item.displayValue ?? value}</div>
              <div className="w-full rounded-t-2xl" style={{ height: barHeight, background: color }} />
              <div className="truncate text-center text-xs text-slate-500">{item[labelKey]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HorizontalBarChart({
  items = [],
  labelKey = 'label',
  valueKey = 'value',
  formatter = (value) => value,
  barClassName = 'from-brand-500 to-emerald-300'
}) {
  const maxValue = Math.max(1, ...items.map((item) => Number(item?.[valueKey] || 0)));

  if (!items.length) {
    return <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">No chart data available.</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const value = Number(item?.[valueKey] || 0);
        const width = `${Math.max(4, (value / maxValue) * 100)}%`;
        return (
          <div key={`${item[labelKey]}-${value}`}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-white">{item[labelKey]}</span>
              <span className="text-slate-400">{formatter(value, item)}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-900/80">
              <div className={`h-3 rounded-full bg-gradient-to-r ${barClassName}`} style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutChart({ items = [], valueKey = 'value', labelKey = 'label', formatter = (value) => value, totalLabel = 'Total' }) {
  const total = items.reduce((sum, item) => sum + Number(item?.[valueKey] || 0), 0);

  if (!items.length || total <= 0) {
    return <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-6 text-sm text-slate-400">No chart data available.</div>;
  }

  let current = 0;
  const stops = items.map((item, index) => {
    const value = Number(item?.[valueKey] || 0);
    const start = current;
    const end = current + (value / total) * 100;
    current = end;
    return `${DONUT_COLORS[index % DONUT_COLORS.length]} ${start}% ${end}%`;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
      <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }}>
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-slate-950 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500">{totalLabel}</div>
          <div className="mt-1 text-lg font-bold text-white">{formatter(total)}</div>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item[labelKey]}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
              <span className="font-medium text-white">{item[labelKey]}</span>
            </div>
            <span className="text-slate-400">{formatter(Number(item?.[valueKey] || 0), item)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
