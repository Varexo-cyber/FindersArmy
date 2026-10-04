import { NextResponse, type NextRequest } from "next/server";
import { payments } from "@/lib/server/payments";
import { db } from "@/lib/server/db";
import { markInvoicePaid } from "@/lib/server/services/invoices";

/**
 * Mollie webhook. Mollie only sends `id`; we never trust the body beyond that and always fetch
 * the payment's real state from the API. Responds 200 for unknown ids so Mollie stops retrying.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const id = form?.get("id");
  if (typeof id !== "string" || !/^tr_[A-Za-z0-9_]+$/.test(id)) return new NextResponse("ok", { status: 200 });
  const invoice = await db.invoice.findFirst({ where: { molliePaymentId: id } });
  if (!invoice) return new NextResponse("ok", { status: 200 });
  const state = await payments().getPaymentState(id);
  if (state.state === "paid" && state.invoiceId === invoice.id) {
    await markInvoicePaid(invoice.id, { source: "webhook" });
  }
  return new NextResponse("ok", { status: 200 });
}
