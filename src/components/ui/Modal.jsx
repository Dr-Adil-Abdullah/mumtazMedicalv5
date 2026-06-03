export default function Modal({ open, onClose, title, children, size = 'lg' }) {
  if (!open) return null;

  const maxWidth = size === 'xl' ? 'max-w-5xl' : size === 'sm' ? 'max-w-md' : 'max-w-3xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
      <div className={`glass max-h-[90vh] w-full ${maxWidth} overflow-auto rounded-3xl p-5 shadow-soft`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
