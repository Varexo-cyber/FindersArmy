"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ErrorShell } from "@/components/errors/error-shell";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  const tc = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <ErrorShell code={error.digest ? `500 · ${error.digest}` : "500"} title={t("serverTitle")} body={t("serverBody")}>
      <Button variant="primary" onClick={reset}>{tc("tryAgain")}</Button>
      <a href="/" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm">{t("home")}</a>
    </ErrorShell>
  );
}
