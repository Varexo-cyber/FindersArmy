import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/app-shell";
import { AdminAction } from "@/components/admin/admin-action";
import { Table, Td } from "@/components/admin/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/server/db";
import { setCampaignStatusAdmin } from "@/lib/server/actions/admin";
import { formatCents } from "@/lib/money";

export default async function AdminCampaigns() {
  const campaigns = await db.campaign.findMany({ include: { business: true, _count: { select: { leads: true, links: true } } }, orderBy: { createdAt: "desc" }, take: 300 });
  return (
    <>
      <PageHeader title="Campagnes" />
      <Table head={["Campagne", "Bedrijf", "Fee", "Status", "Links / leads", ""]}>
        {campaigns.map((c) => (
          <tr key={c.id}>
            <Td className="font-medium">{c.title}</Td>
            <Td><Link href={`/admin/bedrijven/${c.businessId}`} className="hover:underline">{c.business.name}</Link></Td>
            <Td className="font-mono text-xs">{c.feeType === "PERCENTAGE" ? `${(c.feePercentBps ?? 0) / 100}%` : c.feeType === "FIXED" ? formatCents(c.feeFixedCents ?? 0) : "staffel"}</Td>
            <Td><Badge tone={c.status === "LIVE" ? "signal" : c.status === "SUSPENDED" ? "danger" : "neutral"}>{c.status}</Badge></Td>
            <Td className="font-mono">{c._count.links} / {c._count.leads}</Td>
            <Td>
              {c.status === "LIVE" ? <AdminAction action={setCampaignStatusAdmin.bind(null, c.id, "SUSPENDED")} label="Schorsen" reason="Reden" /> : null}
              {c.status === "SUSPENDED" && c.business.status === "ACTIVE" ? <AdminAction action={setCampaignStatusAdmin.bind(null, c.id, "LIVE")} label="Live" reason="Reden" /> : null}
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
