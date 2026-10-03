import { cn } from "@/lib/utils";
import { Money } from "./money";

export function Stat({
  label,
  cents,
  value,
  highlight,
  hint,
  className,
}: {
  label: string;
  cents?: number;
  value?: React.ReactNode;
  highlight?: boolean;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 border-border p-5", className)}>
      <span className="eyebrow">{label}</span>
      {cents !== undefined ? (
        <Money cents={cents} size="lg" highlight={highlight} />
      ) : (
        <span className="money text-2xl font-medium">{value}</span>
      )}
      {hint ? <span className="text-xs text-subtle">{hint}</span> : null}
    </div>
  );
}
