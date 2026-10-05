import { z } from "zod";

/**
 * Environment, validated on first use (not at import) so `next build` works without secrets.
 * Optional integrations fall back to safe local implementations: no Resend key → dev mailbox,
 * no Mollie key → fake payment provider (refused in production), no R2 → database storage.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(16),
  HASH_SALT: z.string().min(8),
  CRON_SECRET: z.string().min(8).optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("FindersArmy <noreply@findersarmy.com>"),
  ADMIN_EMAIL: z.string().email().optional(),
  PAYMENT_PROVIDER: z.enum(["mollie", "fake"]).default("mollie"),
  MOLLIE_API_KEY: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ALLOW_16_PLUS: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  ENABLE_DEV_MAILBOX: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

export type Env = z.infer<typeof schema>;

/**
 * Test phase on a real host: no Mollie or Resend yet, so payments use the fake checkout, mail goes
 * to the in-site mailbox and the login page offers one-click demo accounts. Remove DEMO_MODE
 * (and set the real keys) before real users arrive.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true" || process.env.DEMO_MODE === "1";
}

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  if (parsed.data.NODE_ENV === "production" && parsed.data.PAYMENT_PROVIDER === "fake" && !process.env.E2E && !isDemoMode()) {
    throw new Error("PAYMENT_PROVIDER=fake is not allowed in production");
  }
  cached = parsed.data;
  return cached;
}

export function appUrl(path = ""): string {
  return new URL(path, env().APP_URL).toString();
}
