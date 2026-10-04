import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { LeadStatusBadge } from "@/components/app/status-badge";
import { ReportForm } from "@/components/app/report-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { buttonVariants } from "@/components/ui/button";
import { requireFinder } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { PIPELINE, pipelineIndex } from "@/lib/lead-status";
import { cn } from "@/lib/utils";

/**
 * The Finder's view of their customers. Privacy rule: first name and city only — never surname,
 * contact details, address or the request text.
 */
export default async function FinderCustomers({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { finder } = await requireFinder();
  const t = await getTranslations("finderApp");
  const tl = await getTranslations("statusLong");
  const format = await getFormatter();
  const leads = await db.lead.findMany({
    where: { finderId: finder.id, status: { notIn: ["DUPLICATE"] } },
    select: {
      id: true, status: true, isRepeat: true, createdAt: true,
      customer: { select: { firstName: true, city: true, postcode: true, anonymizedAt: true } },
      campaign: { select: { business: { select: { name: true } } } },
      events: { select: { toStatus: true, fromStatus: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      ledger: { select: { type: true, amountCents: true } },
      reports: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const visible = PIPELINE.filter((s) => s !== "COMPLETED" && s !== "INVOICED");

  return (
    <>
      <PageHeader title={t("customersTitle")} sub={t("customersSub")} />
      {leads.length === 0 ? (
        <EmptyState icon={Users} title={t("customersEmpty")} action={<Link href="/app/finder" className={buttonVariants({ variant: "primary" })}>{t("customersEmptyCta")}</Link>} />
      ) : (
        <ul className="flex flex-col gap-4">
          {leads.map((l) => {
            const expected = l.ledger.filter((x) => x.type === "EXPECTED").reduce((a, x) => a + x.amountCents, 0);
            const earned = l.ledger.filter((x) => x.type === "AVAILABLE").reduce((a, x) => a + x.amountCents, 0);
            const idx = pipelineIndex(l.status);
            const name = l.customer.anonymizedAt ? "—" : l.customer.firstName.split(" ")[0];
            const place = l.customer.city ?? l.customer.postcode.slice(0, 4);
            const canReport = ["CONTACTED", "QUOTE_SENT", "WON", "LOST"].includes(l.status) && l.reports.length === 0;
            return (
              <li key={l.id} className="flex flex-col gap-4 rounded-md border border-border p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-semibold tracking-tight">{name} <span className="font-sans text-sm font-normal text-subtle">· {place}</span></p>
                    <p className="text-sm text-subtle">{l.campaign.business.name}{l.isRepeat ? ` · ${t("repeat")}` : ""}</p>
                  </div>
                  <LeadStatusBadge status={l.status} />
                </div>
                <ol className="grid grid-cols-7 gap-1" aria-label={tl(l.status)}>
                  {visible.map((s) => {
                    const done = idx >= 0 && pipelineIndex(s) <= idx;
                    return (
                      <li key={s} className="flex flex-col gap-1.5">
                        <span className={cn("h-1 rounded-full", done ? "bg-olive dark:bg-accent" : "bg-border")} />
                        <span className={cn("hidden text-[10px] leading-tight sm:block", done ? "text-fg" : "text-subtle")}>{tl(s)}</span>
                      </li>
                    );
                  })}
                </ol>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="font-mono text-xs text-subtle">
                    {tl(l.status)} · {format.dateTime(l.events.at(-1)?.createdAt ?? l.createdAt, { day: "numeric", month: "short" })}
                  </p>
                  {earned > 0 ? (
                    <span className="flex items-baseline gap-2"><span className="eyebrow">{t("earned")}</span><Money cents={earned} highlight locale={locale} /></span>
                  ) : expected > 0 ? (
                    <span className="flex items-baseline gap-2"><span className="eyebrow">{t("expected")}</span><Money cents={expected} locale={locale} /></span>
                  ) : null}
                </div>
                {canReport ? <ReportForm leadId={l.id} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
