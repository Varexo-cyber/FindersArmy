import { NextResponse } from "next/server";
import { storage } from "@/lib/server/storage";
import { currentUser } from "@/lib/server/session";
import { db } from "@/lib/server/db";

/**
 * Serves uploaded files. Logos are public (they appear on referral pages). Lead photos are
 * customer data: only the receiving business and admins may see them.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!/^(logos|leads)\/[a-f0-9]{32}\.(png|jpg|webp|svg)$/.test(key)) return new NextResponse("Not found", { status: 404 });
  if (key.startsWith("leads/")) {
    const user = await currentUser();
    if (!user) return new NextResponse("Not found", { status: 404 });
    const photo = await db.leadPhoto.findFirst({ where: { url: `/api/files/${key}` }, include: { lead: { include: { campaign: true } } } });
    const ok = photo && (user.roles.includes("ADMIN") || user.memberships.some((m) => m.businessId === photo.lead.campaign.businessId));
    if (!ok) return new NextResponse("Not found", { status: 404 });
  }
  const file = await storage().get(key);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "content-type": file.contentType,
      "cache-control": key.startsWith("logos/") ? "public, max-age=31536000, immutable" : "private, max-age=300",
      // SVG logos are served as images only; this CSP stops any embedded script if opened directly.
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "x-content-type-options": "nosniff",
    },
  });
}
