import { CATEGORIES, type CategoryDef } from "@/content/categories";
import { baseFee, calculateFee } from "./fees";
import { DEFAULT_RANKS } from "./ranks";

const RECRUIT_SHARE = DEFAULT_RANKS[0]!.shareBps;

/** Worked example for a category, computed with the real fee engine (no hand-typed numbers). */
export function categoryExample(cat: CategoryDef, shareBps = RECRUIT_SHARE) {
  const fee = calculateFee({ rule: cat.example, dealAmountCents: cat.exampleJobCents, finderShareBps: shareBps });
  return { jobCents: cat.exampleJobCents, feeCents: fee.totalCents, finderCents: fee.finderCents, rule: cat.example };
}

export function allCategoryExamples() {
  return CATEGORIES.map((c) => ({ category: c, ...categoryExample(c) }));
}

/** The homepage example: a € 5.000 job at 10% earns a Recruit € 375. */
export const HOME_EXAMPLE = (() => {
  const rule = { feeType: "PERCENTAGE" as const, feePercentBps: 1000, minJobAmountCents: 50_000, minFeeCents: 5_000 };
  const jobCents = 500_000;
  const feeCents = baseFee(rule, jobCents);
  const r = calculateFee({ rule, dealAmountCents: jobCents, finderShareBps: RECRUIT_SHARE });
  return { jobCents, rateBps: 1000, feeCents, shareBps: RECRUIT_SHARE, finderCents: r.finderCents };
})();
