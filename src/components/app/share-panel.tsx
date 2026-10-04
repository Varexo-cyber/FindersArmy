"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, MessageCircle, QrCode, Share2 } from "lucide-react";
import QRCode from "qrcode";
import { ensureReferralLink } from "@/lib/server/actions/finder";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function SharePanel({ campaignId, initialCode, origin, business, category, clicks }: { campaignId: string; initialCode: string | null; origin: string; business: string; category: string; clicks: number }) {
  const t = useTranslations("finderApp");
  const tc = useTranslations("common");
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const url = code ? `${origin}/r/${code}` : "";
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);
  useEffect(() => {
    if (url) setMessage(t("shareMessageDefault", { category: category.toLowerCase(), business, url }));
  }, [url, t, category, business]);

  function create() {
    setError(null);
    start(async () => {
      const res = await ensureReferralLink(campaignId);
      if (res.ok && res.code) setCode(res.code);
      else setError(res.ok ? tc("error") : res.error === "SUSPENDED" ? t("suspended") : tc("error"));
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function toggleQr() {
    if (qr) return setQr(null);
    setQr(await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0E0F0C", light: "#FFFFFF" } }));
  }

  if (!code) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="primary" size="xl" onClick={create} disabled={pending} className="w-full">
          <Share2 aria-hidden /> {t("shareCta")}
        </Button>
        {error ? <Alert tone="warning">{error}</Alert> : null}
      </div>
    );
  }

  return (
    <section aria-labelledby="share-title" className="flex flex-col gap-4">
      <div>
        <h2 id="share-title" className="text-xl">{t("shareTitle")}</h2>
        <p className="text-sm text-subtle">{t("shareSub")}</p>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5">
        <span className="flex-1 truncate font-mono text-sm" data-testid="referral-url">{url}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 text-xs font-medium" aria-live="polite">
          {copied ? <><Check aria-hidden className="size-4" /> {tc("copied")}</> : <><Copy aria-hidden className="size-4" /> {tc("copy")}</>}
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="share-msg">{t("shareMessageLabel")}</Label>
        <Textarea id="share-msg" value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-24 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-signal font-semibold text-ink">
          <MessageCircle aria-hidden className="size-5" /> {t("shareWhatsapp")}
        </a>
        <Button variant="outline" onClick={copy}><Copy aria-hidden /> {t("shareCopy")}</Button>
        <Button variant="outline" onClick={toggleQr} aria-expanded={Boolean(qr)}><QrCode aria-hidden /> {t("shareQr")}</Button>
        {canShare ? (
          <Button variant="outline" className="col-span-2" onClick={() => navigator.share({ text: message }).catch(() => undefined)}>
            <Share2 aria-hidden /> {t("shareSystem")}
          </Button>
        ) : null}
      </div>
      {qr ? <div className="mx-auto w-56 rounded-md border border-border bg-white p-3" aria-label={t("shareQr")} role="img" dangerouslySetInnerHTML={{ __html: qr }} /> : null}
      <p className="font-mono text-xs text-subtle">{t("shareClicks", { count: clicks })}</p>
    </section>
  );
}
