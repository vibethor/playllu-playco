import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownBody, headingId, imageSize } from "@/components/blog/MarkdownBody";

function render(markdown: string): string {
  return renderToStaticMarkup(<MarkdownBody markdown={markdown} />);
}

describe("a post's Markdown on the page", () => {
  it("draws a section heading as an H2 with an anchor from its words", () => {
    // Act
    const markup = render("## What does it cost?");

    // Assert
    expect(markup).toMatch(/<h2 id="what-does-it-cost"[^>]*>What does it cost\?<\/h2>/);
  });

  it("never draws a second H1: the title is the page's only one", () => {
    // Act
    const markup = render("# A top heading in the body");

    // Assert
    expect(markup).not.toContain("<h1");
    expect(markup).toContain("<h2");
  });

  it("links inside the site by path", () => {
    // Act
    const markup = render("See [this week's games](/games).");

    // Assert
    expect(markup).toMatch(/<a[^>]*href="\/games"[^>]*>this week(&#x27;|')s games<\/a>/);
  });

  it("links to another site with rel=noopener", () => {
    // Act
    const markup = render("[Meetup](https://www.meetup.com/bkk-volleyball/)");

    // Assert
    expect(markup).toMatch(/<a href="https:\/\/www\.meetup\.com\/bkk-volleyball\/" rel="noopener"/);
  });

  it("puts a table in a box that scrolls sideways, so a phone's page does not", () => {
    // Act
    const markup = render("| Pass | Price |\n| --- | --- |\n| 5 credits | 1,400 THB |");

    // Assert
    expect(markup).toMatch(/<div role="region"[^>]*class="[^"]*overflow-x-auto/);
    expect(markup).toContain('<th scope="col"');
    expect(markup).toContain("1,400 THB");
  });

  it("puts a question and its answer on two lines when they are written on two", () => {
    // Act
    const markup = render("**Do I need a team?**\nNo.");

    // Assert
    expect(markup).toMatch(/<strong[^>]*>Do I need a team\?<\/strong><br\/>No\./);
  });

  it("draws bullet and numbered lists as lists", () => {
    // Act
    const markup = render("- Water\n- A towel\n\n1. Pick a game\n2. Pay");

    // Assert
    expect(markup).toMatch(/<ul[^>]*><li[^>]*>Water<\/li>/);
    expect(markup).toMatch(/<ol[^>]*><li[^>]*>Pick a game<\/li>/);
  });

  it("shows raw HTML as text instead of running it", () => {
    // Act
    const markup = render('<script>alert("x")</script>');

    // Assert
    expect(markup).not.toContain("<script>");
    expect(markup).toContain("&lt;script&gt;");
  });

  it("keeps an ampersand and an apostrophe as the characters they are", () => {
    // Act
    const markup = render("Courts & balls aren't extra.");

    // Assert
    expect(markup).toContain("Courts &amp; balls aren");
    expect(markup).not.toContain("&amp;amp;");
  });
});

describe("a heading's anchor", () => {
  it("is its words in lower case, joined by hyphens", () => {
    // Act
    const id = headingId("Beach or indoor?");

    // Assert
    expect(id).toBe("beach-or-indoor");
  });
});

describe("an image's stated size", () => {
  it("is read from a title written WIDTHxHEIGHT", () => {
    // Act
    const size = imageSize("1200x800");

    // Assert
    expect(size).toEqual({ width: 1200, height: 800 });
  });

  it("is absent for any other title, and the image is then left out", () => {
    // Act
    const size = imageSize("A court");
    const markup = render('![A court](/blog/court.jpg "A court")');

    // Assert
    expect(size).toBeNull();
    expect(markup).not.toContain("<img");
  });
});
