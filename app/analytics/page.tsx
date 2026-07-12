'use client';

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
import { tripTrendData, driverPerformanceData, fuelTrendData } from '@/lib/mock-data';
import { toast } from 'sonner';

const vehicleHealthData = [
  { category: 'Engine', excellent: 65, good: 25, attention: 10 },
  { category: 'Transmission', excellent: 70, good: 22, attention: 8 },
  { category: 'Brakes', excellent: 55, good: 30, attention: 15 },
  { category: 'Tires', excellent: 60, good: 28, attention: 12 },
  { category: 'Electrical', excellent: 75, good: 20, attention: 5 },
  { category: 'Body', excellent: 50, good: 35, attention: 15 },
];

const radarData = [
  { metric: 'Engine', value: 92, fullMark: 100 },
  { metric: 'Transmission', value: 88, fullMark: 100 },
  { metric: 'Brakes', value: 78, fullMark: 100 },
  { metric: 'Tires', value: 85, fullMark: 100 },
  { metric: 'Electrical', value: 95, fullMark: 100 },
  { metric: 'Body', value: 72, fullMark: 100 },
];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

export default function AnalyticsPage() {
  const handleExport = () => {
    toast.success('Analytics report exported successfully');
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Analytics"
        description="Executive analytics dashboard with real-time fleet insights and performance metrics."
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
      </PageHeader>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Fleet Utilization"
          value="84.2%"
          change="+4.1%"
          trend="up"
          icon={<Gauge className="w-5 h-5" />}
          color="hsl(var(--chart-1))"
          delay={0}
        />
        <KPICard
          label="On-Time Delivery"
          value="96.5%"
          change="+2.3%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
          color="hsl(var(--chart-2))"
          delay={0.05}
        />
        <KPICard
          label="Avg Fuel Efficiency"
          value="7.1 mpg"
          change="-0.3"
          trend="down"
          icon={<Fuel className="w-5 h-5" />}
          color="hsl(var(--chart-3))"
          delay={0.1}
        />
        <KPICard
          label="Safety Score"
          value="89.4"
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
            <AreaChart data={tripTrendData}>
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
              Trips completed per driver this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={driverPerformanceData} layout="vertical">
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
              <RadarChart data={radarData} outerRadius="75%">
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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
              <p className="text-2xl font-bold">8 / 10</p>
              <p className="text-xs text-success mt-1">80% operational rate</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
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
              <p className="text-2xl font-bold">284 mi</p>
              <p className="text-xs text-muted-foreground mt-1">Across 6 completed trips</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
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
              <p className="text-2xl font-bold">5 / 8</p>
              <p className="text-xs text-muted-foreground mt-1">62.5% active drivers</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
