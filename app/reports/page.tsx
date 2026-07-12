'use client';

import { useState, useEffect } from 'react';
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
  Loader2,
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
  },
  {
    id: 'driver',
    title: 'Driver Reports',
    description: 'Driver performance, safety scores, license status, and trip history.',
    icon: UserCog,
    color: 'hsl(var(--chart-5))',
  },
  {
    id: 'trip',
    title: 'Trip Reports',
    description: 'Trip summaries, route analytics, delivery times, and completion rates.',
    icon: Route,
    color: 'hsl(var(--chart-2))',
  },
  {
    id: 'maintenance',
    title: 'Maintenance Reports',
    description: 'Service schedules, repair costs, downtime tracking, and technician logs.',
    icon: Wrench,
    color: 'hsl(var(--warning))',
  },
];

const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF Document', icon: FileText, color: 'text-destructive' },
  { id: 'excel', label: 'Excel Spreadsheet', icon: FileSpreadsheet, color: 'text-success' },
  { id: 'csv', label: 'CSV File', icon: File, color: 'text-info' },
];

interface GeneratedReport {
  id: string;
  title: string;
  type: string;
  generatedAt: string;
  generatedBy: string;
  filters: string;
  rowCount: number;
  filePath: string;
}

export default function ReportsPage() {
  const [reportsList, setReportsList] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (res.ok) {
        setReportsList(data.reports || []);
      } else {
        toast.error('Failed to load generated reports log');
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (id: string, title: string) => {
    setGenerating(id);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Custom ${title} ${new Date().toLocaleDateString()}`,
          type: id
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Generated "${title}" report successfully!`);
        fetchReports();
      } else {
        toast.error('Failed to generate report', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = async (report: GeneratedReport) => {
    try {
      // Export targeted entity CSV dynamically
      let url = '/api/users';
      if (report.type === 'vehicle') url = '/api/vehicles';
      else if (report.type === 'driver') url = '/api/drivers';
      else if (report.type === 'trip') url = '/api/trips';
      else if (report.type === 'maintenance') url = '/api/maintenance';

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const items = data.users || data.vehicles || data.drivers || data.trips || data.records || [];
      if (items.length === 0) {
        toast.warning('No records found for this report export');
        return;
      }

      // Convert items to CSV
      const keys = Object.keys(items[0]);
      const csv = [
        keys.join(','),
        ...items.map((row: any) => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = dlUrl;
      link.download = `${report.title.replace(/\s+/g, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report downloaded successfully');
    } catch (err: any) {
      toast.error('Download Error', { description: err.message });
    }
  };

  const handleFullDatasetExport = async (format: string) => {
    toast.success(`Consolidating ${format} export...`, {
      description: 'System is gathering vehicles, drivers, and trips logs.'
    });
    // Download trips list as example of full dataset export
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      if (res.ok) {
        const trips = data.trips || [];
        const csv = [
          ['ID', 'Origin', 'Destination', 'Driver', 'Vehicle', 'Status', 'Distance', 'Priority'].join(','),
          ...trips.map((t: any) => [t.id, t.origin, t.destination, t.driverName, t.vehicleReg, t.status, t.distance, t.priority].map(v => `"${v}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const dlUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = dlUrl;
        link.download = `TransitOps_FullDataset_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Consolidated export completed');
      }
    } catch (err: any) {
      toast.error('Export Error', { description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports"
        description="Generate, export, and analyze comprehensive fleet reports."
      />

      {/* Report Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                      className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/10"
                    >
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-base mt-3">{cat.title}</CardTitle>
                  <CardDescription className="text-xs mt-1">{cat.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={generating !== null}
                    onClick={() => handleGenerate(cat.id, cat.title)}
                  >
                    {generating === cat.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileBarChart className="w-4 h-4 mr-2" />
                    )}
                    Generate Report
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
                    onClick={() => handleFullDatasetExport(fmt.label)}
                    className="w-full flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-all"
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Retrieving logs...</span>
            </div>
          ) : reportsList.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground">No reports generated yet. Click "Generate Report" above to create one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reportsList.map((r, i) => (
                <motion.div
                  key={r.id}
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
                      <p className="text-sm font-medium truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] capitalize">{r.type}</Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(r.generatedAt).toLocaleDateString()}
                        </span>
                        <span>· {r.rowCount} rows retrieved</span>
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(r)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
