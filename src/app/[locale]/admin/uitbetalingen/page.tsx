import { getFormatter } from "next-intl/server";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { AdminAction } from "@/components/admin/admin-action";
import { Table, Td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/server/db";
import { adminApprovePayouts, adminCreateBatch, adminMarkBatchPaid, adminRejectPayout } from "@/lib/server/actions/admin";
import { maskIban } from "@/lib/iban";
import { getSettings } from "@/lib/server/settings";

export default async function AdminPayouts() {
  const format = await getFormatter();
  const settings = await getSettings();
  const [requested, approved, batches] = await Promise.all([
    db.payout.findMany({ where: { status: "REQUESTED" }, include: { finder: { include: { user: true } } }, orderBy: { requestedAt: "asc" } }),
    db.payout.findMany({ where: { status: "APPROVED" }, include: { finder: { include: { user: true } } }, orderBy: { requestedAt: "asc" } }),
    db.payoutBatch.findMany({ include: { payouts: true }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const ids = requested.map((p) => p.id);
  const companyIbanSet = !settings.company.iban.includes("XXXX");
  return (
    <>
      <PageHeader title="Uitbetalingen" sub="Wachtrij → goedkeuren → SEPA-batch exporteren → uploaden bij de bank → markeren als betaald." />
      {!companyIbanSet ? <Alert tone="warning" className="mb-6">Vul eerst het IBAN van FindersArmy in bij Instellingen › company. Zonder geldig IBAN kan de SEPA-batch niet worden gemaakt.</Alert> : null}

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl">Aangevraagd ({requested.length})</h2>
          {ids.length ? <AdminAction action={adminApprovePayouts.bind(null, ids)} label="Alles goedkeuren" variant="solid" /> : null}
        </div>
        {requested.length === 0 ? <EmptyState title="Geen nieuwe aanvragen." /> : (
          <Table head={["Finder", "Bedrag", "Rekening", "Aangevraagd", "Score", ""]}>
            {requested.map((p) => (
              <tr key={p.id}>
                <Td>{p.finder.user.name ?? p.finder.user.email}<div className="text-xs text-subtle">{p.ibanHolder}</div></Td>
                <Td><Money cents={p.amountCents} size="sm" /></Td>
                <Td className="font-mono text-xs">{maskIban(p.iban)}</Td>
                <Td className="font-mono text-xs">{format.dateTime(p.requestedAt, { dateStyle: "short", timeStyle: "short" })}</Td>
                <Td className="font-mono">{p.finder.score}{p.finder.status !== "ACTIVE" ? <Badge tone="danger" className="ml-2">{p.finder.status}</Badge> : null}</Td>
                <Td className="flex gap-2">
                  <AdminAction action={adminApprovePayouts.bind(null, [p.id])} label="Goedkeuren" />
                  <AdminAction action={adminRejectPayout.bind(null, p.id)} label="Afwijzen" reason="Reden" variant="ghost" />
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl">Goedgekeurd, klaar voor batch ({approved.length})</h2>
          {approved.length && companyIbanSet ? <AdminAction action={adminCreateBatch} label="SEPA-batch maken" variant="primary" /> : null}
        </div>
        {approved.length ? (
          <Table head={["Finder", "Bedrag", "Rekening"]}>
            {approved.map((p) => (
              <tr key={p.id}><Td>{p.ibanHolder}</Td><Td><Money cents={p.amountCents} size="sm" /></Td><Td className="font-mono text-xs">{maskIban(p.iban)}</Td></tr>
            ))}
          </Table>
        ) : <p className="text-sm text-subtle">Niets goedgekeurd.</p>}
      </section>

      <section>
        <h2 className="mb-3 text-xl">Batches</h2>
        {batches.length === 0 ? <p className="text-sm text-subtle">Nog geen batches.</p> : (
          <Table head={["Referentie", "Aantal", "Totaal", "Status", ""]}>
            {batches.map((b) => (
              <tr key={b.id}>
                <Td className="font-mono text-xs">{b.reference}</Td>
                <Td className="font-mono">{b.payouts.length}</Td>
                <Td><Money cents={b.totalCents} size="sm" /></Td>
                <Td><Badge tone={b.status === "PAID" ? "signal" : "neutral"}>{b.status}</Badge></Td>
                <Td className="flex gap-2">
                  <a href={`/api/admin/batches/${b.id}/xml`} className={buttonVariants({ variant: "outline", size: "sm" })}><Download aria-hidden /> pain.001</a>
                  {b.status === "EXPORTED" ? <AdminAction action={adminMarkBatchPaid.bind(null, b.id)} label="Markeer als uitbetaald" variant="solid" /> : null}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </section>
    </>
  );
}
