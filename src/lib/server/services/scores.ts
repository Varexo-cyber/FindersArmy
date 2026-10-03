import "server-only";
import { db } from "../db";
import { getSettings } from "../settings";
import { businessScore, finderScore, finderStanding } from "../../scores";
import { addDays, addHours, now } from "../clock";
import { notifyUser, notifyAdmins } from "../notify";
import { audit } from "../audit";

export async function recomputeFinderScore(finderId: string) {
  const settings = await getSettings();
  const finder = await db.finderProfile.findUniqueOrThrow({ where: { id: finderId } });
  const verdicts = await db.lead.findMany({
    where: { finderId, status: { notIn: ["NEW", "CONTACTED", "QUOTE_SENT", "DUPLICATE"] }, createdAt: { gte: addDays(now(), -180) } },
    select: { status: true, lostReason: true },
  });
  const score = finderScore({ spamFlags: verdicts.map((v) => v.status === "FRAUD" || (v.status === "LOST" && v.lostReason === "SPAM")) });
  const standing = finderStanding(score, settings.finderWarnScore, settings.finderSuspendScore);
  // Score never auto-lifts a suspension: reinstating a Finder is a human decision.
  const status = finder.status === "SUSPENDED" ? "SUSPENDED" : standing;
  await db.finderProfile.update({ where: { id: finderId }, data: { score, status } });
  if (status !== finder.status) {
    await audit({ action: `finder.${status.toLowerCase()}`, entity: "FinderProfile", entityId: finderId, before: { status: finder.status, score: finder.score }, after: { status, score } });
    if (status === "WARNED") await notifyUser(finder.userId, "FINDER_WARNING", { badPct: `${100 - score}%` });
  }
  return score;
}

export async function recomputeBusinessScore(businessId: string) {
  const settings = await getSettings();
  const t = now();
  const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
  const leads = await db.lead.findMany({
    where: { campaign: { businessId }, status: { notIn: ["DUPLICATE", "FRAUD"] }, createdAt: { gte: addDays(t, -180) } },
    select: { createdAt: true, respondedAt: true, status: true },
  });
  const respondedInTime = leads
    .filter((l) => l.createdAt < addHours(t, -settings.responseHours))
    .map((l) => Boolean(l.respondedAt && l.respondedAt.getTime() - l.createdAt.getTime() <= settings.responseHours * 3_600_000));
  const updated = leads.filter((l) => l.createdAt < addDays(t, -14)).map((l) => l.status !== "NEW");
  const invoices = await db.invoice.findMany({ where: { businessId, OR: [{ status: "PAID" }, { dueAt: { lt: t } }] }, select: { paidAt: true, dueAt: true } });
  const paidOnTime = invoices.map((i) => Boolean(i.paidAt && i.paidAt <= i.dueAt));
  const score = businessScore({ respondedInTime, updated, paidOnTime });
  await db.business.update({ where: { id: businessId }, data: { score } });
  if (score < settings.businessReviewScore && business.status === "ACTIVE") {
    await db.business.update({ where: { id: businessId }, data: { status: "UNDER_REVIEW", suspendedReason: "LOW_SCORE" } });
    await audit({ action: "business.under_review.low_score", entity: "Business", entityId: businessId, before: { score: business.score }, after: { score } });
    await notifyAdmins("ADMIN_NEW_BUSINESS", { business: `${business.name} (score ${score}, automatisch naar review)`, category: "" }, `/admin/bedrijven/${businessId}`);
  }
  return score;
}
