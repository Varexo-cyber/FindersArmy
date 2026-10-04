"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { LeadStatus } from "@prisma/client";
import { assertAdmin } from "../session";
import { db } from "../db";
import { audit } from "../audit";
import { now } from "../clock";
import { notifyBusiness, notifyUser } from "../notify";
import { adminSetLeadStatus, confirmLead } from "../services/leads";
import { issueInvoice, markInvoicePaid, maybeReinstateBusiness } from "../services/invoices";
import { approvePayouts, createPayoutBatch, markBatchPaid, rejectPayout } from "../services/payouts";
import { updateSetting } from "../settings";
import { settingsSchema, type SettingKey } from "../../settings-schema";
import { parseEuroToCents } from "../../money";
import { recomputeFinderScore } from "../services/scores";

type Result = { ok: true; message?: string } | { ok: false; error: string };

function done(path: string): Result {
  revalidatePath(path, "layout");
  return { ok: true };
}

export async function approveBusiness(businessId: string): Promise<Result> {
  const admin = await assertAdmin();
  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  await db.$transaction(async (tx) => {
    await tx.business.update({ where: { id: businessId }, data: { status: "ACTIVE", approvedAt: business.approvedAt ?? now(), suspendedReason: null } });
    // First approval puts draft campaigns live; a re-approval after review restores visibility.
    await tx.campaign.updateMany({ where: { businessId, status: { in: ["DRAFT", "SUSPENDED"] } }, data: { status: "LIVE" } });
    await audit({ actorUserId: admin.id, action: "business.approved", entity: "Business", entityId: businessId, before: { status: business.status }, after: { status: "ACTIVE" } }, tx);
  });
  await notifyBusiness(businessId, "BUSINESS_APPROVED", { business: business.name }, "/app/bedrijf");
  return done("/admin");
}

export async function rejectBusiness(businessId: string, reason: string): Promise<Result> {
  const admin = await assertAdmin();
  if (!reason.trim()) return { ok: false, error: "REASON_REQUIRED" };
  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  await db.business.update({ where: { id: businessId }, data: { status: "REJECTED", suspendedReason: reason } });
  await audit({ actorUserId: admin.id, action: "business.rejected", entity: "Business", entityId: businessId, before: { status: business.status }, after: { reason } });
  await notifyBusiness(businessId, "BUSINESS_REJECTED", { business: business.name, reason });
  return done("/admin");
}

export async function suspendBusiness(businessId: string, reason: string): Promise<Result> {
  const admin = await assertAdmin();
  if (!reason.trim()) return { ok: false, error: "REASON_REQUIRED" };
  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  await db.$transaction(async (tx) => {
    await tx.business.update({ where: { id: businessId }, data: { status: "SUSPENDED", suspendedReason: reason } });
    await tx.campaign.updateMany({ where: { businessId, status: { in: ["LIVE", "BUDGET_REACHED"] } }, data: { status: "SUSPENDED" } });
    await audit({ actorUserId: admin.id, action: "business.suspended", entity: "Business", entityId: businessId, before: { status: business.status }, after: { reason } }, tx);
  });
  await notifyBusiness(businessId, "BUSINESS_SUSPENDED", { reason }, "/app/bedrijf");
  return done("/admin");
}

export async function setCampaignStatusAdmin(campaignId: string, status: "LIVE" | "PAUSED" | "SUSPENDED", reason: string): Promise<Result> {
  const admin = await assertAdmin();
  const c = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  await db.campaign.update({ where: { id: campaignId }, data: { status } });
  await audit({ actorUserId: admin.id, action: "campaign.status.admin", entity: "Campaign", entityId: campaignId, before: { status: c.status }, after: { status, reason } });
  return done("/admin/campagnes");
}

const leadStatusInput = z.object({ leadId: z.string(), to: z.string(), reason: z.string().min(3), dealAmount: z.string().optional() });

export async function adminUpdateLead(raw: z.input<typeof leadStatusInput>): Promise<Result> {
  const admin = await assertAdmin();
  const input = leadStatusInput.safeParse(raw);
  if (!input.success) return { ok: false, error: "REASON_REQUIRED" };
  const amount = input.data.dealAmount ? parseEuroToCents(input.data.dealAmount) : null;
  try {
    await adminSetLeadStatus({ leadId: input.data.leadId, to: input.data.to as LeadStatus, reason: input.data.reason, actorUserId: admin.id, dealAmountCents: amount });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  return done("/admin/leads");
}

export async function resolveDispute(disputeId: string, outcome: "CONFIRM" | "LOST" | "REJECT", resolution: string, dealAmount?: string): Promise<Result> {
  const admin = await assertAdmin();
  if (!resolution.trim()) return { ok: false, error: "REASON_REQUIRED" };
  const dispute = await db.dispute.findUniqueOrThrow({ where: { id: disputeId }, include: { lead: true } });
  const amount = dealAmount ? parseEuroToCents(dealAmount) : null;
  await db.dispute.update({ where: { id: disputeId }, data: { status: outcome === "REJECT" ? "REJECTED" : "RESOLVED", resolution, resolvedAt: now() } });
  await audit({ actorUserId: admin.id, action: `dispute.${outcome.toLowerCase()}`, entity: "Dispute", entityId: disputeId, after: { resolution, amount } });
  const lead = dispute.lead;
  if (outcome === "CONFIRM" && !["INVOICED", "PAID", "PAID_OUT"].includes(lead.status)) {
    await adminSetLeadStatus({ leadId: lead.id, to: "CONFIRMED", reason: `Geschil opgelost: ${resolution}`, actorUserId: admin.id, dealAmountCents: amount ?? lead.dealAmountCents });
  } else if (outcome === "LOST" && !["INVOICED", "PAID", "PAID_OUT"].includes(lead.status)) {
    await adminSetLeadStatus({ leadId: lead.id, to: "LOST", reason: `Geschil opgelost: ${resolution}`, actorUserId: admin.id });
  } else if (outcome === "REJECT" && lead.status === "DISPUTED") {
    // Dispute rejected: the business's version stands, so the deal is confirmed as reported.
    const invoiceId = await db.$transaction((tx) => confirmLead(tx, lead.id, { actorType: "ADMIN", actorUserId: admin.id, note: resolution }));
    if (invoiceId) await issueInvoice(invoiceId);
  }
  return done("/admin/geschillen");
}

export async function resolveReport(reportId: string, status: "RESOLVED" | "REJECTED", resolution: string): Promise<Result> {
  const admin = await assertAdmin();
  if (!resolution.trim()) return { ok: false, error: "REASON_REQUIRED" };
  const report = await db.report.update({ where: { id: reportId }, data: { status, resolution }, include: { finder: true } });
  await audit({ actorUserId: admin.id, action: `report.${status.toLowerCase()}`, entity: "Report", entityId: reportId, after: { resolution } });
  await notifyUser(report.finder.userId, "FINDER_BONUS", { amount: "", reason: `Je melding is ${status === "RESOLVED" ? "opgelost" : "afgewezen"}: ${resolution}` }, "/app/finder/klanten");
  return done("/admin/geschillen");
}

export async function adminMarkInvoicePaid(invoiceId: string): Promise<Result> {
  const admin = await assertAdmin();
  await markInvoicePaid(invoiceId, { userId: admin.id, source: "admin" });
  return done("/admin/facturen");
}

export async function adminCancelInvoice(invoiceId: string, reason: string): Promise<Result> {
  const admin = await assertAdmin("SUPER_ADMIN");
  if (!reason.trim()) return { ok: false, error: "REASON_REQUIRED" };
  const inv = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (inv.status === "PAID") return { ok: false, error: "ALREADY_PAID" };
  await db.invoice.update({ where: { id: invoiceId }, data: { status: "CANCELLED" } });
  await audit({ actorUserId: admin.id, action: "invoice.cancelled", entity: "Invoice", entityId: invoiceId, before: { status: inv.status }, after: { reason } });
  await maybeReinstateBusiness(inv.businessId);
  return done("/admin/facturen");
}

export async function adminApprovePayouts(ids: string[]): Promise<Result> {
  const admin = await assertAdmin("SUPER_ADMIN");
  await approvePayouts(ids, admin.id);
  return done("/admin/uitbetalingen");
}

export async function adminRejectPayout(id: string, reason: string): Promise<Result> {
  const admin = await assertAdmin("SUPER_ADMIN");
  try {
    await rejectPayout(id, reason, admin.id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  return done("/admin/uitbetalingen");
}

export async function adminCreateBatch(): Promise<Result> {
  const admin = await assertAdmin("SUPER_ADMIN");
  try {
    await createPayoutBatch(admin.id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  return done("/admin/uitbetalingen");
}

export async function adminMarkBatchPaid(batchId: string): Promise<Result> {
  const admin = await assertAdmin("SUPER_ADMIN");
  await markBatchPaid(batchId, admin.id);
  return done("/admin/uitbetalingen");
}

export async function adminSetFinderStatus(finderId: string, status: "ACTIVE" | "WARNED" | "SUSPENDED", reason: string): Promise<Result> {
  const admin = await assertAdmin();
  if (!reason.trim()) return { ok: false, error: "REASON_REQUIRED" };
  const f = await db.finderProfile.findUniqueOrThrow({ where: { id: finderId } });
  await db.finderProfile.update({ where: { id: finderId }, data: { status } });
  await audit({ actorUserId: admin.id, action: "finder.status.admin", entity: "FinderProfile", entityId: finderId, before: { status: f.status }, after: { status, reason } });
  if (status !== "SUSPENDED") await recomputeFinderScore(finderId);
  return done("/admin/finders");
}

export async function adminLedgerAdjustment(finderId: string, amount: string, reason: string): Promise<Result> {
  const admin = await assertAdmin("SUPER_ADMIN");
  const negative = amount.trim().startsWith("-");
  const cents = parseEuroToCents(amount.replace("-", ""));
  if (!cents || !reason.trim()) return { ok: false, error: "INVALID" };
  const entry = await db.ledgerEntry.create({ data: { finderId, type: "ADJUSTMENT", amountCents: negative ? -cents : cents, note: reason } });
  await audit({ actorUserId: admin.id, action: "ledger.adjustment", entity: "LedgerEntry", entityId: entry.id, after: { finderId, cents: entry.amountCents, reason } });
  return done("/admin/finders");
}

export async function adminMarkBonusSent(confirmationId: string): Promise<Result> {
  const admin = await assertAdmin();
  await db.confirmation.update({ where: { id: confirmationId }, data: { bonusSentAt: now() } });
  await audit({ actorUserId: admin.id, action: "customer_bonus.sent", entity: "Confirmation", entityId: confirmationId });
  return done("/admin/facturen");
}

export async function adminUpdateSetting(key: SettingKey, json: string): Promise<Result> {
  const admin = await assertAdmin("SUPER_ADMIN");
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return { ok: false, error: "Ongeldige JSON" };
  }
  const parsed = settingsSchema.shape[key].safeParse(value);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const before = await db.setting.findUnique({ where: { key } });
  try {
    await updateSetting(key, parsed.data as never);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ERROR" };
  }
  await audit({ actorUserId: admin.id, action: "setting.updated", entity: "Setting", entityId: key, before: before?.value, after: parsed.data });
  return done("/admin/instellingen");
}

export async function adminToggleCategory(categoryId: string, excluded: boolean, reason: string): Promise<Result> {
  const admin = await assertAdmin("SUPER_ADMIN");
  await db.category.update({ where: { id: categoryId }, data: { excluded, excludedReason: excluded ? reason || null : null } });
  await audit({ actorUserId: admin.id, action: excluded ? "category.excluded" : "category.included", entity: "Category", entityId: categoryId, after: { reason } });
  return done("/admin/instellingen");
}

export async function adminToggleChecklist(id: string, isDone: boolean): Promise<Result> {
  const admin = await assertAdmin();
  const row = await db.setting.findUnique({ where: { key: "ownerChecklist" } });
  const list = ((row?.value as { id: string; done: boolean }[] | undefined) ?? []).filter((x) => x.id !== id);
  list.push({ id, done: isDone });
  await updateSetting("ownerChecklist", list);
  await audit({ actorUserId: admin.id, action: "checklist.toggled", entity: "Setting", entityId: id, after: { done: isDone } });
  return done("/admin");
}
