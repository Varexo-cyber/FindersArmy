import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/marketing/legal-page";
import { TermsFindersNl } from "@/content/legal/nl";
import { TermsFindersEn } from "@/content/legal/en";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, null, "/voorwaarden/finders", { title: locale === "en" ? "Terms for Finders" : "Voorwaarden voor Finders" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage title={locale === "en" ? "Terms for Finders" : "Voorwaarden voor Finders"}>{locale === "en" ? <TermsFindersEn /> : <TermsFindersNl />}</LegalPage>;
}
