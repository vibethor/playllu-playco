import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AddToGameForm } from "@/components/admin/players/AddToGameForm";

/**
 * Found on the preview, 17 Nov 2026: adding a player to the only upcoming game left nothing pickable, the form
 * swapped itself for a line of text, and the "Added" confirmation disappeared with it. The form must stay whenever
 * there are games to show, with the button disabled when none can be picked.
 */
describe("AddToGameForm", () => {
  it("keeps the form when every upcoming game is already taken", () => {
    // Arrange
    const choices = [{ id: "g1", label: "Thu 19 Nov · Swish · already in", disabled: true }];

    // Act
    const html = renderToStaticMarkup(<AddToGameForm playerId="p1" choices={choices} />);

    // Assert
    expect(html).toContain('data-testid="add-to-game-form"');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*data-testid="add-to-game-submit"/);
    expect(html).toContain('data-testid="add-to-game-none-open"');
  });

  it("shows a plain line only when there are no upcoming games at all", () => {
    // Act
    const html = renderToStaticMarkup(<AddToGameForm playerId="p1" choices={[]} />);

    // Assert
    expect(html).toContain('data-testid="add-to-game-empty"');
    expect(html).not.toContain("<form");
  });
});
