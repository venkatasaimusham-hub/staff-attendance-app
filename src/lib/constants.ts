// Shared constants for the attendance & wages manager.

export const ATTENDANCE_STATUSES = [
  "Present",
  "Half Day",
  "Absent",
  "Leave",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const WORKER_STATUSES = ["Active", "Inactive"] as const;
export type WorkerStatus = (typeof WORKER_STATUSES)[number];

// Salary multiplier per attendance status.
export const STATUS_WAGE_MULTIPLIER: Record<AttendanceStatus, number> = {
  Present: 1,
  "Half Day": 0.5,
  Absent: 0,
  Leave: 0, // overridden by settings.leavePaid
};

// UI color tokens per attendance status (Tailwind classes).
export const STATUS_STYLES: Record<
  AttendanceStatus,
  { badge: string; dot: string; label: string }
> = {
  Present: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
    label: "Present",
  },
  "Half Day": {
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
    label: "Half Day",
  },
  Absent: {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    dot: "bg-rose-500",
    label: "Absent",
  },
  Leave: {
    badge:
      "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    dot: "bg-sky-500",
    label: "Leave",
  },
};
