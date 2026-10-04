import { z } from "zod";
import { email, phone, postcode, req } from "./common";

export const TIMEFRAMES = ["ASAP", "1_MONTH", "3_MONTHS", "LATER", "ORIENTING"] as const;

export const leadSchema = z.object({
  firstName: req(60),
  lastName: req(80),
  phone,
  email,
  postcode,
  houseNumber: req(12),
  city: z.string().trim().max(80).optional(),
  description: z.string().trim().min(10, "tooShort").max(2000, "tooLong"),
  timeframe: z.enum(TIMEFRAMES),
  consent: z.literal(true, { errorMap: () => ({ message: "consent" }) }),
  // Honeypot: real people never fill this hidden field.
  website: z.string().max(0).optional(),
});

export type LeadInput = z.input<typeof leadSchema>;
