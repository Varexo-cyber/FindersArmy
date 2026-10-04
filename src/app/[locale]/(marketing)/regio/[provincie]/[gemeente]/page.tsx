import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { FaqList, JsonLd, faqJsonLd } from "@/components/marketing/faq-list";
import { CategoryTiles } from "@/components/marketing/category-tiles";
import { municipality, neighbours, province } from "@/content/regions";
import { PHOTOS } from "@/content/photos";
import { liveCampaignsIn } from "@/lib/server/public-stats";
import { pageMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/site";

// 342 municipalities × 2 languages: rendered on first visit and cached, not at build time.
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; provincie: string; gemeente: string }> }) {
  const { locale, provincie, gemeente } = await params;
  const m = municipality(provincie, gemeente);
  if (!m) return {};
  const t = await getTranslations({ locale, namespace: "regions" });
  return pageMetadata(locale, null, `/regio/${m.province}/${m.slug}`, { title: t("cityTitle", { name: m.name }), description: t("citySub", { name: m.name }) });
}

export default async function MunicipalityPage({ params }: { params: Promise<{ locale: string; provincie: string; gemeente: string }> }) {
  const { provincie, gemeente } = await params;
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const m = municipality(provincie, gemeente);
  if (!m) notFound();
  const p = province(m.province)!;
  const t = await getTranslations("regions");
  const live = await liveCampaignsIn(m.name);
  const faq = [1, 2, 3].map((i) => ({ q: t(`faqQ${i}` as "faqQ1", { name: m.name }), a: t(`faqA${i}` as "faqA1", { name: m.name }) }));
  const near = neighbours(m, 12);
  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t("breadcrumb"), item: `${siteUrl()}/regio` },
            { "@type": "ListItem", position: 2, name: p.name, item: `${siteUrl()}/regio/${p.key}` },
            { "@type": "ListItem", position: 3, name: m.name, item: `${siteUrl()}/regio/${p.key}/${m.slug}` },
          ],
        }}
      />
      <PageHero photo={PHOTOS.vriendenLachen} locale={locale} eyebrow={`${p.name} · ${m.name}`} title={t("cityTitle", { name: m.name })} sub={t("citySub", { name: m.name })}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/aanmelden/finder" className={buttonVariants({ variant: "primary", size: "xl" })}>
            {locale === "en" ? "Start as a Finder" : "Begin als Finder"} <ArrowRight aria-hidden />
          </Link>
          <Link href="/aanmelden/bedrijf" className={buttonVariants({ variant: "outline", size: "xl", className: "border-white/30 text-paper hover:bg-white/10" })}>
            {t("cityBizCta")}
          </Link>
        </div>
        <p className="text-sm text-[#d6d8d0]">{t("cityLive", { count: live, name: m.name })}</p>
      </PageHero>

      <Section>
        <SectionHeading title={t("cityFinderTitle", { name: m.name })} sub={t("cityFinderSub")} />
        <CategoryTiles locale={locale} limit={8} />
      </Section>

      <section className="bg-ink py-16 text-paper md:py-24">
        <div className="container-x grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="flex flex-col gap-4">
            <h2 className="text-4xl md:text-5xl">{t("cityBizTitle", { name: m.name })}</h2>
            <p className="max-w-xl text-lg text-[#c9cbc4]">{t("cityBizBody", { name: m.name })}</p>
          </div>
          <Link href="/aanmelden/bedrijf" className={buttonVariants({ variant: "primary", size: "xl", className: "md:justify-self-end" })}>
            {t("cityBizCta")} <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 md:grid-cols-[1fr_1.6fr]">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl">{t("nearby", { province: p.name })}</h2>
            <ul className="flex flex-wrap gap-2">
              {near.map((n) => (
                <li key={n.slug}>
                  <Link href={`/regio/${p.key}/${n.slug}`} className="inline-flex rounded-full border border-border px-3.5 py-1.5 text-sm hover:border-fg">{n.name}</Link>
                </li>
              ))}
              <li>
                <Link href={`/regio/${p.key}`} className="inline-flex rounded-full bg-fg px-3.5 py-1.5 text-sm text-bg">{t("allMunicipalities", { name: p.name })}</Link>
              </li>
            </ul>
          </div>
          <FaqList items={faq} />
        </div>
      </Section>
    </>
  );
}
