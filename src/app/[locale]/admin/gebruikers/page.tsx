import { PageHeader } from "@/components/app/app-shell";
import { AdminAction } from "@/components/admin/admin-action";
import { Table, Td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/server/db";
import { adminBanUser, adminUnbanUser } from "@/lib/server/actions/admin";

/** Every account in one place: who they are, what they do here, and the ban switch. */
export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const { q, filter } = await searchParams;
  const users = await db.user.findMany({
    where: {
      ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}),
      ...(filter === "banned" ? { bannedAt: { not: null } } : {}),
      deletedAt: null,
    },
    include: { finderProfile: { select: { status: true, paidDeals: true } }, memberships: { include: { business: { select: { name: true, status: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 150,
  });
  const bans = await db.ban.count();
  return (
    <>
      <PageHeader title="Gebruikers" sub={`Alle accounts. ${bans} geblokkeerde e-mailadressen en KvK-nummers op de banlijst.`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Zoek op naam of e-mail" className="h-9 min-w-56 flex-1 rounded-md border border-border bg-surface px-3 text-sm" />
        <select name="filter" defaultValue={filter ?? ""} className="h-9 rounded-md border border-border bg-surface px-3 text-sm">
          <option value="">Iedereen</option>
          <option value="banned">Alleen gebande accounts</option>
        </select>
        <button className="h-9 rounded-md bg-fg px-4 text-sm text-bg">Zoeken</button>
      </form>
      <Table head={["Account", "Rollen", "Status", "Aangemaakt", ""]}>
        {users.map((u) => (
          <tr key={u.id}>
            <Td>
              {u.name ?? "—"}
              <div className="font-mono text-xs text-subtle">{u.email}</div>
            </Td>
            <Td className="text-sm">
              {u.adminRole ? <Badge tone="signal">{u.adminRole}</Badge> : null}
              {u.finderProfile ? <div>Finder · {u.finderProfile.paidDeals} betaalde deals</div> : null}
              {u.memberships.map((m) => <div key={m.businessId}>Bedrijf · {m.business.name}</div>)}
            </Td>
            <Td>
              {u.bannedAt ? (
                <>
                  <Badge tone="danger">Geband</Badge>
                  <div className="mt-1 max-w-56 text-xs text-subtle">{u.bannedReason}</div>
                </>
              ) : (
                <Badge tone="olive">Actief</Badge>
              )}
            </Td>
            <Td className="font-mono text-xs">{u.createdAt.toISOString().slice(0, 10)}</Td>
            <Td>
              {u.adminRole ? null : u.bannedAt ? (
                <AdminAction action={adminUnbanUser.bind(null, u.id)} label="Ban opheffen" reason="Reden" />
              ) : (
                <AdminAction action={adminBanUser.bind(null, u.id)} label="Bannen" reason="Reden van ban (intern)" variant="danger" />
              )}
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
