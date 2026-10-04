"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { BadgeEuro, Bell, Briefcase, FileText, Inbox, LayoutGrid, Medal, Megaphone, Search, User, Users, Shield, Settings, AlertTriangle, Wallet, ScrollText } from "lucide-react";

const ICONS = { BadgeEuro, Bell, Briefcase, FileText, Inbox, LayoutGrid, Medal, Megaphone, Search, User, Users, Shield, Settings, AlertTriangle, Wallet, ScrollText };
export type IconName = keyof typeof ICONS;
export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  badge?: number;
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
              active ? "bg-fg text-bg" : "text-subtle hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon aria-hidden className="size-4" strokeWidth={1.75} />
            <span className="flex-1">{item.label}</span>
            {item.badge ? <span className="rounded-sm bg-signal px-1.5 font-mono text-[11px] text-ink">{item.badge}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Thumb-reachable tab bar on phones: the main destinations, always one tap away. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-[2px] md:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px]", active ? "text-fg" : "text-subtle")}
              >
                {active ? <span className="absolute top-0 h-0.5 w-8 bg-fg" aria-hidden /> : null}
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2 : 1.5} />
                {item.label}
                {item.badge ? <span className="absolute top-2 right-[calc(50%-18px)] size-2 rounded-full bg-danger" aria-hidden /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
