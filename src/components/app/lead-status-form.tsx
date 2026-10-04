"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { updateLeadStatus } from "@/lib/server/actions/business";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { EuroInput } from "@/components/forms/fee-rule-fields";
import { Alert } from "@/components/ui/alert";
import { calculateFee, type FeeRule } from "@/lib/fees";
import { formatCents, parseEuroToCents } from "@/lib/money";
import { LOST_REASONS } from "@/lib/lead-status";
import { cn } from "@/lib/utils";

type Next = "CONTACTED" | "QUOTE_SENT" | "WON" | "COMPLETED" | "LOST";

export function LeadStatusForm({ leadId, options, rule, boostCents }: { leadId: string; options: Next[]; rule: FeeRule; boostCents: number }) {
  const t = useTranslations("businessApp");
  const ta = useTranslations("businessActions");
  const tl = useTranslations("lostReasons");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const [to, setTo] = useState<Next>(options[0]!);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const cents = parseEuroToCents(amount);
  let feeText: string | null = null;
  if (to === "WON" && cents) {
    try {
      feeText = formatCents(calculateFee({ rule, dealAmountCents: cents, boostCents, finderShareBps: 0 }).totalCents, locale);
    } catch {
      feeText = null;
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (to === "WON" && !cents) return setError(tv("amount"));
    if (to === "LOST" && !reason) return setError(tv("required"));
    start(async () => {
      const res = await updateLeadStatus({ leadId, to, dealAmount: amount, lostReason: reason, note });
      if (!res.ok) setError(res.error === "DEAL_AMOUNT_REQUIRED" ? tv("amount") : tc("error"));
      else {
        setAmount("");
        setNote("");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("leadUpdate")}</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <label key={o} className={cn("inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm", to === o ? "border-fg bg-fg text-bg" : "border-border hover:border-subtle")}>
              <input type="radio" name="to" value={o} checked={to === o} onChange={() => setTo(o)} className="sr-only" />
              {ta(o)}
            </label>
          ))}
        </div>
      </fieldset>
      {to === "WON" ? (
        <Field label={t("leadDealAmount")} htmlFor="deal" hint={feeText ? t("leadFeeEstimate", { fee: feeText }) : t("leadDealAmountHint")}>
          <EuroInput id="deal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
      ) : null}
      {to === "LOST" ? (
        <Field label={t("leadLostReason")} htmlFor="reason">
          <Select id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required>
            <option value="">—</option>
            {LOST_REASONS.map((r) => <option key={r} value={r}>{tl(r)}</option>)}
          </Select>
        </Field>
      ) : null}
      {to === "COMPLETED" ? <Alert>{t("leadCompleteHint")}</Alert> : null}
      <Field label={t("leadNote")} htmlFor="note">
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" maxLength={500} />
      </Field>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" variant={to === "WON" || to === "COMPLETED" ? "primary" : "solid"} disabled={pending} className="self-start">
        {pending ? tc("saving") : ta(to)}
      </Button>
    </form>
  );
}
