"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calculator,
  Wallet,
  Clock,
  CalendarRange,
  TrendingUp,
  Loader2,
  Save,
  Users,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { SalaryCalcResult } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  toISODate,
  getWeekStart,
  getWeekEnd,
  formatDate,
  formatCurrency,
} from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RangeMode = "current" | "previous" | "custom";

export function SalaryView() {
  const qc = useQueryClient();
  const settings = useAppStore((s) => s.settings);
  const sym = settings?.currency || "₹";

  // Default to current week.
  const today = new Date();
  const curStart = getWeekStart(today);
  const prevStart = new Date(curStart);
  prevStart.setDate(curStart.getDate() - 7);

  const [mode, setMode] = useState<RangeMode>("current");
  const [customStart, setCustomStart] = useState(toISODate(curStart));
  const [customEnd, setCustomEnd] = useState(toISODate(getWeekEnd(today)));

  const { weekStart, weekEnd } = useMemo(() => {
    if (mode === "current") {
      return {
        weekStart: toISODate(curStart),
        weekEnd: toISODate(getWeekEnd(today)),
      };
    }
    if (mode === "previous") {
      return {
        weekStart: toISODate(prevStart),
        weekEnd: toISODate(getWeekEnd(prevStart)),
      };
    }
    return { weekStart: customStart, weekEnd: customEnd };
  }, [mode, customStart, customEnd, curStart, prevStart, today]);

  const calcMut = useMutation({
    mutationFn: () =>
      api<SalaryCalcResult>("/api/salary/calculate", {
        method: "POST",
        body: JSON.stringify({ weekStart, weekEnd, save: false }),
      }),
    onError: () => toast.error("Failed to calculate salary."),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      api<SalaryCalcResult>("/api/salary/calculate", {
        method: "POST",
        body: JSON.stringify({ weekStart, weekEnd, save: true }),
      }),
    onSuccess: () => {
      toast.success("Salary records saved.", {
        description: `${formatDate(weekStart)} – ${formatDate(weekEnd)}`,
      });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Failed to save salary records."),
  });

  // Auto-run calculation when the selected period changes.
  // `mutateAsync` is a stable reference from react-query.
  const { mutateAsync: calcSalary } = calcMut;
  useEffect(() => {
    calcSalary();
  }, [weekStart, weekEnd, calcSalary]);

  const result = calcMut.data;

  const items = result?.items || [];
  const sortedItems = [...items].sort(
    (a, b) => b.weeklySalary - a.weeklySalary,
  );

  return (
    <div className="space-y-4">
      {/* Range selector */}
      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <Label className="mb-2 block text-sm font-medium">
              Select Period
            </Label>
            <div className="flex flex-wrap gap-2">
              <RangeButton
                active={mode === "current"}
                onClick={() => setMode("current")}
                label="Current Week"
                hint={formatDate(toISODate(curStart))}
              />
              <RangeButton
                active={mode === "previous"}
                onClick={() => setMode("previous")}
                label="Previous Week"
                hint={formatDate(toISODate(prevStart))}
              />
              <RangeButton
                active={mode === "custom"}
                onClick={() => setMode("custom")}
                label="Custom Range"
                hint="Pick dates"
              />
            </div>
          </div>

          {mode === "custom" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Start Date</Label>
                <Input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">End Date</Label>
                <Input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
            <CalendarRange className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Period:</span>
            <span className="font-medium text-foreground">
              {formatDate(weekStart)} – {formatDate(weekEnd)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      {calcMut.isPending && !result ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : result ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            icon={Users}
            label="Workers"
            value={String(result.count)}
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
          />
          <SummaryCard
            icon={Wallet}
            label="Total Salary"
            value={formatCurrency(result.totalSalary, sym)}
            accent="bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
          />
          <SummaryCard
            icon={Clock}
            label="Total Overtime"
            value={`${result.items.reduce(
              (s, r) => s + r.overtimeHours,
              0,
            )}h`}
            accent="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
          />
          <SummaryCard
            icon={TrendingUp}
            label="Avg / Worker"
            value={formatCurrency(
              result.count > 0 ? result.totalSalary / result.count : 0,
              sym,
            )}
            accent="bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
          />
        </div>
      ) : null}

      {/* Results table */}
      {calcMut.isPending && !result ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : sortedItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No active workers to calculate salary for.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">
              Weekly Salary Breakdown
            </CardTitle>
            <Button
              size="sm"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Save Records
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="custom-scrollbar max-h-[55vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Worker</th>
                    <th className="px-2 py-3 text-center font-medium">P</th>
                    <th className="px-2 py-3 text-center font-medium">H</th>
                    <th className="px-2 py-3 text-center font-medium">A</th>
                    <th className="px-2 py-3 text-center font-medium">L</th>
                    <th className="px-2 py-3 text-center font-medium">OT</th>
                    <th className="px-4 py-3 text-right font-medium">Daily</th>
                    <th className="px-4 py-3 text-right font-medium">Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((r) => {
                    const initials = r.worker.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <tr
                        key={r.worker.id}
                        className="border-t hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8 border">
                              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {r.worker.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {r.worker.workerId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center tabular-nums text-emerald-600 dark:text-emerald-400">
                          {r.presentDays}
                        </td>
                        <td className="px-2 py-3 text-center tabular-nums text-amber-600 dark:text-amber-400">
                          {r.halfDays}
                        </td>
                        <td className="px-2 py-3 text-center tabular-nums text-rose-600 dark:text-rose-400">
                          {r.absentDays}
                        </td>
                        <td className="px-2 py-3 text-center tabular-nums text-sky-600 dark:text-sky-400">
                          {r.leaveDays}
                        </td>
                        <td className="px-2 py-3 text-center tabular-nums">
                          {r.overtimeHours > 0 ? `${r.overtimeHours}h` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(r.worker.dailyWage, sym)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-semibold text-primary tabular-nums">
                            {formatCurrency(r.weeklySalary, sym)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="sticky bottom-0 bg-primary/5 backdrop-blur">
                  <tr className="border-t-2 border-primary/20 font-semibold">
                    <td className="px-4 py-3" colSpan={7}>
                      Total Weekly Salary
                    </td>
                    <td className="px-4 py-3 text-right text-primary tabular-nums">
                      {formatCurrency(result?.totalSalary || 0, sym)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formula info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Calculator className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Salary Formula</p>
            <p className="mt-0.5 text-muted-foreground">
              (Present × Daily Wage) + (Half Day × Daily Wage × 0.5) + (Overtime ×{" "}
              {formatCurrency(settings?.overtimeRate || 0, sym)}/hr)
              {settings?.leavePaid
                ? " + (Leave × Daily Wage)"
                : " + Leave unpaid"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RangeButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start rounded-xl border px-4 py-2.5 text-left transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card hover:bg-muted/50",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "text-xs",
          active ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {hint}
      </span>
    </button>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            accent,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-bold text-foreground tabular-nums">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
