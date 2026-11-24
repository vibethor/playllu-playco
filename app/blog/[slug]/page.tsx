import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownBody } from "@/components/blog/MarkdownBody";
import { formatPostDay } from "@/lib/blog/dates";
import { postMetadata } from "@/lib/blog/metadata";
import { findReadablePost } from "@/lib/blog/posts";
import { blogPostingSchema, postPath } from "@/lib/blog/schema";
import { isDraft } from "@/lib/blog/visibility";
import { SITE_NAME } from "@/lib/city/default";
import { getLocale, getStrings } from "@/lib/i18n/server";
import { fillTemplate } from "@/lib/i18n/template";
import { breadcrumbList, jsonLdScript } from "@/lib/seo/site";
import { siteUrl } from "@/lib/site";

const PUBLISHER_LOGO_PATH = "/icons/icon-512.png";
const NOTICE = "m-0 rounded-card border border-hairline-strong bg-surface p-4 text-body text-bone";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = findReadablePost(slug);
  if (!post) notFound();
  return postMetadata({ post, site: await siteUrl(), siteName: SITE_NAME });
}

/**
 * `/blog/<slug>` — one post (24 Nov 2026).
 *
 * ONE H1, the title. Under it who wrote it and when it was last changed, both visible, because a guide to prices
 * and venues is only as good as its date. The body is the post's Markdown, drawn by `MarkdownBody`. Every post
 * ends with the same block pointing at this week's games, so a post never has to end with its own.
 *
 * THE ARTICLE IS IN THE LANGUAGE IT WAS WRITTEN IN (`lang` on the article); the words around it are the reader's.
 *
 * A POST THIS DEPLOYMENT DOES NOT SHOW never gets here: the proxy answers it with a real 404
 * (`lib/blog/routing.ts`). `notFound()` stays as the page's own guard.
 */
export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = findReadablePost(slug);
  if (!post) notFound();

  const [t, locale, site] = await Promise.all([getStrings(), getLocale(), siteUrl()]);
  const schema = blogPostingSchema({
    post,
    site,
    publisherName: SITE_NAME,
    publisherLogo: `${site}${PUBLISHER_LOGO_PATH}`,
  });
  // The trail a search result shows: Playco › Blog › this post.
  const breadcrumbs = breadcrumbList(site, [
    { name: SITE_NAME, path: "/" },
    { name: t.blog.title, path: "/blog" },
    { name: post.title, path: postPath(post.slug) },
  ]);

  return (
    <main className="relative z-10 mx-auto w-full max-w-content px-gutter pb-16 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }} />

      <nav aria-label={t.blog.title}>
        <Link
          href="/blog"
          className="inline-flex min-h-11 items-center gap-2 text-small text-faint no-underline hover:text-accent-dim"
        >
          <span aria-hidden>←</span>
          {t.blog.backToBlog}
        </Link>
      </nav>

      {isDraft(post) ? (
        <p role="note" data-testid="blog-draft-notice" className={`${NOTICE} mb-5 mt-2`}>
          {t.blog.draftNotice}
        </p>
      ) : null}

      <article lang={post.locale} data-testid="blog-post">
        <h1 className="m-0 mt-2 font-display text-page-title font-bold text-bone">{post.title}</h1>
        <p lang={locale} data-testid="blog-post-meta" className="m-0 mt-4 flex flex-wrap gap-x-3 gap-y-1 text-small text-faint">
          <span>
            {fillTemplate(t.blog.byline, { author: post.author?.name ?? SITE_NAME })}
            {post.author?.role ? `, ${post.author.role}` : null}
          </span>
          <time dateTime={post.datePublished}>
            {fillTemplate(t.blog.published, { date: formatPostDay(post.datePublished, locale) })}
          </time>
          <time dateTime={post.dateModified}>
            {fillTemplate(t.blog.updated, { date: formatPostDay(post.dateModified, locale) })}
          </time>
        </p>
        {locale !== post.locale ? (
          <p role="note" lang={locale} data-testid="blog-language-notice" className={`${NOTICE} mt-5`}>
            {t.blog.englishOnlyNotice}
          </p>
        ) : null}

        <MarkdownBody markdown={post.body} />
      </article>

      <aside data-testid="blog-closing" className="lifted mt-12 rounded-card p-[22px]">
        <h2 className="m-0 font-display text-[22px] font-bold tracking-tight text-bone">{t.blog.closingTitle}</h2>
        <p className="m-0 mt-2 text-body text-muted">{t.blog.closingBody}</p>
        <Link
          href="/games"
          className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-pill bg-volt px-6 text-body-lg font-bold text-ink no-underline transition-colors hover:bg-volt-dim"
        >
          {t.blog.closingCta}
          <span aria-hidden>→</span>
        </Link>
      </aside>
    </main>
  );
}
