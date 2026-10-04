"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { ArrowRight } from "lucide-react";
import { finderSignupSchema, type FinderSignupInput } from "@/lib/validation/finder";
import { registerFinder } from "@/lib/server/actions/finder";
import { ageOn } from "@/lib/age";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Link, useRouter } from "@/i18n/navigation";

export function FinderSignupForm({ defaults, allow16Plus }: { defaults: { name: string; inviteCode?: string }; allow16Plus: boolean }) {
  const t = useTranslations("signupFinder");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState, setError, control, getValues } = useForm<FinderSignupInput, unknown, z.output<typeof finderSignupSchema>>({
    resolver: zodResolver(finderSignupSchema),
    mode: "onTouched",
    defaultValues: { name: defaults.name, birthDate: "", phone: "", city: "", nickname: "", leaderboardOptIn: false, inviteCode: defaults.inviteCode ?? "", parentEmail: "", terms: false as unknown as true },
  });
  const birth = useWatch({ control, name: "birthDate" });
  const age = birth && /^\d{4}-\d{2}-\d{2}$/.test(birth) ? ageOn(new Date(`${birth}T00:00:00Z`), new Date()) : null;
  const minor = age !== null && age < 18;

  const msg = (m?: string) => (!m ? undefined : m === "underage" ? t("underage") : tv(m as "required"));
  const err = (k: keyof FinderSignupInput) => msg(formState.errors[k]?.message);

  const onSubmit = handleSubmit(() => {
    setFormError(null);
    start(async () => {
      const res = await registerFinder(getValues());
      if (res.ok) {
        router.push("/app/finder?welkom=1");
        router.refresh();
        return;
      }
      for (const [k, v] of Object.entries(res.errors ?? {})) setError(k as keyof FinderSignupInput, { message: v });
      if (res.error) setFormError(tc("error"));
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <Alert tone="warning">{formError}</Alert> : null}
      <Field label={t("name")} htmlFor="f-name" error={err("name")}>
        <Input id="f-name" autoComplete="name" aria-invalid={Boolean(err("name"))} {...register("name")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("birthDate")} htmlFor="f-birth" hint={t("birthDateHint")} error={err("birthDate") ?? (minor && !allow16Plus ? t("underage") : undefined)}>
          <Input id="f-birth" type="date" autoComplete="bday" aria-invalid={Boolean(err("birthDate"))} {...register("birthDate")} />
        </Field>
        <Field label={t("city")} htmlFor="f-city" error={err("city")}>
          <Input id="f-city" autoComplete="address-level2" aria-invalid={Boolean(err("city"))} {...register("city")} />
        </Field>
      </div>
      {minor && allow16Plus && age !== null && age >= 16 ? (
        <div className="flex flex-col gap-3 rounded-md border border-border p-4">
          <p className="font-medium">{t("parentTitle")}</p>
          <p className="text-sm text-subtle">{t("parentBody")}</p>
          <Field label={t("parentEmail")} htmlFor="f-parent" error={err("parentEmail")}>
            <Input id="f-parent" type="email" {...register("parentEmail")} />
          </Field>
        </div>
      ) : null}
      <Field label={t("phone")} htmlFor="f-phone" hint={t("phoneHint")} error={err("phone")}>
        <Input id="f-phone" type="tel" autoComplete="tel" aria-invalid={Boolean(err("phone"))} {...register("phone")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={`${t("nickname")} (${tc("optional")})`} htmlFor="f-nick" hint={t("nicknameHint")} error={err("nickname")}>
          <Input id="f-nick" {...register("nickname")} />
        </Field>
        <Field label={`${t("inviteCode")} (${tc("optional")})`} htmlFor="f-invite">
          <Input id="f-invite" className="money" {...register("inviteCode")} />
        </Field>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <Checkbox {...register("leaderboardOptIn")} />
        <span>{t("leaderboard")}</span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <Checkbox aria-invalid={Boolean(err("terms"))} {...register("terms")} />
        <span>
          {t.rich("terms", {
            terms: (c) => <Link href="/voorwaarden/finders" target="_blank" className="underline underline-offset-4">{c}</Link>,
            privacy: (c) => <Link href="/privacy" target="_blank" className="underline underline-offset-4">{c}</Link>,
          })}
        </span>
      </label>
      {err("terms") ? <p role="alert" className="text-sm text-danger">{err("terms")}</p> : null}
      <p className="text-sm text-subtle">{t("ibanLater")}</p>
      <Button type="submit" variant="primary" size="lg" disabled={pending || (minor && !allow16Plus)} className="self-start">
        {pending ? tc("saving") : t("submit")} <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}
