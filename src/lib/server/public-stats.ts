import "server-only";
import { db } from "./db";

/**
 * Public numbers on marketing pages come straight from the database. When there is nothing real
 * to show (or the database is unreachable at build time), we show nothing rather than a placeholder.
 */
export async function paidOutTotalCents(): Promise<number | null> {
  try {
    const agg = await db.payout.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true } });
    const total = agg._sum.amountCents ?? 0;
    return total > 0 ? total : null;
  } catch {
    return null;
  }
}

export async function liveCampaignCounts(): Promise<Record<string, number>> {
  try {
    const rows = await db.campaign.findMany({
      where: { status: "LIVE", business: { status: "ACTIVE" } },
      select: { business: { select: { category: { select: { slug: true } } } } },
    });
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.business.category.slug] = (counts[r.business.category.slug] ?? 0) + 1;
    return counts;
  } catch {
    return {};
  }
}

/** Live campaigns whose region mentions this place ("Zwolle", "Overijssel"). Unknown counts as none. */
export async function liveCampaignsIn(place: string): Promise<number> {
  try {
    return await db.campaign.count({
      where: { status: "LIVE", business: { status: "ACTIVE" }, region: { contains: place, mode: "insensitive" } },
    });
  } catch {
    return 0;
  }
}
