"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, MessageCircle, RotateCcw, X } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STORE_KEY = "fa-assistant";

/** Minimal, safe markdown: **bold**, [links](/path or https://), bullet lines, paragraphs. */
function Rich({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const bullet = /^\s*[-*•]\s+/.test(line);
        const content = line.replace(/^\s*[-*•]\s+/, "");
        const parts: React.ReactNode[] = [];
        const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content))) {
          if (m.index > last) parts.push(content.slice(last, m.index));
          if (m[1]) parts.push(<strong key={m.index}>{m[1]}</strong>);
          else if (m[2] && m[3] && (m[3].startsWith("/") || m[3].startsWith("https://"))) {
            parts.push(
              <a key={m.index} href={m[3]} target={m[3].startsWith("https://") ? "_blank" : undefined} rel="noreferrer" className="underline decoration-signal decoration-2 underline-offset-2">
                {m[2]}
              </a>,
            );
          } else parts.push(m[0]);
          last = m.index + m[0].length;
        }
        if (last < content.length) parts.push(content.slice(last));
        if (!line.trim()) return <span key={i} className="block h-2" />;
        return bullet ? (
          <span key={i} className="flex gap-2"><span aria-hidden>•</span><span>{parts}</span></span>
        ) : (
          <span key={i} className="block">{parts.map((p, j) => <Fragment key={j}>{p}</Fragment>)}</span>
        );
      })}
    </>
  );
}

/**
 * Help assistant, bottom-right on every page. Answers come from /api/assistant: Claude with the
 * site's own knowledge when an API key is configured, otherwise a search over that same knowledge.
 */
export function AssistantWidget() {
  const t = useTranslations("assistant");
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inApp = pathname.startsWith("/app") || pathname.startsWith("/admin");

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORE_KEY);
      if (saved) setMsgs(JSON.parse(saved) as Msg[]);
    } catch {
      /* storage unavailable: start fresh */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-20)));
    } catch {
      /* ignore */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, page: pathname, messages: history.slice(-12) }),
      });
      setOffline(res.headers.get("x-assistant-mode") === "offline");
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMsgs([...history, { role: "assistant", content: text }]);
      }
      if (!text) throw new Error("empty");
    } catch {
      setMsgs([...history, { role: "assistant", content: t("error") }]);
    } finally {
      setBusy(false);
    }
  }

  const suggestions = t.raw("suggestions") as string[];
  // Forms with a bottom action bar (sign-up, login, the customer form) keep the screen to themselves.
  if (/^\/(aanmelden|login|r\/|bevestig)/.test(pathname)) return null;

  return (
    <div className={cn("fixed right-4 z-50 flex flex-col items-end gap-3", inApp ? "bottom-20 md:bottom-6" : "bottom-4 md:bottom-6")}>
      {open ? (
        <section
          role="dialog"
          aria-label={t("title")}
          className="flex h-[min(620px,calc(100dvh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-[0_30px_80px_-20px_rgb(0_0_0/0.45)]"
        >
          <header className="relative flex items-start gap-3 border-b border-border px-4 py-4">
            <div className="relative flex-1">
              <p className="font-display text-base font-semibold tracking-tight">{t("title")}</p>
              <p className="text-xs text-subtle">{t("subtitle")}</p>
            </div>
            {msgs.length ? (
              <button type="button" onClick={() => setMsgs([])} aria-label={t("reset")} title={t("reset")} className="relative rounded-md p-1.5 text-subtle hover:text-fg">
                <RotateCcw aria-hidden className="size-4" />
              </button>
            ) : null}
            <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="relative rounded-md p-1.5 text-subtle hover:text-fg">
              <X aria-hidden className="size-4" />
            </button>
          </header>

          <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <div className="max-w-[88%] rounded-lg rounded-tl-sm bg-surface-2 px-3.5 py-2.5 text-sm">{t("greeting")}</div>
            {msgs.length === 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} data-spot className="rounded-full border border-border px-3 py-1.5 text-left text-xs transition-colors duration-150 hover:border-fg">
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[88%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "self-end rounded-tr-sm bg-fg text-bg" : "rounded-tl-sm bg-surface-2",
                )}
              >
                {m.content ? <Rich text={m.content} /> : <span className="text-subtle">{t("thinking")}</span>}
              </div>
            ))}
            {offline && msgs.length ? <p className="text-[11px] text-subtle">{t("offlineNote")}</p> : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
            className="flex flex-col gap-2 border-t border-border p-3"
          >
            <div className="flex items-end gap-2">
              <label htmlFor="assistant-input" className="sr-only">{t("placeholder")}</label>
              <textarea
                id="assistant-input"
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void ask(input);
                  }
                }}
                placeholder={t("placeholder")}
                className="max-h-32 min-h-11 flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label={t("send")} className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-fg text-bg disabled:opacity-40">
                <ArrowUp aria-hidden className="size-5" />
              </button>
            </div>
            <p className="text-[11px] text-subtle">{t("privacy")}</p>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
       
        className="flex h-12 items-center gap-2 rounded-full bg-fg px-4 text-bg shadow-lg transition-transform duration-150 hover:-translate-y-0.5"
      >
        {open ? <X aria-hidden className="size-5" /> : <MessageCircle aria-hidden className="size-5" />}
        <span className="hidden text-sm font-medium sm:inline">{open ? t("close") : t("title")}</span>
      </button>
    </div>
  );
}
