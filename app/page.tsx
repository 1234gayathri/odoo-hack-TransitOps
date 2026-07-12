'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Truck,
  ShieldCheck,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Fingerprint,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { ROLES } from '@/lib/rbac';
import type { Role } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('alex.chen@transitops.io');
  const [password, setPassword] = useState('transitops2026');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setLoading(false);
      setSuccess(true);
      login(data.user);

      toast.success('Welcome to TransitOps', {
        description: `Signed in as ${ROLES[data.user.role as Role].label}`,
      });

      setTimeout(() => router.push('/dashboard'), 600);
    } catch (err: any) {
      setLoading(false);
      toast.error('Authentication Error', {
        description: err.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel — Brand / Illustration */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px, 60px 60px',
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">TransitOps</span>
              <p className="text-xs text-blue-200">Enterprise Fleet Platform</p>
            </div>
          </div>

          {/* Hero Content */}
          <div className="max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Next-Gen Fleet Intelligence
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">
                Manage your entire fleet from a single command center.
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed mb-8">
                Real-time visibility into vehicles, drivers, trips, maintenance, and costs — all backed by enterprise-grade RBAC.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { icon: Truck, label: 'Fleet Management' },
                { icon: ShieldCheck, label: 'Role-Based Access' },
                { icon: Fingerprint, label: '2FA Security' },
                { icon: Sparkles, label: 'AI Analytics' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
                  <f.icon className="w-4 h-4 text-blue-200" />
                  <span className="text-sm text-blue-50">{f.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-blue-200">
            <span>© 2026 TransitOps Inc. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>SOC 2 Type II</span>
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">TransitOps</span>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </motion.div>
                <h3 className="text-xl font-bold">Authentication successful</h3>
                <p className="text-muted-foreground mt-1">Redirecting to your dashboard...</p>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
                  <p className="text-muted-foreground mt-1.5">Sign in to your TransitOps workspace</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        className="pl-10 h-11"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button type="button" className="text-xs text-primary hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                      <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me</Label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authenticating...</>
                    ) : (
                      <>Sign in <ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
                    OR
                  </span>
                </div>

                <Button variant="outline" className="w-full h-11" onClick={() => toast.info('SSO integration available in Enterprise plan')}>
                  <ShieldCheck className="w-4 h-4 mr-2" /> Continue with SSO
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
