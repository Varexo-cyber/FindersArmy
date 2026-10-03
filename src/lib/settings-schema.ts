import { z } from "zod";
import { DEFAULT_RANKS } from "./ranks";
import { DEFAULT_COUNTRIES } from "./vat";

/**
 * Every number the platform acts on is a setting with a typed default, editable by admins.
 * Defaults live here so a fresh database behaves sensibly without seeding.
 */
export const settingsSchema = z.object({
  ranks: z
    .array(
      z.object({
        key: z.enum(["RECRUIT", "SOLDIER", "SERGEANT", "LIEUTENANT", "COMMANDER"]),
        minPaidDeals: z.number().int().min(0),
        shareBps: z.number().int().min(0).max(10_000),
      }),
    )
    .default(DEFAULT_RANKS),
  customerBonusCents: z.number().int().min(0).default(2_500),
  confirmationDelayDays: z.number().int().min(1).max(120).default(14),
  firstDealBonusCents: z.number().int().min(0).default(1_000),
  inviteBonusCents: z.number().int().min(0).default(2_500),
  payoutMinimumCents: z.number().int().min(100).default(2_500),
  invoiceDueDays: z.number().int().min(1).default(14),
  invoiceReminderDays: z.array(z.number().int().min(1)).default([7, 14, 21]),
  suspendAfterDays: z.number().int().min(1).default(21),
  responseHours: z.number().int().min(1).default(48),
  attributionMonths: z.number().int().min(1).default(12),
  duplicateWindowDays: z.number().int().min(1).default(90),
  attributionCookieDays: z.number().int().min(1).default(90),
  anonymizeAfterMonths: z.number().int().min(1).default(12),
  businessReviewScore: z.number().int().min(0).max(100).default(40),
  finderWarnScore: z.number().int().min(0).max(100).default(60),
  finderSuspendScore: z.number().int().min(0).max(100).default(35),
  countries: z
    .array(
      z.object({
        code: z.string().length(2),
        vatRateBps: z.number().int().min(0).max(10_000),
        currency: z.string().length(3),
        locale: z.string(),
      }),
    )
    .default(DEFAULT_COUNTRIES),
  company: z
    .object({
      name: z.string(),
      street: z.string(),
      postcodeCity: z.string(),
      kvk: z.string(),
      vatNumber: z.string(),
      iban: z.string(),
      bic: z.string(),
      email: z.string(),
    })
    .default({
      name: "FindersArmy B.V. (in oprichting)",
      street: "Adres nog in te vullen",
      postcodeCity: "",
      kvk: "nog in te vullen",
      vatNumber: "nog in te vullen",
      iban: "NL00XXXX0000000000",
      bic: "XXXXNL2A",
      email: "facturen@findersarmy.com",
    }),
  ownerChecklist: z
    .array(z.object({ id: z.string(), done: z.boolean() }))
    .default([]),
});

export type Settings = z.infer<typeof settingsSchema>;
export type SettingKey = keyof Settings;

export const OWNER_CHECKLIST = [
  { id: "tax-payouts", nl: "Met een boekhouder afstemmen hoe uitbetalingen aan particulieren fiscaal worden gemeld (IB47 / renseignering).", en: "Agree with an accountant how payments to private individuals are reported for tax (IB47)." },
  { id: "legal-review", nl: "Voorwaarden, privacyverklaring en cookieverklaring laten controleren door een jurist.", en: "Have terms, privacy and cookie statements reviewed by a lawyer." },
  { id: "company-details", nl: "Bedrijfsgegevens (KvK, BTW, IBAN, BIC) invullen bij Instellingen › Bedrijf.", en: "Enter company details (KvK, VAT, IBAN, BIC) under Settings › Company." },
  { id: "mollie-live", nl: "Mollie-account verifiëren en live API-sleutel instellen.", en: "Verify the Mollie account and set the live API key." },
  { id: "dpa", nl: "Verwerkersovereenkomsten afsluiten met Vercel, Resend, Mollie, Cloudflare en de databasehost.", en: "Sign data processing agreements with Vercel, Resend, Mollie, Cloudflare and the database host." },
  { id: "gift-cards", nl: "Leverancier kiezen voor de klant-cadeaubonnen en het verzendproces vastleggen.", en: "Choose a gift card supplier for customer bonuses and define the fulfilment process." },
] as const;
