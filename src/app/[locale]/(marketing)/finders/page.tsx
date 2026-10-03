import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Insignia } from "@/components/brand/insignia";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { FaqList, JsonLd, faqJsonLd } from "@/components/marketing/faq-list";
import { FAQ } from "@/content/faq";
import { allCategoryExamples } from "@/lib/examples";
import { DEFAULT_RANKS } from "@/lib/ranks";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "finders", "/finders");
}

export default async function FindersPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const t = await getTranslations("finders");
  const tr = await getTranslations("ranks");
  const examples = allCategoryExamples();
  const steps = [t("how1"), t("how2"), t("how3"), t("how4"), t("how5")];
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ[locale].finders)} />
      <PageHero eyebrow={t("eyebrow")} title={t("title")} sub={t("sub")}>
        <Link href="/aanmelden/finder" className={buttonVariants({ variant: "primary", size: "xl", className: "self-start" })}>
          {t("cta")} <ArrowRight aria-hidden />
        </Link>
      </PageHero>

      <Section>
        <SectionHeading title={t("howTitle")} />
        <ol className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-5">
          {steps.map((s, i) => (
            <li key={i} className="flex flex-col gap-3 bg-bg p-5">
              <span className="font-mono text-sm text-subtle">0{i + 1}</span>
              <p>{s}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="surface">
        <SectionHeading title={t("earnTitle")} sub={t("earnSub")} />
        <div className="overflow-x-auto rounded-md border border-border bg-bg">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="eyebrow px-4 py-3 font-normal">{locale === "en" ? "Category" : "Categorie"}</th>
                <th scope="col" className="eyebrow px-4 py-3 text-right font-normal">{t("earnJob")}</th>
                <th scope="col" className="eyebrow px-4 py-3 text-right font-normal">{t("earnFee")}</th>
                <th scope="col" className="eyebrow px-4 py-3 text-right font-normal">{t("earnYou")}</th>
              </tr>
            </thead>
            <tbody>
              {examples.map((e) => (
                <tr key={e.category.slug} className="border-b border-border last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    <Link href={`/categorieen/${e.category.slug}`} className="hover:underline">
                      {locale === "en" ? e.category.nameEn : e.category.nameNl}
                    </Link>
                  </th>
                  <td className="money px-4 py-3 text-right text-subtle"><Money cents={e.jobCents} short locale={locale} /></td>
                  <td className="money px-4 py-3 text-right text-subtle"><Money cents={e.feeCents} short locale={locale} /></td>
                  <td className="px-4 py-3 text-right"><Money cents={e.finderCents} short highlight locale={locale} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionHeading title={t("ranksTitle")} sub={t("ranksSub")} />
        <ol className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          {DEFAULT_RANKS.map((r) => (
            <li key={r.key} className="flex flex-col gap-4 rounded-md border border-border p-5">
              <Insignia rank={r.key} className="size-12 text-olive dark:text-accent" />
              <p className="font-display text-xl font-semibold tracking-tight">{tr(r.key)}</p>
              <div className="flex flex-col gap-1 font-mono text-sm">
                <span>{r.minPaidDeals}+ <span className="text-subtle">{t("rankDeals")}</span></span>
                <span className="text-lg">{(r.shareBps / 100).toLocaleString(locale)}% <span className="text-sm text-subtle">{t("rankShare")}</span></span>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="surface">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl">{t("payoutTitle")}</h2>
            <p className="text-subtle leading-relaxed">{t("payoutBody")}</p>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl">{t("bonusTitle")}</h2>
            <ul className="flex flex-col gap-3">
              {[t("bonusFirst"), t("bonusRepeat"), t("bonusInvite")].map((b) => (
                <li key={b} className="flex gap-3 text-subtle"><Check aria-hidden className="mt-1 size-4 shrink-0 text-fg" />{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl md:text-4xl">{t("rulesTitle")}</h2>
            <ul className="flex flex-col gap-2 text-subtle">
              {[t("rule1"), t("rule2"), t("rule3"), t("rule4")].map((r) => <li key={r}>— {r}</li>)}
            </ul>
          </div>
          <FaqList items={FAQ[locale].finders} />
        </div>
      </Section>
    </>
  );
}
