// Seed API — populates the database with demo workers, attendance and
// settings so the app is explorable immediately. Safe to call repeatedly;
// it only seeds when the database is empty.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS, generateWorkerId } from "@/lib/settings";
import { toISODate, getWeekStart } from "@/lib/date-utils";
import { DAYS_OF_WEEK } from "@/lib/constants";

export const dynamic = "force-dynamic";

const SAMPLE_WORKERS = [
  {
    name: "Ramesh Kumar",
    phone: "9876543210",
    address: "12 Gandhi Nagar, Delhi",
    role: "Mason",
    dailyWage: 600,
    weeklyOff: "Sunday",
  },
  {
    name: "Sita Devi",
    phone: "9876501122",
    address: "45 MG Road, Pune",
    role: "Cleaner",
    dailyWage: 350,
    weeklyOff: "Sunday",
  },
  {
    name: "Arjun Singh",
    phone: "9988776655",
    address: "78 Station Road, Jaipur",
    role: "Carpenter",
    dailyWage: 700,
    weeklyOff: "Monday",
  },
  {
    name: "Lakshmi N",
    phone: "9001122334",
    address: "23 Brigade Road, Bengaluru",
    role: "Cook",
    dailyWage: 450,
    weeklyOff: "Wednesday",
  },
  {
    name: "Mohammed Irfan",
    phone: "9445566778",
    address: "9 Charminar Rd, Hyderabad",
    role: "Electrician",
    dailyWage: 800,
    weeklyOff: "Friday",
  },
  {
    name: "Priya Sharma",
    phone: "9123456780",
    address: "56 Civil Lines, Lucknow",
    role: "Painter",
    dailyWage: 500,
    weeklyOff: "Sunday",
  },
];

const STATUSES = ["Present", "Present", "Present", "Half Day", "Absent", "Leave"] as const;

export async function POST() {
  const existing = await db.worker.count();
  if (existing > 0) {
    return NextResponse.json({
      seeded: false,
      message: "Database already has workers. Skipping seed.",
    });
  }

  await db.setting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", ...DEFAULT_SETTINGS },
  });

  // Create sample workers.
  const workers = [];
  for (const w of SAMPLE_WORKERS) {
    const workerId = await generateWorkerId();
    const created = await db.worker.create({
      data: {
        ...w,
        workerId,
        joiningDate: toISODate(
          new Date(Date.now() - Math.random() * 90 * 86400000),
        ),
        status: "Active",
      },
    });
    workers.push(created);
  }

  // Generate attendance for the last 14 days.
  const today = new Date();
  const weekStart = getWeekStart(today);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = toISODate(d);
    for (const w of workers) {
      // Skip weekly off days.
      const dayName = DAYS_OF_WEEK[d.getDay()];
      if (w.weeklyOff === dayName) continue;

      // Deterministic-ish random status.
      const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
      const overtime = status === "Present" ? Math.floor(Math.random() * 3) : 0;
      await db.attendance.create({
        data: {
          workerId: w.id,
          date: iso,
          status,
          overtimeHours: overtime,
          remarks: "",
        },
      });
    }
  }

  return NextResponse.json({
    seeded: true,
    workersCreated: workers.length,
    weekStart: toISODate(weekStart),
  });
}
