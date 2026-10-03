import type { Metadata } from "next";
import { MailCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { devMailboxEnabled } from "@/lib/server/dev";

export const metadata: Metadata = { title: "Check je e-mail", robots: { index: false } };

export default async function CheckPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <div className="container-x flex flex-1 items-start justify-center py-16 md:items-center">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <span className="flex size-12 items-center justify-center rounded-md border border-border">
          <MailCheck aria-hidden className="size-6" strokeWidth={1.5} />
        </span>
        <h1 className="text-4xl">{t("checkTitle")}</h1>
        <p className="text-subtle">{t("checkBody")}</p>
        {devMailboxEnabled() ? (
          <a href="/api/dev/mail" className="font-mono text-sm underline underline-offset-4">
            {t("devMailbox")} →
          </a>
        ) : null}
      </div>
    </div>
  );
}
