// Backup & Restore API.
// GET  -> downloads a full JSON snapshot of the database.
// POST -> restores from an uploaded JSON snapshot (replaces existing data).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [workers, attendance, salaries, settings] = await Promise.all([
    db.worker.findMany(),
    db.attendance.findMany(),
    db.salary.findMany(),
    db.setting.findMany(),
  ]);

  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workers,
    attendance,
    salaries,
    settings,
  };

  return NextResponse.json(snapshot, {
    headers: {
      "Content-Disposition": `attachment; filename="backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || !body.version) {
      return NextResponse.json(
        { error: "Invalid backup file format." },
        { status: 400 },
      );
    }

    await db.$transaction(async (tx) => {
      // Wipe existing data (order matters for foreign keys).
      await tx.attendance.deleteMany();
      await tx.salary.deleteMany();
      await tx.worker.deleteMany();
      await tx.setting.deleteMany();

      // Restore workers.
      if (Array.isArray(body.workers)) {
        for (const w of body.workers) {
          await tx.worker.create({ data: { ...w } });
        }
      }
      // Restore attendance.
      if (Array.isArray(body.attendance)) {
        for (const a of body.attendance) {
          await tx.attendance.create({ data: { ...a } });
        }
      }
      // Restore salaries.
      if (Array.isArray(body.salaries)) {
        for (const s of body.salaries) {
          await tx.salary.create({ data: { ...s } });
        }
      }
      // Restore settings.
      if (Array.isArray(body.settings)) {
        for (const s of body.settings) {
          await tx.setting.create({ data: { ...s } });
        }
      }
    });

    return NextResponse.json({
      success: true,
      restored: {
        workers: body.workers?.length || 0,
        attendance: body.attendance?.length || 0,
        salaries: body.salaries?.length || 0,
        settings: body.settings?.length || 0,
      },
    });
  } catch (err) {
    console.error("[backup/POST]", err);
    return NextResponse.json(
      { error: "Failed to restore backup." },
      { status: 500 },
    );
  }
}
