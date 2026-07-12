'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, Route, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

import type { ModuleKey } from '@/lib/types';

const MOBILE_ITEMS: { key: ModuleKey; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { key: 'vehicles', label: 'Vehicles', icon: Truck },
  { key: 'trips', label: 'Trips', icon: Route },
  { key: 'notifications', label: 'Alerts', icon: Bell },
  { key: 'profile', label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { user, hasPermission, canAccessModule } = useAuth();
  const role = user?.role || 'super_admin';

  const items = MOBILE_ITEMS.filter((i) => i.key === 'profile' || canAccessModule(i.key));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-border">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {items.map((item) => {
          const active = pathname === `/${item.key}` || pathname.startsWith(`/${item.key}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={`/${item.key}`}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
