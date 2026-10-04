import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/app/app-shell";
import { businessNav, switchLink } from "@/components/app/nav-config";
import { requireBusiness } from "@/lib/server/session";
import { db } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export default async function BusinessLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user, business } = await requireBusiness();
  const newLeads = await db.lead.count({ where: { campaign: { businessId: business.id }, status: "NEW" } });
  return (
    <AppShell userId={user.id} userName={business.name} context={locale === "en" ? "Business" : "Bedrijf"} nav={await businessNav(newLeads)} switchTo={await switchLink(user, "business")}>
      {children}
    </AppShell>
  );
}
