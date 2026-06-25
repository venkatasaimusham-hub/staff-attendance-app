// Worker by-id API — fetch, update, delete.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const worker = await db.worker.findUnique({
    where: { id },
    include: {
      attendance: { orderBy: { date: "desc" }, take: 30 },
      salaries: { orderBy: { weekStart: "desc" }, take: 12 },
    },
  });
  if (!worker) {
    return NextResponse.json({ error: "Worker not found." }, { status: 404 });
  }
  return NextResponse.json(worker);
}

export async function PUT(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.phone !== undefined) data.phone = String(body.phone).trim();
    if (body.address !== undefined) data.address = String(body.address).trim();
    if (body.role !== undefined) data.role = String(body.role).trim();
    if (body.joiningDate !== undefined)
      data.joiningDate = String(body.joiningDate);
    if (body.dailyWage !== undefined)
      data.dailyWage = Number(body.dailyWage) || 0;
    if (body.weeklyOff !== undefined) data.weeklyOff = String(body.weeklyOff);
    if (body.status !== undefined)
      data.status = body.status === "Inactive" ? "Inactive" : "Active";

    const worker = await db.worker.update({ where: { id }, data });
    return NextResponse.json(worker);
  } catch (err) {
    console.error("[workers/PUT]", err);
    return NextResponse.json(
      { error: "Failed to update worker." },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  try {
    await db.worker.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[workers/DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete worker." },
      { status: 500 },
    );
  }
}
