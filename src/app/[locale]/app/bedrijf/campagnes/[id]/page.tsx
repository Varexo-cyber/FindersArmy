import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/app/app-shell";
import { CampaignForm } from "@/components/forms/campaign-form";
import { requireBusiness } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { campaignToInput } from "@/lib/campaign-defaults";

export default async function EditCampaign({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const campaign = await db.campaign.findFirst({ where: { id, businessId: business.id } });
  if (!campaign) notFound();
  return (
    <>
      <PageHeader title={campaign.title} />
      <div className="max-w-2xl"><CampaignForm campaignId={campaign.id} defaults={campaignToInput(campaign, business.offerUrl)} /></div>
    </>
  );
}
