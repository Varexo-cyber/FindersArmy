import { z } from "zod";
import { euros, percentBps, req, url, optionalText } from "./common";
import { validateFeeRule } from "../fees";

const tierInput = z.object({ from: z.string(), fee: z.string() });

/** Campaign + fee rule. Raw strings in, a validated FeeRule (cents/bps) out. */
export const campaignSchema = z
  .object({
    title: req(120),
    description: req(1000),
    targetCustomer: req(300),
    region: req(120),
    feeType: z.enum(["PERCENTAGE", "FIXED", "TIERED"]),
    percent: z.string().optional(),
    fixed: z.string().optional(),
    tiers: z.array(tierInput).optional(),
    minJob: euros({ optional: true }),
    minFee: euros({ optional: true }),
    budget: euros({ optional: true, min: 100 }),
    offerUrl: url,
  })
  .transform((v, ctx) => {
    let feePercentBps: number | null = null;
    let feeFixedCents: number | null = null;
    let tiers: { fromCents: number; feeCents: number }[] | null = null;
    if (v.feeType === "PERCENTAGE") {
      const r = percentBps.safeParse(v.percent);
      if (!r.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["percent"], message: "percent" });
        return z.NEVER;
      }
      feePercentBps = r.data;
    } else if (v.feeType === "FIXED") {
      const r = euros({ min: 1 }).safeParse(v.fixed);
      if (!r.success || r.data === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fixed"], message: "amount" });
        return z.NEVER;
      }
      feeFixedCents = r.data;
    } else {
      const parsed = (v.tiers ?? []).map((t) => ({ from: euros().safeParse(t.from), fee: euros({ min: 1 }).safeParse(t.fee) }));
      if (parsed.length === 0 || parsed.some((p) => !p.from.success || !p.fee.success)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tiers"], message: "amount" });
        return z.NEVER;
      }
      tiers = parsed.map((p) => ({ fromCents: p.from.data as number, feeCents: p.fee.data as number }));
    }
    const rule = {
      feeType: v.feeType,
      feePercentBps,
      feeFixedCents,
      tiers,
      minJobAmountCents: v.minJob ?? 50_000,
      minFeeCents: v.minFee ?? 5_000,
    };
    try {
      validateFeeRule(rule);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["feeType"], message: "amount" });
      return z.NEVER;
    }
    return { title: v.title, description: v.description, targetCustomer: v.targetCustomer, region: v.region, offerUrl: v.offerUrl, monthlyBudgetCents: v.budget ?? null, ...rule };
  });

export type CampaignInput = z.input<typeof campaignSchema>;
export type CampaignData = z.output<typeof campaignSchema>;

export const boostSchema = z.object({
  label: req(60),
  amount: euros({ min: 100 }),
  days: z.coerce.number().int().min(1).max(60),
});

export { optionalText };
