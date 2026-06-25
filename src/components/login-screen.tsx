"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // simulate small delay for UX
    setTimeout(() => {
      const ok = login(password);
      if (!ok) setError("Incorrect password. Try again.");
      setLoading(false);
    }, 250);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-950/30 dark:via-background dark:to-emerald-950/20">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-700/20" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-600/20" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md px-5"
      >
        <div className="rounded-2xl border bg-card/80 p-8 shadow-xl backdrop-blur-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Fingerprint className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Staff Attendance Manager
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Admin login to manage workers, attendance & wages
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-xs font-medium text-rose-500">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !password}
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              Demo password: <code className="font-mono font-semibold">admin123</code>
            </span>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Workers don&apos;t need to log in — admin manages everything.
        </p>
      </motion.div>
    </div>
  );
}
