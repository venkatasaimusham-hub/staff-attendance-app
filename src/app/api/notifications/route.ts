// Notifications API — returns reminder items for the admin.
// Reminders:
//  1. Daily attendance reminder — if today's attendance isn't fully marked.
//  2. Weekly salary reminder — if the current week's salary hasn't been saved.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toISODate, getWeekStart, getWeekEnd } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const today = searchParams.get("date") || toISODate(new Date());

  const [activeWorkers, todayAttendance, weekSalary] = await Promise.all([
    db.worker.count({ where: { status: "Active" } }),
    db.attendance.findMany({ where: { date: today } }),
    db.salary.findFirst({
      where: {
        weekStart: toISODate(getWeekStart(new Date(today))),
        weekEnd: toISODate(getWeekEnd(new Date(today))),
      },
    }),
  ]);

  const notifications: {
    id: string;
    type: "attendance" | "salary";
    severity: "info" | "warning";
    title: string;
    message: string;
    action?: string;
  }[] = [];

  // Daily attendance reminder.
  const marked = todayAttendance.length;
  if (activeWorkers > 0) {
    if (marked === 0) {
      notifications.push({
        id: "att-none",
        type: "attendance",
        severity: "warning",
        title: "Mark today's attendance",
        message: `No attendance marked for ${new Date(today).toLocaleDateString(
          "en-IN",
          { day: "2-digit", month: "short" },
        )}. ${activeWorkers} workers pending.`,
        action: "attendance",
      });
    } else if (marked < activeWorkers) {
      notifications.push({
        id: "att-partial",
        type: "attendance",
        severity: "info",
        title: "Attendance partially marked",
        message: `${marked}/${activeWorkers} workers marked today. ${
          activeWorkers - marked
        } remaining.`,
        action: "attendance",
      });
    }
  }

  // Weekly salary reminder.
  if (activeWorkers > 0 && !weekSalary) {
    const ws = getWeekStart(new Date(today));
    const we = getWeekEnd(new Date(today));
    notifications.push({
      id: "salary-week",
      type: "salary",
      severity: "info",
      title: "Weekly salary not calculated",
      message: `Calculate & save salary for the week ${toISODate(
        ws,
      )} – ${toISODate(we)}.`,
      action: "salary",
    });
  }

  return NextResponse.json({
    items: notifications,
    count: notifications.length,
    today,
  });
}
