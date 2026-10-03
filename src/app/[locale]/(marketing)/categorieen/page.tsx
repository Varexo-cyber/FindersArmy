import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Money } from "@/components/ui/money";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { CATEGORIES, EXCLUDED_CATEGORIES } from "@/content/categories";
import { categoryExample } from "@/lib/examples";
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
      <PageHero eyebrow={t("eyebrow")} title={t("title")} sub={t("sub")} />
      <Section>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => {
            const ex = categoryExample(c);
            const live = counts[c.slug] ?? 0;
            return (
              <li key={c.slug}>
                <Link href={`/categorieen/${c.slug}`} className="group flex h-full flex-col gap-4 rounded-md border border-border p-5 transition-colors duration-150 hover:border-fg">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl">{locale === "en" ? c.nameEn : c.nameNl}</h2>
                    <ArrowUpRight aria-hidden className="size-4 text-subtle transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <p className="text-sm text-subtle">{locale === "en" ? c.descriptionEn : c.descriptionNl}</p>
                  <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
                    <div className="flex flex-col">
                      <span className="eyebrow">{t("exampleEarning")}</span>
                      <Money cents={ex.finderCents} short size="lg" highlight locale={locale} />
                    </div>
                    {live > 0 ? <span className="font-mono text-xs text-subtle">{live} {t("liveCampaigns").toLowerCase()}</span> : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>
      <Section tone="surface">
        <SectionHeading title={t("excludedTitle")} sub={t("excludedSub")} />
        <ul className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
          {EXCLUDED_CATEGORIES.map((c) => (
            <li key={c.slug} className="flex flex-col gap-1 bg-bg p-5">
              <span className="font-medium">{locale === "en" ? c.nameEn : c.nameNl}</span>
              <span className="text-sm text-subtle">{locale === "en" ? c.reasonEn : c.reasonNl}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
