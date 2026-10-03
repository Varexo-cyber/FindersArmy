import "server-only";
import type { Prisma } from "@prisma/client";
import { db, type Tx } from "../db";
import { getSettings } from "../settings";
import { calculateVat, vatRateFor } from "../../vat";
import { formatInvoiceNumber } from "../../invoice-number";
import { formatCents } from "../../money";
import { releaseOnPayment } from "../../ledger";
import { rankFor } from "../../ranks";
import { payments } from "../payments";
import { invoicePdf } from "../pdf";
import { appUrl } from "../../env";
import { addDays, now } from "../clock";
import { notifyBusiness, notifyUser } from "../notify";
import { audit } from "../audit";
import { expectedForLead } from "./fees";

async function nextInvoiceNumber(tx: Tx, year: number): Promise<string> {
  // Upsert + increment is a single row-locked statement, so concurrent invoices never share a number.
  const seq = await tx.invoiceSequence.upsert({
    where: { year },
    create: { year, last: 1 },
    update: { last: { increment: 1 } },
  });
  return formatInvoiceNumber(year, seq.last);
}

/**
 * Create the invoice for a confirmed lead. Called inside the confirmation transaction; the
 * payment link and email happen afterwards (they talk to external services).
 */
export async function createInvoiceForLead(tx: Tx, leadId: string) {
  const lead = await tx.lead.findUniqueOrThrow({
    where: { id: leadId },
    include: { fee: true, campaign: { include: { business: true } } },
  });
  if (!lead.fee || lead.fee.totalCents <= 0) return null;
  if (lead.invoiceId) return tx.invoice.findUniqueOrThrow({ where: { id: lead.invoiceId } });
  const settings = await getSettings();
  const business = lead.campaign.business;
  const vatRateBps = vatRateFor(business.country, settings.countries);
  const amounts = calculateVat(lead.fee.totalCents, vatRateBps);
  const issuedAt = now();
  const number = await nextInvoiceNumber(tx, issuedAt.getUTCFullYear());
  const invoice = await tx.invoice.create({
    data: {
      number,
      businessId: business.id,
      ...amounts,
      issuedAt,
      dueAt: addDays(issuedAt, settings.invoiceDueDays),
      leads: { connect: { id: lead.id } },
    },
  });
  await tx.invoice.update({ where: { id: invoice.id }, data: { pdfUrl: `/api/invoices/${invoice.id}/pdf` } });
  await tx.lead.update({ where: { id: lead.id }, data: { status: "INVOICED" } });
  await tx.leadEvent.create({ data: { leadId: lead.id, fromStatus: "CONFIRMED", toStatus: "INVOICED", actorType: "SYSTEM", note: number } });
  return invoice;
}

export async function ensurePaymentLink(invoiceId: string) {
  const invoice = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.status === "PAID" || invoice.paymentUrl) return invoice;
  const payment = await payments().createPayment({
    amountCents: invoice.totalCents,
    description: `FindersArmy factuur ${invoice.number}`,
    invoiceId: invoice.id,
    redirectUrl: appUrl(`/app/bedrijf/facturen?betaald=${invoice.number}`),
    webhookUrl: appUrl("/api/webhooks/mollie"),
  });
  return db.invoice.update({ where: { id: invoice.id }, data: { molliePaymentId: payment.id, paymentUrl: payment.checkoutUrl } });
}

export async function renderInvoicePdf(invoiceId: string): Promise<Uint8Array> {
  const invoice = await db.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { business: true, leads: { include: { customer: true, campaign: true } } },
  });
  const settings = await getSettings();
  return invoicePdf({
    number: invoice.number,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    company: settings.company,
    business: invoice.business,
    lines: invoice.leads.map((l) => ({
      description: `Finder's fee: ${l.customer.firstName} ${l.customer.lastName.slice(0, 1)}. — ${l.campaign.title} (deal ${formatCents(l.dealAmountCents ?? 0)} excl. btw)`,
      amountCents: invoice.subtotalCents / Math.max(1, invoice.leads.length),
    })),
    subtotalCents: invoice.subtotalCents,
    vatRateBps: invoice.vatRateBps,
    vatCents: invoice.vatCents,
    totalCents: invoice.totalCents,
    paymentUrl: invoice.paymentUrl,
    status: invoice.status,
  });
}

/** After the invoice exists: create the payment link, render the PDF and email the business. */
export async function issueInvoice(invoiceId: string) {
  let invoice = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { leads: { include: { customer: true } } } });
  try {
    invoice = { ...invoice, ...(await ensurePaymentLink(invoiceId)) };
  } catch (error) {
    // The invoice stands without a link; the business can pay by transfer and the daily job retries.
    console.error(JSON.stringify({ event: "payment_link_failed", invoiceId, error: String(error) }));
  }
  const pdf = await renderInvoicePdf(invoiceId);
  const customer = invoice.leads[0]?.customer;
  await notifyBusiness(
    invoice.businessId,
    "BUSINESS_INVOICE",
    {
      number: invoice.number,
      amount: formatCents(invoice.totalCents),
      customer: customer ? `${customer.firstName} ${customer.lastName.slice(0, 1)}.` : "",
      dueDate: invoice.dueAt.toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam" }),
    },
    invoice.paymentUrl ?? "/app/bedrijf/facturen",
    [{ filename: `${invoice.number}.pdf`, content: Buffer.from(pdf) }],
  );
}

/**
 * Mark an invoice paid (webhook or admin). Idempotent: a second call is a no-op.
 * Moves the Finder's share from expected to available and runs rank and bonus logic.
 */
export async function markInvoicePaid(invoiceId: string, actor: { userId?: string; source: "webhook" | "admin" }) {
  const settings = await getSettings();
  const result = await db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { leads: { include: { campaign: { include: { business: true } }, customer: true } } },
    });
    if (invoice.status === "PAID") return null;
    const paidAt = now();
    await tx.invoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt } });
    await audit({ actorUserId: actor.userId, action: `invoice.paid.${actor.source}`, entity: "Invoice", entityId: invoice.id, before: { status: invoice.status }, after: { status: "PAID" } }, tx);

    const finderEvents: { finderId: string; userId: string; amount: number; business: string; rankUp?: { rank: string; deals: number; shareBps: number }; bonuses: { userId: string; amount: number; reason: string }[] }[] = [];

    for (const lead of invoice.leads) {
      if (lead.status !== "INVOICED") continue;
      await tx.lead.update({ where: { id: lead.id }, data: { status: "PAID" } });
      await tx.leadEvent.create({ data: { leadId: lead.id, fromStatus: "INVOICED", toStatus: "PAID", actorType: actor.source === "admin" ? "ADMIN" : "SYSTEM", actorUserId: actor.userId, note: invoice.number } });
      const expected = await expectedForLead(tx, lead.id);
      for (const line of releaseOnPayment(expected)) {
        await tx.ledgerEntry.create({ data: { finderId: lead.finderId, leadId: lead.id, type: line.type, amountCents: line.amountCents, note: invoice.number } });
      }
      const finder = await tx.finderProfile.findUniqueOrThrow({ where: { id: lead.finderId } });
      const before = rankFor(finder.paidDeals, settings.ranks);
      const paidDeals = finder.paidDeals + 1;
      const after = rankFor(paidDeals, settings.ranks);
      const bonuses: { userId: string; amount: number; reason: string }[] = [];

      const updates: Prisma.FinderProfileUpdateInput = { paidDeals };
      if (!finder.firstDealBonusPaid && settings.firstDealBonusCents > 0) {
        await tx.ledgerEntry.create({ data: { finderId: finder.id, leadId: lead.id, type: "BONUS", amountCents: settings.firstDealBonusCents, note: "first-deal" } });
        updates.firstDealBonusPaid = true;
        bonuses.push({ userId: finder.userId, amount: settings.firstDealBonusCents, reason: "first-deal" });
      }
      // Invite bonus: strictly one level. The inviter earns once, when this Finder's first deal is paid.
      if (finder.referredByFinderId && !finder.inviteBonusPaid && settings.inviteBonusCents > 0) {
        const inviter = await tx.finderProfile.findUnique({ where: { id: finder.referredByFinderId } });
        if (inviter && inviter.status !== "SUSPENDED") {
          await tx.ledgerEntry.create({ data: { finderId: inviter.id, type: "BONUS", amountCents: settings.inviteBonusCents, note: `invite:${finder.id}` } });
          bonuses.push({ userId: inviter.userId, amount: settings.inviteBonusCents, reason: "invite" });
        }
        updates.inviteBonusPaid = true;
      }
      await tx.finderProfile.update({ where: { id: finder.id }, data: updates });
      finderEvents.push({
        finderId: finder.id,
        userId: finder.userId,
        amount: expected,
        business: lead.campaign.business.name,
        rankUp: after.key !== before.key ? { rank: after.key, deals: paidDeals, shareBps: after.shareBps } : undefined,
        bonuses,
      });
    }
    return { invoice, finderEvents };
  });
  if (!result) return;

  for (const e of result.finderEvents) {
    await notifyUser(e.userId, "FINDER_MONEY_AVAILABLE", { amount: formatCents(e.amount), business: e.business, minimum: formatCents(settings.payoutMinimumCents) }, "/app/finder/saldo");
    if (e.rankUp) {
      await notifyUser(e.userId, "FINDER_RANK_UP", { rank: rankLabel(e.rankUp.rank), deals: e.rankUp.deals, share: `${(e.rankUp.shareBps / 100).toLocaleString("nl-NL")}%` }, "/app/finder/rang");
    }
    for (const b of e.bonuses) {
      await notifyUser(b.userId, "FINDER_BONUS", { amount: formatCents(b.amount), reason: b.reason === "invite" ? "Een vriend die jij uitnodigde heeft zijn eerste betaalde deal binnengehaald." : "Je eerste betaalde deal. Welkom bij de troep." }, "/app/finder/saldo");
    }
  }
  await maybeReinstateBusiness(result.invoice.businessId);
}

export function rankLabel(key: string): string {
  return { RECRUIT: "Rekruut", SOLDIER: "Soldaat", SERGEANT: "Sergeant", LIEUTENANT: "Luitenant", COMMANDER: "Commandant" }[key] ?? key;
}

export const UNPAID_REASON = "UNPAID_INVOICE";

export async function suspendBusinessForNonPayment(businessId: string, invoiceNumber: string) {
  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  if (business.status === "SUSPENDED") return;
  await db.$transaction(async (tx) => {
    await tx.business.update({ where: { id: businessId }, data: { status: "SUSPENDED", suspendedReason: UNPAID_REASON } });
    await tx.campaign.updateMany({ where: { businessId, status: { in: ["LIVE", "BUDGET_REACHED"] } }, data: { status: "SUSPENDED" } });
    await audit({ action: "business.suspended.unpaid", entity: "Business", entityId: businessId, before: { status: business.status }, after: { status: "SUSPENDED", invoice: invoiceNumber } }, tx);
  });
  await notifyBusiness(businessId, "BUSINESS_SUSPENDED", { reason: `Factuur ${invoiceNumber} is na 21 dagen nog niet betaald.` }, "/app/bedrijf/facturen");
}

export async function maybeReinstateBusiness(businessId: string) {
  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  if (business.status !== "SUSPENDED" || business.suspendedReason !== UNPAID_REASON) return;
  const stillOverdue = await db.invoice.count({ where: { businessId, status: "OVERDUE" } });
  if (stillOverdue > 0) return;
  await db.$transaction(async (tx) => {
    await tx.business.update({ where: { id: businessId }, data: { status: "ACTIVE", suspendedReason: null } });
    await tx.campaign.updateMany({ where: { businessId, status: "SUSPENDED" }, data: { status: "LIVE" } });
    await audit({ action: "business.reinstated", entity: "Business", entityId: businessId, before: { status: "SUSPENDED" }, after: { status: "ACTIVE" } }, tx);
  });
  await notifyBusiness(businessId, "BUSINESS_REINSTATED", {}, "/app/bedrijf");
}
