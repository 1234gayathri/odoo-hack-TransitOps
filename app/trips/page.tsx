'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Route,
  Plus,
  Download,
  Search,
  MapPin,
  Clock,
  User,
  Truck,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  KanbanSquare,
  List,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trips as initialTrips, drivers, vehicles } from '@/lib/mock-data';
import type { Trip, TripStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ViewMode = 'kanban' | 'table' | 'timeline';

const COLUMNS = [
  { key: 'planned', label: 'Planned', color: 'hsl(var(--info))' },
  { key: 'dispatched', label: 'Dispatched', color: 'hsl(var(--primary))' },
  { key: 'in_transit', label: 'In Transit', color: 'hsl(var(--primary))' },
  { key: 'completed', label: 'Completed', color: 'hsl(var(--success))' },
  { key: 'cancelled', label: 'Cancelled', color: 'hsl(var(--destructive))' },
];

const STATUS_OPTIONS: { value: TripStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
] as const;

interface FormState {
  origin: string;
  destination: string;
  driverId: string;
  vehicleId: string;
  status: TripStatus;
  departureTime: string;
  estimatedArrival: string;
  distance: string;
  cargoType: string;
  priority: 'low' | 'normal' | 'high';
}

const emptyForm: FormState = {
  origin: '',
  destination: '',
  driverId: '',
  vehicleId: '',
  status: 'planned',
  departureTime: '',
  estimatedArrival: '',
  distance: '',
  cargoType: '',
  priority: 'normal',
};

function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string {
  if (!local) return '';
  const d = new Date(local);
  if (isNaN(d.getTime())) return '';
  return d.toISOString();
}

export default function TripsPage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission(role, 'trips', 'create');
  const canEdit = hasPermission(role, 'trips', 'update');
  const canDelete = hasPermission(role, 'trips', 'delete');

  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [drawerTrip, setDrawerTrip] = useState<Trip | null>(null);
  const [tripList, setTripList] = useState<Trip[]>(initialTrips);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Trip | null>(null);

  const filtered = useMemo(() => {
    return tripList.filter((t) => {
      return search === '' ||
        t.origin.toLowerCase().includes(search.toLowerCase()) ||
        t.destination.toLowerCase().includes(search.toLowerCase()) ||
        t.driverName.toLowerCase().includes(search.toLowerCase()) ||
        t.vehicleReg.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, tripList]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (trip: Trip) => {
    setEditingId(trip.id);
    setForm({
      origin: trip.origin,
      destination: trip.destination,
      driverId: trip.driverId,
      vehicleId: trip.vehicleId,
      status: trip.status,
      departureTime: toLocalInput(trip.departureTime),
      estimatedArrival: toLocalInput(trip.estimatedArrival),
      distance: String(trip.distance),
      cargoType: trip.cargoType,
      priority: trip.priority,
    });
    setDrawerTrip(null);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.origin || !form.destination || !form.driverId || !form.vehicleId) {
      toast.error('Please fill in origin, destination, driver, and vehicle.');
      return;
    }
    const driver = drivers.find((d) => d.id === form.driverId);
    const vehicle = vehicles.find((v) => v.id === form.vehicleId);
    if (!driver || !vehicle) {
      toast.error('Invalid driver or vehicle selection.');
      return;
    }

    if (editingId) {
      setTripList((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                origin: form.origin,
                destination: form.destination,
                driverId: form.driverId,
                driverName: driver.name,
                vehicleId: form.vehicleId,
                vehicleReg: vehicle.registration,
                status: form.status,
                departureTime: toIso(form.departureTime),
                estimatedArrival: toIso(form.estimatedArrival),
                distance: Number(form.distance) || 0,
                cargoType: form.cargoType,
                priority: form.priority,
              }
            : t,
        ),
      );
      toast.success(`Trip ${editingId} updated successfully.`);
    } else {
      const newId = `t${Date.now()}`;
      const newTrip: Trip = {
        id: newId,
        origin: form.origin,
        destination: form.destination,
        driverId: form.driverId,
        driverName: driver.name,
        vehicleId: form.vehicleId,
        vehicleReg: vehicle.registration,
        status: form.status,
        departureTime: toIso(form.departureTime),
        estimatedArrival: toIso(form.estimatedArrival),
        distance: Number(form.distance) || 0,
        cargoType: form.cargoType,
        priority: form.priority,
      };
      setTripList((prev) => [newTrip, ...prev]);
      toast.success(`Trip ${newId} created successfully.`);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setTripList((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    if (drawerTrip?.id === deleteTarget.id) setDrawerTrip(null);
    toast.success(`Trip ${deleteTarget.id} deleted successfully.`);
    setDeleteTarget(null);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Trips" description="Plan, dispatch, and track all transport operations across your fleet.">
        <Button variant="outline" size="sm" onClick={() => toast.info('Export started')}>
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        {canCreate && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Create Trip
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {COLUMNS.map((col) => {
          const count = tripList.filter((t) => t.status === col.key).length;
          return (
            <Card key={col.key} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <p className="text-xs text-muted-foreground">{col.label}</p>
              </div>
              <p className="text-2xl font-bold">{count}</p>
            </Card>
          );
        })}
      </div>

      {/* Filters & View Toggle */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by route, driver, vehicle, or trip ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex border border-border rounded-md p-0.5">
              <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('kanban')}>
                <KanbanSquare className="w-4 h-4 mr-1.5" /> Kanban
              </Button>
              <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('table')}>
                <List className="w-4 h-4 mr-1.5" /> Table
              </Button>
              <Button variant={view === 'timeline' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('timeline')}>
                <GitBranch className="w-4 h-4 mr-1.5" /> Timeline
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Route className="w-7 h-7" />}
            title="No trips found"
            description="Try adjusting your search or create a new trip."
          />
        </Card>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {COLUMNS.map((col) => {
            const colTrips = filtered.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{colTrips.length}</Badge>
                </div>
                <div className="space-y-2.5 min-h-[100px]">
                  {colTrips.map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -2 }}
                      className="p-3 rounded-lg border border-border bg-card hover:shadow-elevation-2 transition-shadow cursor-pointer"
                      onClick={() => setDrawerTrip(t)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-muted-foreground">#{t.id}</span>
                        <Badge variant="outline" className={cn(
                          'text-[10px]',
                          t.priority === 'high' && 'border-destructive/30 text-destructive',
                          t.priority === 'normal' && 'border-info/30 text-info',
                          t.priority === 'low' && 'border-muted-foreground text-muted-foreground',
                        )}>{t.priority}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium truncate">{t.origin.split(',')[0]}</p>
                        <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        <p className="text-sm font-medium truncate">{t.destination.split(',')[0]}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="w-3 h-3" /> {t.driverName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Truck className="w-3 h-3" /> {t.vehicleReg}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> {new Date(t.departureTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : view === 'table' ? (
        <Card>
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4">Trip ID</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setDrawerTrip(t)}>
                    <TableCell className="pl-4 font-mono text-xs">#{t.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{t.origin.split(',')[0]}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{t.destination.split(',')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{t.driverName}</TableCell>
                    <TableCell className="font-mono text-xs">{t.vehicleReg}</TableCell>
                    <TableCell className="text-sm">{new Date(t.departureTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</TableCell>
                    <TableCell className="text-sm">{t.distance} mi</TableCell>
                    <TableCell className="text-sm">{t.cargoType}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDrawerTrip(t); }}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(t); }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit Trip
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete Trip
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
        </Card>
      ) : (
        /* Timeline View */
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {filtered.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-4 cursor-pointer"
                    onClick={() => setDrawerTrip(t)}
                  >
                    <div className="relative z-10 w-10 h-10 rounded-full border-2 border-background bg-card flex items-center justify-center shrink-0 shadow-elevation-1">
                      <Route className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">#{t.id}</span>
                          <span className="font-medium text-sm">{t.origin.split(',')[0]} → {t.destination.split(',')[0]}</span>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {t.driverName}</span>
                        <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> {t.vehicleReg}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(t.departureTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.distance} mi</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Details Drawer */}
      <Sheet open={!!drawerTrip} onOpenChange={(v) => !v && setDrawerTrip(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto scrollbar-thin">
          {drawerTrip && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Route className="w-5 h-5 text-primary" />
                  </div>
                  Trip #{drawerTrip.id}
                </SheetTitle>
                <SheetDescription>{drawerTrip.origin} → {drawerTrip.destination}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <StatusBadge status={drawerTrip.status} />
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Priority</p>
                    <Badge variant="outline" className={cn(
                      drawerTrip.priority === 'high' && 'border-destructive/30 text-destructive',
                      drawerTrip.priority === 'normal' && 'border-info/30 text-info',
                      drawerTrip.priority === 'low' && 'text-muted-foreground',
                    )}>{drawerTrip.priority}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Trip Details</h4>
                  {[
                    { icon: MapPin, label: 'Origin', value: drawerTrip.origin },
                    { icon: MapPin, label: 'Destination', value: drawerTrip.destination },
                    { icon: User, label: 'Driver', value: drawerTrip.driverName },
                    { icon: Truck, label: 'Vehicle', value: drawerTrip.vehicleReg },
                    { icon: Clock, label: 'Departure', value: new Date(drawerTrip.departureTime).toLocaleString() },
                    { icon: Clock, label: 'Est. Arrival', value: new Date(drawerTrip.estimatedArrival).toLocaleString() },
                    { icon: MapPin, label: 'Distance', value: `${drawerTrip.distance} miles` },
                    { icon: Route, label: 'Cargo Type', value: drawerTrip.cargoType },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <d.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                        <p className="text-sm font-medium">{d.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  {canEdit && (
                    <Button className="flex-1" onClick={() => openEdit(drawerTrip)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Trip
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => setDeleteTarget(drawerTrip)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => toast.info('Opening map preview')}>
                    <MapPin className="w-4 h-4 mr-2" /> Map
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? `Edit Trip #${editingId}` : 'Create New Trip'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the trip details below.' : 'Fill in the details below to plan a new trip.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  placeholder="Houston, TX"
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="Dallas, TX"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Driver</Label>
                <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle</Label>
                <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.registration} ({v.make} {v.model})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as TripStatus })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as 'low' | 'normal' | 'high' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label htmlFor="departure">Departure</Label>
                <Input
                  id="departure"
                  type="datetime-local"
                  value={form.departureTime}
                  onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="arrival">Est. Arrival</Label>
                <Input
                  id="arrival"
                  type="datetime-local"
                  value={form.estimatedArrival}
                  onChange={(e) => setForm({ ...form, estimatedArrival: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="distance">Distance (mi)</Label>
                <Input
                  id="distance"
                  type="number"
                  placeholder="239"
                  value={form.distance}
                  onChange={(e) => setForm({ ...form, distance: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cargo">Cargo Type</Label>
                <Input
                  id="cargo"
                  placeholder="Electronics"
                  value={form.cargoType}
                  onChange={(e) => setForm({ ...form, cargoType: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingId ? 'Save Changes' : 'Create Trip'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip #{deleteTarget?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The trip from {deleteTarget?.origin} to {deleteTarget?.destination} will be permanently removed.
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
    </DashboardLayout>
  );
}
