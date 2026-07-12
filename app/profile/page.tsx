'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Building,
  Lock,
  KeyRound,
  Smartphone,
  Monitor,
  Tablet,
  Shield,
  Activity,
  Bell,
  Palette,
  Sun,
  Moon,
  MonitorSmartphone,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader, StatusBadge } from '@/components/shared/page-components';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/rbac';
import { auditLogs } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const RECENT_ACTIVITY = [
  { id: '1', action: 'Logged in from Houston, TX', icon: Monitor, time: '2 hours ago', type: 'auth' },
  { id: '2', action: 'Updated vehicle FLT-2024-001 odometer', icon: Activity, time: '5 hours ago', type: 'update' },
  { id: '3', action: 'Approved expense report #e1', icon: CheckCircle2, time: '8 hours ago', type: 'approve' },
  { id: '4', action: 'Created trip #t4 Fort Worth to El Paso', icon: Activity, time: '1 day ago', type: 'create' },
  { id: '5', action: 'Changed password', icon: KeyRound, time: '3 days ago', type: 'security' },
];

const ACTIVE_SESSIONS = [
  { id: 's1', device: 'MacBook Pro', browser: 'Chrome 126', location: 'Houston, TX', ip: '192.168.1.100', current: true, icon: Monitor },
  { id: 's2', device: 'iPhone 15 Pro', browser: 'Safari Mobile', location: 'Houston, TX', ip: '192.168.1.101', current: false, icon: Smartphone },
  { id: 's3', device: 'iPad Air', browser: 'Safari', location: 'Dallas, TX', ip: '192.168.1.102', current: false, icon: Tablet },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const role = user?.role || 'super_admin';
  const roleData = ROLES[role];

  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || 'Alexander Chen',
    email: user?.email || 'alex.chen@transitops.io',
    phone: '+1 713-555-0100',
    department: 'Operations',
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [twoFactor, setTwoFactor] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>('light');

  const handleSavePersonal = () => {
    toast.success('Personal information updated successfully');
  };

  const handlePasswordChange = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password changed successfully');
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const handleRevokeSession = (id: string) => {
    toast.success('Session revoked successfully');
  };

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: MonitorSmartphone },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Profile"
        description="Manage your personal information, security, and preferences."
      />

      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-chart-5/20" />
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <Avatar className="w-24 h-24 border-4 border-card shadow-elevation-2 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {user?.avatar || 'AC'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <h2 className="text-xl font-bold">{personalInfo.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: `${roleData.color}30`,
                      color: roleData.color,
                      backgroundColor: `${roleData.color}10`,
                    }}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {roleData.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {personalInfo.email}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info('Profile photo upload would open here')}>
                Change Photo
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="personal" className="gap-2">
            <User className="w-4 h-4" /> Personal Info
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" /> Activity
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Bell className="w-4 h-4" /> Preferences
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription className="text-xs">
                Update your personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="department"
                      value={personalInfo.department}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, department: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <Button onClick={handleSavePersonal}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
              <CardDescription className="text-xs">
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-6">
                <Button onClick={handlePasswordChange}>Update Password</Button>
              </div>
            </CardContent>
          </Card>

          {/* 2FA Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
              <CardDescription className="text-xs">
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {twoFactor ? '2FA Enabled' : '2FA Disabled'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {twoFactor
                        ? 'Your account is protected with two-factor authentication'
                        : 'Enable 2FA to secure your account with a verification code'}
                    </p>
                  </div>
                </div>
                <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Sessions</CardTitle>
              <CardDescription className="text-xs">
                Devices currently signed in to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ACTIVE_SESSIONS.map((session) => {
                const Icon = session.icon;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{session.device}</p>
                          {session.current && (
                            <Badge variant="outline" className="text-[10px] border-success/30 text-success">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          {session.browser} · <MapPin className="w-3 h-3" /> {session.location} · {session.ip}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription className="text-xs">
                Your latest actions and account activity timeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-2 bottom-2 w-px bg-border" />

                <div className="space-y-4">
                  {RECENT_ACTIVITY.map((activity, i) => {
                    const Icon = activity.icon;
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-4 relative"
                      >
                        <div className="w-10 h-10 rounded-full bg-card border-2 border-border flex items-center justify-center shrink-0 z-10">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {activity.time}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription className="text-xs">
                Configure how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Receive alerts and updates via email
                    </p>
                  </div>
                </div>
                <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
              </div>
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Get real-time push notifications on your devices
                    </p>
                  </div>
                </div>
                <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
              </div>
            </CardContent>
          </Card>

          {/* Theme Preference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Theme Preference</CardTitle>
              <CardDescription className="text-xs">
                Choose your preferred visual theme.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Display Theme</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select light, dark, or system theme
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = themePref === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setThemePref(opt.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-sm font-medium', isActive ? 'text-primary' : 'text-foreground')}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
