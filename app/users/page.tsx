'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { users } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { ROLES, hasPermission } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function UsersPage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission(role, 'users', 'create');
  const canEdit = hasPermission(role, 'users', 'update');
  const canDelete = hasPermission(role, 'users', 'delete');

  const [search, setSearch] = useState('');

  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      icon: <Users className="w-5 h-5" />,
      color: 'hsl(var(--primary))',
    },
    {
      label: 'Active',
      value: users.filter((u) => u.status === 'active').length,
      icon: <UserCheck className="w-5 h-5" />,
      color: 'hsl(var(--success))',
    },
    {
      label: 'Inactive',
      value: users.filter((u) => u.status === 'inactive').length,
      icon: <UserX className="w-5 h-5" />,
      color: 'hsl(var(--muted-foreground))',
    },
    {
      label: 'Admins',
      value: users.filter((u) => u.role === 'super_admin').length,
      icon: <Crown className="w-5 h-5" />,
      color: 'hsl(var(--warning))',
    },
  ];

  const filtered = useMemo(() => {
    return users.filter((u) => {
      return (
        search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        ROLES[u.role].label.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [search]);

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
        <Button variant="outline" size="sm" onClick={() => toast.success('User list exported')}>
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
        {canCreate && (
          <Button size="sm" onClick={() => toast.info('Add user form would open here')}>
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
                        <DropdownMenuItem onClick={() => toast.info(`Viewing ${u.name}'s profile`)}>
                          View Profile
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem onClick={() => toast.info(`Editing ${u.name}`)}>
                            Edit User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toast.info(`Resetting password for ${u.name}`)}>
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {canDelete && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => toast.info(`Deactivating ${u.name}'s account`)}
                          >
                            Deactivate
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
              Showing {filtered.length} of {users.length} users
            </p>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
