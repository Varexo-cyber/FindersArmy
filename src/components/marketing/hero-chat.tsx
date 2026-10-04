import Image from "next/image";
import { CheckCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PHOTOS } from "@/content/photos";
import { formatCents } from "@/lib/money";

/**
 * How it starts and how it ends: a WhatsApp question, your link as the answer, and the payout
 * notification. An illustration of the flow, with the amount taken from the worked examples.
 */
export async function HeroChat({ locale, cents }: { locale: "nl" | "en"; cents: number }) {
  const t = await getTranslations("home");
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] shadow-[0_40px_100px_-40px_rgb(0_0_0/0.55)]">
        <Image src={PHOTOS.vriendenStraat.src} alt={PHOTOS.vriendenStraat.alt[locale]} fill priority sizes="(min-width: 768px) 520px, 92vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* WhatsApp conversation */}
      <div className="absolute -left-3 top-6 w-[84%] max-w-[330px] overflow-hidden rounded-2xl bg-[#efeae2] shadow-2xl ring-1 ring-black/5 md:-left-14 md:top-10">
        <div className="flex items-center gap-2.5 bg-[#008069] px-3.5 py-2.5 text-white">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#dfe5e7] text-sm font-semibold text-[#54656f]">M</span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-medium">Mila</span>
            <span className="text-[11px] text-white/80">online</span>
          </span>
        </div>
        <div className="flex flex-col gap-1.5 p-3 text-[13px] text-[#111b21]">
          <p className="max-w-[85%] self-start rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 shadow-sm">
            {t("h3ChatQ")} <span className="ml-1 text-[10px] text-[#667781]">19:02</span>
          </p>
          <div className="max-w-[88%] self-end rounded-lg rounded-tr-none bg-[#d9fdd3] p-1 shadow-sm">
            <div className="flex gap-2 rounded-md bg-[#cfe9c9] p-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-bold text-signal">FA</span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[12px] font-semibold">{t("h3LinkTitle")}</span>
                <span className="block truncate text-[11px] text-[#54656f]">{t("h3ChatLink")}</span>
              </span>
            </div>
            <p className="px-1.5 pt-1">
              {t("h3ChatA")}
              <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-[#667781]">19:03 <CheckCheck aria-hidden className="size-3.5 text-[#53bdeb]" /></span>
            </p>
          </div>
        </div>
      </div>

      {/* Payout notification */}
      <div className="absolute -right-2 bottom-8 w-[78%] max-w-[300px] rounded-2xl bg-white/90 p-3.5 text-ink shadow-2xl ring-1 ring-black/5 backdrop-blur-xl md:-right-10 md:bottom-12">
        <div className="flex items-center gap-2 text-[11px] text-[#6b6e66]">
          <span className="flex size-5 items-center justify-center rounded-[6px] bg-ink text-[9px] font-bold text-signal">FA</span>
          <span className="font-medium tracking-wide uppercase">FindersArmy</span>
          <span className="ml-auto">{t("h3Now")}</span>
        </div>
        <p className="mt-2 text-sm font-semibold">{t("h3Notif")}</p>
        <p className="text-sm text-[#3d4039]">
          <span className="money font-semibold text-ink">+ {formatCents(cents, locale)}</span> {t("h3NotifSub")}
        </p>
      </div>
    </div>
  );
}
