"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { requestMyPayout } from "@/lib/server/actions/finder";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { EuroInput } from "@/components/forms/fee-rule-fields";
import { formatCents } from "@/lib/money";
import { useRouter } from "@/i18n/navigation";

export function PayoutForm({ availableCents, minimumCents }: { availableCents: number; minimumCents: number }) {
  const t = useTranslations("finderApp");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [amount, setAmount] = useState((availableCents / 100).toFixed(2).replace(".", ","));
  const [state, setState] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  // Navigate after the transition has settled: a navigation inside it would keep the button
  // pending while the route's loading boundary streams.
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (done) router.replace("/app/finder/saldo?aangevraagd=1");
  }, [done, router]);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setState(null);
        start(async () => {
          const res = await requestMyPayout(amount);
          if (res.ok) setDone(true);
          else setState({ ok: false, msg: res.error ? t(`payoutErrors.${res.error}` as "payoutErrors.INVALID", { min: formatCents(minimumCents, locale) }) : tc("error") });
        });
      }}
    >
      <Field label={t("payoutAmount")} htmlFor="po-amount" hint={t("payoutMinimum", { min: formatCents(minimumCents, locale) })}>
        <EuroInput id="po-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Button type="submit" variant="primary" size="lg" disabled={pending}>{t("payoutSubmit")}</Button>
      {state ? <Alert tone={state.ok ? "success" : "warning"}>{state.msg}</Alert> : null}
    </form>
  );
}
