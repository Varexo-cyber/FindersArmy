"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Download, Trash2 } from "lucide-react";
import { deleteMyAccount } from "@/lib/server/actions/account";
import { Button, buttonVariants } from "@/components/ui/button";

export function AccountPrivacy() {
  const t = useTranslations("finderApp");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="flex flex-col gap-4 rounded-md border border-border p-5">
      <h2 className="text-xl">{t("privacyTitle")}</h2>
      <div className="flex flex-wrap gap-2">
        <a href="/api/account/export" className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Download aria-hidden /> {t("exportData")}
        </a>
        {!confirming ? (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} className="text-danger">
            <Trash2 aria-hidden /> {t("deleteAccount")}
          </Button>
        ) : null}
      </div>
      {confirming ? (
        <div role="alertdialog" aria-labelledby="del-title" className="flex flex-col gap-3 rounded-md border border-danger/50 bg-danger/5 p-4">
          <p id="del-title" className="text-sm">{t("deleteConfirm")}</p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteMyAccount();
                  if (res && !res.ok) setError(res.error === "BALANCE" ? t("deleteBlocked") : res.error);
                })
              }
            >
              {t("deleteAccount")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>✕</Button>
          </div>
          {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
