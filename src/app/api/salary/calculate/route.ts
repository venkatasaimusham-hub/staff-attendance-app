// Salary calculation API — computes weekly salary for every worker for the
// given week (or custom date range) and persists the result to the Salary
// table. Supports saving for a single worker or all workers.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { calculateWeeklySalary } from "@/lib/salary";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weekStart, weekEnd, workerId, save = true } = body as {
      weekStart: string;
      weekEnd: string;
      workerId?: string;
      save?: boolean;
    };

    if (!weekStart || !weekEnd) {
      return NextResponse.json(
        { error: "weekStart and weekEnd are required." },
        { status: 400 },
      );
    }

    const settings = await getSettings();

    const workers = await db.worker.findMany({
      where: workerId ? { id: workerId } : undefined,
      orderBy: { name: "asc" },
    });

    // Fetch attendance for the date range in one query.
    const allAttendance = await db.attendance.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
    });

    const rows = workers.map((w) => {
      const records = allAttendance.filter((a) => a.workerId === w.id);
      const summary = calculateWeeklySalary(w, records, settings);
      return { worker: w, ...summary, weekStart, weekEnd };
    });

    if (save) {
      await db.$transaction(
        rows.map((r) =>
          db.salary.upsert({
            where: {
              workerId_weekStart_weekEnd: {
                workerId: r.worker.id,
                weekStart: r.weekStart,
                weekEnd: r.weekEnd,
              },
            },
            update: {
              presentDays: r.presentDays,
              halfDays: r.halfDays,
              absentDays: r.absentDays,
              leaveDays: r.leaveDays,
              overtimeHours: r.overtimeHours,
              weeklySalary: r.weeklySalary,
            },
            create: {
              workerId: r.worker.id,
              weekStart: r.weekStart,
              weekEnd: r.weekEnd,
              presentDays: r.presentDays,
              halfDays: r.halfDays,
              absentDays: r.absentDays,
              leaveDays: r.leaveDays,
              overtimeHours: r.overtimeHours,
              weeklySalary: r.weeklySalary,
            },
          }),
        ),
      );
    }

    return NextResponse.json({
      weekStart,
      weekEnd,
      count: rows.length,
      totalSalary: rows.reduce((s, r) => s + r.weeklySalary, 0),
      items: rows,
    });
  } catch (err) {
    console.error("[salary/calculate/POST]", err);
    return NextResponse.json(
      { error: "Failed to calculate salary." },
      { status: 500 },
    );
  }
}
