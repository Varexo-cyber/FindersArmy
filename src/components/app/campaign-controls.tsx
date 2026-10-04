"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { addBoost, endBoost, setCampaignLive } from "@/lib/server/actions/business";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { EuroInput } from "@/components/forms/fee-rule-fields";

export function CampaignToggle({ campaignId, live, canResume }: { campaignId: string; live: boolean; canResume: boolean }) {
  const t = useTranslations("businessApp");
  const [pending, start] = useTransition();
  if (!live && !canResume) return null;
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => start(async () => void (await setCampaignLive(campaignId, !live)))}>
      {live ? t("campaignPause") : t("campaignResume")}
    </Button>
  );
}

export function BoostForm({ campaignId }: { campaignId: string }) {
  const t = useTranslations("businessApp");
  const tc = useTranslations("common");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("100");
  const [days, setDays] = useState("7");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await addBoost(campaignId, { label: label || t("boostLabelPlaceholder"), amount, days });
          if (!res.ok) setError(tc("error"));
          else setLabel("");
        });
      }}
    >
      <Field label={t("boostLabel")} htmlFor={`bl-${campaignId}`}>
        <Input id={`bl-${campaignId}`} value={label} placeholder={t("boostLabelPlaceholder")} maxLength={60} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Field label={t("boostAmount")} htmlFor={`ba-${campaignId}`}>
        <EuroInput id={`ba-${campaignId}`} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label={t("boostDays")} htmlFor={`bd-${campaignId}`}>
        <Input id={`bd-${campaignId}`} type="number" min={1} max={60} className="money" value={days} onChange={(e) => setDays(e.target.value)} />
      </Field>
      <Button type="submit" variant="primary" disabled={pending}>{t("boostAdd")}</Button>
      {error ? <p role="alert" className="text-sm text-danger sm:col-span-4">{error}</p> : null}
    </form>
  );
}

export function EndBoostButton({ boostId }: { boostId: string }) {
  const tc = useTranslations("common");
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={() => start(async () => void (await endBoost(boostId)))}>
      {tc("cancel")}
    </Button>
  );
}
