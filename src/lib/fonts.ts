import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

// Latin subsets only: the site is Dutch/English, and every kilobyte of font delays the hero.
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  // "optional": headings never re-render (and never shift) when the font arrives late on a slow
  // first visit; from cache, and on normal connections, Bricolage is there from the first paint.
  display: "optional",
  weight: ["600", "700"],
});

export const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });

// Mono is used for amounts and labels, rarely above the fold on first paint: not preloaded.
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", preload: false });

export const fontVariables = `${bricolage.variable} ${geistSans.variable} ${geistMono.variable}`;
