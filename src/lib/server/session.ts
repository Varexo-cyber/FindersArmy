import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { db } from "./db";

export const currentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { finderProfile: true, memberships: { include: { business: true } } },
  });
  if (!user || user.deletedAt) return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function requireUser(next?: string): Promise<CurrentUser> {
  const user = await currentUser();
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: next ? `/login?next=${encodeURIComponent(next)}` : "/login", locale });
  }
  return user;
}

export async function requireFinder() {
  const user = await requireUser("/app/finder");
  if (!user.finderProfile) {
    const locale = await getLocale();
    return redirect({ href: "/aanmelden/finder", locale });
  }
  return { user, finder: user.finderProfile };
}

export async function requireBusiness() {
  const user = await requireUser("/app/bedrijf");
  const membership = user.memberships[0];
  if (!membership) {
    const locale = await getLocale();
    return redirect({ href: "/aanmelden/bedrijf", locale });
  }
  return { user, business: membership.business, membership };
}

export async function requireAdmin(level: "SUPPORT" | "SUPER_ADMIN" = "SUPPORT") {
  const user = await requireUser("/admin");
  const isAdmin = user.roles.includes("ADMIN") && user.adminRole;
  if (!isAdmin || (level === "SUPER_ADMIN" && user.adminRole !== "SUPER_ADMIN")) {
    const locale = await getLocale();
    return redirect({ href: "/", locale });
  }
  return user;
}

/** For server actions: same checks, but throws instead of redirecting. */
export async function assertAdmin(level: "SUPPORT" | "SUPER_ADMIN" = "SUPPORT") {
  const user = await currentUser();
  if (!user || !user.roles.includes("ADMIN") || !user.adminRole) throw new Error("FORBIDDEN");
  if (level === "SUPER_ADMIN" && user.adminRole !== "SUPER_ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function assertBusinessMember(businessId?: string) {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const membership = businessId ? user.memberships.find((m) => m.businessId === businessId) : user.memberships[0];
  if (!membership) throw new Error("FORBIDDEN");
  return { user, business: membership.business };
}

export async function assertFinder() {
  const user = await currentUser();
  if (!user?.finderProfile) throw new Error("FORBIDDEN");
  return { user, finder: user.finderProfile };
}
