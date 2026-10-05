import { cn } from "@/lib/utils";

/** The mark: a chevron (rank) inside a square (a dossier stamp). Geometric, one colour. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)} fill="none">
      <rect x="1" y="1" width="30" height="30" rx="3" fill="currentColor" />
      <path d="M8 13.5L16 8.5L24 13.5" stroke="var(--bg)" strokeWidth="2.6" strokeLinecap="square" />
      <path d="M8 20L16 15L24 20" stroke="var(--bg)" strokeWidth="2.6" strokeLinecap="square" />
      <rect x="8" y="23" width="16" height="2.4" fill="var(--signal)" />
    </svg>
  );
}

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* Dark mode: the mark sits in a signal-yellow disc, like the help button. */}
      <span className="inline-flex transition-colors duration-300 dark:size-10 dark:items-center dark:justify-center dark:rounded-full dark:bg-signal">
        <LogoMark className="dark:size-6 dark:text-ink dark:[--bg:#d4ff3f]" />
      </span>
      {withWordmark ? (
        <span className="font-display text-[19px] font-bold tracking-[-0.04em]">FindersArmy</span>
      ) : null}
    </span>
  );
}
