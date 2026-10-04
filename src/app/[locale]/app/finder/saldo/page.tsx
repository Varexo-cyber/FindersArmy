import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Download, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { PayoutForm } from "@/components/app/payout-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Money } from "@/components/ui/money";
import { buttonVariants } from "@/components/ui/button";
import { requireFinder } from "@/lib/server/session";
import { finderBalances } from "@/lib/server/services/balances";
import { getSettings } from "@/lib/server/settings";
import { db } from "@/lib/server/db";
import { formatCents } from "@/lib/money";

export default async function BalancePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ aangevraagd?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { finder } = await requireFinder();
  const t = await getTranslations("finderApp");
  const format = await getFormatter();
  const settings = await getSettings();
  const [b, entries, payouts] = await Promise.all([
    finderBalances(finder.id),
    db.ledgerEntry.findMany({ where: { finderId: finder.id }, include: { lead: { include: { campaign: { include: { business: true } }, customer: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.payout.findMany({ where: { finderId: finder.id }, orderBy: { requestedAt: "desc" } }),
  ]);

  return (
    <>
      <PageHeader title={t("balanceTitle")} />
      {(await searchParams).aangevraagd ? <Alert tone="success" className="mb-6">{t("payoutRequested")}</Alert> : null}
      <div className="mb-8 grid overflow-hidden rounded-md border border-border sm:grid-cols-3 [&>*]:border-b [&>*]:border-border sm:[&>*]:border-r sm:[&>*]:border-b-0">
        <div className="flex flex-col gap-2 p-5">
          <span className="eyebrow">{t("balanceExpected")}</span>
          <Money cents={b.expectedCents} size="xl" locale={locale} />
          <span className="text-xs text-subtle">{t("balanceExpectedHint")}</span>
        </div>
        <div className="flex flex-col gap-2 bg-surface p-5">
          <span className="eyebrow">{t("balanceAvailable")}</span>
          <Money cents={b.availableCents} size="xl" highlight locale={locale} />
          <span className="text-xs text-subtle">{t("balanceAvailableHint")}</span>
        </div>
        <div className="flex flex-col gap-2 p-5">
          <span className="eyebrow">{t("balancePaidOut")}</span>
          <Money cents={b.paidOutCents} size="xl" locale={locale} />
          <span className="text-xs text-subtle">{b.pendingPayoutCents > 0 ? `${t("balancePending")}: ${formatCents(b.pendingPayoutCents, locale)}` : t("balancePaidOutHint")}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="self-start">
          <CardHeader><CardTitle>{t("payoutTitle")}</CardTitle></CardHeader>
          <CardBody>
            {!finder.iban ? (
              <Alert>
                {t("payoutNeedsIban")}{" "}
                <Link href="/app/finder/profiel" className="underline underline-offset-2">{t("profileTitle")} →</Link>
              </Alert>
            ) : b.availableCents >= settings.payoutMinimumCents ? (
              <PayoutForm availableCents={b.availableCents} minimumCents={settings.payoutMinimumCents} />
            ) : (
              <p className="text-sm text-subtle">{t("payoutMinimum", { min: formatCents(settings.payoutMinimumCents, locale) })}</p>
            )}
          </CardBody>
        </Card>
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-3 text-xl">{t("payoutsTitle")}</h2>
            {payouts.length === 0 ? (
              <p className="text-sm text-subtle">{t("payoutsEmpty")}</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {payouts.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Money cents={p.amountCents} locale={locale} />
                    <Badge tone={p.status === "PAID" ? "signal" : p.status === "REJECTED" ? "danger" : "neutral"}>{t(`payoutStatus.${p.status}`)}</Badge>
                    <span className="font-mono text-xs text-subtle">{format.dateTime(p.paidAt ?? p.requestedAt, { dateStyle: "medium" })}</span>
                    <a href={`/api/payouts/${p.id}/pdf`} className={buttonVariants({ variant: "ghost", size: "sm", className: "ml-auto" })}><Download aria-hidden /> {t("spec")}</a>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-xl">{t("historyTitle")}</h2>
            {entries.length === 0 ? (
              <EmptyState icon={Wallet} title={t("historyEmpty")} />
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="w-24 shrink-0 font-mono text-xs text-subtle">{format.dateTime(e.createdAt, { day: "numeric", month: "short" })}</span>
                    <span className="flex-1 truncate">
                      {t(`ledgerTypes.${e.type}`)}
                      {e.lead ? ` · ${e.lead.campaign.business.name} · ${e.lead.customer.firstName.split(" ")[0]}` : e.note?.startsWith("invite") ? " · vriend" : e.note === "first-deal" ? " · eerste deal" : ""}
                    </span>
                    <span className={`money ${e.amountCents < 0 ? "text-subtle" : ""}`}>{e.amountCents > 0 ? "+" : ""}{formatCents(e.amountCents, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
