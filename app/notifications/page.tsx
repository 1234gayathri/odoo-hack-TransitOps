'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  CheckCheck,
  Trash2,
  Filter,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notifications as initialNotifications } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const NOTIF_CONFIG = {
  success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', ring: 'ring-success/20' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/20' },
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', ring: 'ring-destructive/20' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', ring: 'ring-info/20' },
};

type FilterTab = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'read') return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Notification dismissed');
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    const now = new Date('2026-07-12T10:00:00Z');
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Notifications"
        description="Stay updated with real-time system alerts and activity notifications."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="w-4 h-4 mr-2" /> Mark all as read
        </Button>
      </PageHeader>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            Unread
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-7 h-7" />}
              title="No notifications"
              description={
                filter === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : 'No notifications match this filter.'
              }
            />
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence>
                {filtered.map((n, i) => {
                  const config = NOTIF_CONFIG[n.type];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className={cn(
                        'flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors group',
                        !n.read && 'bg-primary/[0.02]'
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ring-1',
                          config.bg,
                          config.ring
                        )}
                      >
                        <Icon className={cn('w-5 h-5', config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                              <p className={cn('text-sm', n.read ? 'font-medium' : 'font-semibold')}>
                                {n.title}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              {formatTimestamp(n.timestamp)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {!n.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleMarkRead(n.id)}
                              >
                                <CheckCheck className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(n.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          Showing {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          {unreadCount > 0 && ` · ${unreadCount} unread`}
        </div>
      )}
    </DashboardLayout>
  );
}
