import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHero, Section, SectionHeading } from "@/components/marketing/section";
import { MUNICIPALITIES, PROVINCES, municipalitiesIn } from "@/content/regions";
import { PHOTOS } from "@/content/photos";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "regions" });
  return pageMetadata(locale, null, "/regio", { title: t("title"), description: t("sub", { count: MUNICIPALITIES.length }) });
}

export default async function RegionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = (await params).locale === "en" ? "en" : "nl";
  setRequestLocale(locale);
  const t = await getTranslations("regions");
  const nf = new Intl.NumberFormat(locale === "en" ? "en-GB" : "nl-NL");
  const biggest = [...MUNICIPALITIES].sort((a, b) => b.population - a.population).slice(0, 40);
  return (
    <>
      <PageHero photo={PHOTOS.groep} locale={locale} eyebrow={t("eyebrow")} title={t("title")} sub={t("sub", { count: MUNICIPALITIES.length })} />
      <Section>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROVINCES.map((p) => {
            const list = municipalitiesIn(p.key);
            const pop = list.reduce((s, m) => s + m.population, 0);
            return (
              <li key={p.key}>
                <Link href={`/regio/${p.key}`} data-spot className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-6 hover:border-fg">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl">{p.name}</h2>
                    <ArrowUpRight aria-hidden className="size-5 text-subtle group-hover:text-fg" />
                  </div>
                  <p className="text-sm text-subtle">
                    {t("municipalities", { count: list.length })} · {t("inhabitants", { count: nf.format(pop) })}
                  </p>
                  <p className="mt-auto text-sm">{list.slice(0, 4).map((m) => m.name).join(" · ")}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>
      <Section tone="surface">
        <SectionHeading title={t("biggest")} />
        <ul className="flex flex-wrap gap-2">
          {biggest.map((m) => (
            <li key={`${m.province}-${m.slug}`}>
              <Link href={`/regio/${m.province}/${m.slug}`} className="inline-flex rounded-full border border-border bg-bg px-4 py-2 text-sm hover:border-fg">
                {m.name}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
