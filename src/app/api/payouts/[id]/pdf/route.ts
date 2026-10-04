import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { renderPayoutPdf } from "@/lib/server/services/payouts";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const payout = await db.payout.findUnique({ where: { id } });
  const allowed = payout && (user.roles.includes("ADMIN") || user.finderProfile?.id === payout.finderId);
  if (!payout || !allowed) return new NextResponse("Not found", { status: 404 });
  const pdf = await renderPayoutPdf(id);
  return new NextResponse(Buffer.from(pdf), {
    headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="uitbetaling-${id.slice(-8)}.pdf"`, "cache-control": "private, no-store" },
  });
}
