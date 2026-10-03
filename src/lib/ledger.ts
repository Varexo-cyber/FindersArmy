/**
 * Finder balances are derived from the ledger, never stored.
 *
 *   expected  = Σ EXPECTED        (deal won, business has not paid yet)
 *   available = Σ AVAILABLE + BONUS + ADJUSTMENT + PAYOUT
 *               (PAYOUT entries are negative and booked when a payout is requested,
 *                so requested money cannot be requested twice; a rejected payout books
 *                a positive PAYOUT reversal)
 *   paidOut   = −Σ PAYOUT entries whose payout is PAID
 *   pending   = −Σ PAYOUT entries whose payout is not PAID or REJECTED
 */
import type { Cents } from "./money";

export type LedgerType = "EXPECTED" | "AVAILABLE" | "PAYOUT" | "BONUS" | "ADJUSTMENT";
export type PayoutState = "REQUESTED" | "APPROVED" | "BATCHED" | "PAID" | "REJECTED";

export interface LedgerLine {
  type: LedgerType;
  amountCents: Cents;
  payoutId?: string | null;
}

export interface Balances {
  expectedCents: Cents;
  availableCents: Cents;
  pendingPayoutCents: Cents;
  paidOutCents: Cents;
  lifetimeEarnedCents: Cents;
}

export function computeBalances(
  lines: LedgerLine[],
  payoutStatus: Record<string, PayoutState> = {},
): Balances {
  let expected = 0;
  let available = 0;
  let paidOut = 0;
  let pending = 0;
  let earned = 0;
  for (const line of lines) {
    switch (line.type) {
      case "EXPECTED":
        expected += line.amountCents;
        break;
      case "AVAILABLE":
      case "BONUS":
      case "ADJUSTMENT":
        available += line.amountCents;
        earned += line.amountCents;
        break;
      case "PAYOUT": {
        available += line.amountCents;
        const state = line.payoutId ? payoutStatus[line.payoutId] : undefined;
        if (state === "PAID") paidOut -= line.amountCents;
        else if (state !== "REJECTED") pending -= line.amountCents;
        break;
      }
    }
  }
  return {
    expectedCents: expected,
    availableCents: available,
    pendingPayoutCents: Math.max(0, pending),
    paidOutCents: paidOut,
    lifetimeEarnedCents: earned,
  };
}

/** Entries to book when a lead's expected finder share changes (won, re-confirmed, lost). */
export function expectedAdjustment(previousCents: Cents, nextCents: Cents): LedgerLine[] {
  const delta = nextCents - previousCents;
  return delta === 0 ? [] : [{ type: "EXPECTED", amountCents: delta }];
}

/** Entries to book when the business pays: move the expected share into available. */
export function releaseOnPayment(expectedForLeadCents: Cents): LedgerLine[] {
  if (expectedForLeadCents <= 0) return [];
  return [
    { type: "EXPECTED", amountCents: -expectedForLeadCents },
    { type: "AVAILABLE", amountCents: expectedForLeadCents },
  ];
}

export function canRequestPayout(availableCents: Cents, amountCents: Cents, minimumCents: Cents) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) return { ok: false, reason: "INVALID" } as const;
  if (amountCents < minimumCents) return { ok: false, reason: "BELOW_MINIMUM" } as const;
  if (amountCents > availableCents) return { ok: false, reason: "INSUFFICIENT" } as const;
  return { ok: true } as const;
}
