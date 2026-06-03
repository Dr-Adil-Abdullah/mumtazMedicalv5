import { useEffect, useState } from 'react';

export default function OfflineBadge() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const toOnline = () => setOnline(true);
    const toOffline = () => setOnline(false);

    window.addEventListener('online', toOnline);
    window.addEventListener('offline', toOffline);

    return () => {
      window.removeEventListener('online', toOnline);
      window.removeEventListener('offline', toOffline);
    };
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        online
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-amber-300'}`} />
      {online ? 'Online' : 'Offline — Local only'}
    </span>
  );
}
