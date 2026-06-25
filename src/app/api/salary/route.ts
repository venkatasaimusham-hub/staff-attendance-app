// Salary list API — fetch previously computed weekly salary records.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workerId = searchParams.get("workerId");
  const weekStart = searchParams.get("weekStart");
  const weekEnd = searchParams.get("weekEnd");

  const where: Record<string, unknown> = {};
  if (workerId) where.workerId = workerId;
  if (weekStart) where.weekStart = { gte: weekStart };
  if (weekEnd) where.weekEnd = { lte: weekEnd };

  const items = await db.salary.findMany({
    where,
    include: { worker: true },
    orderBy: { weekStart: "desc" },
  });
  return NextResponse.json({ items });
}
