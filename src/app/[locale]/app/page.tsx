import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase, Crosshair } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/server/session";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { robots: { index: false } };

/** Entry point after login: send each user to the side of the product they use. */
export default async function AppIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/app");
  if (user.roles.includes("ADMIN") && user.adminRole) redirect({ href: "/admin", locale });
  if (user.memberships.length > 0 && !user.finderProfile) redirect({ href: "/app/bedrijf", locale });
  if (user.finderProfile && user.memberships.length === 0) redirect({ href: "/app/finder", locale });
  const t = await getTranslations("auth");
  const options = [
    { href: user.finderProfile ? "/app/finder" : "/aanmelden/finder", title: t("chooseFinder"), sub: t("chooseFinderSub"), Icon: Crosshair },
    { href: user.memberships.length ? "/app/bedrijf" : "/aanmelden/bedrijf", title: t("chooseBusiness"), sub: t("chooseBusinessSub"), Icon: Briefcase },
  ];
  return (
    <main id="main" className="container-x flex min-h-dvh flex-col items-start justify-center gap-8 py-16">
      <Logo />
      <h1 className="text-4xl md:text-5xl">{t("chooseTitle")}</h1>
      <div className="grid w-full max-w-3xl gap-4 md:grid-cols-2">
        {options.map(({ href, title, sub, Icon }) => (
          <Link key={href} href={href} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-6 transition-colors duration-150 hover:border-fg">
            <Icon aria-hidden className="size-6" strokeWidth={1.5} />
            <span className="eyebrow">{sub}</span>
            <span className="font-display text-2xl font-semibold tracking-tight">{title}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
