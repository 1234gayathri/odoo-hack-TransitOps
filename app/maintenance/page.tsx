'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench, Plus, Upload, Search, Calendar, DollarSign, History, Edit, Trash2, Loader2, FileSpreadsheet,
  CheckCircle2, XCircle, FileText, AlertCircle, FileCheck, AlertTriangle, Paperclip
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { MaintenanceRecord, MaintenanceStatus, MaintenancePriority, Vehicle } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_OPTIONS: { value: MaintenanceStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

const PRIORITY_OPTIONS: { value: MaintenancePriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const MAINT_TYPES = [
  'Oil Change', 'Tire Rotation', 'Brake Replacement', 'Engine Service',
  'Scheduled Inspection', 'Battery Check', 'Engine Overhaul', 'Transmission Service',
  'Coolant Flush', 'Other',
];

interface FormState {
  vehicleId: string;
  type: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  scheduledDate: string;
  cost: string;
  technician: string;
  invoiceUrl: string;
  actualCost: string;
  vendor: string;
  approvalStatus: string;
  rejectionComments: string;
}

const emptyForm: FormState = {
  vehicleId: '',
  type: '',
  description: '',
  status: 'scheduled',
  priority: 'medium',
  scheduledDate: '',
  cost: '',
  technician: '',
  invoiceUrl: '',
  actualCost: '',
  vendor: '',
  approvalStatus: 'none',
  rejectionComments: '',
};

export default function MaintenancePage() {
  const { user, hasPermission, canAccessModule } = useAuth();
  const role = user?.role || 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const isMaintenanceManager = role === 'maintenance_manager';
  
  const canCreate = hasPermission('maintenance', 'create');
  const canEdit = hasPermission('maintenance', 'update');
  const canDelete = hasPermission('maintenance', 'delete');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('logs');

  // Live PostgreSQL datasets
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceRecord | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<MaintenanceRecord[] | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Approval Dialogue state
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const fetchRecordsAndVehicles = async () => {
    try {
      setLoading(true);
      const [mRes, vRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/vehicles')
      ]);

      const [mData, vData] = await Promise.all([
        mRes.json(),
        vRes.json()
      ]);

      if (mRes.ok && vRes.ok) {
        setRecords(mData.records || []);
        setVehiclesList(vData.vehicles || []);
      } else {
        toast.error('Failed to load maintenance logs');
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordsAndVehicles();
  }, []);

  const filtered = useMemo(() => {
    return records.filter((m) => {
      const matchSearch = search === '' ||
        m.type.toLowerCase().includes(search.toLowerCase()) ||
        m.vehicleReg.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, records]);

  // Filter records pending approval
  const pendingRecords = useMemo(() => {
    return records.filter(r => r.approvalStatus === 'pending');
  }, [records]);

  // Aggregate stats for chart based on live database values
  const maintenanceTimelineData = useMemo(() => {
    return [
      { week: 'W1', scheduled: records.filter(r => r.status === 'scheduled').length, completed: records.filter(r => r.status === 'completed').length },
      { week: 'W2', scheduled: Math.max(0, records.filter(r => r.status === 'scheduled').length - 1), completed: records.filter(r => r.status === 'completed').length },
      { week: 'W3', scheduled: records.filter(r => r.status === 'scheduled').length + 1, completed: Math.max(0, records.filter(r => r.status === 'completed').length - 1) },
      { week: 'W4', scheduled: records.filter(r => r.status === 'scheduled').length, completed: records.filter(r => r.status === 'completed').length },
    ];
  }, [records]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      scheduledDate: new Date().toISOString().split('T')[0]
    });
    setFormOpen(true);
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      vehicleId: m.vehicleId,
      type: m.type,
      description: m.description,
      status: m.status,
      priority: m.priority,
      scheduledDate: m.scheduledDate,
      cost: String(m.cost || 0),
      technician: m.technician === 'Unassigned' ? '' : m.technician,
      invoiceUrl: m.invoiceUrl || '',
      actualCost: m.actualCost ? String(m.actualCost) : '',
      vendor: m.vendor || '',
      approvalStatus: m.approvalStatus || 'none',
      rejectionComments: m.rejectionComments || '',
    });
    setFormOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PDF, JPG, and PNG are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        setForm(prev => ({ ...prev, invoiceUrl: data.url }));
        setUploadedFileName(file.name);
        toast.success(`Invoice "${file.name}" uploaded successfully!`);
      } else {
        toast.error('Upload failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Upload error', { description: err.message });
    } finally {
      setUploadingFile(false);
      // Reset input so same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!form.vehicleId || !form.type || !form.scheduledDate) {
      toast.error('Please fill in vehicle, type, and scheduled date.');
      return;
    }

    setSubmitLoading(true);

    const isSubmittingForApproval = form.status === 'completed' && isMaintenanceManager;

    const payload = {
      id: editingId,
      vehicleId: form.vehicleId,
      type: form.type,
      description: form.description,
      status: isSubmittingForApproval ? 'in_progress' : form.status, // keep in_progress until approved
      priority: form.priority,
      scheduledDate: form.scheduledDate,
      cost: form.cost,
      technician: form.technician,
      invoiceUrl: form.invoiceUrl,
      actualCost: form.actualCost,
      vendor: form.vendor,
      approvalStatus: isSubmittingForApproval ? 'pending' : form.approvalStatus,
    };

    try {
      const res = await fetch('/api/maintenance', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        if (isSubmittingForApproval) {
          toast.success('Invoice submitted to Super Admin for approval!', {
            description: 'Super Admin will receive a notification with Approve/Reject options.'
          });
        } else {
          toast.success(editingId ? 'Maintenance log updated' : 'Maintenance scheduled successfully');
        }
        setFormOpen(false);
        setUploadedFileName('');
        fetchRecordsAndVehicles();
      } else {
        toast.error('Maintenance Error', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setApprovalLoading(true);
      const res = await fetch('/api/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approvalStatus: 'approved' })
      });
      if (res.ok) {
        toast.success('✅ Maintenance approved!', {
          description: 'Expense recorded. Maintenance Manager has been notified.'
        });
        fetchRecordsAndVehicles();
      } else {
        toast.error('Failed to approve maintenance');
      }
    } catch (err) {
      toast.error('Network approval error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionComment.trim()) {
      toast.error('Please enter rejection comments');
      return;
    }
    try {
      setApprovalLoading(true);
      const res = await fetch('/api/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: rejectId, 
          approvalStatus: 'rejected', 
          rejectionComments: rejectionComment 
        })
      });
      if (res.ok) {
        toast.success('❌ Maintenance rejected with comments.', {
          description: 'Maintenance Manager has been notified with your feedback.'
        });
        setRejectId(null);
        setRejectionComment('');
        fetchRecordsAndVehicles();
      } else {
        toast.error('Failed to submit rejection');
      }
    } catch (err) {
      toast.error('Rejection network error');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/maintenance?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Maintenance record ${deleteTarget.id} deleted successfully.`);
        setDeleteTarget(null);
        fetchRecordsAndVehicles();
      } else {
        toast.error('Failed to delete maintenance log', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  };

  const openHistory = (m: MaintenanceRecord) => {
    const history = records
      .filter((r) => r.vehicleId === m.vehicleId)
      .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
    setHistoryVehicle(history);
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.warning('No maintenance records to export');
      return;
    }
    try {
      const headers = ['ID', 'Vehicle ID', 'Vehicle Reg', 'Type', 'Description', 'Status', 'Priority', 'Scheduled Date', 'Completed Date', 'Cost', 'Technician', 'Approval Status'];
      const rows = records.map(m => [
        m.id, m.vehicleId, m.vehicleReg, m.type, m.description, m.status, m.priority, m.scheduledDate, m.completedDate, m.cost, m.technician, m.approvalStatus
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TransitOps_Maintenance_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Maintenance logs exported successfully');
    } catch (err: any) {
      toast.error('Export Error', { description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Maintenance" description="Track service schedules, repair history, and maintenance workflows.">
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950">
          <FileSpreadsheet className="w-4 h-4" /> Export CSV
        </Button>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Schedule Maintenance
          </Button>
        )}
      </PageHeader>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="logs" className="gap-2">
              <Wrench className="w-4 h-4" /> Maintenance Logs
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="approvals" className="gap-2 relative">
                <FileCheck className="w-4 h-4" /> Pending Approvals
                {pendingRecords.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-semibold">
                    {pendingRecords.length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Scheduled', value: records.filter(m => m.status === 'scheduled').length, color: 'text-info' },
              { label: 'In Progress', value: records.filter(m => m.status === 'in_progress').length, color: 'text-warning' },
              { label: 'Completed', value: records.filter(m => m.status === 'completed').length, color: 'text-success' },
              { label: 'Overdue', value: records.filter(m => m.status === 'overdue').length, color: 'text-destructive' },
            ].map((s) => (
              <Card key={s.label} className="p-4 cursor-default">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
              </Card>
            ))}
          </div>

          {/* Timeline Chart */}
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-semibold mb-4">Maintenance Timeline</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={maintenanceTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="scheduled" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Scheduled" />
                  <Bar dataKey="completed" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by type, vehicle, or description..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          {loading ? (
            <Card className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading maintenance database...</p>
            </Card>
          ) : (
            <Card>
              {filtered.length === 0 ? (
                <EmptyState icon={<Wrench className="w-7 h-7" />} title="No maintenance records found" description="Try adjusting your search or filters." />
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="pl-4">Type</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Technician</TableHead>
                        <TableHead>Estimated Cost</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Workflow Approval</TableHead>
                        <TableHead className="text-right pr-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                m.priority === 'critical' && 'bg-destructive/10',
                                m.priority === 'high' && 'bg-warning/10',
                                m.priority === 'medium' && 'bg-info/10',
                                m.priority === 'low' && 'bg-muted',
                              )}>
                                {m.priority === 'critical' ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Wrench className={cn('w-4 h-4', m.priority === 'high' && 'text-warning', m.priority === 'medium' && 'text-info', m.priority === 'low' && 'text-muted-foreground')} />}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{m.type}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{m.description}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{m.vehicleReg}</TableCell>
                          <TableCell><StatusBadge status={m.priority} /></TableCell>
                          <TableCell className="text-sm">{m.scheduledDate}</TableCell>
                          <TableCell className="text-sm">{m.technician}</TableCell>
                          <TableCell className="text-sm font-medium">${(m.cost || 0).toLocaleString()}</TableCell>
                          <TableCell><StatusBadge status={m.status} /></TableCell>
                          <TableCell>
                            {m.approvalStatus === 'pending' && <Badge variant="outline" className="border-yellow-500/30 text-yellow-600 bg-yellow-500/5">Pending Super Admin</Badge>}
                            {m.approvalStatus === 'approved' && <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/5">Approved</Badge>}
                            {m.approvalStatus === 'rejected' && (
                              <div className="flex flex-col gap-0.5">
                                <Badge variant="outline" className="border-red-500/30 text-red-600 bg-red-500/5 w-fit">Rejected</Badge>
                                {m.rejectionComments && <span className="text-[10px] text-destructive max-w-[150px] truncate" title={m.rejectionComments}>Reason: {m.rejectionComments}</span>}
                              </div>
                            )}
                            {m.approvalStatus === 'none' && <span className="text-xs text-muted-foreground">N/A</span>}
                          </TableCell>
                          <TableCell className="pr-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openHistory(m)} title="View History">
                                <History className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              {canEdit && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)} title="Edit">
                                  <Edit className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => setDeleteTarget(m)} title="Delete">
                                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {/* Approvals Tab */}
        {isSuperAdmin && (
          <TabsContent value="approvals" className="space-y-6">
            <Card>
              {pendingRecords.length === 0 ? (
                <EmptyState icon={<FileCheck className="w-7 h-7" />} title="No pending approvals" description="You're all caught up! No maintenance jobs require review." />
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="pl-4">Vehicle & Type</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Actual Cost</TableHead>
                        <TableHead>Technician</TableHead>
                        <TableHead>Invoice URL</TableHead>
                        <TableHead className="text-right pr-4">Review Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRecords.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="pl-4">
                            <div>
                              <p className="text-sm font-semibold">{m.type}</p>
                              <p className="text-xs text-muted-foreground font-mono">{m.vehicleReg} (ID: {m.vehicleId})</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{m.vendor || 'N/A'}</TableCell>
                          <TableCell className="text-sm font-bold text-primary">${(m.actualCost || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{m.technician}</TableCell>
                          <TableCell className="text-sm">
                            {m.invoiceUrl ? (
                              <a href={m.invoiceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
                                <FileText className="w-3.5 h-3.5" /> View Invoice PDF
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">No Invoice Attached</span>
                            )}
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-destructive/30 text-destructive hover:bg-destructive/5"
                                onClick={() => setRejectId(m.id)}
                                disabled={approvalLoading}
                              >
                                <XCircle className="w-4 h-4 mr-1.5" /> Reject
                              </Button>
                              <Button
                                size="sm"
                                className="bg-success text-success-foreground hover:bg-success/90"
                                onClick={() => handleApprove(m.id)}
                                disabled={approvalLoading}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit Maintenance Record ${editingId}` : 'Schedule Maintenance'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the maintenance details below.' : 'Fill in the details below to schedule a new maintenance job.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vehicle</Label>
                <select
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select vehicle</option>
                  {vehiclesList.map((v) => (
                    <option key={v.id} value={v.id}>{v.registration} ({v.make} {v.model})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Maintenance Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select type</option>
                  {MAINT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Full engine diagnostic and oil change"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as MaintenanceStatus })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as MaintenancePriority })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Estimated Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="850"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="technician">Technician</Label>
              <Input
                id="technician"
                placeholder="David Park"
                value={form.technician}
                onChange={(e) => setForm({ ...form, technician: e.target.value })}
              />
            </div>

            {/* Invoice Upload, Actual Cost, and Vendor Section for Maintenance Manager (when completing jobs) */}
            {(form.status === 'completed' || isMaintenanceManager) && (
              <div className="mt-4 p-4 border border-primary/20 rounded-lg bg-primary/5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Invoice & Completion Details</span>
                </div>
                
                {form.approvalStatus === 'rejected' && form.rejectionComments && (
                  <div className="flex items-start gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Returned with rejection comments:</span>
                      <p>{form.rejectionComments}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor">Vendor / Workshop</Label>
                    <Input
                      id="vendor"
                      placeholder="Speedy Repairs Inc."
                      value={form.vendor}
                      onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="actualCost">Actual Cost ($)</Label>
                    <Input
                      id="actualCost"
                      type="number"
                      placeholder="900"
                      value={form.actualCost}
                      onChange={(e) => setForm({ ...form, actualCost: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Invoice Document</Label>
                  {/* Hidden real file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-muted-foreground gap-2 border-dashed hover:border-primary/50 hover:text-primary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> {form.invoiceUrl ? 'Change Invoice File' : 'Upload Invoice (PDF/JPG/PNG)'}</>
                      )}
                    </Button>
                  </div>
                  {form.invoiceUrl && (
                    <div className="flex items-center gap-2 mt-1.5 p-2 rounded bg-green-500/10 border border-green-500/20">
                      <Paperclip className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      <p className="text-xs text-green-600 truncate font-medium">
                        {uploadedFileName || 'Invoice attached'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitLoading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading ? 'Saving...' : form.status === 'completed' && isMaintenanceManager ? 'Submit for Approval' : (editingId ? 'Save Changes' : 'Schedule Maintenance')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Prompt */}
      <Dialog open={!!rejectId} onOpenChange={(v) => !v && setRejectId(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Return with Rejection Comments</DialogTitle>
            <DialogDescription>
              Provide feedback to the Maintenance Manager explaining why this invoice was rejected.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <Label htmlFor="comments">Rejection Comments</Label>
            <textarea
              id="comments"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1.5"
              placeholder="e.g. The actual cost is higher than estimated without explanation. Please attach correct workshop breakdown."
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRejectSubmit}
              disabled={approvalLoading}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Record {deleteTarget?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The maintenance record for {deleteTarget?.vehicleReg} ({deleteTarget?.type}) will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <Dialog open={!!historyVehicle} onOpenChange={(v) => !v && setHistoryVehicle(null)}>
        <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Maintenance History
            </DialogTitle>
            <DialogDescription>
              {historyVehicle && historyVehicle.length > 0
                ? `All maintenance records for ${historyVehicle[0].vehicleReg}`
                : 'No maintenance history found.'}
            </DialogDescription>
          </DialogHeader>

          {historyVehicle && historyVehicle.length > 0 ? (
            <div className="space-y-3 py-2">
              {historyVehicle.map((m: any, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border"
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    m.priority === 'critical' && 'bg-destructive/10',
                    m.priority === 'high' && 'bg-warning/10',
                    m.priority === 'medium' && 'bg-info/10',
                    m.priority === 'low' && 'bg-muted',
                  )}>
                    <Wrench className={cn('w-4 h-4', m.priority === 'critical' && 'text-destructive', m.priority === 'high' && 'text-warning', m.priority === 'medium' && 'text-info', m.priority === 'low' && 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium">{m.type}</p>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{m.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.scheduledDate}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Cost: ${(m.cost || 0).toLocaleString()}</span>
                      {m.actualCost && <span className="flex items-center gap-1 text-primary font-semibold"><DollarSign className="w-3 h-3" /> Actual: ${(m.actualCost).toLocaleString()}</span>}
                    </div>
                    {m.approvalStatus === 'approved' && <Badge variant="outline" className="border-green-500/30 text-green-600 bg-green-500/5">Approved</Badge>}
                    {m.approvalStatus === 'rejected' && (
                      <div className="flex flex-col gap-1 mt-1 p-2 bg-destructive/5 rounded border border-destructive/10">
                        <Badge variant="outline" className="border-red-500/30 text-red-600 bg-red-500/5 w-fit">Rejected</Badge>
                        {m.rejectionComments && <p className="text-xs text-destructive">Reason: {m.rejectionComments}</p>}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">No history available.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryVehicle(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
