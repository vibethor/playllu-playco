import type { BlogPost } from "@/lib/blog/post";

/**
 * WHICH POSTS A READER MAY SEE (blog section, 24 Nov 2026).
 *
 * TWO WAYS TO BE A DRAFT. `draft: true` in the front matter, or a `[TODO` anywhere in the post — a fact only
 * Jachym has, still to be filled in. The second rule holds even when the flag is missing or was removed too early:
 * a post that says "[TODO Jachym: the address]" to the public is worse than a post that is a day late.
 *
 * DRAFTS ARE READ ON PREVIEW DEPLOYMENTS AND ON A DEVELOPER'S MACHINE, NEVER IN PRODUCTION. Closed unless the
 * deployment is known to be a preview: `VERCEL_ENV` is set by Vercel on every deployment (nothing to configure),
 * and a production build that does not say where it runs hides drafts.
 */
export const TODO_MARKER = "[TODO";

export function isDraft(post: BlogPost): boolean {
  if (post.draft) return true;
  return [post.title, post.description, post.body].some((text) => text.includes(TODO_MARKER));
}

export interface DeploymentEnv {
  /** Vercel's own name for the deployment: "production", "preview" or "development". */
  vercelEnv: string | undefined;
  nodeEnv: string | undefined;
}

const VERCEL_ENVS_WITH_DRAFTS: readonly string[] = ["preview", "development"];

export function draftsVisible(
  env: DeploymentEnv = { vercelEnv: process.env.VERCEL_ENV, nodeEnv: process.env.NODE_ENV },
): boolean {
  if (env.vercelEnv) return VERCEL_ENVS_WITH_DRAFTS.includes(env.vercelEnv);
  return env.nodeEnv !== "production";
}

/** What the index and a post's own address show. */
export function visiblePosts(posts: readonly BlogPost[], showDrafts: boolean): BlogPost[] {
  return posts.filter((post) => showDrafts || !isDraft(post));
}

/** What the sitemap and the feed list: finished posts only, on every deployment. A draft is never announced. */
export function publishedPosts(posts: readonly BlogPost[]): BlogPost[] {
  return visiblePosts(posts, false);
}
