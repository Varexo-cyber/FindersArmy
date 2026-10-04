import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/app/app-shell";
import { Insignia } from "@/components/brand/insignia";
import { CopyField } from "@/components/app/copy-field";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { requireFinder } from "@/lib/server/session";
import { getSettings } from "@/lib/server/settings";
import { db } from "@/lib/server/db";
import { now, startOfMonth } from "@/lib/server/clock";
import { nextRank, rankFor, rankProgress } from "@/lib/ranks";
import { formatCents } from "@/lib/money";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

async function leaderboard() {
  const since = startOfMonth(now());
  const rows = await db.ledgerEntry.groupBy({
    by: ["finderId"],
    where: { type: { in: ["AVAILABLE", "BONUS"] }, createdAt: { gte: since }, amountCents: { gt: 0 }, finder: { leaderboardOptIn: true, nickname: { not: null }, status: { not: "SUSPENDED" } } },
    _sum: { amountCents: true },
    orderBy: { _sum: { amountCents: "desc" } },
    take: 10,
  });
  const finders = await db.finderProfile.findMany({ where: { id: { in: rows.map((r) => r.finderId) } }, select: { id: true, nickname: true, paidDeals: true } });
  return rows.map((r) => ({ ...finders.find((f) => f.id === r.finderId)!, cents: r._sum.amountCents ?? 0 }));
}

export default async function RankPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { finder } = await requireFinder();
  const t = await getTranslations("finderApp");
  const tr = await getTranslations("ranks");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const settings = await getSettings();
  const rank = rankFor(finder.paidDeals, settings.ranks);
  const next = nextRank(finder.paidDeals, settings.ranks);
  const progress = rankProgress(finder.paidDeals, settings.ranks);
  const [board, invited] = await Promise.all([leaderboard(), db.finderProfile.count({ where: { referredByFinderId: finder.id } })]);
  const pct = (bps: number) => `${(bps / 100).toLocaleString(locale)}%`;

  return (
    <>
      <PageHeader title={t("rankTitle")} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardBody className="flex flex-col gap-6">
            <div className="flex items-center gap-5">
              <Insignia rank={rank.key} className="size-20 text-olive dark:text-accent" title={tr(rank.key)} />
              <div>
                <p className="eyebrow">{t("rankCurrent")}</p>
                <p className="font-display text-4xl font-bold tracking-tight">{tr(rank.key)}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="eyebrow">{t("rankShare")}</dt><dd className="money text-3xl">{pct(rank.shareBps)}</dd></div>
              <div><dt className="eyebrow">{t("rankPaidDeals")}</dt><dd className="money text-3xl">{finder.paidDeals}</dd></div>
            </dl>
            <div className="flex flex-col gap-2">
              <div className="h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
                <div className="h-full bg-olive transition-[width] duration-200 dark:bg-accent" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="text-sm text-subtle">{next ? t("rankNext", { count: next.dealsToGo, rank: tr(next.rank.key), share: pct(next.rank.shareBps) }) : t("rankMax")}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t("rankLadder")}</CardTitle></CardHeader>
          <CardBody>
            <ol className="flex flex-col gap-3">
              {[...settings.ranks].sort((a, b) => a.minPaidDeals - b.minPaidDeals).map((r) => (
                <li key={r.key} className={cn("flex items-center gap-3 rounded-md px-2 py-1.5", r.key === rank.key && "bg-surface-2")}>
                  <Insignia rank={r.key} className="size-8 text-olive dark:text-accent" />
                  <span className="flex-1 font-medium">{tr(r.key)}</span>
                  <span className="font-mono text-xs text-subtle">{r.minPaidDeals}+</span>
                  <span className="w-14 text-right font-mono text-sm">{pct(r.shareBps)}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
        <Card>
          <CardHeader className="flex-col gap-1">
            <CardTitle>{t("leaderboardTitle", { month: format.dateTime(now(), { month: "long" }) })}</CardTitle>
            <p className="text-sm text-subtle">{t("leaderboardSub")}</p>
          </CardHeader>
          <CardBody>
            {board.length === 0 ? <p className="text-sm text-subtle">{t("leaderboardEmpty")}</p> : (
              <ol className="flex flex-col divide-y divide-border">
                {board.map((row, i) => (
                  <li key={row.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 font-mono text-sm text-subtle">{i + 1}</span>
                    <Insignia rank={rankFor(row.paidDeals, settings.ranks).key} className="size-6 text-olive dark:text-accent" />
                    <span className="flex-1 font-medium">{row.nickname}{row.id === finder.id ? <span className="ml-2 font-mono text-xs text-subtle">({t("leaderboardYou")})</span> : null}</span>
                    <Money cents={row.cents} size="sm" locale={locale} />
                  </li>
                ))}
              </ol>
            )}
            {!finder.leaderboardOptIn ? <p className="mt-3 text-xs text-subtle">{t("leaderboardJoin")}</p> : null}
          </CardBody>
        </Card>
        <Card>
          <CardHeader className="flex-col gap-1">
            <CardTitle>{t("inviteTitle")}</CardTitle>
            <p className="text-sm text-subtle">{t("inviteBody", { amount: formatCents(settings.inviteBonusCents, locale) })}</p>
          </CardHeader>
          <CardBody className="flex flex-col gap-3">
            <CopyField value={`${siteUrl()}/aanmelden/finder?invite=${finder.inviteCode}`} label={t("inviteLink")} copyLabel={tc("copy")} copiedLabel={tc("copied")} />
            <p className="font-mono text-xs text-subtle">{t("invitedCount", { count: invited })}</p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
