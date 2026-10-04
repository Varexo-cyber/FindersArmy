import { getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { Table, Td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/server/db";
import { cn } from "@/lib/utils";
import type { BusinessStatus } from "@prisma/client";

const FILTERS: (BusinessStatus | "ALL")[] = ["PENDING_REVIEW", "UNDER_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED", "ALL"];

export default async function AdminBusinesses({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "PENDING_REVIEW" } = await searchParams;
  const format = await getFormatter();
  const businesses = await db.business.findMany({
    where: status === "ALL" ? {} : { status: status as BusinessStatus },
    include: { category: true, _count: { select: { campaigns: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <PageHeader title="Bedrijven" />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link key={f} href={`/admin/bedrijven?status=${f}`} className={cn("inline-flex h-8 items-center rounded-md border px-3 font-mono text-[11px]", f === status ? "border-fg bg-fg text-bg" : "border-border text-subtle")}>{f}</Link>
        ))}
      </div>
      {businesses.length === 0 ? (
        <EmptyState title="Niets in deze wachtrij." />
      ) : (
        <Table head={["Bedrijf", "Categorie", "KvK", "Score", "Status", "Aangemeld"]}>
          {businesses.map((b) => (
            <tr key={b.id} className="hover:bg-surface-2">
              <Td><Link href={`/admin/bedrijven/${b.id}`} className="font-medium hover:underline">{b.name}</Link><div className="text-xs text-subtle">{b.city}</div></Td>
              <Td>{b.category.nameNl}</Td>
              <Td className="font-mono">{b.kvk}</Td>
              <Td className="font-mono">{b.score}</Td>
              <Td><Badge tone={b.status === "ACTIVE" ? "signal" : b.status === "PENDING_REVIEW" ? "solid" : "danger"}>{b.status}</Badge></Td>
              <Td className="font-mono text-xs text-subtle">{format.dateTime(b.createdAt, { dateStyle: "medium" })}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
