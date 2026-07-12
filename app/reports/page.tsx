'use client';

import { motion } from 'framer-motion';
import {
  FileBarChart,
  Truck,
  UserCog,
  Route,
  Receipt,
  Fuel,
  Wrench,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-components';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const REPORT_CATEGORIES = [
  {
    id: 'vehicle',
    title: 'Vehicle Reports',
    description: 'Fleet inventory, utilization, health scores, and maintenance history.',
    icon: Truck,
    color: 'hsl(var(--chart-1))',
    reports: 12,
  },
  {
    id: 'driver',
    title: 'Driver Reports',
    description: 'Driver performance, safety scores, license status, and trip history.',
    icon: UserCog,
    color: 'hsl(var(--chart-5))',
    reports: 8,
  },
  {
    id: 'trip',
    title: 'Trip Reports',
    description: 'Trip summaries, route analytics, delivery times, and completion rates.',
    icon: Route,
    color: 'hsl(var(--chart-2))',
    reports: 15,
  },
  {
    id: 'expense',
    title: 'Expense Reports',
    description: 'Operational costs, budget tracking, approvals, and spending breakdowns.',
    icon: Receipt,
    color: 'hsl(var(--chart-4))',
    reports: 9,
  },
  {
    id: 'fuel',
    title: 'Fuel Reports',
    description: 'Fuel consumption, efficiency trends, station analytics, and cost analysis.',
    icon: Fuel,
    color: 'hsl(var(--chart-3))',
    reports: 6,
  },
  {
    id: 'maintenance',
    title: 'Maintenance Reports',
    description: 'Service schedules, repair costs, downtime tracking, and technician logs.',
    icon: Wrench,
    color: 'hsl(var(--warning))',
    reports: 11,
  },
];

const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF Document', icon: FileText, color: 'text-destructive' },
  { id: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet, color: 'text-success' },
  { id: 'csv', label: 'CSV File', icon: File, color: 'text-info' },
];

export default function ReportsPage() {
  const handleGenerate = (title: string) => {
    toast.success(`Generating "${title}" report...`, {
      description: 'You will be notified when the report is ready.',
    });
  };

  const handleExport = (format: string) => {
    toast.success(`Exporting data as ${format.toUpperCase()}...`, {
      description: 'Your download will begin shortly.',
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        description="Generate, export, and analyze comprehensive fleet reports."
      />

      {/* Report Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {REPORT_CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card className="h-full hover:shadow-elevation-2 transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {cat.reports} templates
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-3">{cat.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{cat.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleGenerate(cat.title)}
                  >
                    <FileBarChart className="w-4 h-4 mr-2" /> Generate Report
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Export Options</CardTitle>
            <CardDescription className="text-xs">
              Download consolidated fleet data in your preferred format
            </CardDescription>
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {EXPORT_FORMATS.map((fmt, i) => {
              const Icon = fmt.icon;
              return (
                <motion.div
                  key={fmt.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    onClick={() => handleExport(fmt.label)}
                    className="w-full flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-all text-left"
                  >
                    <Icon className={fmt.color} style={{ width: '2.5rem', height: '2.5rem' }} />
                    <div className="text-center">
                      <p className="text-sm font-medium">{fmt.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Full dataset export
                      </p>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recently Generated Reports</CardTitle>
          <CardDescription className="text-xs">
            Your latest report generation history
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {[
              { name: 'Q2 Fleet Utilization Summary', type: 'Vehicle', date: 'Jul 12, 2026', size: '2.4 MB' },
              { name: 'Driver Safety Score Analysis', type: 'Driver', date: 'Jul 10, 2026', size: '1.8 MB' },
              { name: 'Monthly Fuel Cost Breakdown', type: 'Fuel', date: 'Jul 08, 2026', size: '920 KB' },
              { name: 'H1 Expense & Budget Report', type: 'Expense', date: 'Jul 05, 2026', size: '3.1 MB' },
            ].map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {r.date}
                      </span>
                      <span>· {r.size}</span>
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toast.info(`Downloading "${r.name}"...`)}>
                  <Download className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
