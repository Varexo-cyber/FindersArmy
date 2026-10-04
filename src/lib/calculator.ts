import { CATEGORIES } from "@/content/categories";
import type { FeeRule } from "./fees";

/** Serialised fee rules for the client-side calculator (public/fx.js mirrors src/lib/fees.ts). */
export interface CalcRule {
  name: string;
  type: FeeRule["feeType"];
  pct: number;
  fixed: number;
  tiers: [number, number][];
  minJob: number;
  minFee: number;
  job: number;
  min: number;
  max: number;
  step: number;
}

const FEATURED = ["schilders", "keukens", "aannemers", "zonnepanelen", "autodealers", "installateurs", "badkamers", "trouwlocaties", "rijscholen", "hoveniers", "webdesign-marketing", "dakkapellen", "personal-trainers", "verhuizers"];

function roundStep(n: number) {
  return n >= 20_000 ? 1_000 : n >= 5_000 ? 250 : n >= 1_000 ? 50 : 10;
}

export function calculatorRules(locale: string): CalcRule[] {
  return FEATURED.map((slug) => CATEGORIES.find((c) => c.slug === slug)!).map((c) => {
    const job = c.exampleJobCents / 100;
    const step = roundStep(job);
    const r = c.example;
    return {
      name: locale === "en" ? c.nameEn : c.nameNl,
      type: r.feeType,
      pct: r.feePercentBps ?? 0,
      fixed: r.feeFixedCents ?? 0,
      tiers: (r.tiers ?? []).map((t) => [t.fromCents, t.feeCents] as [number, number]),
      minJob: r.minJobAmountCents,
      minFee: r.minFeeCents,
      job,
      min: Math.max(step, Math.round(job / 5 / step) * step),
      max: Math.round((job * 3) / step) * step,
      step,
    };
  });
}
