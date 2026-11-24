import { describe, expect, it } from "vitest";
import type { BlogPost } from "@/lib/blog/post";
import { draftsVisible, isDraft, publishedPosts, visiblePosts } from "@/lib/blog/visibility";

function post(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    slug: "a-post",
    title: "A post",
    description: "About something.",
    datePublished: "2026-11-24",
    dateModified: "2026-11-24",
    author: null,
    image: null,
    tags: [],
    locale: "en",
    draft: false,
    body: "A finished paragraph.",
    ...overrides,
  };
}

describe("whether a post is a draft", () => {
  it("is when its front matter says so", () => {
    // Act
    const draft = isDraft(post({ draft: true }));

    // Assert
    expect(draft).toBe(true);
  });

  it("is when it still has a [TODO in it, even with the flag missing", () => {
    // Act
    const draft = isDraft(post({ draft: false, body: "We play at Swish. [TODO Jachym: the address.]" }));

    // Assert
    expect(draft).toBe(true);
  });

  it("is when the [TODO is in the title or the description", () => {
    // Act
    const drafts = [isDraft(post({ title: "[TODO] title" })), isDraft(post({ description: "[TODO: describe]" }))];

    // Assert
    expect(drafts).toEqual([true, true]);
  });

  it("is not when it is finished and unflagged", () => {
    // Act
    const draft = isDraft(post());

    // Assert
    expect(draft).toBe(false);
  });
});

describe("where drafts can be read", () => {
  it("on a preview deployment", () => {
    // Act
    const visible = draftsVisible({ vercelEnv: "preview", nodeEnv: "production" });

    // Assert
    expect(visible).toBe(true);
  });

  it("on a developer's machine", () => {
    // Act
    const visible = draftsVisible({ vercelEnv: undefined, nodeEnv: "development" });

    // Assert
    expect(visible).toBe(true);
  });

  it("never in production", () => {
    // Act
    const visible = draftsVisible({ vercelEnv: "production", nodeEnv: "production" });

    // Assert
    expect(visible).toBe(false);
  });

  it("not on a production build that does not say where it runs — closed unless known to be a preview", () => {
    // Act
    const visible = draftsVisible({ vercelEnv: undefined, nodeEnv: "production" });

    // Assert
    expect(visible).toBe(false);
  });
});

describe("which posts a reader is shown", () => {
  const finished = post({ slug: "finished" });
  const flagged = post({ slug: "flagged", draft: true });
  const unfinished = post({ slug: "unfinished", body: "[TODO] write this" });

  it("only the finished ones where drafts are hidden", () => {
    // Act
    const shown = visiblePosts([finished, flagged, unfinished], false);

    // Assert
    expect(shown.map((entry) => entry.slug)).toEqual(["finished"]);
  });

  it("all of them where drafts are visible", () => {
    // Act
    const shown = visiblePosts([finished, flagged, unfinished], true);

    // Assert
    expect(shown.map((entry) => entry.slug)).toEqual(["finished", "flagged", "unfinished"]);
  });

  it("the sitemap and the feed list only the finished ones, wherever they run", () => {
    // Act
    const listed = publishedPosts([finished, flagged, unfinished]);

    // Assert
    expect(listed.map((entry) => entry.slug)).toEqual(["finished"]);
  });
});
