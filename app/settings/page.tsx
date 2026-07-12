'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Palette,
  Bell,
  Shield,
  Sun,
  Moon,
  Monitor,
  Globe,
  Clock,
  Building,
  Lock,
  KeyRound,
  Smartphone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PageHeader } from '@/components/shared/page-components';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TIMEZONES = [
  'America/Chicago (CST)',
  'America/New_York (EST)',
  'America/Denver (MST)',
  'America/Los_Angeles (PST)',
  'Europe/London (GMT)',
  'Europe/Paris (CET)',
  'Asia/Tokyo (JST)',
  'Australia/Sydney (AEDT)',
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // General settings
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState(TIMEZONES[0]);
  const [workspaceName, setWorkspaceName] = useState('TransitOps Fleet');

  // Appearance
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Notification toggles
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Security
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [passwordPolicy, setPasswordPolicy] = useState('strict');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully`);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Configure your workspace, preferences, and system configuration."
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" /> Security
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">General Configuration</CardTitle>
              <CardDescription className="text-xs">
                Configure your workspace language, timezone, and organization details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Language</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select your preferred display language
                    </p>
                  </div>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(var(--chart-5) / 0.1)' }}>
                    <Clock className="w-5 h-5" style={{ color: 'hsl(var(--chart-5))' }} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Timezone</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Set your local timezone for accurate scheduling
                    </p>
                  </div>
                </div>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Workspace Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Workspace Name</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your organization or fleet workspace identifier
                    </p>
                  </div>
                </div>
                <Input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full sm:w-[240px]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSave('General')}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance & Display</CardTitle>
              <CardDescription className="text-xs">
                Customize the visual theme and layout density of your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="pb-6 border-b border-border">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Theme</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose between light, dark, or system theme
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {themeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = mounted && theme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
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
              </div>

              {/* Density */}
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(var(--chart-5) / 0.1)' }}>
                    <Monitor className="w-5 h-5" style={{ color: 'hsl(var(--chart-5))' }} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Layout Density</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Adjust spacing and compactness of the interface
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  {(['comfortable', 'compact'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDensity(d)}
                      className={cn(
                        'flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all capitalize',
                        density === d
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/30 text-foreground'
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSave('Appearance')}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription className="text-xs">
                Configure how and when you receive system notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {/* Email Notifications */}
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

              {/* Push Notifications */}
              <div className="flex items-center justify-between py-4 border-b border-border">
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

              {/* In-App Notifications */}
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(var(--chart-5) / 0.1)' }}>
                    <Bell className="w-5 h-5" style={{ color: 'hsl(var(--chart-5))' }} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">In-App Notifications</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Show notifications within the application
                    </p>
                  </div>
                </div>
                <Switch checked={inAppNotifs} onCheckedChange={setInAppNotifs} />
              </div>

              {/* Weekly Digest */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Weekly Digest</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Receive a weekly summary of fleet activity every Monday
                    </p>
                  </div>
                </div>
                <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={() => handleSave('Notification')}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security & Access</CardTitle>
              <CardDescription className="text-xs">
                Configure authentication, session policies, and password requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {/* 2FA */}
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Require a verification code in addition to your password
                    </p>
                  </div>
                </div>
                <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
              </div>

              {/* Session Timeout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(var(--chart-5) / 0.1)' }}>
                    <Clock className="w-5 h-5" style={{ color: 'hsl(var(--chart-5))' }} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Session Timeout</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Automatically log out after a period of inactivity
                    </p>
                  </div>
                </div>
                <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="0">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Policy */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Password Policy</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enforce password complexity requirements
                    </p>
                  </div>
                </div>
                <Select value={passwordPolicy} onValueChange={setPasswordPolicy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (8+ chars)</SelectItem>
                    <SelectItem value="strict">Strict (12+ chars, mixed)</SelectItem>
                    <SelectItem value="maximum">Maximum (16+ chars, symbols)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Security Status */}
              <div className="mt-6 p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <p className="text-sm font-medium">Security Status</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', twoFactor ? 'bg-success' : 'bg-warning')} />
                    <span className="text-muted-foreground">2FA: {twoFactor ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-muted-foreground">SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-muted-foreground">Audit Logging Active</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave('Security')}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
