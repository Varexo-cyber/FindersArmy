"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { respondToConfirmation } from "@/lib/server/actions/confirm";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { EuroInput } from "./fee-rule-fields";
import { formatCents } from "@/lib/money";

export function ConfirmForm({ token, bonusCents }: { token: string; bonusCents: number }) {
  const t = useTranslations("confirm");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const [mode, setMode] = useState<"choose" | "correct" | "not_done">("choose");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<null | { outcome: string; bonus?: number }>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send(kind: "confirm" | "correct" | "not_done") {
    setError(null);
    start(async () => {
      const res = await respondToConfirmation({ token, kind, amount, note });
      if (res.ok) setResult({ outcome: res.outcome, bonus: res.bonusCents });
      else setError(res.error === "AMOUNT" ? tv("amount") : tc("error"));
    });
  }

  if (result) {
    const map = {
      confirmed: [t("doneTitle"), t("doneBody", { amount: formatCents(result.bonus ?? bonusCents, locale) })],
      disputed: [t("disputedTitle"), t("disputedBody")],
      noted: [t("notedTitle"), t("notedBody")],
      already: [t("alreadyTitle"), t("alreadyBody")],
    } as Record<string, [string, string]>;
    const [title, body] = map[result.outcome] ?? map.already!;
    return (
      <div role="status" className="flex flex-col gap-3">
        <CheckCircle2 aria-hidden className="size-10 text-olive dark:text-accent" strokeWidth={1.5} />
        <h2 className="text-3xl">{title}</h2>
        <p className="text-subtle">{body}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "choose" ? (
        <>
          <Button variant="primary" size="xl" onClick={() => send("confirm")} disabled={pending} className="w-full">{t("yes")}</Button>
          {bonusCents > 0 ? <p className="text-center text-sm text-subtle">{t("bonus", { amount: formatCents(bonusCents, locale) })}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => setMode("correct")}>{t("correct")}</Button>
            <Button variant="outline" onClick={() => setMode("not_done")}>{t("notDone")}</Button>
          </div>
        </>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); send(mode); }}>
          {mode === "correct" ? (
            <Field label={t("correctLabel")} htmlFor="c-amount">
              <EuroInput id="c-amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>
          ) : null}
          <Field label={t("note")} htmlFor="c-note">
            <Textarea id="c-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" variant="solid" disabled={pending}>{mode === "correct" ? t("submitCorrection") : t("submitNotDone")}</Button>
            <Button type="button" variant="ghost" onClick={() => setMode("choose")}>{tc("back")}</Button>
          </div>
        </form>
      )}
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
