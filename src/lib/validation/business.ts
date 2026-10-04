import { z } from "zod";
import { email, phone, postcode, req, url } from "./common";
import { isValidKvk, isValidVatNumber, normalizeKvk, normalizeVatNumber, normalizePhone, normalizePostcode } from "../kvk";
import { campaignSchema } from "./campaign";

export const serviceAreaSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("radius"), city: req(80), km: z.coerce.number().int().min(1).max(250) }),
  z.object({
    type: z.literal("postcodes"),
    prefixes: z
      .string()
      .transform((s) => s.split(/[,\s]+/).map((p) => p.trim()).filter(Boolean))
      .refine((arr) => arr.length > 0 && arr.every((p) => /^\d{2,4}$/.test(p)), "postcode"),
  }),
]);

export const companySchema = z.object({
  name: req(120),
  kvk: z.string().trim().min(1, "required").refine(isValidKvk, "kvk").transform(normalizeKvk),
  vatNumber: z.string().trim().min(1, "required").refine(isValidVatNumber, "vat").transform(normalizeVatNumber),
  street: req(120),
  houseNumber: req(12),
  postcode: postcode.transform(normalizePostcode),
  city: req(80),
  contactName: req(120),
  phone: phone.transform(normalizePhone),
  email,
  website: url,
  description: z.string().trim().min(20, "tooShort").max(1000, "tooLong"),
});

export const businessSignupSchema = z.object({
  company: companySchema,
  categoryId: z.string().min(1, "required"),
  serviceArea: serviceAreaSchema,
  campaign: campaignSchema,
  terms: z.literal(true, { errorMap: () => ({ message: "terms" }) }),
});

export type BusinessSignupInput = z.input<typeof businessSignupSchema>;
