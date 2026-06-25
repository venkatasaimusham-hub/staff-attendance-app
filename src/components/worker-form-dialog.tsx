"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import type { Worker } from "@/lib/types";
import { DAYS_OF_WEEK, WORKER_STATUSES } from "@/lib/constants";
import { toISODate } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  worker: Worker | null;
}

interface FormState {
  name: string;
  phone: string;
  address: string;
  role: string;
  joiningDate: string;
  dailyWage: string;
  weeklyOff: string;
  status: string;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  address: "",
  role: "",
  joiningDate: toISODate(new Date()),
  dailyWage: "",
  weeklyOff: "Sunday",
  status: "Active",
};

export function WorkerFormDialog({ open, onOpenChange, worker }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (worker) {
      setForm({
        name: worker.name,
        phone: worker.phone,
        address: worker.address,
        role: worker.role,
        joiningDate: worker.joiningDate,
        dailyWage: String(worker.dailyWage),
        weeklyOff: worker.weeklyOff,
        status: worker.status,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [worker, open]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        dailyWage: Number(form.dailyWage) || 0,
      };
      if (worker) {
        return api<Worker>(`/api/workers/${worker.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      return api<Worker>("/api/workers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(worker ? "Worker updated." : "Worker added.");
      qc.invalidateQueries({ queryKey: ["workers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save worker."),
  });

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Mobile number is required";
    else if (!/^[0-9+\-\s]{7,15}$/.test(form.phone.trim()))
      e.phone = "Enter a valid mobile number";
    if (form.dailyWage && Number(form.dailyWage) < 0)
      e.dailyWage = "Wage cannot be negative";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    saveMut.mutate();
  };

  const set = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{worker ? "Edit Worker" : "Add New Worker"}</DialogTitle>
          <DialogDescription>
            {worker
              ? `Updating ${worker.name} (${worker.workerId})`
              : "Fill in the worker's details. Worker ID is auto-generated."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" error={errors.name} required>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Ramesh Kumar"
              />
            </Field>
            <Field label="Mobile Number" error={errors.phone} required>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="e.g. 9876543210"
                inputMode="tel"
              />
            </Field>
            <Field label="Job Role">
              <Input
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="e.g. Mason"
              />
            </Field>
            <Field label="Daily Wage" error={errors.dailyWage}>
              <Input
                value={form.dailyWage}
                onChange={(e) => set("dailyWage", e.target.value)}
                placeholder="e.g. 600"
                inputMode="decimal"
              />
            </Field>
            <Field label="Joining Date">
              <Input
                type="date"
                value={form.joiningDate}
                onChange={(e) => set("joiningDate", e.target.value)}
              />
            </Field>
            <Field label="Weekly Off Day">
              <Select value={form.weeklyOff} onValueChange={(v) => set("weeklyOff", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Address">
            <Textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Residential address"
              rows={2}
            />
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMut.isPending}>
              {saveMut.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              {worker ? "Save Changes" : "Add Worker"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
