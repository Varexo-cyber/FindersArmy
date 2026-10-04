import { getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { Table, Td } from "@/components/admin/table";
import { LeadStatusBadge } from "@/components/app/status-badge";
import { Money } from "@/components/ui/money";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/server/db";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { cn } from "@/lib/utils";

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const format = await getFormatter();
  const filter = LEAD_STATUSES.includes(status as LeadStatus) ? (status as LeadStatus) : null;
  const leads = await db.lead.findMany({
    where: {
      ...(filter ? { status: filter } : {}),
      ...(q ? { OR: [{ customer: { email: { contains: q, mode: "insensitive" } } }, { customer: { lastName: { contains: q, mode: "insensitive" } } }, { campaign: { business: { name: { contains: q, mode: "insensitive" } } } }] } : {}),
    },
    include: { customer: true, campaign: { include: { business: true } }, finder: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader title="Leads" />
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Zoek op klant, e-mail of bedrijf" className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm" />
        {filter ? <input type="hidden" name="status" value={filter} /> : null}
      </form>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["ALL", ...LEAD_STATUSES] as const).map((s) => (
          <Link key={s} href={s === "ALL" ? "/admin/leads" : `/admin/leads?status=${s}`} className={cn("inline-flex h-7 items-center rounded-md border px-2 font-mono text-[10px]", (s === "ALL" && !filter) || s === filter ? "border-fg bg-fg text-bg" : "border-border text-subtle")}>{s}</Link>
        ))}
      </div>
      {leads.length === 0 ? <EmptyState title="Geen leads gevonden." /> : (
        <Table head={["Klant", "Bedrijf", "Finder", "Status", "Deal", "Signalen", "Datum"]}>
          {leads.map((l) => (
            <tr key={l.id} className="hover:bg-surface-2">
              <Td><Link href={`/admin/leads/${l.id}`} className="font-medium hover:underline">{l.customer.firstName} {l.customer.lastName}</Link></Td>
              <Td>{l.campaign.business.name}</Td>
              <Td className="text-xs">{l.finder.user.email}</Td>
              <Td><LeadStatusBadge status={l.status} /></Td>
              <Td>{l.dealAmountCents ? <Money cents={l.dealAmountCents} size="sm" /> : "—"}</Td>
              <Td className="font-mono text-[10px] text-danger">{l.fraudFlags.join(", ")}</Td>
              <Td className="font-mono text-xs text-subtle">{format.dateTime(l.createdAt, { dateStyle: "short" })}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
