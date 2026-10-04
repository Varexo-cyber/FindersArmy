import { PageHeader } from "@/components/app/app-shell";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { LeadStatusBadge } from "@/components/app/status-badge";
import { ChecklistItem } from "@/components/admin/checklist";
import { db } from "@/lib/server/db";
import { getSettings } from "@/lib/server/settings";
import { OWNER_CHECKLIST } from "@/lib/settings-schema";
import { LEAD_STATUSES } from "@/lib/lead-status";

export default async function AdminDashboard() {
  const settings = await getSettings();
  const [finders, activeFinders, liveCampaigns, byStatus, wonValue, invoiced, paid, open, paidOut, platform, bonusesOwed] = await Promise.all([
    db.finderProfile.count(),
    db.finderProfile.count({ where: { status: { not: "SUSPENDED" }, links: { some: {} } } }),
    db.campaign.count({ where: { status: "LIVE", business: { status: "ACTIVE" } } }),
    db.lead.groupBy({ by: ["status"], _count: true }),
    db.lead.aggregate({ where: { status: { in: ["WON", "COMPLETED", "CONFIRMED", "INVOICED", "PAID", "PAID_OUT"] } }, _sum: { dealAmountCents: true } }),
    db.invoice.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { totalCents: true } }),
    db.invoice.aggregate({ where: { status: "PAID" }, _sum: { totalCents: true, subtotalCents: true } }),
    db.invoice.aggregate({ where: { status: { in: ["OPEN", "OVERDUE"] } }, _sum: { totalCents: true } }),
    db.payout.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true } }),
    db.fee.aggregate({ where: { lead: { status: { in: ["PAID", "PAID_OUT"] } } }, _sum: { platformCents: true } }),
    db.confirmation.findMany({ where: { confirmedAt: { not: null }, bonusCents: { gt: 0 }, bonusSentAt: null }, include: { lead: { include: { customer: true } } } }),
  ]);
  const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));
  const doneMap = new Map(settings.ownerChecklist.map((c) => [c.id, c.done]));

  return (
    <>
      <PageHeader title="Dashboard" sub="Alle cijfers komen live uit de database." />
      <div className="mb-8 grid grid-cols-2 overflow-hidden rounded-md border border-border md:grid-cols-4 [&>*]:border-b [&>*]:border-r [&>*]:border-border">
        <Stat label="Actieve Finders" value={activeFinders} hint={`${finders} totaal`} />
        <Stat label="Live campagnes" value={liveCampaigns} />
        <Stat label="Gewonnen dealwaarde" cents={wonValue._sum.dealAmountCents ?? 0} />
        <Stat label="Gefactureerd" cents={invoiced._sum.totalCents ?? 0} />
        <Stat label="Betaald door bedrijven" cents={paid._sum.totalCents ?? 0} />
        <Stat label="Openstaand" cents={open._sum.totalCents ?? 0} />
        <Stat label="Uitbetaald aan Finders" cents={paidOut._sum.amountCents ?? 0} highlight />
        <Stat label="Platformomzet (excl. btw)" cents={platform._sum.platformCents ?? 0} hint="Fee − Finder-deel − klantbonus, betaalde deals" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Leads per status</CardTitle></CardHeader>
          <CardBody>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {LEAD_STATUSES.map((s) => (
                <li key={s} className="flex items-center justify-between gap-2">
                  <LeadStatusBadge status={s} />
                  <span className="font-mono">{counts[s] ?? 0}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Open punten voor de eigenaar</CardTitle></CardHeader>
          <CardBody>
            <p className="mb-2 text-xs text-subtle">Niet door het platform in te vullen. Vink af als het geregeld is.</p>
            {OWNER_CHECKLIST.map((c) => <ChecklistItem key={c.id} id={c.id} label={c.nl} done={doneMap.get(c.id) ?? false} />)}
          </CardBody>
        </Card>
        {bonusesOwed.length ? (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Cadeaubonnen te versturen ({bonusesOwed.length})</CardTitle></CardHeader>
            <CardBody className="text-sm text-subtle">Zie Facturen › Cadeaubonnen.</CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
