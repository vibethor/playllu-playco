import { describe, expect, it } from "vitest";
import { AUTH_TEMPLATES, supabaseSubject, supabaseTemplate } from "@/lib/email/templates/authEmails";

/**
 * ROUND 41 — the three emails Supabase sends, in the approved design and the
 * reader's language. Pasted into the dashboard by the owner; these tests are
 * the only check before a real phone, so they pin what AUTH_EMAIL_TEMPLATE.md
 * says each one must carry — a template that renders fine and mints a
 * credential nothing can exchange is the failure they all share.
 */
describe("the Supabase templates", () => {
  it.each(AUTH_TEMPLATES)("%s links through the callback with an explicit type", (kind) => {
    // Act
    const template = supabaseTemplate(kind);

    // Assert
    const type = { magic_link: "email", confirm_signup: "signup", email_change: "email_change" }[kind];
    expect(template).toContain(`{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=${type}`);
    expect(template).not.toContain("{{ .ConfirmationURL }}");
  });

  it("prints the six-digit code where the login box needs it", () => {
    // Act / Assert
    expect(supabaseTemplate("magic_link")).toContain("{{ .Token }}");
    expect(supabaseTemplate("confirm_signup")).toContain("{{ .Token }}");
  });

  it("names both addresses in the change-of-email notice", () => {
    // Act
    const template = supabaseTemplate("email_change");

    // Assert
    expect(template).toContain("{{ .Email }}");
    expect(template).toContain("{{ .NewEmail }}");
  });

  /*
   * PLAYCO: English and Thai, the two languages a player can choose (SERVED_LOCALES). An account that somehow
   * carries another locale falls through to English rather than to an unreviewed overlay.
   */
  it.each(AUTH_TEMPLATES)("%s carries English and Thai, chosen from the account", (kind) => {
    // Act
    const template = supabaseTemplate(kind);

    // Assert
    expect(template).toContain('{{ if .Data.email_locale }}{{ $l = .Data.email_locale }}{{ end }}');
    expect(template).toContain('eq $l "th"');
    expect(template.match(/<html lang="[a-z]+">/g)).toEqual(['<html lang="th">', '<html lang="en">']);
    expect(template.trim().endsWith("{{ end }}")).toBe(true);
  });

  it.each(AUTH_TEMPLATES)("%s says Playco, never the old brand", (kind) => {
    // Act
    const template = supabaseTemplate(kind) + supabaseSubject(kind);

    // Assert
    expect(template).not.toMatch(/hraj|fotbal|hrajsport/i);
    expect(template).toContain("Playco");
  });

  it.each(AUTH_TEMPLATES)("%s leaves no copy placeholder unfilled", (kind) => {
    // Act
    const template = supabaseTemplate(kind).replace(/\{\{[^}]*\}\}/g, "");

    // Assert
    expect(template).not.toMatch(/\{[a-zA-Z]+\}/);
  });
});

/**
 * Owner, 2026-10-28, on the sign-up email: remove "If the button opens in the
 * wrong app, type the code on the sign-in page instead" ENTIRELY — and in
 * Czech, "kliknutí", not "klepnutí".
 */
describe("the owner's wording", () => {
  const WRONG_APP = /wrong app|špatné aplikaci|не в том приложении|не в тому застосунку/i;

  it.each(AUTH_TEMPLATES)("%s no longer tells the reader about the wrong app, in any language", (kind) => {
    // Act
    const template = supabaseTemplate(kind);

    // Assert
    expect(template).not.toMatch(WRONG_APP);
  });

  it.each(AUTH_TEMPLATES)("%s says kliknutí in Czech, never klepnutí", (kind) => {
    // Act
    const template = supabaseTemplate(kind);

    // Assert
    expect(template).not.toMatch(/klepn/i);
  });
});
