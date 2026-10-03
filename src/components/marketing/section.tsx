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

export function PageHero({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-border">
      <div className="container-x flex flex-col gap-5 py-14 md:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="max-w-4xl text-[2.6rem] leading-[0.98] md:text-7xl">{title}</h1>
        {sub ? <p className="max-w-2xl text-lg text-subtle md:text-xl">{sub}</p> : null}
        {children}
      </div>
    </section>
  );
}
