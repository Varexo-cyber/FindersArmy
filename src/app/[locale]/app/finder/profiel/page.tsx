import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/app/app-shell";
import { FinderProfileForm } from "@/components/forms/finder-profile-form";
import { AccountPrivacy } from "@/components/app/account-privacy";
import { requireFinder } from "@/lib/server/session";
import { formatIban } from "@/lib/iban";

export default async function FinderProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { user, finder } = await requireFinder();
  const t = await getTranslations("finderApp");
  return (
    <>
      <PageHeader title={t("profileTitle")} sub={user.email} />
      <div className="flex max-w-3xl flex-col gap-10">
        <FinderProfileForm
          defaults={{
            name: user.name ?? "", phone: user.phone ?? "", city: finder.city, nickname: finder.nickname ?? "", leaderboardOptIn: finder.leaderboardOptIn,
            iban: finder.iban ? formatIban(finder.iban) : "", ibanHolder: finder.ibanHolder ?? "", locale: user.locale === "en" ? "en" : "nl",
          }}
        />
        <AccountPrivacy />
      </div>
    </>
  );
}
