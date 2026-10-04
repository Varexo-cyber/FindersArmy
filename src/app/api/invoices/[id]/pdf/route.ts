import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { renderInvoicePdf } from "@/lib/server/services/invoices";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const invoice = await db.invoice.findUnique({ where: { id } });
  const allowed = invoice && (user.roles.includes("ADMIN") || user.memberships.some((m) => m.businessId === invoice.businessId));
  if (!invoice || !allowed) return new NextResponse("Not found", { status: 404 });
  const pdf = await renderInvoicePdf(id);
  return new NextResponse(Buffer.from(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${invoice.number}.pdf"`, "cache-control": "private, no-store" },
  });
}
