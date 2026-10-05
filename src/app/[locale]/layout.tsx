import { HydrationMark } from "@/components/layout/hydration-mark";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { themeScript } from "@/components/theme-toggle";
import { siteUrl } from "@/lib/site";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("defaultTitle"), template: `%s · FindersArmy` },
    description: t("defaultDescription"),
    applicationName: "FindersArmy",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "FindersArmy", statusBarStyle: "black-translucent" },
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/apple-icon.png" },
    openGraph: { siteName: "FindersArmy", locale: locale === "en" ? "en_GB" : "nl_NL", type: "website" },
    twitter: { card: "summary_large_image" },
    alternates: { languages: { nl: "/", en: "/en" } },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F3EE" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0F0C" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });
  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
          <script defer data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN} src="https://plausible.io/js/script.js" />
        ) : null}
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-fg focus:px-4 focus:py-2 focus:text-bg">
          {t("skip")}
        </a>
        <NextIntlClientProvider>
          {children}
          <AssistantWidget />
            <HydrationMark />
        </NextIntlClientProvider>
        <script src="/fx.js" defer />
        <script src="/motion.js" defer />
        <ServiceWorker />
      </body>
    </html>
  );
}

function ServiceWorker() {
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
      }}
    />
  );
}
