"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, RotateCcw, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
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
          className="fa-pop flex h-[min(640px,calc(100dvh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-border bg-bg shadow-[0_30px_90px_-20px_rgb(0_0_0/0.45)]"
        >
          <header className="relative bg-ink px-5 pt-5 pb-6 text-paper">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative flex size-11 items-center justify-center rounded-2xl bg-signal text-ink">
                  <LogoMark className="size-6" />
                  <span aria-hidden className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-[#25d366] ring-2 ring-ink" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight">FindersArmy</p>
                  <p className="text-xs text-[#a9aca2]">{t("subtitle")}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {msgs.length ? (
                  <button type="button" onClick={() => setMsgs([])} aria-label={t("reset")} title={t("reset")} className="rounded-full p-2 text-[#a9aca2] hover:bg-white/10 hover:text-paper">
                    <RotateCcw aria-hidden className="size-4" />
                  </button>
                ) : null}
                <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="rounded-full p-2 text-[#a9aca2] hover:bg-white/10 hover:text-paper">
                  <X aria-hidden className="size-4" />
                </button>
              </div>
            </div>
          </header>

          <div ref={listRef} className="-mt-3 flex flex-1 flex-col gap-3 overflow-y-auto rounded-t-[24px] bg-bg px-4 pt-5 pb-4" aria-live="polite">
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3 text-sm leading-relaxed">{t("greeting")}</div>
            {msgs.length === 0 ? (
              <div className="mt-1 flex flex-col gap-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => ask(s)} className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-bg px-4 py-3 text-left text-sm transition-colors duration-150 hover:border-fg hover:bg-surface">
                    {s}
                    <ArrowUp aria-hidden className="size-4 rotate-45 text-subtle transition-transform group-hover:rotate-90 group-hover:text-fg" />
                  </button>
                ))}
              </div>
            ) : null}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user" ? "self-end rounded-tr-md bg-ink text-paper" : "rounded-tl-md bg-surface-2",
                )}
              >
                {m.content ? (
                  <Rich text={m.content} />
                ) : (
                  <span className="inline-flex gap-1 py-1" aria-label={t("thinking")}>
                    <span className="fa-dot size-1.5 rounded-full bg-subtle" />
                    <span className="fa-dot size-1.5 rounded-full bg-subtle [animation-delay:150ms]" />
                    <span className="fa-dot size-1.5 rounded-full bg-subtle [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            ))}
            {offline && msgs.length ? <p className="text-[11px] text-subtle">{t("offlineNote")}</p> : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
            className="flex flex-col gap-2 px-4 pt-2 pb-4"
          >
            <div className="flex items-end gap-2 rounded-[22px] border border-border bg-surface p-1.5 pl-4 focus-within:border-fg">
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
                className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label={t("send")} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-opacity disabled:opacity-30">
                <ArrowUp aria-hidden className="size-4" />
              </button>
            </div>
            <p className="px-2 text-center text-[11px] text-subtle">{t("privacy")}</p>
          </form>
        </section>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
        className="group flex h-14 items-center gap-3 rounded-full bg-ink py-2 pr-5 pl-2 text-paper shadow-[0_16px_40px_-12px_rgb(0_0_0/0.55)] ring-1 ring-white/10 transition-transform duration-200 hover:-translate-y-0.5"
      >
        <span className="relative flex size-10 items-center justify-center rounded-full bg-signal text-ink">
          {open ? <X aria-hidden className="size-5" /> : <LogoMark className="size-5" />}
          {!open ? <span aria-hidden className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-[#25d366] ring-2 ring-ink" /> : null}
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-sm font-semibold">{open ? t("close") : t("title")}</span>
          {!open ? <span className="text-[11px] text-[#a9aca2]">{t("online")}</span> : null}
        </span>
      </button>
    </div>
  );
}
