export type Role =
  | 'super_admin'
  | 'fleet_manager'
  | 'dispatcher'
  | 'safety_officer'
  | 'maintenance_manager'
  | 'finance_analyst';

export type ModuleKey =
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'vehicles'
  | 'drivers'
  | 'trips'
  | 'dispatch'
  | 'maintenance'
  | 'fuel'
  | 'expenses'
  | 'reports'
  | 'analytics'
  | 'notifications'
  | 'audit'
  | 'settings'
  | 'profile';

export type Permission = 'full' | 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export' | 'none';

export type VehicleStatus = 'available' | 'on_trip' | 'maintenance' | 'retired';
export type FuelType = 'diesel' | 'petrol' | 'electric' | 'hybrid';
export type DriverStatus = 'available' | 'on_trip' | 'off_duty' | 'suspended';
export type TripStatus = 'planned' | 'dispatched' | 'in_transit' | 'completed' | 'cancelled';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  status: 'active' | 'inactive';
  lastActive: string;
}

export interface Vehicle {
  id: string;
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  fuelType: FuelType;
  status: VehicleStatus;
  odometer: number;
  healthScore: number;
  lastService: string;
  nextService: string;
  location: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  safetyScore: number;
  experienceYears: number;
  status: DriverStatus;
  verified: boolean;
  totalTrips: number;
  rating: number;
  avatar: string;
}

export interface Trip {
  id: string;
  origin: string;
  destination: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleReg: string;
  status: TripStatus;
  departureTime: string;
  estimatedArrival: string;
  distance: number;
  cargoType: string;
  priority: 'low' | 'normal' | 'high';
}

export interface ServiceDocument {
  name: string;
  size: number;
  type: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleReg: string;
  type: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  scheduledDate: string;
  completedDate: string | null;
  cost: number;
  technician: string;
  serviceDocuments?: ServiceDocument[];
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  vehicleReg: string;
  date: string;
  liters: number;
  cost: number;
  odometer: number;
  station: string;
  efficiency: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vehicleId: string;
  vehicleReg: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  details: string;
  ip: string;
  timestamp: string;
}
