import "server-only";
import { db } from "../db";
import { getSettings } from "../settings";
import { canRequestPayout } from "../../ledger";
import { formatCents } from "../../money";
import { isValidIban, maskIban, normalizeIban } from "../../iban";
import { finderBalances } from "./balances";
import { notifyAdmins, notifyUser } from "../notify";
import { audit } from "../audit";
import { addDays, now } from "../clock";
import { SepaFilePayoutProvider } from "../payouts/sepa-file";
import type { PayoutProvider } from "../payouts/provider";
import { payoutSpecificationPdf } from "../pdf";

export class PayoutError extends Error {
  constructor(public code: "NO_IBAN" | "BELOW_MINIMUM" | "INSUFFICIENT" | "INVALID" | "SUSPENDED" | "OPEN_REQUEST") {
    super(code);
  }
}

const provider: PayoutProvider = new SepaFilePayoutProvider();

export async function requestPayout(finderId: string, amountCents: number) {
  const settings = await getSettings();
  const payout = await db.$transaction(
    async (tx) => {
      const finder = await tx.finderProfile.findUniqueOrThrow({ where: { id: finderId }, include: { user: true } });
      if (finder.status === "SUSPENDED") throw new PayoutError("SUSPENDED");
      if (!finder.iban || !finder.ibanHolder || !isValidIban(finder.iban)) throw new PayoutError("NO_IBAN");
      // Serialise payout requests per Finder: lock the profile row before reading the balance.
      await tx.$executeRaw`SELECT id FROM "FinderProfile" WHERE id = ${finderId} FOR UPDATE`;
      const balances = await finderBalances(finderId);
      const check = canRequestPayout(balances.availableCents, amountCents, settings.payoutMinimumCents);
      if (!check.ok) throw new PayoutError(check.reason);
      const p = await tx.payout.create({ data: { finderId, amountCents, iban: normalizeIban(finder.iban), ibanHolder: finder.ibanHolder } });
      await tx.ledgerEntry.create({ data: { finderId, payoutId: p.id, type: "PAYOUT", amountCents: -amountCents, note: "payout requested" } });
      return { ...p, finderName: finder.user.name ?? finder.ibanHolder };
    },
  );
  await notifyAdmins("ADMIN_PAYOUT_REQUEST", { amount: formatCents(amountCents), finder: payout.finderName }, "/admin/uitbetalingen");
  return payout;
}

export async function approvePayouts(ids: string[], actorUserId: string) {
  const res = await db.payout.updateMany({ where: { id: { in: ids }, status: "REQUESTED" }, data: { status: "APPROVED", approvedAt: now() } });
  for (const id of ids) await audit({ actorUserId, action: "payout.approved", entity: "Payout", entityId: id });
  return res.count;
}

export async function rejectPayout(id: string, reason: string, actorUserId: string) {
  if (!reason.trim()) throw new Error("REASON_REQUIRED");
  await db.$transaction(async (tx) => {
    const p = await tx.payout.findUniqueOrThrow({ where: { id } });
    if (!["REQUESTED", "APPROVED"].includes(p.status)) throw new Error("NOT_REJECTABLE");
    await tx.payout.update({ where: { id }, data: { status: "REJECTED", rejectReason: reason } });
    await tx.ledgerEntry.create({ data: { finderId: p.finderId, payoutId: p.id, type: "PAYOUT", amountCents: p.amountCents, note: `rejected: ${reason}` } });
    await audit({ actorUserId, action: "payout.rejected", entity: "Payout", entityId: id, after: { reason } }, tx);
  });
}

/** Bundle all approved payouts into one SEPA batch. */
export async function createPayoutBatch(actorUserId: string) {
  const approved = await db.payout.findMany({ where: { status: "APPROVED", batchId: null }, include: { finder: { include: { user: true } } }, orderBy: { requestedAt: "asc" } });
  if (approved.length === 0) throw new Error("NOTHING_TO_BATCH");
  const t = now();
  const count = await db.payoutBatch.count({ where: { createdAt: { gte: new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())) } } });
  const reference = `FA-PAYOUT-${t.toISOString().slice(0, 10).replace(/-/g, "")}-${String(count + 1).padStart(2, "0")}`;
  const total = approved.reduce((acc, p) => acc + p.amountCents, 0);
  const file = await provider.prepareBatch({
    reference,
    executionDate: addDays(t, 1),
    instructions: approved.map((p) => ({
      payoutId: p.id,
      amountCents: p.amountCents,
      iban: p.iban,
      holder: p.ibanHolder,
      reference: `FindersArmy uitbetaling ${reference}`,
    })),
  });
  const batch = await db.$transaction(async (tx) => {
    const b = await tx.payoutBatch.create({ data: { reference, createdBy: actorUserId, sepaXml: file.artifact, totalCents: total } });
    await tx.payoutBatch.update({ where: { id: b.id }, data: { sepaXmlUrl: `/api/admin/batches/${b.id}/xml` } });
    await tx.payout.updateMany({ where: { id: { in: approved.map((p) => p.id) } }, data: { status: "BATCHED", batchId: b.id } });
    await audit({ actorUserId, action: "payout_batch.created", entity: "PayoutBatch", entityId: b.id, after: { reference, total, count: approved.length } }, tx);
    return b;
  });
  return batch;
}

/** The admin confirms the bank executed the batch: payouts are paid, leads become PAID_OUT. */
export async function markBatchPaid(batchId: string, actorUserId: string) {
  const t = now();
  const payouts = await db.$transaction(async (tx) => {
    const batch = await tx.payoutBatch.findUniqueOrThrow({ where: { id: batchId }, include: { payouts: true } });
    if (batch.status === "PAID") return [];
    await tx.payoutBatch.update({ where: { id: batchId }, data: { status: "PAID", paidAt: t } });
    await tx.payout.updateMany({ where: { batchId, status: "BATCHED" }, data: { status: "PAID", paidAt: t } });
    for (const p of batch.payouts) await markLeadsPaidOut(tx, p.finderId);
    await audit({ actorUserId, action: "payout_batch.paid", entity: "PayoutBatch", entityId: batchId }, tx);
    return batch.payouts;
  });
  for (const p of payouts) {
    const finder = await db.finderProfile.findUniqueOrThrow({ where: { id: p.finderId } });
    await notifyUser(finder.userId, "FINDER_PAYOUT_PAID", { amount: formatCents(p.amountCents), iban: maskIban(p.iban) }, `/api/payouts/${p.id}/pdf`);
  }
}

/**
 * Leads are PAID_OUT once the Finder's cumulative paid payouts cover them, oldest first.
 * Payouts are amounts, not per lead, so this is a FIFO allocation over PAID leads.
 */
async function markLeadsPaidOut(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0], finderId: string) {
  const paidOut = await tx.payout.aggregate({ where: { finderId, status: "PAID" }, _sum: { amountCents: true } });
  let budget = paidOut._sum.amountCents ?? 0;
  const alreadyOut = await tx.ledgerEntry.aggregate({ where: { finderId, type: "AVAILABLE", lead: { status: "PAID_OUT" } }, _sum: { amountCents: true } });
  budget -= alreadyOut._sum.amountCents ?? 0;
  const candidates = await tx.lead.findMany({ where: { finderId, status: "PAID" }, orderBy: { updatedAt: "asc" }, include: { ledger: { where: { type: "AVAILABLE" } } } });
  for (const lead of candidates) {
    const share = lead.ledger.reduce((acc, l) => acc + l.amountCents, 0);
    if (share > budget) break;
    budget -= share;
    await tx.lead.update({ where: { id: lead.id }, data: { status: "PAID_OUT" } });
    await tx.leadEvent.create({ data: { leadId: lead.id, fromStatus: "PAID", toStatus: "PAID_OUT", actorType: "SYSTEM" } });
  }
}

export async function renderPayoutPdf(payoutId: string) {
  const settings = await getSettings();
  const payout = await db.payout.findUniqueOrThrow({ where: { id: payoutId }, include: { finder: { include: { user: true } }, batch: true } });
  const earnings = await db.ledgerEntry.findMany({
    where: { finderId: payout.finderId, type: { in: ["AVAILABLE", "BONUS", "ADJUSTMENT"] }, createdAt: { lte: payout.requestedAt } },
    include: { lead: { include: { campaign: { include: { business: true } }, customer: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const statusNl = { REQUESTED: "Aangevraagd", APPROVED: "Goedgekeurd", BATCHED: "In verwerking", PAID: "Uitbetaald", REJECTED: "Afgewezen" }[payout.status];
  return payoutSpecificationPdf({
    reference: payout.batch?.reference ?? `FA-UITBETALING-${payout.id.slice(-8).toUpperCase()}`,
    finderName: payout.ibanHolder,
    ibanMasked: maskIban(payout.iban),
    requestedAt: payout.requestedAt,
    paidAt: payout.paidAt,
    amountCents: payout.amountCents,
    status: statusNl,
    company: settings.company,
    lines: earnings.map((e) => ({
      date: e.createdAt,
      description: e.lead ? `${e.lead.campaign.business.name} — ${e.lead.customer.firstName}` : e.type === "BONUS" ? `Bonus (${e.note?.startsWith("invite") ? "vriend uitgenodigd" : "eerste deal"})` : (e.note ?? e.type),
      amountCents: e.amountCents,
    })),
  });
}
