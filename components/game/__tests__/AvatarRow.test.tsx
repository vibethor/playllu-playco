import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

vi.mock("@/lib/i18n/server", () => ({ getStrings: async () => strings, getLocale: async () => "en" }));
vi.mock("@/lib/storage/photoVersions", () => ({ profilePhotoVersion: async () => null }));

const { AvatarRow } = await import("@/components/game/AvatarRow");

/**
 * THE CARD'S FACES ARE A STEP SMALLER (owner, 17 Nov 2026: under the progress bar, "maybe make them a bit smaller as
 * well"). 22px, from 28.
 */
describe("AvatarRow on a game card", () => {
  it("draws each face, and the +N chip, at 22px", async () => {
    // Arrange
    const players = ["Steven", "Sofi", "Jay", "Ploy"].map((nickname) => ({
      nickname,
      photoPath: null,
      isGuest: false,
      guestOf: null,
      guestIndex: null,
    }));

    // Act
    const html = renderToStaticMarkup(await AvatarRow({ players, max: 3, size: "card" }));

    // Assert
    expect(html.match(/h-\[22px\] w-\[22px\]/g)).toHaveLength(4);
    expect(html).not.toContain("h-7 w-7");
  });
});
