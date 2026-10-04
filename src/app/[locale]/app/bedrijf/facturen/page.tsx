import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Money } from "@/components/ui/money";
import { buttonVariants } from "@/components/ui/button";
import { requireBusiness } from "@/lib/server/session";
import { db } from "@/lib/server/db";

export default async function InvoicesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ betaald?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const t = await getTranslations("businessApp");
  const tc = await getTranslations("common");
  const format = await getFormatter();
  const { betaald } = await searchParams;
  const invoices = await db.invoice.findMany({ where: { businessId: business.id }, orderBy: { issuedAt: "desc" } });
  return (
    <>
      <PageHeader title={t("invoicesTitle")} />
      {betaald ? <Alert tone="success" className="mb-6">{t("invoicePaid", { number: betaald.slice(0, 20) })}</Alert> : null}
      {invoices.length === 0 ? (
        <EmptyState icon={FileText} title={t("invoicesTitle")} body={t("invoicesEmpty")} />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {invoices.map((inv) => (
            <li key={inv.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-4 md:grid-cols-[1fr_auto_auto_auto]">
              <div className="flex flex-col">
                <span className="font-mono text-sm">{inv.number}</span>
                <span className="text-xs text-subtle">
                  {t("invoiceDue")} {format.dateTime(inv.dueAt, { dateStyle: "medium" })}
                </span>
              </div>
              <Money cents={inv.totalCents} />
              <Badge tone={inv.status === "PAID" ? "signal" : inv.status === "OVERDUE" ? "danger" : "neutral"}>{t(`invoiceStatus.${inv.status}`)}</Badge>
              <div className="col-span-2 flex gap-2 md:col-span-1">
                <a href={`/api/invoices/${inv.id}/pdf`} className={buttonVariants({ variant: "outline", size: "sm" })} aria-label={`${tc("download")} ${inv.number}`}>
                  <Download aria-hidden /> PDF
                </a>
                {inv.status !== "PAID" && inv.paymentUrl ? (
                  <a href={inv.paymentUrl} className={buttonVariants({ variant: "primary", size: "sm" })}>{t("payNow")}</a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
