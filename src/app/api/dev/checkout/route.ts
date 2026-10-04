import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { devMailboxEnabled } from "@/lib/server/dev";
import { env, appUrl } from "@/lib/env";

/**
 * Fake checkout for PAYMENT_PROVIDER=fake (development and e2e only). GET shows a pay button;
 * POST marks the payment paid and calls our real webhook endpoint, like Mollie would.
 */
function enabled() {
  return env().PAYMENT_PROVIDER === "fake" && (devMailboxEnabled() || process.env.E2E === "1");
}

export async function GET(req: NextRequest) {
  if (!enabled()) return new NextResponse("Not found", { status: 404 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const row = await db.setting.findUnique({ where: { key: `fakepay:${id}` } });
  if (!row) return new NextResponse("Unknown payment", { status: 404 });
  const v = row.value as { state: string; invoiceId: string };
  const invoice = await db.invoice.findUnique({ where: { id: v.invoiceId } });
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Testbetaling</title>
<style>body{font:16px system-ui;background:#F5F3EE;color:#0E0F0C;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}main{background:#fff;border:1px solid #E2DFD7;border-radius:6px;padding:32px;max-width:360px}button{width:100%;height:48px;border:0;border-radius:6px;background:#D4FF3F;font-weight:600;font-size:16px}p{color:#6B6E66}</style>
<main><h1>Testbetaling (iDEAL)</h1><p>Testmodus. Er wordt niets afgeschreven.</p><p style="font-family:monospace;font-size:22px;color:#0E0F0C">€ ${((invoice?.totalCents ?? 0) / 100).toFixed(2).replace(".", ",")}</p><p>${invoice?.number ?? ""}</p>
<form method="post"><input type="hidden" name="id" value="${id.replace(/"/g, "")}"><button type="submit">Betaal</button></form></main>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function POST(req: NextRequest) {
  if (!enabled()) return new NextResponse("Not found", { status: 404 });
  const id = String((await req.formData()).get("id") ?? "");
  const row = await db.setting.findUnique({ where: { key: `fakepay:${id}` } });
  if (!row) return new NextResponse("Unknown payment", { status: 404 });
  const v = row.value as { state: string; invoiceId: string; redirectUrl: string };
  await db.setting.update({ where: { key: row.key }, data: { value: { ...v, state: "paid" } } });
  const body = new URLSearchParams({ id });
  await fetch(appUrl("/api/webhooks/mollie"), { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } });
  return NextResponse.redirect(v.redirectUrl, 303);
}
