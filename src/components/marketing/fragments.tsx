import { Check, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";

/**
 * Real UI fragments for the "how it works" story. They are rendered with the same components as
 * the app, so what a visitor sees here is what the product actually looks like.
 */
export function Frame({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div className={cn("rounded-md border border-border bg-surface shadow-[0_1px_0_var(--border)]", className)} aria-hidden>
      {label ? (
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
          <span className="ml-2 font-mono text-[10px] tracking-wider text-subtle">{label}</span>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function CampaignCardFragment({ business, category, region, earnLabel, cents, boost }: { business: string; category: string; region: string; earnLabel: string; cents: number; boost?: string }) {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{category}</span>
        {boost ? <Badge tone="signal">{boost}</Badge> : null}
      </div>
      <div>
        <p className="text-sm text-subtle">{earnLabel}</p>
        <Money cents={cents} short size="xl" highlight />
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">{business}</p>
          <p className="text-sm text-subtle">{region}</p>
        </div>
      </div>
    </div>
  );
}

export function ShareFragment({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="ml-auto max-w-[85%] rounded-md rounded-br-none bg-[#d9fdd3] px-3 py-2 text-[13px] leading-snug text-ink dark:bg-[#1f3a1e] dark:text-paper">
        {message}
        <span className="mt-1 flex items-center justify-end gap-1 font-mono text-[10px] text-ink/50 dark:text-paper/50">
          14:02 <Check className="size-3" />
        </span>
      </div>
      <div className="flex gap-2">
        <span className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-signal text-xs font-semibold text-ink">
          <MessageCircle className="size-3.5" /> WhatsApp
        </span>
        <span className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-border text-xs">Link</span>
        <span className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-border text-xs">QR</span>
      </div>
    </div>
  );
}

export function LeadFragment({ name, text, status }: { name: string; text: string; status: string }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-subtle">{text}</p>
        </div>
        <Badge tone="olive">{status}</Badge>
      </div>
      <ol className="flex gap-1">
        {[1, 1, 1, 0, 0, 0].map((done, i) => (
          <li key={i} className={cn("h-1 flex-1 rounded-full", done ? "bg-olive dark:bg-accent" : "bg-border")} />
        ))}
      </ol>
    </div>
  );
}

export function FeeFragment({ label, cents, status }: { label: string; cents: number; status: string }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <Badge tone="signal">{status}</Badge>
      </div>
      <Money cents={cents} size="xl" highlight />
    </div>
  );
}
