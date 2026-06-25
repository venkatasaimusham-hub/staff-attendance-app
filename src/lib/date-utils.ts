// Date utilities for weekly grouping & formatting.

/** Returns ISO date string (yyyy-MM-dd) for a Date in local time. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses an ISO date string (yyyy-MM-dd) into a local Date. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Returns the Monday that starts the week containing the given date. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday ... 6 = Saturday
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

/** Returns the Sunday that ends the week containing the given date. */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

/** Returns an array of 7 ISO date strings for the week containing the date. */
export function getWeekDates(date: Date): string[] {
  const start = getWeekStart(date);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(toISODate(d));
  }
  return dates;
}

/** Formats an ISO date string into a human readable label. */
export function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = parseISODate(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formats an ISO date string into a short label. */
export function formatDateShort(iso: string): string {
  if (!iso) return "—";
  const d = parseISODate(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

/** Formats a number as currency using the provided symbol. */
export function formatCurrency(amount: number, symbol = "₹"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${symbol}${value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Returns all dates (ISO strings) in an inclusive range. */
export function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const s = parseISODate(start);
  const e = parseISODate(end);
  const cur = new Date(s);
  while (cur <= e) {
    dates.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Returns a relative time label for a Date. */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(toISODate(date));
}
