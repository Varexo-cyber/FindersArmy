import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SharePanel } from "@/components/app/share-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { Alert } from "@/components/ui/alert";
import { requireFinder } from "@/lib/server/session";
import { getSettings } from "@/lib/server/settings";
import { db } from "@/lib/server/db";
import { now } from "@/lib/server/clock";
import { ruleFromCampaign } from "@/lib/server/services/fees";
import { calculateFee, maxFinderEarning } from "@/lib/fees";
import { formatCents } from "@/lib/money";
import { rankFor } from "@/lib/ranks";
import { siteUrl } from "@/lib/site";

export default async function FinderCampaignPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { finder } = await requireFinder();
  const t = await getTranslations("finderApp");
  const tr = await getTranslations("ranks");
  const tc = await getTranslations("common");
  const settings = await getSettings();
  const t0 = now();
  const campaign = await db.campaign.findUnique({
    where: { id },
    include: { business: { include: { category: true } }, boosts: { where: { startsAt: { lte: t0 }, endsAt: { gte: t0 } }, orderBy: { extraFeeCents: "desc" }, take: 1 } },
  });
  if (!campaign || campaign.business.status !== "ACTIVE" || !["LIVE", "BUDGET_REACHED"].includes(campaign.status)) notFound();
  const link = await db.referralLink.findUnique({ where: { finderId_campaignId: { finderId: finder.id, campaignId: id } } });
  const rank = rankFor(finder.paidDeals, settings.ranks);
  const rule = ruleFromCampaign(campaign);
  const boost = campaign.boosts[0];
  const cat = campaign.business.category;
  const exampleJob = Math.max(cat.exampleJobCents, rule.minJobAmountCents);
  const ex = calculateFee({ rule, dealAmountCents: exampleJob, finderShareBps: rank.shareBps, boostCents: boost?.extraFeeCents ?? 0 });
  const earn = maxFinderEarning(rule, rank.shareBps, cat.exampleJobCents, boost?.extraFeeCents ?? 0);
  const ruleText =
    rule.feeType === "PERCENTAGE"
      ? t("campaignFeePct", { pct: `${(rule.feePercentBps ?? 0) / 100}%`, min: formatCents(rule.minFeeCents, locale) })
      : rule.feeType === "FIXED"
        ? t("campaignFeeFixed", { fee: formatCents(rule.feeFixedCents ?? 0, locale) })
        : `${t("campaignFeeTiered")} ${(rule.tiers ?? []).map((x) => t("campaignTierRow", { from: formatCents(x.fromCents, locale), fee: formatCents(x.feeCents, locale) })).join(" · ")}`;

  return (
    <>
      <Link href="/app/finder" className="mb-6 inline-flex items-center gap-2 text-sm text-subtle hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" /> {t("discoverTitle")}
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            {campaign.business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={campaign.business.logoUrl} alt="" width={56} height={56} className="size-14 rounded-md border border-border object-contain" />
            ) : null}
            <div>
              <p className="eyebrow">{locale === "en" ? cat.nameEn : cat.nameNl} · {campaign.region}</p>
              <h1 className="text-3xl md:text-4xl">{campaign.business.name}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="text-sm text-subtle">{tc("earnUpTo")}</p>
              <Money cents={earn} short size="hero" highlight locale={locale} />
            </div>
            {boost ? <Badge tone="signal">{boost.label}</Badge> : null}
          </div>
          {campaign.status === "BUDGET_REACHED" ? <Alert tone="warning">{t("campaignBudgetReached")}</Alert> : null}

          <section className="flex flex-col gap-2">
            <h2 className="text-xl">{t("campaignWhat")}</h2>
            <p className="font-medium">{campaign.title}</p>
            <p className="text-subtle">{campaign.description}</p>
            <p className="text-subtle">{campaign.business.description}</p>
            {campaign.business.offerUrl || campaign.business.website ? (
              <a href={campaign.business.offerUrl ?? campaign.business.website!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
                {t("campaignOffer")} <ExternalLink aria-hidden className="size-3.5" />
              </a>
            ) : null}
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-xl">{t("campaignWho")}</h2>
            <p>{campaign.targetCustomer}</p>
          </section>
          <Card>
            <CardBody className="flex flex-col gap-3">
              <h2 className="text-xl">{t("campaignEarn")}</h2>
              <p className="font-mono text-sm">{ruleText}</p>
              <p className="text-sm text-subtle">{t("campaignMinJob", { min: formatCents(rule.minJobAmountCents, locale) })}</p>
              <div className="border-t border-border pt-3">
                <p className="eyebrow mb-1">{t("campaignExample")}</p>
                <p className="text-sm">
                  {t("campaignExampleText", {
                    job: formatCents(exampleJob, locale),
                    business: campaign.business.name,
                    fee: formatCents(ex.totalCents, locale),
                    rank: tr(rank.key),
                    share: `${(rank.shareBps / 100).toLocaleString(locale)}%`,
                    you: formatCents(ex.finderCents, locale),
                  })}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardBody>
              {campaign.status === "LIVE" && finder.status !== "SUSPENDED" ? (
                <SharePanel
                  campaignId={campaign.id}
                  initialCode={link?.code ?? null}
                  origin={siteUrl()}
                  business={campaign.business.name}
                  category={locale === "en" ? cat.nameEn : cat.nameNl}
                  clicks={link?.clicks ?? 0}
                />
              ) : (
                <Alert tone="warning">{finder.status === "SUSPENDED" ? t("suspended") : t("campaignBudgetReached")}</Alert>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}
