import { cn } from "@/lib/utils";

export function Section({ id, className, children, tone = "default" }: { id?: string; className?: string; children: React.ReactNode; tone?: "default" | "ink" | "surface" }) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 md:py-24",
        tone === "ink" && "bg-ink text-paper [--fg:var(--paper)] [--subtle:#9a9d94] [--border:#2b2e27] [--surface:#161814] [--surface-2:#1e211b]",
        tone === "surface" && "border-y border-border bg-surface",
        className,
      )}
    >
      <div className="container-x">{children}</div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, sub, className }: { eyebrow?: string; title: string; sub?: string; className?: string }) {
  return (
    <div className={cn("mb-10 flex max-w-2xl flex-col gap-3 md:mb-14", className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="text-3xl md:text-5xl">{title}</h2>
      {sub ? <p className="text-base text-subtle md:text-lg">{sub}</p> : null}
    </div>
  );
}

/**
 * Page opener: dark stage with light that flows after the pointer (public/fx.js), so every
 * page starts with the same energy as the homepage. Optional `aside` sits on the right.
 */
export function PageHero({ eyebrow, title, sub, children, aside }: { eyebrow: string; title: string; sub?: string; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section data-flow className="fx-flow bg-ink text-paper [--fg:var(--paper)] [--subtle:#a9aca2] [--border:#2b2e27] [--surface:#161814] [--surface-2:#1e211b]">
      <div className="fx-grid" aria-hidden />
      <div className={cn("container-x relative grid gap-10 py-16 md:py-24", aside && "md:grid-cols-[1.3fr_1fr] md:items-center")}>
        <div className="flex flex-col gap-5">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] tracking-[0.08em] text-[#c9cbc4] uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-signal" />
            {eyebrow}
          </p>
          <h1 className="max-w-4xl text-[2.6rem] leading-[0.98] md:text-7xl">{title}</h1>
          {sub ? <p className="max-w-2xl text-lg text-[#c9cbc4] md:text-xl">{sub}</p> : null}
          {children}
        </div>
        {aside}
      </div>
    </section>
  );
}
