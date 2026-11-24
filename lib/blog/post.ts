import matter from "gray-matter";

/**
 * A BLOG POST, AS A FILE (blog section, 24 Nov 2026).
 *
 * One Markdown file in `content/blog/`, named for its address: `content/blog/<slug>.md` is `/blog/<slug>`. The
 * front matter is the post's facts; the body is Markdown. This module turns the text of one file into a checked
 * `BlogPost` and refuses a file that could not be published as it stands — a missing title, a date that is not a
 * day — naming the file, so the mistake is found by the test that reads every post rather than by a reader.
 *
 * PURE: text in, a post out. Reading the folder is `lib/blog/posts.ts`.
 */

export interface BlogAuthor {
  name: string;
  role?: string;
  url?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** A calendar day, `YYYY-MM-DD`. A post is published on a day, not at a moment. */
  datePublished: string;
  dateModified: string;
  /** Null signs the post with the brand. */
  author: BlogAuthor | null;
  /** A path under `public/`, or null: the share card is then drawn from the title. */
  image: string | null;
  tags: readonly string[];
  /** The language the post is written in (BCP 47), which is not always the reader's. */
  locale: string;
  /** The front matter's own flag. Whether the post is treated as a draft is `isDraft` in `visibility.ts`. */
  draft: boolean;
  /** The Markdown after the front matter. */
  body: string;
}

export class BlogPostError extends Error {
  constructor(fileSlug: string, problem: string) {
    super(`content/blog/${fileSlug}.md: ${problem}`);
    this.name = "BlogPostError";
  }
}

const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DAY_LENGTH = "YYYY-MM-DD".length;
const DEFAULT_POST_LOCALE = "en";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredText(data: Record<string, unknown>, key: string, fileSlug: string): string {
  const value = data[key];
  if (typeof value !== "string" || value.trim() === "") throw new BlogPostError(fileSlug, `"${key}" is missing`);
  return value.trim();
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

/** YAML reads an unquoted `2026-11-24` as a date at midnight UTC; a quoted one stays text. Both are one day. */
function calendarDay(data: Record<string, unknown>, key: string, fileSlug: string): string {
  const value = data[key];
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, ISO_DAY_LENGTH);
  if (typeof value === "string" && CALENDAR_DAY.test(value.trim())) return value.trim();
  throw new BlogPostError(fileSlug, `"${key}" must be a day written YYYY-MM-DD`);
}

function authorOf(value: unknown, fileSlug: string): BlogAuthor | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) throw new BlogPostError(fileSlug, '"author" must have a name');
  const name = requiredText(value, "name", fileSlug);
  const role = optionalText(value.role);
  const url = optionalText(value.url);
  return { name, ...(role ? { role } : {}), ...(url ? { url } : {}) };
}

function tagsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((tag): tag is string => typeof tag === "string" && tag.trim() !== "");
}

export function parsePost(source: string, fileSlug: string): BlogPost {
  const { data, content } = matter(source);
  if (!isRecord(data)) throw new BlogPostError(fileSlug, "the front matter is missing");

  const slug = requiredText(data, "slug", fileSlug);
  if (slug !== fileSlug) throw new BlogPostError(fileSlug, `the slug "${slug}" is not the file's name`);

  return {
    slug,
    title: requiredText(data, "title", fileSlug),
    description: requiredText(data, "description", fileSlug),
    datePublished: calendarDay(data, "datePublished", fileSlug),
    dateModified: calendarDay(data, "dateModified", fileSlug),
    author: authorOf(data.author, fileSlug),
    image: optionalText(data.image) ?? null,
    tags: tagsOf(data.tags),
    locale: optionalText(data.locale) ?? DEFAULT_POST_LOCALE,
    draft: data.draft === true,
    body: content,
  };
}
