'use client';

import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench, Plus, Download, Search, Calendar, DollarSign, Eye, Edit, Trash2,
  MoreHorizontal, AlertTriangle, History, FileText, X, Upload, Paperclip,
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { maintenanceRecords as initialRecords, maintenanceTimelineData, vehicles } from '@/lib/mock-data';
import type { MaintenanceRecord, MaintenanceStatus, MaintenancePriority, ServiceDocument } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/rbac';
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
  serviceDocuments: ServiceDocument[];
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
  serviceDocuments: [],
};

export default function MaintenancePage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission(role, 'maintenance', 'create');
  const canEdit = hasPermission(role, 'maintenance', 'update');
  const canDelete = hasPermission(role, 'maintenance', 'delete');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [records, setRecords] = useState<MaintenanceRecord[]>(initialRecords);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceRecord | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<MaintenanceRecord[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (m: MaintenanceRecord) => {
    setEditingId(m.id);
    setForm({
      vehicleId: m.vehicleId,
      type: m.type,
      description: m.description,
      status: m.status,
      priority: m.priority,
      scheduledDate: m.scheduledDate,
      cost: String(m.cost),
      technician: m.technician === 'Unassigned' ? '' : m.technician,
      serviceDocuments: m.serviceDocuments || [],
    });
    setFormOpen(true);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newDocs: ServiceDocument[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
    }));
    setForm((prev) => ({ ...prev, serviceDocuments: [...prev.serviceDocuments, ...newDocs] }));
  };

  const removeDoc = (idx: number) => {
    setForm((prev) => ({ ...prev, serviceDocuments: prev.serviceDocuments.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = () => {
    if (!form.vehicleId || !form.type || !form.scheduledDate) {
      toast.error('Please fill in vehicle, type, and scheduled date.');
      return;
    }
    const vehicle = vehicles.find((v) => v.id === form.vehicleId);
    if (!vehicle) {
      toast.error('Invalid vehicle selection.');
      return;
    }

    const payload = {
      vehicleId: form.vehicleId,
      vehicleReg: vehicle.registration,
      type: form.type,
      description: form.description,
      status: form.status,
      priority: form.priority,
      scheduledDate: form.scheduledDate,
      cost: Number(form.cost) || 0,
      technician: form.technician || 'Unassigned',
      serviceDocuments: form.serviceDocuments,
    };

    if (editingId) {
      setRecords((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...payload } : m)));
      toast.success(`Maintenance record ${editingId} updated successfully.`);
    } else {
      const newId = `m${Date.now()}`;
      setRecords((prev) => [{ ...payload, id: newId, completedDate: null }, ...prev]);
      toast.success(`Maintenance record ${newId} created successfully.`);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRecords((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    toast.success(`Maintenance record ${deleteTarget.id} deleted successfully.`);
    setDeleteTarget(null);
  };

  const openHistory = (m: MaintenanceRecord) => {
    const history = records.filter((r) => r.vehicleId === m.vehicleId).sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
    setHistoryVehicle(history);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout>
      <PageHeader title="Maintenance" description="Track service schedules, repair history, and maintenance workflows.">
        <Button variant="outline" size="sm" onClick={() => toast.info('Export started')}>
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Schedule Maintenance
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Scheduled', value: records.filter(m => m.status === 'scheduled').length, color: 'text-info' },
          { label: 'In Progress', value: records.filter(m => m.status === 'in_progress').length, color: 'text-warning' },
          { label: 'Completed', value: records.filter(m => m.status === 'completed').length, color: 'text-success' },
          { label: 'Overdue', value: records.filter(m => m.status === 'overdue').length, color: 'text-destructive' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Timeline Chart */}
      <Card className="mb-4">
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
      <Card className="mb-4">
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
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center',
                          m.priority === 'critical' && 'bg-destructive/10',
                          m.priority === 'high' && 'bg-warning/10',
                          m.priority === 'medium' && 'bg-info/10',
                          m.priority === 'low' && 'bg-muted',
                        )}>
                          {m.priority === 'critical' ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <Wrench className={cn('w-4 h-4', m.priority === 'high' && 'text-warning', m.priority === 'medium' && 'text-info', m.priority === 'low' && 'text-muted-foreground')} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.type}</p>
                          <p className="text-xs text-muted-foreground">{m.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.vehicleReg}</TableCell>
                    <TableCell><StatusBadge status={m.priority} /></TableCell>
                    <TableCell className="text-sm">{m.scheduledDate}</TableCell>
                    <TableCell className="text-sm">{m.technician}</TableCell>
                    <TableCell className="text-sm font-medium">${m.cost.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={m.status} /></TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openHistory(m)}
                          title="View History"
                        >
                          <History className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(m)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive"
                            onClick={() => setDeleteTarget(m)}
                            title="Delete"
                          >
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
                <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.registration} ({v.make} {v.model})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Maintenance Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {MAINT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as MaintenanceStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as MaintenancePriority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="cost">Cost ($)</Label>
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

            {/* Service Document Upload */}
            <div className="space-y-1.5">
              <Label>Service Documents</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload service documents</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, images, or any file format</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>
              {form.serviceDocuments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {form.serviceDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30">
                      <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 hover:text-destructive"
                        onClick={() => removeDoc(idx)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingId ? 'Save Changes' : 'Schedule Maintenance'}</Button>
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
              {historyVehicle.map((m, i) => (
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
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.scheduledDate}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${m.cost.toLocaleString()}</span>
                      <span>Technician: {m.technician}</span>
                    </div>
                    {m.serviceDocuments && m.serviceDocuments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.serviceDocuments.map((doc, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] gap-1">
                            <FileText className="w-3 h-3" /> {doc.name}
                          </Badge>
                        ))}
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
