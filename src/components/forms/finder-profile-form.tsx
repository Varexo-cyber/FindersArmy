"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { finderProfileSchema, type FinderProfileInput } from "@/lib/validation/finder";
import { updateFinderProfile } from "@/lib/server/actions/finder";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function FinderProfileForm({ defaults }: { defaults: FinderProfileInput }) {
  const t = useTranslations("finderApp");
  const ts = useTranslations("signupFinder");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();
  const { register, handleSubmit, getValues, formState, setError } = useForm<FinderProfileInput, unknown, z.output<typeof finderProfileSchema>>({ resolver: zodResolver(finderProfileSchema), defaultValues: defaults });
  const err = (k: keyof FinderProfileInput) => {
    const m = formState.errors[k]?.message;
    return m ? (m === "iban" ? t("ibanInvalid") : tv(m as "required")) : undefined;
  };
  return (
    <form
      noValidate
      className="grid gap-5 sm:grid-cols-2"
      onSubmit={handleSubmit(() =>
        start(async () => {
          const res = await updateFinderProfile(getValues());
          if (res.ok) setStatus("saved");
          else {
            for (const [k, v] of Object.entries(res.errors ?? {})) setError(k as keyof FinderProfileInput, { message: v });
            setStatus("error");
          }
        }),
      )}
    >
      <Field label={ts("name")} htmlFor="p-name" error={err("name")}><Input id="p-name" {...register("name")} /></Field>
      <Field label={ts("phone")} htmlFor="p-phone" error={err("phone")}><Input id="p-phone" type="tel" {...register("phone")} /></Field>
      <Field label={ts("city")} htmlFor="p-city" error={err("city")}><Input id="p-city" {...register("city")} /></Field>
      <Field label="Taal / Language" htmlFor="p-locale">
        <Select id="p-locale" {...register("locale")}><option value="nl">Nederlands</option><option value="en">English</option></Select>
      </Field>
      <Field label={t("iban")} htmlFor="p-iban" error={err("iban")}><Input id="p-iban" className="money uppercase" autoComplete="off" {...register("iban")} /></Field>
      <Field label={t("ibanHolder")} htmlFor="p-holder" error={err("ibanHolder")}><Input id="p-holder" {...register("ibanHolder")} /></Field>
      <Field label={ts("nickname")} htmlFor="p-nick" hint={ts("nicknameHint")} error={err("nickname")}><Input id="p-nick" {...register("nickname")} /></Field>
      <label className="flex items-start gap-3 self-end pb-3 text-sm"><Checkbox {...register("leaderboardOptIn")} /><span>{ts("leaderboard")}</span></label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" variant="primary" disabled={pending}>{pending ? tc("saving") : tc("save")}</Button>
        {status === "saved" ? <Alert tone="success">{t("profileSaved")}</Alert> : status === "error" ? <Alert tone="warning">{tc("error")}</Alert> : null}
      </div>
    </form>
  );
}
