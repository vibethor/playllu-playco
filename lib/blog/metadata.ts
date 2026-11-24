import type { Metadata } from "next";
import type { BlogPost } from "@/lib/blog/post";
import { postImageUrl, postPath } from "@/lib/blog/schema";
import { isDraft } from "@/lib/blog/visibility";
import { OG_SIZE } from "@/lib/og/theme";
import { canonicalFor } from "@/lib/seo/site";
import { NOINDEX } from "@/lib/seo/pageMetadata";

/**
 * A POST'S SEARCH AND SHARE TAGS (blog section, 24 Nov 2026). Its own title and description, its own canonical
 * address, an article card with the two dates. A DRAFT IS NEVER INDEXABLE, on any deployment: a preview address
 * that leaked into a search result would show a half-written post under the brand's name.
 */
export function postMetadata(input: { post: BlogPost; site: string; siteName: string }): Metadata {
  const { post, site, siteName } = input;
  const url = canonicalFor(site, postPath(post.slug));
  const image = { url: postImageUrl(site, post), width: OG_SIZE.width, height: OG_SIZE.height, alt: post.title };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    ...(isDraft(post) ? { robots: NOINDEX } : {}),
    ...(post.author ? { authors: [{ name: post.author.name, ...(post.author.url ? { url: post.author.url } : {}) }] } : {}),
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      siteName,
      locale: post.locale,
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
      ...(post.tags.length > 0 ? { tags: [...post.tags] } : {}),
      images: [image],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.description, images: [image] },
  };
}
