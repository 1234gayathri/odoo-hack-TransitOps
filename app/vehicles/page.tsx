'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Plus,
  Download,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  QrCode,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Vehicle, FuelType, VehicleStatus } from '@/lib/types';

type SortKey = 'registration' | 'make' | 'year' | 'odometer' | 'healthScore';
type SortDir = 'asc' | 'desc';

export default function VehiclesPage() {
  const { user, hasPermission, canAccessModule } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission('vehicles', 'create');
  const canEdit = hasPermission('vehicles', 'update');
  const canDelete = hasPermission('vehicles', 'delete');

  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('registration');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [drawerVehicle, setDrawerVehicle] = useState<Vehicle | null>(null);

  // Dialog Add/Edit State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [reg, setReg] = useState('');
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [capacity, setCapacity] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [status, setStatus] = useState<VehicleStatus>('available');
  const [odometer, setOdometer] = useState('');
  const [healthScore, setHealthScore] = useState('100');
  const [lastService, setLastService] = useState('');
  const [nextService, setNextService] = useState('');
  const [location, setLocation] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      if (res.ok) {
        setVehiclesList(data.vehicles || []);
      } else {
        toast.error('Failed to load vehicles', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const stats = useMemo(() => {
    return [
      { label: 'Total Vehicles', value: vehiclesList.length, color: 'text-foreground' },
      { label: 'Available', value: vehiclesList.filter(v => v.status === 'available').length, color: 'text-success' },
      { label: 'On Trip', value: vehiclesList.filter(v => v.status === 'on_trip').length, color: 'text-primary' },
      { label: 'In Maintenance', value: vehiclesList.filter(v => v.status === 'maintenance').length, color: 'text-warning' },
    ];
  }, [vehiclesList]);

  const filtered = useMemo(() => {
    let result = vehiclesList.filter((v) => {
      const matchSearch = search === '' ||
        v.registration.toLowerCase().includes(search.toLowerCase()) ||
        v.make.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        v.vin.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchFuel = fuelFilter === 'all' || v.fuelType === fuelFilter;
      return matchSearch && matchStatus && matchFuel;
    });

    result.sort((a, b) => {
      let av = a[sortKey] as any;
      let bv = b[sortKey] as any;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [vehiclesList, search, statusFilter, fuelFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === paged.length) {
      setSelected([]);
    } else {
      setSelected(paged.map((v) => v.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete the ${selected.length} selected vehicle(s)?`)) return;
    try {
      for (const id of selected) {
        await fetch(`/api/vehicles?id=${id}`, { method: 'DELETE' });
      }
      toast.success('Vehicles deleted successfully');
      setSelected([]);
      fetchVehicles();
    } catch (err: any) {
      toast.error('Deletion error', { description: err.message });
    }
  };

  const handleDeleteVehicle = async (id: string, registration: string) => {
    if (!confirm(`Are you sure you want to delete vehicle ${registration}?`)) return;
    try {
      const res = await fetch(`/api/vehicles?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Vehicle deleted successfully');
        fetchVehicles();
        if (drawerVehicle?.id === id) setDrawerVehicle(null);
      } else {
        toast.error('Failed to delete vehicle', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  };

  const openFormDialog = (v: Vehicle | null = null) => {
    setFormErrors({});
    if (v) {
      setEditingVehicle(v);
      setReg(v.registration);
      setVin(v.vin);
      setMake(v.make);
      setModel(v.model);
      setYear(String(v.year));
      setCapacity(String(v.capacity));
      setFuelType(v.fuelType);
      setStatus(v.status);
      setOdometer(String(v.odometer));
      setHealthScore(String(v.healthScore));
      setLastService(v.lastService);
      setNextService(v.nextService);
      setLocation(v.location);
    } else {
      setEditingVehicle(null);
      setReg('');
      setVin('');
      setMake('');
      setModel('');
      setYear(String(new Date().getFullYear()));
      setCapacity('20000');
      setFuelType('diesel');
      setStatus('available');
      setOdometer('0');
      setHealthScore('100');
      setLastService(new Date().toISOString().split('T')[0]);
      setNextService('-');
      setLocation('');
    }
    setIsDialogOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errs: Record<string, string> = {};
    if (!reg.trim()) errs.reg = 'Registration number is required.';
    if (!vin.trim()) errs.vin = 'VIN number is required.';
    if (!make.trim()) errs.make = 'Make is required.';
    if (!model.trim()) errs.model = 'Model is required.';
    if (!year.trim() || isNaN(Number(year))) errs.year = 'Enter a valid year.';
    if (!capacity.trim() || isNaN(Number(capacity))) errs.capacity = 'Enter a valid capacity.';
    if (!odometer.trim() || isNaN(Number(odometer))) errs.odometer = 'Enter a valid odometer reading.';
    if (!healthScore.trim() || isNaN(Number(healthScore))) errs.healthScore = 'Enter a valid health score (0-100).';
    if (!location.trim()) errs.location = 'Current location is required.';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormLoading(true);
    const isEdit = !!editingVehicle;
    const url = '/api/vehicles';
    const method = isEdit ? 'PUT' : 'POST';
    const payload = {
      id: editingVehicle?.id,
      registration: reg,
      vin,
      make,
      model,
      year,
      capacity,
      fuelType,
      status,
      odometer,
      healthScore,
      lastService,
      nextService,
      location
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? 'Vehicle updated successfully' : 'Vehicle added successfully');
        setIsDialogOpen(false);
        fetchVehicles();
      } else {
        toast.error('Form Error', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (vehiclesList.length === 0) {
      toast.warning('No vehicles to export');
      return;
    }
    try {
      const headers = ['ID', 'Registration', 'VIN', 'Make', 'Model', 'Year', 'Capacity', 'Fuel Type', 'Status', 'Odometer', 'Health Score', 'Location', 'Last Service', 'Next Service'];
      const rows = vehiclesList.map(v => [
        v.id, v.registration, v.vin, v.make, v.model, v.year, v.capacity, v.fuelType, v.status, v.odometer, v.healthScore, v.location, v.lastService, v.nextService
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TransitOps_Vehicles_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Vehicles exported successfully');
    } catch (err: any) {
      toast.error('Export Error', { description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Vehicles" description="Manage your fleet inventory, vehicle status, and maintenance schedules.">
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950">
          <FileSpreadsheet className="w-4 h-4" /> Export CSV
        </Button>
        {canCreate && (
          <Button size="sm" onClick={() => openFormDialog(null)}>
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        )}
      </PageHeader>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 cursor-default">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by registration, make, model, or VIN..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fuelFilter} onValueChange={(v) => { setFuelFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Fuel Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fuel Types</SelectItem>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== 'all' || fuelFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setFuelFilter('all'); }}>
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 mb-4 rounded-lg border border-primary/20 bg-primary/5"
        >
          <span className="text-sm font-medium">{selected.length} vehicle(s) selected</span>
          <div className="flex gap-2">
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Data Table */}
      {loading ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading vehicle records...</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[40px] pl-4">
                    <Checkbox
                      checked={selected.length === paged.length && paged.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('registration')}>
                    <div className="flex items-center gap-1">
                      Registration <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('year')}>
                    <div className="flex items-center gap-1">Year <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('odometer')}>
                    <div className="flex items-center gap-1">Odometer <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('healthScore')}>
                    <div className="flex items-center gap-1">Health <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((v) => (
                  <TableRow key={v.id} className={cn(selected.includes(v.id) && 'bg-primary/5')}>
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected.includes(v.id)}
                        onCheckedChange={() => toggleSelect(v.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center">
                          <QrCode className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-mono text-xs font-medium">{v.registration}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-sm">{v.make} {v.model}</span>
                        <p className="text-xs text-muted-foreground">{v.location}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{v.year}</TableCell>
                    <TableCell>
                      <StatusBadge status={v.fuelType} />
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{v.odometer.toLocaleString()} mi</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              v.healthScore >= 85 && 'bg-success',
                              v.healthScore >= 70 && v.healthScore < 85 && 'bg-warning',
                              v.healthScore < 70 && 'bg-destructive',
                            )}
                            style={{ width: `${v.healthScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium tabular-nums">{v.healthScore}</span>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDrawerVehicle(v)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onClick={() => openFormDialog(v)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {canDelete && (
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteVehicle(v.id, v.registration)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && (
            <EmptyState
              icon={<Truck className="w-7 h-7" />}
              title="No vehicles found"
              description="Try adjusting your search or filters."
              action={
                <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); setFuelFilter('all'); }}>
                  Clear Filters
                </Button>
              }
            />
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Vehicle Form Dialog (Add/Edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}</DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? 'Update parameters, location, and service logs in the active fleet registry.'
                : 'Add a new vehicle and enter registration details, capacity, and service milestones.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVehicle} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Registration No. *</Label>
                <Input value={reg} onChange={e => setReg(e.target.value)} placeholder="e.g. FLT-2026-099" />
                {formErrors.reg && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.reg}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">VIN Number *</Label>
                <Input value={vin} onChange={e => setVin(e.target.value)} placeholder="e.g. 1HGCM8..." />
                {formErrors.vin && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.vin}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Make *</Label>
                <Input value={make} onChange={e => setMake(e.target.value)} placeholder="e.g. Volvo" />
                {formErrors.make && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.make}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Model *</Label>
                <Input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. FH16" />
                {formErrors.model && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.model}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Manufacture Year *</Label>
                <Input value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2025" />
                {formErrors.year && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.year}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Capacity (lbs) *</Label>
                <Input value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 24000" />
                {formErrors.capacity && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.capacity}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fuel Type</Label>
                <select value={fuelType} onChange={e => setFuelType(e.target.value as FuelType)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="diesel">Diesel</option>
                  <option value="petrol">Petrol</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status</Label>
                <select value={status} onChange={e => setStatus(e.target.value as VehicleStatus)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="available">Available</option>
                  <option value="on_trip">On Trip</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Odometer (mi) *</Label>
                <Input value={odometer} onChange={e => setOdometer(e.target.value)} placeholder="e.g. 45000" />
                {formErrors.odometer && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.odometer}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Health Score *</Label>
                <Input value={healthScore} onChange={e => setHealthScore(e.target.value)} placeholder="e.g. 100" />
                {formErrors.healthScore && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.healthScore}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Last Service *</Label>
                <Input type="date" value={lastService} onChange={e => setLastService(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Next Service</Label>
                <Input value={nextService} onChange={e => setNextService(e.target.value)} placeholder="e.g. 2026-09-15" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Current Location *</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Houston, TX" />
              {formErrors.location && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.location}</span>}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Save Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vehicle Details Drawer */}
      <Sheet open={!!drawerVehicle} onOpenChange={(v) => !v && setDrawerVehicle(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto scrollbar-thin">
          {drawerVehicle && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  {drawerVehicle.registration}
                </SheetTitle>
                <SheetDescription>{drawerVehicle.make} {drawerVehicle.model} ({drawerVehicle.year})</SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                {/* Status & Health */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <StatusBadge status={drawerVehicle.status} />
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                    <p className="text-lg font-bold">{drawerVehicle.healthScore}/100</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Vehicle Information</h4>
                  {[
                    { label: 'VIN', value: drawerVehicle.vin },
                    { label: 'Make & Model', value: `${drawerVehicle.make} ${drawerVehicle.model}` },
                    { label: 'Year', value: String(drawerVehicle.year) },
                    { label: 'Capacity', value: `${(drawerVehicle.capacity / 1000).toFixed(1)} tons` },
                    { label: 'Fuel Type', value: drawerVehicle.fuelType.charAt(0).toUpperCase() + drawerVehicle.fuelType.slice(1) },
                    { label: 'Odometer', value: `${drawerVehicle.odometer.toLocaleString()} mi` },
                    { label: 'Location', value: drawerVehicle.location },
                    { label: 'Last Service', value: drawerVehicle.lastService },
                    { label: 'Next Service', value: drawerVehicle.nextService },
                  ].map((d) => (
                    <div key={d.label} className="flex justify-between py-2 border-b border-border last:border-0 text-sm">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span className="font-medium text-right">{d.value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {canEdit && (
                    <Button className="flex-1" onClick={() => { setDrawerVehicle(null); openFormDialog(drawerVehicle); }}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Vehicle
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
