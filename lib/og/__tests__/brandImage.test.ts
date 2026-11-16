import { PNG } from "pngjs";
import { beforeAll, describe, expect, it } from "vitest";
import { renderBrandImage } from "@/lib/og/brandImage";
import { OG_SIZE } from "@/lib/og/theme";

/*
 * THE PLAYCO SHARE CARD (rebrand): Midnight Navy ground, the court-corners logo at the centre, two lines of copy
 * beneath it. Asserted on the rendered pixels, the way a link preview will see them.
 */

type Pixel = [number, number, number];

let png: PNG;
const at = (x: number, y: number): Pixel => {
  const i = (y * png.width + x) * 4;
  return [png.data[i]!, png.data[i + 1]!, png.data[i + 2]!];
};
/** Midnight Navy #102C40, give or take anti-aliasing. */
const isNavy = ([r, g, b]: Pixel) => Math.abs(r - 0x10) <= 6 && Math.abs(g - 0x2c) <= 6 && Math.abs(b - 0x40) <= 6;
/** Electric Lime #DBFF00. */
const isLime = ([r, g, b]: Pixel) => r >= 190 && g >= 230 && b <= 60;
/** Cloud White text. */
const isCloud = ([r, g, b]: Pixel) => r >= 225 && g >= 230 && b >= 235;

describe("the Playco share card", () => {
  beforeAll(async () => {
    const response = renderBrandImage();
    png = PNG.sync.read(Buffer.from(await response.arrayBuffer()));
  });

  it("is the size every preview client expects", () => {
    // Arrange / Act — rendered once above

    // Assert
    expect({ width: png.width, height: png.height }).toEqual(OG_SIZE);
  });

  it("sits on Midnight Navy, edge to edge", () => {
    // Arrange
    const corners: Pixel[] = [at(4, 4), at(png.width - 5, 4), at(4, png.height - 5), at(png.width - 5, png.height - 5)];

    // Act
    const navy = corners.map(isNavy);

    // Assert
    expect(navy).toEqual([true, true, true, true]);
  });

  it("draws the lime court corners and keeps them in the top half, around the logo", () => {
    // Arrange
    const limeRows: number[] = [];

    // Act
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        if (isLime(at(x, y))) {
          limeRows.push(y);
          break;
        }
      }
    }

    // Assert
    expect(limeRows.length).toBeGreaterThan(0);
    expect(Math.min(...limeRows)).toBeLessThan(png.height / 2);
  });

  it("centres the logo, so a square crop still shows it", () => {
    // Arrange: the logo's letters are the Cloud White pixels in the band above the copy
    let left = png.width;
    let right = 0;
    const bandTop = Math.round(png.height * 0.25);
    const bandBottom = Math.round(png.height * 0.52);

    // Act
    for (let y = bandTop; y < bandBottom; y++) {
      for (let x = 0; x < png.width; x++) {
        if (isCloud(at(x, y))) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      }
    }

    // Assert
    expect(right).toBeGreaterThan(left);
    expect(Math.abs((left + right) / 2 - png.width / 2)).toBeLessThanOrEqual(24);
  });
});
