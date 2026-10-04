import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Bell, LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleSwitch } from "@/components/layout/locale-switch";
import { signOut } from "@/auth";
import { db } from "@/lib/server/db";
import { BottomNav, SideNav, type NavItem } from "./app-nav";

export async function AppShell({
  userId,
  userName,
  context,
  nav,
  mobileNav,
  switchTo,
  children,
}: {
  userId: string;
  userName: string;
  context: string;
  nav: NavItem[];
  mobileNav?: NavItem[];
  switchTo?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const unread = await db.notification.count({ where: { userId, readAt: null } });

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-border px-3 py-5 md:flex">
        <Link href="/" className="px-3" aria-label="FindersArmy home">
          <Logo />
        </Link>
        <div className="px-3">
          <p className="eyebrow">{context}</p>
          <p className="truncate text-sm font-medium">{userName}</p>
        </div>
        <SideNav items={nav} />
        <div className="mt-auto flex flex-col gap-2 px-1">
          {switchTo ? (
            <Link href={switchTo.href} className="rounded-md px-2 py-2 text-xs text-subtle hover:text-fg">
              {switchTo.label} →
            </Link>
          ) : null}
          <div className="flex items-center gap-1">
            <Suspense>
              <LocaleSwitch label={t("language")} code={t("languageCode")} />
            </Suspense>
            <ThemeToggle label={t("theme")} />
            <form action={logout} className="ml-auto">
              <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-xs text-subtle hover:text-fg">
                <LogOut aria-hidden className="size-4" /> {tc("logout")}
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-bg/95 px-4 backdrop-blur-[2px] md:h-16 md:px-8">
          <Link href="/" className="md:hidden" aria-label="FindersArmy home">
            <Logo withWordmark={false} />
          </Link>
          <span className="eyebrow md:hidden">{context}</span>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/app/meldingen"
              aria-label={`${tc("notifications")}${unread ? ` (${unread})` : ""}`}
              className="relative inline-flex size-9 items-center justify-center rounded-md text-subtle hover:text-fg"
            >
              <Bell aria-hidden className="size-4" />
              {unread ? (
                <span className="absolute top-1 right-1 min-w-4 rounded-sm bg-signal px-1 text-center font-mono text-[10px] leading-4 text-ink">{unread > 9 ? "9+" : unread}</span>
              ) : null}
            </Link>
            <div className="flex items-center md:hidden">
              <ThemeToggle label={t("theme")} />
              <form action={logout}>
                <button type="submit" aria-label={tc("logout")} className="inline-flex size-9 items-center justify-center text-subtle">
                  <LogOut aria-hidden className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-16">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <BottomNav items={mobileNav ?? nav} />
    </div>
  );
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        {sub ? <p className="text-subtle">{sub}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
