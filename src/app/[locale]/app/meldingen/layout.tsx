import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/app/app-shell";
import { businessNav, finderNav } from "@/components/app/nav-config";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function NotificationsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser("/app/meldingen");
  const isFinder = Boolean(user.finderProfile);
  return (
    <AppShell userId={user.id} userName={user.name ?? user.email} context={isFinder ? "Finder" : locale === "en" ? "Business" : "Bedrijf"} nav={isFinder ? await finderNav() : await businessNav()}>
      {children}
    </AppShell>
  );
}
