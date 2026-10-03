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
  return intl(request);
}

export const config = {
  // Skip API routes, Next internals and static files (anything with a dot).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
