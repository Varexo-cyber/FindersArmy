import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/marketing/legal-page";
import { CookiesNl } from "@/content/legal/nl";
import { CookiesEn } from "@/content/legal/en";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, null, "/cookies", { title: locale === "en" ? "Cookie statement" : "Cookieverklaring" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage title={locale === "en" ? "Cookie statement" : "Cookieverklaring"}>{locale === "en" ? <CookiesEn /> : <CookiesNl />}</LegalPage>;
}
