"use client";

import { useId, useState } from "react";
import { useLocale } from "next-intl";
import { baseFee } from "@/lib/fees";
import { formatCents, parseEuroToCents } from "@/lib/money";
import { Input } from "@/components/ui/input";
import { Money } from "@/components/ui/money";

/** Uses the real fee engine, so the number shown is exactly what an invoice would say. */
export function BusinessCalculator({ labels }: { labels: { avg: string; pct: string; min: string; result: string; note: string; share: string } }) {
  const locale = useLocale();
  const id = useId();
  const [avg, setAvg] = useState("3.500");
  const [pct, setPct] = useState("8");
  const [min, setMin] = useState("50");
  const avgCents = parseEuroToCents(avg) ?? 0;
  const pctBps = Math.round((Number(pct.replace(",", ".")) || 0) * 100);
  const minCents = parseEuroToCents(min) ?? 0;
  const valid = avgCents > 0 && pctBps > 0 && pctBps <= 5000;
  const fee = valid ? baseFee({ feeType: "PERCENTAGE", feePercentBps: pctBps, minJobAmountCents: 0, minFeeCents: minCents }, avgCents) : 0;
  const share = valid && avgCents ? ((fee / avgCents) * 100).toLocaleString(locale, { maximumFractionDigits: 1 }) : "0";

  return (
    <div className="grid gap-6 rounded-md border border-border bg-bg p-5 md:grid-cols-2 md:p-8">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor={`${id}-avg`}>
          {labels.avg}
          <Input id={`${id}-avg`} inputMode="decimal" value={avg} onChange={(e) => setAvg(e.target.value)} className="money" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor={`${id}-pct`}>
            {labels.pct}
            <Input id={`${id}-pct`} inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} className="money" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor={`${id}-min`}>
            {labels.min}
            <Input id={`${id}-min`} inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} className="money" />
          </label>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-2 border-t border-border pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8" aria-live="polite">
        <span className="eyebrow">{labels.result}</span>
        <Money cents={fee} size="hero" highlight locale={locale} />
        <span className="text-sm text-subtle">
          {labels.note} <span className="font-mono">{share}%</span> {labels.share}.
        </span>
        <span className="sr-only">{formatCents(fee, locale)}</span>
      </div>
    </div>
  );
}
