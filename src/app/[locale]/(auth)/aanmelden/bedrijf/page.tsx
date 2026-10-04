import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/lib/server/session";
import { db } from "@/lib/server/db";
import { LoginForm } from "@/components/auth/login-form";
import { BusinessSignupForm } from "@/components/forms/business-signup-form";
import { localePath } from "@/lib/site";

export const metadata: Metadata = { title: "Bedrijf aanmelden", robots: { index: false } };

export default async function BusinessSignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("signupBusiness");
  const user = await currentUser();
  if (user?.memberships.length) redirect({ href: "/app/bedrijf", locale });
  const categories = user
    ? await db.category.findMany({ where: { excluded: false }, orderBy: { sortOrder: "asc" } })
    : [];
  return (
    <div className="container-x py-12 md:py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        <p className="eyebrow">FindersArmy · {locale === "en" ? "Business" : "Bedrijf"}</p>
        <h1 className="text-4xl md:text-5xl">{t("title")}</h1>
        <p className="mb-6 text-subtle">{t("sub")}</p>
        {user ? (
          <BusinessSignupForm
            categories={categories.map((c) => ({ id: c.id, name: locale === "en" ? c.nameEn : c.nameNl }))}
            defaults={{ email: user.email, name: user.name ?? "" }}
          />
        ) : (
          <div className="flex max-w-sm flex-col gap-4">
            <p>{t("accountStep")}</p>
            <LoginForm next={localePath(locale, "/aanmelden/bedrijf")} />
          </div>
        )}
      </div>
    </div>
  );
}
