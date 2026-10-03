/**
 * Finder's fee calculation. Pure, deterministic, integer cents only.
 *
 *   dealAmount < minJobAmount      → fee 0 (the lead still counts)
 *   PERCENTAGE: max(minFee, deal × pct)
 *   FIXED:      fixedAmount
 *   TIERED:     amount of the tier the deal falls in
 *   + boost captured when the lead came in
 *   finderShare   = fee × rank share
 *   customerBonus = configured bonus, capped so the platform share never goes negative
 *   platformShare = fee − finderShare − customerBonus
 */
import { applyBps, assertCents, type Cents } from "./money";

export type FeeType = "PERCENTAGE" | "FIXED" | "TIERED";

export interface FeeTier {
  /** Inclusive lower bound of the deal amount for this tier. */
  fromCents: Cents;
  feeCents: Cents;
}

export interface FeeRule {
  feeType: FeeType;
  feePercentBps?: number | null;
  feeFixedCents?: Cents | null;
  tiers?: FeeTier[] | null;
  minJobAmountCents: Cents;
  minFeeCents: Cents;
}

export interface FeeInput {
  rule: FeeRule;
  dealAmountCents: Cents;
  boostCents?: Cents;
  finderShareBps: number;
  customerBonusCents?: Cents;
}

export interface FeeBreakdown {
  baseFeeCents: Cents;
  boostCents: Cents;
  totalCents: Cents;
  finderCents: Cents;
  customerBonusCents: Cents;
  platformCents: Cents;
  belowMinimum: boolean;
}

export function validateFeeRule(rule: FeeRule): void {
  assertCents(rule.minJobAmountCents, "minJobAmountCents");
  assertCents(rule.minFeeCents, "minFeeCents");
  if (rule.minJobAmountCents < 0 || rule.minFeeCents < 0) throw new Error("Minimums cannot be negative");
  switch (rule.feeType) {
    case "PERCENTAGE":
      if (rule.feePercentBps == null || !Number.isInteger(rule.feePercentBps)) {
        throw new Error("PERCENTAGE rule needs feePercentBps");
      }
      if (rule.feePercentBps <= 0 || rule.feePercentBps > 5000) {
        throw new Error("Percentage must be between 0.01% and 50%");
      }
      break;
    case "FIXED":
      if (rule.feeFixedCents == null) throw new Error("FIXED rule needs feeFixedCents");
      assertCents(rule.feeFixedCents, "feeFixedCents");
      if (rule.feeFixedCents <= 0) throw new Error("Fixed fee must be positive");
      break;
    case "TIERED": {
      const tiers = rule.tiers ?? [];
      if (tiers.length === 0) throw new Error("TIERED rule needs at least one tier");
      const sorted = [...tiers].sort((a, b) => a.fromCents - b.fromCents);
      sorted.forEach((t, i) => {
        assertCents(t.fromCents, "tier.fromCents");
        assertCents(t.feeCents, "tier.feeCents");
        if (t.feeCents <= 0) throw new Error("Tier fee must be positive");
        if (i > 0 && t.fromCents === sorted[i - 1]!.fromCents) throw new Error("Duplicate tier bound");
      });
      break;
    }
    default:
      throw new Error(`Unknown fee type ${(rule as FeeRule).feeType}`);
  }
}

/** The fee for a deal before boosts. */
export function baseFee(rule: FeeRule, dealAmountCents: Cents): Cents {
  assertCents(dealAmountCents, "dealAmountCents");
  if (dealAmountCents < 0) throw new Error("Deal amount cannot be negative");
  if (dealAmountCents < rule.minJobAmountCents) return 0;
  switch (rule.feeType) {
    case "PERCENTAGE":
      return Math.max(rule.minFeeCents, applyBps(dealAmountCents, rule.feePercentBps ?? 0));
    case "FIXED":
      return Math.max(rule.minFeeCents, rule.feeFixedCents ?? 0);
    case "TIERED": {
      const sorted = [...(rule.tiers ?? [])].sort((a, b) => a.fromCents - b.fromCents);
      let fee = 0;
      for (const tier of sorted) if (dealAmountCents >= tier.fromCents) fee = tier.feeCents;
      return fee === 0 ? 0 : Math.max(rule.minFeeCents, fee);
    }
  }
}

export function calculateFee(input: FeeInput): FeeBreakdown {
  validateFeeRule(input.rule);
  const boost = input.boostCents ?? 0;
  assertCents(boost, "boostCents");
  if (boost < 0) throw new Error("Boost cannot be negative");
  if (!Number.isInteger(input.finderShareBps) || input.finderShareBps < 0 || input.finderShareBps > 10_000) {
    throw new Error("finderShareBps must be between 0 and 10000");
  }

  const base = baseFee(input.rule, input.dealAmountCents);
  const belowMinimum = input.dealAmountCents < input.rule.minJobAmountCents;
  // A deal below the minimum job amount earns nothing, boost included.
  const total = belowMinimum ? 0 : base + boost;
  const finder = applyBps(total, input.finderShareBps);
  const requestedBonus = total === 0 ? 0 : (input.customerBonusCents ?? 0);
  assertCents(requestedBonus, "customerBonusCents");
  const customerBonus = Math.max(0, Math.min(requestedBonus, total - finder));
  const platform = total - finder - customerBonus;

  return {
    baseFeeCents: belowMinimum ? 0 : base,
    boostCents: belowMinimum ? 0 : boost,
    totalCents: total,
    finderCents: finder,
    customerBonusCents: customerBonus,
    platformCents: platform,
    belowMinimum,
  };
}

/**
 * The headline "Verdien tot € X" for a campaign: the most a Finder at the given rank can earn
 * on a single deal. For percentage rules there is no hard ceiling, so we use a reference deal
 * amount (the category's typical job) and say "tot" honestly only for fixed/tiered rules.
 */
export function maxFinderEarning(
  rule: FeeRule,
  finderShareBps: number,
  referenceDealCents: Cents,
  boostCents: Cents = 0,
): Cents {
  let fee: Cents;
  if (rule.feeType === "FIXED") fee = Math.max(rule.minFeeCents, rule.feeFixedCents ?? 0);
  else if (rule.feeType === "TIERED") {
    fee = Math.max(rule.minFeeCents, ...(rule.tiers ?? []).map((t) => t.feeCents));
  } else {
    fee = baseFee(rule, Math.max(referenceDealCents, rule.minJobAmountCents));
  }
  return applyBps(fee + boostCents, finderShareBps);
}

export function parseTiers(value: unknown): FeeTier[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .filter(
      (t): t is FeeTier =>
        typeof t === "object" &&
        t !== null &&
        Number.isInteger((t as FeeTier).fromCents) &&
        Number.isInteger((t as FeeTier).feeCents),
    )
    .map((t) => ({ fromCents: t.fromCents, feeCents: t.feeCents }));
}
