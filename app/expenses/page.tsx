'use client';

import { useState, useMemo, useEffect } from 'react';
import { Receipt, Plus, Download, Search, Check, X, Eye, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared/page-components';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/lib/auth-context';

import { toast } from 'sonner';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vehicleId: string;
  vehicleReg: string;
  status: string;
  submittedBy: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Fuel': 'hsl(var(--chart-1))',
  'Maintenance': 'hsl(var(--chart-2))',
  'Insurance': 'hsl(var(--chart-3))',
  'Parts': 'hsl(var(--chart-4))',
  'Tolls': 'hsl(var(--chart-5))',
};

export default function ExpensesPage() {
  const { user, hasPermission, canAccessModule } = useAuth();
  const role = user?.role || 'super_admin';
  const canCreate = hasPermission('expenses', 'create');
  const canApprove = hasPermission('expenses', 'approve');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.expenses || []);
      } else {
        toast.error('Failed to load expenses');
      }
    } catch (err: any) {
      toast.error('Network Error', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleApproveReject = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        toast.success(`Expense successfully ${newStatus}`);
        fetchExpenses();
      } else {
        toast.error('Failed to update expense status');
      }
    } catch (err) {
      toast.error('Network error during approval action');
    }
  };

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = search === '' ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.vehicleReg && e.vehicleReg.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, expenses]);

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingAmount = expenses.filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const approvedAmount = expenses.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amount, 0);

  // Dynamic Chart Breakdown based on database records
  const expenseBreakdownData = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.status === 'approved') {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
      }
    });

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || 'hsl(var(--muted))',
    }));
  }, [expenses]);

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.warning('No expenses to export');
      return;
    }
    try {
      const headers = ['ID', 'Category', 'Description', 'Amount', 'Date', 'Vehicle Reg', 'Status', 'Submitted By'];
      const rows = expenses.map(e => [
        e.id, e.category, e.description, e.amount, e.date, e.vehicleReg || 'N/A', e.status, e.submittedBy
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TransitOps_Expenses_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Expenses exported successfully');
    } catch (err: any) {
      toast.error('Export Error', { description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Expenses" description="Manage operational costs, track approvals, and analyze spending.">
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
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
          <p className="text-sm font-semibold mb-4">Expense Breakdown by Category (Approved)</p>
          {expenseBreakdownData.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No approved expenses logged for chart display.</div>
          ) : (
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
          )}
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
      {loading ? (
        <Card className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading expenses database...</p>
        </Card>
      ) : (
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
                    <TableHead className="w-[100px] text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="pl-4 text-sm font-medium">{e.description}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{e.category}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{e.vehicleReg || 'N/A'}</TableCell>
                      <TableCell className="text-sm font-bold">${e.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{e.date}</TableCell>
                      <TableCell className="text-sm">{e.submittedBy}</TableCell>
                      <TableCell><StatusBadge status={e.status} /></TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex gap-1 justify-end">
                          {canApprove && e.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleApproveReject(e.id, 'approved')}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleApproveReject(e.id, 'rejected')}>
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
      )}
    </DashboardLayout>
  );
}
