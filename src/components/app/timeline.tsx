import { getFormatter, getTranslations } from "next-intl/server";
import type { LeadStatus } from "@/lib/lead-status";
import { cn } from "@/lib/utils";

export async function LeadTimeline({ events, showNotes = true }: { events: { id: string; toStatus: LeadStatus; fromStatus: LeadStatus | null; note: string | null; createdAt: Date; actorType: string }[]; showNotes?: boolean }) {
  const tl = await getTranslations("statusLong");
  const format = await getFormatter();
  return (
    <ol className="relative flex flex-col gap-5 border-l border-border pl-5">
      {events.map((e, i) => (
        <li key={e.id} className="relative">
          <span className={cn("absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-bg", i === events.length - 1 ? "bg-signal ring-1 ring-ink/30" : "bg-olive dark:bg-accent")} aria-hidden />
          <p className="text-sm font-medium">{e.fromStatus === e.toStatus ? (e.note ?? tl(e.toStatus)) : tl(e.toStatus)}</p>
          <p className="font-mono text-xs text-subtle">
            <time dateTime={e.createdAt.toISOString()}>{format.dateTime(e.createdAt, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time>
            {" · "}{e.actorType}
          </p>
          {showNotes && e.note && e.fromStatus !== e.toStatus ? <p className="mt-1 text-sm text-subtle">{e.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}
