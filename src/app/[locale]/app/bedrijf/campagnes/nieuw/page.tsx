import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/app/app-shell";
import { CampaignForm } from "@/components/forms/campaign-form";
import { requireBusiness } from "@/lib/server/session";
import { campaignToInput } from "@/lib/campaign-defaults";

export default async function NewCampaign({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const t = await getTranslations("businessApp");
  return (
    <>
      <PageHeader title={t("campaignsNew")} />
      <div className="max-w-2xl"><CampaignForm campaignId={null} defaults={campaignToInput(null, business.offerUrl)} /></div>
    </>
  );
}
