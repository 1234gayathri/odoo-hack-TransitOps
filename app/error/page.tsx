'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertOctagon, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-warning/10 flex items-center justify-center mb-6">
          <AlertOctagon className="w-10 h-10 text-warning" />
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-warning mb-2">500</h1>
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-8">
          An unexpected error occurred. Our team has been notified and is working to resolve the issue.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Try Again
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
