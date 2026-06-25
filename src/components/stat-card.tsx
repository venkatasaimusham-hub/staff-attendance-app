"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: "green" | "amber" | "rose" | "sky" | "violet" | "slate";
  className?: string;
}

const ACCENTS: Record<
  NonNullable<StatCardProps["accent"]>,
  { bg: string; text: string; ring: string }
> = {
  green: {
    bg: "bg-emerald-100 dark:bg-emerald-950/60",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-200 dark:ring-emerald-900",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-950/60",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-200 dark:ring-amber-900",
  },
  rose: {
    bg: "bg-rose-100 dark:bg-rose-950/60",
    text: "text-rose-600 dark:text-rose-400",
    ring: "ring-rose-200 dark:ring-rose-900",
  },
  sky: {
    bg: "bg-sky-100 dark:bg-sky-950/60",
    text: "text-sky-600 dark:text-sky-400",
    ring: "ring-sky-200 dark:ring-sky-900",
  },
  violet: {
    bg: "bg-violet-100 dark:bg-violet-950/60",
    text: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-200 dark:ring-violet-900",
  },
  slate: {
    bg: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-600 dark:text-slate-300",
    ring: "ring-slate-200 dark:ring-slate-700",
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "green",
  className,
}: StatCardProps) {
  const a = ACCENTS[accent];
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-foreground tabular-nums">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
            a.bg,
            a.text,
            a.ring,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
