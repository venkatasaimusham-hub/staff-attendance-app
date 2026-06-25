"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  Wallet,
  CalendarOff,
  Building2,
  Coins,
  Download,
  Upload,
  Loader2,
  ShieldCheck,
  Database,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { Settings } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function SettingsView() {
  const qc = useQueryClient();
  const setSettings = useAppStore((s) => s.setSettings);
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<Settings>("/api/settings"),
  });

  const [form, setForm] = useState<Settings | null>(null);
  // Sync form once data loads.
  if (data && !form && data.id) {
    setForm(data);
  }

  const saveMut = useMutation({
    mutationFn: (payload: Partial<Settings>) =>
      api<Settings>("/api/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: (s) => {
      setForm(s);
      setSettings(s);
      toast.success("Settings saved.");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => toast.error("Failed to save settings."),
  });

  const backupMut = useMutation({
    mutationFn: () => fetch("/api/backup").then((r) => r.json()),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `staff-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded.");
    },
    onError: () => toast.error("Backup failed."),
  });

  const restoreMut = useMutation({
    mutationFn: (file: File) =>
      file.text().then((text) =>
        api<{ restored: Record<string, number> }>("/api/backup", {
          method: "POST",
          body: text,
        }),
      ),
    onSuccess: (res) => {
      toast.success("Backup restored.", {
        description: `${res.restored.workers} workers, ${res.restored.attendance} attendance records.`,
      });
      qc.invalidateQueries();
    },
    onError: () => toast.error("Restore failed. Invalid backup file."),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) restoreMut.mutate(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Business settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-4 w-4 text-primary" />
            Business Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Business Name">
            <Input
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              placeholder="My Business"
            />
          </Field>
          <Field label="Currency Symbol">
            <Input
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              placeholder="₹"
              className="max-w-24"
            />
          </Field>
        </CardContent>
      </Card>

      {/* Salary settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Wallet className="h-4 w-4 text-primary" />
            Salary Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Overtime Rate (per hour)"
            hint="Extra amount paid for each overtime hour worked."
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={form.overtimeRate}
                onChange={(e) =>
                  setForm({ ...form, overtimeRate: Number(e.target.value) || 0 })
                }
                className="max-w-40"
              />
              <span className="text-sm text-muted-foreground">
                {form.currency}/hr
              </span>
            </div>
          </Field>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-start gap-3">
              <CalendarOff className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Pay for Leave days
                </p>
                <p className="text-xs text-muted-foreground">
                  When enabled, Leave days are counted as paid (full wage).
                  When disabled, Leave days earn no salary.
                </p>
              </div>
            </div>
            <Switch
              checked={form.leavePaid}
              onCheckedChange={(v) => setForm({ ...form, leavePaid: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <SettingsIcon className="h-4 w-4 text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-start gap-3">
              {theme === "dark" ? (
                <Moon className="mt-0.5 h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="mt-0.5 h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  Dark Mode
                </p>
                <p className="text-xs text-muted-foreground">
                  Switch between light and dark themes.
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Database className="h-4 w-4 text-primary" />
            Backup &amp; Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Export all workers, attendance &amp; salary data to a JSON file you
            can restore later. Works fully offline.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => backupMut.mutate()}
              disabled={backupMut.isPending}
            >
              {backupMut.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              Download Backup
            </Button>
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={restoreMut.isPending}
            >
              {restoreMut.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-1.5 h-4 w-4" />
              )}
              Restore Backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleFile}
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>
              Restoring replaces all current data. Download a backup first if
              unsure.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button
          size="lg"
          onClick={() =>
            saveMut.mutate({
              businessName: form.businessName,
              currency: form.currency,
              overtimeRate: form.overtimeRate,
              leavePaid: form.leavePaid,
              theme: theme || "light",
            })
          }
          disabled={saveMut.isPending}
        >
          {saveMut.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Coins className="mr-1.5 h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
