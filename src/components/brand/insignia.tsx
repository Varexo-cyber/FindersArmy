import type { RankKey } from "@/lib/ranks";
import { cn } from "@/lib/utils";

/**
 * Rank insignia, drawn as flat geometric marks: bars, chevrons, a star.
 * Reads like a uniform patch at 24px and holds up at 160px.
 */
export function Insignia({ rank, className, title }: { rank: RankKey; className?: string; title?: string }) {
  const chevron = (y: number) => <path key={y} d={`M10 ${y + 8}L32 ${y}L54 ${y + 8}`} stroke="currentColor" strokeWidth="5" strokeLinecap="square" fill="none" />;
  let content: React.ReactNode;
  switch (rank) {
    case "RECRUIT":
      content = <rect x="12" y="29" width="40" height="6" fill="currentColor" />;
      break;
    case "SOLDIER":
      content = chevron(26);
      break;
    case "SERGEANT":
      content = [chevron(14), chevron(26), chevron(38)];
      break;
    case "LIEUTENANT":
      content = (
        <>
          <rect x="22" y="12" width="20" height="40" fill="none" stroke="currentColor" strokeWidth="5" />
          <rect x="28" y="20" width="8" height="24" fill="currentColor" />
        </>
      );
      break;
    case "COMMANDER":
      content = (
        <path
          d="M32 8l6.5 15.4 16.7 1.4-12.7 10.9 3.9 16.3L32 43.3 17.6 52l3.9-16.3L8.8 24.8l16.7-1.4z"
          fill="currentColor"
        />
      );
      break;
  }
  return (
    <svg viewBox="0 0 64 64" className={cn("size-10", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <rect x="1.5" y="1.5" width="61" height="61" rx="4" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      {content}
    </svg>
  );
}
