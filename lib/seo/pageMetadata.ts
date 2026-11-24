import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/city/default";
import { OG_SIZE } from "@/lib/og/theme";
import { canonicalFor } from "@/lib/seo/site";

/**
 * THE SEARCH AND SHARE TAGS OF A PUBLIC PAGE (technical SEO pass, Jachym, 20 Nov 2026).
 *
 * Before this only the home page named a canonical address and set `og:url`; every other page inherited neither,
 * so `/games?utm_source=…` and `/games?day=…` were separate pages to a search engine and a shared link had no
 * address of its own. One function, so a new public page gets all of it by calling it.
 *
 * THE SHARE IMAGE IS NAMED HERE, and has to be. A page that sets its own `openGraph` replaces its parent's whole
 * object, the file-based `app/opengraph-image.tsx` included: measured on the first build of this change, `/games`
 * lost its `og:image` the moment it gained an `og:url`. So every page points at the brand card itself.
 */
const SHARE_IMAGE = { path: "/opengraph-image", ...OG_SIZE } as const;

export function publicPageMetadata(input: {
  site: string;
  path: string;
  title: string;
  description?: string;
}): Metadata {
  const { site, path, title, description } = input;
  const url = canonicalFor(site, path);
  const image = { url: `${site}${SHARE_IMAGE.path}`, width: SHARE_IMAGE.width, height: SHARE_IMAGE.height, alt: title };
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: url },
    openGraph: { title, ...(description ? { description } : {}), url, type: "website", siteName: SITE_NAME, images: [image] },
    twitter: { card: "summary_large_image", title, ...(description ? { description } : {}), images: [image] },
  };
}

/** A page a search engine should not list: sign-in steps, checkout, a player's own screens. */
export const NOINDEX = { index: false, follow: false } as const;

/**
 * A FORM WITH NOTHING TO READ, STILL WORTH CRAWLING THROUGH (SEO audit, 24 Nov 2026): log-in and sign-up. Listed,
 * they compete with the home page for the brand's own name and give a searcher a form instead of an answer; the
 * links on them (terms, privacy, home) are still followed.
 */
export const NOINDEX_FOLLOW = { index: false, follow: true } as const;
