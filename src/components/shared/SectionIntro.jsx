import Card from '../ui/Card';

export default function SectionIntro({ eyebrow, title, description, action }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          {eyebrow ? <p className="text-xs uppercase tracking-[0.35em] text-brand-300">{eyebrow}</p> : null}
          <h2 className="mt-2 text-3xl font-bold text-white">{title}</h2>
          {description ? <p className="mt-3 text-sm text-slate-400">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </Card>
  );
}
