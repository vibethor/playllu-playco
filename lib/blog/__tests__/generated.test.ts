import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BLOG_SOURCES } from "@/lib/blog/posts.generated";

/**
 * THE EMBEDDED POSTS ARE THE FILES. `content/blog/*.md` is where a post is written; `posts.generated.ts` is what
 * the site serves. If someone edits, adds or deletes a post and forgets `npm run blog:build`, the site would go
 * on serving the old words — this is the test that says so.
 */
const DIRECTORY = path.join(process.cwd(), "content", "blog");
const EXTENSION = ".md";

function postsOnDisk(): Record<string, string> {
  const files = readdirSync(DIRECTORY).filter((file) => file.endsWith(EXTENSION));
  return Object.fromEntries(
    files.map((file) => [file.slice(0, -EXTENSION.length), readFileSync(path.join(DIRECTORY, file), "utf8")]),
  );
}

describe("the embedded posts", () => {
  it("are exactly the Markdown files in content/blog — run `npm run blog:build` after editing a post", () => {
    // Act
    const onDisk = postsOnDisk();

    // Assert
    expect(BLOG_SOURCES).toEqual(onDisk);
  });
});
