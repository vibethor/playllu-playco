import type { Metadata } from "next";
import Link from "next/link";
import { formatPostDay } from "@/lib/blog/dates";
import { loadPosts, readablePosts } from "@/lib/blog/posts";
import { postPath } from "@/lib/blog/schema";
import { isDraft, publishedPosts } from "@/lib/blog/visibility";
import { getLocale, getStrings } from "@/lib/i18n/server";
import { fillTemplate } from "@/lib/i18n/template";
import { NOINDEX_FOLLOW, publicPageMetadata } from "@/lib/seo/pageMetadata";
import { siteUrl } from "@/lib/site";

const FEED_PATH = "/blog/rss.xml";

export async function generateMetadata(): Promise<Metadata> {
  const [t, site] = await Promise.all([getStrings(), siteUrl()]);
  const metadata = publicPageMetadata({
    site,
    path: "/blog",
    title: t.blog.metaTitle,
    description: t.blog.metaDescription,
  });
  // An index of nothing (or of drafts only) is not a page to list: indexable from the first published post.
  if (publishedPosts(loadPosts()).length === 0) return { ...metadata, robots: NOINDEX_FOLLOW };
  return {
    ...metadata,
    alternates: { ...metadata.alternates, types: { "application/rss+xml": `${site}${FEED_PATH}` } },
  };
}

/**
 * `/blog` — the posts, newest first (24 Nov 2026).
 *
 * Game pages last a week; these are the pages that last. A draft is listed on preview deployments only, marked as
 * one, so a post can be read in place before it is published (`lib/blog/visibility.ts`).
 */
export default async function BlogIndexPage() {
  const [t, locale] = await Promise.all([getStrings(), getLocale()]);
  const posts = readablePosts();

  return (
    <main className="relative z-10 mx-auto w-full max-w-content px-gutter pb-16 pt-24">
      <h1 className="m-0 font-display text-page-title font-bold text-bone">{t.blog.title}</h1>
      <p className="m-0 mt-3 text-body-lg text-muted">{t.blog.indexIntro}</p>

      {posts.length === 0 ? (
        <p data-testid="blog-empty" className="m-0 mt-8 text-body text-faint">
          {t.blog.empty}
        </p>
      ) : (
        <ul data-testid="blog-index" className="m-0 mt-8 flex list-none flex-col gap-3 p-0">
          {posts.map((post) => (
            <li key={post.slug}>
              <article lang={post.locale} className="lifted rounded-card p-[22px]">
                <h2 className="m-0 font-display text-[22px] font-bold tracking-tight text-bone">
                  <Link href={postPath(post.slug)} className="text-bone no-underline hover:text-accent">
                    {post.title}
                  </Link>
                </h2>
                <p className="m-0 mt-2 text-body text-muted">{post.description}</p>
                <p lang={locale} className="m-0 mt-3 flex flex-wrap items-center gap-x-3 text-small text-faint">
                  <time dateTime={post.dateModified}>
                    {fillTemplate(t.blog.updated, { date: formatPostDay(post.dateModified, locale) })}
                  </time>
                  {isDraft(post) ? (
                    <span data-testid="blog-draft-badge" className="text-eyebrow font-semibold uppercase text-accent">
                      {t.blog.draftBadge}
                    </span>
                  ) : null}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
