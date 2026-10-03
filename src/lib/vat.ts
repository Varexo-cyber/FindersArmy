import { applyBps, type Cents } from "./money";

export interface CountryConfig {
  code: string;
  vatRateBps: number;
  currency: string;
  locale: string;
}

export const DEFAULT_COUNTRIES: CountryConfig[] = [
  { code: "NL", vatRateBps: 2100, currency: "EUR", locale: "nl" },
  { code: "BE", vatRateBps: 2100, currency: "EUR", locale: "nl" },
];

export function vatRateFor(country: string, countries: CountryConfig[] = DEFAULT_COUNTRIES): number {
  const match = countries.find((c) => c.code === country.toUpperCase());
  if (!match) throw new Error(`No VAT configuration for country ${country}`);
  return match.vatRateBps;
}

export function calculateVat(subtotalCents: Cents, vatRateBps: number) {
  const vatCents = applyBps(subtotalCents, vatRateBps);
  return { subtotalCents, vatRateBps, vatCents, totalCents: subtotalCents + vatCents };
}
