import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { strings } from "@/lib/strings";

vi.mock("@/lib/i18n/server", () => ({ getStrings: async () => strings, getLocale: async () => "en" }));
vi.mock("@/components/pass/BuyPassButton", () => ({ BuyPassButton: () => null }));

const { PassTierCard } = await import("@/components/pass/PassTierCard");

const tier = (games: number) => ({
  games,
  priceThb: games * 264,
  creditedThb: games * 300,
  expiresMonths: 2,
  perGameThb: 264,
  savingThb: games * 36,
});

/**
 * "MOST POPULAR" STANDS OUT (owner, 17 Nov 2026: "make the most popular text stand out a little bit more"). It was
 * a thin outlined tag in the card's own colour; it is now a filled lime tag, and its card carries a lime edge.
 */
describe("PassTierCard", () => {
  it("fills the Most popular tag and outlines its card", async () => {
    // Act
    const html = renderToStaticMarkup(await PassTierCard({ tier: tier(10), authenticated: true } as never));

    // Assert
    const tag = html.match(/<span[^>]*data-testid="pass-tier-popular"[^>]*>/)?.[0] ?? "";
    expect(tag).toContain("bg-volt");
    expect(html.match(/^<article[^>]*>/)?.[0]).toContain("ring-accent");
  });

  it("leaves the other passes plain", async () => {
    // Act
    const html = renderToStaticMarkup(await PassTierCard({ tier: tier(5), authenticated: true } as never));

    // Assert
    expect(html).not.toContain("pass-tier-popular");
    expect(html.match(/^<article[^>]*>/)?.[0]).not.toContain("ring-accent");
  });
});
