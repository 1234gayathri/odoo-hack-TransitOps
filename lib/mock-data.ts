import type {
  Vehicle,
  Driver,
  Trip,
  MaintenanceRecord,
  FuelLog,
  Expense,
  Notification,
  AuditLog,
  User,
} from './types';

export const users: User[] = [
  { id: 'u1', name: 'Alexander Chen', email: 'alex.chen@transitops.io', role: 'super_admin', avatar: 'AC', status: 'active', lastActive: '2026-07-12T08:30:00Z' },
  { id: 'u2', name: 'Sarah Williams', email: 'sarah.w@transitops.io', role: 'fleet_manager', avatar: 'SW', status: 'active', lastActive: '2026-07-12T07:45:00Z' },
  { id: 'u3', name: 'Marcus Johnson', email: 'marcus.j@transitops.io', role: 'dispatcher', avatar: 'MJ', status: 'active', lastActive: '2026-07-12T09:15:00Z' },
  { id: 'u4', name: 'Emily Rodriguez', email: 'emily.r@transitops.io', role: 'safety_officer', avatar: 'ER', status: 'active', lastActive: '2026-07-11T16:20:00Z' },
  { id: 'u5', name: 'David Park', email: 'david.p@transitops.io', role: 'maintenance_manager', avatar: 'DP', status: 'active', lastActive: '2026-07-12T06:30:00Z' },
  { id: 'u6', name: 'Lisa Anderson', email: 'lisa.a@transitops.io', role: 'finance_analyst', avatar: 'LA', status: 'active', lastActive: '2026-07-11T18:00:00Z' },
  { id: 'u7', name: 'James Miller', email: 'james.m@transitops.io', role: 'dispatcher', avatar: 'JM', status: 'inactive', lastActive: '2026-07-08T14:00:00Z' },
  { id: 'u8', name: 'Rachel Green', email: 'rachel.g@transitops.io', role: 'fleet_manager', avatar: 'RG', status: 'active', lastActive: '2026-07-12T05:45:00Z' },
];

export const vehicles: Vehicle[] = [
  { id: 'v1', registration: 'FLT-2024-001', vin: '1HGCM82633A123456', make: 'Volvo', model: 'FH16', year: 2024, capacity: 24000, fuelType: 'diesel', status: 'on_trip', odometer: 45230, healthScore: 92, lastService: '2026-06-15', nextService: '2026-09-15', location: 'Houston, TX' },
  { id: 'v2', registration: 'FLT-2024-002', vin: '2HGCM82633A234567', make: 'Mercedes', model: 'Actros', year: 2023, capacity: 26000, fuelType: 'diesel', status: 'available', odometer: 78100, healthScore: 88, lastService: '2026-05-20', nextService: '2026-08-20', location: 'Dallas, TX' },
  { id: 'v3', registration: 'FLT-2024-003', vin: '3HGCM82633A345678', make: 'Scania', model: 'R500', year: 2024, capacity: 22000, fuelType: 'diesel', status: 'maintenance', odometer: 32500, healthScore: 65, lastService: '2026-07-01', nextService: '2026-07-20', location: 'Austin, TX' },
  { id: 'v4', registration: 'FLT-2024-004', vin: '4HGCM82633A456789', make: 'Tesla', model: 'Semi', year: 2024, capacity: 20000, fuelType: 'electric', status: 'available', odometer: 12800, healthScore: 96, lastService: '2026-06-28', nextService: '2026-10-28', location: 'San Antonio, TX' },
  { id: 'v5', registration: 'FLT-2023-005', vin: '5HGCM82633A567890', make: 'MAN', model: 'TGX', year: 2023, capacity: 25000, fuelType: 'diesel', status: 'on_trip', odometer: 95000, healthScore: 81, lastService: '2026-04-10', nextService: '2026-07-25', location: 'Fort Worth, TX' },
  { id: 'v6', registration: 'FLT-2023-006', vin: '6HGCM82633A678901', make: 'DAF', model: 'XF', year: 2023, capacity: 23000, fuelType: 'diesel', status: 'available', odometer: 67000, healthScore: 85, lastService: '2026-05-05', nextService: '2026-08-05', location: 'El Paso, TX' },
  { id: 'v7', registration: 'FLT-2022-007', vin: '7HGCM82633A789012', make: 'Iveco', model: 'S-Way', year: 2022, capacity: 21000, fuelType: 'diesel', status: 'maintenance', odometer: 145000, healthScore: 58, lastService: '2026-07-05', nextService: '2026-07-15', location: 'Arlington, TX' },
  { id: 'v8', registration: 'FLT-2024-008', vin: '8HGCM82633A890123', make: 'Volvo', model: 'VNL', year: 2024, capacity: 25000, fuelType: 'hybrid', status: 'on_trip', odometer: 21000, healthScore: 94, lastService: '2026-06-20', nextService: '2026-09-20', location: 'Houston, TX' },
  { id: 'v9', registration: 'FLT-2023-009', vin: '9HGCM82633A901234', make: 'Mercedes', model: 'Arocs', year: 2023, capacity: 28000, fuelType: 'diesel', status: 'available', odometer: 54000, healthScore: 89, lastService: '2026-05-15', nextService: '2026-08-15', location: 'Dallas, TX' },
  { id: 'v10', registration: 'FLT-2022-010', vin: '0HGCM82633A012345', make: 'Renault', model: 'T High', year: 2022, capacity: 22000, fuelType: 'diesel', status: 'retired', odometer: 210000, healthScore: 42, lastService: '2026-01-10', nextService: '—', location: 'Houston, TX' },
];

export const drivers: Driver[] = [
  { id: 'd1', name: 'Robert Taylor', email: 'robert.t@transitops.io', phone: '+1 713-555-0101', licenseNumber: 'TX-CDL-2024001', licenseExpiry: '2027-03-15', safetyScore: 96, experienceYears: 12, status: 'on_trip', verified: true, totalTrips: 1240, rating: 4.8, avatar: 'RT' },
  { id: 'd2', name: 'Michael Brown', email: 'michael.b@transitops.io', phone: '+1 713-555-0102', licenseNumber: 'TX-CDL-2024002', licenseExpiry: '2026-08-20', safetyScore: 91, experienceYears: 8, status: 'available', verified: true, totalTrips: 890, rating: 4.6, avatar: 'MB' },
  { id: 'd3', name: 'Daniel Garcia', email: 'daniel.g@transitops.io', phone: '+1 713-555-0103', licenseNumber: 'TX-CDL-2024003', licenseExpiry: '2026-12-10', safetyScore: 88, experienceYears: 6, status: 'on_trip', verified: true, totalTrips: 650, rating: 4.5, avatar: 'DG' },
  { id: 'd4', name: 'Christopher Lee', email: 'chris.l@transitops.io', phone: '+1 713-555-0104', licenseNumber: 'TX-CDL-2024004', licenseExpiry: '2026-07-30', safetyScore: 79, experienceYears: 4, status: 'off_duty', verified: true, totalTrips: 420, rating: 4.2, avatar: 'CL' },
  { id: 'd5', name: 'Joseph Martinez', email: 'joseph.m@transitops.io', phone: '+1 713-555-0105', licenseNumber: 'TX-CDL-2024005', licenseExpiry: '2028-01-05', safetyScore: 94, experienceYears: 15, status: 'available', verified: true, totalTrips: 1680, rating: 4.9, avatar: 'JM' },
  { id: 'd6', name: 'Thomas Wilson', email: 'thomas.w@transitops.io', phone: '+1 713-555-0106', licenseNumber: 'TX-CDL-2024006', licenseExpiry: '2025-11-15', safetyScore: 72, experienceYears: 3, status: 'suspended', verified: false, totalTrips: 180, rating: 3.8, avatar: 'TW' },
  { id: 'd7', name: 'Brian Anderson', email: 'brian.a@transitops.io', phone: '+1 713-555-0107', licenseNumber: 'TX-CDL-2024007', licenseExpiry: '2027-06-20', safetyScore: 90, experienceYears: 10, status: 'on_trip', verified: true, totalTrips: 1100, rating: 4.7, avatar: 'BA' },
  { id: 'd8', name: 'Kevin Davis', email: 'kevin.d@transitops.io', phone: '+1 713-555-0108', licenseNumber: 'TX-CDL-2024008', licenseExpiry: '2026-09-05', safetyScore: 85, experienceYears: 7, status: 'available', verified: true, totalTrips: 760, rating: 4.4, avatar: 'KD' },
];

export const trips: Trip[] = [
  { id: 't1', origin: 'Houston, TX', destination: 'Dallas, TX', driverId: 'd1', driverName: 'Robert Taylor', vehicleId: 'v1', vehicleReg: 'FLT-2024-001', status: 'in_transit', departureTime: '2026-07-12T06:00:00Z', estimatedArrival: '2026-07-12T10:30:00Z', distance: 239, cargoType: 'Electronics', priority: 'high' },
  { id: 't2', origin: 'Dallas, TX', destination: 'Austin, TX', driverId: 'd3', driverName: 'Daniel Garcia', vehicleId: 'v5', vehicleReg: 'FLT-2023-005', status: 'in_transit', departureTime: '2026-07-12T05:30:00Z', estimatedArrival: '2026-07-12T09:00:00Z', distance: 195, cargoType: 'Furniture', priority: 'normal' },
  { id: 't3', origin: 'San Antonio, TX', destination: 'Houston, TX', driverId: 'd7', driverName: 'Brian Anderson', vehicleId: 'v8', vehicleReg: 'FLT-2024-008', status: 'dispatched', departureTime: '2026-07-12T12:00:00Z', estimatedArrival: '2026-07-12T15:30:00Z', distance: 197, cargoType: 'Construction Materials', priority: 'high' },
  { id: 't4', origin: 'Fort Worth, TX', destination: 'El Paso, TX', driverId: 'd2', driverName: 'Michael Brown', vehicleId: 'v2', vehicleReg: 'FLT-2024-002', status: 'planned', departureTime: '2026-07-13T06:00:00Z', estimatedArrival: '2026-07-13T14:00:00Z', distance: 570, cargoType: 'Retail Goods', priority: 'normal' },
  { id: 't5', origin: 'Houston, TX', destination: 'San Antonio, TX', driverId: 'd5', driverName: 'Joseph Martinez', vehicleId: 'v9', vehicleReg: 'FLT-2023-009', status: 'planned', departureTime: '2026-07-13T08:00:00Z', estimatedArrival: '2026-07-13T11:00:00Z', distance: 197, cargoType: 'Food & Beverage', priority: 'low' },
  { id: 't6', origin: 'Dallas, TX', destination: 'Houston, TX', driverId: 'd8', driverName: 'Kevin Davis', vehicleId: 'v6', vehicleReg: 'FLT-2023-006', status: 'completed', departureTime: '2026-07-11T06:00:00Z', estimatedArrival: '2026-07-11T10:00:00Z', distance: 239, cargoType: 'Electronics', priority: 'normal' },
  { id: 't7', origin: 'Austin, TX', destination: 'Dallas, TX', driverId: 'd1', driverName: 'Robert Taylor', vehicleId: 'v1', vehicleReg: 'FLT-2024-001', status: 'completed', departureTime: '2026-07-10T07:00:00Z', estimatedArrival: '2026-07-10T10:30:00Z', distance: 195, cargoType: 'Pharmaceuticals', priority: 'high' },
  { id: 't8', origin: 'El Paso, TX', destination: 'Fort Worth, TX', driverId: 'd3', driverName: 'Daniel Garcia', vehicleId: 'v5', vehicleReg: 'FLT-2023-005', status: 'cancelled', departureTime: '2026-07-09T06:00:00Z', estimatedArrival: '2026-07-09T14:00:00Z', distance: 570, cargoType: 'Machinery', priority: 'normal' },
];

export const maintenanceRecords: MaintenanceRecord[] = [
  { id: 'm1', vehicleId: 'v3', vehicleReg: 'FLT-2024-003', type: 'Engine Service', description: 'Full engine diagnostic and oil change', status: 'in_progress', priority: 'medium', scheduledDate: '2026-07-10', completedDate: null, cost: 850, technician: 'David Park' },
  { id: 'm2', vehicleId: 'v7', vehicleReg: 'FLT-2022-007', type: 'Brake Replacement', description: 'Replace front and rear brake pads', status: 'in_progress', priority: 'high', scheduledDate: '2026-07-08', completedDate: null, cost: 1200, technician: 'David Park' },
  { id: 'm3', vehicleId: 'v5', vehicleReg: 'FLT-2023-005', type: 'Tire Rotation', description: 'Routine tire rotation and alignment', status: 'scheduled', priority: 'low', scheduledDate: '2026-07-25', completedDate: null, cost: 320, technician: 'Unassigned' },
  { id: 'm4', vehicleId: 'v1', vehicleReg: 'FLT-2024-001', type: 'Scheduled Inspection', description: 'Annual safety inspection', status: 'scheduled', priority: 'medium', scheduledDate: '2026-09-15', completedDate: null, cost: 450, technician: 'Unassigned' },
  { id: 'm5', vehicleId: 'v2', vehicleReg: 'FLT-2024-002', type: 'Oil Change', description: 'Routine oil and filter change', status: 'completed', priority: 'low', scheduledDate: '2026-05-20', completedDate: '2026-05-20', cost: 280, technician: 'David Park' },
  { id: 'm6', vehicleId: 'v4', vehicleReg: 'FLT-2024-004', type: 'Battery Check', description: 'Battery health diagnostic', status: 'completed', priority: 'low', scheduledDate: '2026-06-28', completedDate: '2026-06-28', cost: 150, technician: 'David Park' },
  { id: 'm7', vehicleId: 'v10', vehicleReg: 'FLT-2022-010', type: 'Engine Overhaul', description: 'Complete engine rebuild', status: 'overdue', priority: 'critical', scheduledDate: '2026-06-15', completedDate: null, cost: 8500, technician: 'Unassigned' },
];

export const fuelLogs: FuelLog[] = [
  { id: 'f1', vehicleId: 'v1', vehicleReg: 'FLT-2024-001', date: '2026-07-12', liters: 180, cost: 234, odometer: 45230, station: 'Shell Houston', efficiency: 7.2 },
  { id: 'f2', vehicleId: 'v2', vehicleReg: 'FLT-2024-002', date: '2026-07-11', liters: 200, cost: 260, odometer: 78100, station: 'Chevron Dallas', efficiency: 6.8 },
  { id: 'f3', vehicleId: 'v5', vehicleReg: 'FLT-2023-005', date: '2026-07-11', liters: 220, cost: 286, odometer: 95000, station: 'Exxon Fort Worth', efficiency: 6.5 },
  { id: 'f4', vehicleId: 'v8', vehicleReg: 'FLT-2024-008', date: '2026-07-10', liters: 90, cost: 117, odometer: 21000, station: 'Shell Houston', efficiency: 12.5 },
  { id: 'f5', vehicleId: 'v9', vehicleReg: 'FLT-2023-009', date: '2026-07-09', liters: 210, cost: 273, odometer: 54000, station: 'BP Dallas', efficiency: 6.9 },
  { id: 'f6', vehicleId: 'v6', vehicleReg: 'FLT-2023-006', date: '2026-07-08', liters: 190, cost: 247, odometer: 67000, station: 'Shell El Paso', efficiency: 7.0 },
];

export const expenses: Expense[] = [
  { id: 'e1', category: 'Fuel', description: 'Weekly fuel refill - FLT-2024-001', amount: 234, date: '2026-07-12', vehicleId: 'v1', vehicleReg: 'FLT-2024-001', status: 'approved', submittedBy: 'Lisa Anderson' },
  { id: 'e2', category: 'Maintenance', description: 'Engine service - FLT-2024-003', amount: 850, date: '2026-07-10', vehicleId: 'v3', vehicleReg: 'FLT-2024-003', status: 'pending', submittedBy: 'David Park' },
  { id: 'e3', category: 'Maintenance', description: 'Brake replacement - FLT-2022-007', amount: 1200, date: '2026-07-08', vehicleId: 'v7', vehicleReg: 'FLT-2022-007', status: 'pending', submittedBy: 'David Park' },
  { id: 'e4', category: 'Insurance', description: 'Monthly fleet insurance premium', amount: 4500, date: '2026-07-05', vehicleId: '', vehicleReg: 'Fleet-wide', status: 'approved', submittedBy: 'Lisa Anderson' },
  { id: 'e5', category: 'Tolls', description: 'Highway tolls - Dallas to Austin route', amount: 85, date: '2026-07-11', vehicleId: 'v5', vehicleReg: 'FLT-2023-005', status: 'approved', submittedBy: 'Marcus Johnson' },
  { id: 'e6', category: 'Parts', description: 'Replacement brake pads x4', amount: 340, date: '2026-07-08', vehicleId: 'v7', vehicleReg: 'FLT-2022-007', status: 'rejected', submittedBy: 'David Park' },
];

export const notifications: Notification[] = [
  { id: 'n1', title: 'Maintenance Overdue', message: 'FLT-2022-010 engine overhaul is 27 days overdue', type: 'error', timestamp: '2026-07-12T08:00:00Z', read: false },
  { id: 'n2', title: 'Trip Completed', message: 'Trip #t6 Dallas to Houston completed successfully', type: 'success', timestamp: '2026-07-11T10:05:00Z', read: false },
  { id: 'n3', title: 'License Expiring', message: 'Christopher Lee license expires in 18 days', type: 'warning', timestamp: '2026-07-12T07:30:00Z', read: false },
  { id: 'n4', title: 'New Trip Assigned', message: 'Trip #t4 Fort Worth to El Paso assigned to Michael Brown', type: 'info', timestamp: '2026-07-12T06:45:00Z', read: true },
  { id: 'n5', title: 'Expense Approved', message: 'Weekly fuel refill expense of $234 approved', type: 'success', timestamp: '2026-07-12T05:00:00Z', read: true },
];

export const auditLogs: AuditLog[] = [
  { id: 'a1', user: 'Alexander Chen', action: 'LOGIN', module: 'Auth', details: 'User signed in successfully', ip: '192.168.1.100', timestamp: '2026-07-12T08:30:00Z' },
  { id: 'a2', user: 'Sarah Williams', action: 'UPDATE', module: 'Vehicles', details: 'Updated odometer reading for FLT-2024-001', ip: '192.168.1.101', timestamp: '2026-07-12T07:45:00Z' },
  { id: 'a3', user: 'Marcus Johnson', action: 'CREATE', module: 'Trips', details: 'Created trip #t4 Fort Worth to El Paso', ip: '192.168.1.102', timestamp: '2026-07-12T06:45:00Z' },
  { id: 'a4', user: 'David Park', action: 'UPDATE', module: 'Maintenance', details: 'Started maintenance job for FLT-2024-003', ip: '192.168.1.103', timestamp: '2026-07-12T06:30:00Z' },
  { id: 'a5', user: 'Lisa Anderson', action: 'APPROVE', module: 'Expenses', details: 'Approved expense #e1 - $234 fuel refill', ip: '192.168.1.104', timestamp: '2026-07-12T05:00:00Z' },
  { id: 'a6', user: 'Emily Rodriguez', action: 'UPDATE', module: 'Drivers', details: 'Verified license for Robert Taylor', ip: '192.168.1.105', timestamp: '2026-07-11T16:20:00Z' },
  { id: 'a7', user: 'Alexander Chen', action: 'DELETE', module: 'Users', details: 'Deactivated user account: James Miller', ip: '192.168.1.100', timestamp: '2026-07-11T15:00:00Z' },
  { id: 'a8', user: 'Rachel Green', action: 'CREATE', module: 'Vehicles', details: 'Registered new vehicle: FLT-2024-008', ip: '192.168.1.106', timestamp: '2026-07-11T14:30:00Z' },
];

export const tripTrendData = [
  { month: 'Jan', trips: 145, completed: 138, cancelled: 7 },
  { month: 'Feb', trips: 162, completed: 155, cancelled: 7 },
  { month: 'Mar', trips: 178, completed: 170, cancelled: 8 },
  { month: 'Apr', trips: 190, completed: 182, cancelled: 8 },
  { month: 'May', trips: 205, completed: 196, cancelled: 9 },
  { month: 'Jun', trips: 218, completed: 210, cancelled: 8 },
  { month: 'Jul', trips: 232, completed: 224, cancelled: 8 },
];

export const fuelTrendData = [
  { month: 'Jan', cost: 12400, liters: 9800 },
  { month: 'Feb', cost: 13200, liters: 10200 },
  { month: 'Mar', cost: 14100, liters: 10800 },
  { month: 'Apr', cost: 13800, liters: 10600 },
  { month: 'May', cost: 15200, liters: 11400 },
  { month: 'Jun', cost: 14600, liters: 11200 },
  { month: 'Jul', cost: 16300, liters: 12100 },
];

export const expenseBreakdownData = [
  { name: 'Fuel', value: 16300, color: 'hsl(var(--chart-1))' },
  { name: 'Maintenance', value: 8500, color: 'hsl(var(--chart-3))' },
  { name: 'Insurance', value: 4500, color: 'hsl(var(--chart-5))' },
  { name: 'Tolls', value: 2100, color: 'hsl(var(--chart-2))' },
  { name: 'Parts', value: 3400, color: 'hsl(var(--chart-4))' },
];

export const driverPerformanceData = [
  { name: 'Robert Taylor', trips: 42, rating: 4.8 },
  { name: 'Michael Brown', trips: 38, rating: 4.6 },
  { name: 'Daniel Garcia', trips: 35, rating: 4.5 },
  { name: 'Joseph Martinez', trips: 45, rating: 4.9 },
  { name: 'Brian Anderson', trips: 40, rating: 4.7 },
];

export const fleetUtilizationData = [
  { day: 'Mon', utilization: 78 },
  { day: 'Tue', utilization: 82 },
  { day: 'Wed', utilization: 85 },
  { day: 'Thu', utilization: 80 },
  { day: 'Fri', utilization: 88 },
  { day: 'Sat', utilization: 65 },
  { day: 'Sun', utilization: 45 },
];

export const maintenanceTimelineData = [
  { week: 'W1', scheduled: 4, completed: 3 },
  { week: 'W2', scheduled: 5, completed: 5 },
  { week: 'W3', scheduled: 3, completed: 2 },
  { week: 'W4', scheduled: 6, completed: 4 },
  { week: 'W5', scheduled: 4, completed: 4 },
  { week: 'W6', scheduled: 7, completed: 5 },
];
