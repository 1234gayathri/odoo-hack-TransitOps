'use client';

import { useState, useMemo } from 'react';
import { Receipt, Plus, Download, Search, Check, X, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { expenses, expenseBreakdownData } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/rbac';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission(role, 'expenses', 'create');
  const canApprove = hasPermission(role, 'expenses', 'approve');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = search === '' ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.vehicleReg.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingAmount = expenses.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const approvedAmount = expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

  return (
    <DashboardLayout>
      <PageHeader title="Expenses" description="Manage operational costs, track approvals, and analyze spending.">
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
        {canCreate && (
          <Button size="sm" onClick={() => toast.info('Expense entry form would open here')}>
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Expenses', value: `$${totalAmount.toLocaleString()}`, color: 'text-foreground' },
          { label: 'Pending Approval', value: `$${pendingAmount.toLocaleString()}`, color: 'text-warning' },
          { label: 'Approved', value: `$${approvedAmount.toLocaleString()}`, color: 'text-success' },
          { label: 'Records', value: expenses.length, color: 'text-foreground' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <p className="text-sm font-semibold mb-4">Expense Breakdown by Category</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expenseBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {expenseBreakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {expenseBreakdownData.map((e) => (
                <div key={e.name} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="text-sm font-medium">{e.name}</span>
                  </div>
                  <span className="text-sm font-bold">${e.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by description, category, or vehicle..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((s) => (
                <Button key={s} variant={statusFilter === s ? 'secondary' : 'outline'} size="sm" className="capitalize" onClick={() => setStatusFilter(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<Receipt className="w-7 h-7" />} title="No expenses found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4">Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-4 text-sm font-medium">{e.description}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{e.category}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{e.vehicleReg}</TableCell>
                    <TableCell className="text-sm font-bold">${e.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{e.date}</TableCell>
                    <TableCell className="text-sm">{e.submittedBy}</TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canApprove && e.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => toast.success(`Approved expense: ${e.description}`)}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => toast.info(`Rejected expense: ${e.description}`)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info(`Viewing expense: ${e.description}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
