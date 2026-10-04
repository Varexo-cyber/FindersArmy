import { getFormatter } from "next-intl/server";
import { PageHeader } from "@/components/app/app-shell";
import { Table, Td } from "@/components/admin/table";
import { db } from "@/lib/server/db";

export default async function AdminAudit({ searchParams }: { searchParams: Promise<{ entity?: string }> }) {
  const { entity } = await searchParams;
  const format = await getFormatter();
  const rows = await db.auditLog.findMany({ where: entity ? { entity } : {}, include: { actor: true }, orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <>
      <PageHeader title="Audit log" sub="Alle wijzigingen door het team en het systeem. Alleen lezen." />
      <Table head={["Tijd", "Actie", "Entiteit", "Door", "Details"]}>
        {rows.map((r) => (
          <tr key={r.id}>
            <Td className="font-mono text-xs whitespace-nowrap">{format.dateTime(r.createdAt, { dateStyle: "short", timeStyle: "medium" })}</Td>
            <Td className="font-mono text-xs">{r.action}</Td>
            <Td className="font-mono text-xs">{r.entity}:{r.entityId.slice(-8)}</Td>
            <Td className="text-xs">{r.actor?.email ?? "systeem"}</Td>
            <Td className="max-w-[360px] truncate font-mono text-[10px] text-subtle">{r.after ? JSON.stringify(r.after) : ""}</Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
