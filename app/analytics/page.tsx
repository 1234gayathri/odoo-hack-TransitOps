'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Truck,
  Users,
  Fuel,
  Download,
  Activity,
  ShieldCheck,
  Gauge,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  LineChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
import { toast } from 'sonner';

const vehicleHealthData = [
  { category: 'Engine', excellent: 65, good: 25, attention: 10 },
  { category: 'Transmission', excellent: 70, good: 22, attention: 8 },
  { category: 'Brakes', excellent: 55, good: 30, attention: 15 },
  { category: 'Tires', excellent: 60, good: 28, attention: 12 },
  { category: 'Electrical', excellent: 75, good: 20, attention: 5 },
  { category: 'Body', excellent: 50, good: 35, attention: 15 },
];

const fuelTrendData = [
  { month: 'Jan', cost: 12400, liters: 9800 },
  { month: 'Feb', cost: 13200, liters: 10200 },
  { month: 'Mar', cost: 14100, liters: 10800 },
  { month: 'Apr', cost: 13800, liters: 10600 },
  { month: 'May', cost: 15200, liters: 11400 },
  { month: 'Jun', cost: 14600, liters: 11200 },
  { month: 'Jul', cost: 16300, liters: 12100 },
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

interface AnalyticsStats {
  utilization: string;
  onTimeDelivery: string;
  avgFuelEfficiency: string;
  avgSafetyScore: string;
  totalVehicles: number;
  activeVehicles: number;
  avgTripDistance: string;
  totalDrivers: number;
  activeDrivers: number;
  driverPerformanceData: any[];
  tripTrendData: any[];
  radarData: any[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
      } else {
        toast.error('Failed to load analytics engine');
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = () => {
    if (!stats) return;
    try {
      const csvContent = [
        ['KPI Metric', 'Value'],
        ['Fleet Utilization', stats.utilization],
        ['On-Time Delivery', stats.onTimeDelivery],
        ['Avg Fuel Efficiency', stats.avgFuelEfficiency],
        ['Average Safety Score', stats.avgSafetyScore],
        ['Total Vehicles', stats.totalVehicles],
        ['Active Vehicles', stats.activeVehicles],
        ['Avg Trip Distance', stats.avgTripDistance],
        ['Total Drivers', stats.totalDrivers],
        ['Active Drivers', stats.activeDrivers]
      ].map(r => r.map(v => `"${v}"`).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TransitOps_Executive_Analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Analytics summary exported successfully');
    } catch (err: any) {
      toast.error('Export Error', { description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics"
        description="Executive analytics dashboard with real-time fleet insights and performance metrics."
      >
        <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
          <Download className="w-4 h-4 mr-2" /> Export Summary
        </Button>
      </PageHeader>

      {loading || !stats ? (
        <Card className="flex flex-col items-center justify-center min-h-[450px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Aggregating PostgreSQL fleet insights...</p>
        </Card>
      ) : (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              label="Fleet Utilization"
              value={stats.utilization}
              change="+4.1%"
              trend="up"
              icon={<Gauge className="w-5 h-5" />}
              color="hsl(var(--chart-1))"
              delay={0}
            />
            <KPICard
              label="On-Time Delivery"
              value={stats.onTimeDelivery}
              change="+2.3%"
              trend="up"
              icon={<TrendingUp className="w-5 h-5" />}
              color="hsl(var(--chart-2))"
              delay={0.05}
            />
            <KPICard
              label="Avg Fuel Efficiency"
              value={stats.avgFuelEfficiency}
              change="-0.3"
              trend="down"
              icon={<Fuel className="w-5 h-5" />}
              color="hsl(var(--chart-3))"
              delay={0.1}
            />
            <KPICard
              label="Safety Score"
              value={stats.avgSafetyScore}
              change="+1.2"
              trend="up"
              icon={<ShieldCheck className="w-5 h-5" />}
              color="hsl(var(--chart-5))"
              delay={0.15}
            />
          </div>

          {/* Fleet Performance Over Time - Large Area Chart */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Fleet Performance Over Time</CardTitle>
                <CardDescription className="text-xs">
                  Trip volume and completion trends across the fleet
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">Last 7 months</Badge>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={stats.tripTrendData}>
                  <defs>
                    <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="trips"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    fill="url(#tripsGrad)"
                    name="Total Trips"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fill="url(#completedGrad)"
                    name="Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Charts Row: Driver Performance + Vehicle Health Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Driver Performance Bar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Driver Performance</CardTitle>
                <CardDescription className="text-xs">
                  Trips completed per driver (Top 5)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.driverPerformanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={110}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      dataKey="trips"
                      fill="hsl(var(--chart-5))"
                      radius={[0, 4, 4, 0]}
                      name="Trips"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vehicle Health Distribution - Radar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Vehicle Health Distribution</CardTitle>
                <CardDescription className="text-xs">
                  Fleet health scores across key vehicle systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={stats.radarData} outerRadius="75%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="metric"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                    />
                    <PolarRadiusAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      domain={[0, 100]}
                      angle={90}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Radar
                      name="Health Score"
                      dataKey="value"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row: Fuel Efficiency + Vehicle Health Composed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Fuel Efficiency Trends - Line Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fuel Efficiency Trends</CardTitle>
                <CardDescription className="text-xs">
                  Monthly fuel cost and consumption patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={fuelTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="cost"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-3))', r: 3 }}
                      name="Cost ($)"
                    />
                    <Line
                      type="monotone"
                      dataKey="liters"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-1))', r: 3 }}
                      name="Liters"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vehicle Health Composed Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Vehicle Health Breakdown</CardTitle>
                <CardDescription className="text-xs">
                  Component health distribution across the fleet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={vehicleHealthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="excellent"
                      stackId="health"
                      fill="hsl(var(--chart-2))"
                      radius={[0, 0, 0, 0]}
                      name="Excellent"
                    />
                    <Bar
                      dataKey="good"
                      stackId="health"
                      fill="hsl(var(--chart-5))"
                      radius={[0, 0, 0, 0]}
                      name="Good"
                    />
                    <Bar
                      dataKey="attention"
                      stackId="health"
                      fill="hsl(var(--chart-4))"
                      radius={[4, 4, 0, 0]}
                      name="Needs Attention"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-elevation-2 transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Active Fleet</p>
                    <p className="text-xs text-muted-foreground">Currently operational</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.activeVehicles} / {stats.totalVehicles}</p>
                <p className="text-xs text-success mt-1">
                  {((stats.activeVehicles / stats.totalVehicles) * 100).toFixed(0)}% utilization rate
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevation-2 transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg Trip Distance</p>
                    <p className="text-xs text-muted-foreground">Per completed trip</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.avgTripDistance}</p>
                <p className="text-xs text-muted-foreground mt-1">Across all completed runs</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevation-2 transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Driver Utilization</p>
                    <p className="text-xs text-muted-foreground">Active vs total</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.activeDrivers} / {stats.totalDrivers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.activeDrivers / stats.totalDrivers) * 100).toFixed(0)}% active drivers rate
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
