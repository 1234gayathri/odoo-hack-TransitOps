'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Truck,
  Route,
  ShieldAlert,
  Wrench,
  DollarSign,
  Users,
  Check,
  X,
  Minus,
  Lock,
  Eye,
  Plus,
  Edit,
  Trash2,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-components';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ROLES, PERMISSION_MATRIX, MODULES, MODULE_LABELS, PERMISSION_LABELS, PERMISSION_COLORS, ROLE_HIERARCHY } from '@/lib/rbac';
import type { Role, Permission, ModuleKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const ROLE_ICONS: Record<Role, any> = {
  super_admin: ShieldCheck,
  fleet_manager: Truck,
  dispatcher: Route,
  safety_officer: ShieldAlert,
  maintenance_manager: Wrench,
  finance_analyst: DollarSign,
};

const PERMISSION_ICON: Record<Permission, any> = {
  full: Check,
  create: Plus,
  read: Eye,
  update: Edit,
  delete: Trash2,
  approve: Check,
  export: Download,
  none: X,
};

export default function RolesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [matrix, setMatrix] = useState<Record<Role, Partial<Record<ModuleKey, Permission>>>>(PERMISSION_MATRIX);
  const [loading, setLoading] = useState(true);

  // Fetch permission matrix from backend
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/roles/permissions');
      const data = await res.json();
      if (res.ok && data.permissions) {
        setMatrix(data.permissions);
        localStorage.setItem('transitops-permissions', JSON.stringify(data.permissions));
      }
    } catch (err: any) {
      toast.error('Failed to load permissions', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // Update permission on backend and locally
  const handlePermissionChange = async (roleKey: Role, moduleKey: ModuleKey, newPerm: Permission) => {
    if (roleKey === 'super_admin') {
      toast.warning('Super Admin is unrestricted', {
        description: 'Super Admin permissions must remain set to full to protect command center access.',
      });
      return;
    }

    try {
      // Optimistic update
      const updatedMatrix = {
        ...matrix,
        [roleKey]: {
          ...matrix[roleKey],
          [moduleKey]: newPerm,
        },
      };
      setMatrix(updatedMatrix);
      localStorage.setItem('transitops-permissions', JSON.stringify(updatedMatrix));

      const res = await fetch('/api/roles/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: roleKey,
          module: moduleKey,
          permission: newPerm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save changes');
      }

      toast.success('Permission Updated', {
        description: `Set ${ROLES[roleKey].label}'s ${MODULE_LABELS[moduleKey]} access to ${PERMISSION_LABELS[newPerm]}.`,
      });
    } catch (err: any) {
      toast.error('Failed to update permission', { description: err.message });
      fetchPermissions(); // Revert
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Role Management" description="Enterprise RBAC system with role hierarchy, permission matrix, and detailed access control.">
        <Button variant="outline" size="sm" onClick={() => toast.success('Matrix exported')}>
          <FileText className="w-4 h-4 mr-2" /> Export Matrix
        </Button>
      </PageHeader>

      <Tabs defaultValue="hierarchy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hierarchy">Role Hierarchy</TabsTrigger>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
          <TabsTrigger value="details">Role Details</TabsTrigger>
        </TabsList>

        {/* Role Hierarchy */}
        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organizational Role Hierarchy</CardTitle>
              <CardDescription className="text-xs">Six-tier enterprise access control structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-8">
                {/* Super Admin */}
                <RoleNode role="super_admin" isRoot />

                {/* Connector */}
                <div className="w-px h-8 bg-border" />

                {/* Horizontal connector for children */}
                <div className="relative w-full max-w-4xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-border" />

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-8">
                    {ROLE_HIERARCHY.slice(1).map((roleKey, i) => (
                      <motion.div
                        key={roleKey}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="relative">
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-border" />
                          <RoleNode role={roleKey} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Matrix */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Module Access Matrix</CardTitle>
                  <CardDescription className="text-xs">
                    {isSuperAdmin
                      ? 'Select permission levels in cell dropdowns to modify module access.'
                      : 'Permission levels for each role across all modules.'}
                  </CardDescription>
                </div>
                {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold text-xs text-muted-foreground sticky left-0 bg-card z-10">Role</th>
                      {MODULES.filter((m) => m !== 'profile').map((mod) => (
                        <th key={mod} className="p-3 font-semibold text-xs text-muted-foreground text-center min-w-[120px]">
                          <span>{MODULE_LABELS[mod]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROLE_HIERARCHY.map((roleKey) => {
                      const Icon = ROLE_ICONS[roleKey];
                      return (
                        <tr key={roleKey} className="border-b border-border last:border-0 hover:bg-accent/30">
                          <td className="p-3 sticky left-0 bg-card z-10">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-medium text-sm">{ROLES[roleKey].label}</span>
                            </div>
                          </td>
                          {MODULES.filter((m) => m !== 'profile').map((mod) => {
                            const perm = matrix[roleKey]?.[mod] || 'none';
                            
                            // If user is super admin and the row is NOT super admin, allow editing
                            if (isSuperAdmin && roleKey !== 'super_admin') {
                              return (
                                <td key={mod} className="p-2 text-center">
                                  <select
                                    value={perm}
                                    onChange={(e) => handlePermissionChange(roleKey, mod, e.target.value as Permission)}
                                    className={cn(
                                      "text-xs bg-transparent border rounded px-2 py-1 outline-none font-medium cursor-pointer transition-all",
                                      perm === 'full' ? 'border-primary/40 text-primary bg-primary/5' :
                                      perm === 'none' ? 'border-border text-muted-foreground bg-muted/10' :
                                      'border-success/40 text-success bg-success/5'
                                    )}
                                  >
                                    {(Object.keys(PERMISSION_LABELS) as Permission[]).map((p) => (
                                      <option key={p} value={p} className="bg-background text-foreground">
                                        {PERMISSION_LABELS[p]}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              );
                            }

                            // Read-only chip
                            return (
                              <td key={mod} className="p-3 text-center">
                                <PermissionChip permission={perm} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground">Legend:</span>
                {(Object.keys(PERMISSION_LABELS) as Permission[]).map((p) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', PERMISSION_COLORS[p])}>
                      {PERMISSION_LABELS[p]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Role Details */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ROLE_HIERARCHY.map((roleKey, idx) => {
              const Icon = ROLE_ICONS[roleKey];
              const roleData = ROLES[roleKey];
              const perms = matrix[roleKey] || {};
              const accessibleModules = Object.entries(perms).filter(([, p]) => p && p !== 'none');
              const hiddenModules = MODULES.filter((m) => m !== 'profile' && (!perms[m] || perms[m] === 'none'));

              return (
                <motion.div
                  key={roleKey}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-elevation-2 transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${roleData.color}15` }}>
                          <Icon className="w-6 h-6" style={{ color: roleData.color }} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{roleData.label}</CardTitle>
                          <CardDescription className="text-xs mt-1">{roleData.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Accessible Modules */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Accessible Modules</p>
                        <div className="flex flex-wrap gap-1.5">
                          {accessibleModules.map(([mod, perm]) => (
                            <div key={mod} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-xs">
                              <span className="font-medium">{MODULE_LABELS[mod as ModuleKey]}</span>
                              <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border', PERMISSION_COLORS[perm as Permission])}>
                                {PERMISSION_LABELS[perm as Permission]}
                              </span>
                            </div>
                          ))}
                          {accessibleModules.length === 0 && (
                            <span className="text-xs text-muted-foreground italic">No modules accessible.</span>
                          )}
                        </div>
                      </div>

                      {/* Hidden Modules */}
                      {hiddenModules.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Hidden Modules</p>
                          <div className="flex flex-wrap gap-1.5">
                            {hiddenModules.map((mod) => (
                              <div key={mod} className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                                <Lock className="w-3 h-3" />
                                {MODULE_LABELS[mod]}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                        <div className="text-center">
                          <p className="text-lg font-bold text-success">{accessibleModules.length}</p>
                          <p className="text-[10px] text-muted-foreground">Accessible</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-primary">{accessibleModules.filter(([, p]) => p === 'full').length}</p>
                          <p className="text-[10px] text-muted-foreground">Full Access</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-destructive">{hiddenModules.length}</p>
                          <p className="text-[10px] text-muted-foreground">No Access</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function RoleNode({ role, isRoot }: { role: Role; isRoot?: boolean }) {
  const Icon = ROLE_ICONS[role];
  const data = ROLES[role];
  return (
    <div className={cn(
      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 bg-card transition-all hover:shadow-elevation-2',
      isRoot ? 'border-primary/30 w-64' : 'border-border w-full',
    )}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${data.color}15` }}>
        <Icon className="w-6 h-6" style={{ color: data.color }} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm">{data.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 text-balance">{data.description}</p>
      </div>
    </div>
  );
}

function PermissionChip({ permission }: { permission: Permission }) {
  const Icon = PERMISSION_ICON[permission];
  if (permission === 'none') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground">
        <Minus className="w-3 h-3" />
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border', PERMISSION_COLORS[permission])}>
      {PERMISSION_LABELS[permission]}
    </span>
  );
}
