import { useSyncStore } from '../../store/syncStore';

export default function SyncIndicator() {
  const { configured, enabled, queueLength, syncStatus, lastSyncAt, listenerActive, lastError } = useSyncStore();

  const colorClass =
    syncStatus === 'error'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
      : syncStatus === 'syncing'
        ? 'border-sky-500/30 bg-sky-500/10 text-sky-200'
        : enabled && configured
          ? 'border-brand-500/30 bg-brand-500/10 text-brand-200'
          : 'border-white/10 bg-white/5 text-slate-200';

  return (
    <div className={`rounded-2xl border px-4 py-2 text-xs ${colorClass}`}>
      <div className="font-semibold uppercase tracking-[0.2em]">Sync</div>
      <div className="mt-1">
        {enabled ? (configured ? (listenerActive ? 'Realtime active' : 'Manual / idle') : 'Env missing') : 'Disabled'}
      </div>
      <div className="mt-1">Queue: {queueLength}</div>
      {lastSyncAt ? <div className="mt-1">Last: {new Date(lastSyncAt).toLocaleTimeString()}</div> : null}
      {lastError ? <div className="mt-1 max-w-[160px] truncate">{lastError}</div> : null}
    </div>
  );
}
