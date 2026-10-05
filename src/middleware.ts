import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/** The domain the site lives on (APP_URL). Other brand domains redirect there. */
function canonicalOrigin(): URL | null {
  try {
    return process.env.APP_URL ? new URL(process.env.APP_URL) : null;
  } catch {
    return null;
  }
}

const BRAND_DOMAINS = ["finderarmy.nl", "findersarmy.nl", "finderarmy.com", "findersarmy.com"];

export default function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const canonical = canonicalOrigin();
  if (canonical && host !== canonical.hostname) {
    const bare = host.replace(/^www\./, "");
    // www.<domain> and the other brand domains redirect to the one in APP_URL; netlify.app
    // preview hosts are left alone so deploy previews keep working.
    if (bare === canonical.hostname.replace(/^www\./, "") || BRAND_DOMAINS.includes(bare)) {
      const path = BRAND_DOMAINS.includes(bare) && bare.endsWith(".nl") ? request.nextUrl.pathname.replace(/^\/en(\/|$)/, "/") : request.nextUrl.pathname;
      return NextResponse.redirect(new URL(path + request.nextUrl.search, canonical.origin), 308);
    }
  }
  const response = intl(request);
  const ref = request.nextUrl.pathname.match(/^\/(?:en\/)?r\/([a-z0-9]{4,16})$/);
  if (ref) {
    // Attribution cookie: codes in first-visit order. createLead uses the earliest code for the
    // same campaign, so the first Finder to send someone keeps the customer.
    const existing = (request.cookies.get("fa_ref")?.value ?? "").split(".").filter((c) => /^[a-z0-9]{4,16}$/.test(c));
    if (!existing.includes(ref[1]!)) existing.push(ref[1]!);
    response.cookies.set("fa_ref", existing.slice(-10).join("."), {
      maxAge: 90 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
    });
  }
  return response;
}

export const config = {
  // Skip API routes, Next internals and static files (anything with a dot).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
