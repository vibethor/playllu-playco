import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileCover } from "@/components/account/ProfileCover";
import { ProfileHeader } from "@/components/account/ProfileHeader";
import { strings } from "@/lib/strings";

/**
 * THE PROFILE HEADER IS A DARK ISLAND (owner, 16 Nov 2026: "the layout is not correct"). The page turned light in
 * the rebrand, and the name, the stat numbers and the "Change cover" button kept the page's navy, on a navy cover.
 * The cover also stopped at a fixed 341px, mid-way through the stats, so the labels fell onto the light page and the
 * tabs butted against its edge.
 */
const rootTag = (html: string) => html.match(/^<\w+[^>]*>/)![0];

describe("ProfileHeader", () => {
  it("makes the cover, name and stats one dark island", () => {
    // Act
    const html = renderToStaticMarkup(<ProfileHeader>name and stats</ProfileHeader>);

    // Assert
    expect(rootTag(html)).toContain("theme-dark");
  });

  it("leaves room under the stats before the tabs", () => {
    // Act
    const html = renderToStaticMarkup(<ProfileHeader>name and stats</ProfileHeader>);

    // Assert
    expect(rootTag(html)).toMatch(/\bpb-\d+\b/);
  });
});

describe("ProfileCover", () => {
  it("stretches to the bottom of the header instead of a fixed height", () => {
    // Act
    const html = renderToStaticMarkup(<ProfileCover coverPath={null} photoVersion={null} t={strings} />);

    // Assert
    expect(rootTag(html)).toContain("bottom-0");
    expect(rootTag(html)).not.toMatch(/\bh-\[\d+px\]/);
  });

  it("draws no stock picture behind a player without a cover photo", () => {
    // Act
    const html = renderToStaticMarkup(<ProfileCover coverPath={null} photoVersion={null} t={strings} />);

    // Assert
    expect(html).not.toContain("<img");
  });

  it("draws the player's own cover photo when they have one", () => {
    // Act
    const html = renderToStaticMarkup(
      <ProfileCover coverPath="covers/jay.jpg" photoVersion="1" t={strings} />,
    );

    // Assert
    expect(html).toMatch(/<img[^>]*src="[^"]*covers\/jay\.jpg/);
  });
});

/**
 * OVERVIEW / MY GAMES LOOK LIKE BUTTONS (owner, 17 Nov 2026: "too close to the section above, make it look more like a
 * button"). A two-button segmented control with room above it, the selected tab filled.
 */
describe("ProfileTabs", () => {
  it("draws the two tabs as buttons in one rounded control", async () => {
    // Arrange
    const { ProfileTabs } = await import("@/components/account/ProfileTabs");

    // Act
    const html = renderToStaticMarkup(<ProfileTabs selected="overview" t={strings} />);
    const nav = html.match(/^<nav[^>]*>/)![0];

    // Assert
    expect(nav).toContain("rounded-pill");
    expect(nav).not.toContain("border-b");
  });

  it("fills the selected tab and leaves the other one plain", async () => {
    // Arrange
    const { ProfileTabs } = await import("@/components/account/ProfileTabs");

    // Act
    const html = renderToStaticMarkup(<ProfileTabs selected="games" t={strings} />);
    const selected = html.match(/<a[^>]*data-selected="true"[^>]*>/)![0];
    const other = html.match(/<a[^>]*data-selected="false"[^>]*>/)![0];

    // Assert
    expect(selected).toContain("bg-ink");
    expect(other).not.toContain("bg-ink");
  });

  it("leaves clear room above itself", async () => {
    // Arrange
    const { ProfileTabs } = await import("@/components/account/ProfileTabs");

    // Act
    const nav = renderToStaticMarkup(<ProfileTabs selected="overview" t={strings} />).match(/^<nav[^>]*>/)![0];

    // Assert
    expect(nav).toMatch(/\bmt-(8|10|12)\b/);
  });
});
