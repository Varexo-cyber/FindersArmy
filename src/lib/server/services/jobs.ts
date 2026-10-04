import "server-only";
import { db } from "../db";
import { getSettings } from "../settings";
import { addDays, addHours, addMonths, now } from "../clock";
import { notifyBusiness } from "../notify";
import { formatCents } from "../../money";
import { sendConfirmationRequest, monthlySpend } from "./leads";
import { ensurePaymentLink, suspendBusinessForNonPayment } from "./invoices";
import { recomputeBusinessScore, recomputeFinderScore } from "./scores";

/** Business has not responded within the window: remind once. */
export async function responseReminders() {
  const s = await getSettings();
  const leads = await db.lead.findMany({
    where: { status: "NEW", reminderSentAt: null, createdAt: { lt: addHours(now(), -s.responseHours) } },
    include: { customer: true, campaign: true },
    take: 500,
  });
  for (const l of leads) {
    await notifyBusiness(l.campaign.businessId, "BUSINESS_RESPONSE_REMINDER", { customer: `${l.customer.firstName} ${l.customer.lastName}` }, `/app/bedrijf/leads/${l.id}`);
    await db.lead.update({ where: { id: l.id }, data: { reminderSentAt: now() } });
  }
  return leads.length;
}

/** X days after WON, ask the customer to confirm the job. */
export async function confirmationRequests() {
  const s = await getSettings();
  const leads = await db.lead.findMany({
    where: {
      status: { in: ["WON", "COMPLETED", "CONFIRMED", "INVOICED", "PAID", "PAID_OUT"] },
      wonAt: { lt: addDays(now(), -s.confirmationDelayDays) },
      confirmationSentAt: null,
      OR: [{ confirmation: null }, { confirmation: { confirmedAt: null, disagreed: false } }],
    },
    take: 500,
  });
  for (const l of leads) await sendConfirmationRequest(l.id);
  return leads.length;
}

/** Reminders on day 7, 14, 21; after 21 days the invoice is overdue and the business suspended. */
export async function invoiceDunning() {
  const s = await getSettings();
  const t = now();
  const open = await db.invoice.findMany({ where: { status: { in: ["OPEN", "OVERDUE"] } }, include: { leads: true } });
  let actions = 0;
  for (const inv of open) {
    const age = Math.floor((t.getTime() - inv.issuedAt.getTime()) / 86_400_000);
    const due = s.invoiceReminderDays.filter((d) => age >= d).length;
    if (due > inv.remindersSent) {
      await notifyBusiness(inv.businessId, "BUSINESS_INVOICE_REMINDER", { number: inv.number, amount: formatCents(inv.totalCents), days: age, suspendDays: s.suspendAfterDays }, inv.paymentUrl ?? "/app/bedrijf/facturen");
      await db.invoice.update({ where: { id: inv.id }, data: { remindersSent: due, lastReminderAt: t } });
      actions++;
    }
    if (age >= s.suspendAfterDays && inv.status === "OPEN") {
      await db.invoice.update({ where: { id: inv.id }, data: { status: "OVERDUE" } });
      await suspendBusinessForNonPayment(inv.businessId, inv.number);
      actions++;
    }
  }
  return actions;
}

/** New month: campaigns paused for budget come back if they are under budget again. */
export async function budgetReset() {
  const capped = await db.campaign.findMany({ where: { status: "BUDGET_REACHED" } });
  let n = 0;
  for (const c of capped) {
    if (!c.monthlyBudgetCents || (await monthlySpend(c.id)) < c.monthlyBudgetCents) {
      await db.campaign.update({ where: { id: c.id }, data: { status: "LIVE" } });
      n++;
    }
  }
  return n;
}

export async function retryPaymentLinks() {
  const missing = await db.invoice.findMany({ where: { status: { in: ["OPEN", "OVERDUE"] }, paymentUrl: null }, take: 100 });
  for (const inv of missing) {
    try {
      await ensurePaymentLink(inv.id);
    } catch (e) {
      console.error(JSON.stringify({ event: "payment_link_retry_failed", invoiceId: inv.id, error: String(e) }));
    }
  }
  return missing.length;
}

export async function recomputeScores() {
  const businesses = await db.business.findMany({ where: { status: { in: ["ACTIVE", "UNDER_REVIEW"] } }, select: { id: true } });
  for (const b of businesses) await recomputeBusinessScore(b.id);
  const finders = await db.finderProfile.findMany({ where: { status: { not: "SUSPENDED" }, leads: { some: {} } }, select: { id: true } });
  for (const f of finders) await recomputeFinderScore(f.id);
  return businesses.length + finders.length;
}

/** AVG: customers whose every lead ended without a deal more than N months ago are anonymised. */
export async function anonymizeOldLeads() {
  const s = await getSettings();
  const cutoff = addMonths(now(), -s.anonymizeAfterMonths);
  const customers = await db.customer.findMany({
    where: { anonymizedAt: null, leads: { every: { status: { in: ["LOST", "DUPLICATE", "FRAUD"] }, updatedAt: { lt: cutoff } } } },
    select: { id: true },
    take: 1000,
  });
  for (const c of customers) {
    await db.$transaction([
      db.customer.update({ where: { id: c.id }, data: { firstName: "Geanonimiseerd", lastName: "", email: `anon-${c.id}@deleted.invalid`, phone: "", postcode: "", houseNumber: "", city: null, anonymizedAt: now() } }),
      db.lead.updateMany({ where: { customerId: c.id }, data: { description: "[geanonimiseerd]", ipHash: null } }),
      db.leadPhoto.deleteMany({ where: { lead: { customerId: c.id } } }),
    ]);
  }
  await db.click.deleteMany({ where: { createdAt: { lt: addMonths(now(), -13) } } });
  await db.devMail.deleteMany({ where: { createdAt: { lt: addDays(now(), -30) } } });
  return customers.length;
}

export async function runDailyJobs() {
  const results: Record<string, number | string> = {};
  for (const [name, fn] of Object.entries({ responseReminders, confirmationRequests, invoiceDunning, budgetReset, retryPaymentLinks, recomputeScores, anonymizeOldLeads })) {
    try {
      results[name] = await fn();
    } catch (e) {
      // One failing job must not stop the others; the failure is logged and reported.
      results[name] = `error: ${String(e)}`;
      console.error(JSON.stringify({ event: "cron_job_failed", job: name, error: String(e) }));
    }
  }
  return results;
}
