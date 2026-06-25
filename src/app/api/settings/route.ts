// Settings API — get and update app configuration (singleton row).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.overtimeRate !== undefined)
      data.overtimeRate = Number(body.overtimeRate) || 0;
    if (body.leavePaid !== undefined) data.leavePaid = !!body.leavePaid;
    if (body.businessName !== undefined)
      data.businessName = String(body.businessName);
    if (body.currency !== undefined) data.currency = String(body.currency);
    if (body.theme !== undefined) data.theme = String(body.theme);

    const settings = await db.setting.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...DEFAULT_SETTINGS, ...data },
    });
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[settings/PUT]", err);
    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 },
    );
  }
}
