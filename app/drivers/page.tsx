'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  MoreHorizontal,
  LayoutGrid,
  List,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
} from '@/components/ui/dropdown-menu';
import { drivers } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DriversPage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission(role, 'drivers', 'create');
  const canEdit = hasPermission(role, 'drivers', 'update');

  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerDriver, setDrawerDriver] = useState<typeof drivers[0] | null>(null);

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      const matchSearch = search === '' ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase()) ||
        d.licenseNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  return (
    <DashboardLayout>
      <PageHeader title="Drivers" description="Manage driver profiles, licenses, safety scores, and availability.">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        {canCreate && (
          <Button size="sm" onClick={() => toast.info('Driver registration form would open here')}>
            <Plus className="w-4 h-4 mr-2" /> Add Driver
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Drivers', value: drivers.length, color: 'text-foreground' },
          { label: 'Available', value: drivers.filter(d => d.status === 'available').length, color: 'text-success' },
          { label: 'On Trip', value: drivers.filter(d => d.status === 'on_trip').length, color: 'text-primary' },
          { label: 'Unverified', value: drivers.filter(d => !d.verified).length, color: 'text-destructive' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
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

      {filtered.length === 0 ? (
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

                  <div className="mt-4 pt-3 border-t border-border">
                    <StatusBadge status={d.status} />
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
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{d.avatar}</AvatarFallback>
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
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info(`Editing ${d.name}`); }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
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
                    <div key={d.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <d.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                        <p className="text-sm font-medium">{d.value}</p>
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
                    <div key={d.label} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <d.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                        <p className="text-sm font-medium">{d.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  {canEdit && (
                    <Button className="flex-1" onClick={() => toast.info(`Editing ${drawerDriver.name}`)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => toast.info('Viewing trip history')}>
                    <Eye className="w-4 h-4 mr-2" /> Trip History
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
