"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { calculateFee, type FeeRule } from "@/lib/fees";
import { formatCents, parseEuroToCents } from "@/lib/money";
import { DEFAULT_RANKS } from "@/lib/ranks";
import { cn } from "@/lib/utils";

type Errors = Record<string, { message?: string } | undefined>;

function useFieldError(prefix: string) {
  const { formState } = useFormContext();
  const t = useTranslations("validation");
  return (name: string) => {
    const path = (prefix ? `${prefix}.${name}` : name).split(".");
    let node: unknown = formState.errors;
    for (const p of path) node = (node as Record<string, unknown> | undefined)?.[p];
    const msg = (node as { message?: string } | undefined)?.message;
    return msg ? t(msg as "required") : undefined;
  };
}

/** Campaign text fields. Shared by sign-up and the campaign editor. */
export function CampaignTextFields({ prefix = "" }: { prefix?: string }) {
  const { register } = useFormContext();
  const t = useTranslations("signupBusiness");
  const err = useFieldError(prefix);
  const n = (k: string) => (prefix ? `${prefix}.${k}` : k);
  return (
    <div className="grid gap-5">
      <Field label={t("campaignTitle")} htmlFor="c-title" error={err("title")}>
        <Input id="c-title" placeholder={t("campaignTitlePlaceholder")} aria-invalid={Boolean(err("title"))} {...register(n("title"))} />
      </Field>
      <Field label={t("targetCustomer")} htmlFor="c-target" error={err("targetCustomer")}>
        <Input id="c-target" placeholder={t("targetCustomerPlaceholder")} aria-invalid={Boolean(err("targetCustomer"))} {...register(n("targetCustomer"))} />
      </Field>
      <Field label={t("description")} htmlFor="c-desc" error={err("description")} hint={t("descriptionHint")}>
        <Textarea id="c-desc" aria-invalid={Boolean(err("description"))} {...register(n("description"))} />
      </Field>
      <Field label={t("areaType")} htmlFor="c-region" error={err("region")}>
        <Input id="c-region" placeholder="Westland" aria-invalid={Boolean(err("region"))} {...register(n("region"))} />
      </Field>
    </div>
  );
}

/** One fee rule per campaign: percentage, fixed, or tiered, plus minimums and a live preview. */
export function FeeRuleFields({ prefix = "" }: { prefix?: string }) {
  const { register, control } = useFormContext();
  const t = useTranslations("signupBusiness");
  const locale = useLocale();
  const err = useFieldError(prefix);
  const n = (k: string) => (prefix ? `${prefix}.${k}` : k);
  const feeType = useWatch({ control, name: n("feeType") }) as FeeRule["feeType"];
  const all = useWatch({ control }) as Record<string, unknown>;
  const v = (prefix ? all?.[prefix] : all) as { percent?: string; fixed?: string; tiers?: { from: string; fee: string }[]; minJob?: string; minFee?: string } | undefined;
  const { fields, append, remove } = useFieldArray({ control, name: n("tiers") });

  const rule: FeeRule = {
    feeType: feeType ?? "PERCENTAGE",
    feePercentBps: Math.round(Number((v?.percent ?? "").replace(",", ".")) * 100) || null,
    feeFixedCents: parseEuroToCents(v?.fixed ?? "") ?? null,
    tiers: (v?.tiers ?? []).map((tier) => ({ fromCents: parseEuroToCents(tier.from) ?? 0, feeCents: parseEuroToCents(tier.fee) ?? 0 })),
    minJobAmountCents: parseEuroToCents(v?.minJob ?? "") ?? 50_000,
    minFeeCents: parseEuroToCents(v?.minFee ?? "") ?? 5_000,
  };
  const sample = Math.max(rule.minJobAmountCents, 500_000);
  let preview: { fee: number; finder: number } | null = null;
  try {
    const r = calculateFee({ rule, dealAmountCents: sample, finderShareBps: DEFAULT_RANKS[0]!.shareBps });
    preview = { fee: r.totalCents, finder: r.finderCents };
  } catch {
    preview = null;
  }

  const options: { value: FeeRule["feeType"]; label: string }[] = [
    { value: "PERCENTAGE", label: t("feePercentage") },
    { value: "FIXED", label: t("feeFixed") },
    { value: "TIERED", label: t("feeTiered") },
  ];

  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">{t("feeType")}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {options.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm transition-colors duration-150",
                feeType === o.value ? "border-fg bg-surface-2" : "border-border hover:border-subtle",
              )}
            >
              <input type="radio" value={o.value} className="accent-[var(--olive)]" {...register(n("feeType"))} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      {feeType === "PERCENTAGE" ? (
        <Field label={t("percent")} htmlFor="fee-pct" error={err("percent")}>
          <div className="relative max-w-40">
            <Input id="fee-pct" inputMode="decimal" className="money pr-8" aria-invalid={Boolean(err("percent"))} {...register(n("percent"))} />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-subtle">%</span>
          </div>
        </Field>
      ) : null}

      {feeType === "FIXED" ? (
        <Field label={t("fixedAmount")} htmlFor="fee-fixed" error={err("fixed")}>
          <EuroInput id="fee-fixed" invalid={Boolean(err("fixed"))} {...register(n("fixed"))} />
        </Field>
      ) : null}

      {feeType === "TIERED" ? (
        <div className="grid gap-3">
          {fields.map((f, i) => (
            <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
              <Field label={t("tierFrom")} htmlFor={`tier-from-${i}`}>
                <EuroInput id={`tier-from-${i}`} {...register(n(`tiers.${i}.from`))} />
              </Field>
              <Field label={t("tierFee")} htmlFor={`tier-fee-${i}`}>
                <EuroInput id={`tier-fee-${i}`} {...register(n(`tiers.${i}.fee`))} />
              </Field>
              <Button type="button" variant="ghost" size="icon" aria-label={t("removeTier")} onClick={() => remove(i)}>
                <Trash2 aria-hidden />
              </Button>
            </div>
          ))}
          {err("tiers") ? <p role="alert" className="text-sm text-danger">{err("tiers")}</p> : null}
          <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => append({ from: "", fee: "" })}>
            <Plus aria-hidden /> {t("addTier")}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("minJob")} htmlFor="min-job" hint={t("minJobHint")} error={err("minJob")}>
          <EuroInput id="min-job" invalid={Boolean(err("minJob"))} {...register(n("minJob"))} />
        </Field>
        <Field label={t("minFee")} htmlFor="min-fee" hint={t("minFeeHint")} error={err("minFee")}>
          <EuroInput id="min-fee" invalid={Boolean(err("minFee"))} {...register(n("minFee"))} />
        </Field>
      </div>

      {preview ? (
        <div className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm" aria-live="polite">
          <span className="eyebrow mr-2">{t("feePreview")}</span>
          {t("feePreviewText", { amount: formatCents(sample, locale), fee: formatCents(preview.fee, locale), finder: formatCents(preview.finder, locale) })}
        </div>
      ) : null}
    </div>
  );
}

export const EuroInput = ({ id, invalid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; ref?: React.Ref<HTMLInputElement> }) => (
  <div className="relative">
    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-subtle">€</span>
    <Input id={id} inputMode="decimal" className="money pl-8" aria-invalid={invalid} {...props} />
  </div>
);

export type { Errors };
