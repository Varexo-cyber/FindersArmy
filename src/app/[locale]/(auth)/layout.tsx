import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitch } from "@/components/layout/locale-switch";

export default async function AuthLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="container-x flex h-16 items-center justify-between">
          <Link href="/" aria-label="FindersArmy home">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <Suspense>
              <LocaleSwitch label={t("language")} code={t("languageCode")} />
            </Suspense>
            <ThemeToggle label={t("theme")} />
          </div>
        </div>
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
