"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { reportCompletedJob } from "@/lib/server/actions/finder";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function ReportForm({ leadId }: { leadId: string }) {
  const t = useTranslations("finderApp");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sent" | "error">("idle");
  const [pending, start] = useTransition();
  if (state === "sent") return <Alert tone="success">{t("reportSent")}</Alert>;
  if (!open) return <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="self-start px-0 underline underline-offset-4">{t("reportButton")}</Button>;
  return (
    <form
      className="flex flex-col gap-3 rounded-md border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await reportCompletedJob(leadId, text);
          setState(res.ok ? "sent" : "error");
        });
      }}
    >
      <p className="font-medium">{t("reportTitle")}</p>
      <p className="text-sm text-subtle">{t("reportBody")}</p>
      <label className="sr-only" htmlFor={`rep-${leadId}`}>{t("reportMessage")}</label>
      <Textarea id={`rep-${leadId}`} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("reportMessage")} minLength={10} maxLength={1000} required />
      {state === "error" ? <p role="alert" className="text-sm text-danger">{text.trim().length < 10 ? tv("tooShort") : tc("error")}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" variant="solid" size="sm" disabled={pending}>{tc("send")}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>{tc("cancel")}</Button>
      </div>
    </form>
  );
}
