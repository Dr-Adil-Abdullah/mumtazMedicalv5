import { Suspense, lazy, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db/index';
import { ensureCoreData, seedInitialData } from './db/seed';
import { useAuthStore } from './store/authStore';
import { initializeSyncState, refreshQueueCount, runManualSync, startRealtimeSync, stopRealtimeSync } from './db/sync';

const FirstLaunch = lazy(() => import('./pages/FirstLaunch'));
const Login = lazy(() => import('./pages/Login'));
const AppShell = lazy(() => import('./components/layout/AppShell'));
const ForcePinChangePage = lazy(() => import('./pages/ForcePinChangePage'));

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-5 text-sm text-slate-300">
        Preparing Mumtaz Medical...
      </div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const staffCount = useLiveQuery(() => db.staff.count(), []);
  const user = useAuthStore((state) => state.user);
  const currentStaff = useLiveQuery(
    () => {
      if (!user || user.isEmergency || !user.id) return null;
      return db.staff.get(user.id);
    },
    [user?.id, user?.isEmergency]
  );

  useEffect(() => {
    let active = true;
    db.open().finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!settings) return;
    ensureCoreData();
    initializeSyncState(Boolean(settings.sync_enabled));
    refreshQueueCount();
  }, [settings?.id, settings?.sync_enabled]);

  useEffect(() => {
    if (!settings) return undefined;

    let cancelled = false;

    async function setupSync() {
      try {
        initializeSyncState(Boolean(settings.sync_enabled));

        if (settings.sync_enabled) {
          await startRealtimeSync();
          if (!cancelled && navigator.onLine) {
            await runManualSync({ actor: user ?? { name: 'System' } }).catch(() => null);
          }
        } else {
          await stopRealtimeSync();
        }
      } catch {
        // sync foundation should fail gracefully until env is configured
      }
    }

    setupSync();

    return () => {
      cancelled = true;
      if (!settings.sync_enabled) {
        stopRealtimeSync().catch(() => null);
      }
    };
  }, [settings?.sync_enabled, user?.id]);

  if (!ready) {
    return <LoadingScreen />;
  }

  if (!settings || staffCount === 0) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <FirstLaunch onCreate={seedInitialData} />
      </Suspense>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <Login shopName={settings.shop_name} />
      </Suspense>
    );
  }

  if ((user.mustChangePin || currentStaff?.must_change_pin) && !user.isEmergency) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <ForcePinChangePage user={user} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <AppShell />
    </Suspense>
  );
}
