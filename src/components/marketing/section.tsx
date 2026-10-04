import Image from "next/image";
import type { Photo } from "@/content/photos";
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
 * Page opener: a real photo behind dark type, so every page shows people and work rather than
 * decoration. Optional `aside` sits on the right.
 */
export function PageHero({ eyebrow, title, sub, children, aside, photo, locale = "nl" }: { eyebrow: string; title: string; sub?: string; children?: React.ReactNode; aside?: React.ReactNode; photo?: Photo; locale?: string }) {
  return (
    <section className="relative overflow-hidden bg-ink text-paper [--fg:var(--paper)] [--subtle:#c9cbc4] [--border:#3a3d35] [--surface:#161814] [--surface-2:#1e211b]">
      {photo ? (
        <>
          <Image src={photo.src} alt={photo.alt[locale === "en" ? "en" : "nl"]} fill priority sizes="100vw" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        </>
      ) : null}
      <div className={cn("container-x relative grid gap-10 py-16 md:py-28", aside && "md:grid-cols-[1.3fr_1fr] md:items-center")}>
        <div className="flex flex-col gap-5">
          <p className="text-sm font-medium text-signal">{eyebrow}</p>
          <h1 className="max-w-4xl text-[2.6rem] leading-[0.98] md:text-7xl">{title}</h1>
          {sub ? <p className="max-w-2xl text-lg text-[#d6d8d0] md:text-xl">{sub}</p> : null}
          {children}
        </div>
        {aside}
      </div>
    </section>
  );
}
