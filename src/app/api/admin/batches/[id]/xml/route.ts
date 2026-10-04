import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user || !user.roles.includes("ADMIN") || user.adminRole !== "SUPER_ADMIN") return new NextResponse("Not found", { status: 404 });
  const batch = await db.payoutBatch.findUnique({ where: { id } });
  if (!batch) return new NextResponse("Not found", { status: 404 });
  await audit({ actorUserId: user.id, action: "payout_batch.downloaded", entity: "PayoutBatch", entityId: id });
  return new NextResponse(batch.sepaXml, {
    headers: { "content-type": "application/xml; charset=utf-8", "content-disposition": `attachment; filename="${batch.reference}.xml"`, "cache-control": "no-store" },
  });
}
