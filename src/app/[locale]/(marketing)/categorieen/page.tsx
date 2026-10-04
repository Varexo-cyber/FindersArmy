import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryGrid } from "@/components/marketing/category-grid";
import { PHOTOS } from "@/content/photos";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { CATEGORIES, EXCLUDED_CATEGORIES } from "@/content/categories";
import { liveCampaignCounts } from "@/lib/server/public-stats";
import { pageMetadata } from "@/lib/metadata";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "categories", "/categorieen");
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const t = await getTranslations("categories");
  const counts = await liveCampaignCounts();
  return (
    <>
      <PageHero photo={PHOTOS.timmerman} locale={locale} eyebrow={t("eyebrow")} title={t("title")} sub={t("sub", { count: CATEGORIES.length })} />
      <Section>
        <CategoryGrid locale={locale} earnLabel={t("exampleEarning")} liveLabel={t("liveCampaigns").toLowerCase()} counts={counts} />
      </Section>
      <Section tone="surface">
        <SectionHeading title={t("excludedTitle")} sub={t("excludedSub")} />
        <ul className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
          {EXCLUDED_CATEGORIES.map((c) => (
            <li key={c.slug} data-spot className="flex flex-col gap-1 bg-bg p-5">
              <span className="font-medium">{locale === "en" ? c.nameEn : c.nameNl}</span>
              <span className="text-sm text-subtle">{locale === "en" ? c.reasonEn : c.reasonNl}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
