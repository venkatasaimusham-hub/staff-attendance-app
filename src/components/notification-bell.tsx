"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CalendarCheck,
  Calculator,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { toISODate } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "attendance" | "salary";
  severity: "info" | "warning";
  title: string;
  message: string;
  action?: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  count: number;
  today: string;
}

export function NotificationBell() {
  const qc = useQueryClient();
  const setView = useAppStore((s) => s.setView);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api<NotificationsResponse>(
        `/api/notifications?date=${toISODate(new Date())}`,
      ),
    refetchInterval: 60_000, // refresh every minute
  });

  const items = data?.items || [];
  const count = items.length;

  const handleAction = (action?: string) => {
    if (action === "attendance") setView("attendance");
    else if (action === "salary") setView("salary");
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Reminders</span>
          </div>
          {count > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
              {count} new
            </span>
          )}
        </div>

        <div className="custom-scrollbar max-h-80 overflow-y-auto">
          {count === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="text-sm font-medium text-foreground">
                You&apos;re all caught up!
              </p>
              <p className="text-xs text-muted-foreground">
                No pending reminders right now.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const Icon =
                  n.type === "attendance" ? CalendarCheck : Calculator;
                const isWarning = n.severity === "warning";
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleAction(n.action)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          isWarning
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300",
                        )}
                      >
                        {isWarning ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {n.message}
                        </p>
                        {n.action && (
                          <span className="mt-1 inline-block text-xs font-medium text-primary">
                            Tap to view →
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
