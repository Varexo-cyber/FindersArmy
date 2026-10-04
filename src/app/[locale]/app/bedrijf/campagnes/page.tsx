import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Megaphone, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { BoostForm, CampaignToggle, EndBoostButton } from "@/components/app/campaign-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { requireBusiness } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { now } from "@/lib/server/clock";
import { monthlySpend } from "@/lib/server/services/leads";
import { formatCents } from "@/lib/money";
import { parseTiers } from "@/lib/fees";

export default async function CampaignsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ opgeslagen?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const t = await getTranslations("businessApp");
  const tf = await getTranslations("finderApp");
  const tcs = await getTranslations("campaignStatus");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const { opgeslagen } = await searchParams;
  const campaigns = await db.campaign.findMany({
    where: { businessId: business.id },
    include: { boosts: { where: { endsAt: { gte: now() } }, orderBy: { endsAt: "asc" } }, _count: { select: { links: true } } },
    orderBy: { createdAt: "asc" },
  });
  const spend = await Promise.all(campaigns.map((c) => monthlySpend(c.id)));

  return (
    <>
      <PageHeader title={t("campaignsTitle")} actions={<Link href="/app/bedrijf/campagnes/nieuw" className={buttonVariants({ variant: "solid", size: "sm" })}><Plus aria-hidden /> {t("campaignsNew")}</Link>} />
      {opgeslagen ? <Alert tone="success" className="mb-6">{t("campaignSaved")}</Alert> : null}
      {campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title={t("campaignsTitle")} action={<Link href="/app/bedrijf/campagnes/nieuw" className={buttonVariants({ variant: "primary" })}>{t("campaignsNew")}</Link>} />
      ) : (
        <div className="flex flex-col gap-6">
          {campaigns.map((c, i) => {
            const rule =
              c.feeType === "PERCENTAGE"
                ? tf("campaignFeePct", { pct: `${(c.feePercentBps ?? 0) / 100}%`, min: formatCents(c.minFeeCents, locale) })
                : c.feeType === "FIXED"
                  ? tf("campaignFeeFixed", { fee: formatCents(c.feeFixedCents ?? 0, locale) })
                  : `${tf("campaignFeeTiered")} ${(parseTiers(c.tiers) ?? []).map((x) => tf("campaignTierRow", { from: formatCents(x.fromCents, locale), fee: formatCents(x.feeCents, locale) })).join(" · ")}`;
            return (
              <Card key={c.id}>
                <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={c.status === "LIVE" ? "signal" : c.status === "SUSPENDED" ? "danger" : "neutral"}>{tcs(c.status)}</Badge>
                      <span className="font-mono text-xs text-subtle">{t("campaignLinks", { count: c._count.links })}</span>
                    </div>
                    <h2 className="text-xl">{c.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <CampaignToggle campaignId={c.id} live={c.status === "LIVE"} canResume={business.status === "ACTIVE" && ["PAUSED"].includes(c.status)} />
                    <Link href={`/app/bedrijf/campagnes/${c.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>{t("campaignEdit")}</Link>
                  </div>
                </CardHeader>
                <CardBody className="flex flex-col gap-5">
                  <p className="text-sm text-subtle">{c.targetCustomer}</p>
                  <dl className="grid gap-3 font-mono text-sm sm:grid-cols-2">
                    <div><dt className="eyebrow">Fee</dt><dd>{rule}</dd></div>
                    <div><dt className="eyebrow">{tc("region")}</dt><dd>{c.region}</dd></div>
                    {c.monthlyBudgetCents ? (
                      <div className="sm:col-span-2">
                        <dt className="sr-only">Budget</dt>
                        <dd>{t("campaignSpent", { spent: formatCents(spend[i]!, locale), budget: formatCents(c.monthlyBudgetCents, locale) })}</dd>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border"><div className="h-full bg-olive dark:bg-accent" style={{ width: `${Math.min(100, (spend[i]! / c.monthlyBudgetCents) * 100)}%` }} /></div>
                      </div>
                    ) : null}
                  </dl>
                  <div className="flex flex-col gap-3 border-t border-border pt-5">
                    <h3 className="font-display text-base font-semibold">{t("boostTitle")}</h3>
                    {c.boosts.map((b) => (
                      <div key={b.id} className="flex items-center gap-3 text-sm">
                        <Badge tone="signal">{b.label}</Badge>
                        <span className="font-mono text-xs text-subtle">+{formatCents(b.extraFeeCents, locale)} · {t("boostActive", { date: format.dateTime(b.endsAt, { day: "numeric", month: "short" }) })}</span>
                        <EndBoostButton boostId={b.id} />
                      </div>
                    ))}
                    {c.status === "LIVE" ? <BoostForm campaignId={c.id} /> : null}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
