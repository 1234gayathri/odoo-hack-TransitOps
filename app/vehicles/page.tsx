'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Plus,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  QrCode,
  Eye,
  Edit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { vehicles } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { canAccessModule, hasPermission } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SortKey = 'registration' | 'make' | 'year' | 'odometer' | 'healthScore';
type SortDir = 'asc' | 'desc';

export default function VehiclesPage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission(role, 'vehicles', 'create');
  const canEdit = hasPermission(role, 'vehicles', 'update');
  const canDelete = hasPermission(role, 'vehicles', 'delete');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('registration');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [drawerVehicle, setDrawerVehicle] = useState<typeof vehicles[0] | null>(null);

  const filtered = useMemo(() => {
    let result = vehicles.filter((v) => {
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
  }, [search, statusFilter, fuelFilter, sortKey, sortDir]);

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

  const handleBulkDelete = () => {
    toast.success(`${selected.length} vehicle(s) selected for deletion`);
    setSelected([]);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Vehicles" description="Manage your fleet inventory, vehicle status, and maintenance schedules.">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        {canCreate && (
          <Button size="sm" onClick={() => toast.info('Vehicle registration form would open here')}>
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        )}
      </PageHeader>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Vehicles', value: vehicles.length, color: 'text-foreground' },
          { label: 'Available', value: vehicles.filter(v => v.status === 'available').length, color: 'text-success' },
          { label: 'On Trip', value: vehicles.filter(v => v.status === 'on_trip').length, color: 'text-primary' },
          { label: 'In Maintenance', value: vehicles.filter(v => v.status === 'maintenance').length, color: 'text-warning' },
        ].map((s, i) => (
          <Card key={s.label} className="p-4">
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
            <Button variant="outline" size="sm" onClick={() => toast.info('Exporting selected vehicles...')}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            {canDelete && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Data Table */}
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
                          <DropdownMenuItem onClick={() => toast.info(`Editing ${v.registration}`)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {canDelete && (
                          <DropdownMenuItem className="text-destructive" onClick={() => toast.info(`Deleting ${v.registration}`)}>
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
            description="Try adjusting your search or filters to find what you're looking for."
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
                    <div key={d.label} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted-foreground">{d.label}</span>
                      <span className="text-sm font-medium text-right">{d.value}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {canEdit && (
                    <Button className="flex-1" onClick={() => toast.info(`Editing ${drawerVehicle.registration}`)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Vehicle
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => toast.info('Opening maintenance history')}>
                    <Eye className="w-4 h-4 mr-2" /> History
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
