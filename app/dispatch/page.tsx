'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge } from '@/components/shared/page-components';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { trips, drivers, vehicles } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function DispatchPage() {
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // Active trips: dispatched or in_transit
  const activeTrips = useMemo(() => {
    return trips.filter((t) => t.status === 'dispatched' || t.status === 'in_transit');
  }, []);

  // Available drivers and vehicles for quick dispatch
  const availableDrivers = useMemo(() => {
    return drivers.filter((d) => d.status === 'available');
  }, []);

  const availableVehicles = useMemo(() => {
    return vehicles.filter((v) => v.status === 'available');
  }, []);

  const formatETA = (iso: string) => {
    const date = new Date(iso);
    const now = new Date('2026-07-12T10:00:00Z');
    const diffMs = date.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`;
    if (diffMins > 0) return `${diffMins}m`;
    return 'Arriving soon';
  };

  const formatDeparture = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleQuickDispatch = () => {
    if (!selectedDriver || !selectedVehicle) {
      toast.error('Please select both a driver and a vehicle');
      return;
    }
    const driver = drivers.find((d) => d.id === selectedDriver);
    const vehicle = vehicles.find((v) => v.id === selectedVehicle);
    toast.success('Trip dispatched successfully', {
      description: `${driver?.name} assigned to ${vehicle?.registration}`,
    });
    setSelectedDriver(null);
    setSelectedVehicle(null);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Dispatch Operations"
        description="Real-time dispatch board for active trip coordination."
      >
        <Button variant="outline" size="sm">
          <Radio className="w-4 h-4 mr-2 text-success" /> Live
        </Button>
      </PageHeader>

      {/* Status Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: 'In Transit',
            value: trips.filter((t) => t.status === 'in_transit').length,
            icon: <Navigation className="w-5 h-5" />,
            color: 'hsl(var(--primary))',
          },
          {
            label: 'Dispatched',
            value: trips.filter((t) => t.status === 'dispatched').length,
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
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 hover:shadow-elevation-2 transition-shadow">
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
          </motion.div>
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
            {activeTrips.map((trip, i) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                whileHover={{ y: -2 }}
              >
                <Card className="hover:shadow-elevation-2 transition-shadow h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
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
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Route */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{trip.origin}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium mt-1">
                          <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{trip.destination}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
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
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{trip.cargoType}</span>
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
              </motion.div>
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
                availableDrivers.map((driver, i) => (
                  <motion.button
                    key={driver.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
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
                  </motion.button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Available Vehicles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-chart-2" style={{ color: 'hsl(var(--chart-2))' }} /> Available Vehicles
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
                availableVehicles.map((vehicle, i) => (
                  <motion.button
                    key={vehicle.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                      selectedVehicle === vehicle.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30 hover:bg-accent/30'
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(var(--chart-2) / 0.1)' }}>
                      <Truck className="w-4 h-4" style={{ color: 'hsl(var(--chart-2))' }} />
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
                  </motion.button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dispatch Action */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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
                  onClick={handleQuickDispatch}
                  disabled={!selectedDriver || !selectedVehicle}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" /> Dispatch Trip
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
