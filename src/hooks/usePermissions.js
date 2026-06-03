import { useMemo } from 'react';
import { ROUTE_ACCESS, ROLE_LABELS, ROLE_PERMISSIONS } from '../constants/roles';
import { useAuthStore } from '../store/authStore';

export default function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  const permissions = useMemo(() => ROLE_PERMISSIONS[role] ?? [], [role]);

  function can(permission) {
    return permissions.includes(permission);
  }

  function hasRole(...roles) {
    return !!role && roles.includes(role);
  }

  function canAccessPath(pathname) {
    if (!role) return false;

    const match = Object.entries(ROUTE_ACCESS).find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
    const allowedRoles = match?.[1] ?? [];
    return allowedRoles.includes(role);
  }

  return {
    user,
    role,
    roleLabel: role ? ROLE_LABELS[role] : 'Guest',
    permissions,
    can,
    hasRole,
    canAccessPath
  };
}
