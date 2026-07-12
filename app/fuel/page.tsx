'use client';

import { useState, useMemo } from 'react';
import { Fuel, Plus, Download, Search, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { fuelLogs, fuelTrendData } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/rbac';
import { toast } from 'sonner';

export default function FuelPage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission(role, 'fuel', 'create');

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return fuelLogs.filter((f) => {
      return search === '' ||
        f.vehicleReg.toLowerCase().includes(search.toLowerCase()) ||
        f.station.toLowerCase().includes(search.toLowerCase());
    });
  }, [search]);

  const totalCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const avgEfficiency = (fuelLogs.reduce((s, f) => s + f.efficiency, 0) / fuelLogs.length).toFixed(1);

  return (
    <DashboardLayout>
      <PageHeader title="Fuel Logs" description="Track fuel consumption, costs, and efficiency across your fleet.">
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
        {canCreate && (
          <Button size="sm" onClick={() => toast.info('Fuel log entry form would open here')}>
            <Plus className="w-4 h-4 mr-2" /> Log Fuel
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Cost', value: `$${totalCost.toLocaleString()}`, color: 'text-foreground' },
          { label: 'Total Liters', value: totalLiters.toLocaleString(), color: 'text-primary' },
          { label: 'Avg Efficiency', value: `${avgEfficiency} L/100km`, color: 'text-success' },
          { label: 'Records', value: fuelLogs.length, color: 'text-foreground' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold mb-4">Fuel Cost Trend</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={fuelTrendData}>
                <defs>
                  <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="cost" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#fuelGrad)" name="Cost ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold mb-4">Fuel Volume Trend</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fuelTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="liters" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Liters" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by vehicle or station..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<Fuel className="w-7 h-7" />} title="No fuel logs found" description="Try adjusting your search." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="pl-4 text-sm">{f.date}</TableCell>
                    <TableCell className="font-mono text-xs">{f.vehicleReg}</TableCell>
                    <TableCell className="text-sm">{f.station}</TableCell>
                    <TableCell className="text-sm">{f.liters} L</TableCell>
                    <TableCell className="text-sm font-medium">${f.cost}</TableCell>
                    <TableCell className="text-sm tabular-nums">{f.odometer.toLocaleString()} mi</TableCell>
                    <TableCell className="text-sm">{f.efficiency} L/100km</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
