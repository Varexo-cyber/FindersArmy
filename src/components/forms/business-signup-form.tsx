"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { businessSignupSchema, type BusinessSignupInput } from "@/lib/validation/business";
import type { z } from "zod";

type BusinessSignupOutput = z.output<typeof businessSignupSchema>;
import { registerBusiness } from "@/lib/server/actions/business-signup";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { CampaignTextFields, FeeRuleFields, EuroInput } from "./fee-rule-fields";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

const STEPS: { key: string; fields: FieldPath<BusinessSignupInput>[] }[] = [
  { key: "stepCompany", fields: ["company"] },
  { key: "stepArea", fields: ["categoryId", "serviceArea"] },
  { key: "stepFee", fields: ["campaign"] },
  { key: "stepExtra", fields: ["campaign.offerUrl", "campaign.budget"] },
  { key: "stepTerms", fields: ["terms"] },
];

export function BusinessSignupForm({ categories, defaults }: { categories: Category[]; defaults: { email: string; name: string } }) {
  const t = useTranslations("signupBusiness");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [logo, setLogo] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const methods = useForm<BusinessSignupInput, unknown, BusinessSignupOutput>({
    resolver: zodResolver(businessSignupSchema),
    mode: "onTouched",
    defaultValues: {
      company: { name: "", kvk: "", vatNumber: "", street: "", houseNumber: "", postcode: "", city: "", contactName: defaults.name, phone: "", email: defaults.email, website: "", description: "" },
      categoryId: "",
      serviceArea: { type: "radius", city: "", km: 25 },
      campaign: { title: "", description: "", targetCustomer: "", region: "", feeType: "PERCENTAGE", percent: "8", fixed: "", tiers: [{ from: "500", fee: "100" }, { from: "10.000", fee: "250" }], minJob: "500", minFee: "50", budget: "", offerUrl: "" },
      terms: false as unknown as true,
    },
  });
  const { register, handleSubmit, trigger, formState, control } = methods;
  const areaType = useWatch({ control, name: "serviceArea.type" });

  const e = (path: string) => {
    let node: unknown = formState.errors;
    for (const p of path.split(".")) node = (node as Record<string, unknown> | undefined)?.[p];
    const m = (node as { message?: string } | undefined)?.message;
    return m ? tv(m as "required") : undefined;
  };

  async function next() {
    const ok = await trigger(STEPS[step]!.fields);
    if (ok) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const onSubmit = handleSubmit(() => {
    setFormError(null);
    // Send the raw inputs: the server re-validates with the same schema.
    const values = methods.getValues();
    const fd = new FormData();
    fd.set("payload", JSON.stringify(values));
    if (logo) fd.set("logo", logo);
    startTransition(async () => {
      const res = await registerBusiness(fd);
      if (res.ok) {
        router.push("/app/bedrijf?welkom=1");
        router.refresh();
        return;
      }
      if (res.errors.logo) setFormError(t("logoHint"));
      for (const [path, message] of Object.entries(res.errors)) {
        methods.setError(path as FieldPath<BusinessSignupInput>, { message });
      }
      const firstStep = STEPS.findIndex((s) => Object.keys(res.errors).some((k) => s.fields.some((f) => k.startsWith(f))));
      if (firstStep >= 0) setStep(firstStep);
      if (res.formError) setFormError(res.formError === "BANNED" ? tc("banned") : tc("error"));
    });
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
        <ol className="grid grid-cols-5 gap-1" aria-label="Stappen">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex flex-col gap-2">
              <span className={cn("h-1 rounded-full transition-colors duration-200", i <= step ? "bg-fg" : "bg-border")} />
              <span className={cn("hidden font-mono text-[11px] uppercase tracking-wider sm:block", i === step ? "text-fg" : "text-subtle")} aria-current={i === step ? "step" : undefined}>
                {t(s.key as "stepCompany")}
              </span>
            </li>
          ))}
        </ol>
        <h2 className="text-2xl sm:hidden">{t(STEPS[step]!.key as "stepCompany")}</h2>

        {formError ? <Alert tone="warning">{formError}</Alert> : null}

        <div hidden={step !== 0} className="grid gap-5">
          <Field label={t("name")} htmlFor="name" error={e("company.name")}>
            <Input id="name" autoComplete="organization" aria-invalid={Boolean(e("company.name"))} {...register("company.name")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("kvk")} htmlFor="kvk" hint={t("kvkHint")} error={e("company.kvk")}>
              <Input id="kvk" inputMode="numeric" className="money" aria-invalid={Boolean(e("company.kvk"))} {...register("company.kvk")} />
            </Field>
            <Field label={t("vat")} htmlFor="vat" hint={t("vatHint")} error={e("company.vatNumber")}>
              <Input id="vat" className="money uppercase" aria-invalid={Boolean(e("company.vatNumber"))} {...register("company.vatNumber")} />
            </Field>
          </div>
          <div className="grid grid-cols-[2fr_1fr] gap-5">
            <Field label={t("street")} htmlFor="street" error={e("company.street")}>
              <Input id="street" autoComplete="address-line1" aria-invalid={Boolean(e("company.street"))} {...register("company.street")} />
            </Field>
            <Field label={t("houseNumber")} htmlFor="hn" error={e("company.houseNumber")}>
              <Input id="hn" aria-invalid={Boolean(e("company.houseNumber"))} {...register("company.houseNumber")} />
            </Field>
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-5">
            <Field label={t("postcode")} htmlFor="pc" error={e("company.postcode")}>
              <Input id="pc" autoComplete="postal-code" className="uppercase" aria-invalid={Boolean(e("company.postcode"))} {...register("company.postcode")} />
            </Field>
            <Field label={t("city")} htmlFor="city" error={e("company.city")}>
              <Input id="city" autoComplete="address-level2" aria-invalid={Boolean(e("company.city"))} {...register("company.city")} />
            </Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("contactName")} htmlFor="contact" error={e("company.contactName")}>
              <Input id="contact" autoComplete="name" aria-invalid={Boolean(e("company.contactName"))} {...register("company.contactName")} />
            </Field>
            <Field label={t("phone")} htmlFor="phone" error={e("company.phone")}>
              <Input id="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(e("company.phone"))} {...register("company.phone")} />
            </Field>
          </div>
          <Field label={t("email")} htmlFor="bemail" error={e("company.email")}>
            <Input id="bemail" type="email" autoComplete="email" aria-invalid={Boolean(e("company.email"))} {...register("company.email")} />
          </Field>
          <Field label={`${t("website")} (${tc("optional")})`} htmlFor="web" error={e("company.website")}>
            <Input id="web" type="url" placeholder="https://" aria-invalid={Boolean(e("company.website"))} {...register("company.website")} />
          </Field>
          <Field label={t("description")} htmlFor="desc" hint={t("descriptionHint")} error={e("company.description")}>
            <Textarea id="desc" aria-invalid={Boolean(e("company.description"))} {...register("company.description")} />
          </Field>
          <Field label={`${t("logo")} (${tc("optional")})`} htmlFor="logo" hint={t("logoHint")}>
            <input
              id="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(ev) => setLogo(ev.target.files?.[0] ?? null)}
              className="text-sm file:mr-3 file:h-9 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:text-sm file:text-fg"
            />
          </Field>
        </div>

        <div hidden={step !== 1} className="grid gap-5">
          <Field label={t("category")} htmlFor="cat" error={e("categoryId")}>
            <Select id="cat" aria-invalid={Boolean(e("categoryId"))} {...register("categoryId")}>
              <option value="">{t("categoryPlaceholder")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">{t("areaType")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["radius", "postcodes"] as const).map((type) => (
                <label key={type} className={cn("flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm", areaType === type ? "border-fg bg-surface-2" : "border-border")}>
                  <input type="radio" value={type} className="accent-[var(--olive)]" {...register("serviceArea.type")} />
                  {type === "radius" ? t("areaRadius") : t("areaPostcodes")}
                </label>
              ))}
            </div>
          </fieldset>
          {areaType === "radius" ? (
            <div className="grid grid-cols-[2fr_1fr] gap-5">
              <Field label={t("areaCity")} htmlFor="area-city" error={e("serviceArea.city")}>
                <Input id="area-city" aria-invalid={Boolean(e("serviceArea.city"))} {...register("serviceArea.city")} />
              </Field>
              <Field label={t("areaKm")} htmlFor="area-km" error={e("serviceArea.km")}>
                <Input id="area-km" type="number" min={1} max={250} className="money" {...register("serviceArea.km")} />
              </Field>
            </div>
          ) : (
            <Field label={t("areaPrefixes")} htmlFor="area-pc" hint={t("areaPrefixesHint")} error={e("serviceArea.prefixes")}>
              <Input id="area-pc" className="money" aria-invalid={Boolean(e("serviceArea.prefixes"))} {...register("serviceArea.prefixes")} />
            </Field>
          )}
        </div>

        <div hidden={step !== 2} className="grid gap-8">
          <CampaignTextFields prefix="campaign" />
          <FeeRuleFields prefix="campaign" />
        </div>

        <div hidden={step !== 3} className="grid gap-5">
          <Field label={`${t("offerUrl")} (${tc("optional")})`} htmlFor="offer" hint={t("offerUrlHint")} error={e("campaign.offerUrl")}>
            <Input id="offer" type="url" placeholder="https://" aria-invalid={Boolean(e("campaign.offerUrl"))} {...register("campaign.offerUrl")} />
          </Field>
          <Field label={`${t("budget")} (${tc("optional")})`} htmlFor="budget" hint={t("budgetHint")} error={e("campaign.budget")}>
            <EuroInput id="budget" invalid={Boolean(e("campaign.budget"))} {...register("campaign.budget")} />
          </Field>
        </div>

        <div hidden={step !== 4} className="grid gap-5">
          <Alert title={t("stepTerms")}>{t("clauseSummary")}</Alert>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox {...register("terms")} aria-invalid={Boolean(e("terms"))} />
            <span>
              {t.rich("termsLabel", {
                terms: (chunks) => (
                  <Link href="/voorwaarden/bedrijven" target="_blank" className="underline underline-offset-4">
                    {chunks}
                  </Link>
                ),
              })}
            </span>
          </label>
          {e("terms") ? <p role="alert" className="text-sm text-danger">{e("terms")}</p> : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-6">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft aria-hidden /> {tc("back")}
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="solid" size="lg" onClick={next}>
              {tc("next")} <ArrowRight aria-hidden />
            </Button>
          ) : (
            <Button type="submit" variant="primary" size="lg" disabled={pending}>
              {pending ? tc("sending") : t("submit")} <Check aria-hidden />
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
