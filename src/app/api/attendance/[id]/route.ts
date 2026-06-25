// Attendance by-id API — update and delete a single record.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ATTENDANCE_STATUSES, AttendanceStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!ATTENDANCE_STATUSES.includes(body.status as AttendanceStatus)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.overtimeHours !== undefined)
      data.overtimeHours = Number(body.overtimeHours) || 0;
    if (body.remarks !== undefined) data.remarks = String(body.remarks);

    const record = await db.attendance.update({ where: { id }, data });
    return NextResponse.json(record);
  } catch (err) {
    console.error("[attendance/PUT]", err);
    return NextResponse.json(
      { error: "Failed to update attendance." },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  try {
    await db.attendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[attendance/DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete attendance." },
      { status: 500 },
    );
  }
}
