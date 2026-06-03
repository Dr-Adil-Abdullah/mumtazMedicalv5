import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/index';
import { useAuthStore } from '../../store/authStore';
import Header from './Header';
import Sidebar from './Sidebar';
import ProtectedRoute from './ProtectedRoute';

const SettingsPage = lazy(() => import('../../pages/SettingsPage'));
const StaffPage = lazy(() => import('../../pages/StaffPage'));
const ActivityLogPage = lazy(() => import('../../pages/ActivityLogPage'));
const POSPage = lazy(() => import('../../pages/POSPage'));
const InventoryPage = lazy(() => import('../../pages/InventoryPage'));
const LedgerPage = lazy(() => import('../../pages/LedgerPage'));
const PrintHistoryPage = lazy(() => import('../../pages/PrintHistoryPage'));
const ExpensesPage = lazy(() => import('../../pages/ExpensesPage'));
const ReportsPage = lazy(() => import('../../pages/ReportsPage'));
const DaySessionPage = lazy(() => import('../../pages/DaySessionPage'));
const ReturnApprovalPage = lazy(() => import('../../pages/ReturnApprovalPage'));

function protect(element) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

function RouteLoadingScreen() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-5 text-sm text-slate-300">
        Loading module...
      </div>
    </div>
  );
}

export default function AppShell() {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen px-4 py-4 lg:px-6 lg:py-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />

        <div className="min-w-0">
          <Header settings={settings} user={user} onLogout={logout} />

          <Suspense fallback={<RouteLoadingScreen />}>
            <Routes>
              <Route path="/" element={<Navigate to="/pos" replace />} />
              <Route path="/pos" element={protect(<POSPage />)} />
              <Route path="/inventory" element={protect(<InventoryPage />)} />
              <Route path="/ledger" element={protect(<LedgerPage />)} />
              <Route path="/expenses" element={protect(<ExpensesPage />)} />
              <Route path="/reports" element={protect(<ReportsPage />)} />
              <Route path="/staff" element={protect(<StaffPage />)} />
              <Route path="/logs" element={protect(<ActivityLogPage />)} />
              <Route path="/print-history" element={protect(<PrintHistoryPage />)} />
              <Route path="/return-approvals" element={protect(<ReturnApprovalPage />)} />
              <Route path="/settings" element={protect(<SettingsPage />)} />
              <Route path="/day" element={protect(<DaySessionPage />)} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
