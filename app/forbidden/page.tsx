'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft, Home, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-lg"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-destructive mb-2">403</h1>
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-8">
          You don't have permission to access this page. Your role may not include the required permissions for this module.
        </p>
        <Card className="mb-6 text-left">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">Need access to this page?</p>
                <p className="text-muted-foreground">Contact your Super Admin or Fleet Manager to request the appropriate role permissions for your account.</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
          <Link href="/dashboard">
            <Button>
              <Home className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
