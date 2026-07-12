'use client';

import { motion } from 'framer-motion';
import {
  Truck,
  Users,
  Wrench,
  Fuel,
  TrendingUp,
  Clock,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KPICard, PageHeader } from '@/components/shared/page-components';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth-context';
import { ROLES, canAccessModule } from '@/lib/rbac';
import {
  tripTrendData,
  fuelTrendData,
  expenseBreakdownData,
  fleetUtilizationData,
  maintenanceTimelineData,
  driverPerformanceData,
  vehicles,
  drivers,
  trips,
  maintenanceRecords,
  notifications,
  auditLogs,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const NOTIF_ICONS = {
  success: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';

  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
  const onTripVehicles = vehicles.filter((v) => v.status === 'on_trip').length;
  const availableDrivers = drivers.filter((d) => d.status === 'available').length;
  const onTripDrivers = drivers.filter((d) => d.status === 'on_trip').length;
  const maintenanceToday = maintenanceRecords.filter((m) => m.status === 'in_progress').length;
  const monthlyFuelCost = fuelTrendData[fuelTrendData.length - 1].cost;
  const monthlyExpenses = expenseBreakdownData.reduce((s, e) => s + e.value, 0);
  const completedTrips = trips.filter((t) => t.status === 'completed').length;
  const completionRate = Math.round((completedTrips / trips.length) * 100);
  const avgHealth = Math.round(vehicles.reduce((s, v) => s + v.healthScore, 0) / vehicles.length);

  const roleKPIs = getRoleKPIs(role, {
    availableVehicles, onTripVehicles, availableDrivers, onTripDrivers,
    maintenanceToday, monthlyFuelCost, monthlyExpenses, completionRate, avgHealth,
  });

  return (
    <DashboardLayout>
      <PageHeader title="Dashboard" description={`Welcome back, ${user?.name?.split(' ')[0]}. Here's your fleet overview for today.`}>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" /> Quick Action
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {roleKPIs.map((kpi, i) => (
          <KPICard key={kpi.label} {...kpi} delay={i * 0.05} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Fleet Utilization */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Fleet Utilization</CardTitle>
              <CardDescription className="text-xs">Weekly utilization rate across all vehicles</CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">This Week</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fleetUtilizationData}>
                <defs>
                  <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="utilization"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#utilGrad)"
                  name="Utilization %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expense Breakdown</CardTitle>
            <CardDescription className="text-xs">Monthly cost distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={expenseBreakdownData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {expenseBreakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {expenseBreakdownData.map((e) => (
                <div key={e.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="text-muted-foreground">{e.name}</span>
                  </div>
                  <span className="font-medium">${e.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Trip Trends */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Trip Trends</CardTitle>
            <CardDescription className="text-xs">Completed vs cancelled trips over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tripTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="completed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="cancelled" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fuel Consumption */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fuel Consumption</CardTitle>
            <CardDescription className="text-xs">Monthly fuel cost trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={fuelTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-1))', r: 3 }}
                  name="Cost ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Activity Feed + Upcoming Maintenance + Latest Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription className="text-xs">Latest system events</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-3">
                {auditLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {log.user.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{log.user}</span>{' '}
                        <span className="text-muted-foreground">{log.details}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {log.module} · {new Date(log.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Upcoming Maintenance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upcoming Maintenance</CardTitle>
            <CardDescription className="text-xs">Scheduled and overdue services</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-2.5">
                {maintenanceRecords.filter((m) => m.status !== 'completed').map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      m.priority === 'critical' && 'bg-destructive/10',
                      m.priority === 'high' && 'bg-warning/10',
                      m.priority === 'medium' && 'bg-info/10',
                      m.priority === 'low' && 'bg-muted',
                    )}>
                      <Wrench className={cn(
                        'w-4 h-4',
                        m.priority === 'critical' && 'text-destructive',
                        m.priority === 'high' && 'text-warning',
                        m.priority === 'medium' && 'text-info',
                        m.priority === 'low' && 'text-muted-foreground',
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.type}</p>
                      <p className="text-xs text-muted-foreground">{m.vehicleReg} · {m.scheduledDate}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      'text-[10px] shrink-0',
                      m.status === 'overdue' && 'border-destructive/30 text-destructive',
                      m.status === 'in_progress' && 'border-warning/30 text-warning',
                      m.status === 'scheduled' && 'border-info/30 text-info',
                    )}>
                      {m.status === 'in_progress' ? 'Active' : m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Latest Trips */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Latest Trips</CardTitle>
            <CardDescription className="text-xs">Recent and active trips</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-2.5">
                {trips.slice(0, 6).map((t) => (
                  <div key={t.id} className="p-2.5 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{t.origin.split(',')[0]} → {t.destination.split(',')[0]}</span>
                      <Badge variant="outline" className={cn(
                        'text-[10px]',
                        t.status === 'completed' && 'border-success/30 text-success',
                        t.status === 'in_transit' && 'border-primary/30 text-primary',
                        t.status === 'dispatched' && 'border-primary/30 text-primary',
                        t.status === 'planned' && 'border-info/30 text-info',
                        t.status === 'cancelled' && 'border-destructive/30 text-destructive',
                      )}>
                        {t.status === 'in_transit' ? 'Active' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{t.driverName} · {t.vehicleReg} · {t.distance} mi</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Live Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Live Notifications</CardTitle>
          <CardDescription className="text-xs">Real-time system alerts and updates</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notifications.map((n) => {
              const { icon: Icon, color, bg } = NOTIF_ICONS[n.type];
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex gap-3 p-3 rounded-lg border border-border hover:shadow-elevation-1 transition-shadow"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', bg)}>
                    <Icon className={cn('w-4 h-4', color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

function getRoleKPIs(role: string, data: any) {
  const all = [
    { label: 'Available Vehicles', value: data.availableVehicles, change: '+2', trend: 'up' as const, icon: <Truck className="w-5 h-5" />, color: 'hsl(var(--chart-2))' },
    { label: 'Vehicles on Trip', value: data.onTripVehicles, change: '+1', trend: 'up' as const, icon: <Activity className="w-5 h-5" />, color: 'hsl(var(--chart-1))' },
    { label: 'Available Drivers', value: data.availableDrivers, change: '0', trend: 'neutral' as const, icon: <Users className="w-5 h-5" />, color: 'hsl(var(--chart-5))' },
    { label: 'Drivers on Trip', value: data.onTripDrivers, change: '+1', trend: 'up' as const, icon: <Users className="w-5 h-5" />, color: 'hsl(var(--primary))' },
    { label: 'Maintenance Today', value: data.maintenanceToday, change: '+2', trend: 'up' as const, icon: <Wrench className="w-5 h-5" />, color: 'hsl(var(--warning))' },
    { label: 'Monthly Fuel Cost', value: `$${(data.monthlyFuelCost / 1000).toFixed(1)}K`, change: '+5.2%', trend: 'up' as const, icon: <Fuel className="w-5 h-5" />, color: 'hsl(var(--chart-3))' },
    { label: 'Monthly Expenses', value: `$${(data.monthlyExpenses / 1000).toFixed(1)}K`, change: '-2.1%', trend: 'down' as const, icon: <TrendingUp className="w-5 h-5" />, color: 'hsl(var(--chart-4))' },
    { label: 'Trip Completion Rate', value: `${data.completionRate}%`, change: '+3%', trend: 'up' as const, icon: <CheckCircle2 className="w-5 h-5" />, color: 'hsl(var(--success))' },
    { label: 'Vehicle Health Score', value: data.avgHealth, change: '+1', trend: 'up' as const, icon: <ShieldCheck className="w-5 h-5" />, color: 'hsl(var(--info))' },
    { label: 'Avg Trip Time', value: '4.2h', change: '-0.3h', trend: 'down' as const, icon: <Clock className="w-5 h-5" />, color: 'hsl(var(--chart-5))' },
  ];

  const roleMap: Record<string, number[]> = {
    super_admin: [0, 1, 6, 7],
    fleet_manager: [0, 1, 8, 9],
    dispatcher: [1, 3, 7, 9],
    safety_officer: [2, 3, 7, 8],
    maintenance_manager: [0, 4, 8, 9],
    finance_analyst: [5, 6, 7, 9],
  };

  const indices = roleMap[role] || [0, 1, 2, 3];
  return indices.map((i) => all[i]);
}
