import { cn } from "@/lib/utils";
import { formatCents, formatEuroShort } from "@/lib/money";

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
  xl: "text-4xl",
  hero: "text-5xl md:text-6xl",
} as const;

/**
 * Money is the hero of every page: always mono, always tabular.
 * `highlight` marks earnings with the signal colour. In light mode signal-on-paper text fails
 * contrast, so we render ink text on a signal marker; in dark mode the text itself is signal.
 */
export function Money({
  cents,
  size = "md",
  short = false,
  highlight = false,
  locale = "nl",
  className,
}: {
  cents: number;
  size?: keyof typeof sizes;
  short?: boolean;
  highlight?: boolean;
  locale?: string;
  className?: string;
}) {
  const text = short ? formatEuroShort(cents, locale) : formatCents(cents, locale);
  return (
    <span
      className={cn(
        "money font-medium whitespace-nowrap",
        sizes[size],
        highlight &&
          "bg-signal px-1 text-ink [box-decoration-break:clone] dark:bg-transparent dark:px-0 dark:text-signal",
        className,
      )}
    >
      {text}
    </span>
  );
}
