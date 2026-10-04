import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, ArrowUpRight, Check, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Insignia } from "@/components/brand/insignia";
import { Section, SectionHeading } from "@/components/marketing/section";
import { FeeFragment, Frame, LeadFragment, ShareFragment } from "@/components/marketing/fragments";
import { FaqList, JsonLd, faqJsonLd } from "@/components/marketing/faq-list";
import Image from "next/image";
import { PHOTOS } from "@/content/photos";
import { PROVINCES } from "@/content/regions";
import { CategoryTiles } from "@/components/marketing/category-tiles";
import { HeroChat } from "@/components/marketing/hero-chat";
import { ExampleStories } from "@/components/marketing/example-stories";
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
  const words = t.raw("h4Words") as string[];

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "FindersArmy", url: siteUrl(), logo: `${siteUrl()}/icon.svg`, email: "hallo@findersarmy.com", areaServed: "NL" }} />
      <JsonLd data={faqJsonLd(faq)} />

      {/* Hero: the hook, and how it actually happens: one WhatsApp message. */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(60%_60%_at_80%_20%,color-mix(in_oklab,var(--signal)_22%,transparent),transparent_70%)]" />
        <div className="container-x relative grid gap-14 pt-12 pb-20 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-20 md:pb-28">
          <div className="flex flex-col gap-7">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-base font-medium md:text-lg">
              <span>{t("kFree")}</span>
              {(t.raw("kStruck") as string[]).map((w) => (
                <s key={w} className="text-subtle decoration-signal decoration-[3px]">{w}</s>
              ))}
            </p>
            <h1 className="text-[3rem] leading-[1] md:text-[5.4rem]">
              {t("h4A")}
              <br />
              <span className="fa-words" aria-label={words[0]}>
                {[...words, words[0]].map((w, i) => (
                  <span key={i} aria-hidden className="box-decoration-clone dark:bg-none dark:text-signal bg-[linear-gradient(transparent_55%,var(--signal)_55%,var(--signal)_80%,transparent_80%)]">{w}</span>
                ))}
              </span>
            </h1>
            <p className="max-w-xl text-lg text-subtle md:text-xl">{t("h4Sub")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/aanmelden/finder" className={buttonVariants({ variant: "solid", size: "xl" })}>
                {t("ctaFinder")} <ArrowRight aria-hidden />
              </Link>
              <Link href="/bedrijven" className={buttonVariants({ variant: "outline", size: "xl" })}>
                {t("ctaBusiness")}
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-subtle">
              {[t("trust1"), t("trust2"), t("trust3")].map((x) => (
                <li key={x} className="flex items-center gap-2"><Check aria-hidden className="size-4 text-fg" />{x}</li>
              ))}
            </ul>
          </div>
          <HeroChat locale={locale} cents={categoryExample(CATEGORIES.find((c) => c.slug === "autodealers")!).finderCents} />
        </div>
      </section>

      {/* Free, for both sides: impossible to miss. */}
      <section className="relative overflow-hidden bg-signal py-16 text-ink md:py-24">
        <div className="container-x flex flex-col gap-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="text-5xl leading-[0.95] md:text-8xl">{t("freeTitle")}</h2>
            <p aria-hidden className="money text-[7rem] leading-none font-semibold tracking-tighter md:text-[11rem]">€0</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: t("freeFinderLabel"), body: t("freeFinderBody"), cta: t("freeFinderCta"), href: "/aanmelden/finder" },
              { label: t("freeBizLabel"), body: t("freeBizBody"), cta: t("freeBizCta"), href: "/aanmelden/bedrijf" },
            ].map((x) => (
              <Link key={x.href} href={x.href} data-cursor={locale === "en" ? "Start" : "Start"} className="group flex flex-col gap-5 rounded-[28px] bg-ink p-7 text-paper transition-transform duration-300 hover:-translate-y-1 md:p-10">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-signal">{x.label}</p>
                  <p className="money rounded-full bg-signal px-3 py-1 text-sm font-semibold text-ink">€ 0</p>
                </div>
                <p className="max-w-md text-2xl leading-snug md:text-3xl">{x.body}</p>
                <span className="mt-auto inline-flex items-center gap-2 font-medium text-signal">
                  {x.cta} <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
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

      {/* What one deal is worth, per category. */}
      <CategoryTiles
        locale={locale}
        pinned
        header={
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <SectionHeading title={t("tilesTitle")} sub={t("tilesSub")} className="mb-0 md:mb-0" />
            <Link href="/categorieen" className={buttonVariants({ variant: "outline" })}>
              {t("categoriesAll")} <ArrowRight aria-hidden />
            </Link>
          </div>
        }
      />

      <ExampleStories locale={locale} />

      {/* Side job versus FindersArmy. */}
      <section className="bg-surface py-16 md:py-24">
        <div className="container-x">
          <SectionHeading title={t("vsTitle")} sub={t("vsSub")} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-5 rounded-3xl border border-border bg-bg p-7 md:p-9">
              <h3 className="text-2xl text-subtle">{t("vsJobTitle")}</h3>
              <ul className="flex flex-col gap-3">
                {(t.raw("vsJob") as string[]).map((x) => (
                  <li key={x} className="flex gap-3 text-subtle"><X aria-hidden className="mt-1 size-4 shrink-0" />{x}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-5 rounded-3xl bg-ink p-7 text-paper md:p-9">
              <h3 className="text-2xl">{t("vsFaTitle")}</h3>
              <ul className="flex flex-col gap-3">
                {(t.raw("vsFa") as string[]).map((x) => (
                  <li key={x} className="flex gap-3 text-lg"><Check aria-hidden className="mt-1.5 size-4 shrink-0 text-signal" />{x}</li>
                ))}
              </ul>
              <Link href="/aanmelden/finder" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-2 self-start")}>
                {t("ctaFinder")} <ArrowRight aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

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
              <div data-spot className="rounded-md">
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

      {/* Photo band + the worked example. */}
      <section className="py-16 md:py-24">
        <div className="container-x grid gap-10 md:grid-cols-2 md:items-center">
          <div data-unveil className="relative aspect-[4/3] overflow-hidden rounded-[28px]">
            <Image src={PHOTOS.vriendenLachen.src} alt={PHOTOS.vriendenLachen.alt[locale]} fill sizes="(min-width: 768px) 45vw, 92vw" className="object-cover" />
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="text-4xl md:text-5xl">{t("bandTitle")}</h2>
            <p className="text-lg text-subtle">{t("bandBody")}</p>
            <dl className="divide-y divide-border rounded-2xl border border-border bg-surface text-sm">
              {[
                [t("calcJob"), formatCents(ex.jobCents, locale)],
                [t("calcRate"), `${ex.rateBps / 100}%`],
                [t("calcFee"), formatCents(ex.feeCents, locale)],
                [t("calcShare"), `${ex.shareBps / 100}%`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-5 py-3.5">
                  <dt className="text-subtle">{k}</dt>
                  <dd className="money">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-5">
                <dt className="font-medium">{t("calcYou")}</dt>
                <dd className="money rounded-md bg-signal px-2 text-4xl font-semibold text-ink" data-count={ex.finderCents}>
                  {formatEuroShort(ex.finderCents, locale)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

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
            <p className="text-sm font-medium text-signal">{t("businessEyebrow")}</p>
            <h2 className="text-4xl md:text-6xl">{t("bizTitle2")}</h2>
            <p className="max-w-xl text-lg text-[#c9cbc4]">{t("bizBody2")}</p>
            <Link href="/bedrijven" className={cn(buttonVariants({ variant: "primary", size: "lg" }), "self-start")}>
              {t("businessCta")} <ArrowRight aria-hidden />
            </Link>
          </div>
          <div className="flex flex-col gap-3">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
            <Image src={PHOTOS.bedrijf.src} alt={t("bizPhotoAlt")} fill sizes="(min-width: 768px) 40vw, 92vw" className="object-cover" />
          </div>
          <ul className="grid gap-3 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            {[t("bizStat1"), t("bizStat2"), t("bizStat3")].map((label) => (
              <li key={label} className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4">
                <span className="money text-4xl font-semibold text-signal">€ 0</span>
                <span className="text-sm text-[#c9cbc4]">{label}</span>
              </li>
            ))}
          </ul>
          </div>
        </div>
      </section>

      {/* Everywhere in the Netherlands. */}
      <Section>
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading title={t("regionsTitle")} sub={t("regionsSub")} className="mb-0 md:mb-0" />
          <Link href="/regio" className={buttonVariants({ variant: "outline" })}>{t("regionsAll")} <ArrowRight aria-hidden /></Link>
        </div>
        <ul className="flex flex-wrap gap-2">
          {PROVINCES.map((p) => (
            <li key={p.key}>
              <Link href={`/regio/${p.key}`} className="inline-flex rounded-full border border-border px-4 py-2 text-sm hover:border-fg hover:bg-fg hover:text-bg">{p.name}</Link>
            </li>
          ))}
        </ul>
      </Section>

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
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-[28px] bg-ink p-8 text-paper md:flex-row md:items-center md:justify-between md:p-14">
          <Image src={PHOTOS.groep.src} alt="" fill sizes="100vw" className="object-cover opacity-35" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/30" />
          <div className="relative flex max-w-xl flex-col gap-3">
            <h2 className="text-3xl md:text-5xl">{t("ctaTitle")}</h2>
            <p className="text-[#c9cbc4]">{t("ctaBody")}</p>
          </div>
          <Link href="/aanmelden/finder" className={cn(buttonVariants({ variant: "primary", size: "xl" }), "relative shrink-0")}>
            {t("ctaFinder")} <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
