import "server-only";
import { computeBalances, type PayoutState } from "../../ledger";
import { db } from "../db";

export async function finderBalances(finderId: string) {
  const [lines, payouts] = await Promise.all([
    db.ledgerEntry.findMany({ where: { finderId }, select: { type: true, amountCents: true, payoutId: true } }),
    db.payout.findMany({ where: { finderId }, select: { id: true, status: true } }),
  ]);
  const status: Record<string, PayoutState> = {};
  for (const p of payouts) status[p.id] = p.status;
  return computeBalances(lines, status);
}
