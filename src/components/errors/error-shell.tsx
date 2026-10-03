import { Logo } from "@/components/brand/logo";

/** Standalone error layout: works even when the page's own layout failed. */
export function ErrorShell({ code, title, body, children }: { code: string; title: string; body: string; children?: React.ReactNode }) {
  return (
    <main id="main" className="container-x flex min-h-dvh flex-col justify-center gap-6 py-16">
      <a href="/" aria-label="FindersArmy"><Logo /></a>
      <p className="font-mono text-sm tracking-[0.2em] text-subtle">ERROR {code}</p>
      <h1 className="max-w-3xl text-5xl md:text-7xl">{title}</h1>
      <p className="max-w-xl text-lg text-subtle">{body}</p>
      <div className="flex gap-3">{children}</div>
    </main>
  );
}
