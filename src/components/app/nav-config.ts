import "server-only";
import { getTranslations } from "next-intl/server";
import type { NavItem } from "./app-nav";
import type { CurrentUser } from "@/lib/server/session";

export async function finderNav(): Promise<NavItem[]> {
  const t = await getTranslations("finderApp");
  return [
    { href: "/app/finder", label: t("navDiscover"), icon: "Search", exact: true },
    { href: "/app/finder/klanten", label: t("navCustomers"), icon: "Users" },
    { href: "/app/finder/saldo", label: t("navBalance"), icon: "Wallet" },
    { href: "/app/finder/rang", label: t("navRank"), icon: "Medal" },
    { href: "/app/finder/profiel", label: t("navProfile"), icon: "User" },
  ];
}

export async function businessNav(newLeads = 0): Promise<NavItem[]> {
  const t = await getTranslations("businessApp");
  return [
    { href: "/app/bedrijf", label: t("navOverview"), icon: "LayoutGrid", exact: true },
    { href: "/app/bedrijf/leads", label: t("navLeads"), icon: "Inbox", badge: newLeads },
    { href: "/app/bedrijf/campagnes", label: t("navCampaigns"), icon: "Megaphone" },
    { href: "/app/bedrijf/facturen", label: t("navInvoices"), icon: "FileText" },
    { href: "/app/bedrijf/profiel", label: t("navProfile"), icon: "User" },
  ];
}

export async function switchLink(user: CurrentUser, current: "finder" | "business") {
  const locale = user.locale;
  void locale;
  if (current === "finder" && user.memberships.length) return { href: "/app/bedrijf", label: "Bedrijfsdashboard" };
  if (current === "business" && user.finderProfile) return { href: "/app/finder", label: "Finder-dashboard" };
  if (user.roles.includes("ADMIN")) return { href: "/admin", label: "Admin" };
  return undefined;
}
