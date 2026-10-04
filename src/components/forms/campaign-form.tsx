"use client";

import { useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { campaignSchema, type CampaignInput } from "@/lib/validation/campaign";
import { saveCampaign } from "@/lib/server/actions/business";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { CampaignTextFields, EuroInput, FeeRuleFields } from "./fee-rule-fields";
import { useRouter } from "@/i18n/navigation";

export function CampaignForm({ campaignId, defaults }: { campaignId: string | null; defaults: CampaignInput }) {
  const t = useTranslations("signupBusiness");
  const tb = useTranslations("businessApp");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const methods = useForm<CampaignInput, unknown, z.output<typeof campaignSchema>>({ resolver: zodResolver(campaignSchema), defaultValues: defaults, mode: "onTouched" });

  const onSubmit = methods.handleSubmit(() => {
    setError(null);
    start(async () => {
      const res = await saveCampaign(campaignId, methods.getValues());
      if (res.ok) {
        router.push("/app/bedrijf/campagnes?opgeslagen=1");
        router.refresh();
      } else setError(tc("error"));
    });
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
        <CampaignTextFields />
        <FeeRuleFields />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={`${t("budget")} (${tc("optional")})`} htmlFor="budget" hint={t("budgetHint")}>
            <EuroInput id="budget" {...methods.register("budget")} />
          </Field>
          <Field label={`${t("offerUrl")} (${tc("optional")})`} htmlFor="offer" hint={t("offerUrlHint")}>
            <Input id="offer" type="url" placeholder="https://" {...methods.register("offerUrl")} />
          </Field>
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" variant="primary" size="lg" disabled={pending} className="self-start">
          {pending ? tc("saving") : tc("save")}
        </Button>
        <span className="sr-only">{tb("campaignSaved")}</span>
      </form>
    </FormProvider>
  );
}
