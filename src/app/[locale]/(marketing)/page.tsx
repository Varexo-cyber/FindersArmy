import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Section, SectionHeading } from "@/components/marketing/section";
import { CampaignCardFragment, FeeFragment, Frame, LeadFragment, ShareFragment } from "@/components/marketing/fragments";
import { FaqList, JsonLd, faqJsonLd } from "@/components/marketing/faq-list";
import { CATEGORIES } from "@/content/categories";
import { FAQ } from "@/content/faq";
import { HOME_EXAMPLE } from "@/lib/examples";
import { formatCents } from "@/lib/money";
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
  const tc = await getTranslations("common");
  const ts = await getTranslations("status");
  const paidOut = await paidOutTotalCents();
  const faq = [...FAQ[locale].finders.slice(0, 3), ...FAQ[locale].business.slice(0, 3)];
  const ex = HOME_EXAMPLE;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "FindersArmy",
          url: siteUrl(),
          logo: `${siteUrl()}/icon.svg`,
          email: "hallo@findersarmy.com",
          areaServed: "NL",
        }}
      />
      <JsonLd data={faqJsonLd(faq)} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
        <div className="container-x relative grid gap-12 py-14 md:grid-cols-[1.25fr_1fr] md:items-center md:py-24">
          <div className="flex flex-col gap-6">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="text-[3.1rem] leading-[0.95] md:text-[5.5rem]">{t("heroTitle")}</h1>
            <p className="max-w-xl text-lg text-subtle md:text-xl">{t("heroSub")}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/aanmelden/finder" className={buttonVariants({ variant: "primary", size: "xl" })}>
                {t("ctaFinder")} <ArrowRight aria-hidden />
              </Link>
              <Link href="/bedrijven" className={buttonVariants({ variant: "outline", size: "xl" })}>
                {t("ctaBusiness")}
              </Link>
            </div>
            <p className="font-mono text-xs text-subtle">{t("heroNote")}</p>
          </div>
          <div className="relative">
            <Frame label="findersarmy.com/app/finder" className="relative z-10 bg-bg">
              <CampaignCardFragment
                business={t("mockShareTitle")}
                category={locale === "en" ? "Painters" : "Schilders"}
                region="Westland"
                earnLabel={tc("earnUpTo")}
                cents={ex.finderCents}
              />
            </Frame>
            <Frame className="relative z-20 mt-3 ml-auto w-[80%] bg-bg md:absolute md:-bottom-8 md:-left-10 md:mt-0 md:w-[62%]">
              <FeeFragment label={t("mockFeeLabel")} cents={ex.finderCents} status={ts("PAID")} />
            </Frame>
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

      {/* Steps */}
      <Section>
        <SectionHeading eyebrow={t("stepsEyebrow")} title={t("stepsTitle")} />
        <ol className="grid gap-6 md:grid-cols-3">
          {[
            { title: t("step1Title"), body: t("step1Body"), frag: <ShareFragment message={t("mockShareMessage")} /> },
            { title: t("step2Title"), body: t("step2Body"), frag: <LeadFragment name={t("mockLeadName")} text={t("mockLeadText")} status={ts("QUOTE_SENT")} /> },
            { title: t("step3Title"), body: t("step3Body"), frag: <FeeFragment label={t("mockFeeLabel")} cents={ex.finderCents} status={ts("WON")} /> },
          ].map((s, i) => (
            <li key={i} className="flex flex-col gap-5">
              <Frame className="min-h-44 bg-bg">{s.frag}</Frame>
              <div className="flex gap-4">
                <span className="font-mono text-sm text-subtle">0{i + 1}</span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl">{s.title}</h3>
                  <p className="text-subtle">{s.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Calculation */}
      <Section tone="surface">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <SectionHeading eyebrow={t("calcEyebrow")} title={t("calcTitle")} sub={t("calcNote")} className="mb-0 md:mb-0" />
          <dl className="divide-y divide-border rounded-md border border-border bg-bg font-mono text-sm">
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
            <div className="flex items-center justify-between px-5 py-5">
              <dt className="font-sans font-medium">{t("calcYou")}</dt>
              <dd>
                <Money cents={ex.finderCents} size="xl" highlight locale={locale} />
              </dd>
            </div>
          </dl>
        </div>
      </Section>

      {/* Finders + Business */}
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-6 rounded-md border border-border p-6 md:p-10">
            <p className="eyebrow">{t("findersEyebrow")}</p>
            <h2 className="text-3xl md:text-4xl">{t("findersTitle")}</h2>
            <p className="text-subtle">{t("findersBody")}</p>
            <ul className="flex flex-col gap-3">
              {[t("findersPoint1"), t("findersPoint2"), t("findersPoint3")].map((p) => (
                <li key={p} className="flex gap-3">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-olive dark:text-accent" />
                  {p}
                </li>
              ))}
            </ul>
            <Link href="/finders" className={cn(buttonVariants({ variant: "solid" }), "mt-auto self-start")}>
              {t("findersCta")} <ArrowRight aria-hidden />
            </Link>
          </div>
          <div className="flex flex-col gap-6 rounded-md bg-ink p-6 text-paper md:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#9a9d94]">{t("businessEyebrow")}</p>
            <h2 className="text-3xl md:text-4xl">{t("businessTitle")}</h2>
            <p className="text-[#c9cbc4]">{t("businessBody")}</p>
            <ul className="flex flex-col gap-3">
              {[t("businessPoint1"), t("businessPoint2"), t("businessPoint3")].map((p) => (
                <li key={p} className="flex gap-3">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-signal" />
                  {p}
                </li>
              ))}
            </ul>
            <Link href="/bedrijven" className={cn(buttonVariants({ variant: "primary" }), "mt-auto self-start")}>
              {t("businessCta")} <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
      </Section>

      {/* Categories */}
      <Section tone="surface">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <SectionHeading eyebrow={t("categoriesEyebrow")} title={t("categoriesTitle")} className="mb-0 md:mb-0" />
          <Link href="/categorieen" className={buttonVariants({ variant: "outline" })}>
            {t("categoriesAll")} <ArrowRight aria-hidden />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="bg-bg">
              <Link href={`/categorieen/${c.slug}`} className="flex h-full min-h-16 items-center px-4 py-3 text-sm font-medium transition-colors duration-150 hover:bg-surface-2">
                {locale === "en" ? c.nameEn : c.nameNl}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col items-start gap-4">
            <h2 className="text-3xl md:text-4xl">{t("faqTitle")}</h2>
            <Link href="/faq" className={buttonVariants({ variant: "outline" })}>
              {t("faqAll")}
            </Link>
          </div>
          <FaqList items={faq} />
        </div>
      </Section>

      {/* CTA */}
      <section className="container-x">
        <div className="flex flex-col gap-6 rounded-md border border-border bg-surface p-8 md:flex-row md:items-center md:justify-between md:p-14">
          <div className="flex max-w-xl flex-col gap-3">
            <h2 className="text-3xl md:text-5xl">{t("ctaTitle")}</h2>
            <p className="text-subtle">{t("ctaBody")}</p>
          </div>
          <Link href="/aanmelden/finder" className={cn(buttonVariants({ variant: "primary", size: "xl" }), "shrink-0")}>
            {t("ctaFinder")} <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
