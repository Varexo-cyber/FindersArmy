import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { BusinessCalculator } from "@/components/marketing/business-calculator";
import { FaqList, JsonLd, faqJsonLd } from "@/components/marketing/faq-list";
import { FAQ } from "@/content/faq";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "business", "/bedrijven");
}

export default async function BusinessPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const t = await getTranslations("business");
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ[locale].business)} />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} sub={t("sub")}>
        <div className="flex flex-col gap-2">
          <Link href="/aanmelden/bedrijf" className={buttonVariants({ variant: "primary", size: "xl", className: "self-start" })}>
            {t("cta")} <ArrowRight aria-hidden />
          </Link>
          <span className="font-mono text-xs text-subtle">{t("ctaNote")}</span>
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <h2 className="text-3xl md:text-4xl">{t("vsTitle")}</h2>
          <ul className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2">
            {[t("vs1"), t("vs2"), t("vs3"), t("vs4")].map((v) => (
              <li key={v} className="flex items-start gap-3 bg-bg p-5">
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
            <div key={title} className="flex flex-col gap-3 rounded-md border border-border bg-bg p-6">
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
          <div className="flex flex-col gap-4 rounded-md border-2 border-olive p-6 md:p-10 dark:border-accent">
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
