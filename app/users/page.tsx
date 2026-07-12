'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Download,
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
  Crown,
  Mail,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { ROLES, hasPermission, PERMISSION_MATRIX, MODULE_LABELS, PERMISSION_LABELS, PERMISSION_COLORS } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Role, User, ModuleKey, Permission } from '@/lib/types';

export default function UsersPage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission(role, 'users', 'create');
  const canEdit = hasPermission(role, 'users', 'update');
  const canDelete = hasPermission(role, 'users', 'delete');

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Profile View State
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState<Role>('dispatcher');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [formLoading, setFormLoading] = useState(false);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users || []);
      } else {
        toast.error('Failed to load users', { description: data.error });
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = useMemo(() => {
    return [
      {
        label: 'Total Users',
        value: usersList.length,
        icon: <Users className="w-5 h-5" />,
        color: 'hsl(var(--primary))',
      },
      {
        label: 'Active',
        value: usersList.filter((u) => u.status === 'active').length,
        icon: <UserCheck className="w-5 h-5" />,
        color: 'hsl(var(--success))',
      },
      {
        label: 'Inactive',
        value: usersList.filter((u) => u.status === 'inactive').length,
        icon: <UserX className="w-5 h-5" />,
        color: 'hsl(var(--muted-foreground))',
      },
      {
        label: 'Admins',
        value: usersList.filter((u) => u.role === 'super_admin').length,
        icon: <Crown className="w-5 h-5" />,
        color: 'hsl(var(--warning))',
      },
    ];
  }, [usersList]);

  const filtered = useMemo(() => {
    return usersList.filter((u) => {
      return (
        search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (ROLES[u.role] && ROLES[u.role].label.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [search, usersList]);

  const handleOpenDialog = (u: User | null = null) => {
    if (u) {
      setEditingUser(u);
      setName(u.name);
      setEmail(u.email);
      setUserRole(u.role);
      setStatus(u.status);
    } else {
      setEditingUser(null);
      setName('');
      setEmail('');
      setUserRole('dispatcher');
      setStatus('active');
    }
    setIsOpen(true);
  };

  const handleOpenProfile = (u: User) => {
    setProfileUser(u);
    setIsProfileOpen(true);
  };

  // Export users to CSV
  const handleExportCSV = () => {
    if (usersList.length === 0) {
      toast.warning('No users to export');
      return;
    }

    try {
      const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Last Active'];
      const rows = usersList.map((u) => [
        u.id,
        u.name,
        u.email,
        ROLES[u.role]?.label || u.role,
        u.status,
        formatDate(u.lastActive),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `TransitOps_Users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Export Successful', {
        description: 'The user registry has been exported to CSV.',
      });
    } catch (err: any) {
      toast.error('Export Failed', { description: err.message });
    }
  };

  // Create or Update user
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const isEdit = !!editingUser;
      const url = '/api/users';
      const method = isEdit ? 'PUT' : 'POST';
      const bodyPayload = isEdit
        ? { id: editingUser.id, name, email, role: userRole, status }
        : { name, email, role: userRole, status };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save user');
      }

      toast.success(isEdit ? 'User updated successfully' : 'User added successfully', {
        description: `${name} is now saved in the system.`,
      });

      setIsOpen(false);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      toast.error('Error Saving User', { description: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle user active status (deactivate / activate)
  const handleToggleStatus = async (u: User) => {
    try {
      const newStatus = u.status === 'active' ? 'inactive' : 'active';
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }

      toast.success(newStatus === 'inactive' ? 'Account deactivated' : 'Account activated', {
        description: `${u.name}'s status has been updated.`,
      });

      fetchUsers();
    } catch (err: any) {
      toast.error('Status Update Error', { description: err.message });
    }
  };

  // Permanently delete user
  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      toast.success('User deleted', {
        description: 'The user account was removed from the database.',
      });

      fetchUsers();
    } catch (err: any) {
      toast.error('Deletion Error', { description: err.message });
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and access permissions."
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        {canCreate && (
          <Button size="sm" onClick={() => handleOpenDialog(null)}>
            <UserPlus className="w-4 h-4 mr-2" /> Add User
          </Button>
        )}
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
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

      {/* Search */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loadingUsers ? (
        <Card className="p-12 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading users list...</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} className="hover:bg-accent/30">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {u.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ROLES[u.role] ? (
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: `${ROLES[u.role].color}30`,
                            color: ROLES[u.role].color,
                            backgroundColor: `${ROLES[u.role].color}10`,
                          }}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {ROLES[u.role].label}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">{u.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.lastActive)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenProfile(u)}>
                            View Profile
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onClick={() => handleOpenDialog(u)}>
                              Edit User
                            </DropdownMenuItem>
                          )}
                          {canEdit && (
                            <DropdownMenuItem onClick={() => handleToggleStatus(u)}>
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-destructive font-medium"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              Delete User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && (
            <EmptyState
              icon={<Users className="w-7 h-7" />}
              title="No users found"
              description="Try adjusting your search to find what you're looking for."
              action={
                <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                  Clear Search
                </Button>
              }
            />
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {filtered.length} of {usersList.length} users
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User Details' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user profile information, role status, and access settings."
                : "Create a new user account profile and assign a role to define system permissions."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveUser} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="h-10"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john.doe@company.com"
                className="h-10"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="role" className="text-xs font-semibold">System Access Role</Label>
              <select
                id="role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as Role)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Object.entries(ROLES).map(([key, r]) => (
                  <option key={key} value={key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="status" className="text-xs font-semibold">Account Login Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : 'Save User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>User Profile Details</DialogTitle>
            <DialogDescription>
              Detailed account overview and access authorization levels.
            </DialogDescription>
          </DialogHeader>

          {profileUser && (
            <div className="space-y-6 py-4">
              {/* Header profile info */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-border shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {profileUser.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold truncate">{profileUser.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5" /> {profileUser.email}
                  </p>
                </div>
              </div>

              {/* Grid info */}
              <div className="grid grid-cols-2 gap-4 border-y py-4 border-border text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Security Role</p>
                  <div className="mt-1">
                    {ROLES[profileUser.role] ? (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: `${ROLES[profileUser.role].color}30`,
                          color: ROLES[profileUser.role].color,
                          backgroundColor: `${ROLES[profileUser.role].color}10`,
                        }}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {ROLES[profileUser.role].label}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{profileUser.role}</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Account Status</p>
                  <div className="mt-1">
                    <StatusBadge status={profileUser.status} />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Account ID</p>
                  <p className="mt-1 font-mono font-medium text-foreground">{profileUser.id}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Last Active Connection</p>
                  <p className="mt-1 text-xs text-foreground font-medium">{formatDate(profileUser.lastActive)}</p>
                </div>
              </div>

              {/* Permissions overview based on role */}
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2">Module Access Privileges</p>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                  {(() => {
                    const stored = typeof window !== 'undefined' ? localStorage.getItem('transitops-permissions') : null;
                    let matrix = PERMISSION_MATRIX;
                    if (stored) {
                      try {
                        matrix = JSON.parse(stored);
                      } catch {}
                    }
                    const perms = matrix[profileUser.role] || {};
                    const accessible = Object.entries(perms).filter(([, p]) => p && p !== 'none');

                    if (accessible.length === 0) {
                      return <span className="text-xs text-muted-foreground italic">No modules accessible.</span>;
                    }

                    return accessible.map(([mod, perm]) => (
                      <div key={mod} className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border text-xs bg-accent/10">
                        <span className="font-medium text-xs">{MODULE_LABELS[mod as ModuleKey]}</span>
                        <span className={cn(
                          'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold border',
                          PERMISSION_COLORS[perm as Permission]
                        )}>
                          {PERMISSION_LABELS[perm as Permission]}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Close Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
