import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/app/app-shell";
import type { NavItem } from "@/components/app/app-nav";
import { requireAdmin } from "@/lib/server/session";
import { db } from "@/lib/server/db";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

// The admin is an internal tool for the Dutch team and is intentionally Dutch-only.
export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireAdmin();
  const [pendingBusinesses, openDisputes, openReports, requested, flagged] = await Promise.all([
    db.business.count({ where: { status: { in: ["PENDING_REVIEW", "UNDER_REVIEW"] } } }),
    db.dispute.count({ where: { status: "OPEN" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.payout.count({ where: { status: "REQUESTED" } }),
    db.lead.count({ where: { status: "FRAUD" } }),
  ]);
  const nav: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: "LayoutGrid", exact: true },
    { href: "/admin/bedrijven", label: "Bedrijven", icon: "Briefcase", badge: pendingBusinesses },
    { href: "/admin/campagnes", label: "Campagnes", icon: "Megaphone" },
    { href: "/admin/finders", label: "Finders", icon: "Users" },
    { href: "/admin/leads", label: "Leads", icon: "Inbox", badge: flagged },
    { href: "/admin/geschillen", label: "Geschillen & meldingen", icon: "AlertTriangle", badge: openDisputes + openReports },
    { href: "/admin/facturen", label: "Facturen", icon: "FileText" },
    { href: "/admin/uitbetalingen", label: "Uitbetalingen", icon: "BadgeEuro", badge: requested },
    { href: "/admin/instellingen", label: "Instellingen", icon: "Settings" },
    { href: "/admin/audit", label: "Audit log", icon: "ScrollText" },
  ];
  const mobile = nav.filter((n) => ["/admin", "/admin/bedrijven", "/admin/leads", "/admin/geschillen", "/admin/uitbetalingen"].includes(n.href));
  return (
    <AppShell userId={user.id} userName={`${user.name ?? user.email} · ${user.adminRole === "SUPER_ADMIN" ? "Super admin" : "Support"}`} context="Admin" nav={nav} mobileNav={mobile}>
      {children}
    </AppShell>
  );
}
