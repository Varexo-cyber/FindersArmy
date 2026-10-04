import { getTranslations } from "next-intl/server";
import { calculatorRules } from "@/lib/calculator";
import { calculateFee } from "@/lib/fees";
import { formatEuroShort } from "@/lib/money";
import { DEFAULT_RANKS } from "@/lib/ranks";
import { CATEGORIES } from "@/content/categories";

/**
 * Live "what is your tip worth" calculator. Server-rendered with the first category's numbers
 * (complete without JavaScript); public/fx.js makes the select and slider live.
 */
export async function EarningsCalculator({ locale }: { locale: string }) {
  const t = await getTranslations("home");
  const rules = calculatorRules(locale);
  const share = DEFAULT_RANKS[0]!.shareBps;
  const first = rules[0]!;
  const firstCat = CATEGORIES.find((c) => (locale === "en" ? c.nameEn : c.nameNl) === first.name)!;
  const initial = calculateFee({ rule: firstCat.example, dealAmountCents: first.job * 100, finderShareBps: share });

  return (
    <div
      data-calc
      data-rules={JSON.stringify(rules)}
      data-share={share}
      data-spot
      className="flex flex-col gap-5 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-paper shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)] backdrop-blur-md md:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl font-semibold tracking-tight">{t("calcHeading")}</p>
        <span aria-hidden className="fx-pulse-dot size-2 rounded-full bg-signal" />
      </div>
      <label className="flex flex-col gap-1.5 text-sm text-[#c9cbc4]" htmlFor="calc-cat">
        {t("calcCategory")}
        <select
          id="calc-cat"
          data-calc-category
          className="h-11 w-full appearance-none rounded-md border border-white/15 bg-ink/60 px-3 text-[15px] text-paper"
        >
          {rules.map((r, i) => (
            <option key={r.name} value={i}>{r.name}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-sm text-[#c9cbc4]">
          <label htmlFor="calc-amount">{t("calcAmount")}</label>
          <span data-calc-job className="money text-base text-paper">{formatEuroShort(first.job * 100, locale)}</span>
        </div>
        <input
          id="calc-amount"
          data-calc-amount
          type="range"
          min={first.min}
          max={first.max}
          step={first.step}
          defaultValue={first.job}
          className="fx-range"
          aria-describedby="calc-disclaimer"
        />
      </div>
      <dl className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-[#9a9d94]">{t("calcBizFee")}</dt>
          <dd data-calc-fee className="money text-lg text-paper">{formatEuroShort(initial.totalCents, locale)}</dd>
        </div>
        <div className="flex flex-col gap-1" aria-live="polite">
          <dt className="text-xs text-[#9a9d94]">{t("calcYouGet")}</dt>
          <dd data-calc-you className="money origin-left text-4xl font-semibold text-signal md:text-5xl">
            {formatEuroShort(initial.finderCents, locale)}
          </dd>
        </div>
      </dl>
      <p id="calc-disclaimer" className="text-xs leading-relaxed text-[#9a9d94]">{t("calcDisclaimer")}</p>
    </div>
  );
}
