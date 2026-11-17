import type { CookieCategory, CookiePolicyDraft as Draft, PolicySection } from "@/lib/content/cookiePolicyDraft";

/**
 * `/cookies` while the reviewed policy is not written: the English draft from `lib/content/cookiePolicyDraft.ts`.
 * The text is the same in every language until the lawyer's version arrives; the page says it is a draft.
 */
export function CookiePolicyDraft({ draft }: { draft: Draft }) {
  return (
    <article data-testid="cookie-policy-draft" className="mt-6 text-body text-bone">
      <p role="note" className="rounded-card border border-hairline-strong bg-surface p-4">
        {draft.status}
      </p>
      {draft.intro.map((section) => (
        <Section key={section.id} section={section} />
      ))}
      <section className="mt-8">
        <h2 className="m-0 font-display text-section-title font-bold">The cookies we use</h2>
        {draft.categories.map((category) => (
          <CategoryTable key={category.id} category={category} />
        ))}
      </section>
      {draft.outro.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </article>
  );
}

function Section({ section }: { section: PolicySection }) {
  return (
    <section className="mt-8">
      <h2 className="m-0 font-display text-section-title font-bold">{section.heading}</h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-muted">
          {paragraph}
        </p>
      ))}
    </section>
  );
}

function CategoryTable({ category }: { category: CookieCategory }) {
  return (
    <div className="mt-6">
      <h3 className="m-0 text-body font-bold">{category.title}</h3>
      <p className="mt-1 text-small text-muted">{category.basis}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-small">
          <thead>
            <tr className="border-b border-hairline-strong text-faint">
              <th scope="col" className="py-2 pr-4 font-normal">Cookie</th>
              <th scope="col" className="py-2 pr-4 font-normal">Set by</th>
              <th scope="col" className="py-2 pr-4 font-normal">What it does</th>
              <th scope="col" className="py-2 font-normal">Kept for</th>
            </tr>
          </thead>
          <tbody>
            {category.cookies.map((cookie) => (
              <tr key={cookie.name} className="border-b border-hairline align-top">
                <td className="py-2 pr-4 font-mono">{cookie.name}</td>
                <td className="py-2 pr-4">{cookie.provider}</td>
                <td className="py-2 pr-4 text-muted">{cookie.purpose}</td>
                <td className="py-2">{cookie.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
