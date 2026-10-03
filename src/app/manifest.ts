import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FindersArmy",
    short_name: "FindersArmy",
    description: "Je kent iemand. Verdien eraan.",
    start_url: "/app/finder",
    scope: "/",
    display: "standalone",
    background_color: "#F5F3EE",
    theme_color: "#0E0F0C",
    lang: "nl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ontdekken", url: "/app/finder" },
      { name: "Mijn klanten", url: "/app/finder/klanten" },
      { name: "Saldo", url: "/app/finder/saldo" },
    ],
  };
}
