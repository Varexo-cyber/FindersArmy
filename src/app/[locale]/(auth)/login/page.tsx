import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { safeNext } from "@/lib/safe-next";
import { currentUser } from "@/lib/server/session";
import { localePath } from "@/lib/site";
import { isDemoMode } from "@/lib/env";

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
        {isDemoMode() ? (
          // TEMPORARY (test phase): one-click demo accounts. Remove with /api/demo-login.
          <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-dashed border-border p-5">
            <p className="text-sm font-medium">Demo (tijdelijk)</p>
            <p className="text-xs text-subtle">Log direct in op een demo-account met voorbeelddata.</p>
            <div className="grid gap-2">
              {[
                ["admin", "Demo: eigenaar / admin"],
                ["bedrijf", "Demo: bedrijf"],
                ["finder", "Demo: Finder"],
              ].map(([as, label]) => (
                <a key={as} href={`/api/demo-login?as=${as}`} className="flex h-11 items-center justify-between rounded-xl bg-fg px-4 text-sm font-medium text-bg hover:opacity-90">
                  {label} <span aria-hidden>→</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
