import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { PageHero, Section } from "@/components/marketing/section";
import { CATEGORIES } from "@/content/categories";
import { categoryExample } from "@/lib/examples";
import { formatCents } from "@/lib/money";
import { liveCampaignCounts } from "@/lib/server/public-stats";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";

export const revalidate = 600;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => CATEGORIES.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (!c) return {};
  const name = locale === "en" ? c.nameEn : c.nameNl;
  return pageMetadata(locale, null, `/categorieen/${slug}`, {
    title: locale === "en" ? `Refer customers to ${name.toLowerCase()}` : `Klanten aanbrengen bij ${name.toLowerCase()}`,
    description: locale === "en" ? c.descriptionEn : c.descriptionNl,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const c = CATEGORIES.find((x) => x.slug === slug);
  if (!c) notFound();
  const t = await getTranslations("categories");
  const tf = await getTranslations("finderApp");
  const ex = categoryExample(c);
  const live = (await liveCampaignCounts())[slug] ?? 0;
  const name = locale === "en" ? c.nameEn : c.nameNl;
  const rule = c.example;
  const ruleText =
    rule.feeType === "PERCENTAGE"
      ? tf("campaignFeePct", { pct: `${(rule.feePercentBps ?? 0) / 100}%`, min: formatCents(rule.minFeeCents, locale) })
      : rule.feeType === "FIXED"
        ? tf("campaignFeeFixed", { fee: formatCents(rule.feeFixedCents ?? 0, locale) })
        : `${tf("campaignFeeTiered")} ${(rule.tiers ?? []).map((tier) => tf("campaignTierRow", { from: formatCents(tier.fromCents, locale), fee: formatCents(tier.feeCents, locale) })).join(", ")}`;
  return (
    <>
      <PageHero eyebrow={t("eyebrow")} title={name} sub={locale === "en" ? c.descriptionEn : c.descriptionNl}>
        <Link href="/categorieen" className="inline-flex items-center gap-2 text-sm text-subtle hover:text-fg">
          <ArrowLeft aria-hidden className="size-4" /> {t("backToAll")}
        </Link>
      </PageHero>
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-5 rounded-md border border-border p-6 md:p-8">
            <h2 className="text-2xl">{t("detailEarnTitle")}</h2>
            <dl className="flex flex-col gap-3 font-mono text-sm">
              <div className="flex justify-between"><dt className="font-sans text-subtle">{t("typicalJob")}</dt><dd>{formatCents(ex.jobCents, locale)}</dd></div>
              <div className="flex justify-between gap-6"><dt className="font-sans text-subtle">Fee</dt><dd className="text-right">{ruleText}</dd></div>
            </dl>
            <div className="border-t border-border pt-5">
              <span className="eyebrow">{t("exampleEarning")}</span>
              <div><Money cents={ex.finderCents} size="hero" highlight locale={locale} /></div>
            </div>
          </div>
          <div className="flex flex-col gap-5 rounded-md border border-border p-6 md:p-8">
            <h2 className="text-2xl">{t("detailWho")}</h2>
            <p className="text-lg">{locale === "en" ? c.whoEn : c.whoNl}</p>
            <p className="mt-auto font-mono text-sm text-subtle">{live > 0 ? `${live} ${t("liveCampaigns").toLowerCase()}` : t("noCampaigns")}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/aanmelden/finder" className={buttonVariants({ variant: "primary" })}>{tf("shareCta")} <ArrowRight aria-hidden /></Link>
              <Link href="/aanmelden/bedrijf" className={buttonVariants({ variant: "outline" })}>{t("signupCta")}</Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
