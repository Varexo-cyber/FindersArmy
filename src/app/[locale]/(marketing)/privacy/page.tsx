import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/marketing/legal-page";
import { PrivacyNl } from "@/content/legal/nl";
import { PrivacyEn } from "@/content/legal/en";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageMetadata(locale, null, "/privacy", { title: locale === "en" ? "Privacy statement" : "Privacyverklaring" });
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage title={locale === "en" ? "Privacy statement" : "Privacyverklaring"}>{locale === "en" ? <PrivacyEn /> : <PrivacyNl />}</LegalPage>;
}
