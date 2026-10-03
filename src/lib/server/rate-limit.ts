import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "../env";

type Window = `${number} ${"s" | "m" | "h"}`;

const memory = new Map<string, { count: number; resetAt: number }>();

function windowMs(window: Window): number {
  const [n, unit] = window.split(" ") as [string, "s" | "m" | "h"];
  return Number(n) * { s: 1_000, m: 60_000, h: 3_600_000 }[unit];
}

const upstash = new Map<string, Ratelimit>();

/**
 * Sliding-window rate limit. Uses Upstash Redis when configured (required for multi-instance
 * deployments); otherwise an in-memory fixed window, which is fine for one dev server.
 */
export async function rateLimit(bucket: string, key: string, limit: number, window: Window) {
  if (process.env.E2E === "1") return { ok: true, remaining: limit };
  const e = env();
  if (e.UPSTASH_REDIS_REST_URL && e.UPSTASH_REDIS_REST_TOKEN) {
    const id = `${bucket}:${limit}:${window}`;
    let rl = upstash.get(id);
    if (!rl) {
      rl = new Ratelimit({
        redis: new Redis({ url: e.UPSTASH_REDIS_REST_URL, token: e.UPSTASH_REDIS_REST_TOKEN }),
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix: `fa:${bucket}`,
      });
      upstash.set(id, rl);
    }
    const res = await rl.limit(key);
    return { ok: res.success, remaining: res.remaining };
  }
  const now = Date.now();
  const k = `${bucket}:${key}`;
  const entry = memory.get(k);
  if (!entry || entry.resetAt < now) {
    memory.set(k, { count: 1, resetAt: now + windowMs(window) });
    return { ok: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}
