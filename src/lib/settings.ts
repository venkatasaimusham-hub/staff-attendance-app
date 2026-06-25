// Helper to fetch app settings, creating the singleton row with defaults
// if it does not yet exist.
import { db } from "./db";

export const DEFAULT_SETTINGS = {
  overtimeRate: 50,
  leavePaid: false,
  businessName: "My Business",
  currency: "₹",
  theme: "light",
};

export async function getSettings() {
  const row = await db.setting.findUnique({ where: { id: "default" } });
  if (!row) {
    return await db.setting.create({
      data: { id: "default", ...DEFAULT_SETTINGS },
    });
  }
  return row;
}

/**
 * Generates the next sequential worker business id, e.g. W001, W002.
 */
export async function generateWorkerId(): Promise<string> {
  const count = await db.worker.count();
  const next = count + 1;
  return `W${String(next).padStart(3, "0")}`;
}
