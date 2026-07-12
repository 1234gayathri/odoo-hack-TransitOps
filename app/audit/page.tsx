'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Search,
  Download,
  History,
  Activity,
  X,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { auditLogs } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACTION_CONFIG: Record<string, { className: string }> = {
  LOGIN: { className: 'bg-info/10 text-info border-info/20' },
  LOGOUT: { className: 'bg-muted text-muted-foreground border-border' },
  CREATE: { className: 'bg-success/10 text-success border-success/20' },
  UPDATE: { className: 'bg-warning/10 text-warning border-warning/20' },
  DELETE: { className: 'bg-destructive/10 text-destructive border-destructive/20' },
  APPROVE: { className: 'bg-primary/10 text-primary border-primary/20' },
  REJECT: { className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const modules = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.module))).sort();
  }, []);

  const actions = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.action))).sort();
  }, []);

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        search === '' ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.ip.includes(search);
      const matchAction = actionFilter === 'all' || log.action === actionFilter;
      const matchModule = moduleFilter === 'all' || log.module === moduleFilter;
      return matchSearch && matchAction && matchModule;
    });
  }, [search, actionFilter, moduleFilter]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    toast.success('Audit logs exported successfully', {
      description: `${filtered.length} log entries exported.`,
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Audit Logs"
        description="Comprehensive audit trail of all system activities and user actions."
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Events', value: auditLogs.length, icon: <Activity className="w-5 h-5" />, color: 'hsl(var(--primary))' },
          { label: 'Unique Users', value: new Set(auditLogs.map((l) => l.user)).size, icon: <Shield className="w-5 h-5" />, color: 'hsl(var(--chart-2))' },
          { label: 'Modules Tracked', value: modules.length, icon: <History className="w-5 h-5" />, color: 'hsl(var(--chart-5))' },
          { label: 'Critical Actions', value: auditLogs.filter((l) => l.action === 'DELETE' || l.action === 'REJECT').length, icon: <Activity className="w-5 h-5" />, color: 'hsl(var(--destructive))' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 hover:shadow-elevation-2 transition-shadow">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${s.color}15`, color: s.color }}
                >
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, details, or IP address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || actionFilter !== 'all' || moduleFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(''); setActionFilter('all'); setModuleFilter('all'); }}
              >
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <div className="overflow-x-auto scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="pl-4">User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="pr-4 text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-accent/30"
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                          {log.user.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-medium',
                        ACTION_CONFIG[log.action]?.className || 'bg-muted text-muted-foreground border-border'
                      )}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{log.module}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate">{log.details}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">{log.ip}</span>
                  </TableCell>
                  <TableCell className="pr-4 text-right text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={<History className="w-7 h-7" />}
            title="No audit logs found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearch(''); setActionFilter('all'); setModuleFilter('all'); }}
              >
                Clear Filters
              </Button>
            }
          />
        )}

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {auditLogs.length} log entries
            </p>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
