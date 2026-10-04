import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { PHOTOS, photoForGroup } from "@/content/photos";
import { CATEGORIES, CATEGORY_GROUPS } from "@/content/categories";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { BusinessCalculator } from "@/components/marketing/business-calculator";
import { FaqList, JsonLd, faqJsonLd } from "@/components/marketing/faq-list";
import { FAQ } from "@/content/faq";
import { pageMetadata } from "@/lib/metadata";
import { baseFee } from "@/lib/fees";
import { formatEuroShort } from "@/lib/money";

const EX_CUSTOMERS = 6;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "business", "/bedrijven");
}

export default async function BusinessPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const t = await getTranslations("business");
  const tHome = await getTranslations("home");
  const dealer = CATEGORIES.find((c) => c.slug === "autodealers")!;
  const dealerFee = baseFee(dealer.example, dealer.exampleJobCents);
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ[locale].business)} />
      <PageHero photo={PHOTOS.bedrijf} locale={locale}
        eyebrow={t("eyebrow")}
        title={t("heroTitle2")}
        sub={t("sub")}
        aside={
          <ul className="grid gap-3">
            {[tHome("bizStat1"), tHome("bizStat2"), tHome("bizStat3")].map((label) => (
              <li key={label} data-spot className="flex items-baseline gap-4 rounded-md border border-white/10 bg-white/[0.04] px-6 py-5 backdrop-blur-sm">
                <span className="money text-5xl font-semibold text-signal">€ 0</span>
                <span className="text-lg text-[#c9cbc4]">{label}</span>
              </li>
            ))}
          </ul>
        }
      >
        <div className="flex flex-col gap-2">
          <Link href="/aanmelden/bedrijf" className={buttonVariants({ variant: "primary", size: "xl", className: "self-start" })}>
            {t("cta")} <ArrowRight aria-hidden />
          </Link>
          <span className="font-mono text-xs text-subtle">{t("ctaNote")}</span>
        </div>
      </PageHero>

      {/* The whole offer in three steps, then the maths. */}
      <section className="py-16 md:py-24">
        <div className="container-x flex flex-col gap-10">
          <h2 className="text-4xl md:text-6xl">{t("salesTitle")}</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className={`flex flex-col gap-4 rounded-[28px] p-7 md:p-9 ${n === 3 ? "bg-signal text-ink" : "bg-surface"}`}>
                <span className="money text-6xl font-semibold opacity-30">0{n}</span>
                <h3 className="text-2xl md:text-3xl">{t(`sales${n}t` as "sales1t")}</h3>
                <p className={n === 3 ? "text-ink/75" : "text-subtle"}>{t(`sales${n}b` as "sales1b")}</p>
              </li>
            ))}
          </ol>
          <div className="relative overflow-hidden rounded-[28px] bg-ink p-7 text-paper md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl md:text-3xl">{t("exTitle")}</h3>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{t("exLabel")}</span>
            </div>
            <dl className="mt-8 grid gap-6 md:grid-cols-3">
              <div><dt className="text-sm text-[#a9aca2]">{t("exCustomers")}</dt><dd className="money text-6xl font-semibold">{EX_CUSTOMERS}</dd></div>
              <div><dt className="text-sm text-[#a9aca2]">{t("exRevenue")}</dt><dd className="money text-5xl font-semibold md:text-6xl">{formatEuroShort(EX_CUSTOMERS * dealer.exampleJobCents, locale)}</dd></div>
              <div><dt className="text-sm text-[#a9aca2]">{t("exCost")}</dt><dd className="money text-5xl font-semibold text-signal md:text-6xl">{formatEuroShort(EX_CUSTOMERS * dealerFee, locale)}</dd></div>
            </dl>
            <p className="mt-6 text-sm text-[#a9aca2]">{t("exNote", { fee: formatEuroShort(dealerFee, locale), car: formatEuroShort(dealer.exampleJobCents, locale) })}</p>
          </div>
        </div>
      </section>

      {/* Who is looking for you: real people, photographed. */}
      <section className="py-16 md:py-24">
        <div className="container-x grid gap-10 md:grid-cols-2 md:items-center">
          <div className="grid grid-cols-2 gap-3">
            {[PHOTOS.meisjeLacht, PHOTOS.jongenLacht, PHOTOS.vriendenTafel, PHOTOS.koppelKeuken].map((ph, i) => (
              <div key={ph.src} className={`relative overflow-hidden rounded-3xl ${i % 2 ? "mt-8 aspect-[3/4]" : "aspect-[3/4]"}`}>
                <Image src={ph.src} alt={ph.alt[locale]} fill sizes="(min-width: 768px) 22vw, 45vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-5">
            <h2 className="text-4xl md:text-5xl">{t("whoTitle")}</h2>
            <p className="text-lg text-subtle">{t("whoBody")}</p>
            <Link href="/aanmelden/bedrijf" className={buttonVariants({ variant: "solid", size: "lg", className: "self-start" })}>
              {t("cta")} <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Every kind of business. */}
      <section className="bg-ink py-16 text-paper md:py-24">
        <div className="container-x flex flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-4xl md:text-5xl">{t("sectorsTitle")}</h2>
            <p className="text-lg text-[#c9cbc4]">{t("sectorsSub", { count: CATEGORIES.length, groups: CATEGORY_GROUPS.length })}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_GROUPS.map((g) => (
              <li key={g.key}>
                <Link href={`/categorieen#sector-${g.key}`} className="photo-zoom group relative flex h-32 items-end overflow-hidden rounded-2xl p-4">
                  <Image src={photoForGroup(g.key).src} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover opacity-70" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                  <span className="relative font-display text-lg font-semibold">{locale === "en" ? g.en : g.nl}</span>
                  <span className="relative ml-2 text-sm text-[#c9cbc4]">{CATEGORIES.filter((c) => c.group === g.key).length}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>


      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <h2 className="text-3xl md:text-4xl">{t("vsTitle")}</h2>
          <ul className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
            {[t("vs1"), t("vs2"), t("vs3"), t("vs4")].map((v) => (
              <li key={v} data-spot className="flex items-start gap-3 bg-bg p-5">
                <X aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
                {v}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading title={t("feeTitle")} sub={t("feeBody")} />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [t("feePercentage"), t("feePercentageEx"), "8%"],
            [t("feeFixed"), t("feeFixedEx"), "€ 200"],
            [t("feeTiered"), t("feeTieredEx"), "€ 100 / € 250"],
          ].map(([title, ex, sample]) => (
            <div key={title} data-spot data-reveal className="flex flex-col gap-3 rounded-md border border-border bg-bg p-6">
              <span className="money text-3xl">{sample}</span>
              <p className="font-display text-xl font-semibold tracking-tight">{title}</p>
              <p className="text-sm text-subtle">{ex}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading title={t("calcTitle")} sub={t("calcSub")} />
        <BusinessCalculator labels={{ avg: t("calcAvg"), pct: t("calcPct"), min: t("calcMin"), result: t("calcResult"), note: t("calcResultNote"), share: t("calcShareOfJob") }} />
      </Section>

      <Section tone="surface">
        <SectionHeading title={t("processTitle")} />
        <ol className="flex flex-col border-t border-border">
          {[t("process1"), t("process2"), t("process3"), t("process4"), t("process5")].map((p, i) => (
            <li key={p} className="flex gap-6 border-b border-border py-5">
              <span className="font-mono text-sm text-subtle">0{i + 1}</span>
              <span className="text-lg">{p}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div data-spot className="flex flex-col gap-4 rounded-md border-2 border-olive p-6 md:p-10 dark:border-accent">
            <p className="eyebrow">Art. 6</p>
            <h2 className="text-3xl">{t("clauseTitle")}</h2>
            <p className="leading-relaxed text-subtle">{t("clauseBody")}</p>
            <Link href="/voorwaarden/bedrijven" className="text-sm underline underline-offset-4">{t("clauseNote")}</Link>
          </div>
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl">{t("boostTitle")}</h2>
              <p className="text-subtle">{t("boostBody")}</p>
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="text-2xl">{t("excludedTitle")}</h2>
              <p className="text-subtle">{t("excludedBody")}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-3xl md:text-4xl">FAQ</h2>
            <Link href="/aanmelden/bedrijf" className={buttonVariants({ variant: "primary" })}>{t("cta")}</Link>
          </div>
          <FaqList items={FAQ[locale].business} />
        </div>
      </Section>
    </>
  );
}
