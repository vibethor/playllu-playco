import type { BlogPost } from "@/lib/blog/post";
import { canonicalFor } from "@/lib/seo/site";

/**
 * A POST, AS SCHEMA.ORG READS IT (blog section, 24 Nov 2026): `BlogPosting`, with the same headline, dates and
 * author the page shows. A named author is a `Person`; a post with none is signed by the brand, an
 * `Organization`. Never a person invented to look like expertise.
 */
export function postPath(slug: string): string {
  return `/blog/${slug}`;
}

/** The post's share image: its own photograph when it has one, otherwise the card drawn from its title. */
export function postImageUrl(site: string, post: Pick<BlogPost, "slug" | "image">): string {
  return post.image ? `${site}${post.image}` : `${site}${postPath(post.slug)}/opengraph-image`;
}

export function blogPostingSchema(input: { post: BlogPost; site: string; publisherName: string; publisherLogo: string }) {
  const { post, site, publisherName, publisherLogo } = input;
  const url = canonicalFor(site, postPath(post.slug));
  const publisher = {
    "@type": "Organization",
    name: publisherName,
    url: `${site}/`,
    logo: { "@type": "ImageObject", url: publisherLogo },
  };
  const author = post.author
    ? {
        "@type": "Person",
        name: post.author.name,
        ...(post.author.role ? { jobTitle: post.author.role } : {}),
        ...(post.author.url ? { url: post.author.url } : {}),
      }
    : { "@type": "Organization", name: publisherName, url: `${site}/` };

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: [postImageUrl(site, post)],
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    inLanguage: post.locale,
    ...(post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
    author,
    publisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}
