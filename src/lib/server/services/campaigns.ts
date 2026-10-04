import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "../db";
import { now } from "../clock";
import { maxFinderEarning } from "../../fees";
import { ruleFromCampaign } from "./fees";

export interface DiscoverFilters {
  category?: string;
  region?: string;
  sort?: "earning" | "new" | "boost";
}

/**
 * Live campaigns for the Finder's discover view, each with the "earn up to" figure for this
 * Finder's own rank share. Businesses with low scores sink: ranking weighs earnings by score.
 */
export async function discoverCampaigns(shareBps: number, filters: DiscoverFilters = {}) {
  const t = now();
  const where: Prisma.CampaignWhereInput = {
    status: "LIVE",
    business: { status: "ACTIVE", ...(filters.category ? { category: { slug: filters.category } } : {}) },
    ...(filters.region
      ? { OR: [{ region: { contains: filters.region, mode: "insensitive" } }, { business: { city: { contains: filters.region, mode: "insensitive" } } }] }
      : {}),
  };
  const campaigns = await db.campaign.findMany({
    where,
    include: { business: { include: { category: true } }, boosts: { where: { startsAt: { lte: t }, endsAt: { gte: t } }, orderBy: { extraFeeCents: "desc" }, take: 1 } },
  });
  const rows = campaigns.map((c) => {
    const boost = c.boosts[0] ?? null;
    const earnCents = maxFinderEarning(ruleFromCampaign(c), shareBps, c.business.category.exampleJobCents, boost?.extraFeeCents ?? 0);
    return { campaign: c, business: c.business, category: c.business.category, boost, earnCents, rank: earnCents * (c.business.score / 100) };
  });
  const sort = filters.sort ?? "earning";
  rows.sort((a, b) => {
    if (sort === "new") return b.campaign.createdAt.getTime() - a.campaign.createdAt.getTime();
    if (sort === "boost" && Boolean(a.boost) !== Boolean(b.boost)) return a.boost ? -1 : 1;
    // Default: boosted campaigns first (that is what a boost buys), then score-weighted earnings.
    if (sort === "earning" && Boolean(a.boost) !== Boolean(b.boost)) return a.boost ? -1 : 1;
    return b.rank - a.rank;
  });
  return rows;
}
