'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Role, ModuleKey, Permission } from './types';
import { ROLES, PERMISSION_MATRIX } from './rbac';
import { AuthUser, DEFAULT_USERS } from './users';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  matrix: Record<Role, Partial<Record<ModuleKey, Permission>>>;
  setMatrix: (matrix: Record<Role, Partial<Record<ModuleKey, Permission>>>) => void;
  hasPermission: (module: ModuleKey, required: Permission) => boolean;
  canAccessModule: (module: ModuleKey) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'transitops-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matrix, setMatrixState] = useState<Record<Role, Partial<Record<ModuleKey, Permission>>>>(PERMISSION_MATRIX);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
      const storedMatrix = localStorage.getItem('transitops-permissions');
      if (storedMatrix) {
        setMatrixState(JSON.parse(storedMatrix));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }

    fetch('/api/roles/permissions')
      .then((res) => res.json())
      .then((data) => {
        if (data.permissions) {
          setMatrixState(data.permissions);
          localStorage.setItem('transitops-permissions', JSON.stringify(data.permissions));
        }
      })
      .catch(() => {});
  }, []);

  const login = (authUser: AuthUser) => {
    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const switchRole = (role: Role) => {
    const authUser = DEFAULT_USERS[role];
    setUser(authUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
  };

  const setMatrix = (newMatrix: Record<Role, Partial<Record<ModuleKey, Permission>>>) => {
    setMatrixState(newMatrix);
    localStorage.setItem('transitops-permissions', JSON.stringify(newMatrix));
  };

  const hasPermission = (module: ModuleKey, required: Permission): boolean => {
    const role = user?.role || 'super_admin';
    const perm = matrix[role]?.[module];
    if (!perm || perm === 'none') return false;
    if (perm === 'full') return true;
    if (required === 'full') return false;
    const hierarchy: Permission[] = ['read', 'create', 'update', 'delete', 'approve', 'export'];
    return hierarchy.indexOf(perm) >= hierarchy.indexOf(required);
  };

  const canAccessModule = (module: ModuleKey): boolean => {
    const role = user?.role || 'super_admin';
    const perm = matrix[role]?.[module];
    return !!perm && perm !== 'none';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, switchRole, matrix, setMatrix, hasPermission, canAccessModule }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ROLES };


