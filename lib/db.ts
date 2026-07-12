import { Pool } from 'pg';
import { exec } from 'child_process';
import type { Role, Permission, ModuleKey } from './types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  status: 'active' | 'inactive';
  lastActive: string;
}

export type PermissionMatrix = Record<Role, Partial<Record<ModuleKey, Permission>>>;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: '127.0.0.1',
      port: 5435,
      user: 'postgres',
      database: 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
    });

let isInitialized = false;

// ── Mock Data for Seeding ─────────────────────────────────────
const INITIAL_USERS = [
  { id: 'u1', name: 'Alexander Chen', email: 'alex.chen@transitops.io', role: 'super_admin', avatar: 'AC', status: 'active', lastActive: '2026-07-12T08:30:00Z' },
  { id: 'u2', name: 'Sarah Williams', email: 'sarah.w@transitops.io', role: 'fleet_manager', avatar: 'SW', status: 'active', lastActive: '2026-07-12T07:45:00Z' },
  { id: 'u3', name: 'Marcus Johnson', email: 'marcus.j@transitops.io', role: 'dispatcher', avatar: 'MJ', status: 'active', lastActive: '2026-07-12T09:15:00Z' },
  { id: 'u4', name: 'Emily Rodriguez', email: 'emily.r@transitops.io', role: 'safety_officer', avatar: 'ER', status: 'active', lastActive: '2026-07-11T16:20:00Z' },
  { id: 'u5', name: 'David Park', email: 'david.p@transitops.io', role: 'maintenance_manager', avatar: 'DP', status: 'active', lastActive: '2026-07-12T06:30:00Z' },
  { id: 'u6', name: 'Lisa Anderson', email: 'lisa.a@transitops.io', role: 'finance_analyst', avatar: 'LA', status: 'active', lastActive: '2026-07-11T18:00:00Z' },
  { id: 'u7', name: 'James Miller', email: 'james.m@transitops.io', role: 'dispatcher', avatar: 'JM', status: 'inactive', lastActive: '2026-07-08T14:00:00Z' },
  { id: 'u8', name: 'Rachel Green', email: 'rachel.g@transitops.io', role: 'fleet_manager', avatar: 'RG', status: 'active', lastActive: '2026-07-12T05:45:00Z' }
];

const INITIAL_VEHICLES = [
  { id: 'v1', registration: 'FLT-2024-001', vin: '1HGCM82633A123456', make: 'Volvo', model: 'FH16', year: 2024, capacity: 24000, fuelType: 'diesel', status: 'on_trip', odometer: 45230, healthScore: 92, lastService: '2026-06-15', nextService: '2026-09-15', location: 'Houston, TX' },
  { id: 'v2', registration: 'FLT-2024-002', vin: '2HGCM82633A234567', make: 'Mercedes', model: 'Actros', year: 2023, capacity: 26000, fuelType: 'diesel', status: 'available', odometer: 78100, healthScore: 88, lastService: '2026-05-20', nextService: '2026-08-20', location: 'Dallas, TX' },
  { id: 'v3', registration: 'FLT-2024-003', vin: '3HGCM82633A345678', make: 'Scania', model: 'R500', year: 2024, capacity: 22000, fuelType: 'diesel', status: 'maintenance', odometer: 32500, healthScore: 65, lastService: '2026-07-01', nextService: '2026-07-20', location: 'Austin, TX' },
  { id: 'v4', registration: 'FLT-2024-004', vin: '4HGCM82633A456789', make: 'Tesla', model: 'Semi', year: 2024, capacity: 20000, fuelType: 'electric', status: 'available', odometer: 12800, healthScore: 96, lastService: '2026-06-28', nextService: '2026-10-28', location: 'San Antonio, TX' },
  { id: 'v5', registration: 'FLT-2023-005', vin: '5HGCM82633A567890', make: 'MAN', model: 'TGX', year: 2023, capacity: 25000, fuelType: 'diesel', status: 'on_trip', odometer: 95000, healthScore: 81, lastService: '2026-04-10', nextService: '2026-07-25', location: 'Fort Worth, TX' },
  { id: 'v6', registration: 'FLT-2023-006', vin: '6HGCM82633A678901', make: 'DAF', model: 'XF', year: 2023, capacity: 23000, fuelType: 'diesel', status: 'available', odometer: 67000, healthScore: 85, lastService: '2026-05-05', nextService: '2026-08-05', location: 'El Paso, TX' },
  { id: 'v7', registration: 'FLT-2022-007', vin: '7HGCM82633A789012', make: 'Iveco', model: 'S-Way', year: 2022, capacity: 21000, fuelType: 'diesel', status: 'maintenance', odometer: 145000, healthScore: 58, lastService: '2026-07-05', nextService: '2026-07-15', location: 'Arlington, TX' },
  { id: 'v8', registration: 'FLT-2024-008', vin: '8HGCM82633A890123', make: 'Volvo', model: 'VNL', year: 2024, capacity: 25000, fuelType: 'hybrid', status: 'on_trip', odometer: 21000, healthScore: 94, lastService: '2026-06-20', nextService: '2026-09-20', location: 'Houston, TX' },
  { id: 'v9', registration: 'FLT-2023-009', vin: '9HGCM82633A901234', make: 'Mercedes', model: 'Arocs', year: 2023, capacity: 28000, fuelType: 'diesel', status: 'available', odometer: 54000, healthScore: 89, lastService: '2026-05-15', nextService: '2026-08-15', location: 'Dallas, TX' },
  { id: 'v10', registration: 'FLT-2022-010', vin: '0HGCM82633A012345', make: 'Renault', model: 'T High', year: 2022, capacity: 22000, fuelType: 'diesel', status: 'retired', odometer: 210000, healthScore: 42, lastService: '2026-01-10', nextService: '-', location: 'Houston, TX' }
];

const INITIAL_DRIVERS = [
  { id: 'd1', name: 'Robert Taylor', email: 'robert.t@transitops.io', phone: '+1 713-555-0101', licenseNumber: 'TX-CDL-2024001', licenseExpiry: '2027-03-15', safetyScore: 96, experienceYears: 12, status: 'on_trip', verified: true, totalTrips: 1240, rating: 4.8, avatar: 'RT' },
  { id: 'd2', name: 'Michael Brown', email: 'michael.b@transitops.io', phone: '+1 713-555-0102', licenseNumber: 'TX-CDL-2024002', licenseExpiry: '2026-08-20', safetyScore: 91, experienceYears: 8, status: 'available', verified: true, totalTrips: 890, rating: 4.6, avatar: 'MB' },
  { id: 'd3', name: 'Daniel Garcia', email: 'daniel.g@transitops.io', phone: '+1 713-555-0103', licenseNumber: 'TX-CDL-2024003', licenseExpiry: '2026-12-10', safetyScore: 88, experienceYears: 6, status: 'on_trip', verified: true, totalTrips: 650, rating: 4.5, avatar: 'DG' },
  { id: 'd4', name: 'Christopher Lee', email: 'chris.l@transitops.io', phone: '+1 713-555-0104', licenseNumber: 'TX-CDL-2024004', licenseExpiry: '2026-07-30', safetyScore: 79, experienceYears: 4, status: 'off_duty', verified: true, totalTrips: 420, rating: 4.2, avatar: 'CL' },
  { id: 'd5', name: 'Joseph Martinez', email: 'joseph.m@transitops.io', phone: '+1 713-555-0105', licenseNumber: 'TX-CDL-2024005', licenseExpiry: '2028-01-05', safetyScore: 94, experienceYears: 15, status: 'available', verified: true, totalTrips: 1680, rating: 4.9, avatar: 'JM' },
  { id: 'd6', name: 'Thomas Wilson', email: 'thomas.w@transitops.io', phone: '+1 713-555-0106', licenseNumber: 'TX-CDL-2024006', licenseExpiry: '2025-11-15', safetyScore: 72, experienceYears: 3, status: 'suspended', verified: false, totalTrips: 180, rating: 3.8, avatar: 'TW' },
  { id: 'd7', name: 'Brian Anderson', email: 'brian.a@transitops.io', phone: '+1 713-555-0107', licenseNumber: 'TX-CDL-2024007', licenseExpiry: '2027-06-20', safetyScore: 90, experienceYears: 10, status: 'on_trip', verified: true, totalTrips: 1100, rating: 4.7, avatar: 'BA' },
  { id: 'd8', name: 'Kevin Davis', email: 'kevin.d@transitops.io', phone: '+1 713-555-0108', licenseNumber: 'TX-CDL-2024008', licenseExpiry: '2026-09-05', safetyScore: 85, experienceYears: 7, status: 'available', verified: true, totalTrips: 760, rating: 4.4, avatar: 'KD' }
];

const INITIAL_TRIPS = [
  { id: 't1', origin: 'Houston, TX', destination: 'Dallas, TX', driverId: 'd1', driverName: 'Robert Taylor', vehicleId: 'v1', vehicleReg: 'FLT-2024-001', status: 'in_transit', departureTime: '2026-07-12T06:00:00Z', estimatedArrival: '2026-07-12T10:30:00Z', distance: 239, cargoType: 'Electronics', priority: 'high' },
  { id: 't2', origin: 'Dallas, TX', destination: 'Austin, TX', driverId: 'd3', driverName: 'Daniel Garcia', vehicleId: 'v5', vehicleReg: 'FLT-2023-005', status: 'in_transit', departureTime: '2026-07-12T05:30:00Z', estimatedArrival: '2026-07-12T09:00:00Z', distance: 195, cargoType: 'Furniture', priority: 'normal' },
  { id: 't3', origin: 'San Antonio, TX', destination: 'Houston, TX', driverId: 'd7', driverName: 'Brian Anderson', vehicleId: 'v8', vehicleReg: 'FLT-2024-008', status: 'dispatched', departureTime: '2026-07-12T12:00:00Z', estimatedArrival: '2026-07-12T15:30:00Z', distance: 197, cargoType: 'Construction Materials', priority: 'high' },
  { id: 't4', origin: 'Fort Worth, TX', destination: 'El Paso, TX', driverId: 'd2', driverName: 'Michael Brown', vehicleId: 'v2', vehicleReg: 'FLT-2024-002', status: 'planned', departureTime: '2026-07-13T06:00:00Z', estimatedArrival: '2026-07-13T14:00:00Z', distance: 570, cargoType: 'Retail Goods', priority: 'normal' },
  { id: 't5', origin: 'Houston, TX', destination: 'San Antonio, TX', driverId: 'd5', driverName: 'Joseph Martinez', vehicleId: 'v9', vehicleReg: 'FLT-2023-009', status: 'planned', departureTime: '2026-07-13T08:00:00Z', estimatedArrival: '2026-07-13T11:00:00Z', distance: 197, cargoType: 'Food & Beverage', priority: 'low' },
  { id: 't6', origin: 'Dallas, TX', destination: 'Houston, TX', driverId: 'd8', driverName: 'Kevin Davis', vehicleId: 'v6', vehicleReg: 'FLT-2023-006', status: 'completed', departureTime: '2026-07-11T06:00:00Z', estimatedArrival: '2026-07-11T10:00:00Z', distance: 239, cargoType: 'Electronics', priority: 'normal' },
  { id: 't7', origin: 'Austin, TX', destination: 'Dallas, TX', driverId: 'd1', driverName: 'Robert Taylor', vehicleId: 'v1', vehicleReg: 'FLT-2024-001', status: 'completed', departureTime: '2026-07-10T07:00:00Z', estimatedArrival: '2026-07-10T10:30:00Z', distance: 195, cargoType: 'Pharmaceuticals', priority: 'high' },
  { id: 't8', origin: 'El Paso, TX', destination: 'Fort Worth, TX', driverId: 'd3', driverName: 'Daniel Garcia', vehicleId: 'v5', vehicleReg: 'FLT-2023-005', status: 'cancelled', departureTime: '2026-07-09T06:00:00Z', estimatedArrival: '2026-07-09T14:00:00Z', distance: 570, cargoType: 'Machinery', priority: 'normal' }
];

const INITIAL_MAINTENANCE = [
  { id: 'm1', vehicleId: 'v3', vehicleReg: 'FLT-2024-003', type: 'Engine Service', description: 'Full engine diagnostic and oil change', status: 'in_progress', priority: 'medium', scheduledDate: '2026-07-10', completedDate: null, cost: 850, technician: 'David Park' },
  { id: 'm2', vehicleId: 'v7', vehicleReg: 'FLT-2022-007', type: 'Brake Replacement', description: 'Replace front and rear brake pads', status: 'in_progress', priority: 'high', scheduledDate: '2026-07-08', completedDate: null, cost: 1200, technician: 'David Park' },
  { id: 'm3', vehicleId: 'v5', vehicleReg: 'FLT-2023-005', type: 'Tire Rotation', description: 'Routine tire rotation and alignment', status: 'scheduled', priority: 'low', scheduledDate: '2026-07-25', completedDate: null, cost: 320, technician: 'Unassigned' },
  { id: 'm4', vehicleId: 'v1', vehicleReg: 'FLT-2024-001', type: 'Scheduled Inspection', description: 'Annual safety inspection', status: 'scheduled', priority: 'medium', scheduledDate: '2026-09-15', completedDate: null, cost: 450, technician: 'Unassigned' },
  { id: 'm5', vehicleId: 'v2', vehicleReg: 'FLT-2024-002', type: 'Oil Change', description: 'Routine oil and filter change', status: 'completed', priority: 'low', scheduledDate: '2026-05-20', completedDate: '2026-05-20', cost: 280, technician: 'David Park' },
  { id: 'm6', vehicleId: 'v4', vehicleReg: 'FLT-2024-004', type: 'Battery Check', description: 'Battery health diagnostic', status: 'completed', priority: 'low', scheduledDate: '2026-06-28', completedDate: '2026-06-28', cost: 150, technician: 'David Park' },
  { id: 'm7', vehicleId: 'v10', vehicleReg: 'FLT-2022-010', type: 'Engine Overhaul', description: 'Complete engine rebuild', status: 'overdue', priority: 'critical', scheduledDate: '2026-06-15', completedDate: null, cost: 8500, technician: 'Unassigned' }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', fromRole: 'system', toRole: 'super_admin', title: 'Maintenance Overdue', message: 'FLT-2022-010 engine overhaul is 27 days overdue', type: 'error', read: false },
  { id: 'n2', fromRole: 'system', toRole: 'super_admin', title: 'Trip Completed', message: 'Trip #t6 Dallas to Houston completed successfully', type: 'success', read: false },
  { id: 'n3', fromRole: 'system', toRole: 'super_admin', title: 'License Expiring', message: 'Christopher Lee license expires in 18 days', type: 'warning', read: false },
  { id: 'n4', fromRole: 'dispatcher', toRole: 'super_admin', title: 'New Trip Assigned', message: 'Trip #t4 Fort Worth to El Paso assigned to Michael Brown', type: 'info', read: true },
  { id: 'n5', fromRole: 'finance_analyst', toRole: 'super_admin', title: 'Expense Approved', message: 'Weekly fuel refill expense of $234 approved', type: 'success', read: true }
];

const INITIAL_SETTINGS = [
  { key: 'language', value: 'en' },
  { key: 'timezone', value: 'America/Chicago (CST)' },
  { key: 'workspaceName', value: 'TransitOps Fleet' },
  { key: 'density', value: 'comfortable' },
  { key: 'emailNotifs', value: 'true' },
  { key: 'pushNotifs', value: 'true' },
  { key: 'inAppNotifs', value: 'true' },
  { key: 'weeklyDigest', value: 'false' }
];

const INITIAL_PERMISSIONS: PermissionMatrix = {
  super_admin: {
    dashboard: 'full', users: 'full', roles: 'full', vehicles: 'full', drivers: 'full',
    trips: 'full', dispatch: 'full', maintenance: 'full', fuel: 'full', expenses: 'full',
    reports: 'full', analytics: 'full', notifications: 'full', settings: 'full', profile: 'full'
  },
  fleet_manager: {
    dashboard: 'read', vehicles: 'full', drivers: 'read', trips: 'read', dispatch: 'read',
    maintenance: 'read', fuel: 'read', expenses: 'read', reports: 'export', analytics: 'read',
    notifications: 'read', settings: 'read', profile: 'full'
  },
  dispatcher: {
    dashboard: 'read', vehicles: 'read', drivers: 'read', trips: 'full', dispatch: 'full',
    maintenance: 'read', notifications: 'read', settings: 'read', profile: 'full'
  },
  safety_officer: {
    dashboard: 'read', drivers: 'full', vehicles: 'read', trips: 'read', reports: 'export',
    notifications: 'read', settings: 'read', profile: 'full'
  },
  maintenance_manager: {
    dashboard: 'read', vehicles: 'read', maintenance: 'full', trips: 'read', reports: 'export',
    notifications: 'read', settings: 'read', profile: 'full'
  },
  finance_analyst: {
    dashboard: 'read', fuel: 'full', expenses: 'full', maintenance: 'read', reports: 'full',
    analytics: 'full', notifications: 'read', settings: 'read', profile: 'full'
  }
};

// Ensure server is running or start it automatically
async function ensurePostgresRunning() {
  if (process.env.DATABASE_URL) return;
  try {
    const client = await pool.connect();
    client.release();
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
      console.log('PostgreSQL on port 5435 is offline. Attempting auto-start...');
      const startCmd = `powershell -Command "Start-Process -FilePath 'C:\\Program Files\\PostgreSQL\\16\\bin\\postgres.exe' -ArgumentList '-D d:\\Transistops\\db_data -p 5435' -WindowStyle Hidden"`;
      await new Promise<void>((resolve) => {
        exec(startCmd, () => {
          setTimeout(resolve, 3500);
        });
      });
      const client = await pool.connect();
      client.release();
      console.log('PostgreSQL auto-started successfully on port 5435.');
    } else {
      throw err;
    }
  }
}

export async function initializeDatabase() {
  if (isInitialized) return;

  await ensurePostgresRunning();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL,
        avatar VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        last_active TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. permissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        role VARCHAR(50) NOT NULL,
        module VARCHAR(50) NOT NULL,
        permission VARCHAR(50) NOT NULL,
        PRIMARY KEY (role, module)
      );
    `);

    // 3. vehicles
    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id VARCHAR(50) PRIMARY KEY,
        registration VARCHAR(50) NOT NULL UNIQUE,
        vin VARCHAR(50) NOT NULL UNIQUE,
        make VARCHAR(50) NOT NULL,
        model VARCHAR(50) NOT NULL,
        year INTEGER NOT NULL,
        capacity INTEGER NOT NULL,
        fuel_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        odometer INTEGER NOT NULL DEFAULT 0,
        health_score INTEGER NOT NULL DEFAULT 100,
        last_service VARCHAR(50) NOT NULL,
        next_service VARCHAR(50) NOT NULL,
        location VARCHAR(100) NOT NULL
      );
    `);

    // 4. drivers
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        license_number VARCHAR(50) NOT NULL UNIQUE,
        license_expiry VARCHAR(50) NOT NULL,
        safety_score INTEGER NOT NULL DEFAULT 100,
        experience_years INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        verified BOOLEAN NOT NULL DEFAULT true,
        total_trips INTEGER NOT NULL DEFAULT 0,
        rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
        avatar VARCHAR(10) NOT NULL
      );
    `);

    // 5. trips
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(50) PRIMARY KEY,
        origin VARCHAR(100) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        driver_id VARCHAR(50) NOT NULL,
        driver_name VARCHAR(100) NOT NULL,
        vehicle_id VARCHAR(50) NOT NULL,
        vehicle_reg VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'planned',
        departure_time VARCHAR(100) NOT NULL,
        estimated_arrival VARCHAR(100) NOT NULL,
        distance INTEGER NOT NULL,
        cargo_type VARCHAR(100) NOT NULL,
        priority VARCHAR(50) NOT NULL DEFAULT 'normal'
      );
    `);

    // 6. maintenance_records
    await client.query(`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id VARCHAR(50) PRIMARY KEY,
        vehicle_id VARCHAR(50) NOT NULL,
        vehicle_reg VARCHAR(50) NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        scheduled_date VARCHAR(50) NOT NULL,
        completed_date VARCHAR(50),
        cost INTEGER NOT NULL DEFAULT 0,
        technician VARCHAR(100) NOT NULL,
        invoice_url VARCHAR(250),
        actual_cost INTEGER,
        vendor VARCHAR(100),
        approval_status VARCHAR(50) DEFAULT 'none',
        rejection_comments TEXT
      );
    `);

    // 6b. expenses
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        date VARCHAR(50) NOT NULL,
        vehicle_id VARCHAR(50),
        vehicle_reg VARCHAR(50),
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        submitted_by VARCHAR(100) NOT NULL
      );
    `);

    // 7. notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        from_role VARCHAR(50) NOT NULL,
        to_role VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        read BOOLEAN NOT NULL DEFAULT false,
        maintenance_id VARCHAR(50) DEFAULT NULL
      );
    `);
    // Add maintenance_id column if it doesn't exist (for existing databases)
    await client.query(`
      ALTER TABLE notifications ADD COLUMN IF NOT EXISTS maintenance_id VARCHAR(50) DEFAULT NULL;
    `);


    // 8. settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // 9. reports
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        type VARCHAR(50) NOT NULL,
        generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        generated_by VARCHAR(100) NOT NULL,
        filters TEXT NOT NULL,
        row_count INTEGER NOT NULL DEFAULT 0,
        file_path VARCHAR(250) NOT NULL
      );
    `);

    // Seeding logic
    // Users
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCount.rows[0].count) === 0) {
      for (const u of INITIAL_USERS) {
        await client.query('INSERT INTO users(id, name, email, role, avatar, status, last_active) VALUES($1, $2, $3, $4, $5, $6, $7)', [u.id, u.name, u.email, u.role, u.avatar, u.status, u.lastActive]);
      }
    }

    // Permissions
    const permCount = await client.query('SELECT COUNT(*) FROM permissions');
    if (parseInt(permCount.rows[0].count) === 0) {
      for (const [role, modules] of Object.entries(INITIAL_PERMISSIONS)) {
        for (const [module, perm] of Object.entries(modules)) {
          await client.query('INSERT INTO permissions(role, module, permission) VALUES($1, $2, $3)', [role, module, perm]);
        }
      }
    }

    // Vehicles
    const vehiclesCount = await client.query('SELECT COUNT(*) FROM vehicles');
    if (parseInt(vehiclesCount.rows[0].count) === 0) {
      for (const v of INITIAL_VEHICLES) {
        await client.query(
          `INSERT INTO vehicles (id, registration, vin, make, model, year, capacity, fuel_type, status, odometer, health_score, last_service, next_service, location) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [v.id, v.registration, v.vin, v.make, v.model, v.year, v.capacity, v.fuelType, v.status, v.odometer, v.healthScore, v.lastService, v.nextService, v.location]
        );
      }
    }

    // Drivers
    const driversCount = await client.query('SELECT COUNT(*) FROM drivers');
    if (parseInt(driversCount.rows[0].count) === 0) {
      for (const d of INITIAL_DRIVERS) {
        await client.query(
          `INSERT INTO drivers (id, name, email, phone, license_number, license_expiry, safety_score, experience_years, status, verified, total_trips, rating, avatar) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [d.id, d.name, d.email, d.phone, d.licenseNumber, d.licenseExpiry, d.safetyScore, d.experienceYears, d.status, d.verified, d.totalTrips, d.rating, d.avatar]
        );
      }
    }

    // Trips
    const tripsCount = await client.query('SELECT COUNT(*) FROM trips');
    if (parseInt(tripsCount.rows[0].count) === 0) {
      for (const t of INITIAL_TRIPS) {
        await client.query(
          `INSERT INTO trips (id, origin, destination, driver_id, driver_name, vehicle_id, vehicle_reg, status, departure_time, estimated_arrival, distance, cargo_type, priority) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [t.id, t.origin, t.destination, t.driverId, t.driverName, t.vehicleId, t.vehicleReg, t.status, t.departureTime, t.estimatedArrival, t.distance, t.cargoType, t.priority]
        );
      }
    }

    // Maintenance
    const maintCount = await client.query('SELECT COUNT(*) FROM maintenance_records');
    if (parseInt(maintCount.rows[0].count) === 0) {
      for (const m of INITIAL_MAINTENANCE) {
        await client.query(
          `INSERT INTO maintenance_records (id, vehicle_id, vehicle_reg, type, description, status, priority, scheduled_date, completed_date, cost, technician) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [m.id, m.vehicleId, m.vehicleReg, m.type, m.description, m.status, m.priority, m.scheduledDate, m.completedDate, m.cost, m.technician]
        );
      }
    }

    // Notifications
    const notifCount = await client.query('SELECT COUNT(*) FROM notifications');
    if (parseInt(notifCount.rows[0].count) === 0) {
      for (const n of INITIAL_NOTIFICATIONS) {
        await client.query(
          `INSERT INTO notifications (id, from_role, to_role, title, message, type, read) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [n.id, n.fromRole, n.toRole, n.title, n.message, n.type, n.read]
        );
      }
    }

    // Settings
    const settingsCount = await client.query('SELECT COUNT(*) FROM settings');
    if (parseInt(settingsCount.rows[0].count) === 0) {
      for (const s of INITIAL_SETTINGS) {
        await client.query('INSERT INTO settings (key, value) VALUES ($1, $2)', [s.key, s.value]);
      }
    }

    await client.query('COMMIT');
    isInitialized = true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize PostgreSQL database:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function query(text: string, params?: any[]) {
  await initializeDatabase();
  return pool.query(text, params);
}
export { pool };
