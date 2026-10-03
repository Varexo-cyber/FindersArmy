/**
 * The single source of "now". Tests and e2e can shift time with the TIME_OFFSET_MS env var
 * (never honoured in production) to exercise reminders and confirmation delays.
 */
export function now(): Date {
  const offset = process.env.NODE_ENV !== "production" ? Number(process.env.TIME_OFFSET_MS ?? 0) : 0;
  return new Date(Date.now() + (Number.isFinite(offset) ? offset : 0));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
