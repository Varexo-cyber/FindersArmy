import "server-only";
import type { Campaign, Lead, Prisma } from "@prisma/client";
import { calculateFee, parseTiers, type FeeRule } from "../../fees";
import { expectedAdjustment } from "../../ledger";
import { rankFor } from "../../ranks";
import type { Settings } from "../../settings-schema";
import type { Tx } from "../db";

export function ruleFromCampaign(c: Pick<Campaign, "feeType" | "feePercentBps" | "feeFixedCents" | "tiers" | "minJobAmountCents" | "minFeeCents">): FeeRule {
  return {
    feeType: c.feeType,
    feePercentBps: c.feePercentBps,
    feeFixedCents: c.feeFixedCents,
    tiers: parseTiers(c.tiers),
    minJobAmountCents: c.minJobAmountCents,
    minFeeCents: c.minFeeCents,
  };
}

/** Σ EXPECTED ledger entries for one lead: what the Finder currently expects from it. */
export async function expectedForLead(tx: Tx, leadId: string): Promise<number> {
  const agg = await tx.ledgerEntry.aggregate({ where: { leadId, type: "EXPECTED" }, _sum: { amountCents: true } });
  return agg._sum.amountCents ?? 0;
}

/**
 * (Re)calculate the fee for a lead and book the difference in the Finder's expected balance.
 * Called on WON, on a corrected amount, and on customer confirmation (which adds the bonus).
 */
export async function bookFee(
  tx: Tx,
  lead: Lead & { campaign: Campaign },
  dealAmountCents: number,
  settings: Settings,
  opts: { includeCustomerBonus: boolean },
) {
  const finder = await tx.finderProfile.findUniqueOrThrow({ where: { id: lead.finderId } });
  const rank = rankFor(finder.paidDeals, settings.ranks);
  const breakdown = calculateFee({
    rule: ruleFromCampaign(lead.campaign),
    dealAmountCents,
    boostCents: lead.boostCents,
    finderShareBps: rank.shareBps,
    customerBonusCents: opts.includeCustomerBonus ? settings.customerBonusCents : 0,
  });
  const calculatedWith = {
    rule: ruleFromCampaign(lead.campaign),
    dealAmountCents,
    boostCents: lead.boostCents,
    rank: rank.key,
    finderShareBps: rank.shareBps,
    breakdown,
    at: new Date().toISOString(),
  } as unknown as Prisma.InputJsonObject;
  await tx.fee.upsert({
    where: { leadId: lead.id },
    create: {
      leadId: lead.id,
      totalCents: breakdown.totalCents,
      finderCents: breakdown.finderCents,
      platformCents: breakdown.platformCents,
      customerBonusCents: breakdown.customerBonusCents,
      calculatedWith,
    },
    update: {
      totalCents: breakdown.totalCents,
      finderCents: breakdown.finderCents,
      platformCents: breakdown.platformCents,
      customerBonusCents: breakdown.customerBonusCents,
      calculatedWith,
    },
  });
  const previous = await expectedForLead(tx, lead.id);
  for (const line of expectedAdjustment(previous, breakdown.finderCents)) {
    await tx.ledgerEntry.create({
      data: { finderId: lead.finderId, leadId: lead.id, type: line.type, amountCents: line.amountCents, note: "fee" },
    });
  }
  return breakdown;
}

/** Remove any expected money for a lead (lost, fraud, duplicate after the fact). */
export async function reverseExpected(tx: Tx, lead: Pick<Lead, "id" | "finderId">, note: string) {
  const previous = await expectedForLead(tx, lead.id);
  if (previous !== 0) {
    await tx.ledgerEntry.create({ data: { finderId: lead.finderId, leadId: lead.id, type: "EXPECTED", amountCents: -previous, note } });
  }
  await tx.fee.deleteMany({ where: { leadId: lead.id } });
}
