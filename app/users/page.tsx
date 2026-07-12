'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lock,
  KeyRound,
  FileSpreadsheet,
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
import { 
  ROLES,
  PERMISSION_MATRIX,
  MODULE_LABELS,
  PERMISSION_LABELS,
  PERMISSION_COLORS, 
} from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Role, User, ModuleKey, Permission } from '@/lib/types';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getRolePermissions(userRole: Role) {
  let matrix: any = PERMISSION_MATRIX;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('transitops-permissions');
    if (stored) {
      try { matrix = JSON.parse(stored); } catch {}
    }
  }
  return matrix[userRole] || {};
}

export default function UsersPage() {
  const { user, hasPermission, canAccessModule } = useAuth();
  const currentRole = user?.role || 'super_admin';
  const canCreate = hasPermission('users', 'create');
  const canEdit   = hasPermission('users', 'update');
  const canDelete = hasPermission('users', 'delete');

  const [usersList, setUsersList]         = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers]   = useState(true);
  const [search, setSearch]               = useState('');

  // Add / Edit dialog
  const [isOpen, setIsOpen]               = useState(false);
  const [editingUser, setEditingUser]     = useState<User | null>(null);
  const [formName, setFormName]           = useState('');
  const [formEmail, setFormEmail]         = useState('');
  const [formRole, setFormRole]           = useState<Role>('dispatcher');
  const [formStatus, setFormStatus]       = useState<'active' | 'inactive'>('active');
  const [formLoading, setFormLoading]     = useState(false);
  const [formErrors, setFormErrors]       = useState<Record<string, string>>({});

  // Profile dialog
  const [profileUser, setProfileUser]     = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res  = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsersList(data.users || []);
      else toast.error('Failed to load users', { description: data.error });
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const stats = useMemo(() => [
    { label: 'Total Users',  value: usersList.length,                                       icon: <Users className="w-5 h-5" />,     color: '#6366f1' },
    { label: 'Active',       value: usersList.filter(u => u.status === 'active').length,     icon: <UserCheck className="w-5 h-5" />, color: '#22c55e' },
    { label: 'Inactive',     value: usersList.filter(u => u.status === 'inactive').length,   icon: <UserX className="w-5 h-5" />,     color: '#94a3b8' },
    { label: 'Super Admins', value: usersList.filter(u => u.role === 'super_admin').length,  icon: <Crown className="w-5 h-5" />,     color: '#f59e0b' },
  ], [usersList]);

  const filtered = useMemo(() =>
    usersList.filter(u =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      ROLES[u.role]?.label.toLowerCase().includes(search.toLowerCase())
    ), [search, usersList]);

  const openDialog = (u: User | null = null) => {
    setFormErrors({});
    if (u) {
      setEditingUser(u);
      setFormName(u.name);
      setFormEmail(u.email);
      setFormRole(u.role);
      setFormStatus(u.status);
    } else {
      setEditingUser(null);
      setFormName('');
      setFormEmail('');
      setFormRole('dispatcher');
      setFormStatus('active');
    }
    setIsOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formName.trim())                        errs.name  = 'Full name is required.';
    if (!formEmail.trim())                       errs.email = 'Email address is required.';
    else if (!emailRegex.test(formEmail.trim())) errs.email = 'Enter a valid email (e.g. name@company.com).';
    if (!formRole)                               errs.role  = 'Please select a role.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormLoading(true);

    const isEdit  = !!editingUser;
    const payload = isEdit
      ? { id: editingUser.id, name: formName, email: formEmail, role: formRole, status: formStatus }
      : { name: formName, email: formEmail, role: formRole, status: formStatus };

    try {
      const res  = await fetch('/api/users', {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes('email')) {
          setFormErrors(prev => ({ ...prev, email: data.error }));
        } else {
          toast.error('Failed to save user', { description: data.error });
        }
        return;
      }

      toast.success(isEdit ? 'User updated!' : 'User added!', {
        description: `${formName} has been saved successfully.`,
      });
      setIsOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error('Network error', { description: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      const res  = await fetch('/api/users', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: u.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(newStatus === 'inactive' ? 'Account deactivated' : 'Account activated');
      fetchUsers();
    } catch (err: any) {
      toast.error('Status Error', { description: err.message });
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      const res  = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('User deleted', { description: `${name} has been removed.` });
      fetchUsers();
    } catch (err: any) {
      toast.error('Deletion Error', { description: err.message });
    }
  };

  const handleExportCSV = () => {
    if (usersList.length === 0) { toast.warning('No users to export'); return; }

    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Last Active'];
    const rows    = usersList.map(u => [
      u.id, u.name, u.email,
      ROLES[u.role]?.label || u.role,
      u.status,
      formatDate(u.lastActive),
    ]);
    const csv  = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `TransitOps_Users_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Export complete!', { description: `${usersList.length} users exported as CSV.` });
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and PostgreSQL-backed access control."
      >
        <Button
          id="export-users-csv"
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export CSV
        </Button>

        {canCreate && (
          <Button id="add-user-btn" size="sm" onClick={() => openDialog(null)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-default">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}18`, color: s.color }}>
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loadingUsers ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading users from database...</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4 w-[280px]">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {filtered.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 shrink-0">
                            <AvatarFallback
                              className="text-xs font-bold"
                              style={{
                                backgroundColor: `${ROLES[u.role]?.color ?? '#6366f1'}18`,
                                color: ROLES[u.role]?.color ?? '#6366f1',
                              }}
                            >
                              {u.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 shrink-0" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {ROLES[u.role] ? (
                          <Badge variant="outline" className="text-xs gap-1" style={{
                            borderColor: `${ROLES[u.role].color}35`,
                            color: ROLES[u.role].color,
                            backgroundColor: `${ROLES[u.role].color}10`,
                          }}>
                            <Shield className="w-3 h-3" />
                            {ROLES[u.role].label}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">{u.role}</Badge>
                        )}
                      </TableCell>

                      <TableCell><StatusBadge status={u.status} /></TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(u.lastActive)}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              id={`view-profile-${u.id}`}
                              onClick={() => { setProfileUser(u); setIsProfileOpen(true); }}
                              className="gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Profile
                            </DropdownMenuItem>

                            {canEdit && (
                              <DropdownMenuItem onClick={() => openDialog(u)} className="gap-2 cursor-pointer">
                                <KeyRound className="w-3.5 h-3.5" /> Edit User
                              </DropdownMenuItem>
                            )}

                            {canEdit && (
                              <DropdownMenuItem onClick={() => handleToggleStatus(u)} className="gap-2 cursor-pointer">
                                {u.status === 'active'
                                  ? <><XCircle className="w-3.5 h-3.5" /> Deactivate</>
                                  : <><CheckCircle2 className="w-3.5 h-3.5" /> Activate</>
                                }
                              </DropdownMenuItem>
                            )}

                            {canDelete && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive gap-2 cursor-pointer"
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                >
                                  <X className="w-3.5 h-3.5" /> Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && (
            <EmptyState
              icon={<Users className="w-7 h-7" />}
              title="No users found"
              description="Try adjusting your search query."
              action={<Button variant="outline" size="sm" onClick={() => setSearch('')}>Clear Search</Button>}
            />
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
              <span>Showing {filtered.length} of {usersList.length} users</span>
              <span className="hidden sm:block">PostgreSQL database</span>
            </div>
          )}
        </Card>
      )}

      {/* ===== Add / Edit Dialog ===== */}
      <Dialog open={isOpen} onOpenChange={v => { if (!formLoading) setIsOpen(v); }}>
        <DialogContent className="sm:max-w-[430px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update the user's profile, role, or account status."
                : 'Fill in the details below to create a new user account.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveUser} noValidate className="space-y-4 pt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="form-name" className="text-xs font-semibold">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-name"
                value={formName}
                onChange={e => { setFormName(e.target.value); setFormErrors(p => ({ ...p, name: '' })); }}
                placeholder="e.g. John Doe"
                className={cn('h-10', formErrors.name && 'border-destructive focus-visible:ring-destructive')}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="form-email" className="text-xs font-semibold">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="form-email"
                type="email"
                value={formEmail}
                onChange={e => { setFormEmail(e.target.value); setFormErrors(p => ({ ...p, email: '' })); }}
                placeholder="e.g. john.doe@company.com"
                className={cn('h-10', formErrors.email && 'border-destructive focus-visible:ring-destructive')}
              />
              {formErrors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.email}
                </p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="form-role" className="text-xs font-semibold">
                System Role <span className="text-destructive">*</span>
              </Label>
              <select
                id="form-role"
                value={formRole}
                onChange={e => { setFormRole(e.target.value as Role); setFormErrors(p => ({ ...p, role: '' })); }}
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  formErrors.role && 'border-destructive'
                )}
              >
                {Object.entries(ROLES).map(([key, r]) => (
                  <option key={key} value={key}>{r.label}</option>
                ))}
              </select>
              {formErrors.role && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.role}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="form-status" className="text-xs font-semibold">Account Status</Label>
              <select
                id="form-status"
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as 'active' | 'inactive')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="active">Active - can log in</option>
                <option value="inactive">Inactive - login blocked</option>
              </select>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} className="min-w-[100px]">
                {formLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
                  : 'Save User'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== View Profile Dialog ===== */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
          {profileUser && (() => {
            const roleData   = ROLES[profileUser.role];
            const perms      = getRolePermissions(profileUser.role);
            const accessible = Object.entries(perms).filter(([, p]) => p && p !== 'none');
            const restricted = (Object.keys(MODULE_LABELS) as ModuleKey[]).filter(m => !perms[m] || perms[m] === 'none');

            return (
              <>
                {/* Header */}
                <div
                  className="relative px-6 pt-8 pb-6"
                  style={{ background: `linear-gradient(135deg, ${roleData?.color ?? '#6366f1'}22 0%, ${roleData?.color ?? '#6366f1'}08 100%)` }}
                >
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/10 text-muted-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2" style={{ borderColor: `${roleData?.color ?? '#6366f1'}40` }}>
                      <AvatarFallback
                        className="text-xl font-bold"
                        style={{ backgroundColor: `${roleData?.color ?? '#6366f1'}20`, color: roleData?.color ?? '#6366f1' }}
                      >
                        {profileUser.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold truncate">{profileUser.name}</h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" /> {profileUser.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {roleData && (
                          <Badge variant="outline" className="text-xs gap-1"
                            style={{ borderColor: `${roleData.color}40`, color: roleData.color, backgroundColor: `${roleData.color}15` }}>
                            <Shield className="w-3 h-3" /> {roleData.label}
                          </Badge>
                        )}
                        <StatusBadge status={profileUser.status} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 pb-6 space-y-5 max-h-[55vh] overflow-y-auto">
                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Account ID</p>
                      <p className="font-mono font-semibold text-foreground">{profileUser.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Last Active</p>
                      <p className="font-medium text-foreground text-xs">{formatDate(profileUser.lastActive)}</p>
                    </div>
                    {roleData && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Role Description</p>
                        <p className="text-xs text-foreground">{roleData.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Accessible modules */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Accessible Modules ({accessible.length})
                    </p>
                    {accessible.length === 0
                      ? <p className="text-xs text-muted-foreground italic">No modules accessible.</p>
                      : (
                        <div className="flex flex-wrap gap-1.5">
                          {accessible.map(([mod, perm]) => (
                            <div key={mod} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-card text-xs">
                              <span className="font-medium text-foreground">{MODULE_LABELS[mod as ModuleKey]}</span>
                              <span className={cn(
                                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold border',
                                PERMISSION_COLORS[perm as Permission]
                              )}>
                                {PERMISSION_LABELS[perm as Permission]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  </div>

                  {/* Restricted modules */}
                  {restricted.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-destructive/60" />
                        Restricted Modules ({restricted.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {restricted.map(mod => (
                          <div key={mod} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs">
                            <Lock className="w-3 h-3" /> {MODULE_LABELS[mod]}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                    <div className="text-center p-3 rounded-xl bg-emerald-500/10">
                      <p className="text-xl font-bold text-emerald-600">{accessible.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Accessible</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-primary/10">
                      <p className="text-xl font-bold text-primary">
                        {accessible.filter(([, p]) => p === 'full').length}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Full Access</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-destructive/10">
                      <p className="text-xl font-bold text-destructive">{restricted.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Restricted</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => { setIsProfileOpen(false); openDialog(profileUser); }}>
                      Edit User
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setIsProfileOpen(false)}>Close</Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
