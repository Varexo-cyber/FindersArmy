import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Inbox } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { LeadStatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { requireBusiness } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { cn } from "@/lib/utils";

const FILTERS: (LeadStatus | "ALL")[] = ["ALL", "NEW", "CONTACTED", "QUOTE_SENT", "WON", "INVOICED", "PAID", "LOST"];

export default async function LeadsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const t = await getTranslations("businessApp");
  const ts = await getTranslations("status");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const { status } = await searchParams;
  const filter = LEAD_STATUSES.includes(status as LeadStatus) ? (status as LeadStatus) : null;
  const leads = await db.lead.findMany({
    // Blocked (fraud) leads are an admin matter; businesses never see them.
    where: { campaign: { businessId: business.id }, status: filter ?? { notIn: ["FRAUD"] } },
    include: { customer: true, campaign: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader title={t("leadsTitle")} />
      <nav aria-label={tc("status")} className="-mx-4 mb-6 overflow-x-auto px-4">
        <ul className="flex gap-1.5">
          {FILTERS.map((f) => {
            const active = (f === "ALL" && !filter) || f === filter;
            return (
              <li key={f}>
                <Link
                  href={f === "ALL" ? "/app/bedrijf/leads" : `/app/bedrijf/leads?status=${f}`}
                  aria-current={active ? "page" : undefined}
                  className={cn("inline-flex h-8 items-center rounded-md border px-3 font-mono text-[11px] tracking-wider whitespace-nowrap", active ? "border-fg bg-fg text-bg" : "border-border text-subtle hover:text-fg")}
                >
                  {f === "ALL" ? tc("all").toUpperCase() : ts(f)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {leads.length === 0 ? (
        <EmptyState icon={Inbox} title={t("leadsTitle")} body={t("leadsEmpty")} />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {leads.map((l) => (
            <li key={l.id}>
              <Link href={`/app/bedrijf/leads/${l.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-4 hover:bg-surface-2 md:grid-cols-[1.4fr_1fr_auto_auto]">
                <span className="font-medium">
                  {l.customer.anonymizedAt ? "—" : `${l.customer.firstName} ${l.customer.lastName}`}
                  {l.isRepeat ? <span className="ml-2 font-mono text-[10px] text-subtle uppercase">{t("leadRepeat")}</span> : null}
                </span>
                <LeadStatusBadge status={l.status} />
                <span className="text-sm text-subtle md:order-none">{l.campaign.title}</span>
                <span className="hidden text-right md:block">{l.dealAmountCents ? <Money cents={l.dealAmountCents} size="sm" /> : <span className="font-mono text-xs text-subtle">{format.dateTime(l.createdAt, { day: "numeric", month: "short" })}</span>}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
