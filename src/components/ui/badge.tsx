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
        "inline-flex h-6 w-fit items-center gap-1 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
