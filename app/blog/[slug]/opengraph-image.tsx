import { findReadablePost } from "@/lib/blog/posts";
import { renderPostImage } from "@/lib/og/postImage";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og/theme";
import { strings } from "@/lib/strings";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = strings.blog.feedTitle;

/**
 * `/blog/<slug>/opengraph-image` — the card a shared post draws when it has no photograph of its own. ENGLISH,
 * like the game card: a link preview is fetched by a server, which no locale cookie reaches.
 */
export default async function PostOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findReadablePost(slug);
  return renderPostImage({ title: post?.title ?? strings.blog.feedTitle, label: strings.blog.title });
}
