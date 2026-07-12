import fs from 'fs';
import path from 'path';
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

interface DatabaseSchema {
  users: User[];
  permissions: PermissionMatrix;
}

const dbPath = path.join(process.cwd(), 'lib', 'data', 'db.json');

export function readDb(): DatabaseSchema {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { users: [], permissions: {} as PermissionMatrix };
  }
}

export function writeDb(data: DatabaseSchema): void {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}
