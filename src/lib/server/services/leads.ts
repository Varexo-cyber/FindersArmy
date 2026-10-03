import "server-only";
import type { LeadStatus, Prisma } from "@prisma/client";
import { db, type Tx } from "../db";
import { getSettings } from "../settings";
import { addDays, addMonths, now, startOfMonth } from "../clock";
import { normalizePhone, normalizePostcode } from "../../kvk";
import { validateBusinessTransition, LOST_REASONS } from "../../lead-status";
import { formatCents } from "../../money";
import { notifyAdmins, notifyBusiness, notifyEmail, notifyUser } from "../notify";
import { audit } from "../audit";
import { bookFee, reverseExpected } from "./fees";
import { createInvoiceForLead, issueInvoice } from "./invoices";
import { randomToken } from "../hash";
import { appUrl } from "../../env";
import { recomputeFinderScore } from "./scores";

export class LeadError extends Error {
  constructor(public code: "LINK_NOT_FOUND" | "CAMPAIGN_UNAVAILABLE" | "SELF_REFERRAL" | "FORBIDDEN" | "INVALID_TRANSITION" | "DEAL_AMOUNT_REQUIRED" | "LOST_REASON_REQUIRED") {
    super(code);
  }
}

export interface NewLeadInput {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
  houseNumber: string;
  city?: string;
  description: string;
  timeframe: string;
  photoUrls: string[];
  ipHash: string;
  uaHash: string;
}

export type NewLeadResult = { kind: "created"; leadId: string; business: string } | { kind: "duplicate"; business: string };

const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/**
 * A customer submits the referral form. Attribution, duplicate and fraud rules all live here:
 *  - self-referral by e-mail/phone is refused outright;
 *  - same customer + same business within the duplicate window → DUPLICATE (first attribution wins);
 *  - an existing customer still within attribution stays with their original Finder (repeat);
 *  - a submission from a device the Finder uses is held as FRAUD for admin review.
 */
export async function createLead(input: NewLeadInput): Promise<NewLeadResult> {
  const settings = await getSettings();
  const t = now();
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone);

  const link = await db.referralLink.findUnique({
    where: { code: input.code },
    include: { campaign: { include: { business: true } }, finder: { include: { user: true } } },
  });
  if (!link) throw new LeadError("LINK_NOT_FOUND");
  const { campaign, finder } = link;
  if (campaign.status !== "LIVE" || campaign.business.status !== "ACTIVE" || finder.status === "SUSPENDED") {
    throw new LeadError("CAMPAIGN_UNAVAILABLE");
  }
  if (finder.user.email.toLowerCase() === email || (finder.user.phone && normalizePhone(finder.user.phone) === phone)) {
    throw new LeadError("SELF_REFERRAL");
  }

  const result = await db.$transaction(async (tx) => {
    const existing = await tx.customer.findFirst({
      where: { anonymizedAt: null, OR: [{ email }, { phone }] },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      const dup = await tx.lead.findFirst({
        where: {
          customerId: existing.id,
          campaign: { businessId: campaign.businessId },
          createdAt: { gte: addDays(t, -settings.duplicateWindowDays) },
          status: { notIn: ["DUPLICATE", "FRAUD"] },
        },
      });
      if (dup) {
        const lead = await tx.lead.create({
          data: {
            customerId: existing.id,
            campaignId: campaign.id,
            finderId: link.finderId,
            referralLinkId: link.id,
            description: input.description,
            timeframe: input.timeframe,
            status: "DUPLICATE",
            ipHash: input.ipHash,
            fraudFlags: [`DUPLICATE_OF:${dup.id}`],
          },
        });
        await tx.leadEvent.create({ data: { leadId: lead.id, toStatus: "DUPLICATE", actorType: "SYSTEM", note: `Dubbel met ${dup.id}` } });
        return { kind: "duplicate" as const };
      }
    }

    let customerId: string;
    let finderId = link.finderId;
    let isRepeat = false;
    const customerData = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone,
      postcode: normalizePostcode(input.postcode),
      houseNumber: input.houseNumber.trim(),
      city: input.city?.trim() || null,
      consentAt: t,
    };
    if (existing && existing.originalFinderId && existing.attributionExpiresAt && existing.attributionExpiresAt > t) {
      // Repeat customer: the Finder who first brought them in keeps earning for 12 months.
      finderId = existing.originalFinderId;
      isRepeat = true;
      await tx.customer.update({ where: { id: existing.id }, data: customerData });
      customerId = existing.id;
    } else if (existing) {
      await tx.customer.update({
        where: { id: existing.id },
        data: { ...customerData, originalFinderId: link.finderId, attributionExpiresAt: addMonths(t, settings.attributionMonths) },
      });
      customerId = existing.id;
    } else {
      const c = await tx.customer.create({
        data: { ...customerData, originalFinderId: link.finderId, attributionExpiresAt: addMonths(t, settings.attributionMonths) },
      });
      customerId = c.id;
    }

    const flags: string[] = [];
    const sameDevice = await tx.finderDevice.findFirst({ where: { finderId, ipHash: input.ipHash } });
    if (sameDevice) flags.push("SAME_DEVICE_AS_FINDER");
    const recentFromIp = await tx.lead.count({ where: { ipHash: input.ipHash, createdAt: { gte: addDays(t, -1) } } });
    if (recentFromIp >= 5) flags.push("IP_VELOCITY");

    const boost = await tx.boost.findFirst({
      where: { campaignId: campaign.id, startsAt: { lte: t }, endsAt: { gte: t } },
      orderBy: { extraFeeCents: "desc" },
    });

    const status: LeadStatus = flags.includes("SAME_DEVICE_AS_FINDER") ? "FRAUD" : "NEW";
    const lead = await tx.lead.create({
      data: {
        customerId,
        campaignId: campaign.id,
        finderId,
        referralLinkId: link.id,
        description: input.description,
        timeframe: input.timeframe,
        status,
        isRepeat,
        boostId: boost?.id,
        boostCents: boost?.extraFeeCents ?? 0,
        ipHash: input.ipHash,
        fraudFlags: flags,
        photos: { create: input.photoUrls.map((url) => ({ url })) },
      },
    });
    await tx.leadEvent.create({ data: { leadId: lead.id, toStatus: status, actorType: "CUSTOMER", note: flags.length ? flags.join(",") : null } });
    return { kind: "created" as const, leadId: lead.id, status, flags, finderId, isRepeat };
  });

  if (result.kind === "duplicate") return { kind: "duplicate", business: campaign.business.name };

  const customerName = first(input.firstName);
  await notifyEmail(email, "nl", "CUSTOMER_REQUEST_RECEIVED", { firstName: customerName, business: campaign.business.name, description: input.description.slice(0, 200) });
  if (result.status === "NEW") {
    await notifyBusiness(
      campaign.businessId,
      "BUSINESS_NEW_LEAD",
      { customer: `${input.firstName} ${input.lastName}`, city: input.city || normalizePostcode(input.postcode), description: input.description.slice(0, 200), hours: settings.responseHours },
      `/app/bedrijf/leads/${result.leadId}`,
    );
    const attributed = await db.finderProfile.findUniqueOrThrow({ where: { id: result.finderId } });
    await notifyUser(attributed.userId, "FINDER_LEAD_RECEIVED", { customer: customerName, city: input.city || input.postcode.slice(0, 4), business: campaign.business.name }, "/app/finder/klanten");
  }
  if (result.flags.length) {
    await notifyAdmins("ADMIN_FRAUD_FLAG", { flags: result.flags.join(", "), leadId: result.leadId }, `/admin/leads/${result.leadId}`);
  }
  return { kind: "created", leadId: result.leadId, business: campaign.business.name };
}

export interface BusinessTransitionInput {
  leadId: string;
  businessId: string;
  actorUserId: string;
  to: LeadStatus;
  dealAmountCents?: number | null;
  lostReason?: string | null;
  note?: string | null;
}

/** A business moves a lead through its pipeline. COMPLETED immediately confirms and invoices. */
export async function transitionLeadByBusiness(input: BusinessTransitionInput) {
  const settings = await getSettings();
  const lead = await db.lead.findUnique({ where: { id: input.leadId }, include: { campaign: true, customer: true, finder: true } });
  if (!lead || lead.campaign.businessId !== input.businessId) throw new LeadError("FORBIDDEN");
  const error = validateBusinessTransition({ from: lead.status, to: input.to, dealAmountCents: input.dealAmountCents, lostReason: input.lostReason });
  if (error) throw new LeadError(error === "NOT_ALLOWED" ? "INVALID_TRANSITION" : error);
  if (input.to === "LOST" && !LOST_REASONS.includes(input.lostReason as (typeof LOST_REASONS)[number])) throw new LeadError("LOST_REASON_REQUIRED");

  const t = now();
  const invoiceId = await db.$transaction(async (tx) => {
    const data: Prisma.LeadUpdateInput = { status: input.to };
    if (input.to === "CONTACTED" || (!lead.respondedAt && input.to !== "LOST")) data.respondedAt = lead.respondedAt ?? t;
    if (input.to === "WON") {
      data.dealAmountCents = input.dealAmountCents!;
      data.wonAt = t;
    }
    if (input.to === "LOST") data.lostReason = input.lostReason;
    await tx.lead.update({ where: { id: lead.id }, data });
    await tx.leadEvent.create({
      data: {
        leadId: lead.id,
        fromStatus: lead.status,
        toStatus: input.to,
        actorType: "BUSINESS",
        actorUserId: input.actorUserId,
        note: input.to === "WON" ? `Dealbedrag ${formatCents(input.dealAmountCents!)}${input.note ? ` — ${input.note}` : ""}` : input.to === "LOST" ? `${input.lostReason}${input.note ? ` — ${input.note}` : ""}` : (input.note ?? null),
      },
    });

    if (input.to === "WON") {
      const fresh = await tx.lead.findUniqueOrThrow({ where: { id: lead.id }, include: { campaign: true } });
      await bookFee(tx, fresh, input.dealAmountCents!, settings, { includeCustomerBonus: false });
      await checkBudget(tx, lead.campaignId);
    }
    if (input.to === "LOST" && lead.status === "WON") await reverseExpected(tx, lead, "lost");
    if (input.to === "COMPLETED") return confirmLead(tx, lead.id, { actorType: "BUSINESS", actorUserId: input.actorUserId, note: "Bedrijf heeft de klus afgerond" });
    return null;
  });

  // Notifications after commit.
  const business = await db.business.findUniqueOrThrow({ where: { id: input.businessId } });
  const customer = first(lead.customer.firstName);
  if (input.to === "QUOTE_SENT") {
    await notifyUser(lead.finder.userId, "FINDER_QUOTE_SENT", { business: business.name, customer }, "/app/finder/klanten");
  } else if (input.to === "WON") {
    const fee = await db.fee.findUnique({ where: { leadId: lead.id } });
    await notifyUser(lead.finder.userId, "FINDER_DEAL_WON", { business: business.name, customer, amount: formatCents(fee?.finderCents ?? 0) }, "/app/finder/saldo");
  } else if (input.to === "LOST") {
    await notifyUser(lead.finder.userId, "FINDER_DEAL_LOST", { business: business.name, customer, reason: lostReasonLabel(input.lostReason ?? "OTHER") }, "/app/finder/klanten");
    if (input.lostReason === "SPAM") await recomputeFinderScore(lead.finderId);
  }
  if (invoiceId) await issueInvoice(invoiceId);
}

export function lostReasonLabel(reason: string): string {
  return (
    {
      PRICE: "prijs",
      CHOSE_COMPETITOR: "koos een ander bedrijf",
      NO_RESPONSE: "klant reageerde niet",
      NOT_NEEDED: "klus gaat niet door",
      OUT_OF_AREA: "buiten werkgebied",
      SPAM: "geen serieuze aanvraag",
      OTHER: "anders",
    }[reason] ?? reason
  );
}

/**
 * Move a lead to CONFIRMED and invoice it. Returns the new invoice id (to be issued after commit).
 * Leads below the minimum job amount confirm without an invoice: they count, but cost nothing.
 */
export async function confirmLead(tx: Tx, leadId: string, actor: { actorType: "BUSINESS" | "CUSTOMER" | "ADMIN" | "SYSTEM"; actorUserId?: string; note?: string }): Promise<string | null> {
  const lead = await tx.lead.findUniqueOrThrow({ where: { id: leadId } });
  if (!["WON", "COMPLETED", "DISPUTED"].includes(lead.status)) return null;
  await tx.lead.update({ where: { id: leadId }, data: { status: "CONFIRMED" } });
  await tx.leadEvent.create({ data: { leadId, fromStatus: lead.status, toStatus: "CONFIRMED", actorType: actor.actorType, actorUserId: actor.actorUserId, note: actor.note } });
  const invoice = await createInvoiceForLead(tx, leadId);
  return invoice?.id ?? null;
}

/** Monthly budget: once fees won this month reach the budget, the campaign stops showing. */
export async function checkBudget(tx: Tx, campaignId: string) {
  const campaign = await tx.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (!campaign.monthlyBudgetCents || campaign.status !== "LIVE") return;
  const spent = await tx.fee.aggregate({
    where: { lead: { campaignId, wonAt: { gte: startOfMonth(now()) } } },
    _sum: { totalCents: true },
  });
  if ((spent._sum.totalCents ?? 0) >= campaign.monthlyBudgetCents) {
    await tx.campaign.update({ where: { id: campaignId }, data: { status: "BUDGET_REACHED" } });
    await audit({ action: "campaign.budget_reached", entity: "Campaign", entityId: campaignId, after: { spent: spent._sum.totalCents } }, tx);
    // Notification is fire-and-forget after the transaction via the daily job; keep tx short.
    queueMicrotask(() => {
      void notifyBusiness(campaign.businessId, "BUSINESS_BUDGET_REACHED", { campaign: campaign.title }, "/app/bedrijf/campagnes");
    });
  }
}

export async function monthlySpend(campaignId: string): Promise<number> {
  const spent = await db.fee.aggregate({ where: { lead: { campaignId, wonAt: { gte: startOfMonth(now()) } } }, _sum: { totalCents: true } });
  return spent._sum.totalCents ?? 0;
}

// ---------- Customer confirmation ----------

export async function ensureConfirmation(leadId: string) {
  const existing = await db.confirmation.findUnique({ where: { leadId } });
  if (existing) return existing;
  return db.confirmation.create({ data: { leadId, token: randomToken() } });
}

export async function sendConfirmationRequest(leadId: string) {
  const settings = await getSettings();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: leadId }, include: { customer: true, campaign: { include: { business: true } } } });
  const confirmation = await ensureConfirmation(leadId);
  await notifyEmail(
    lead.customer.email,
    "nl",
    "CUSTOMER_CONFIRM_JOB",
    { firstName: first(lead.customer.firstName), business: lead.campaign.business.name, bonus: formatCents(settings.customerBonusCents) },
    appUrl(`/bevestig/${confirmation.token}`),
  );
  await db.lead.update({ where: { id: leadId }, data: { confirmationSentAt: now() } });
}

export type CustomerAnswer =
  | { kind: "confirm" }
  | { kind: "correct"; amountCents: number; note?: string }
  | { kind: "not_done"; note?: string };

export async function customerRespond(token: string, answer: CustomerAnswer) {
  const settings = await getSettings();
  const confirmation = await db.confirmation.findUnique({ where: { token }, include: { lead: { include: { campaign: { include: { business: true } }, customer: true } } } });
  if (!confirmation) throw new Error("NOT_FOUND");
  if (confirmation.confirmedAt || confirmation.disagreed) return { already: true as const };
  const lead = confirmation.lead;
  const t = now();

  if (answer.kind === "not_done" && lead.status === "WON") {
    // Not done yet is not a conflict while the business hasn't claimed completion either.
    await db.leadEvent.create({ data: { leadId: lead.id, fromStatus: lead.status, toStatus: lead.status, actorType: "CUSTOMER", note: `Klant: nog niet uitgevoerd${answer.note ? ` — ${answer.note}` : ""}` } });
    await db.lead.update({ where: { id: lead.id }, data: { confirmationSentAt: null, wonAt: t } });
    return { already: false as const, outcome: "noted" as const };
  }

  if (answer.kind === "confirm" || (answer.kind === "correct" && answer.amountCents === lead.dealAmountCents)) {
    const invoiceId = await db.$transaction(async (tx) => {
      const bonus = await bookFee(tx, { ...lead, campaign: lead.campaign }, lead.dealAmountCents ?? 0, settings, { includeCustomerBonus: true });
      await tx.confirmation.update({ where: { id: confirmation.id }, data: { confirmedAt: t, confirmedAmountCents: lead.dealAmountCents, bonusCents: bonus.customerBonusCents } });
      if (lead.status === "WON" || lead.status === "COMPLETED") {
        return confirmLead(tx, lead.id, { actorType: "CUSTOMER", note: "Klant heeft de klus bevestigd" });
      }
      await tx.leadEvent.create({ data: { leadId: lead.id, fromStatus: lead.status, toStatus: lead.status, actorType: "CUSTOMER", note: "Klant heeft de klus bevestigd" } });
      return null;
    });
    if (invoiceId) await issueInvoice(invoiceId);
    return { already: false as const, outcome: "confirmed" as const, bonusCents: (await db.confirmation.findUniqueOrThrow({ where: { id: confirmation.id } })).bonusCents };
  }

  // Conflict between customer and business → dispute, admin decides.
  const reason =
    answer.kind === "correct"
      ? `Klant noemt eindbedrag ${formatCents(answer.amountCents)}, bedrijf ${formatCents(lead.dealAmountCents ?? 0)}.${answer.note ? ` ${answer.note}` : ""}`
      : `Klant zegt dat de klus niet is uitgevoerd.${answer.note ? ` ${answer.note}` : ""}`;
  await db.$transaction(async (tx) => {
    await tx.confirmation.update({ where: { id: confirmation.id }, data: { disagreed: true, confirmedAmountCents: answer.kind === "correct" ? answer.amountCents : null } });
    await tx.dispute.create({ data: { leadId: lead.id, openedBy: "CUSTOMER", reason } });
    if (["WON", "COMPLETED", "CONFIRMED"].includes(lead.status)) {
      await tx.lead.update({ where: { id: lead.id }, data: { status: "DISPUTED" } });
    }
    await tx.leadEvent.create({ data: { leadId: lead.id, fromStatus: lead.status, toStatus: ["WON", "COMPLETED", "CONFIRMED"].includes(lead.status) ? "DISPUTED" : lead.status, actorType: "CUSTOMER", note: reason } });
  });
  await notifyAdmins("ADMIN_DISPUTE", { business: lead.campaign.business.name, reason }, `/admin/geschillen`);
  await notifyBusiness(lead.campaign.businessId, "BUSINESS_DISPUTE", { customer: `${lead.customer.firstName} ${lead.customer.lastName}`, reason }, `/app/bedrijf/leads/${lead.id}`);
  return { already: false as const, outcome: "disputed" as const };
}

// ---------- Admin ----------

/** Admin correction of a lead status, with a mandatory reason, fully audited. */
export async function adminSetLeadStatus(input: { leadId: string; to: LeadStatus; reason: string; actorUserId: string; dealAmountCents?: number | null }) {
  if (!input.reason.trim()) throw new Error("REASON_REQUIRED");
  const settings = await getSettings();
  const lead = await db.lead.findUniqueOrThrow({ where: { id: input.leadId }, include: { campaign: true } });
  if (["INVOICED", "PAID", "PAID_OUT"].includes(input.to)) throw new Error("USE_INVOICE_FLOW");
  const invoiceId = await db.$transaction(async (tx) => {
    const data: Prisma.LeadUpdateInput = { status: input.to };
    const amount = input.dealAmountCents ?? lead.dealAmountCents;
    if (input.dealAmountCents != null) data.dealAmountCents = input.dealAmountCents;
    if (input.to === "WON" && !lead.wonAt) data.wonAt = now();
    if (input.to === "LOST") data.lostReason = "OTHER";
    await tx.lead.update({ where: { id: lead.id }, data });
    await tx.leadEvent.create({ data: { leadId: lead.id, fromStatus: lead.status, toStatus: input.to, actorType: "ADMIN", actorUserId: input.actorUserId, note: input.reason } });
    await audit({ actorUserId: input.actorUserId, action: "lead.status.admin", entity: "Lead", entityId: lead.id, before: { status: lead.status, dealAmountCents: lead.dealAmountCents }, after: { status: input.to, dealAmountCents: amount, reason: input.reason } }, tx);

    if (["WON", "COMPLETED", "CONFIRMED"].includes(input.to) && amount) {
      const fresh = await tx.lead.findUniqueOrThrow({ where: { id: lead.id }, include: { campaign: true } });
      const conf = await tx.confirmation.findUnique({ where: { leadId: lead.id } });
      await bookFee(tx, fresh, amount, settings, { includeCustomerBonus: Boolean(conf?.confirmedAt) });
    }
    if (["LOST", "FRAUD", "DUPLICATE", "NEW", "CONTACTED", "QUOTE_SENT"].includes(input.to)) await reverseExpected(tx, lead, `admin:${input.to}`);
    if (input.to === "CONFIRMED") {
      await tx.lead.update({ where: { id: lead.id }, data: { status: "COMPLETED" } });
      return confirmLead(tx, lead.id, { actorType: "ADMIN", actorUserId: input.actorUserId, note: input.reason });
    }
    return null;
  });
  if (invoiceId) await issueInvoice(invoiceId);
}
