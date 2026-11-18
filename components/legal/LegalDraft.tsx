import type { LegalDraft as Draft, LegalSection } from "@/lib/content/legalDraft";

/**
 * `/terms` and `/privacy`: Playco's own English documents (`lib/content/termsDraft.ts`, `lib/content/privacyDraft.ts`).
 * Each section's heading carries its anchor, so `/terms#<anchor>` lands on it (signup links to the rules annex).
 */
export function LegalDraft({ draft }: { draft: Draft }) {
  return (
    <article data-testid="legal-document" className="mt-4 text-body text-bone">
      <p data-testid="legal-meta" className="m-0 text-small text-faint">
        {draft.meta}
      </p>
      {draft.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </article>
  );
}

function Section({ section }: { section: LegalSection }) {
  return (
    <section className="mt-8">
      <h2 id={section.id} className="m-0 scroll-mt-24 font-display text-section-title font-bold">
        {section.heading}
      </h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-muted">
          {paragraph}
        </p>
      ))}
      {section.items && section.items.length > 0 ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
