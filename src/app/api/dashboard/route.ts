// Dashboard API — aggregate stats for the dashboard screen.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { toISODate, getWeekStart, getWeekEnd } from "@/lib/date-utils";
import { calculateWeeklySalary } from "@/lib/salary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const today = searchParams.get("date") || toISODate(new Date());

  const totalWorkers = await db.worker.count();
  const activeWorkers = await db.worker.count({ where: { status: "Active" } });

  // Today's attendance breakdown.
  const todayAttendance = await db.attendance.findMany({
    where: { date: today },
  });
  const presentToday = todayAttendance.filter(
    (a) => a.status === "Present" || a.status === "Half Day",
  ).length;
  const absentToday = todayAttendance.filter(
    (a) => a.status === "Absent",
  ).length;
  const onLeaveToday = todayAttendance.filter(
    (a) => a.status === "Leave",
  ).length;
  const notMarked = Math.max(0, activeWorkers - todayAttendance.length);

  // Attendance percentage = marked-present / active workers.
  const attendancePercentage =
    activeWorkers > 0
      ? Math.round((presentToday / activeWorkers) * 100)
      : 0;

  // Weekly salary expense (current week).
  const settings = await getSettings();
  const ws = getWeekStart(new Date(today));
  const we = getWeekEnd(new Date(today));
  const weekStart = toISODate(ws);
  const weekEnd = toISODate(we);

  const weekAttendance = await db.attendance.findMany({
    where: { date: { gte: weekStart, lte: weekEnd } },
  });
  const workers = await db.worker.findMany({
    where: { status: "Active" },
  });
  let totalWeeklySalary = 0;
  for (const w of workers) {
    const recs = weekAttendance.filter((a) => a.workerId === w.id);
    const s = calculateWeeklySalary(w, recs, settings);
    totalWeeklySalary += s.weeklySalary;
  }

  // 7-day attendance trend for the chart.
  const trend: { date: string; present: number; absent: number; leave: number; half: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = toISODate(d);
    const recs = await db.attendance.findMany({ where: { date: iso } });
    trend.push({
      date: iso,
      present: recs.filter((r) => r.status === "Present").length,
      absent: recs.filter((r) => r.status === "Absent").length,
      leave: recs.filter((r) => r.status === "Leave").length,
      half: recs.filter((r) => r.status === "Half Day").length,
    });
  }

  // Recent activities (latest attendance + worker creations).
  const [recentAttendance, recentWorkers] = await Promise.all([
    db.attendance.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { worker: true },
    }),
    db.worker.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const recentActivities = [
    ...recentAttendance.map((a) => ({
      type: "attendance" as const,
      id: a.id,
      workerName: a.worker?.name || "Unknown",
      status: a.status,
      date: a.date,
      createdAt: a.createdAt,
    })),
    ...recentWorkers.map((w) => ({
      type: "worker" as const,
      id: w.id,
      workerName: w.name,
      status: w.status,
      date: w.joiningDate,
      createdAt: w.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return NextResponse.json({
    today,
    totalWorkers,
    activeWorkers,
    inactiveWorkers: totalWorkers - activeWorkers,
    presentToday,
    absentToday,
    onLeaveToday,
    notMarked,
    attendancePercentage,
    totalWeeklySalary,
    weekStart,
    weekEnd,
    trend,
    recentActivities,
  });
}
