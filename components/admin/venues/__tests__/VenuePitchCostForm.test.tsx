import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VenuePitchCostForm } from "@/components/admin/venues/VenuePitchCostForm";

/**
 * ONE COURT COST PER VENUE (owner, 17 Nov 2026: "remove the winter / summer pricing as it's only one season in
 * Thailand"). The form shows one price; it still posts both season fields, set to that same price, so the server
 * rule (and every game priced by whichever season is switched on) is unchanged.
 */
function render(costs: { summerThb: number; winterThb: number } | null) {
  return renderToStaticMarkup(<VenuePitchCostForm venueId="v1" costs={costs} season="winter" />);
}

const visibleInputs = (html: string) =>
  [...html.matchAll(/<input(?![^>]*type="hidden")[^>]*>/g)].map((m) => m[0]);

describe("VenuePitchCostForm", () => {
  it("shows one price field, not one per season", () => {
    // Act
    const html = render({ summerThb: 800, winterThb: 1200 });

    // Assert
    expect(visibleInputs(html)).toHaveLength(1);
    expect(html).not.toMatch(/>(Winter|Summer)</);
  });

  it("starts from the price new games take today", () => {
    // Act
    const field = visibleInputs(render({ summerThb: 800, winterThb: 1200 }))[0]!;

    // Assert
    expect(field).toContain('value="1200"');
  });

  it("posts that one price as both season values", () => {
    // Act
    const html = render({ summerThb: 800, winterThb: 1200 });

    // Assert
    expect(html).toMatch(/<input[^>]*type="hidden"[^>]*name="summerThb"[^>]*value="1200"|<input[^>]*name="summerThb"[^>]*type="hidden"[^>]*value="1200"/);
    expect(html).toMatch(/name="winterThb"[^>]*value="1200"|value="1200"[^>]*name="winterThb"/);
  });
});
