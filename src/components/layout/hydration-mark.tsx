"use client";

import { useEffect } from "react";

/**
 * Signals public/fx.js and public/motion.js that React has hydrated, so they never touch the DOM
 * before React has claimed it (that would trigger hydration mismatches).
 */
export function HydrationMark() {
  useEffect(() => {
    (window as unknown as { __faHydrated?: boolean }).__faHydrated = true;
    window.dispatchEvent(new Event("fa:hydrated"));
  }, []);
  return null;
}
