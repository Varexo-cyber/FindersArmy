"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { companySchema } from "@/lib/validation/business";
import { updateBusinessProfile } from "@/lib/server/actions/business";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

type Input = z.input<typeof companySchema>;

export function BusinessProfileForm({ defaults }: { defaults: Input }) {
  const t = useTranslations("signupBusiness");
  const tb = useTranslations("businessApp");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const [logo, setLogo] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();
  const { register, handleSubmit, getValues, formState } = useForm<Input, unknown, z.output<typeof companySchema>>({ resolver: zodResolver(companySchema), defaultValues: defaults });
  const err = (k: keyof Input) => (formState.errors[k]?.message ? tv(formState.errors[k]!.message as "required") : undefined);

  const fields: { k: keyof Input; label: string; type?: string; area?: boolean }[] = [
    { k: "name", label: t("name") },
    { k: "kvk", label: t("kvk") },
    { k: "vatNumber", label: t("vat") },
    { k: "street", label: t("street") },
    { k: "houseNumber", label: t("houseNumber") },
    { k: "postcode", label: t("postcode") },
    { k: "city", label: t("city") },
    { k: "contactName", label: t("contactName") },
    { k: "phone", label: t("phone"), type: "tel" },
    { k: "email", label: t("email"), type: "email" },
    { k: "website", label: t("website"), type: "url" },
    { k: "description", label: t("description"), area: true },
  ];

  return (
    <form
      noValidate
      onSubmit={handleSubmit(() => {
        const fd = new FormData();
        fd.set("payload", JSON.stringify(getValues()));
        if (logo) fd.set("logo", logo);
        start(async () => setStatus((await updateBusinessProfile(fd)).ok ? "saved" : "error"));
      })}
      className="grid gap-5 sm:grid-cols-2"
    >
      {fields.map((f) => (
        <Field key={f.k} label={f.label} htmlFor={`bp-${f.k}`} error={err(f.k)} className={f.area ? "sm:col-span-2" : undefined}>
          {f.area ? <Textarea id={`bp-${f.k}`} {...register(f.k)} /> : <Input id={`bp-${f.k}`} type={f.type ?? "text"} {...register(f.k)} />}
        </Field>
      ))}
      <Field label={t("logo")} htmlFor="bp-logo" hint={t("logoHint")} className="sm:col-span-2">
        <input id="bp-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} className="text-sm" />
      </Field>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" variant="primary" disabled={pending}>{pending ? tc("saving") : tc("save")}</Button>
        {status === "saved" ? <Alert tone="success">{tb("profileSaved")}</Alert> : status === "error" ? <Alert tone="warning">{tc("error")}</Alert> : null}
      </div>
    </form>
  );
}
