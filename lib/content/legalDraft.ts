/**
 * The shape of Playco's own legal texts (terms and privacy, 18 Nov 2026): a header line and numbered sections, each a
 * few paragraphs and an optional list. Plain data, so the words are testable without rendering and one component
 * (`components/legal/LegalDraft.tsx`) draws both documents.
 */

export interface LegalSection {
  /** The anchor (`/terms#<id>`). Unique within a document. */
  id: string;
  heading: string;
  paragraphs: readonly string[];
  /** Bullet points shown after the paragraphs. */
  items?: readonly string[];
}

export interface LegalDraft {
  /** "Effective from …, version …" — the version is the one stamped onto every acceptance. */
  meta: string;
  sections: readonly LegalSection[];
}

/** Every word of a document in reading order, for tests and checks. */
export function legalDraftText(draft: LegalDraft): string {
  const parts = [draft.meta];
  for (const section of draft.sections) {
    parts.push(
      section.heading,
      ...section.paragraphs,
      ...(section.items ?? []),
    );
  }
  return parts.join("\n");
}
