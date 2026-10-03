import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-border text-subtle",
  olive: "border-olive/40 text-olive dark:text-accent dark:border-accent/40",
  signal: "border-ink/15 bg-signal text-ink",
  danger: "border-danger/40 text-danger",
  solid: "border-fg bg-fg text-bg",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-sm border px-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
