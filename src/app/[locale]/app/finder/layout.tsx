import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/app/app-shell";
import { finderNav, switchLink } from "@/components/app/nav-config";
import { requireFinder } from "@/lib/server/session";
import { recordFinderDevice } from "@/lib/server/actions/finder";

export const dynamic = "force-dynamic";

export default async function FinderLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user, finder } = await requireFinder();
  await recordFinderDevice(finder.id);
  return (
    <AppShell userId={user.id} userName={user.name ?? user.email} context="Finder" nav={await finderNav()} switchTo={await switchLink(user, "finder")}>
      {children}
    </AppShell>
  );
}
