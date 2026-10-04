"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { LeadStatus } from "@prisma/client";
import { assertBusinessMember } from "../session";
import { db } from "../db";
import { LeadError, transitionLeadByBusiness } from "../services/leads";
import { parseEuroToCents } from "../../money";
import { campaignSchema, boostSchema } from "../../validation/campaign";
import { companySchema } from "../../validation/business";
import { flattenErrors, type FieldErrors } from "../../validation/common";
import { audit } from "../audit";
import { addDays, now } from "../clock";
import { ensurePaymentLink } from "../services/invoices";
import { storeImage } from "../storage";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string; errors?: FieldErrors };

const statusSchema = z.object({
  leadId: z.string().min(1),
  to: z.enum(["CONTACTED", "QUOTE_SENT", "WON", "COMPLETED", "LOST"]),
  dealAmount: z.string().optional(),
  lostReason: z.string().optional(),
  note: z.string().max(500).optional(),
});

export async function updateLeadStatus(input: z.input<typeof statusSchema>): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const { user, business } = await assertBusinessMember();
  const dealAmountCents = parsed.data.dealAmount ? parseEuroToCents(parsed.data.dealAmount) : null;
  if (parsed.data.to === "WON" && !dealAmountCents) return { ok: false, error: "DEAL_AMOUNT_REQUIRED" };
  try {
    await transitionLeadByBusiness({
      leadId: parsed.data.leadId,
      businessId: business.id,
      actorUserId: user.id,
      to: parsed.data.to as LeadStatus,
      dealAmountCents,
      lostReason: parsed.data.lostReason || null,
      note: parsed.data.note || null,
    });
  } catch (e) {
    if (e instanceof LeadError) return { ok: false, error: e.code };
    throw e;
  }
  revalidatePath("/app/bedrijf", "layout");
  return { ok: true };
}

export async function saveCampaign(campaignId: string | null, raw: unknown): Promise<ActionResult> {
  const { user, business } = await assertBusinessMember();
  const parsed = campaignSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID", errors: flattenErrors(parsed.error) };
  const { offerUrl, ...c } = parsed.data;
  const data = {
    title: c.title,
    description: c.description,
    targetCustomer: c.targetCustomer,
    region: c.region,
    feeType: c.feeType,
    feePercentBps: c.feePercentBps,
    feeFixedCents: c.feeFixedCents,
    tiers: c.tiers ?? undefined,
    minJobAmountCents: c.minJobAmountCents,
    minFeeCents: c.minFeeCents,
    monthlyBudgetCents: c.monthlyBudgetCents,
  };
  if (campaignId) {
    const existing = await db.campaign.findFirst({ where: { id: campaignId, businessId: business.id } });
    if (!existing) return { ok: false, error: "FORBIDDEN" };
    await db.campaign.update({ where: { id: campaignId }, data });
    await audit({ actorUserId: user.id, action: "campaign.updated", entity: "Campaign", entityId: campaignId, before: existing, after: data });
  } else {
    // New campaigns of an approved business go live immediately; otherwise they wait for review.
    const created = await db.campaign.create({ data: { ...data, businessId: business.id, status: business.status === "ACTIVE" ? "LIVE" : "DRAFT" } });
    await audit({ actorUserId: user.id, action: "campaign.created", entity: "Campaign", entityId: created.id, after: data });
  }
  if (offerUrl !== undefined) await db.business.update({ where: { id: business.id }, data: { offerUrl } });
  revalidatePath("/app/bedrijf/campagnes");
  return { ok: true };
}

export async function setCampaignLive(campaignId: string, live: boolean): Promise<ActionResult> {
  const { user, business } = await assertBusinessMember();
  const campaign = await db.campaign.findFirst({ where: { id: campaignId, businessId: business.id } });
  if (!campaign) return { ok: false, error: "FORBIDDEN" };
  // A business cannot lift a suspension or skip review by pressing "go live".
  if (live && (business.status !== "ACTIVE" || !["PAUSED", "DRAFT", "BUDGET_REACHED"].includes(campaign.status))) return { ok: false, error: "NOT_ALLOWED" };
  if (live && campaign.status === "BUDGET_REACHED") return { ok: false, error: "BUDGET" };
  if (!live && campaign.status !== "LIVE") return { ok: false, error: "NOT_ALLOWED" };
  await db.campaign.update({ where: { id: campaignId }, data: { status: live ? "LIVE" : "PAUSED" } });
  await audit({ actorUserId: user.id, action: live ? "campaign.resumed" : "campaign.paused", entity: "Campaign", entityId: campaignId });
  revalidatePath("/app/bedrijf/campagnes");
  return { ok: true };
}

export async function addBoost(campaignId: string, raw: unknown): Promise<ActionResult> {
  const { user, business } = await assertBusinessMember();
  const parsed = boostSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID", errors: flattenErrors(parsed.error) };
  const campaign = await db.campaign.findFirst({ where: { id: campaignId, businessId: business.id } });
  if (!campaign) return { ok: false, error: "FORBIDDEN" };
  const t = now();
  const boost = await db.boost.create({ data: { campaignId, label: parsed.data.label, extraFeeCents: parsed.data.amount!, startsAt: t, endsAt: addDays(t, parsed.data.days) } });
  await audit({ actorUserId: user.id, action: "boost.created", entity: "Boost", entityId: boost.id, after: parsed.data });
  revalidatePath("/app/bedrijf/campagnes");
  return { ok: true };
}

export async function endBoost(boostId: string): Promise<ActionResult> {
  const { business } = await assertBusinessMember();
  const boost = await db.boost.findFirst({ where: { id: boostId, campaign: { businessId: business.id } } });
  if (!boost) return { ok: false, error: "FORBIDDEN" };
  await db.boost.update({ where: { id: boostId }, data: { endsAt: now() } });
  revalidatePath("/app/bedrijf/campagnes");
  return { ok: true };
}

export async function updateBusinessProfile(formData: FormData): Promise<ActionResult> {
  const { user, business } = await assertBusinessMember();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload")));
  } catch {
    return { ok: false, error: "INVALID" };
  }
  const parsed = companySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID", errors: flattenErrors(parsed.error) };
  let logoUrl = business.logoUrl;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoUrl = await storeImage(logo, "logos", true);
    } catch {
      return { ok: false, error: "FILE" };
    }
  }
  await db.business.update({ where: { id: business.id }, data: { ...parsed.data, logoUrl } });
  await audit({ actorUserId: user.id, action: "business.profile_updated", entity: "Business", entityId: business.id, before: business, after: parsed.data });
  revalidatePath("/app/bedrijf", "layout");
  return { ok: true };
}

export async function retryPaymentLink(invoiceId: string): Promise<ActionResult> {
  const { business } = await assertBusinessMember();
  const invoice = await db.invoice.findFirst({ where: { id: invoiceId, businessId: business.id } });
  if (!invoice) return { ok: false, error: "FORBIDDEN" };
  await ensurePaymentLink(invoiceId);
  revalidatePath("/app/bedrijf/facturen");
  return { ok: true };
}
