import type { Role } from './types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export const DEFAULT_USERS: Record<Role, AuthUser> = {
  super_admin: { id: 'u1', name: 'Alexander Chen', email: 'alex.chen@transitops.io', role: 'super_admin', avatar: 'AC' },
  fleet_manager: { id: 'u2', name: 'Sarah Williams', email: 'sarah.w@transitops.io', role: 'fleet_manager', avatar: 'SW' },
  dispatcher: { id: 'u3', name: 'Marcus Johnson', email: 'marcus.j@transitops.io', role: 'dispatcher', avatar: 'MJ' },
  safety_officer: { id: 'u4', name: 'Emily Rodriguez', email: 'emily.r@transitops.io', role: 'safety_officer', avatar: 'ER' },
  maintenance_manager: { id: 'u5', name: 'David Park', email: 'david.p@transitops.io', role: 'maintenance_manager', avatar: 'DP' },
  finance_analyst: { id: 'u6', name: 'Lisa Anderson', email: 'lisa.a@transitops.io', role: 'finance_analyst', avatar: 'LA' },
};
