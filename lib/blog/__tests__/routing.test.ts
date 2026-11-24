import { describe, expect, it } from "vitest";
import { blogRoute } from "@/lib/blog/routing";

const READABLE = ["where-to-play", "first-game"];

describe("what a request under /blog is", () => {
  it("is a post when its slug is one this deployment shows", () => {
    // Act
    const route = blogRoute("/blog/where-to-play", READABLE);

    // Assert
    expect(route).toEqual({ kind: "post", slug: "where-to-play" });
  });

  it("is a post with a trailing slash too", () => {
    // Act
    const route = blogRoute("/blog/first-game/", READABLE);

    // Assert
    expect(route).toEqual({ kind: "post", slug: "first-game" });
  });

  it("is missing when no readable post has that slug — a draft in production, or a typo", () => {
    // Act
    const route = blogRoute("/blog/a-draft", READABLE);

    // Assert
    expect(route).toEqual({ kind: "missing" });
  });

  it("is missing for every post address while nothing is readable", () => {
    // Act
    const route = blogRoute("/blog/where-to-play", []);

    // Assert
    expect(route).toEqual({ kind: "missing" });
  });

  it.each(["/blog", "/blog/", "/blog/rss.xml", "/blog/where-to-play/opengraph-image", "/games", "/", "/blogger/x"])(
    "leaves %s alone: it is not a post's address",
    (pathname) => {
      // Act
      const route = blogRoute(pathname, READABLE);

      // Assert
      expect(route).toEqual({ kind: "other" });
    },
  );

  it("reads a slug that arrives percent-encoded", () => {
    // Act
    const route = blogRoute("/blog/where%2Dto%2Dplay", READABLE);

    // Assert
    expect(route).toEqual({ kind: "post", slug: "where-to-play" });
  });

  it("treats a slug that cannot be decoded as missing rather than failing the request", () => {
    // Act
    const route = blogRoute("/blog/%E0%A4%A", READABLE);

    // Assert
    expect(route).toEqual({ kind: "missing" });
  });
});
