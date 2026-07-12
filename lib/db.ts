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

const pool = new Pool({
  host: '127.0.0.1',
  port: 5435,
  user: 'postgres',
  database: 'postgres',
  max: 10,
  idleTimeoutMillis: 30000,
});

// Self-initializing database check
let isInitialized = false;

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

const INITIAL_PERMISSIONS: PermissionMatrix = {
  super_admin: {
    dashboard: 'full', users: 'full', roles: 'full', vehicles: 'full', drivers: 'full',
    trips: 'full', dispatch: 'full', maintenance: 'full', fuel: 'full', expenses: 'full',
    reports: 'full', analytics: 'full', notifications: 'full', audit: 'full', settings: 'full', profile: 'full'
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
  try {
    const client = await pool.connect();
    client.release();
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
      console.log('PostgreSQL on port 5435 is offline. Attempting auto-start...');
      
      const startCmd = `powershell -Command "Start-Process -FilePath 'C:\\Program Files\\PostgreSQL\\16\\bin\\postgres.exe' -ArgumentList '-D d:\\Transistops\\db_data -p 5435' -WindowStyle Hidden"`;
      
      await new Promise<void>((resolve) => {
        exec(startCmd, () => {
          // Wait 3.5 seconds for the database engine to finish starting and listen on the port
          setTimeout(resolve, 3500);
        });
      });
      
      // Verify connection after auto-start
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

  // Make sure postgres server is listening
  await ensurePostgresRunning();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create users table
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

    // 2. Create permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        role VARCHAR(50) NOT NULL,
        module VARCHAR(50) NOT NULL,
        permission VARCHAR(50) NOT NULL,
        PRIMARY KEY (role, module)
      );
    `);

    // 3. Seed users if empty
    const usersCountRes = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCountRes.rows[0].count) === 0) {
      for (const u of INITIAL_USERS) {
        await client.query(
          `INSERT INTO users (id, name, email, role, avatar, status, last_active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [u.id, u.name, u.email, u.role, u.avatar, u.status, u.lastActive]
        );
      }
      console.log('Seeded initial users into PostgreSQL database.');
    }

    // 4. Seed permissions if empty
    const permCountRes = await client.query('SELECT COUNT(*) FROM permissions');
    if (parseInt(permCountRes.rows[0].count) === 0) {
      for (const [role, modules] of Object.entries(INITIAL_PERMISSIONS)) {
        for (const [module, perm] of Object.entries(modules)) {
          await client.query(
            `INSERT INTO permissions (role, module, permission) 
             VALUES ($1, $2, $3)`,
            [role, module, perm]
          );
        }
      }
      console.log('Seeded initial permission matrix into PostgreSQL database.');
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

// Helper: Get database connection with auto-init
export async function query(text: string, params?: any[]) {
  await initializeDatabase();
  return pool.query(text, params);
}
export { pool };
