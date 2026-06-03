import { NavLink } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { navItems } from '../../constants/navigation';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../db/index';

export default function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(user?.role));
  const pendingReturnCount = useLiveQuery(
    async () => db.sales.where('is_return').equals(true).filter((sale) => sale.approval_status !== 'approved').count(),
    []
  );

  return (
    <aside className="glass rounded-3xl p-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div className="mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/20 text-2xl">💊</div>
          <div>
            <p className="text-sm font-semibold text-white">Mumtaz Medical</p>
            <p className="text-xs text-slate-400">Phase A foundation+</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {visibleItems.map((item) => {
          const badgeCount = item.path === '/return-approvals' ? pendingReturnCount ?? 0 : 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  isActive
                    ? 'bg-brand-500/20 text-white ring-1 ring-brand-400/30'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{item.label}</div>
                  {badgeCount > 0 ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-100">
                      {badgeCount}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-slate-400">{item.description}</div>
              </div>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
