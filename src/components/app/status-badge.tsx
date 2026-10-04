import { getTranslations } from "next-intl/server";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { LeadStatus } from "@/lib/lead-status";

const TONE: Record<LeadStatus, BadgeTone> = {
  NEW: "solid",
  CONTACTED: "olive",
  QUOTE_SENT: "olive",
  WON: "signal",
  COMPLETED: "signal",
  CONFIRMED: "signal",
  INVOICED: "olive",
  PAID: "signal",
  PAID_OUT: "signal",
  LOST: "neutral",
  DISPUTED: "danger",
  DUPLICATE: "neutral",
  FRAUD: "danger",
};

export async function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const t = await getTranslations("status");
  return <Badge tone={TONE[status]}>{t(status)}</Badge>;
}

export function statusTone(status: LeadStatus): BadgeTone {
  return TONE[status];
}
