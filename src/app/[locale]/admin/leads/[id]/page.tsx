import { notFound } from "next/navigation";
import { getFormatter } from "next-intl/server";
import { PageHeader } from "@/components/app/app-shell";
import { LeadStatusBadge } from "@/components/app/status-badge";
import { LeadTimeline } from "@/components/app/timeline";
import { LeadAdminForm } from "@/components/admin/lead-admin-form";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { Alert } from "@/components/ui/alert";
import { db } from "@/lib/server/db";
import { formatCents } from "@/lib/money";

export default async function AdminLeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = await getFormatter();
  const lead = await db.lead.findUnique({
    where: { id },
    include: { customer: true, campaign: { include: { business: true } }, finder: { include: { user: true } }, events: { orderBy: { createdAt: "asc" } }, fee: true, confirmation: true, disputes: true, reports: true, ledger: true, invoice: true },
  });
  if (!lead) notFound();
  const audits = await db.auditLog.findMany({ where: { entity: "Lead", entityId: id }, orderBy: { createdAt: "desc" }, include: { actor: true } });
  const c = lead.customer;
  return (
    <>
      <PageHeader title={`${c.firstName} ${c.lastName}`} sub={<span className="flex items-center gap-2"><LeadStatusBadge status={lead.status} /> {lead.campaign.business.name} · {lead.campaign.title}</span>} />
      {lead.fraudFlags.length ? <Alert tone="warning" className="mb-6" title="Fraudesignalen">{lead.fraudFlags.join(", ")}</Alert> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Gegevens</CardTitle></CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm">
            <p className="font-mono">{c.email} · {c.phone}</p>
            <p>{c.postcode} {c.houseNumber} {c.city}</p>
            <p className="text-subtle">Toestemming: {format.dateTime(c.consentAt, { dateStyle: "medium", timeStyle: "short" })}</p>
            <p className="whitespace-pre-line">{lead.description}</p>
            <p className="text-subtle">Finder: {lead.finder.user.email} (score {lead.finder.score}, {lead.finder.status}){lead.isRepeat ? " · herhaalklant" : ""}</p>
            {lead.boostCents ? <p>Boost: {formatCents(lead.boostCents)}</p> : null}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Geld</CardTitle></CardHeader>
          <CardBody className="flex flex-col gap-2 text-sm">
            <p>Deal: {lead.dealAmountCents ? <Money cents={lead.dealAmountCents} size="sm" /> : "—"}</p>
            {lead.fee ? (
              <p className="font-mono text-xs">fee {formatCents(lead.fee.totalCents)} · finder {formatCents(lead.fee.finderCents)} · klantbonus {formatCents(lead.fee.customerBonusCents)} · platform {formatCents(lead.fee.platformCents)}</p>
            ) : null}
            {lead.invoice ? <p>Factuur {lead.invoice.number} · {lead.invoice.status}</p> : null}
            {lead.confirmation ? <p>Klantbevestiging: {lead.confirmation.confirmedAt ? `bevestigd ${format.dateTime(lead.confirmation.confirmedAt, { dateStyle: "short" })}` : lead.confirmation.disagreed ? "oneens" : "open"}</p> : null}
            <ul className="mt-2 font-mono text-xs text-subtle">
              {lead.ledger.map((e) => <li key={e.id}>{e.type} {formatCents(e.amountCents)} {e.note ?? ""}</li>)}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tijdlijn</CardTitle></CardHeader>
          <CardBody><LeadTimeline events={lead.events} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Corrigeren</CardTitle></CardHeader>
          <CardBody>
            <LeadAdminForm leadId={lead.id} current={lead.status} />
            <ul className="mt-6 flex flex-col gap-1 font-mono text-xs text-subtle">
              {audits.map((a) => <li key={a.id}>{format.dateTime(a.createdAt, { dateStyle: "short", timeStyle: "short" })} · {a.action} · {a.actor?.email ?? "systeem"}</li>)}
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
