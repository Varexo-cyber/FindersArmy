import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  info: { cls: "border-border bg-surface", Icon: Info },
  success: { cls: "border-olive/40 bg-olive/5", Icon: CheckCircle2 },
  warning: { cls: "border-danger/40 bg-danger/5", Icon: AlertTriangle },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof tones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { cls, Icon } = tones[tone];
  return (
    <div role={tone === "warning" ? "alert" : "status"} className={cn("flex gap-3 rounded-md border px-4 py-3 text-sm", cls, className)}>
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", tone === "warning" ? "text-danger" : "text-subtle")} />
      <div className="flex flex-col gap-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-subtle">{children}</div> : null}
      </div>
    </div>
  );
}
