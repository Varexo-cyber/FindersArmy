import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LeadStatusBadge } from "@/components/app/status-badge";
import { LeadTimeline } from "@/components/app/timeline";
import { LeadStatusForm } from "@/components/app/lead-status-form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Money } from "@/components/ui/money";
import { requireBusiness } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { businessNextStatuses } from "@/lib/lead-status";
import { ruleFromCampaign } from "@/lib/server/services/fees";

export default async function LeadDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const lead = await db.lead.findFirst({
    where: { id, campaign: { businessId: business.id }, status: { not: "FRAUD" } },
    include: { customer: true, campaign: true, events: { orderBy: { createdAt: "asc" } }, photos: true, fee: true, finder: { include: { user: true } }, disputes: { where: { status: "OPEN" } } },
  });
  if (!lead) notFound();
  const t = await getTranslations("businessApp");
  const tr = await getTranslations("referral");
  const format = await getFormatter();
  const next = businessNextStatuses(lead.status) as ("CONTACTED" | "QUOTE_SENT" | "WON" | "COMPLETED" | "LOST")[];
  const c = lead.customer;

  return (
    <>
      <Link href="/app/bedrijf/leads" className="mb-6 inline-flex items-center gap-2 text-sm text-subtle hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" /> {t("leadsTitle")}
      </Link>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl md:text-4xl">{c.anonymizedAt ? "—" : `${c.firstName} ${c.lastName}`}</h1>
        <LeadStatusBadge status={lead.status} />
        {lead.isRepeat ? <span className="font-mono text-xs text-subtle uppercase">{t("leadRepeat")}</span> : null}
      </div>
      {lead.disputes.length ? <Alert tone="warning" className="mb-6">{t("leadDispute")}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>{t("leadDetails")}</CardTitle></CardHeader>
            <CardBody className="grid gap-4 sm:grid-cols-2">
              {!c.anonymizedAt ? (
                <>
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 font-mono text-sm hover:underline"><Phone aria-hidden className="size-4" />{c.phone}</a>
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 truncate font-mono text-sm hover:underline"><Mail aria-hidden className="size-4" />{c.email}</a>
                  <p className="text-sm">{c.postcode} {c.houseNumber}{c.city ? `, ${c.city}` : ""}</p>
                </>
              ) : null}
              <p className="text-sm text-subtle">{lead.campaign.title}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t("leadDescription")}</CardTitle></CardHeader>
            <CardBody className="flex flex-col gap-4">
              <p className="whitespace-pre-line">{lead.description}</p>
              <dl className="flex gap-2 text-sm"><dt className="text-subtle">{t("leadTimeframe")}:</dt><dd>{tr(`timeframes.${lead.timeframe}` as "timeframes.ASAP")}</dd></dl>
              {lead.photos.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {lead.photos.map((p) => (
                    <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-md border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="size-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : null}
            </CardBody>
          </Card>
          {next.length ? (
            <Card>
              <CardBody>
                <LeadStatusForm leadId={lead.id} options={next} rule={ruleFromCampaign(lead.campaign)} boostCents={lead.boostCents} />
              </CardBody>
            </Card>
          ) : (
            <Alert>{t("leadCompleted")}</Alert>
          )}
        </div>
        <div className="flex flex-col gap-6">
          {lead.dealAmountCents ? (
            <Card>
              <CardBody className="flex flex-col gap-3">
                <div><span className="eyebrow">{t("leadDealAmount")}</span><div><Money cents={lead.dealAmountCents} size="lg" /></div></div>
                {lead.fee ? <div><span className="eyebrow">Finder&apos;s fee</span><div><Money cents={lead.fee.totalCents} size="lg" /></div></div> : null}
              </CardBody>
            </Card>
          ) : null}
          <Card>
            <CardHeader><CardTitle>{t("leadTimeline")}</CardTitle></CardHeader>
            <CardBody><LeadTimeline events={lead.events} /></CardBody>
          </Card>
          <p className="font-mono text-xs text-subtle">
            {t("leadFinder")}: {lead.finder.nickname ?? lead.finder.user.name?.split(" ")[0] ?? "Finder"} · {format.dateTime(lead.createdAt, { dateStyle: "medium" })}
          </p>
        </div>
      </div>
    </>
  );
}
