import { getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { AdminAction } from "@/components/admin/admin-action";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardBody } from "@/components/ui/card";
import { LeadStatusBadge } from "@/components/app/status-badge";
import { db } from "@/lib/server/db";
import { resolveDispute, resolveReport } from "@/lib/server/actions/admin";

export default async function AdminDisputes() {
  const format = await getFormatter();
  const [disputes, reports, flagged] = await Promise.all([
    db.dispute.findMany({ where: { status: "OPEN" }, include: { lead: { include: { customer: true, campaign: { include: { business: true } } } } }, orderBy: { createdAt: "asc" } }),
    db.report.findMany({ where: { status: "OPEN" }, include: { lead: { include: { customer: true, campaign: { include: { business: true } } } }, finder: { include: { user: true } } }, orderBy: { createdAt: "asc" } }),
    db.lead.findMany({ where: { status: "FRAUD" }, include: { customer: true, campaign: { include: { business: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return (
    <>
      <PageHeader title="Geschillen & meldingen" sub="Alles wat een menselijke beslissing nodig heeft." />
      <section className="mb-10">
        <h2 className="mb-3 text-xl">Geschillen ({disputes.length})</h2>
        {disputes.length === 0 ? <EmptyState title="Geen open geschillen." /> : (
          <div className="flex flex-col gap-3">
            {disputes.map((d) => (
              <Card key={d.id}>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <LeadStatusBadge status={d.lead.status} />
                    <Link href={`/admin/leads/${d.leadId}`} className="font-medium hover:underline">{d.lead.customer.firstName} {d.lead.customer.lastName} · {d.lead.campaign.business.name}</Link>
                    <span className="font-mono text-xs text-subtle">{d.openedBy} · {format.dateTime(d.createdAt, { dateStyle: "short" })}</span>
                  </div>
                  <p className="text-sm">{d.reason}</p>
                  <div className="flex flex-wrap gap-2">
                    <AdminAction action={resolveDispute.bind(null, d.id, "CONFIRM")} label="Deal bevestigen" reason="Toelichting" extra="Eindbedrag (optioneel)" variant="primary" />
                    <AdminAction action={resolveDispute.bind(null, d.id, "REJECT")} label="Bedrijf heeft gelijk" reason="Toelichting" />
                    <AdminAction action={resolveDispute.bind(null, d.id, "LOST")} label="Geen deal" reason="Toelichting" variant="danger" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
      <section className="mb-10">
        <h2 className="mb-3 text-xl">Meldingen van Finders ({reports.length})</h2>
        {reports.length === 0 ? <EmptyState title="Geen open meldingen." /> : (
          <div className="flex flex-col gap-3">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <LeadStatusBadge status={r.lead.status} />
                    <Link href={`/admin/leads/${r.leadId}`} className="font-medium hover:underline">{r.lead.campaign.business.name} · klant {r.lead.customer.firstName}</Link>
                    <span className="font-mono text-xs text-subtle">{r.finder.user.email}</span>
                  </div>
                  <p className="text-sm">{r.message}</p>
                  <div className="flex gap-2">
                    <AdminAction action={resolveReport.bind(null, r.id, "RESOLVED")} label="Opgelost" reason="Uitkomst (gaat naar de Finder)" variant="solid" />
                    <AdminAction action={resolveReport.bind(null, r.id, "REJECTED")} label="Afwijzen" reason="Reden (gaat naar de Finder)" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-xl">Geblokkeerde aanvragen ({flagged.length})</h2>
        {flagged.length === 0 ? <EmptyState title="Geen verdachte aanvragen." /> : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {flagged.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <Link href={`/admin/leads/${l.id}`} className="font-medium hover:underline">{l.customer.firstName} {l.customer.lastName}</Link>
                <span className="text-subtle">{l.campaign.business.name}</span>
                <span className="font-mono text-xs text-danger">{l.fraudFlags.join(", ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
