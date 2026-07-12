import type { Role, ModuleKey, Permission } from './types';

export const ROLES: Record<Role, { label: string; description: string; icon: string; color: string }> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Highest authority with unrestricted access to the entire platform',
    icon: 'ShieldCheck',
    color: 'hsl(var(--primary))',
  },
  fleet_manager: {
    label: 'Fleet Manager',
    description: 'Manages fleet assets, vehicle registration, and utilization',
    icon: 'Truck',
    color: 'hsl(var(--chart-2))',
  },
  dispatcher: {
    label: 'Dispatcher',
    description: 'Coordinates transport operations, trip assignment, and dispatch',
    icon: 'Route',
    color: 'hsl(var(--chart-5))',
  },
  safety_officer: {
    label: 'Safety Officer',
    description: 'Ensures compliance, driver verification, and safety tracking',
    icon: 'ShieldAlert',
    color: 'hsl(var(--warning))',
  },
  maintenance_manager: {
    label: 'Maintenance Manager',
    description: 'Schedules and oversees vehicle servicing and repairs',
    icon: 'Wrench',
    color: 'hsl(var(--chart-3))',
  },
  finance_analyst: {
    label: 'Finance Analyst',
    description: 'Manages operational costs, fuel, expenses, and financial analytics',
    icon: 'DollarSign',
    color: 'hsl(var(--chart-4))',
  },
};

export const ROLE_HIERARCHY: Role[] = [
  'super_admin',
  'fleet_manager',
  'dispatcher',
  'safety_officer',
  'maintenance_manager',
  'finance_analyst',
];

export const MODULES: ModuleKey[] = [
  'dashboard',
  'users',
  'roles',
  'vehicles',
  'drivers',
  'trips',
  'dispatch',
  'maintenance',
  'fuel',
  'expenses',
  'reports',
  'analytics',
  'notifications',
  'audit',
  'settings',
  'profile',
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  users: 'User Management',
  roles: 'Role Management',
  vehicles: 'Vehicles',
  drivers: 'Drivers',
  trips: 'Trips',
  dispatch: 'Dispatch',
  maintenance: 'Maintenance',
  fuel: 'Fuel Logs',
  expenses: 'Expenses',
  reports: 'Reports',
  analytics: 'Analytics',
  notifications: 'Notifications',
  audit: 'Audit Logs',
  settings: 'Settings',
  profile: 'Profile',
};

export const PERMISSION_MATRIX: Record<Role, Partial<Record<ModuleKey, Permission>>> = {
  super_admin: MODULES.reduce((acc, m) => {
    acc[m] = 'full';
    return acc;
  }, {} as Record<ModuleKey, Permission>),
  fleet_manager: {
    dashboard: 'read',
    vehicles: 'full',
    drivers: 'read',
    trips: 'read',
    dispatch: 'read',
    maintenance: 'read',
    fuel: 'read',
    expenses: 'read',
    reports: 'export',
    analytics: 'read',
    notifications: 'read',
    settings: 'read',
    profile: 'full',
  },
  dispatcher: {
    dashboard: 'read',
    vehicles: 'read',
    drivers: 'read',
    trips: 'full',
    dispatch: 'full',
    maintenance: 'read',
    notifications: 'read',
    settings: 'read',
    profile: 'full',
  },
  safety_officer: {
    dashboard: 'read',
    drivers: 'full',
    vehicles: 'read',
    trips: 'read',
    reports: 'export',
    notifications: 'read',
    settings: 'read',
    profile: 'full',
  },
  maintenance_manager: {
    dashboard: 'read',
    vehicles: 'read',
    maintenance: 'full',
    trips: 'read',
    reports: 'export',
    notifications: 'read',
    settings: 'read',
    profile: 'full',
  },
  finance_analyst: {
    dashboard: 'read',
    fuel: 'full',
    expenses: 'full',
    maintenance: 'read',
    reports: 'full',
    analytics: 'full',
    notifications: 'read',
    settings: 'read',
    profile: 'full',
  },
};

export function hasPermission(role: Role, module: ModuleKey, required: Permission): boolean {
  const perm = PERMISSION_MATRIX[role]?.[module];
  if (!perm || perm === 'none') return false;
  if (perm === 'full') return true;
  if (required === 'full') return false;
  const hierarchy: Permission[] = ['read', 'create', 'update', 'delete', 'approve', 'export'];
  return hierarchy.indexOf(perm) >= hierarchy.indexOf(required);
}

export function canAccessModule(role: Role, module: ModuleKey): boolean {
  const perm = PERMISSION_MATRIX[role]?.[module];
  return !!perm && perm !== 'none';
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  full: 'Full Access',
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
  none: 'No Access',
};

export const PERMISSION_COLORS: Record<Permission, string> = {
  full: 'bg-primary/10 text-primary border-primary/20',
  create: 'bg-success/10 text-success border-success/20',
  read: 'bg-info/10 text-info border-info/20',
  update: 'bg-warning/10 text-warning border-warning/20',
  delete: 'bg-destructive/10 text-destructive border-destructive/20',
  approve: 'bg-primary/10 text-primary border-primary/20',
  export: 'bg-secondary text-foreground border-border',
  none: 'bg-muted text-muted-foreground border-border',
};
