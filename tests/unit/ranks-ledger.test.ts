import { describe, expect, it } from "vitest";
import { DEFAULT_RANKS, nextRank, rankFor, rankProgress, validateRanks } from "@/lib/ranks";
import { canRequestPayout, computeBalances, expectedAdjustment, releaseOnPayment } from "@/lib/ledger";

describe("ranks", () => {
  it.each([
    [0, "RECRUIT", 6000],
    [2, "RECRUIT", 6000],
    [3, "SOLDIER", 6250],
    [10, "SERGEANT", 6500],
    [24, "SERGEANT", 6500],
    [25, "LIEUTENANT", 6750],
    [50, "COMMANDER", 7000],
    [500, "COMMANDER", 7000],
  ])("%i paid deals → %s", (deals, key, bps) => {
    const r = rankFor(deals);
    expect(r.key).toBe(key);
    expect(r.shareBps).toBe(bps);
  });

  it("knows the next rank and progress", () => {
    expect(nextRank(5)).toEqual({ rank: DEFAULT_RANKS[2], dealsToGo: 5 });
    expect(nextRank(50)).toBeNull();
    expect(rankProgress(3)).toBe(0);
    expect(rankProgress(6)).toBeCloseTo(3 / 7);
    expect(rankProgress(80)).toBe(1);
  });

  it("validates admin-edited ranks", () => {
    expect(() => validateRanks([{ key: "SOLDIER", minPaidDeals: 1, shareBps: 6000 }])).toThrow();
    expect(() =>
      validateRanks([
        { key: "RECRUIT", minPaidDeals: 0, shareBps: 6500 },
        { key: "SOLDIER", minPaidDeals: 3, shareBps: 6000 },
      ]),
    ).toThrow();
    expect(validateRanks([...DEFAULT_RANKS].reverse())[0]!.key).toBe("RECRUIT");
  });
});

describe("ledger", () => {
  it("derives balances through the full lifecycle", () => {
    const lines = [
      // deal won: €150 expected
      ...expectedAdjustment(0, 15_000),
      // customer corrected amount: €165
      ...expectedAdjustment(15_000, 16_500),
      // business paid
      ...releaseOnPayment(16_500),
      // first deal bonus
      { type: "BONUS" as const, amountCents: 1_000 },
      // payout requested of €100
      { type: "PAYOUT" as const, amountCents: -10_000, payoutId: "p1" },
    ];
    expect(computeBalances(lines, { p1: "REQUESTED" })).toEqual({
      expectedCents: 0,
      availableCents: 7_500,
      pendingPayoutCents: 10_000,
      paidOutCents: 0,
      lifetimeEarnedCents: 17_500,
    });
    expect(computeBalances(lines, { p1: "PAID" })).toMatchObject({ pendingPayoutCents: 0, paidOutCents: 10_000 });
  });

  it("restores availability when a payout is rejected", () => {
    const lines = [
      { type: "AVAILABLE" as const, amountCents: 5_000 },
      { type: "PAYOUT" as const, amountCents: -5_000, payoutId: "p1" },
      { type: "PAYOUT" as const, amountCents: 5_000, payoutId: "p1" },
    ];
    expect(computeBalances(lines, { p1: "REJECTED" })).toMatchObject({ availableCents: 5_000, pendingPayoutCents: 0, paidOutCents: 0 });
  });

  it("reverses expected money when a won deal is lost", () => {
    const lines = [...expectedAdjustment(0, 15_000), ...expectedAdjustment(15_000, 0)];
    expect(computeBalances(lines).expectedCents).toBe(0);
  });

  it("does not book zero-value movements", () => {
    expect(expectedAdjustment(100, 100)).toEqual([]);
    expect(releaseOnPayment(0)).toEqual([]);
  });

  it("enforces the payout minimum and available balance", () => {
    expect(canRequestPayout(10_000, 2_499, 2_500)).toEqual({ ok: false, reason: "BELOW_MINIMUM" });
    expect(canRequestPayout(2_000, 2_500, 2_500)).toEqual({ ok: false, reason: "INSUFFICIENT" });
    expect(canRequestPayout(2_500, 2_500, 2_500)).toEqual({ ok: true });
    expect(canRequestPayout(2_500, 0, 2_500)).toEqual({ ok: false, reason: "INVALID" });
  });
});
