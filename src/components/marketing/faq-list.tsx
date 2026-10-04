import { Plus } from "lucide-react";
import type { FaqItem } from "@/content/faq";

/** Native details/summary: works without JavaScript and is indexable. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-t border-border">
      {items.map((item) => (
        <details key={item.q} className="group border-b border-border">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left font-display text-lg font-semibold tracking-tight transition-colors duration-150 hover:text-olive dark:hover:text-accent [&::-webkit-details-marker]:hidden">
            {item.q}
            <span aria-hidden className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border transition-colors duration-200 group-open:border-signal group-open:bg-signal group-open:text-ink"><Plus className="size-3.5 transition-transform duration-200 group-open:rotate-45" /></span>
          </summary>
          <p className="max-w-3xl pb-6 text-subtle leading-relaxed">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
