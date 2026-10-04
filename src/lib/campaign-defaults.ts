import type { Campaign } from "@prisma/client";
import type { CampaignInput } from "./validation/campaign";
import { parseTiers } from "./fees";

const euro = (cents: number | null | undefined) => (cents == null ? "" : (cents / 100).toLocaleString("nl-NL", { maximumFractionDigits: 2 }));

/** Turn a stored campaign back into the human-typed strings the form edits. */
export function campaignToInput(c: Campaign | null, offerUrl?: string | null): CampaignInput {
  if (!c) {
    return { title: "", description: "", targetCustomer: "", region: "", feeType: "PERCENTAGE", percent: "8", fixed: "", tiers: [{ from: "500", fee: "100" }], minJob: "500", minFee: "50", budget: "", offerUrl: offerUrl ?? "" };
  }
  return {
    title: c.title,
    description: c.description,
    targetCustomer: c.targetCustomer,
    region: c.region,
    feeType: c.feeType,
    percent: c.feePercentBps ? String(c.feePercentBps / 100).replace(".", ",") : "",
    fixed: euro(c.feeFixedCents),
    tiers: (parseTiers(c.tiers) ?? []).map((t) => ({ from: euro(t.fromCents), fee: euro(t.feeCents) })),
    minJob: euro(c.minJobAmountCents),
    minFee: euro(c.minFeeCents),
    budget: euro(c.monthlyBudgetCents),
    offerUrl: offerUrl ?? "",
  };
}
