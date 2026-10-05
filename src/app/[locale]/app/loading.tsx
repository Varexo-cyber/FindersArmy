import { LogoMark } from "@/components/brand/logo";

/** Shown while a slower page streams in: the mark breathing, a bar running underneath. */
export default function Loading() {
  return (
    <div className="fa-loading flex flex-1 items-center justify-center py-32" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-5">
        <span className="fa-breathe flex size-16 items-center justify-center rounded-full bg-signal">
          <LogoMark className="size-8 text-ink [--bg:#d4ff3f]" />
        </span>
        <span className="relative h-1 w-40 overflow-hidden rounded-full bg-border">
          <span className="fa-run absolute inset-y-0 left-0 w-1/3 rounded-full bg-signal" />
        </span>
        <span className="sr-only">Laden…</span>
      </div>
    </div>
  );
}
