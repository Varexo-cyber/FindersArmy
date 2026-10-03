import { describe, expect, it } from "vitest";
import { baseFee, calculateFee, maxFinderEarning, validateFeeRule, type FeeRule } from "@/lib/fees";

const pct = (bps: number, extra: Partial<FeeRule> = {}): FeeRule => ({
  feeType: "PERCENTAGE",
  feePercentBps: bps,
  minJobAmountCents: 50_000,
  minFeeCents: 5_000,
  ...extra,
});

const tiered: FeeRule = {
  feeType: "TIERED",
  tiers: [
    { fromCents: 50_000, feeCents: 10_000 },
    { fromCents: 1_000_000, feeCents: 25_000 },
  ],
  minJobAmountCents: 50_000,
  minFeeCents: 5_000,
};

describe("baseFee", () => {
  it("is zero below the minimum job amount", () => {
    expect(baseFee(pct(800), 49_999)).toBe(0);
  });

  it("applies the percentage at exactly the minimum", () => {
    // 8% of €500 = €40, minimum fee €50 wins
    expect(baseFee(pct(800), 50_000)).toBe(5_000);
  });

  it("takes the percentage when it exceeds the minimum fee", () => {
    // 8% of €3.000 = €240
    expect(baseFee(pct(800), 300_000)).toBe(24_000);
  });

  it("rounds half away from zero on cents", () => {
    // 8% of €1.234,56 = €98,7648 → €98,76
    expect(baseFee(pct(800, { minFeeCents: 0 }), 123_456)).toBe(9_876);
    // 12.5% of €1.000,04 = 125,005 → 125,01
    expect(baseFee(pct(1250, { minFeeCents: 0 }), 100_004)).toBe(12_501);
  });

  it("returns the fixed amount", () => {
    const fixed: FeeRule = { feeType: "FIXED", feeFixedCents: 20_000, minJobAmountCents: 50_000, minFeeCents: 5_000 };
    expect(baseFee(fixed, 1_500_000)).toBe(20_000);
    expect(baseFee(fixed, 49_000)).toBe(0);
  });

  it("raises a fixed amount below the minimum fee to the minimum", () => {
    const fixed: FeeRule = { feeType: "FIXED", feeFixedCents: 3_000, minJobAmountCents: 0, minFeeCents: 5_000 };
    expect(baseFee(fixed, 100_000)).toBe(5_000);
  });

  it("picks the tier the deal falls in, bounds inclusive", () => {
    expect(baseFee(tiered, 999_999)).toBe(10_000);
    expect(baseFee(tiered, 1_000_000)).toBe(25_000);
    expect(baseFee(tiered, 5_000_000)).toBe(25_000);
  });

  it("accepts tiers in any order", () => {
    const reversed = { ...tiered, tiers: [...tiered.tiers!].reverse() };
    expect(baseFee(reversed, 1_200_000)).toBe(25_000);
  });

  it("rejects negative or fractional deal amounts", () => {
    expect(() => baseFee(pct(800), -1)).toThrow();
    expect(() => baseFee(pct(800), 100.5)).toThrow();
  });
});

describe("calculateFee", () => {
  it("splits a fee by rank share and customer bonus", () => {
    const r = calculateFee({ rule: pct(800), dealAmountCents: 300_000, finderShareBps: 6250, customerBonusCents: 2_500 });
    expect(r).toEqual({
      baseFeeCents: 24_000,
      boostCents: 0,
      totalCents: 24_000,
      finderCents: 15_000,
      customerBonusCents: 2_500,
      platformCents: 6_500,
      belowMinimum: false,
    });
  });

  it("always sums back to the total", () => {
    for (const deal of [50_000, 77_777, 123_457, 999_999, 4_321_987]) {
      for (const share of [6000, 6250, 6500, 6750, 7000]) {
        const r = calculateFee({ rule: pct(733), dealAmountCents: deal, finderShareBps: share, customerBonusCents: 2_500, boostCents: 1_001 });
        expect(r.finderCents + r.platformCents + r.customerBonusCents).toBe(r.totalCents);
        expect(r.platformCents).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("adds a boost on top of the base fee", () => {
    const r = calculateFee({ rule: pct(800), dealAmountCents: 300_000, finderShareBps: 6000, boostCents: 10_000 });
    expect(r.totalCents).toBe(34_000);
    expect(r.finderCents).toBe(20_400);
  });

  it("drops the boost and bonus when the deal is below the minimum", () => {
    const r = calculateFee({ rule: pct(800), dealAmountCents: 40_000, finderShareBps: 6250, boostCents: 10_000, customerBonusCents: 2_500 });
    expect(r).toMatchObject({ totalCents: 0, finderCents: 0, customerBonusCents: 0, platformCents: 0, belowMinimum: true });
  });

  it("caps the customer bonus so the platform share never goes negative", () => {
    // minimum fee €50, finder 70% = €35, only €15 left for bonus
    const r = calculateFee({ rule: pct(800), dealAmountCents: 50_000, finderShareBps: 7000, customerBonusCents: 2_500 });
    expect(r.customerBonusCents).toBe(1_500);
    expect(r.platformCents).toBe(0);
  });

  it("validates the share range", () => {
    expect(() => calculateFee({ rule: pct(800), dealAmountCents: 100_000, finderShareBps: 10_001 })).toThrow();
  });
});

describe("validateFeeRule", () => {
  it("rejects incomplete rules", () => {
    expect(() => validateFeeRule({ feeType: "PERCENTAGE", minJobAmountCents: 0, minFeeCents: 0 })).toThrow();
    expect(() => validateFeeRule({ feeType: "FIXED", minJobAmountCents: 0, minFeeCents: 0 })).toThrow();
    expect(() => validateFeeRule({ feeType: "TIERED", tiers: [], minJobAmountCents: 0, minFeeCents: 0 })).toThrow();
  });

  it("rejects absurd percentages and duplicate tier bounds", () => {
    expect(() => validateFeeRule(pct(6000))).toThrow();
    expect(() =>
      validateFeeRule({ ...tiered, tiers: [{ fromCents: 1, feeCents: 1 }, { fromCents: 1, feeCents: 2 }] }),
    ).toThrow();
  });
});

describe("maxFinderEarning", () => {
  it("uses the highest tier for tiered rules", () => {
    expect(maxFinderEarning(tiered, 6000, 0)).toBe(15_000);
  });
  it("uses the reference deal for percentage rules", () => {
    expect(maxFinderEarning(pct(800), 6250, 500_000)).toBe(25_000);
  });
  it("includes an active boost", () => {
    const fixed: FeeRule = { feeType: "FIXED", feeFixedCents: 20_000, minJobAmountCents: 0, minFeeCents: 0 };
    expect(maxFinderEarning(fixed, 6000, 0, 10_000)).toBe(18_000);
  });
});
