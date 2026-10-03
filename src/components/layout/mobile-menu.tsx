"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";

export function MobileMenu({
  items,
  cta,
  labels,
}: {
  items: { href: string; label: string }[];
  cta: { href: string; label: string };
  labels: { open: string; close: string };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-md border border-border"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>
      {open ? (
        <nav id="mobile-nav" className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col border-t border-border bg-bg px-4 pt-4 pb-8">
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex h-14 items-center border-b border-border font-display text-2xl font-semibold tracking-tight">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href={cta.href} className="mt-auto flex h-14 items-center justify-center rounded-md bg-signal text-base font-semibold text-ink">
            {cta.label}
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
