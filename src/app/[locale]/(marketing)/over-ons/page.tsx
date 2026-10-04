import { getTranslations, setRequestLocale } from "next-intl/server";
import { PHOTOS } from "@/content/photos";
import { PageHero, Section } from "@/components/marketing/section";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return pageMetadata((await params).locale, "about", "/over-ons");
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  return (
    <>
      <PageHero photo={PHOTOS.groep} locale={locale} eyebrow={t("eyebrow")} title={t("title")} />
      <Section>
        <div className="grid gap-12 md:grid-cols-[2fr_1fr]">
          <div className="flex max-w-2xl flex-col gap-6 text-lg leading-relaxed">
            <p>{t("p1")}</p>
            <p>{t("p2")}</p>
            <p>{t("p3")}</p>
          </div>
          <aside data-spot className="flex flex-col gap-3 self-start rounded-lg border border-signal/40 bg-ink p-6 text-paper [--subtle:#a9aca2]">
            <h2 className="text-xl">{t("statusTitle")}</h2>
            <p className="text-sm text-subtle">{t("statusBody")}</p>
          </aside>
        </div>
      </Section>
      <Section tone="surface">
        <h2 className="mb-8 text-3xl md:text-4xl">{t("principlesTitle")}</h2>
        <ul className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
          {[t("principle1"), t("principle2"), t("principle3"), t("principle4")].map((p, i) => (
            <li key={p} data-spot className="flex gap-4 bg-bg p-6">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-signal font-mono text-xs font-semibold text-ink">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
