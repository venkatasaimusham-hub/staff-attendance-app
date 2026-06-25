// Workers API — list (with search, filter, pagination) & create.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateWorkerId } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const status = searchParams.get("status") || ""; // Active | Inactive
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.max(
    1,
    Math.min(200, parseInt(searchParams.get("pageSize") || "10", 10)),
  );

  const where: Record<string, unknown> = {};
  if (status === "Active" || status === "Inactive") {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { workerId: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [total, workers] = await Promise.all([
    db.worker.count({ where }),
    db.worker.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    items: workers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      address,
      role,
      joiningDate,
      dailyWage,
      weeklyOff,
      status,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and mobile number are required." },
        { status: 400 },
      );
    }

    const workerId = await generateWorkerId();
    const worker = await db.worker.create({
      data: {
        workerId,
        name: String(name).trim(),
        phone: String(phone).trim(),
        address: String(address || "").trim(),
        role: String(role || "").trim(),
        joiningDate: String(joiningDate || new Date().toISOString().slice(0, 10)),
        dailyWage: Number(dailyWage) || 0,
        weeklyOff: String(weeklyOff || "Sunday"),
        status: status === "Inactive" ? "Inactive" : "Active",
      },
    });
    return NextResponse.json(worker, { status: 201 });
  } catch (err) {
    console.error("[workers/POST]", err);
    return NextResponse.json(
      { error: "Failed to create worker." },
      { status: 500 },
    );
  }
}
