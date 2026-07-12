'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </motion.div>
  );
}

interface KPICardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color?: string;
  delay?: number;
}

export function KPICard({ label, value, change, trend, icon, color = 'hsl(var(--primary))', delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-elevation-1 hover:shadow-elevation-2 transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              trend === 'up' && 'bg-success/10 text-success',
              trend === 'down' && 'bg-destructive/10 text-destructive',
              trend === 'neutral' && 'bg-muted text-muted-foreground'
            )}
          >
            {trend === 'up' && '+'}{change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-success/10 text-success border-success/20' },
  on_trip: { label: 'On Trip', className: 'bg-primary/10 text-primary border-primary/20' },
  maintenance: { label: 'Maintenance', className: 'bg-warning/10 text-warning border-warning/20' },
  retired: { label: 'Retired', className: 'bg-muted text-muted-foreground border-border' },
  off_duty: { label: 'Off Duty', className: 'bg-muted text-muted-foreground border-border' },
  suspended: { label: 'Suspended', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  planned: { label: 'Planned', className: 'bg-info/10 text-info border-info/20' },
  dispatched: { label: 'Dispatched', className: 'bg-primary/10 text-primary border-primary/20' },
  in_transit: { label: 'In Transit', className: 'bg-primary/10 text-primary border-primary/20' },
  completed: { label: 'Completed', className: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  scheduled: { label: 'Scheduled', className: 'bg-info/10 text-info border-info/20' },
  in_progress: { label: 'In Progress', className: 'bg-warning/10 text-warning border-warning/20' },
  overdue: { label: 'Overdue', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  active: { label: 'Active', className: 'bg-success/10 text-success border-success/20' },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground border-border' },
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/20' },
  approved: { label: 'Approved', className: 'bg-success/10 text-success border-success/20' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border' },
  medium: { label: 'Medium', className: 'bg-info/10 text-info border-info/20' },
  high: { label: 'High', className: 'bg-warning/10 text-warning border-warning/20' },
  critical: { label: 'Critical', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  normal: { label: 'Normal', className: 'bg-info/10 text-info border-info/20' },
  diesel: { label: 'Diesel', className: 'bg-muted text-muted-foreground border-border' },
  petrol: { label: 'Petrol', className: 'bg-muted text-muted-foreground border-border' },
  electric: { label: 'Electric', className: 'bg-success/10 text-success border-success/20' },
  hybrid: { label: 'Hybrid', className: 'bg-primary/10 text-primary border-primary/20' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-muted text-muted-foreground border-border' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', config.className)}>
      {config.label}
    </span>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse">
          <div className="flex justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="w-12 h-5 rounded-full bg-muted" />
          </div>
          <div className="h-7 w-20 rounded bg-muted mb-2" />
          <div className="h-4 w-28 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
