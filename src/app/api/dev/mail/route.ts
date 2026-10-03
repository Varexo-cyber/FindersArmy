import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { devMailboxEnabled } from "@/lib/server/dev";

/**
 * Development mailbox. GET ?to=x&format=json returns the latest mails for an address (used by
 * Playwright to follow magic links); without format it renders a simple HTML inbox.
 */
export async function GET(req: NextRequest) {
  if (!devMailboxEnabled()) return new NextResponse("Not found", { status: 404 });
  const to = req.nextUrl.searchParams.get("to")?.toLowerCase();
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const mail = await db.devMail.findUnique({ where: { id } });
    if (!mail) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(mail.html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  const mails = await db.devMail.findMany({ where: to ? { to } : {}, orderBy: { createdAt: "desc" }, take: 50 });
  if (req.nextUrl.searchParams.get("format") === "json") {
    return NextResponse.json(
      mails.map((m) => ({
        id: m.id,
        to: m.to,
        subject: m.subject,
        createdAt: m.createdAt,
        links: Array.from(m.html.matchAll(/href="([^"]+)"/g)).map((x) => x[1]!.replace(/&amp;/g, "&")),
        text: m.text,
      })),
    );
  }
  const rows = mails
    .map((m) => `<tr><td>${m.createdAt.toISOString().slice(11, 19)}</td><td>${esc(m.to)}</td><td><a href="/api/dev/mail?id=${m.id}">${esc(m.subject)}</a></td></tr>`)
    .join("");
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>Dev mailbox</title><style>body{font:14px system-ui;margin:2rem;background:#F5F3EE}table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #E2DFD7;padding:.5rem}</style><h1>Dev mailbox</h1><p>Only available without RESEND_API_KEY, outside production.</p><table>${rows}</table>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
