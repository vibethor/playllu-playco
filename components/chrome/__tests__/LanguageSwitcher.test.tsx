import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageSwitcher } from "@/components/chrome/LanguageSwitcher";
import { LocaleProvider } from "@/components/LocaleProvider";
import { strings } from "@/lib/strings";
import type { Locale } from "@/lib/i18n/locales";

/**
 * THE WEBSITE LANGUAGE IS A DROPDOWN (owner, 17 Nov 2026): "use the globe visual and the flags that we use on the
 * game card, make it a drop down". Closed, it shows the globe and the current language's round flag; the list of
 * languages is only in the page once it is opened.
 */
function render(locale: Locale): string {
  return renderToStaticMarkup(
    <LocaleProvider locale={locale} t={strings}>
      <LanguageSwitcher />
    </LocaleProvider>,
  );
}

describe("LanguageSwitcher", () => {
  it("is a closed menu button by default", () => {
    // Act
    const html = render("en");

    // Assert
    expect(html).toMatch(/<button[^>]*aria-haspopup="menu"[^>]*aria-expanded="false"/);
    expect(html).not.toContain('role="menu"');
  });

  it("shows the globe and the current language's round flag", () => {
    // Act
    const html = render("th");

    // Assert
    expect(html).toContain('data-testid="locale-current-flag"');
    expect(html).toContain('data-flag="th"');
    expect(html).toContain('data-testid="locale-globe"');
  });

  it("names the current language for screen readers", () => {
    // Act
    const html = render("en");

    // Assert
    expect(html).toMatch(/aria-label="[^"]*English[^"]*"/);
  });
});
