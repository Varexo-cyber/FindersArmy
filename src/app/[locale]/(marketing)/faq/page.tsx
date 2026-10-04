import { getTranslations, setRequestLocale } from "next-intl/server";
import { PHOTOS } from "@/content/photos";
import { PageHero, Section } from "@/components/marketing/section";
import { FaqList, JsonLd, faqJsonLd } from "@/components/marketing/faq-list";
import { FAQ, type FaqGroup } from "@/content/faq";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "faq", "/faq");
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const groups: FaqGroup[] = ["finders", "business", "customers", "privacy"];
  return (
    <>
      <JsonLd data={faqJsonLd(groups.flatMap((g) => FAQ[locale][g]))} />
      <PageHero photo={PHOTOS.jongenLacht} locale={locale} eyebrow={t("eyebrow")} title={t("title")}>
        <nav aria-label={t("title")} className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <a key={g} href={`#${g}`} data-spot className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-paper transition-colors duration-150 hover:border-signal">
              {t(`groups.${g}`)}
            </a>
          ))}
        </nav>
      </PageHero>
      <Section>
        <div className="flex flex-col gap-16">
          {groups.map((g) => (
            <section key={g} id={g} className="grid scroll-mt-24 gap-6 md:grid-cols-[1fr_2.5fr]">
              <h2 className="text-2xl md:sticky md:top-24 md:self-start md:text-3xl">{t(`groups.${g}`)}</h2>
              <FaqList items={FAQ[locale][g]} />
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
