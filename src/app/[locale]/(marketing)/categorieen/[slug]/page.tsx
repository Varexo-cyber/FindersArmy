import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { PageHero, Section } from "@/components/marketing/section";
import { CATEGORIES, CATEGORY_GROUPS } from "@/content/categories";
import { categoryExample } from "@/lib/examples";
import { formatCents, formatEuroShort } from "@/lib/money";
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
  const related = CATEGORIES.filter((x) => x.group === c.group && x.slug !== c.slug);
  const group = CATEGORY_GROUPS.find((g) => g.key === c.group)!;
  return (
    <>
      <PageHero
        eyebrow={locale === "en" ? group.en : group.nl}
        title={name}
        sub={locale === "en" ? c.descriptionEn : c.descriptionNl}
        aside={
          <div data-spot data-tilt className="flex flex-col gap-5 rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md md:p-8">
            <p className="text-sm text-[#c9cbc4]">{t("exampleEarning")}</p>
            <p className="money fx-gradient-text text-6xl font-semibold md:text-7xl" data-count={ex.finderCents}>{formatEuroShort(ex.finderCents, locale)}</p>
            <dl className="flex flex-col gap-3 border-t border-white/10 pt-5 font-mono text-sm">
              <div className="flex justify-between gap-6"><dt className="font-sans text-[#9a9d94]">{t("typicalJob")}</dt><dd>{formatCents(ex.jobCents, locale)}</dd></div>
              <div className="flex justify-between gap-6"><dt className="font-sans text-[#9a9d94]">Fee</dt><dd className="text-right">{ruleText}</dd></div>
            </dl>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/aanmelden/finder" data-magnetic className={buttonVariants({ variant: "primary", size: "lg" })}>{tf("shareCta")} <ArrowRight aria-hidden /></Link>
          <Link href="/categorieen" className="inline-flex items-center gap-2 text-sm text-subtle hover:text-fg">
            <ArrowLeft aria-hidden className="size-4" /> {t("backToAll")}
          </Link>
        </div>
      </PageHero>
      <Section>
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div data-spot className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl">{t("detailWho")}</h2>
            <p className="text-lg leading-relaxed">{locale === "en" ? c.whoEn : c.whoNl}</p>
            <p className="mt-auto inline-flex items-center gap-2 font-mono text-sm text-subtle">
              {live > 0 ? <span aria-hidden className="fx-pulse-dot size-1.5 rounded-full bg-signal" /> : null}
              {live > 0 ? `${live} ${t("liveCampaigns").toLowerCase()}` : t("noCampaigns")}
            </p>
            <Link href="/aanmelden/bedrijf" className={buttonVariants({ variant: "outline", className: "self-start" })}>{t("signupCta")}</Link>
          </div>
          {related.length ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl">{locale === "en" ? `More in ${group.en.toLowerCase()}` : `Meer in ${group.nl.toLowerCase()}`}</h2>
              <ul className="flex flex-col gap-2">
                {related.slice(0, 6).map((r) => (
                  <li key={r.slug}>
                    <Link href={`/categorieen/${r.slug}`} data-spot className="flex items-center justify-between gap-4 rounded-md border border-border px-4 py-3 transition-colors duration-150 hover:border-fg">
                      <span className="font-medium">{locale === "en" ? r.nameEn : r.nameNl}</span>
                      <Money cents={categoryExample(r).finderCents} short highlight locale={locale} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Section>
    </>
  );
}
