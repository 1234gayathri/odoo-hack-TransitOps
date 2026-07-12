'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
  User,
  Settings,
  Command as CommandIcon,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  PanelLeft,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/rbac';
import type { ModuleKey } from '@/lib/types';

import { cn } from '@/lib/utils';

const COMMAND_ITEMS: { key: ModuleKey; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Search },
  { key: 'users', label: 'User Management', icon: User },
  { key: 'roles', label: 'Role Management', icon: Settings },
  { key: 'vehicles', label: 'Vehicles', icon: Search },
  { key: 'drivers', label: 'Drivers', icon: User },
  { key: 'trips', label: 'Trips', icon: Search },
  { key: 'dispatch', label: 'Dispatch', icon: Search },
  { key: 'maintenance', label: 'Maintenance', icon: Search },
  { key: 'fuel', label: 'Fuel Logs', icon: Search },
  { key: 'expenses', label: 'Expenses', icon: Search },
  { key: 'reports', label: 'Reports', icon: Search },
  { key: 'analytics', label: 'Analytics', icon: Search },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'profile', label: 'Profile', icon: User },
];

const NOTIF_ICONS = {
  success: { icon: CheckCircle2, color: 'text-success' },
  warning: { icon: AlertTriangle, color: 'text-warning' },
  error: { icon: XCircle, color: 'text-destructive' },
  info: { icon: Info, color: 'text-info' },
};

interface TopbarProps {
  onMenuClick: () => void;
  onExpandSidebar: () => void;
  collapsed: boolean;
}

export function Topbar({ onMenuClick, onExpandSidebar, collapsed }: TopbarProps) {
  const router = useRouter();
  const { user, hasPermission, canAccessModule, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [commandOpen, setCommandOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const role = user?.role || 'super_admin';

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const accessibleItems = COMMAND_ITEMS.filter((i) => i.key === 'profile' || canAccessModule(i.key));
  // Temporarily disable unread notifications counter in topbar since it was using mock data
  const unreadCount = 0;

  return (
    <>
      <header className="sticky top-0 z-30 h-16 glass border-b border-border">
        <div className="flex items-center h-full px-4 lg:px-6 gap-3">
          {/* Mobile menu */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>

          {/* Expand sidebar */}
          {collapsed && (
            <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={onExpandSidebar}>
              <PanelLeft className="w-5 h-5" />
            </Button>
          )}

          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">TransitOps</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium capitalize">{pathname_segment()}</span>
          </nav>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto">
            <button
              onClick={() => setCommandOpen(true)}
              className="w-full flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/50 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search...</span>
              <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded">
                <CommandIcon className="w-2.5 h-2.5" />K
              </kbd>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            {mounted && (
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              </Button>
            )}

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive ring-2 ring-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-3 py-2.5 border-b">
                  <span className="font-semibold text-sm">Notifications</span>
                  <Badge variant="secondary" className="text-[10px]">{unreadCount} new</Badge>
                </div>
                <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Go to Notifications page to view all alerts.
                  </div>
                </div>
                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => router.push('/notifications')}>
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-accent transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {user?.avatar || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs font-medium leading-tight">{user?.name}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{ROLES[role].label}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user?.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search modules, pages, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {accessibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.key}
                  onSelect={() => {
                    router.push(`/${item.key}`);
                    setCommandOpen(false);
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { router.push('/vehicles'); setCommandOpen(false); }}>
              <Search className="w-4 h-4 mr-2" /> Add New Vehicle
            </CommandItem>
            <CommandItem onSelect={() => { router.push('/trips'); setCommandOpen(false); }}>
              <Search className="w-4 h-4 mr-2" /> Create New Trip
            </CommandItem>
            <CommandItem onSelect={() => { router.push('/drivers'); setCommandOpen(false); }}>
              <Search className="w-4 h-4 mr-2" /> Register New Driver
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function pathname_segment() {
  if (typeof window === 'undefined') return 'Dashboard';
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Dashboard';
}
