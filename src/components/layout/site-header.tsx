import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitch } from "./locale-switch";
import { MobileMenu } from "./mobile-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const items = [
    { href: "/finders", label: t("finders") },
    { href: "/bedrijven", label: t("business") },
    { href: "/hoe-het-werkt", label: t("how") },
    { href: "/categorieen", label: t("categories") },
    { href: "/regio", label: t("regions") },
    { href: "/faq", label: t("faq") },
  ];
  // Marketing pages stay static (fast, cacheable): no session lookup here. /login forwards
  // signed-in users straight to their dashboard.
  const cta = { href: "/aanmelden/finder", label: t("start") };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-[2px]">
      <div className="container-x flex h-16 items-center gap-6">
        <Link href="/" aria-label="FindersArmy home" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Hoofdmenu" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-md px-3 py-2 text-sm text-subtle transition-colors duration-150 hover:text-fg">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Suspense>
            <LocaleSwitch label={t("language")} code={t("languageCode")} />
          </Suspense>
          <ThemeToggle label={t("theme")} />
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden md:inline-flex")}>
            {t("login")}
          </Link>
          <Link href={cta.href} className={cn(buttonVariants({ variant: "primary", size: "sm" }), "hidden md:inline-flex")}>
            {cta.label}
          </Link>
          <MobileMenu items={[...items, { href: "/login", label: t("login") }]} cta={cta} labels={{ open: t("menu"), close: t("close") }} />
        </div>
      </div>
    </header>
  );
}
