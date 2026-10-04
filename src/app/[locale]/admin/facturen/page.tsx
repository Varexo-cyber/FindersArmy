import { getFormatter } from "next-intl/server";
import { Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { AdminAction } from "@/components/admin/admin-action";
import { Table, Td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/server/db";
import { adminCancelInvoice, adminMarkBonusSent, adminMarkInvoicePaid } from "@/lib/server/actions/admin";
import type { InvoiceStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

export default async function AdminInvoices({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const format = await getFormatter();
  const filter = ["OPEN", "OVERDUE", "PAID", "CANCELLED"].includes(status ?? "") ? (status as InvoiceStatus) : null;
  const [invoices, bonuses] = await Promise.all([
    db.invoice.findMany({ where: filter ? { status: filter } : {}, include: { business: true }, orderBy: { issuedAt: "desc" }, take: 200 }),
    db.confirmation.findMany({ where: { confirmedAt: { not: null }, bonusCents: { gt: 0 }, bonusSentAt: null }, include: { lead: { include: { customer: true, campaign: { include: { business: true } } } } } }),
  ]);
  return (
    <>
      <PageHeader title="Facturen" />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["ALL", "OPEN", "OVERDUE", "PAID", "CANCELLED"].map((s) => (
          <Link key={s} href={s === "ALL" ? "/admin/facturen" : `/admin/facturen?status=${s}`} className={cn("inline-flex h-8 items-center rounded-md border px-3 font-mono text-[11px]", (s === "ALL" && !filter) || s === filter ? "border-fg bg-fg text-bg" : "border-border text-subtle")}>{s}</Link>
        ))}
      </div>
      <Table head={["Nummer", "Bedrijf", "Totaal", "Status", "Vervalt", "Herinneringen", ""]}>
        {invoices.map((i) => (
          <tr key={i.id}>
            <Td className="font-mono text-xs">{i.number}</Td>
            <Td><Link href={`/admin/bedrijven/${i.businessId}`} className="hover:underline">{i.business.name}</Link></Td>
            <Td><Money cents={i.totalCents} size="sm" /></Td>
            <Td><Badge tone={i.status === "PAID" ? "signal" : i.status === "OVERDUE" ? "danger" : "neutral"}>{i.status}</Badge></Td>
            <Td className="font-mono text-xs">{format.dateTime(i.dueAt, { dateStyle: "short" })}</Td>
            <Td className="font-mono">{i.remindersSent}</Td>
            <Td className="flex gap-2">
              <a href={`/api/invoices/${i.id}/pdf`} className={buttonVariants({ variant: "ghost", size: "sm" })} aria-label={`PDF ${i.number}`}><Download aria-hidden /></a>
              {i.status === "OPEN" || i.status === "OVERDUE" ? (
                <>
                  <AdminAction action={adminMarkInvoicePaid.bind(null, i.id)} label="Betaald" />
                  <AdminAction action={adminCancelInvoice.bind(null, i.id)} label="Annuleren" reason="Reden" variant="ghost" />
                </>
              ) : null}
            </Td>
          </tr>
        ))}
      </Table>
      <h2 className="mt-10 mb-3 text-xl">Cadeaubonnen te versturen ({bonuses.length})</h2>
      {bonuses.length === 0 ? <p className="text-sm text-subtle">Niets te versturen.</p> : (
        <Table head={["Klant", "E-mail", "Bedrijf", "Bedrag", ""]}>
          {bonuses.map((b) => (
            <tr key={b.id}>
              <Td>{b.lead.customer.firstName} {b.lead.customer.lastName}</Td>
              <Td className="font-mono text-xs">{b.lead.customer.email}</Td>
              <Td>{b.lead.campaign.business.name}</Td>
              <Td><Money cents={b.bonusCents} size="sm" /></Td>
              <Td><AdminAction action={adminMarkBonusSent.bind(null, b.id)} label="Verstuurd" /></Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
