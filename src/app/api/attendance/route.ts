// Attendance API — query and upsert a single record.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUSES, AttendanceStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // single day
  const workerId = searchParams.get("workerId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {};
  if (workerId) where.workerId = workerId;
  if (date) {
    where.date = date;
  } else if (startDate && endDate) {
    where.date = { gte: startDate, lte: endDate };
  } else if (startDate) {
    where.date = { gte: startDate };
  } else if (endDate) {
    where.date = { lte: endDate };
  }

  const records = await db.attendance.findMany({
    where,
    include: { worker: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ items: records });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workerId, date, status, overtimeHours, remarks } = body;
    if (!workerId || !date) {
      return NextResponse.json(
        { error: "workerId and date are required." },
        { status: 400 },
      );
    }
    if (!ATTENDANCE_STATUSES.includes(status as AttendanceStatus)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    // Upsert: one attendance record per worker per day.
    const record = await db.attendance.upsert({
      where: { workerId_date: { workerId, date } },
      update: {
        status,
        overtimeHours: Number(overtimeHours) || 0,
        remarks: String(remarks || ""),
      },
      create: {
        workerId,
        date,
        status,
        overtimeHours: Number(overtimeHours) || 0,
        remarks: String(remarks || ""),
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("[attendance/POST]", err);
    return NextResponse.json(
      { error: "Failed to save attendance." },
      { status: 500 },
    );
  }
}
