import { Plus } from "lucide-react";
import type { FaqItem } from "@/content/faq";

/** Native details/summary: works without JavaScript and is indexable. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-t border-border">
      {items.map((item) => (
        <details key={item.q} className="group border-b border-border">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left font-display text-lg font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
            {item.q}
            <Plus aria-hidden className="mt-1 size-4 shrink-0 text-subtle transition-transform duration-200 group-open:rotate-45" />
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
