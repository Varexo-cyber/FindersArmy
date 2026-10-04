/** Finder ranks. A higher rank means a higher share of every fee, never a share of other people's fees. */

export type RankKey = "RECRUIT" | "SOLDIER" | "SERGEANT" | "LIEUTENANT" | "COMMANDER";

export interface RankDefinition {
  key: RankKey;
  minPaidDeals: number;
  /** Finder share of the fee, in basis points. 7500 = 75%. */
  shareBps: number;
}

export const DEFAULT_RANKS: RankDefinition[] = [
  { key: "RECRUIT", minPaidDeals: 0, shareBps: 7500 },
  { key: "SOLDIER", minPaidDeals: 3, shareBps: 7750 },
  { key: "SERGEANT", minPaidDeals: 10, shareBps: 8000 },
  { key: "LIEUTENANT", minPaidDeals: 25, shareBps: 8250 },
  { key: "COMMANDER", minPaidDeals: 50, shareBps: 8500 },
];

export function validateRanks(ranks: RankDefinition[]): RankDefinition[] {
  if (ranks.length === 0) throw new Error("At least one rank is required");
  const sorted = [...ranks].sort((a, b) => a.minPaidDeals - b.minPaidDeals);
  if (sorted[0]!.minPaidDeals !== 0) throw new Error("The lowest rank must start at 0 paid deals");
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i]!;
    if (!Number.isInteger(r.shareBps) || r.shareBps < 0 || r.shareBps > 10_000) {
      throw new Error(`Invalid share for rank ${r.key}`);
    }
    if (i > 0) {
      const prev = sorted[i - 1]!;
      if (r.minPaidDeals === prev.minPaidDeals) throw new Error("Rank thresholds must be unique");
      if (r.shareBps < prev.shareBps) throw new Error("A higher rank cannot have a lower share");
    }
  }
  return sorted;
}

export function rankFor(paidDeals: number, ranks: RankDefinition[] = DEFAULT_RANKS): RankDefinition {
  const sorted = [...ranks].sort((a, b) => a.minPaidDeals - b.minPaidDeals);
  let current = sorted[0]!;
  for (const r of sorted) if (paidDeals >= r.minPaidDeals) current = r;
  return current;
}

export function nextRank(
  paidDeals: number,
  ranks: RankDefinition[] = DEFAULT_RANKS,
): { rank: RankDefinition; dealsToGo: number } | null {
  const sorted = [...ranks].sort((a, b) => a.minPaidDeals - b.minPaidDeals);
  const next = sorted.find((r) => r.minPaidDeals > paidDeals);
  return next ? { rank: next, dealsToGo: next.minPaidDeals - paidDeals } : null;
}

/** Progress (0..1) from the current rank threshold toward the next. */
export function rankProgress(paidDeals: number, ranks: RankDefinition[] = DEFAULT_RANKS): number {
  const current = rankFor(paidDeals, ranks);
  const next = nextRank(paidDeals, ranks);
  if (!next) return 1;
  const span = next.rank.minPaidDeals - current.minPaidDeals;
  return Math.min(1, Math.max(0, (paidDeals - current.minPaidDeals) / span));
}
