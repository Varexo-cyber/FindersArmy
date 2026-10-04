import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Inbox } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { LeadStatusBadge } from "@/components/app/status-badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { buttonVariants } from "@/components/ui/button";
import { requireBusiness } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { now, startOfMonth, addHours } from "@/lib/server/clock";
import { getSettings } from "@/lib/server/settings";
import { UNPAID_REASON } from "@/lib/server/services/invoices";

export default async function BusinessOverview({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ welkom?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const t = await getTranslations("businessApp");
  const ts = await getTranslations("signupBusiness");
  const format = await getFormatter();
  const settings = await getSettings();
  const { welkom } = await searchParams;
  const where = { campaign: { businessId: business.id } };
  const [newCount, openCount, wonThisMonth, openInvoices, waiting, overdueInvoice] = await Promise.all([
    db.lead.count({ where: { ...where, status: "NEW" } }),
    db.lead.count({ where: { ...where, status: { in: ["CONTACTED", "QUOTE_SENT", "WON"] } } }),
    db.lead.aggregate({ where: { ...where, wonAt: { gte: startOfMonth(now()) } }, _count: true, _sum: { dealAmountCents: true } }),
    db.invoice.aggregate({ where: { businessId: business.id, status: { in: ["OPEN", "OVERDUE"] } }, _sum: { totalCents: true } }),
    db.lead.findMany({ where: { ...where, status: { in: ["NEW", "WON"] } }, include: { customer: true, campaign: true }, orderBy: { createdAt: "asc" }, take: 10 }),
    db.invoice.findFirst({ where: { businessId: business.id, status: "OVERDUE" }, orderBy: { dueAt: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title={t("overviewTitle")} sub={business.name} />
      <div className="mb-8 flex flex-col gap-3">
        {welkom ? <Alert tone="success" title={ts("pendingTitle")}>{ts("pendingBody")}</Alert> : null}
        {business.status === "PENDING_REVIEW" && !welkom ? <Alert>{t("pending")}</Alert> : null}
        {business.status === "UNDER_REVIEW" ? <Alert tone="warning">{t("underReview")}</Alert> : null}
        {business.status === "REJECTED" ? <Alert tone="warning">{t("rejected")}</Alert> : null}
        {business.status === "SUSPENDED" ? (
          <Alert tone="warning" title={business.suspendedReason === UNPAID_REASON ? t("suspendedUnpaid") : t("suspended", { reason: business.suspendedReason ?? "" })}>
            {overdueInvoice?.paymentUrl ? (
              <a href={overdueInvoice.paymentUrl} className={buttonVariants({ variant: "primary", size: "sm", className: "mt-2" })}>{t("payNow")} · {overdueInvoice.number}</a>
            ) : null}
          </Alert>
        ) : null}
      </div>

      <div className="mb-10 grid grid-cols-2 overflow-hidden rounded-md border border-border md:grid-cols-5 [&>*]:border-b [&>*]:border-r [&>*]:border-border">
        <Stat label={t("kpiNew")} value={newCount} />
        <Stat label={t("kpiOpen")} value={openCount} />
        <Stat label={t("kpiWon")} value={wonThisMonth._count} hint={wonThisMonth._sum.dealAmountCents ? format.number(wonThisMonth._sum.dealAmountCents / 100, { style: "currency", currency: "EUR" }) : undefined} />
        <Stat label={t("kpiOpenInvoices")} cents={openInvoices._sum.totalCents ?? 0} />
        <Stat label={t("kpiScore")} value={`${business.score}/100`} hint={t("scoreHint")} className="col-span-2 md:col-span-1" />
      </div>

      <section>
        <h2 className="mb-4 text-xl">{t("needsAction")}</h2>
        {waiting.length === 0 ? (
          <EmptyState icon={Inbox} title={t("needsActionEmpty")} />
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {waiting.map((l) => {
              const deadline = addHours(l.createdAt, settings.responseHours);
              const late = l.status === "NEW" && deadline < now();
              return (
                <li key={l.id}>
                  <Link href={`/app/bedrijf/leads/${l.id}`} className="flex items-center gap-4 px-4 py-4 hover:bg-surface-2">
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="font-medium">{l.customer.firstName} {l.customer.lastName}</span>
                      <span className="text-sm text-subtle">{l.campaign.title} · {l.customer.city ?? l.customer.postcode}</span>
                    </div>
                    <span className={`hidden font-mono text-xs sm:block ${late ? "text-danger" : "text-subtle"}`}>
                      {l.status === "NEW" ? t("leadRespondBy", { date: format.dateTime(deadline, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }) : null}
                    </span>
                    <LeadStatusBadge status={l.status} />
                    <ArrowRight aria-hidden className="size-4 text-subtle" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
