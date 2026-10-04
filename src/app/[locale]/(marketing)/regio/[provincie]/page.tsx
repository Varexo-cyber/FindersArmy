import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { JsonLd } from "@/components/marketing/faq-list";
import { PROVINCES, municipalitiesIn, province } from "@/content/regions";
import { PHOTOS } from "@/content/photos";
import { pageMetadata } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => PROVINCES.map((p) => ({ locale, provincie: p.key })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; provincie: string }> }) {
  const { locale, provincie } = await params;
  const p = province(provincie);
  if (!p) return {};
  const t = await getTranslations({ locale, namespace: "regions" });
  return pageMetadata(locale, null, `/regio/${p.key}`, { title: t("provinceTitle", { name: p.name }), description: t("provinceSub", { name: p.name }) });
}

export default async function ProvincePage({ params }: { params: Promise<{ locale: string; provincie: string }> }) {
  const { provincie } = await params;
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const p = province(provincie);
  if (!p) notFound();
  const t = await getTranslations("regions");
  const list = municipalitiesIn(p.key);
  const alphabetical = [...list].sort((a, b) => a.name.localeCompare(b.name, "nl"));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t("breadcrumb"), item: `${siteUrl()}/regio` },
            { "@type": "ListItem", position: 2, name: p.name, item: `${siteUrl()}/regio/${p.key}` },
          ],
        }}
      />
      <PageHero photo={PHOTOS.vriendenStraat} locale={locale} eyebrow={t("breadcrumb")} title={t("provinceTitle", { name: p.name })} sub={t("provinceSub", { name: p.name })}>
        <div className="flex flex-wrap gap-2">
          {list.slice(0, 6).map((m) => (
            <Link key={m.slug} href={`/regio/${p.key}/${m.slug}`} className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm text-paper backdrop-blur hover:bg-white/20">
              {m.name}
            </Link>
          ))}
        </div>
      </PageHero>
      <Section>
        <SectionHeading title={t("allMunicipalities", { name: p.name })} sub={t("municipalities", { count: list.length })} />
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
          {alphabetical.map((m) => (
            <li key={m.slug}>
              <Link href={`/regio/${p.key}/${m.slug}`} className="block rounded-md px-2 py-1.5 hover:bg-surface">
                {m.name}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
