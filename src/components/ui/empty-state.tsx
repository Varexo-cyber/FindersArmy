import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-3 rounded-md border border-dashed border-border px-5 py-10 md:items-center md:text-center", className)}>
      {Icon ? (
        <span className="flex size-10 items-center justify-center rounded-md border border-border text-subtle">
          <Icon aria-hidden className="size-5" strokeWidth={1.5} />
        </span>
      ) : null}
      <p className="font-display text-xl font-semibold tracking-tight">{title}</p>
      {body ? <div className="max-w-md text-sm text-subtle">{body}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
