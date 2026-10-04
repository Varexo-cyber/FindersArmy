import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Insignia } from "@/components/brand/insignia";
import { Section, SectionHeading } from "@/components/marketing/section";
import { FeeFragment, Frame, LeadFragment, ShareFragment } from "@/components/marketing/fragments";
import { FaqList, JsonLd, faqJsonLd } from "@/components/marketing/faq-list";
import { EarningsCalculator } from "@/components/marketing/earnings-calculator";
import { CategoryMarquee } from "@/components/marketing/category-marquee";
import { CATEGORIES, CATEGORY_GROUPS } from "@/content/categories";
import { FAQ } from "@/content/faq";
import { HOME_EXAMPLE, categoryExample } from "@/lib/examples";
import { formatCents, formatEuroShort } from "@/lib/money";
import { DEFAULT_RANKS } from "@/lib/ranks";
import { paidOutTotalCents } from "@/lib/server/public-stats";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/metadata";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, null, "/");
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tr = await getTranslations("ranks");
  const ts = await getTranslations("status");
  const paidOut = await paidOutTotalCents();
  const faq = [...FAQ[locale].finders.slice(0, 3), ...FAQ[locale].business.slice(0, 3)];
  const ex = HOME_EXAMPLE;

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "FindersArmy", url: siteUrl(), logo: `${siteUrl()}/icon.svg`, email: "hallo@findersarmy.com", areaServed: "NL" }} />
      <JsonLd data={faqJsonLd(faq)} />

      {/* Hero: dark stage, light that flows after the pointer, live calculator. */}
      <section data-flow className="fx-flow -mt-px bg-ink text-paper [--fg:var(--paper)] [--subtle:#a9aca2] [--border:#2b2e27]">
        <div className="fx-grid" aria-hidden />
        <div className="container-x relative grid gap-12 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
          <div className="flex flex-col gap-7">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-[#c9cbc4] uppercase">
              <span aria-hidden className="size-1.5 rounded-full bg-signal" />
              {t("heroPill")}
            </p>
            <h1 className="text-[3.2rem] leading-[0.92] md:text-[6rem]">
              {t("heroTitleA")}
              <br />
              <span className="fx-gradient-text">{t("heroTitleB")}</span>
            </h1>
            <p className="max-w-xl text-lg text-[#c9cbc4] md:text-xl">{t("heroSub2")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/aanmelden/finder" data-magnetic className={buttonVariants({ variant: "primary", size: "xl" })}>
                {t("ctaFinder")} <ArrowRight aria-hidden />
              </Link>
              <Link href="/bedrijven" className={cn(buttonVariants({ variant: "outline", size: "xl" }), "border-white/20 text-paper hover:bg-white/10")}>
                {t("ctaBusiness")}
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#a9aca2]">
              {[t("trust1"), t("trust2"), t("trust3")].map((x) => (
                <li key={x} className="flex items-center gap-2"><Check aria-hidden className="size-4 text-signal" />{x}</li>
              ))}
            </ul>
          </div>
          <EarningsCalculator locale={locale} />
        </div>
      </section>

      {/* Endless band of what people earn per category. */}
      <section className="border-b border-border py-8">
        <CategoryMarquee locale={locale} label={t("marqueeEarn")} />
      </section>

      {paidOut !== null ? (
        <section className="border-b border-border bg-surface">
          <div className="container-x flex flex-col gap-1 py-8 md:flex-row md:items-baseline md:justify-between">
            <p className="eyebrow">{t("paidOut")}</p>
            <Money cents={paidOut} size="xl" highlight locale={locale} />
            <p className="text-xs text-subtle">{t("paidOutNote")}</p>
          </div>
        </section>
      ) : null}

      {/* Steps: real UI fragments, the third one is money. */}
      <Section>
        <SectionHeading eyebrow={t("stepsEyebrow")} title={t("stepsTitle")} sub={t("stepsSub")} />
        <ol className="grid gap-6 md:grid-cols-3">
          {[
            { title: t("step1Title"), body: t("step1Body"), frag: <ShareFragment message={t("mockShareMessage")} /> },
            { title: t("step2Title"), body: t("step2Body"), frag: <LeadFragment name={t("mockLeadName")} text={t("mockLeadText")} status={ts("QUOTE_SENT")} /> },
            { title: t("step3Title"), body: t("step3Body"), frag: <FeeFragment label={t("mockFeeLabel")} cents={ex.finderCents} status={ts("WON")} /> },
          ].map((s, i) => (
            <li key={i} data-reveal style={{ transitionDelay: `${i * 90}ms` }} className="flex flex-col gap-5">
              <div data-spot data-tilt className="rounded-md">
                <Frame className="min-h-44 bg-bg">{s.frag}</Frame>
              </div>
              <div className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fg font-mono text-sm text-bg">{i + 1}</span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl">{s.title}</h3>
                  <p className="text-subtle">{s.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* The worked example with numbers that count up. */}
      <Section tone="surface">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <SectionHeading eyebrow={t("calcEyebrow")} title={t("calcTitle")} sub={t("calcNote")} className="mb-0 md:mb-0" />
          <dl data-reveal data-spot className="divide-y divide-border overflow-hidden rounded-md border border-border bg-bg font-mono text-sm">
            {[
              [t("calcJob"), formatCents(ex.jobCents, locale)],
              [t("calcRate"), `${ex.rateBps / 100}%`],
              [t("calcFee"), formatCents(ex.feeCents, locale)],
              [t("calcShare"), `${ex.shareBps / 100}%`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-5 py-4">
                <dt className="font-sans text-subtle">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-6">
              <dt className="font-sans font-medium">{t("calcYou")}</dt>
              <dd className="money bg-signal px-2 text-4xl font-semibold text-ink md:text-5xl" data-count={ex.finderCents}>
                {formatEuroShort(ex.finderCents, locale)}
              </dd>
            </div>
          </dl>
        </div>
      </Section>

      {/* Ranks: the more you bring in, the bigger your share. */}
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-end">
          <SectionHeading title={t("ranksTitle2")} sub={t("ranksBody2")} className="mb-0 md:mb-0" />
          <ol className="grid grid-cols-5 items-end gap-2">
            {DEFAULT_RANKS.map((r, i) => (
              <li key={r.key} data-reveal style={{ transitionDelay: `${i * 70}ms` }} className="flex flex-col items-center gap-2">
                <span className="money text-sm font-semibold md:text-lg">{r.shareBps / 100}%</span>
                <div
                  data-spot
                  className="flex w-full items-start justify-center rounded-t-md border border-b-0 border-border bg-surface pt-3"
                  style={{ height: `${90 + i * 34}px` }}
                >
                  <Insignia rank={r.key} className="size-8 text-olive md:size-10 dark:text-accent" />
                </div>
                <span className="text-center text-[11px] leading-tight text-subtle md:text-xs">{tr(r.key)}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* For businesses: three honest zeros. */}
      <section className="bg-ink py-16 text-paper md:py-24">
        <div className="container-x grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="flex flex-col gap-5">
            <p className="font-mono text-[11px] tracking-[0.12em] text-[#9a9d94] uppercase">{t("businessEyebrow")}</p>
            <h2 className="text-4xl md:text-6xl">{t("bizTitle2")}</h2>
            <p className="max-w-xl text-lg text-[#c9cbc4]">{t("bizBody2")}</p>
            <Link href="/bedrijven" data-magnetic className={cn(buttonVariants({ variant: "primary", size: "lg" }), "self-start")}>
              {t("businessCta")} <ArrowRight aria-hidden />
            </Link>
          </div>
          <ul className="grid gap-3">
            {[t("bizStat1"), t("bizStat2"), t("bizStat3")].map((label) => (
              <li key={label} data-spot data-reveal className="flex items-baseline gap-4 rounded-md border border-white/10 bg-white/[0.03] px-6 py-5">
                <span className="money text-5xl font-semibold text-signal">€ 0</span>
                <span className="text-lg text-[#c9cbc4]">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Categories grouped by sector. */}
      <Section>
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading eyebrow={t("categoriesEyebrow")} title={t("categoriesTitle2")} sub={t("categoriesSub2", { count: CATEGORIES.length })} className="mb-0 md:mb-0" />
          <Link href="/categorieen" className={buttonVariants({ variant: "outline" })}>
            {t("categoriesAll")} <ArrowRight aria-hidden />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_GROUPS.map((g) => {
            const cats = CATEGORIES.filter((c) => c.group === g.key);
            const top = Math.max(...cats.map((c) => categoryExample(c).finderCents));
            return (
              <div key={g.key} data-spot data-reveal className="flex flex-col gap-4 rounded-md border border-border bg-surface p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg">{locale === "en" ? g.en : g.nl}</h3>
                  <span className="text-xs text-subtle">
                    {t("marqueeEarn")} <span className="money font-semibold text-fg">{formatEuroShort(top, locale)}</span>
                  </span>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {cats.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/categorieen/${c.slug}`} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs transition-colors duration-150 hover:border-fg hover:bg-fg hover:text-bg">
                        {locale === "en" ? c.nameEn : c.nameNl}
                        <ArrowUpRight aria-hidden className="size-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-3xl md:text-4xl">{t("faqTitle")}</h2>
            <Link href="/faq" className={buttonVariants({ variant: "outline" })}>{t("faqAll")}</Link>
          </div>
          <FaqList items={faq} />
        </div>
      </Section>

      <section className="container-x pt-16 md:pt-24">
        <div data-flow className="fx-flow flex flex-col gap-6 rounded-md bg-ink p-8 text-paper md:flex-row md:items-center md:justify-between md:p-14">
          <div className="fx-grid" aria-hidden />
          <div className="relative flex max-w-xl flex-col gap-3">
            <h2 className="text-3xl md:text-5xl">{t("ctaTitle")}</h2>
            <p className="text-[#c9cbc4]">{t("ctaBody")}</p>
          </div>
          <Link href="/aanmelden/finder" data-magnetic className={cn(buttonVariants({ variant: "primary", size: "xl" }), "relative shrink-0")}>
            {t("ctaFinder")} <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
