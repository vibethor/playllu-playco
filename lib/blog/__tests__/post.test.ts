import { describe, expect, it } from "vitest";
import { BlogPostError, parsePost } from "@/lib/blog/post";

const FRONT_MATTER = `---
title: "Where to play"
description: "Every option compared."
slug: "where-to-play"
datePublished: 2026-11-24
dateModified: 2026-11-25
tags: ["volleyball", "guide"]
locale: "en"
draft: true
---
`;

function source(overrides: Record<string, string> = {}, body = "First paragraph.\n"): string {
  let text = FRONT_MATTER;
  for (const [key, line] of Object.entries(overrides)) {
    text = text.replace(new RegExp(`^${key}:.*\\n`, "m"), line);
  }
  return `${text}\n${body}`;
}

describe("reading a post file", () => {
  it("takes the title, description, tags and language from the front matter", () => {
    // Act
    const post = parsePost(source(), "where-to-play");

    // Assert
    expect(post).toMatchObject({
      slug: "where-to-play",
      title: "Where to play",
      description: "Every option compared.",
      tags: ["volleyball", "guide"],
      locale: "en",
    });
  });

  it("keeps the two dates as calendar days, not moments", () => {
    // Act
    const post = parsePost(source(), "where-to-play");

    // Assert
    expect(post.datePublished).toBe("2026-11-24");
    expect(post.dateModified).toBe("2026-11-25");
  });

  it("keeps the body as written, without the front matter", () => {
    // Act
    const post = parsePost(source({}, "First paragraph.\n\n## A heading\n"), "where-to-play");

    // Assert
    expect(post.body.trim()).toBe("First paragraph.\n\n## A heading");
  });

  it("has no author when the front matter names none, so the post is signed by the brand", () => {
    // Act
    const post = parsePost(source(), "where-to-play");

    // Assert
    expect(post.author).toBeNull();
  });

  it("reads a named author with a role and an address", () => {
    // Arrange
    const withAuthor = source({
      draft: 'draft: true\nauthor:\n  name: "Sofi"\n  role: "Beach volleyball organiser"\n  url: "https://example.com/sofi"\n',
    });

    // Act
    const post = parsePost(withAuthor, "where-to-play");

    // Assert
    expect(post.author).toEqual({ name: "Sofi", role: "Beach volleyball organiser", url: "https://example.com/sofi" });
  });

  it("is not a draft when the flag is absent", () => {
    // Act
    const post = parsePost(source({ draft: "" }), "where-to-play");

    // Assert
    expect(post.draft).toBe(false);
  });
});

describe("a post file that cannot be published as it is", () => {
  it("is refused when its slug is not its file name, because the address comes from the file", () => {
    // Act
    const read = () => parsePost(source(), "another-name");

    // Assert
    expect(read).toThrow(BlogPostError);
  });

  it.each(["title", "description", "datePublished", "dateModified"])("is refused without a %s", (key) => {
    // Act
    const read = () => parsePost(source({ [key]: "" }), "where-to-play");

    // Assert
    expect(read).toThrow(BlogPostError);
  });

  it("is refused when a date is not a calendar day", () => {
    // Act
    const read = () => parsePost(source({ datePublished: 'datePublished: "next week"\n' }), "where-to-play");

    // Assert
    expect(read).toThrow(BlogPostError);
  });

  it("names the file in the error, so the author knows which post to fix", () => {
    // Act
    const read = () => parsePost(source({ title: "" }), "where-to-play");

    // Assert
    expect(read).toThrow(/where-to-play/);
  });
});
