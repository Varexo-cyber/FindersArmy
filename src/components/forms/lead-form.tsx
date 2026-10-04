"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { CheckCircle2, Send } from "lucide-react";
import { leadSchema, TIMEFRAMES, type LeadInput } from "@/lib/validation/lead";
import { submitLead } from "@/lib/server/actions/lead";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Link } from "@/i18n/navigation";

export function LeadForm({ code, business, finder }: { code: string; business: string; finder: string }) {
  const t = useTranslations("referral");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<null | "created" | "duplicate">(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { register, handleSubmit, formState, setError: setFieldError } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    mode: "onTouched",
    defaultValues: { timeframe: "1_MONTH" },
  });
  const err = (k: keyof LeadInput) => (formState.errors[k]?.message ? tv(formState.errors[k]!.message as "required") : undefined);

  const onSubmit = handleSubmit(() => {
    setError(null);
    const fd = new FormData(formRef.current!);
    start(async () => {
      const res = await submitLead(code, fd);
      if (res.ok) {
        setDone(res.kind);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      for (const [k, v] of Object.entries(res.errors ?? {})) setFieldError(k as keyof LeadInput, { message: v });
      if (res.error) setError(t(`errors.${res.error}` as "errors.RATE_LIMIT"));
    });
  });

  if (done) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <CheckCircle2 aria-hidden className="size-10 text-olive dark:text-accent" strokeWidth={1.5} />
        <h2 className="text-3xl">{done === "created" ? t("doneTitle") : t("duplicateTitle")}</h2>
        <p>{done === "created" ? t("doneBody", { business }) : t("duplicateBody", { business })}</p>
        {done === "created" ? <p className="text-sm text-subtle">{t("doneNext")}</p> : null}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? <Alert tone="warning">{error}</Alert> : null}
      <div className="grid grid-cols-2 gap-4">
        <Field label={t("firstName")} htmlFor="l-first" error={err("firstName")}>
          <Input id="l-first" autoComplete="given-name" aria-invalid={Boolean(err("firstName"))} {...register("firstName")} />
        </Field>
        <Field label={t("lastName")} htmlFor="l-last" error={err("lastName")}>
          <Input id="l-last" autoComplete="family-name" aria-invalid={Boolean(err("lastName"))} {...register("lastName")} />
        </Field>
      </div>
      <Field label={t("phone")} htmlFor="l-phone" error={err("phone")}>
        <Input id="l-phone" type="tel" autoComplete="tel" inputMode="tel" aria-invalid={Boolean(err("phone"))} {...register("phone")} />
      </Field>
      <Field label={t("email")} htmlFor="l-email" error={err("email")}>
        <Input id="l-email" type="email" autoComplete="email" inputMode="email" aria-invalid={Boolean(err("email"))} {...register("email")} />
      </Field>
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <Field label={t("postcode")} htmlFor="l-pc" error={err("postcode")}>
          <Input id="l-pc" autoComplete="postal-code" className="uppercase" aria-invalid={Boolean(err("postcode"))} {...register("postcode")} />
        </Field>
        <Field label={t("houseNumber")} htmlFor="l-hn" error={err("houseNumber")}>
          <Input id="l-hn" aria-invalid={Boolean(err("houseNumber"))} {...register("houseNumber")} />
        </Field>
      </div>
      <Field label={`${t("city")} (${tc("optional")})`} htmlFor="l-city">
        <Input id="l-city" autoComplete="address-level2" {...register("city")} />
      </Field>
      <Field label={t("description")} htmlFor="l-desc" error={err("description")}>
        <Textarea id="l-desc" placeholder={t("descriptionPlaceholder")} aria-invalid={Boolean(err("description"))} {...register("description")} />
      </Field>
      <Field label={t("timeframe")} htmlFor="l-time">
        <Select id="l-time" {...register("timeframe")}>
          {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{t(`timeframes.${tf}`)}</option>)}
        </Select>
      </Field>
      <Field label={`${t("photos")} (${tc("optional")})`} htmlFor="l-photos" hint={t("photosHint")}>
        <input id="l-photos" name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="text-sm file:mr-3 file:h-9 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:text-sm file:text-fg" />
      </Field>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input tabIndex={-1} autoComplete="off" {...register("website")} /></label>
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
        <label className="flex items-start gap-3 text-sm">
          <Checkbox aria-invalid={Boolean(err("consent"))} {...register("consent")} />
          <span className="font-medium">{t("consent", { business })}</span>
        </label>
        <p className="pl-8 text-xs text-subtle">
          {t.rich("consentExplain", { business, finder, privacy: (c) => <Link href="/privacy" target="_blank" className="underline underline-offset-2">{c}</Link> })}
        </p>
        {err("consent") ? <p role="alert" className="pl-8 text-sm text-danger">{err("consent")}</p> : null}
      </div>
      <Button type="submit" variant="primary" size="xl" disabled={pending} className="w-full">
        {pending ? tc("sending") : t("submit")} <Send aria-hidden />
      </Button>
    </form>
  );
}
