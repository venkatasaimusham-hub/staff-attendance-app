"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  CalendarOff,
  Search,
  History,
  Loader2,
  Wand2,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { Worker, Paginated, Attendance, AttendanceStatus } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  toISODate,
  formatDate,
  formatDateShort,
  DAYS_OF_WEEK as _DW,
} from "@/lib/date-utils";
import { ATTENDANCE_STATUSES, STATUS_STYLES, DAYS_OF_WEEK } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

void _DW;

interface RowState {
  status: AttendanceStatus;
  overtime: string;
  remarks: string;
}

export function AttendanceView() {
  return (
    <Tabs defaultValue="mark" className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="mark">
          <CalendarCheck className="mr-1.5 h-4 w-4" />
          Mark Attendance
        </TabsTrigger>
        <TabsTrigger value="history">
          <History className="mr-1.5 h-4 w-4" />
          History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="mark">
        <MarkAttendance />
      </TabsContent>
      <TabsContent value="history">
        <AttendanceHistory />
      </TabsContent>
    </Tabs>
  );
}

/* ----------------------------- Mark Attendance ---------------------------- */
function MarkAttendance() {
  const qc = useQueryClient();
  const [date, setDate] = useState(toISODate(new Date()));
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [dirty, setDirty] = useState(false);

  // Load all active workers (no pagination for marking).
  const { data: workersRes } = useQuery({
    queryKey: ["workers", "", "Active", 1, 1000],
    queryFn: () =>
      api<Paginated<Worker>>(
        `/api/workers?status=Active&page=1&pageSize=1000`,
      ),
  });
  const workers = workersRes?.items || [];

  // Load existing attendance for the selected date.
  const { data: existing, isLoading } = useQuery({
    queryKey: ["attendance", date],
    queryFn: () =>
      api<{ items: Attendance[] }>(`/api/attendance?date=${date}`),
    enabled: !!date,
  });

  // Sync row state when workers or existing attendance load/change.
  useEffect(() => {
    if (!workers.length) return;
    const map: Record<string, RowState> = {};
    const dayName = DAYS_OF_WEEK[new Date(date).getDay()];
    for (const w of workers) {
      const rec = existing?.items.find((a) => a.workerId === w.id);
      // Default to "Leave" for weekly off day, else "Present".
      const isOff = w.weeklyOff === dayName;
      map[w.id] = {
        status: rec?.status || (isOff ? "Leave" : "Present"),
        overtime: rec?.overtimeHours ? String(rec.overtimeHours) : "",
        remarks: rec?.remarks || "",
      };
    }
    setRows(map);
    setDirty(false);
  }, [workers, existing, date]);

  const bulkMut = useMutation({
    mutationFn: () => {
      const entries = workers.map((w) => ({
        workerId: w.id,
        status: rows[w.id]?.status || "Present",
        overtimeHours: Number(rows[w.id]?.overtime) || 0,
        remarks: rows[w.id]?.remarks || "",
      }));
      return api("/api/attendance/bulk", {
        method: "POST",
        body: JSON.stringify({ date, entries }),
      });
    },
    onSuccess: () => {
      toast.success("Attendance saved.", {
        description: formatDate(date),
      });
      setDirty(false);
      qc.invalidateQueries({ queryKey: ["attendance", date] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["worker"] });
    },
    onError: () => toast.error("Failed to save attendance."),
  });

  const setRow = (id: string, patch: Partial<RowState>) => {
    setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
    setDirty(true);
  };

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, RowState> = {};
    const dayName = DAYS_OF_WEEK[new Date(date).getDay()];
    for (const w of workers) {
      const isOff = w.weeklyOff === dayName;
      next[w.id] = {
        ...(rows[w.id] || { status: "Present", overtime: "", remarks: "" }),
        status: isOff ? "Leave" : status,
      };
    }
    setRows(next);
    setDirty(true);
  };

  // Summary chips.
  const summary = useMemo(() => {
    const s = { Present: 0, "Half Day": 0, Absent: 0, Leave: 0 };
    for (const w of workers) {
      const st = rows[w.id]?.status;
      if (st) s[st]++;
    }
    return s;
  }, [rows, workers]);

  return (
    <div className="space-y-4">
      {/* Date + quick actions */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-sm font-medium">
              Attendance Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              max={toISODate(new Date())}
              onChange={(e) => setDate(e.target.value)}
              className="sm:w-48"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => markAll("Present")}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" />
              All Present
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAll("Absent")}>
              <XCircle className="mr-1 h-3.5 w-3.5 text-rose-500" />
              All Absent
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAll("Leave")}>
              <CalendarOff className="mr-1 h-3.5 w-3.5 text-sky-500" />
              All Leave
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ATTENDANCE_STATUSES.map((st) => {
          const s = STATUS_STYLES[st];
          return (
            <div
              key={st}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3",
                s.badge,
              )}
            >
              <span className="text-sm font-medium">{st}</span>
              <span className="text-xl font-bold tabular-nums">
                {summary[st]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Workers list */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No active workers found. Add workers first.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {workers.map((w) => {
            const r = rows[w.id];
            const dayName = DAYS_OF_WEEK[new Date(date).getDay()];
            const isOff = w.weeklyOff === dayName;
            const initials = w.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <Card key={w.id} className={cn(isOff && "opacity-75")}>
                <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {w.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {w.workerId} • {w.role || "Staff"}
                        {isOff && (
                          <Badge variant="outline" className="ml-1.5 text-[10px]">
                            Weekly Off
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={r?.status}
                      onValueChange={(v) =>
                        setRow(w.id, { status: v as AttendanceStatus })
                      }
                    >
                      <SelectTrigger className="h-9 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {r?.status === "Present" && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="OT"
                          value={r?.overtime}
                          onChange={(e) =>
                            setRow(w.id, { overtime: e.target.value })
                          }
                          className="h-9 w-16"
                        />
                        <span className="text-xs text-muted-foreground">hrs</span>
                      </div>
                    )}

                    <Input
                      placeholder="Remarks"
                      value={r?.remarks}
                      onChange={(e) =>
                        setRow(w.id, { remarks: e.target.value })
                      }
                      className="h-9 w-32 sm:w-40"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sticky save bar */}
      {workers.length > 0 && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {dirty ? (
              <span className="font-medium text-amber-600">
                Unsaved changes
              </span>
            ) : (
              "All changes saved"
            )}
          </p>
          <Button
            onClick={() => bulkMut.mutate()}
            disabled={bulkMut.isPending || !dirty}
          >
            {bulkMut.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Save Attendance
          </Button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Attendance History ------------------------- */
function AttendanceHistory() {
  const today = toISODate(new Date());
  const weekAgo = toISODate(
    new Date(Date.now() - 7 * 86400000),
  );
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["attendance-history", startDate, endDate],
    queryFn: () =>
      api<{ items: (Attendance & { worker?: Worker })[] }>(
        `/api/attendance?startDate=${startDate}&endDate=${endDate}`,
      ),
  });

  const filtered = useMemo(() => {
    if (!data?.items) return [];
    if (!search.trim()) return data.items;
    const q = search.toLowerCase();
    return data.items.filter(
      (a) =>
        a.worker?.name?.toLowerCase().includes(q) ||
        a.worker?.workerId?.toLowerCase().includes(q) ||
        a.worker?.phone?.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">From</Label>
            <Input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">To</Label>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Search</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Worker name / ID / phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No attendance records in this range.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="custom-scrollbar max-h-[60vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Worker</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">OT</th>
                    <th className="px-4 py-3 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const st = STATUS_STYLES[a.status];
                    return (
                      <tr
                        key={a.id}
                        className="border-t hover:bg-muted/40"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                          {formatDate(a.date)}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-foreground">
                            {a.worker?.name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {a.worker?.workerId} • {a.worker?.role}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge className={st.badge}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {a.overtimeHours > 0 ? `${a.overtimeHours}h` : "—"}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-2.5 text-muted-foreground">
                          {a.remarks || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
