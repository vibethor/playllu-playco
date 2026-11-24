import Image from "next/image";
import Link from "next/link";
import { marked, type Token, type Tokens } from "marked";

/**
 * A POST'S BODY, FROM MARKDOWN TO THE PAGE (blog section, 24 Nov 2026).
 *
 * `marked` reads the Markdown into tokens and THIS FILE DRAWS THEM AS ELEMENTS. No HTML string is ever injected:
 * a link inside the site is a `<Link>`, a table sits in a box that scrolls sideways on a phone instead of
 * widening the page, an image goes through `next/image` with its real size, and every style is one of the
 * product's own tokens. Raw HTML in a post is shown as text, not run.
 *
 * `breaks: true` — one newline is a line break. The posts write a question in bold and its answer on the next
 * line; that is two lines to the reader, as it is to the writer.
 */
const KEY_SAMPLE_LENGTH = 48;

/** A stable key per item: the start of its own text, numbered only when two are identical. */
function keyedBy<T>(items: readonly T[], label: (item: T) => string): { key: string; item: T }[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const base = label(item).slice(0, KEY_SAMPLE_LENGTH);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return { key: count === 0 ? base : `${base}#${count}`, item };
  });
}

function keyed<T extends Token>(tokens: readonly T[]): { key: string; token: T }[] {
  return keyedBy(tokens, (token) => `${token.type}:${token.raw}`).map(({ key, item }) => ({ key, token: item }));
}

/** `/blog/#what-does-it-cost` — a heading's anchor, from its own words. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/** `![alt](/blog/court.jpg "1200x800")` — the title carries the image's real size, which `next/image` needs. */
export function imageSize(title: string | null | undefined): { width: number; height: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(title?.trim() ?? "");
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

const LINK = "text-accent underline underline-offset-4 hover:text-accent-dim";

function PostLink({ token }: { token: Tokens.Link }) {
  const children = <Inline tokens={token.tokens} />;
  // A path inside the site keeps client navigation; anything else is a plain link to another site.
  if (token.href.startsWith("/")) {
    return (
      <Link href={token.href} className={LINK}>
        {children}
      </Link>
    );
  }
  return (
    <a href={token.href} rel="noopener" className={LINK}>
      {children}
    </a>
  );
}

function PostImage({ token }: { token: Tokens.Image }) {
  const size = imageSize(token.title);
  // An image whose size is not stated is left out rather than allowed to shift the page as it loads.
  if (!size) return null;
  return (
    <Image
      src={token.href}
      alt={token.text}
      width={size.width}
      height={size.height}
      sizes="(max-width: 760px) 100vw, 720px"
      className="mt-6 h-auto w-full rounded-card"
    />
  );
}

function InlineToken({ token }: { token: Token }) {
  if (token.type === "strong") {
    return (
      <strong className="font-semibold text-bone">
        <Inline tokens={(token as Tokens.Strong).tokens} />
      </strong>
    );
  }
  if (token.type === "em") {
    return (
      <em>
        <Inline tokens={(token as Tokens.Em).tokens} />
      </em>
    );
  }
  if (token.type === "del") {
    return (
      <del>
        <Inline tokens={(token as Tokens.Del).tokens} />
      </del>
    );
  }
  if (token.type === "codespan") {
    return <code className="rounded bg-surface px-1 text-small text-bone">{(token as Tokens.Codespan).text}</code>;
  }
  if (token.type === "br") return <br />;
  if (token.type === "link") return <PostLink token={token as Tokens.Link} />;
  if (token.type === "image") return <PostImage token={token as Tokens.Image} />;
  if (token.type === "text") {
    const text = token as Tokens.Text;
    return text.tokens ? <Inline tokens={text.tokens} /> : <>{text.text}</>;
  }
  if (token.type === "escape") return <>{(token as Tokens.Escape).text}</>;
  // Anything else — raw HTML included — is shown as the text it was written as.
  return <>{token.raw}</>;
}

function Inline({ tokens }: { tokens: readonly Token[] }) {
  return (
    <>
      {keyed(tokens).map(({ key, token }) => (
        <InlineToken key={key} token={token} />
      ))}
    </>
  );
}

function PostTable({ token }: { token: Tokens.Table }) {
  return (
    // The table keeps its width and this box scrolls: on a phone a five-column table is read by swiping, and the
    // page behind it never moves sideways. `tabIndex` makes the box reachable by keyboard, as a scrolling region is.
    <div
      role="region"
      aria-label={token.header.map((cell) => cell.text).join(", ")}
      tabIndex={0}
      className="mt-6 overflow-x-auto rounded-card border border-hairline-strong"
    >
      <table className="w-full min-w-[640px] border-collapse text-left text-small">
        <thead>
          <tr>
            {keyedBy(token.header, (cell) => cell.text).map(({ key, item: cell }) => (
              <th key={key} scope="col" className="bg-surface px-3 py-3 align-bottom font-semibold text-bone">
                <Inline tokens={cell.tokens} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keyedBy(token.rows, (row) => row.map((cell) => cell.text).join("|")).map(({ key, item: row }) => (
            <tr key={key}>
              {keyedBy(row, (cell) => cell.text).map(({ key: cellKey, item: cell }) => (
                <td key={cellKey} className="border-t border-hairline-strong px-3 py-3 align-top text-muted">
                  <Inline tokens={cell.tokens} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PostList({ token }: { token: Tokens.List }) {
  const items = keyed(token.items).map(({ key, token: item }) => (
    <li key={key} className="mt-2 pl-1">
      <Blocks tokens={item.tokens} nested />
    </li>
  ));
  const className = "mt-4 pl-6 text-body-lg text-muted";
  return token.ordered ? (
    <ol className={`${className} list-decimal`}>{items}</ol>
  ) : (
    <ul className={`${className} list-disc`}>{items}</ul>
  );
}

function Block({ token, nested }: { token: Token; nested: boolean }) {
  if (token.type === "heading") {
    const heading = token as Tokens.Heading;
    const id = headingId(heading.text);
    // The page's one H1 is the post's title, so a `#` in the body is drawn as a section heading like `##`.
    if (heading.depth <= 2) {
      return (
        <h2 id={id} className="m-0 mt-10 scroll-mt-24 font-display text-section-title font-bold text-bone">
          <Inline tokens={heading.tokens} />
        </h2>
      );
    }
    return (
      <h3 id={id} className="m-0 mt-8 scroll-mt-24 text-body-lg font-bold text-bone">
        <Inline tokens={heading.tokens} />
      </h3>
    );
  }
  if (token.type === "paragraph") {
    return (
      <p className="m-0 mt-4 text-body-lg text-muted">
        <Inline tokens={(token as Tokens.Paragraph).tokens} />
      </p>
    );
  }
  if (token.type === "text") {
    // The text of a tight list item: inline, with no paragraph of its own.
    const text = token as Tokens.Text;
    return nested ? <Inline tokens={text.tokens ?? [text]} /> : <p className="m-0 mt-4 text-body-lg text-muted">{text.text}</p>;
  }
  if (token.type === "list") return <PostList token={token as Tokens.List} />;
  if (token.type === "table") return <PostTable token={token as Tokens.Table} />;
  if (token.type === "blockquote") {
    return (
      <blockquote className="m-0 mt-6 border-l-2 border-accent pl-4 text-bone">
        <Blocks tokens={(token as Tokens.Blockquote).tokens} nested={false} />
      </blockquote>
    );
  }
  if (token.type === "code") {
    return (
      <pre className="mt-6 overflow-x-auto rounded-card bg-surface p-4 text-small text-bone">
        <code>{(token as Tokens.Code).text}</code>
      </pre>
    );
  }
  if (token.type === "hr") return <hr className="mt-10 border-0 border-t border-hairline-strong" />;
  if (token.type === "space") return null;
  // Raw HTML and anything unrecognised: shown as written, never run.
  return <p className="m-0 mt-4 text-body-lg text-muted">{token.raw}</p>;
}

function Blocks({ tokens, nested }: { tokens: readonly Token[]; nested: boolean }) {
  return (
    <>
      {keyed(tokens).map(({ key, token }) => (
        <Block key={key} token={token} nested={nested} />
      ))}
    </>
  );
}

export function MarkdownBody({ markdown }: { markdown: string }) {
  const tokens = marked.lexer(markdown, { gfm: true, breaks: true });
  return <Blocks tokens={tokens} nested={false} />;
}
