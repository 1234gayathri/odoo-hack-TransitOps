'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Truck,
  User,
  MapPin,
  Clock,
  Navigation,
  Package,
  Plus,
  Zap,
  ArrowRight,
  CircleDot,
  Gauge,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge } from '@/components/shared/page-components';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Driver, Vehicle, Trip, TripStatus } from '@/lib/types';

export default function DispatchPage() {
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // Dispatch Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('240');
  const [cargoType, setCargoType] = useState('General Freight');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dRes, vRes, tRes] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/vehicles'),
        fetch('/api/trips')
      ]);

      const [dData, vData, tData] = await Promise.all([
        dRes.json(),
        vRes.json(),
        tRes.json()
      ]);

      if (dRes.ok && vRes.ok && tRes.ok) {
        setDriversList(dData.drivers || []);
        setVehiclesList(vData.vehicles || []);
        setTripsList(tData.trips || []);
      } else {
        toast.error('Failed to retrieve dispatch records');
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Active trips: dispatched or in_transit
  const activeTrips = useMemo(() => {
    return tripsList.filter((t) => t.status === 'dispatched' || t.status === 'in_transit');
  }, [tripsList]);

  // Available drivers and vehicles for quick dispatch
  const availableDrivers = useMemo(() => {
    return driversList.filter((d) => d.status === 'available');
  }, [driversList]);

  const availableVehicles = useMemo(() => {
    return vehiclesList.filter((v) => v.status === 'available');
  }, [vehiclesList]);

  const formatETA = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
      if (diffMins > 0) return `${diffMins}m`;
      return 'Arriving soon';
    } catch {
      return 'Calculating...';
    }
  };

  const formatDeparture = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const handleOpenDispatchModal = () => {
    if (!selectedDriver || !selectedVehicle) {
      toast.error('Please select both a driver and a vehicle');
      return;
    }
    setFormErrors({});
    setOrigin('');
    setDestination('');
    setDistance('200');
    setCargoType('General Freight');
    setPriority('normal');
    setIsDialogOpen(true);
  };

  const handleQuickDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const errs: Record<string, string> = {};
    if (!origin.trim()) errs.origin = 'Origin location is required.';
    if (!destination.trim()) errs.destination = 'Destination location is required.';
    if (!distance.trim() || isNaN(Number(distance))) errs.distance = 'Enter a valid mileage distance.';
    if (!cargoType.trim()) errs.cargoType = 'Cargo description is required.';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormLoading(true);

    const now = new Date();
    const eta = new Date(now.getTime() + (Number(distance) / 50) * 60 * 60 * 1000); // approx ETA based on 50mph

    const payload = {
      origin,
      destination,
      driverId: selectedDriver,
      vehicleId: selectedVehicle,
      status: 'dispatched' as TripStatus,
      departureTime: now.toISOString(),
      estimatedArrival: eta.toISOString(),
      distance,
      cargoType,
      priority
    };

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Trip Dispatched successfully!');
        setIsDialogOpen(false);
        setSelectedDriver(null);
        setSelectedVehicle(null);
        fetchData();
      } else {
        toast.error('Dispatch failed', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Dispatch Operations"
        description="Real-time dispatch board for active trip coordination."
      >
        <Button variant="outline" size="sm" onClick={fetchData}>
          <Radio className="w-4 h-4 mr-2 text-success" /> Sync Board
        </Button>
      </PageHeader>

      {loading ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px] mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading active operations...</p>
        </Card>
      ) : (
        <>
          {/* Status Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              {
                label: 'In Transit',
                value: tripsList.filter((t) => t.status === 'in_transit').length,
                icon: <Navigation className="w-5 h-5" />,
                color: 'hsl(var(--primary))',
              },
              {
                label: 'Dispatched',
                value: tripsList.filter((t) => t.status === 'dispatched').length,
                icon: <Zap className="w-5 h-5" />,
                color: 'hsl(var(--chart-5))',
              },
              {
                label: 'Available Drivers',
                value: availableDrivers.length,
                icon: <User className="w-5 h-5" />,
                color: 'hsl(var(--success))',
              },
              {
                label: 'Available Vehicles',
                value: availableVehicles.length,
                icon: <Truck className="w-5 h-5" />,
                color: 'hsl(var(--chart-2))',
              },
            ].map((s) => (
              <Card key={s.label} className="p-4 cursor-default">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${s.color}15`, color: s.color }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Active Trips Board */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CircleDot className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Active Trips</h2>
              <Badge variant="secondary" className="text-xs">{activeTrips.length} active</Badge>
            </div>

            {activeTrips.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Navigation className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">No active trips</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dispatch a new trip from the Quick Dispatch section below.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeTrips.map((trip) => (
                  <Card key={trip.id} className="hover:shadow-elevation-2 transition-shadow h-full">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              trip.status === 'in_transit' ? 'bg-primary animate-pulse' : 'bg-chart-5'
                            )}
                          />
                          <span className="text-xs font-mono text-muted-foreground">#{trip.id}</span>
                        </div>
                        <StatusBadge status={trip.status} />
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{trip.origin}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-medium mt-1">
                            <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{trip.destination}</span>
                          </div>
                        </div>
                      </div>

                      {/* Driver & Vehicle */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Avatar className="w-7 h-7 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                            {trip.driverName.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{trip.driverName}</p>
                          <p className="text-xs text-muted-foreground truncate">{trip.vehicleReg}</p>
                        </div>
                      </div>

                      {/* Trip Details */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Distance</p>
                          <p className="text-sm font-medium tabular-nums">{trip.distance} mi</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Departed</p>
                          <p className="text-sm font-medium">{formatDeparture(trip.departureTime)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ETA</p>
                          <p className="text-sm font-medium text-primary">{formatETA(trip.estimatedArrival)}</p>
                        </div>
                      </div>

                      {/* Cargo & Priority */}
                      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">{trip.cargoType}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            trip.priority === 'high' && 'border-destructive/30 text-destructive',
                            trip.priority === 'normal' && 'border-info/30 text-info',
                            trip.priority === 'low' && 'border-muted-foreground/30 text-muted-foreground',
                          )}
                        >
                          {trip.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Dispatch */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Quick Dispatch</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Available Drivers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-success" /> Available Drivers
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select a driver to assign to a new trip
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {availableDrivers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No drivers currently available
                    </p>
                  ) : (
                    availableDrivers.map((driver) => (
                      <button
                        key={driver.id}
                        onClick={() => setSelectedDriver(selectedDriver === driver.id ? null : driver.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                          selectedDriver === driver.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30 hover:bg-accent/30'
                        )}
                      >
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="bg-success/10 text-success text-xs font-semibold">
                            {driver.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {driver.experienceYears} yrs · {driver.totalTrips} trips
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium tabular-nums">{driver.safetyScore}</span>
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Available Vehicles */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-4 h-4 text-chart-2" style={{ color: 'var(--chart-2)' }} /> Available Vehicles
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select a vehicle to assign to a new trip
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {availableVehicles.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No vehicles currently available
                    </p>
                  ) : (
                    availableVehicles.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                          selectedVehicle === vehicle.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30 hover:bg-accent/30'
                        )}
                      >
                        <div className="w-9 h-9 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono font-medium truncate">{vehicle.registration}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {vehicle.make} {vehicle.model} · {vehicle.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium tabular-nums">{vehicle.healthScore}</span>
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Dispatch Action */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Zap className="w-5 h-5 text-primary" />
                    <span>
                      {selectedDriver && selectedVehicle
                        ? 'Ready to dispatch a new trip'
                        : 'Select a driver and vehicle to dispatch'}
                    </span>
                  </div>
                  <Button
                    onClick={handleOpenDispatchModal}
                    disabled={!selectedDriver || !selectedVehicle}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Dispatch Trip
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Dispatch Route Config Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Enter Dispatch Route details</DialogTitle>
            <DialogDescription>
              Assign the final origin, destination, cargo, and priority details before dispatching the driver.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickDispatch} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Origin Location *</Label>
              <Input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Houston, TX" />
              {formErrors.origin && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.origin}</span>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Destination Location *</Label>
              <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Dallas, TX" />
              {formErrors.destination && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.destination}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Route Distance (mi) *</Label>
                <Input value={distance} onChange={e => setDistance(e.target.value)} placeholder="e.g. 240" />
                {formErrors.distance && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.distance}</span>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Priority</Label>
                <select value={priority} onChange={e => setPriority(e.target.value as any)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Cargo Description *</Label>
              <Input value={cargoType} onChange={e => setCargoType(e.target.value)} placeholder="e.g. Electronics, Fresh Produce" />
              {formErrors.cargoType && <span className="text-[10px] text-destructive flex items-center gap-0.5"><AlertCircle className="w-3 h-3" /> {formErrors.cargoType}</span>}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Dispatching...' : 'Dispatch Now'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
