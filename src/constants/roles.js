export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  SALESPERSON: 'salesperson'
};

export const ALL_ROLES = Object.values(ROLES);

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.OWNER]: 'Owner',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.SALESPERSON]: 'Salesperson'
};

export const ROLE_BADGE_STYLES = {
  [ROLES.SUPER_ADMIN]: 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-200',
  [ROLES.OWNER]: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
  [ROLES.MANAGER]: 'border-sky-500/30 bg-sky-500/15 text-sky-200',
  [ROLES.SALESPERSON]: 'border-amber-500/30 bg-amber-500/15 text-amber-100'
};

export const ROUTE_ACCESS = {
  '/pos': ALL_ROLES,
  '/inventory': ALL_ROLES,
  '/ledger': ALL_ROLES,
  '/expenses': [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER],
  '/reports': ALL_ROLES,
  '/staff': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  '/logs': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  '/print-history': ALL_ROLES,
  '/return-approvals': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  '/settings': [ROLES.SUPER_ADMIN, ROLES.OWNER],
  '/day': ALL_ROLES
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    'view_pos',
    'manage_inventory',
    'edit_products',
    'deactivate_products',
    'stock_in_inventory',
    'view_purchase_price',
    'view_ledger',
    'manage_customers',
    'manage_suppliers',
    'manage_expenses',
    'view_reports_basic',
    'view_reports_financial',
    'view_reports_staff',
    'view_all_print_history',
    'view_day_session_history',
    'manage_staff',
    'view_logs',
    'manage_settings',
    'manage_day_session',
    'manage_returns',
    'approve_returns',
    'manage_backup'
  ],
  [ROLES.OWNER]: [
    'view_pos',
    'manage_inventory',
    'edit_products',
    'deactivate_products',
    'stock_in_inventory',
    'view_purchase_price',
    'view_ledger',
    'manage_customers',
    'manage_suppliers',
    'manage_expenses',
    'view_reports_basic',
    'view_reports_financial',
    'view_reports_staff',
    'view_all_print_history',
    'view_day_session_history',
    'manage_staff',
    'view_logs',
    'manage_settings',
    'manage_day_session',
    'manage_returns',
    'approve_returns',
    'manage_backup'
  ],
  [ROLES.MANAGER]: [
    'view_pos',
    'manage_inventory',
    'edit_products',
    'stock_in_inventory',
    'view_purchase_price',
    'view_ledger',
    'manage_customers',
    'manage_suppliers',
    'manage_expenses',
    'view_reports_basic',
    'view_reports_financial',
    'view_all_print_history',
    'view_day_session_history',
    'manage_day_session',
    'manage_returns'
  ],
  [ROLES.SALESPERSON]: [
    'view_pos',
    'manage_inventory',
    'stock_in_inventory',
    'view_ledger',
    'manage_customers',
    'view_reports_basic',
    'manage_day_session'
  ]
};

export const STAFF_MANAGEMENT_RULES = {
  [ROLES.SUPER_ADMIN]: {
    assignableRoles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.SALESPERSON],
    editableRoles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.SALESPERSON],
    toggleRoles: [ROLES.OWNER, ROLES.MANAGER, ROLES.SALESPERSON],
    resetRoles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.SALESPERSON]
  },
  [ROLES.OWNER]: {
    assignableRoles: [ROLES.MANAGER, ROLES.SALESPERSON],
    editableRoles: [ROLES.MANAGER, ROLES.SALESPERSON],
    toggleRoles: [ROLES.MANAGER, ROLES.SALESPERSON],
    resetRoles: [ROLES.MANAGER, ROLES.SALESPERSON]
  }
};

export function getAssignableRoles(actorRole) {
  return STAFF_MANAGEMENT_RULES[actorRole]?.assignableRoles ?? [];
}

export function canManageStaffRole(actorRole, targetRole, action) {
  const rules = STAFF_MANAGEMENT_RULES[actorRole];
  if (!rules || !targetRole) return false;

  if (action === 'create') return rules.assignableRoles.includes(targetRole);
  if (action === 'edit') return rules.editableRoles.includes(targetRole);
  if (action === 'toggle') return rules.toggleRoles.includes(targetRole);
  if (action === 'resetPin') return rules.resetRoles.includes(targetRole);
  return false;
}
