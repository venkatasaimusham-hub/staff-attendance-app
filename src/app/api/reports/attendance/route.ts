// Attendance report API — returns attendance matrix for a date range.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required." },
      { status: 400 },
    );
  }

  const settings = await getSettings();
  const workers = await db.worker.findMany({
    where: { status: "Active" },
    orderBy: { name: "asc" },
  });
  const attendance = await db.attendance.findMany({
    where: { date: { gte: startDate, lte: endDate } },
  });

  const rows = workers.map((w) => {
    const recs = attendance.filter((a) => a.workerId === w.id);
    return {
      workerId: w.workerId,
      name: w.name,
      role: w.role,
      present: recs.filter((r) => r.status === "Present").length,
      halfDay: recs.filter((r) => r.status === "Half Day").length,
      absent: recs.filter((r) => r.status === "Absent").length,
      leave: recs.filter((r) => r.status === "Leave").length,
      overtimeHours: recs.reduce((s, r) => s + (r.overtimeHours || 0), 0),
      totalMarked: recs.length,
    };
  });

  return NextResponse.json({
    startDate,
    endDate,
    businessName: settings.businessName,
    currency: settings.currency,
    items: rows,
    totalPresent: rows.reduce((s, r) => s + r.present, 0),
    totalHalfDay: rows.reduce((s, r) => s + r.halfDay, 0),
    totalAbsent: rows.reduce((s, r) => s + r.absent, 0),
    totalLeave: rows.reduce((s, r) => s + r.leave, 0),
  });
}
