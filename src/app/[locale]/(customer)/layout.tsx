import { setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function CustomerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="container-x flex h-14 items-center justify-between">
          <a href="/" aria-label="FindersArmy"><Logo className="[&>span]:text-base" /></a>
          <ThemeToggle label={locale === "en" ? "Toggle theme" : "Wissel thema"} />
        </div>
      </header>
      <main id="main" className="flex-1">{children}</main>
    </div>
  );
}
