import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { now } from "@/lib/server/clock";
import { audit } from "@/lib/server/audit";
import { appUrl } from "@/lib/env";

/** A parent confirms consent for a 16–17 year old Finder (only reachable when ALLOW_16_PLUS). */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await db.setting.findUnique({ where: { key: `parent-consent:${token}` } });
  if (!row) return new NextResponse("Deze link is ongeldig of al gebruikt.", { status: 404 });
  const { finderId } = row.value as { finderId: string };
  await db.finderProfile.update({ where: { id: finderId }, data: { parentConsentAt: now() } });
  await db.setting.delete({ where: { key: row.key } });
  await audit({ action: "finder.parent_consent", entity: "FinderProfile", entityId: finderId });
  return NextResponse.redirect(appUrl("/?toestemming=1"));
}
