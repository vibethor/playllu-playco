import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReferralCodeCard } from "@/components/account/ReferralCodeCard";

/**
 * YOUR REFERRAL CODE, ON YOUR PROFILE (owner, 17 Nov 2026): "displayed in your profile, you can copy to clipboard
 * with one click". The code itself, one button that copies it, and a second that copies an invite link which
 * pre-fills the code on the sign-up form.
 */
describe("ReferralCodeCard", () => {
  it("shows the player's code", () => {
    // Act
    const html = renderToStaticMarkup(<ReferralCodeCard code="K7M2QX" inviteUrl="https://playco.example/signup?ref=K7M2QX" />);

    // Assert
    expect(html).toMatch(/data-testid="referral-code"[^>]*>K7M2QX</);
  });

  it("offers one-click copy of the code and of the invite link", () => {
    // Act
    const html = renderToStaticMarkup(<ReferralCodeCard code="K7M2QX" inviteUrl="https://playco.example/signup?ref=K7M2QX" />);

    // Assert
    expect(html).toMatch(/<button[^>]*data-testid="referral-copy-code"/);
    expect(html).toMatch(/<button[^>]*data-testid="referral-copy-link"/);
  });
});
