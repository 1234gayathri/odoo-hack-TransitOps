'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Truck,
  UserCog,
  Route,
  MapPin,
  Wrench,
  Fuel,
  Receipt,
  FileBarChart,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  User,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { canAccessModule, ROLES } from '@/lib/rbac';
import type { ModuleKey, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { notifications } from '@/lib/mock-data';

const NAV_ITEMS: { key: ModuleKey; label: string; icon: any; badge?: number }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'roles', label: 'Role Management', icon: ShieldCheck },
  { key: 'vehicles', label: 'Vehicles', icon: Truck },
  { key: 'drivers', label: 'Drivers', icon: UserCog },
  { key: 'trips', label: 'Trips', icon: Route },
  { key: 'dispatch', label: 'Dispatch', icon: MapPin },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench, badge: 2 },
  { key: 'fuel', label: 'Fuel Logs', icon: Fuel },
  { key: 'expenses', label: 'Expenses', icon: Receipt, badge: 3 },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'notifications', label: 'Notifications', icon: Bell, badge: 3 },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'profile', label: 'Profile', icon: User },
];

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Truck,
  Route,
  ShieldAlert: ShieldCheck,
  Wrench,
  DollarSign: Receipt,
};

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();
  const role = user?.role || 'super_admin';
  const unreadCount = notifications.filter((n) => !n.read).length;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.key === 'profile') return true;
    return canAccessModule(role, item.key);
  });

  const navItems = visibleItems.filter((i) => i.key !== 'profile');
  const profileItem = visibleItems.find((i) => i.key === 'profile');

  const isActive = (key: ModuleKey) => {
    const path = `/${key}`;
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border shrink-0', collapsed ? 'justify-center' : 'justify-between')}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="text-base font-bold tracking-tight">TransitOps</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Fleet Platform</span>
            </motion.div>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.key);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={`/${item.key}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all',
                  collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {active && !collapsed && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
                  />
                )}
                <Icon className={cn('w-[18px] h-[18px] shrink-0', active && 'text-primary')} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Role Switcher */}
      {!collapsed && role === 'super_admin' && (
        <div className="px-3 py-2 border-t border-border">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
            Demo Role Switcher
          </div>
          <select
            value={role}
            onChange={(e) => switchRole(e.target.value as Role)}
            className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs font-medium"
          >
            {Object.entries(ROLES).map(([key, r]) => (
              <option key={key} value={key}>{r.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* User & Logout */}
      <div className={cn('border-t border-border p-3 shrink-0', collapsed && 'px-2')}>
        {profileItem && (
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors mb-2',
              collapsed && 'justify-center'
            )}
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user?.avatar || 'U'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{ROLES[role].label}</p>
              </div>
            )}
          </Link>
        )}
        <Button
          variant="ghost"
          onClick={logout}
          className={cn('w-full text-muted-foreground hover:text-destructive', collapsed ? 'px-2' : '')}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:block shrink-0 h-screen sticky top-0"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-50 h-full w-[260px] lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
