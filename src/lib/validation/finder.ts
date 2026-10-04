import { z } from "zod";
import { email, phone, req } from "./common";
import { normalizePhone } from "../kvk";
import { isValidIban, normalizeIban } from "../iban";

export const finderSignupSchema = z.object({
  name: req(120),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date").refine((v) => !Number.isNaN(Date.parse(v)) && Date.parse(v) < Date.now(), "date"),
  phone: phone.transform(normalizePhone),
  city: req(80),
  nickname: z.string().trim().max(30, "tooLong").optional().transform((v) => v || undefined),
  leaderboardOptIn: z.boolean().default(false),
  inviteCode: z.string().trim().max(40).optional().transform((v) => v || undefined),
  parentEmail: email.optional().or(z.literal("").transform(() => undefined)),
  terms: z.literal(true, { errorMap: () => ({ message: "terms" }) }),
});

export const finderProfileSchema = z.object({
  name: req(120),
  phone: phone.transform(normalizePhone),
  city: req(80),
  nickname: z.string().trim().max(30, "tooLong").optional().transform((v) => v || undefined),
  leaderboardOptIn: z.boolean().default(false),
  iban: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normalizeIban(v) : undefined))
    .refine((v) => v === undefined || isValidIban(v), "iban"),
  ibanHolder: z.string().trim().max(70, "tooLong").optional().transform((v) => v || undefined),
  locale: z.enum(["nl", "en"]).optional(),
});

export type FinderSignupInput = z.input<typeof finderSignupSchema>;
export type FinderProfileInput = z.input<typeof finderProfileSchema>;
