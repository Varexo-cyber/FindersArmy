import { z } from "zod";
import { parseEuroToCents } from "../money";
import { isValidDutchPostcode, isValidPhone } from "../kvk";

/**
 * Shared Zod building blocks. Error messages are translation keys under `validation.*`,
 * so the same schema validates in the browser (React Hook Form) and on the server.
 */
export const req = (max = 200) => z.string().trim().min(1, "required").max(max, "tooLong");
export const optionalText = (max = 500) => z.string().trim().max(max, "tooLong").optional().transform((v) => (v ? v : undefined));
export const email = z.string().trim().toLowerCase().min(1, "required").email("email").max(254, "tooLong");
export const phone = z.string().trim().min(1, "required").refine(isValidPhone, "phone");
export const postcode = z.string().trim().min(1, "required").refine(isValidDutchPostcode, "postcode");
export const url = z
  .string()
  .trim()
  .max(500, "tooLong")
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || /^https?:\/\/[^\s]+\.[^\s]+$/.test(v), "url");

/** Euro amount typed by a human ("1.250,50") → integer cents. */
export const euros = (opts: { min?: number; optional?: boolean } = {}) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) {
        if (opts.optional) return undefined;
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "required" });
        return z.NEVER;
      }
      const cents = parseEuroToCents(v);
      if (cents === null || cents < (opts.min ?? 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "amount" });
        return z.NEVER;
      }
      return cents;
    });

/** Percentage typed as "8" or "7,5" → basis points. */
export const percentBps = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    const n = Number((v ?? "").replace(",", "."));
    if (!v || !Number.isFinite(n) || n < 0.1 || n > 50) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "percent" });
      return z.NEVER;
    }
    return Math.round(n * 100);
  });

export type FieldErrors = Record<string, string>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
