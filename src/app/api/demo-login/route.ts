import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { randomToken } from "@/lib/server/hash";
import { isDemoMode } from "@/lib/env";
import { now } from "@/lib/server/clock";

/**
 * TEMPORARY, test phase only: one-click sign-in to the seeded demo accounts. Exists only while
 * DEMO_MODE is on; delete this route (and the buttons on /login) before launch.
 */
const ACCOUNTS = {
  admin: { email: "admin@findersarmy.test", to: "/admin" },
  bedrijf: { email: "bedrijf1@findersarmy.test", to: "/app/bedrijf" },
  finder: { email: "finder1@findersarmy.test", to: "/app/finder" },
} as const;

export async function GET(req: NextRequest) {
  if (!isDemoMode()) return new NextResponse("Not found", { status: 404 });
  const as = req.nextUrl.searchParams.get("as") as keyof typeof ACCOUNTS | null;
  const account = as ? ACCOUNTS[as] : undefined;
  if (!account) return new NextResponse("Unknown demo account", { status: 400 });

  const user = await db.user.findUnique({ where: { email: account.email } });
  if (!user) return new NextResponse("Demo data is missing: run the seed (npm run db:seed).", { status: 503 });

  const sessionToken = randomToken();
  const expires = new Date(now().getTime() + 1000 * 60 * 60 * 8);
  await db.session.create({ data: { sessionToken, userId: user.id, expires } });

  const secure = req.nextUrl.protocol === "https:";
  const res = NextResponse.redirect(new URL(account.to, req.nextUrl.origin));
  res.cookies.set(secure ? "__Secure-authjs.session-token" : "authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires,
  });
  return res;
}
