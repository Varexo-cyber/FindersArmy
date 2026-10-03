import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { safeNext } from "@/lib/safe-next";
import { currentUser } from "@/lib/server/session";
import { localePath } from "@/lib/site";

export const metadata: Metadata = { title: "Inloggen", robots: { index: false } };

export default async function LoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string; error?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next, error } = await searchParams;
  const target = safeNext(next, localePath(locale, "/app"));
  if (await currentUser()) redirect(target);
  const t = await getTranslations("auth");
  return (
    <div className="container-x flex flex-1 items-start justify-center py-16 md:items-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-4xl">{t("loginTitle")}</h1>
        <p className="mb-8 text-subtle">{t("loginSub")}</p>
        <LoginForm next={target} error={error} />
      </div>
    </div>
  );
}
