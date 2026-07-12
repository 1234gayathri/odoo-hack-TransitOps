'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Send,
  Loader2,
  Wrench,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const NOTIF_CONFIG: Record<string, any> = {
  success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', ring: 'ring-success/20' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', ring: 'ring-warning/20' },
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', ring: 'ring-destructive/20' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', ring: 'ring-info/20' },
};

type FilterTab = 'all' | 'unread' | 'read';

interface AppNotification {
  id: string;
  fromRole: string;
  toRole: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  read: boolean;
  maintenanceId: string | null;
}

const ROLES = [
  { value: 'all', label: 'All Roles (Broadcast)' },
  { value: 'fleet_manager', label: 'Fleet Manager' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'safety_officer', label: 'Safety Officer' },
  { value: 'maintenance_manager', label: 'Maintenance Manager' },
  { value: 'finance_analyst', label: 'Finance Analyst' },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const userRole = user?.role || 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  // Compose State
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    title: '',
    message: '',
    toRole: 'all',
    type: 'info'
  });
  const [composeLoading, setComposeLoading] = useState(false);

  // Maintenance approval state
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?role=${userRole}`);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      } else {
        toast.error('Failed to load notifications');
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'read') return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true, role: userRole })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: true })
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success('Notification dismissed');
      }
    } catch (err) {
      toast.error('Failed to dismiss notification');
    }
  };

  const handleApproveMaintenance = async (maintenanceId: string, notifId: string) => {
    setApprovalLoading(notifId);
    try {
      const res = await fetch('/api/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: maintenanceId, approvalStatus: 'approved' }),
      });
      if (res.ok) {
        toast.success('✅ Maintenance Approved!', {
          description: 'Expense recorded. Maintenance Manager has been notified.'
        });
        fetchNotifications();
      } else {
        const data = await res.json();
        toast.error('Approval failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network error', { description: err.message });
    } finally {
      setApprovalLoading(null);
    }
  };

  const handleRejectMaintenance = async () => {
    if (!rejectId) return;
    if (!rejectionComment.trim()) {
      toast.error('Please enter rejection comments');
      return;
    }
    setRejectLoading(true);
    try {
      const notif = notifications.find(n => n.id === rejectId);
      const maintenanceId = notif?.maintenanceId;
      if (!maintenanceId) {
        toast.error('Cannot find maintenance record for this notification');
        return;
      }
      const res = await fetch('/api/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: maintenanceId,
          approvalStatus: 'rejected',
          rejectionComments: rejectionComment,
        }),
      });
      if (res.ok) {
        toast.success('❌ Maintenance Rejected', {
          description: 'Maintenance Manager has been notified with your comments.'
        });
        setRejectId(null);
        setRejectionComment('');
        fetchNotifications();
      } else {
        const data = await res.json();
        toast.error('Rejection failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network error', { description: err.message });
    } finally {
      setRejectLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!composeForm.title.trim() || !composeForm.message.trim()) {
      toast.error('Please enter a title and message');
      return;
    }

    try {
      setComposeLoading(true);
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeForm)
      });
      if (res.ok) {
        toast.success('Notification broadcasted successfully');
        setComposeOpen(false);
        setComposeForm({ title: '', message: '', toRole: 'all', type: 'info' });
        fetchNotifications();
      } else {
        const data = await res.json();
        toast.error('Broadcast Error', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setComposeLoading(false);
    }
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${Math.max(0, diffMins)}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Notifications"
        description="Stay updated with real-time system alerts and activity notifications."
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || loading}
          >
            <CheckCheck className="w-4 h-4 mr-2" /> Mark all as read
          </Button>
          {isSuperAdmin && (
            <Button size="sm" onClick={() => setComposeOpen(true)}>
              <Send className="w-4 h-4 mr-2" /> Broadcast Notification
            </Button>
          )}
        </div>
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
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading notifications database...</p>
            </div>
          ) : filtered.length === 0 ? (
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
                  const config = NOTIF_CONFIG[n.type] || NOTIF_CONFIG.info;
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
                              {n.toRole === 'all' && (
                                <Badge variant="outline" className="text-[10px] ml-2">Broadcast</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              {formatTimestamp(n.timestamp)}
                            </p>

                            {/* Approve/Reject buttons for Super Admin on maintenance notifications */}
                            {isSuperAdmin && n.maintenanceId && !n.read && (
                              <div className="flex items-center gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5 h-8"
                                  onClick={() => setRejectId(n.id)}
                                  disabled={approvalLoading === n.id}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8"
                                  onClick={() => handleApproveMaintenance(n.maintenanceId!, n.id)}
                                  disabled={approvalLoading === n.id}
                                >
                                  {approvalLoading === n.id ? (
                                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Approving...</>
                                  ) : (
                                    <><CheckCircle2 className="w-3.5 h-3.5" /> Approve</>
                                  )}
                                </Button>
                              </div>
                            )}

                            {/* Show maintenance badge for already acted-upon notifications */}
                            {n.maintenanceId && n.read && (
                              <div className="flex items-center gap-1 mt-2">
                                <Wrench className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">Maintenance Request (Action Taken)</span>
                              </div>
                            )}
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
      {filtered.length > 0 && !loading && (
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
          <Filter className="w-3.5 h-3.5" />
          Showing {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
          {unreadCount > 0 && ` · ${unreadCount} unread`}
        </div>
      )}

      {/* Broadcast Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Broadcast Notification</DialogTitle>
            <DialogDescription>
              Send an alert to specific roles or everyone in the system.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <select
                value={composeForm.toRole}
                onChange={(e) => setComposeForm({ ...composeForm, toRole: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <Label>Notification Type</Label>
              <select
                value={composeForm.type}
                onChange={(e) => setComposeForm({ ...composeForm, type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="info">Information (Blue)</option>
                <option value="success">Success (Green)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="error">Critical Alert (Red)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                placeholder="e.g. System Maintenance Scheduled"
                value={composeForm.title}
                onChange={(e) => setComposeForm({ ...composeForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Enter the notification content here..."
                value={composeForm.message}
                onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={composeLoading}>Cancel</Button>
            <Button onClick={handleBroadcast} disabled={composeLoading}>
              {composeLoading ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Comment Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(v) => !v && (setRejectId(null), setRejectionComment(''))}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Reject Maintenance Request</DialogTitle>
            <DialogDescription>
              Provide feedback to the Maintenance Manager explaining why this invoice was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="reject-comments">Rejection Comments *</Label>
            <textarea
              id="reject-comments"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1.5"
              placeholder="e.g. The actual cost is higher than estimated without explanation. Please attach a correct workshop breakdown."
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectId(null); setRejectionComment(''); }} disabled={rejectLoading}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRejectMaintenance}
              disabled={rejectLoading}
            >
              {rejectLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
