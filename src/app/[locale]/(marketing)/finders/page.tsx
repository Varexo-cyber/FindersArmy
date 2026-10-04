import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Insignia } from "@/components/brand/insignia";
import { PHOTOS } from "@/content/photos";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { CategoryGrid } from "@/components/marketing/category-grid";
import { FaqList, JsonLd, faqJsonLd } from "@/components/marketing/faq-list";
import { FAQ } from "@/content/faq";
import { allCategoryExamples } from "@/lib/examples";
import { DEFAULT_RANKS } from "@/lib/ranks";
import { pageMetadata } from "@/lib/metadata";
import { formatEuroShort } from "@/lib/money";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "finders", "/finders");
}

export default async function FindersPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const t = await getTranslations("finders");
  const tr = await getTranslations("ranks");
  const examples = allCategoryExamples();
  const best = examples.reduce((m, e) => (e.finderCents > m.finderCents ? e : m), examples[0]!);
  const topShare = DEFAULT_RANKS[DEFAULT_RANKS.length - 1]!.shareBps / 100;
  const steps = [t("how1"), t("how2"), t("how3"), t("how4"), t("how5")];
  return (
    <>
      <JsonLd data={faqJsonLd(FAQ[locale].finders)} />
      <PageHero photo={PHOTOS.meisjeLacht} locale={locale}
        eyebrow={t("eyebrow")}
        title={t("title")}
        sub={t("sub")}
        aside={
          <div data-spot className="flex flex-col gap-5 rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md md:p-8">
            <p className="flex items-baseline gap-3">
              <span className="money text-signal text-7xl font-semibold md:text-8xl">{topShare}%</span>
            </p>
            <p className="text-lg text-[#c9cbc4]">{t("asideShare")}</p>
            <dl className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-[#9a9d94]">{t("asideBest")}</dt>
                <dd className="money text-2xl text-signal" data-count={best.finderCents}>{formatEuroShort(best.finderCents, locale)}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-[#9a9d94]">{t("asideCats")}</dt>
                <dd className="money text-2xl text-paper">{examples.length}</dd>
              </div>
            </dl>
            <p className="flex items-center gap-2 text-sm text-[#c9cbc4]"><Check aria-hidden className="size-4 text-signal" />{t("asideFree")}</p>
          </div>
        }
      >
        <Link href="/aanmelden/finder" className={buttonVariants({ variant: "primary", size: "xl", className: "self-start" })}>
          {t("cta")} <ArrowRight aria-hidden />
        </Link>
      </PageHero>

      <Section>
        <SectionHeading title={t("howTitle")} />
        <ol className="grid gap-3 md:grid-cols-5">
          {steps.map((s, i) => (
            <li key={i} data-spot data-reveal style={{ transitionDelay: `${i * 60}ms` }} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-signal font-mono text-sm font-semibold text-ink">{i + 1}</span>
              <p>{s}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="surface">
        <SectionHeading title={t("earnTitle")} sub={t("earnSub")} />
        <CategoryGrid locale={locale} earnLabel={t("earnYou")} />
      </Section>

      <Section>
        <SectionHeading title={t("ranksTitle")} sub={t("ranksSub")} />
        <ol className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          {DEFAULT_RANKS.map((r, i) => (
            <li key={r.key} data-spot data-reveal style={{ transitionDelay: `${i * 70}ms` }} className={cn("flex flex-col gap-4 rounded-lg border p-5", i === DEFAULT_RANKS.length - 1 ? "border-signal bg-ink text-paper [--subtle:#a9aca2]" : "border-border bg-bg")}>
              <Insignia rank={r.key} className={cn("size-12", i === DEFAULT_RANKS.length - 1 ? "text-signal" : "text-olive dark:text-accent")} />
              <p className="font-display text-xl font-semibold tracking-tight">{tr(r.key)}</p>
              <div className="flex flex-col gap-1 font-mono text-sm">
                <span>{r.minPaidDeals}+ <span className="text-subtle">{t("rankDeals")}</span></span>
                <span className="text-2xl font-semibold">{(r.shareBps / 100).toLocaleString(locale)}% <span className="text-sm text-subtle">{t("rankShare")}</span></span>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="surface">
        <div className="grid gap-12 md:grid-cols-2">
          <div data-spot className="flex flex-col gap-4 rounded-lg border border-border bg-bg p-6 md:p-8">
            <h2 className="text-3xl md:text-4xl">{t("payoutTitle")}</h2>
            <p className="text-subtle leading-relaxed">{t("payoutBody")}</p>
          </div>
          <div data-spot className="flex flex-col gap-4 rounded-lg border border-border bg-bg p-6 md:p-8">
            <h2 className="text-3xl md:text-4xl">{t("bonusTitle")}</h2>
            <ul className="flex flex-col gap-3">
              {[t("bonusFirst"), t("bonusRepeat"), t("bonusInvite")].map((b) => (
                <li key={b} className="flex gap-3 text-subtle"><Check aria-hidden className="mt-1 size-4 shrink-0 rounded-full bg-signal p-0.5 text-ink" />{b}</li>
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
