import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, isGoogleEnabled } from "@/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { rateLimit } from "@/lib/server/rate-limit";
import { requestFingerprint } from "@/lib/server/hash";
import { safeNext } from "@/lib/safe-next";

export async function LoginForm({ next, error }: { next: string; error?: string }) {
  const t = await getTranslations("auth");

  async function emailLogin(formData: FormData) {
    "use server";
    const parsed = z.string().trim().toLowerCase().email().max(254).safeParse(formData.get("email"));
    const target = safeNext(String(formData.get("next") ?? "/app"), "/app");
    const loginPath = target.startsWith("/en") ? "/en/login" : "/login";
    if (!parsed.success) redirect(`${loginPath}?error=email&next=${encodeURIComponent(target)}`);
    const { ipHash } = await requestFingerprint();
    const limited = await rateLimit("login", ipHash, 8, "10 m");
    if (!limited.ok) redirect(`${loginPath}?error=rate&next=${encodeURIComponent(target)}`);
    // redirect:false so we can send the user to the check page in their own language.
    await signIn("email", { email: parsed.data, redirectTo: target, redirect: false });
    redirect(target.startsWith("/en") ? "/en/login/check" : "/login/check");
  }

  async function googleLogin(formData: FormData) {
    "use server";
    await signIn("google", { redirectTo: safeNext(String(formData.get("next") ?? "/app"), "/app") });
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error === "email" ? t("invalidEmail") : t("error")}
        </p>
      ) : null}
      <form action={emailLogin} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <Field label={t("email")} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder={t("emailPlaceholder")} />
        </Field>
        <Button type="submit" variant="primary" size="lg">
          {t("sendLink")}
        </Button>
      </form>
      {isGoogleEnabled ? (
        <>
          <div className="flex items-center gap-3 text-xs text-subtle">
            <span className="h-px flex-1 bg-border" />
            {t("or")}
            <span className="h-px flex-1 bg-border" />
          </div>
          <form action={googleLogin}>
            <input type="hidden" name="next" value={next} />
            <Button type="submit" variant="outline" size="lg" className="w-full">
              <svg viewBox="0 0 24 24" aria-hidden className="size-4">
                <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
              </svg>
              {t("google")}
            </Button>
          </form>
        </>
      ) : null}
      <p className="text-sm text-subtle">{t("noAccount")}</p>
    </div>
  );
}
