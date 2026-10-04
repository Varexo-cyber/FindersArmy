/**
 * The single source of "now". Tests and e2e can shift time with the TIME_OFFSET_MS env var
 * (never honoured in production) to exercise reminders and confirmation delays.
 */
export function now(): Date {
  const testing = process.env.NODE_ENV !== "production" || process.env.E2E === "1";
  const offset = testing ? Number(process.env.TIME_OFFSET_MS ?? 0) + timeTravelMs() : 0;
  return new Date(Date.now() + (Number.isFinite(offset) ? offset : 0));
}

const g = globalThis as unknown as { __faTimeTravelMs?: number };

function timeTravelMs(): number {
  return g.__faTimeTravelMs ?? 0;
}

/** E2E only: run `fn` as if `days` had passed. Never active in a real production deployment. */
export async function withTimeTravel<T>(days: number, fn: () => Promise<T>): Promise<T> {
  if (process.env.E2E !== "1" && process.env.NODE_ENV === "production") throw new Error("Time travel is test-only");
  const previous = g.__faTimeTravelMs;
  g.__faTimeTravelMs = days * 86_400_000;
  try {
    return await fn();
  } finally {
    g.__faTimeTravelMs = previous;
  }
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
