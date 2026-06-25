"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  UserX,
  Wallet,
  TrendingUp,
  CalendarClock,
  Activity,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api-client";
import type { DashboardData } from "@/lib/types";
import {
  formatDateShort,
  formatCurrency,
  timeAgo,
  toISODate,
} from "@/lib/date-utils";
import { useAppStore } from "@/lib/store";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export function DashboardView() {
  const qc = useQueryClient();
  const settings = useAppStore((s) => s.settings);
  const sym = settings?.currency || "₹";

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      api<DashboardData>(`/api/dashboard?date=${toISODate(new Date())}`),
  });

  const seedMut = useMutation({
    mutationFn: () => api<{ seeded: boolean; message?: string }>("/api/seed", { method: "POST" }),
    onSuccess: (res) => {
      if (res.seeded) {
        toast.success("Demo data added!", {
          description: "Sample workers & attendance created.",
        });
      } else {
        toast.info(res.message || "Already seeded.");
      }
      qc.invalidateQueries();
    },
    onError: () => toast.error("Failed to seed demo data."),
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Could not load dashboard data.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isEmpty =
    data.totalWorkers === 0 && data.recentActivities.length === 0;

  const trendChart = data.trend.map((t) => ({
    date: formatDateShort(t.date),
    Present: t.present,
    "Half Day": t.half,
    Absent: t.absent,
    Leave: t.leave,
  }));

  return (
    <div className="space-y-5">
      {isEmpty && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                Welcome! Your workspace is empty.
              </h3>
              <p className="text-sm text-muted-foreground">
                Add workers manually or load demo data to explore the app.
              </p>
            </div>
            <Button onClick={() => seedMut.mutate()} disabled={seedMut.isPending}>
              {seedMut.isPending ? "Loading…" : "Load demo data"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Workers"
          value={data.totalWorkers}
          icon={Users}
          hint={`${data.activeWorkers} active • ${data.inactiveWorkers} inactive`}
          accent="green"
        />
        <StatCard
          label="Present Today"
          value={data.presentToday}
          icon={UserCheck}
          hint={`${data.onLeaveToday} on leave`}
          accent="sky"
        />
        <StatCard
          label="Absent Today"
          value={data.absentToday}
          icon={UserX}
          hint={`${data.notMarked} not marked`}
          accent="rose"
        />
        <StatCard
          label="Weekly Salary"
          value={formatCurrency(data.totalWeeklySalary, sym)}
          icon={Wallet}
          hint={`${formatDateShort(data.weekStart)} – ${formatDateShort(data.weekEnd)}`}
          accent="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">
              7-Day Attendance Trend
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendChart}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    stroke="hsl(var(--muted-foreground))"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  <Area
                    type="monotone"
                    dataKey="Present"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gPresent)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Absent"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fill="url(#gAbsent)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Half Day"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    fillOpacity={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="Leave"
                    stroke="#0ea5e9"
                    strokeWidth={1.5}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance percentage + today summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold tabular-nums text-foreground">
                  {data.attendancePercentage}%
                </p>
                <p className="text-xs text-muted-foreground">
                  of active workforce present today
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CalendarClock className="h-6 w-6" />
              </div>
            </div>
            <Progress value={data.attendancePercentage} className="h-2.5" />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <TodayTile
                icon={CheckCircle2}
                label="Present"
                value={data.presentToday}
                className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              />
              <TodayTile
                icon={XCircle}
                label="Absent"
                value={data.absentToday}
                className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              />
              <TodayTile
                icon={Clock}
                label="On Leave"
                value={data.onLeaveToday}
                className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
              />
              <TodayTile
                icon={UserX}
                label="Not Marked"
                value={data.notMarked}
                className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          ) : (
            <ul className="custom-scrollbar max-h-80 space-y-1 overflow-y-auto pr-1">
              {data.recentActivities.map((a) => (
                <li
                  key={`${a.type}-${a.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      a.type === "worker"
                        ? "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"
                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
                    }`}
                  >
                    {a.type === "worker" ? (
                      <UserPlus className="h-4 w-4" />
                    ) : (
                      <CalendarClock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      <span className="font-medium">{a.workerName}</span>
                      {a.type === "worker" ? (
                        <> added as a new worker</>
                      ) : (
                        <> marked {a.status.toLowerCase()}</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(new Date(a.createdAt))} • {formatDateShort(a.date)}
                    </p>
                  </div>
                  {a.type === "attendance" && (
                    <Badge variant="outline" className="capitalize">
                      {a.status}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TodayTile({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${className}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="text-lg font-bold leading-none tabular-nums">{value}</p>
        <p className="truncate text-[11px] opacity-80">{label}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[320px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
