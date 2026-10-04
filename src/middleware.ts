import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const NL_DOMAINS = new Set(["finderarmy.nl", "www.finderarmy.nl", "findersarmy.nl", "www.findersarmy.nl"]);

export default function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  if (NL_DOMAINS.has(host)) {
    // The .nl domain is a pure redirect to the Dutch version on the main domain.
    const url = new URL(request.nextUrl.pathname.replace(/^\/en(\/|$)/, "/") + request.nextUrl.search, "https://findersarmy.com");
    return NextResponse.redirect(url, 308);
  }
  if (host === "www.findersarmy.com") {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, "https://findersarmy.com"), 308);
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
