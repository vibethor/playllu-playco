import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SHORT_LINKS, shortLinkRedirects } from "@/shortLinks";

const APP_DIR = path.resolve(__dirname, "../../app");

describe("short links", () => {
  it("sends /reclub to the games list tagged as the Reclub listing", () => {
    // Arrange
    const redirects = shortLinkRedirects();

    // Act
    const reclub = redirects.find((r) => r.source === "/reclub");

    // Assert
    expect(reclub?.destination).toBe(
      "/games?utm_source=reclub&utm_medium=referral&utm_campaign=bkk_volleyball_launch&utm_content=listing",
    );
  });

  it("sends /ig to the games list tagged as the Instagram bio", () => {
    // Arrange
    const redirects = shortLinkRedirects();

    // Act
    const ig = redirects.find((r) => r.source === "/ig");

    // Assert
    expect(ig?.destination).toBe(
      "/games?utm_source=instagram&utm_medium=social&utm_campaign=bkk_volleyball_launch&utm_content=bio",
    );
  });

  it("sends /wa to the games list tagged as the WhatsApp group", () => {
    // Arrange
    const redirects = shortLinkRedirects();

    // Act
    const wa = redirects.find((r) => r.source === "/wa");

    // Assert
    expect(wa?.destination).toBe(
      "/games?utm_source=whatsapp&utm_medium=messaging&utm_campaign=bkk_volleyball_launch&utm_content=group_desc",
    );
  });

  it("makes every short link a temporary redirect, so its destination can change later", () => {
    // Arrange
    const redirects = shortLinkRedirects();

    // Act
    const permanent = redirects.filter((r) => r.permanent !== false);

    // Assert
    expect(permanent).toEqual([]);
  });

  it("never shadows a page of the app", () => {
    // Arrange
    const paths = SHORT_LINKS.map((link) => link.path);

    // Act
    const clashing = paths.filter((p) => existsSync(path.join(APP_DIR, p)));

    // Assert
    expect(clashing).toEqual([]);
  });

  it("gives every short link its own path", () => {
    // Arrange
    const paths = SHORT_LINKS.map((link) => link.path);

    // Act
    const unique = new Set(paths);

    // Assert
    expect(unique.size).toBe(paths.length);
  });
});
