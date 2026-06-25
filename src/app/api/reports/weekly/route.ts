// Weekly salary report API — computes (and optionally returns saved) salary
// for all workers for a given week or custom date range.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { calculateWeeklySalary } from "@/lib/salary";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");

  if (!weekStart || !weekEnd) {
    return NextResponse.json(
      { error: "weekStart and weekEnd are required." },
      { status: 400 },
    );
  }

  const settings = await getSettings();
  const workers = await db.worker.findMany({
    where: { status: "Active" },
    orderBy: { name: "asc" },
  });
  const attendance = await db.attendance.findMany({
    where: { date: { gte: weekStart, lte: weekEnd } },
  });

  const rows = workers.map((w) => {
    const recs = attendance.filter((a) => a.workerId === w.id);
    const summary = calculateWeeklySalary(w, recs, settings);
    return {
      workerId: w.workerId,
      name: w.name,
      role: w.role,
      dailyWage: w.dailyWage,
      ...summary,
    };
  });

  return NextResponse.json({
    weekStart,
    weekEnd,
    businessName: settings.businessName,
    currency: settings.currency,
    overtimeRate: settings.overtimeRate,
    items: rows,
    totalSalary: rows.reduce((s, r) => s + r.weeklySalary, 0),
    totalOvertime: rows.reduce((s, r) => s + r.overtimeHours, 0),
  });
}
