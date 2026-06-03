import { ALL_ROLES, ROLES } from './roles';

export const navItems = [
  {
    path: '/pos',
    label: 'POS',
    icon: '🛒',
    description: 'Sell medicines and complete bills.',
    allowedRoles: ALL_ROLES
  },
  {
    path: '/inventory',
    label: 'Inventory',
    icon: '📦',
    description: 'Products, stock-in, and alerts.',
    allowedRoles: ALL_ROLES
  },
  {
    path: '/ledger',
    label: 'Ledger',
    icon: '📖',
    description: 'Customers, suppliers, and dues.',
    allowedRoles: ALL_ROLES
  },
  {
    path: '/expenses',
    label: 'Expenses',
    icon: '💰',
    description: 'Track daily and monthly expenses.',
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.OWNER, ROLES.MANAGER]
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: '📊',
    description: 'KPIs, profit, sales history, and trends.',
    allowedRoles: ALL_ROLES
  },
  {
    path: '/staff',
    label: 'Staff',
    icon: '👥',
    description: 'Roles, PINs, and permissions.',
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.OWNER]
  },
  {
    path: '/logs',
    label: 'Activity Log',
    icon: '📋',
    description: 'Immutable audit trail.',
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.OWNER]
  },
  {
    path: '/print-history',
    label: 'Print History',
    icon: '🖨️',
    description: 'Reprint old bills and send them.',
    allowedRoles: ALL_ROLES
  },
  {
    path: '/return-approvals',
    label: 'Return Approvals',
    icon: '✅',
    description: 'Owner approval queue for return bills.',
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.OWNER]
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: '⚙️',
    description: 'Shop profile and system settings.',
    allowedRoles: [ROLES.SUPER_ADMIN, ROLES.OWNER]
  },
  {
    path: '/day',
    label: 'Day Session',
    icon: '🕘',
    description: 'Open and close the day.',
    allowedRoles: ALL_ROLES
  }
];
