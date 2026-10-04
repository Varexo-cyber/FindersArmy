import { PageHeader } from "@/components/app/app-shell";
import { AdminAction } from "@/components/admin/admin-action";
import { Table, Td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { db } from "@/lib/server/db";
import { finderBalances } from "@/lib/server/services/balances";
import { adminLedgerAdjustmentFor, adminSetFinderStatus } from "@/lib/server/actions/admin";

export default async function AdminFinders({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const finders = await db.finderProfile.findMany({
    where: q ? { user: { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } } : {},
    include: { user: true, _count: { select: { leads: true, invitees: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const balances = await Promise.all(finders.map((f) => finderBalances(f.id)));
  return (
    <>
      <PageHeader title="Finders" />
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Zoek op naam of e-mail" className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm" /></form>
      <Table head={["Finder", "Status", "Score", "Leads / betaald", "Beschikbaar", "Verwacht", ""]}>
        {finders.map((f, i) => (
          <tr key={f.id}>
            <Td>{f.user.name}<div className="font-mono text-xs text-subtle">{f.user.email}</div></Td>
            <Td><Badge tone={f.status === "ACTIVE" ? "olive" : "danger"}>{f.status}</Badge></Td>
            <Td className="font-mono">{f.score}</Td>
            <Td className="font-mono">{f._count.leads} / {f.paidDeals}</Td>
            <Td><Money cents={balances[i]!.availableCents} size="sm" /></Td>
            <Td><Money cents={balances[i]!.expectedCents} size="sm" /></Td>
            <Td className="flex flex-wrap gap-2">
              {f.status !== "SUSPENDED" ? <AdminAction action={adminSetFinderStatus.bind(null, f.id, "SUSPENDED")} label="Schorsen" reason="Reden" variant="ghost" /> : <AdminAction action={adminSetFinderStatus.bind(null, f.id, "ACTIVE")} label="Heractiveren" reason="Reden" />}
              <AdminAction action={adminLedgerAdjustmentFor.bind(null, f.id)} label="Correctie" reason="Reden" extra="Bedrag, bijv. -12,50" variant="ghost" />
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
