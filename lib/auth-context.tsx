'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Role } from './types';
import { ROLES } from './rbac';
import { AuthUser, DEFAULT_USERS } from './users';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'transitops-auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true until localStorage is read

  useEffect(() => {
    // Restore session from localStorage BEFORE any redirect decisions are made
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      // Mark loading done — DashboardLayout will now decide whether to redirect
      setIsLoading(false);
    }

    // Fetch latest permissions matrix from backend and cache it locally
    fetch('/api/roles/permissions')
      .then((res) => res.json())
      .then((data) => {
        if (data.permissions) {
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

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, switchRole }}>
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

