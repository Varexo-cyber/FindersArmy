import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/app/app-shell";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import { AccountPrivacy } from "@/components/app/account-privacy";
import { requireBusiness } from "@/lib/server/session";

export default async function BusinessProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { business } = await requireBusiness();
  const t = await getTranslations("businessApp");
  return (
    <>
      <PageHeader title={t("profileTitle")} />
      <div className="flex max-w-3xl flex-col gap-10">
        <BusinessProfileForm
          defaults={{
            name: business.name, kvk: business.kvk, vatNumber: business.vatNumber, street: business.street, houseNumber: business.houseNumber,
            postcode: business.postcode, city: business.city, contactName: business.contactName, phone: business.phone, email: business.email,
            website: business.website ?? "", description: business.description,
          }}
        />
        <AccountPrivacy />
      </div>
    </>
  );
}
