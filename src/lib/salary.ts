// Weekly salary calculation logic.
//
// Formula:
//   Weekly Salary =
//     (Present Days × Daily Wage)
//   + (Half Days × Daily Wage × 0.5)
//   + (Leave Days × Daily Wage × leavePayMultiplier)  // 0 unless settings.leavePaid
//   + (Overtime Hours × Overtime Rate)
//   - (Absent contributes 0)

import { Attendance, Worker } from "@prisma/client";
import { STATUS_WAGE_MULTIPLIER } from "./constants";

export interface SalarySettings {
  overtimeRate: number;
  leavePaid: boolean;
}

export interface WeekAttendanceSummary {
  workerId: string;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
  weeklySalary: number;
}

/**
 * Summarises a worker's attendance for a set of dates and computes
 * the weekly salary according to the configured rules.
 */
export function calculateWeeklySalary(
  worker: Pick<Worker, "id" | "dailyWage">,
  attendanceRecords: Attendance[],
  settings: SalarySettings,
): WeekAttendanceSummary {
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let overtimeHours = 0;

  for (const rec of attendanceRecords) {
    switch (rec.status) {
      case "Present":
        presentDays++;
        break;
      case "Half Day":
        halfDays++;
        break;
      case "Absent":
        absentDays++;
        break;
      case "Leave":
        leaveDays++;
        break;
    }
    overtimeHours += rec.overtimeHours || 0;
  }

  const dailyWage = worker.dailyWage || 0;
  const leaveMultiplier = settings.leavePaid
    ? STATUS_WAGE_MULTIPLIER.Leave
    : 0;
  // When leavePaid is true, leave counts as a full paid day (multiplier 1).
  const leavePayMultiplier = settings.leavePaid ? 1 : 0;

  const weeklySalary =
    presentDays * dailyWage +
    halfDays * dailyWage * STATUS_WAGE_MULTIPLIER["Half Day"] +
    leaveDays * dailyWage * leavePayMultiplier +
    overtimeHours * (settings.overtimeRate || 0);

  void leaveMultiplier; // kept for clarity / future config granularity

  return {
    workerId: worker.id,
    presentDays,
    halfDays,
    absentDays,
    leaveDays,
    overtimeHours,
    weeklySalary,
  };
}
