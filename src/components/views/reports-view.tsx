"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileBarChart,
  FileText,
  FileSpreadsheet,
  Printer,
  Wallet,
  CalendarDays,
  Loader2,
  Users,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { WeeklyReport, AttendanceReport } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  toISODate,
  getWeekStart,
  getWeekEnd,
  formatDate,
  formatCurrency,
} from "@/lib/date-utils";
import {
  exportWeeklySalaryPDF,
  exportWeeklySalaryExcel,
  exportAttendancePDF,
  exportAttendanceExcel,
  printReport,
} from "@/lib/export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ReportsView() {
  const [tab, setTab] = useState<"weekly" | "attendance">("weekly");

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "weekly" | "attendance")}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="weekly">
            <Wallet className="mr-1.5 h-4 w-4" />
            Weekly Salary
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Attendance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="mt-4">
          <WeeklySalaryReport />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendanceReportPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* --------------------------- Weekly Salary Report ------------------------- */
function WeeklySalaryReport() {
  const settings = useAppStore((s) => s.settings);
  const sym = settings?.currency || "₹";

  const today = new Date();
  const [weekStart, setWeekStart] = useState(toISODate(getWeekStart(today)));
  const [weekEnd, setWeekEnd] = useState(toISODate(getWeekEnd(today)));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["weekly-report", weekStart, weekEnd],
    queryFn: () =>
      api<WeeklyReport>(
        `/api/reports/weekly?weekStart=${weekStart}&weekEnd=${weekEnd}`,
      ),
    enabled: !!weekStart && !!weekEnd,
  });

  const handlePrevWeek = () => {
    const s = new Date(weekStart);
    s.setDate(s.getDate() - 7);
    const e = new Date(weekEnd);
    e.setDate(e.getDate() - 7);
    setWeekStart(toISODate(s));
    setWeekEnd(toISODate(e));
  };
  const handleNextWeek = () => {
    const s = new Date(weekStart);
    s.setDate(s.getDate() + 7);
    const e = new Date(weekEnd);
    e.setDate(e.getDate() + 7);
    setWeekStart(toISODate(s));
    setWeekEnd(toISODate(e));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Week Start</Label>
                <Input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Week End</Label>
                <Input
                  type="date"
                  value={weekEnd}
                  min={weekStart}
                  onChange={(e) => setWeekEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevWeek}>
                ← Prev Week
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                Next Week →
              </Button>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={!data || data.items.length === 0}
              onClick={() => data && exportWeeklySalaryPDF(data)}
            >
              <FileText className="mr-1.5 h-4 w-4 text-rose-500" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data || data.items.length === 0}
              onClick={() => data && exportWeeklySalaryExcel(data)}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data || data.items.length === 0}
              onClick={() => data && printReport("weekly", data)}
            >
              <Printer className="mr-1.5 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !data ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Select a valid week range.
          </CardContent>
        </Card>
      ) : data.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <FileBarChart className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No active workers for this period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ReportCard
          title="Weekly Salary Report"
          subtitle={`${formatDate(data.weekStart)} – ${formatDate(data.weekEnd)}`}
          business={data.businessName}
        >
          {/* Totals strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat
              icon={Users}
              label="Workers"
              value={String(data.items.length)}
            />
            <MiniStat
              icon={Wallet}
              label="Total Salary"
              value={formatCurrency(data.totalSalary, sym)}
              highlight
            />
            <MiniStat
              icon={CalendarDays}
              label="Overtime"
              value={`${data.totalOvertime}h`}
            />
            <MiniStat
              icon={FileText}
              label="OT Rate"
              value={`${formatCurrency(data.overtimeRate, sym)}/hr`}
            />
          </div>

          <div className="custom-scrollbar mt-4 max-h-[55vh] overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">ID</th>
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-2 py-2.5 text-center font-medium">P</th>
                  <th className="px-2 py-2.5 text-center font-medium">H</th>
                  <th className="px-2 py-2.5 text-center font-medium">A</th>
                  <th className="px-2 py-2.5 text-center font-medium">L</th>
                  <th className="px-2 py-2.5 text-center font-medium">OT</th>
                  <th className="px-3 py-2.5 text-right font-medium">Salary</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.workerId} className="border-t hover:bg-muted/40">
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {r.workerId}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.role}</p>
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-emerald-600">
                      {r.presentDays}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-amber-600">
                      {r.halfDays}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-rose-600">
                      {r.absentDays}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-sky-600">
                      {r.leaveDays}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums">
                      {r.overtimeHours > 0 ? `${r.overtimeHours}h` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-primary tabular-nums">
                      {formatCurrency(r.weeklySalary, sym)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-primary/5 font-semibold">
                <tr className="border-t-2 border-primary/20">
                  <td className="px-3 py-2.5" colSpan={7}>
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-right text-primary tabular-nums">
                    {formatCurrency(data.totalSalary, sym)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  );
}

/* ----------------------------- Attendance Report -------------------------- */
function AttendanceReportPanel() {
  const settings = useAppStore((s) => s.settings);
  const sym = settings?.currency || "₹";

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(toISODate(monthStart));
  const [endDate, setEndDate] = useState(toISODate(today));

  const { data, isLoading } = useQuery({
    queryKey: ["attendance-report", startDate, endDate],
    queryFn: () =>
      api<AttendanceReport>(
        `/api/reports/attendance?startDate=${startDate}&endDate=${endDate}`,
      ),
    enabled: !!startDate && !!endDate,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">End Date</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={!data || data.items.length === 0}
              onClick={() => data && exportAttendancePDF(data)}
            >
              <FileText className="mr-1.5 h-4 w-4 text-rose-500" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data || data.items.length === 0}
              onClick={() => data && exportAttendanceExcel(data)}
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data || data.items.length === 0}
              onClick={() => data && printReport("attendance", data)}
            >
              <Printer className="mr-1.5 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !data ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Select a valid date range.
          </CardContent>
        </Card>
      ) : data.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <FileBarChart className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No attendance data for this range.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ReportCard
          title="Attendance Report"
          subtitle={`${formatDate(data.startDate)} – ${formatDate(data.endDate)}`}
          business={data.businessName}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat
              icon={Users}
              label="Present"
              value={String(data.totalPresent)}
              accent="text-emerald-600"
            />
            <MiniStat
              icon={Users}
              label="Half Day"
              value={String(data.totalHalfDay)}
              accent="text-amber-600"
            />
            <MiniStat
              icon={Users}
              label="Absent"
              value={String(data.totalAbsent)}
              accent="text-rose-600"
            />
            <MiniStat
              icon={Users}
              label="Leave"
              value={String(data.totalLeave)}
              accent="text-sky-600"
            />
          </div>

          <div className="custom-scrollbar mt-4 max-h-[55vh] overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">ID</th>
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-2 py-2.5 text-center font-medium">P</th>
                  <th className="px-2 py-2.5 text-center font-medium">H</th>
                  <th className="px-2 py-2.5 text-center font-medium">A</th>
                  <th className="px-2 py-2.5 text-center font-medium">L</th>
                  <th className="px-2 py-2.5 text-center font-medium">OT</th>
                  <th className="px-3 py-2.5 text-center font-medium">Days</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.workerId} className="border-t hover:bg-muted/40">
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {r.workerId}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.role}</p>
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-emerald-600">
                      {r.present}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-amber-600">
                      {r.halfDay}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-rose-600">
                      {r.absent}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-sky-600">
                      {r.leave}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums">
                      {r.overtimeHours > 0 ? `${r.overtimeHours}h` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums font-medium">
                      {r.totalMarked}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  );
}

/* ------------------------------ Shared bits ------------------------------- */
function ReportCard({
  title,
  subtitle,
  business,
  children,
}: {
  title: string;
  subtitle: string;
  business: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="border-b bg-muted/30 pb-3">
        <CardTitle className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">{business}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {title} • {subtitle}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  highlight,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  highlight?: boolean;
  accent?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border p-3",
        highlight && "border-primary/30 bg-primary/5",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground",
          accent,
          highlight && "text-primary",
        )}
      />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-bold text-foreground tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}
