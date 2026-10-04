import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { currentUser } from "@/lib/server/session";
import { LoginForm } from "@/components/auth/login-form";
import { FinderSignupForm } from "@/components/forms/finder-signup-form";
import { localePath } from "@/lib/site";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Word Finder", robots: { index: false } };

export default async function FinderSignupPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ invite?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { invite } = await searchParams;
  const t = await getTranslations("signupFinder");
  const user = await currentUser();
  if (user?.finderProfile) redirect({ href: "/app/finder", locale });
  const inviteCode = invite ?? (await cookies()).get("fa_invite")?.value;
  return (
    <div className="container-x py-12 md:py-16">
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        <p className="eyebrow">FindersArmy · Finder</p>
        <h1 className="text-4xl md:text-5xl">{t("title")}</h1>
        <p className="mb-6 text-subtle">{t("sub")}</p>
        {user ? (
          <FinderSignupForm defaults={{ name: user.name ?? "", inviteCode }} allow16Plus={env().ALLOW_16_PLUS} />
        ) : (
          <div className="flex max-w-sm flex-col gap-4">
            <p>{t("accountStep")}</p>
            <LoginForm next={localePath(locale, invite ? `/aanmelden/finder?invite=${encodeURIComponent(invite)}` : "/aanmelden/finder")} />
          </div>
        )}
      </div>
    </div>
  );
}
