import { getTranslations, setRequestLocale } from "next-intl/server";
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
      <PageHero eyebrow={t("eyebrow")} title={t("title")} />
      <Section>
        <div className="flex flex-col gap-16">
          {groups.map((g) => (
            <section key={g} id={g} className="grid gap-6 md:grid-cols-[1fr_2.5fr]">
              <h2 className="text-2xl md:text-3xl">{t(`groups.${g}`)}</h2>
              <FaqList items={FAQ[locale][g]} />
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
