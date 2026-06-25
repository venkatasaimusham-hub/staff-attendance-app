"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Users as UsersIcon,
  Phone,
  MapPin,
  Briefcase,
  CalendarDays,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { Worker, Paginated, Attendance, Salary } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  formatDate,
  formatCurrency,
  getWeekStart,
  getWeekEnd,
  toISODate,
} from "@/lib/date-utils";
import { DAYS_OF_WEEK, WORKER_STATUSES, STATUS_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { WorkerFormDialog } from "@/components/worker-form-dialog";

const PAGE_SIZE = 9;

export function WorkersView() {
  const qc = useQueryClient();
  const settings = useAppStore((s) => s.settings);
  const sym = settings?.currency || "₹";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debounce search.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["workers", debouncedSearch, statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      return api<Paginated<Worker>>(`/api/workers?${params.toString()}`);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/workers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Worker deleted.");
      qc.invalidateQueries({ queryKey: ["workers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete worker."),
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, worker ID or mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Workers</SelectItem>
            {WORKER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Worker
        </Button>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {data ? (
            <>
              Showing{" "}
              <span className="font-medium text-foreground">
                {data.items.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{data.total}</span>{" "}
              workers
            </>
          ) : (
            "Loading…"
          )}
        </p>
        {(search || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((w) => (
            <WorkerCard
              key={w.id}
              worker={w}
              sym={sym}
              onView={() => setDetailsId(w.id)}
              onEdit={() => {
                setEditing(w);
                setShowForm(true);
              }}
              onDelete={() => setDeleteId(w.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <UsersIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">No workers found</p>
              <p className="text-sm text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters."
                  : "Add your first worker to get started."}
              </p>
            </div>
            {!search && statusFilter === "all" && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Worker
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{data.totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add/Edit dialog */}
      <WorkerFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        worker={editing}
      />

      {/* Details dialog */}
      <WorkerDetailsDialog
        id={detailsId}
        onOpenChange={(o) => !o && setDetailsId(null)}
        sym={sym}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this worker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the worker along with all their
              attendance and salary records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WorkerCard({
  worker,
  sym,
  onView,
  onEdit,
  onDelete,
}: {
  worker: Worker;
  sym: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = worker.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const active = worker.status === "Active";

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {worker.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {worker.workerId} • {worker.role || "—"}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "shrink-0",
                  active
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {worker.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{worker.phone}</span>
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatCurrency(worker.dailyWage, sym)} / day
            </span>
            <span className="text-muted-foreground/60">•</span>
            <span>Off: {worker.weeklyOff}</span>
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 border-t pt-3">
          <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            View
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
            onClick={onDelete}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkerDetailsDialog({
  id,
  onOpenChange,
  sym,
}: {
  id: string | null;
  onOpenChange: (o: boolean) => void;
  sym: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["worker", id],
    queryFn: () =>
      id
        ? api<Worker & { attendance: Attendance[]; salaries: Salary[] }>(
            `/api/workers/${id}`,
          )
        : Promise.reject(),
    enabled: !!id,
  });

  return (
    <Dialog open={!!id} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Worker Details</DialogTitle>
          <DialogDescription>
            Profile, recent attendance & salary history.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-40 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Profile */}
            <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
              <Avatar className="h-16 w-16 border">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {data.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-lg font-semibold">{data.name}</h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      data.status === "Active"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "",
                    )}
                  >
                    {data.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {data.workerId} • {data.role || "No role"}
                </p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow icon={Phone} label="Mobile" value={data.phone} />
              <InfoRow
                icon={Wallet}
                label="Daily Wage"
                value={formatCurrency(data.dailyWage, sym)}
              />
              <InfoRow
                icon={CalendarDays}
                label="Joining Date"
                value={formatDate(data.joiningDate)}
              />
              <InfoRow
                icon={Briefcase}
                label="Weekly Off"
                value={data.weeklyOff}
              />
              <div className="sm:col-span-2">
                <InfoRow icon={MapPin} label="Address" value={data.address || "—"} />
              </div>
            </div>

            {/* Recent attendance */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Recent Attendance
              </h4>
              {data.attendance.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No attendance records yet.
                </p>
              ) : (
                <div className="custom-scrollbar max-h-44 space-y-1 overflow-y-auto">
                  {data.attendance.slice(0, 10).map((a) => {
                    const st = STATUS_STYLES[a.status as keyof typeof STATUS_STYLES];
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                      >
                        <span className="text-sm text-foreground">
                          {formatDate(a.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          {a.overtimeHours > 0 && (
                            <span className="text-xs text-muted-foreground">
                              +{a.overtimeHours}h OT
                            </span>
                          )}
                          <Badge className={st.badge}>{st.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Salary history */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Salary History
              </h4>
              {data.salaries.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No salary records yet. Use the Salary Calculator.
                </p>
              ) : (
                <div className="custom-scrollbar max-h-44 space-y-1 overflow-y-auto">
                  {data.salaries.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                    >
                      <div className="text-sm">
                        <p className="font-medium text-foreground">
                          {formatDate(s.weekStart)} – {formatDate(s.weekEnd)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          P:{s.presentDays} H:{s.halfDays} A:{s.absentDays} L:
                          {s.leaveDays} • OT {s.overtimeHours}h
                        </p>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatCurrency(s.weeklySalary, sym)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border bg-card p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
