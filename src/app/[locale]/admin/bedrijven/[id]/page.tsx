import { Fragment } from "react";
import { notFound } from "next/navigation";
import { getFormatter } from "next-intl/server";
import { PageHeader } from "@/components/app/app-shell";
import { AdminAction } from "@/components/admin/admin-action";
import { Table, Td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { db } from "@/lib/server/db";
import { approveBusiness, rejectBusiness, suspendBusiness, setCampaignStatusAdmin } from "@/lib/server/actions/admin";
import { formatCents } from "@/lib/money";

export default async function AdminBusinessDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = await getFormatter();
  const b = await db.business.findUnique({
    where: { id },
    include: { category: true, campaigns: true, invoices: { orderBy: { issuedAt: "desc" }, take: 20 }, members: { include: { user: true } } },
  });
  if (!b) notFound();
  const audits = await db.auditLog.findMany({ where: { entity: "Business", entityId: id }, orderBy: { createdAt: "desc" }, take: 20, include: { actor: true } });
  const area = b.serviceArea as { type: string; city?: string; km?: number; prefixes?: string[] };
  return (
    <>
      <PageHeader
        title={b.name}
        sub={<span className="flex items-center gap-2"><Badge tone={b.status === "ACTIVE" ? "signal" : "danger"}>{b.status}</Badge> score {b.score}{b.suspendedReason ? ` · ${b.suspendedReason}` : ""}</span>}
        actions={
          <>
            {b.status !== "ACTIVE" ? <AdminAction action={approveBusiness.bind(null, b.id)} label="Goedkeuren" variant="primary" /> : null}
            {b.status === "PENDING_REVIEW" ? <AdminAction action={rejectBusiness.bind(null, b.id)} label="Afwijzen" reason="Reden (gaat naar het bedrijf)" variant="danger" /> : null}
            {b.status === "ACTIVE" || b.status === "UNDER_REVIEW" ? <AdminAction action={suspendBusiness.bind(null, b.id)} label="Schorsen" reason="Reden van schorsing" variant="danger" /> : null}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Gegevens</CardTitle></CardHeader>
          <CardBody>
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
              {[
                ["KvK", b.kvk], ["BTW", b.vatNumber], ["Adres", `${b.street} ${b.houseNumber}, ${b.postcode} ${b.city}`], ["Contact", `${b.contactName} · ${b.phone}`],
                ["E-mail", b.email], ["Website", b.website ?? "—"], ["Aanbod", b.offerUrl ?? "—"], ["Categorie", b.category.nameNl],
                ["Werkgebied", area.type === "radius" ? `${area.km} km rond ${area.city}` : (area.prefixes ?? []).join(", ")],
                ["Leden", b.members.map((m) => m.user.email).join(", ")], ["Voorwaarden", format.dateTime(b.termsAcceptedAt, { dateStyle: "medium", timeStyle: "short" })],
              ].map(([k, v]) => (<Fragment key={k}><dt className="text-subtle">{k}</dt><dd className="break-words">{v}</dd></Fragment>))}
            </dl>
            <p className="mt-4 text-sm whitespace-pre-line text-subtle">{b.description}</p>
            <p className="mt-4 text-xs text-subtle">Controleer KvK en BTW handmatig via kvk.nl en de VIES-check voordat je goedkeurt.</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Campagnes</CardTitle></CardHeader>
          <CardBody className="flex flex-col gap-4">
            {b.campaigns.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 border-b border-border pb-4 last:border-0">
                <div className="flex items-center gap-2"><Badge>{c.status}</Badge><span className="font-medium">{c.title}</span></div>
                <p className="font-mono text-xs text-subtle">
                  {c.feeType} {c.feePercentBps ? `${c.feePercentBps / 100}%` : ""}{c.feeFixedCents ? formatCents(c.feeFixedCents) : ""} · min klus {formatCents(c.minJobAmountCents)} · min fee {formatCents(c.minFeeCents)}
                </p>
                <div className="flex gap-2">
                  {c.status === "LIVE" ? <AdminAction action={setCampaignStatusAdmin.bind(null, c.id, "SUSPENDED")} label="Campagne schorsen" reason="Reden" /> : null}
                  {c.status === "SUSPENDED" && b.status === "ACTIVE" ? <AdminAction action={setCampaignStatusAdmin.bind(null, c.id, "LIVE")} label="Weer live" reason="Reden" /> : null}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
      <h2 className="mt-10 mb-4 text-xl">Facturen</h2>
      <Table head={["Nummer", "Totaal", "Status", "Vervalt"]}>
        {b.invoices.map((i) => (
          <tr key={i.id}><Td className="font-mono">{i.number}</Td><Td><Money cents={i.totalCents} size="sm" /></Td><Td><Badge>{i.status}</Badge></Td><Td className="font-mono text-xs">{format.dateTime(i.dueAt, { dateStyle: "medium" })}</Td></tr>
        ))}
      </Table>
      <h2 className="mt-10 mb-4 text-xl">Audit</h2>
      <ul className="flex flex-col gap-1 font-mono text-xs">
        {audits.map((a) => <li key={a.id}>{format.dateTime(a.createdAt, { dateStyle: "short", timeStyle: "short" })} · {a.action} · {a.actor?.email ?? "systeem"}</li>)}
      </ul>
    </>
  );
}
