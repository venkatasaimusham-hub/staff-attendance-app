// Bulk attendance API — mark attendance for all (or selected) workers
// for a given date in a single request.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUSES, AttendanceStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, entries } = body as {
      date: string;
      entries: {
        workerId: string;
        status: AttendanceStatus;
        overtimeHours?: number;
        remarks?: string;
      }[];
    };

    if (!date || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: "date and entries[] are required." },
        { status: 400 },
      );
    }

    // Validate statuses first.
    for (const e of entries) {
      if (!ATTENDANCE_STATUSES.includes(e.status)) {
        return NextResponse.json(
          { error: `Invalid status: ${e.status}` },
          { status: 400 },
        );
      }
    }

    const results = await db.$transaction(
      entries.map((e) =>
        db.attendance.upsert({
          where: { workerId_date: { workerId: e.workerId, date } },
          update: {
            status: e.status,
            overtimeHours: Number(e.overtimeHours) || 0,
            remarks: String(e.remarks || ""),
          },
          create: {
            workerId: e.workerId,
            date,
            status: e.status,
            overtimeHours: Number(e.overtimeHours) || 0,
            remarks: String(e.remarks || ""),
          },
        }),
      ),
    );

    return NextResponse.json({ saved: results.length, items: results });
  } catch (err) {
    console.error("[attendance/bulk/POST]", err);
    return NextResponse.json(
      { error: "Failed to save bulk attendance." },
      { status: 500 },
    );
  }
}
