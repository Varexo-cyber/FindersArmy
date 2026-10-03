import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/marketing/legal-page";
import { TermsBusinessNl } from "@/content/legal/nl";
import { TermsBusinessEn } from "@/content/legal/en";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, null, "/voorwaarden/bedrijven", { title: locale === "en" ? "Terms for businesses" : "Voorwaarden voor bedrijven" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage title={locale === "en" ? "Terms for businesses" : "Voorwaarden voor bedrijven"}>{locale === "en" ? <TermsBusinessEn /> : <TermsBusinessNl />}</LegalPage>;
}
