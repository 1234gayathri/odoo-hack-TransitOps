'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCog,
  Plus,
  Download,
  Search,
  Star,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  Calendar,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  LayoutGrid,
  List,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import type { Driver, DriverStatus, Trip } from '@/lib/types';

export default function DriversPage() {
  const { user, hasPermission, canAccessModule } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission('drivers', 'create');
  const canEdit = hasPermission('drivers', 'update');

  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerDriver, setDrawerDriver] = useState<Driver | null>(null);

  // Dialog Add/Edit State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [safetyScore, setSafetyScore] = useState('95');
  const [experienceYears, setExperienceYears] = useState('');
  const [status, setStatus] = useState<DriverStatus>('available');
  const [verified, setVerified] = useState(true);
  const [totalTrips, setTotalTrips] = useState('0');
  const [rating, setRating] = useState('5.0');
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Trip History Dialog State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyDriverName, setHistoryDriverName] = useState('');
  const [driverTrips, setDriverTrips] = useState<Trip[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/drivers');
      const data = await res.json();
      if (res.ok) {
        setDriversList(data.drivers || []);
      } else {
        toast.error('Failed to load drivers', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const stats = useMemo(() => {
    return [
      { label: 'Total Drivers', value: driversList.length, color: 'text-foreground' },
      { label: 'Available', value: driversList.filter(d => d.status === 'available').length, color: 'text-success' },
      { label: 'On Trip', value: driversList.filter(d => d.status === 'on_trip').length, color: 'text-primary' },
      { label: 'Unverified', value: driversList.filter(d => !d.verified).length, color: 'text-destructive' },
    ];
  }, [driversList]);

  const filtered = useMemo(() => {
    return driversList.filter((d) => {
      const matchSearch = search === '' ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase()) ||
        d.licenseNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [driversList, search, statusFilter]);

  const openFormDialog = (d: Driver | null = null) => {
    setFormErrors({});
    if (d) {
      setEditingDriver(d);
      setName(d.name);
      setEmail(d.email);
      setPhone(d.phone);
      setLicenseNumber(d.licenseNumber);
      setLicenseExpiry(d.licenseExpiry);
      setSafetyScore(String(d.safetyScore));
      setExperienceYears(String(d.experienceYears));
      setStatus(d.status);
      setVerified(d.verified);
      setTotalTrips(String(d.totalTrips));
      setRating(String(d.rating));
    } else {
      setEditingDriver(null);
      setName('');
      setEmail('');
      setPhone('');
      setLicenseNumber('');
      setLicenseExpiry(new Date().toISOString().split('T')[0]);
      setSafetyScore('95');
      setExperienceYears('5');
      setStatus('available');
      setVerified(true);
      setTotalTrips('0');
      setRating('5.0');
    }
    setIsDialogOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
    if (!phone.trim()) errs.phone = 'Phone number is required.';
    if (!licenseNumber.trim()) errs.licenseNumber = 'License number is required.';
    if (!licenseExpiry) errs.licenseExpiry = 'Expiry date is required.';
    if (!experienceYears.trim() || isNaN(Number(experienceYears))) errs.experienceYears = 'Enter experience years.';
    if (!safetyScore.trim() || isNaN(Number(safetyScore))) errs.safetyScore = 'Enter a safety score (0-100).';
    if (!rating.trim() || isNaN(Number(rating))) errs.rating = 'Enter a valid rating (1.0-5.0).';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormLoading(true);
    const isEdit = !!editingDriver;
    const url = '/api/drivers';
    const method = isEdit ? 'PUT' : 'POST';
    const payload = {
      id: editingDriver?.id,
      name,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      safetyScore,
      experienceYears,
      status,
      verified,
      totalTrips,
      rating
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isEdit ? 'Driver profile updated' : 'Driver registered successfully');
        setIsDialogOpen(false);
        fetchDrivers();
      } else {
        toast.error('Form Error', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDriver = async (id: string, driverName: string) => {
    if (!confirm(`Are you sure you want to delete driver "${driverName}"?`)) return;
    try {
      const res = await fetch(`/api/drivers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('Driver deleted successfully');
        fetchDrivers();
        if (drawerDriver?.id === id) setDrawerDriver(null);
      } else {
        toast.error('Failed to delete driver', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    }
  };

  const openTripHistory = async (driverId: string, dName: string) => {
    setHistoryDriverName(dName);
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    setDriverTrips([]);
    try {
      const res = await fetch(`/api/trips?driverId=${driverId}`);
      const data = await res.json();
      if (res.ok) {
        setDriverTrips(data.trips || []);
      } else {
        toast.error('Failed to load trips history', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleExportCSV = () => {
    if (driversList.length === 0) {
      toast.warning('No drivers to export');
      return;
    }
    try {
      const headers = ['ID', 'Name', 'Email', 'Phone', 'License Number', 'License Expiry', 'Safety Score', 'Experience Years', 'Status', 'Verified', 'Total Trips', 'Rating'];
      const rows = driversList.map(d => [
        d.id, d.name, d.email, d.phone, d.licenseNumber, d.licenseExpiry, d.safetyScore, d.experienceYears, d.status, d.verified, d.totalTrips, d.rating
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TransitOps_Drivers_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Drivers registry exported successfully');
    } catch (err: any) {
      toast.error('Export Error', { description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Drivers" description="Manage driver profiles, licenses, safety scores, and availability.">
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950">
          <FileSpreadsheet className="w-4 h-4" /> Export CSV
        </Button>
        {canCreate && (
          <Button size="sm" onClick={() => openFormDialog(null)}>
            <Plus className="w-4 h-4 mr-2" /> Add Driver
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 cursor-default">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or license number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
                <SelectItem value="off_duty">Off Duty</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-md p-0.5">
              <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('grid')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('table')}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading drivers list...</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UserCog className="w-7 h-7" />}
            title="No drivers found"
            description="Try adjusting your search or filters."
            action={<Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear Filters</Button>}
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card className="hover:shadow-elevation-2 transition-shadow cursor-pointer" onClick={() => setDrawerDriver(d)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {d.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.experienceYears} yrs exp</p>
                      </div>
                    </div>
                    {d.verified ? (
                      <ShieldCheck className="w-4 h-4 text-success" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-destructive" />
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Safety Score</span>
                      <span className={cn(
                        'text-sm font-bold',
                        d.safetyScore >= 90 && 'text-success',
                        d.safetyScore >= 75 && d.safetyScore < 90 && 'text-warning',
                        d.safetyScore < 75 && 'text-destructive',
                      )}>{d.safetyScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                        <span className="text-sm font-medium">{d.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total Trips</span>
                      <span className="text-sm font-medium">{d.totalTrips}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <StatusBadge status={d.status} />
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-primary" onClick={(e) => { e.stopPropagation(); openTripHistory(d.id, d.name); }}>
                      History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4">Driver</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Safety</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} className="cursor-pointer" onClick={() => setDrawerDriver(d)}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 text-xs font-semibold bg-primary/10 text-primary">
                          <AvatarFallback className="text-xs font-semibold">{d.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm">{d.name}</span>
                            {d.verified && <ShieldCheck className="w-3.5 h-3.5 text-success" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{d.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
                    <TableCell className="text-sm">{d.licenseExpiry}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'font-bold text-sm',
                        d.safetyScore >= 90 && 'text-success',
                        d.safetyScore >= 75 && d.safetyScore < 90 && 'text-warning',
                        d.safetyScore < 75 && 'text-destructive',
                      )}>{d.safetyScore}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                        <span className="text-sm">{d.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{d.totalTrips}</TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDrawerDriver(d); }}>
                            <Eye className="w-4 h-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openFormDialog(d); }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openTripHistory(d.id, d.name); }}>
                            <Star className="w-4 h-4 mr-2" /> Trip History
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {canEdit && (
                            <DropdownMenuItem className="text-destructive font-medium" onClick={(e) => { e.stopPropagation(); handleDeleteDriver(d.id, d.name); }}>
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
        </Card>
      )}

      {/* Driver Form Dialog (Add/Edit) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}</DialogTitle>
            <DialogDescription>
              {editingDriver
                ? 'Update driver license information, phone number, and platform stats.'
                : 'Fill in the forms below to register a new driver and assign a safety profile.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDriver} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
                {formErrors.name && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.name}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Email Address *</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. john@company.com" />
                {formErrors.email && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.email}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Phone Number *</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +1 555-0100" />
                {formErrors.phone && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.phone}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">License Number *</Label>
                <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="e.g. TX-CDL-998877" />
                {formErrors.licenseNumber && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.licenseNumber}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">License Expiry *</Label>
                <Input type="date" value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)} />
                {formErrors.licenseExpiry && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.licenseExpiry}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Experience Years *</Label>
                <Input value={experienceYears} onChange={e => setExperienceYears(e.target.value)} placeholder="e.g. 5" />
                {formErrors.experienceYears && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.experienceYears}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Safety Score (0-100) *</Label>
                <Input value={safetyScore} onChange={e => setSafetyScore(e.target.value)} placeholder="e.g. 95" />
                {formErrors.safetyScore && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.safetyScore}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Rating (1.0 - 5.0) *</Label>
                <Input value={rating} onChange={e => setRating(e.target.value)} placeholder="e.g. 4.8" />
                {formErrors.rating && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.rating}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status</Label>
                <select value={status} onChange={e => setStatus(e.target.value as DriverStatus)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="available">Available</option>
                  <option value="on_trip">On Trip</option>
                  <option value="off_duty">Off Duty</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">License Verified</Label>
                <select value={verified ? 'true' : 'false'} onChange={e => setVerified(e.target.value === 'true')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="true">Yes - Verified</option>
                  <option value="false">No - Pending</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Total Completed Trips</Label>
              <Input value={totalTrips} onChange={e => setTotalTrips(e.target.value)} placeholder="e.g. 100" />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Save Driver'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Driver Details Drawer */}
      <Sheet open={!!drawerDriver} onOpenChange={(v) => !v && setDrawerDriver(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto scrollbar-thin">
          {drawerDriver && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{drawerDriver.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      {drawerDriver.name}
                      {drawerDriver.verified && <ShieldCheck className="w-4 h-4 text-success" />}
                    </div>
                    <SheetDescription className="text-xs">{drawerDriver.experienceYears} years experience</SheetDescription>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Safety Score</p>
                    <p className={cn(
                      'text-lg font-bold',
                      drawerDriver.safetyScore >= 90 && 'text-success',
                      drawerDriver.safetyScore >= 75 && drawerDriver.safetyScore < 90 && 'text-warning',
                      drawerDriver.safetyScore < 75 && 'text-destructive',
                    )}>{drawerDriver.safetyScore}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Rating</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-warning text-warning" />
                      <span className="text-lg font-bold">{drawerDriver.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Contact Information</h4>
                  {[
                    { icon: Mail, label: 'Email', value: drawerDriver.email },
                    { icon: Phone, label: 'Phone', value: drawerDriver.phone },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0 text-sm">
                      <d.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                        <p className="font-medium">{d.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">License & Verification</h4>
                  {[
                    { icon: ShieldCheck, label: 'License Number', value: drawerDriver.licenseNumber },
                    { icon: Calendar, label: 'License Expiry', value: drawerDriver.licenseExpiry },
                    { icon: ShieldCheck, label: 'Verified', value: drawerDriver.verified ? 'Yes' : 'No' },
                  ].map((d) => (
                    <div key={d.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0 text-sm">
                      <d.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                        <p className="font-medium">{d.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  {canEdit && (
                    <Button className="flex-1" onClick={() => { setDrawerDriver(null); openFormDialog(drawerDriver); }}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => { setDrawerDriver(null); openTripHistory(drawerDriver.id, drawerDriver.name); }}>
                    <Eye className="w-4 h-4 mr-2" /> Trip History
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Driver Trip History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{historyDriverName}'s Trip History</DialogTitle>
            <DialogDescription>
              List of all trips assigned to this driver retrieved from the PostgreSQL database.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Loading history...</span>
              </div>
            ) : driverTrips.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">No trips found for this driver.</p>
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="pl-4">Trip ID</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverTrips.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="pl-4 font-mono font-medium text-xs">{t.id}</TableCell>
                        <TableCell className="text-xs">
                          <div>
                            <span className="font-semibold">{t.origin}</span>
                            <span className="text-muted-foreground"> → {t.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{t.vehicleReg}</TableCell>
                        <TableCell className="text-xs tabular-nums">{t.distance} mi</TableCell>
                        <TableCell><StatusBadge status={t.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryOpen(false)}>Close History</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
