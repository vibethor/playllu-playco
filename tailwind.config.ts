import type { Config } from "tailwindcss";

/**
 * Theme tokens extracted verbatim from the volt-on-black design reference
 * (`index.html`). This file is the single source of truth for colour, type and
 * spacing values — no inline hex may appear in `app/` or `components/`.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /*
         * PLAYCO THEME (rebrand): Midnight Navy #102C40, Cloud White #F7FAFC, Electric Lime #DBFF00.
         *
         * Every colour is a CSS variable (app/globals.css), so one class means the right thing in both contexts:
         * the light page (`:root`) and the dark islands — photo cards, the hero, the game banner, the tab bar —
         * that carry `.theme-dark`. The old token NAMES stay (`volt`, `bone`, `ink`…) so the fork's components keep
         * working; what they mean is defined below and in globals.css.
         *
         *   navy / cloud / lime  the three brand colours, constant in every context
         *   volt                 lime as a FILL (buttons, selected states). Text on it is `ink`.
         *   accent               emphasis TEXT and LINES: navy on the light page, lime on dark islands.
         *                        Lime text on Cloud White is invisible, which is why `text-volt` became `text-accent`.
         *   ink                  navy: text on lime, photo scrims, navy blocks
         *   page / surface*      backgrounds (page, panels, raised, avatar, empty segment)
         *   bone / muted / faint text: primary, secondary, tertiary
         *   hairline*            lines
         *   warn / danger        semantic only, never decorative
         */
        navy: "rgb(var(--c-navy) / <alpha-value>)",
        cloud: "rgb(var(--c-cloud) / <alpha-value>)",
        lime: "rgb(var(--c-lime) / <alpha-value>)",

        volt: "rgb(var(--c-lime) / <alpha-value>)",
        "volt-dim": "rgb(var(--c-lime-dim) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        "accent-dim": "rgb(var(--c-accent-dim) / <alpha-value>)",

        ink: "rgb(var(--c-navy) / <alpha-value>)",
        page: "rgb(var(--c-page) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--c-surface-raised) / <alpha-value>)",
        "surface-avatar": "rgb(var(--c-surface-avatar) / <alpha-value>)",
        "surface-seg": "rgb(var(--c-surface-seg) / <alpha-value>)",
        "surface-overlay": "var(--surface-overlay)",
        // RETIRING -> surface.
        "surface-card": "rgb(var(--c-surface) / <alpha-value>)",
        "surface-card-strong": "rgb(var(--c-surface) / <alpha-value>)",
        "surface-panel": "rgb(var(--c-surface) / <alpha-value>)",

        bone: "rgb(var(--c-bone) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        faint: "rgb(var(--c-faint) / <alpha-value>)",
        // RETIRING -> bone / muted / faint.
        chalk: "rgb(var(--c-bone) / <alpha-value>)",
        "muted-dim": "rgb(var(--c-muted) / <alpha-value>)",
        subtle: "rgb(var(--c-muted) / <alpha-value>)",
        "footer-dim": "rgb(var(--c-muted) / <alpha-value>)",
        dim: "rgb(var(--c-faint) / <alpha-value>)",

        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
        "hairline-accent": "var(--hairline-accent)",
        // RETIRING -> hairline / hairline-strong / hairline-accent.
        "hairline-volt": "var(--hairline-accent)",
        "hairline-soft": "var(--hairline)",
        "hairline-chrome": "var(--hairline)",
        "hairline-link": "var(--hairline-strong)",
        "hairline-volt-soft": "var(--hairline-accent)",
        "hairline-volt-strong": "var(--hairline-accent)",

        "focus-ring": "rgb(var(--c-accent) / <alpha-value>)",
        warn: "rgb(var(--c-warn) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        whatsapp: "#25D366",
        instagram: "#E1306C",
        telegram: "#229ED9",
      },
      /*
       * --- Families: four become two, plus one reserved ---------------
       *
       * `condensed` (Barlow Condensed) is DELETED rather than aliased, and
       * the difference from the colour tokens is deliberate.
       *
       * THE RULE, since this config now does both: delete a token when the
       * ABSENCE of its class produces the intended result, and alias it when
       * absence produces something else. An ungenerated Tailwind class is not
       * a build error — it is simply no CSS — so `font-condensed` on an
       * element now inherits the body font, which IS Manrope, which is
       * exactly where those 117 call sites were going. Whereas an ungenerated
       * `text-section-title` inherits the BODY size rather than the title
       * size, and an ungenerated `rounded-card` is a square corner. Those
       * have to be aliased or the screen silently degrades.
       *
       * `mono` is not deleted and not general-purpose: it is RESERVED for the
       * variabilní symbol and nothing else. That string is copied into a
       * Czech banking app and matched by exact comparison; a proportional
       * font makes 0/O and 1/l confusable, and a mismatched VS is a payment
       * that arrives unreconciled — the one failure here that costs manual
       * work to undo.
       */
      fontFamily: {
        /*
         * PLAYCO: display = Archivo (semi-expanded, see `.font-display` in globals.css) with Anuphan for Thai;
         * text = IBM Plex Sans Thai (Thai + Latin) with Anuphan as a fallback; logo = Montserrat (the typeface of
         * the brand's existing wordmark), used only by the logo component.
         */
        display: ["var(--font-archivo)", "var(--font-anuphan)", "system-ui", "sans-serif"],
        sans: ["var(--font-plex-thai)", "var(--font-anuphan)", "system-ui", "sans-serif"],
        logo: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },

      /*
       * --- Scale: seven steps ----------------------------------------
       *
       * `hero` drops from clamp(58px,12.5vw,124px). Ruling J requires the
       * hero lose at least 25% of its height so the three step cards clear
       * the fold, and the type is the largest part of that height. This one
       * is deliberate and visible — it is the point of the change rather
       * than a hazard, which is why it is not in the silent-delta list.
       *
       * `body-lg` is ONE step with two documented weight variants — 600 by
       * default, 700 for the spots figure — not two steps. Code mirrors the
       * Figma layer rather than inventing a step, because a scale with a
       * step per weight stops being a scale.
       *
       * RULING B, and this is where a reader of the config meets it:
       * `eyebrow` is the ONLY uppercase style in the product. Every button,
       * link, nav label, card title, section heading and day label is
       * sentence case. If a mockup shows tracked capitals anywhere except a
       * small grey eyebrow, the mockup is wrong.
       */
      fontSize: {
        hero: ["clamp(44px,10vw,88px)", { lineHeight: "0.92", letterSpacing: "-1.5px" }],
        /*
         * `page-title` — ADDED in redesign v2 round 3 (R17), CORRECTED in
         * round 12 (R28).
         *
         * ~~The frames set a page's display heading at 32px on a 390
         * viewport: `UPCOMING GAMES` on p02 and `UPCOMING MATCHES` on p01
         * both measure a 23.5px Anton cap height, which is a 32px em. `title`
         * clamps to its 24px floor at that width, so every page heading in
         * the product was rendering a third smaller than the design.~~
         *
         * ~~The clamp keeps `title`'s 6vw slope so the two steps track each
         * other above the fold-width, and the 42px ceiling is 32 scaled by
         * the same 1.24 that separates the floors.~~
         *
         * THE CAP MEASUREMENT WAS RIGHT AND THE CONVERSION WAS WRONG. 23.5px
         * of cap is a 32px em only if Anton's cap-height ratio is 0.73, which
         * is the figure its published metrics give (1462/2048). The ratio it
         * actually RENDERS at is 0.86 — measured off our own screenshot at a
         * known font size, twice, in rounds 10 and 12. So the frames' 23.5px
         * cap is a **27px em**, and this step shipped a fifth too large for
         * nine rounds.
         *
         * `clamp(27px,7vw,36px)` puts 27.3px at 390 — a 23.5px cap, which is
         * the frames' number to a tenth of a pixel. The slope and ceiling keep
         * their relationship to `title`: 7vw against 6vw, and 36 is 27 scaled
         * by the same 1.33 that separates 27 from 24 at the ceiling end.
         *
         * A NEW STEP RATHER THAN A WIDER `title` still holds, and now holds
         * for a better reason: at 390 the two are 27.3 and 24, which is a real
         * step and a small one — exactly what the frames draw.
         *
         * THE GENERAL LESSON, which is worth more than the fix: measure a
         * font's cap ratio on the thing you are measuring with. A published
         * metric describes the outline; the browser rasterises it with
         * hinting, and the two differ by 18% for this face.
         */
        "page-title": ["clamp(27px,7vw,36px)", { lineHeight: "1.05" }],
        title: ["clamp(24px,6vw,34px)", { lineHeight: "1.05" }],
        time: ["28px", { lineHeight: "1" }],
        "body-lg": ["17px", { lineHeight: "1.4" }],
        body: ["15px", { lineHeight: "1.45" }],
        small: ["13px", { lineHeight: "1.4" }],
        eyebrow: ["11px", { letterSpacing: "3px" }],

        /*
         * RETIRING -> the seven above. Removed in Phase 18.
         *
         * These MUST be aliased rather than deleted: an ungenerated
         * `text-section-title` inherits the body size, so deleting would
         * silently shrink 19 headings to 15px and no suite would notice.
         *
         * The mapping is the one in docs/v13/token-map.md §9, which is marked
         * INFERRED — the design system gives the seven surviving steps but no
         * "Replaces" column for type, and none of these seven names appears
         * in it. `card-title` is the least certain: it sits between `body-lg`
         * and `title`, and is mapped to `body-lg` on the reading that a card
         * title is emphasis rather than hierarchy. One call site.
         */
        "hero-sub": ["clamp(24px,6vw,34px)", { lineHeight: "1.05" }],
        "section-title": ["clamp(24px,6vw,34px)", { lineHeight: "1.05" }],
        "match-title": ["clamp(24px,6vw,34px)", { lineHeight: "1.05" }],
        "community-title": ["clamp(24px,6vw,34px)", { lineHeight: "1.05" }],
        "card-title": ["17px", { lineHeight: "1.4" }],
        lede: ["15px", { lineHeight: "1.45" }],
        cta: ["17px", { lineHeight: "1.4" }],
      },

      /*
       * --- One breakpoint --------------------------------------------
       *
       * `md = 768px`, and no other. Replacing Tailwind's default set is safe
       * here and was checked rather than assumed: `sm:`, `lg:`, `xl:` and
       * `2xl:` have zero usages across app/ and components/, while `md:` has
       * four.
       *
       * One is enough because only one thing genuinely changes shape — the
       * nav pill gives way to the header's link row — and naming it once
       * stops each of the eight build stages choosing its own.
       */
      screens: {
        md: "768px",
      },
      letterSpacing: {
        eyebrow: "3px",
        wide: "0.5px",
      },
      maxWidth: {
        /*
         * `shell` is CHROME width — the header's inner row, which spans wider
         * than the reading column so the wordmark and the auth control sit at
         * the edges of the screen rather than floating in the middle of it.
         *
         * `content` is READING width. Capped at 720px and centred at and above
         * `md`, because a games list stretched across 1280px is a list whose
         * left edge and right edge are read by different eye movements. Below
         * `md` it does nothing: the viewport is already narrower than the cap,
         * and the 22px gutter is what holds content off the edge.
         *
         * Two tokens rather than one because the two jobs genuinely differ,
         * and collapsing them would either cramp the header or stretch the
         * text.
         */
        shell: "980px",
        content: "720px",
      },
      backgroundSize: {
        /*
         * One `drift` cycle — see the `grain` gradient below. Named
         * `grain-tile` rather than `grain` on purpose: Tailwind generates both
         * backgroundImage and backgroundSize utilities under the `bg-` prefix,
         * so two entries called `grain` would produce one class that silently
         * wins over the other.
         */
        "grain-tile": "60px 60px",
      },
      /*
       * --- Spacing: a 4-point scale ----------------------------------
       *
       * 4 / 8 / 12 / 16 / 22 / 32 / 48. `22` is the page gutter and stays the
       * outer margin on every screen; card padding is `16`; the gap between
       * cards in a list is `12`; between sections, `32`.
       *
       * 22 is the one value off the 4-point grid, and it is kept rather than
       * rounded to 24 because it is the existing gutter on every screen in
       * the product — moving it would shift every layout horizontally to
       * satisfy a rule about arithmetic.
       */
      /*
       * --- Spacing: a 4-point scale ----------------------------------
       *
       * 4 / 8 / 12 / 16 / 22 / 32 / 48. `22` is the page gutter and stays the
       * outer margin on every screen; card padding is `16`; the gap between
       * cards in a list is `12`; between sections, `32`.
       *
       * SIX OF THE SEVEN ARE ALREADY TAILWIND'S DEFAULTS — `1` `2` `3` `4`
       * `8` `12` resolve to exactly 4/8/12/16/32/48px — so they are NOT
       * restated here. Redefining a token to the value it already has reads
       * like a change, invites the next reader to wonder what moved, and
       * implies the keys NOT listed were removed, which `extend` does not do.
       * The scale is a rule about which of the existing steps to use, and it
       * belongs in docs/v13/type-scale.md where it can be read as one.
       *
       * `22` is the only value off the 4-point grid and the only one that
       * needs declaring. It is kept rather than rounded to 24 because it is
       * the existing gutter on every screen in the product; moving it would
       * shift every layout sideways to satisfy a rule about arithmetic.
       */
      spacing: {
        gutter: "22px",
        nav: "64px",
        /*
         * The bottom tab bar's content height, WITHOUT the safe-area inset —
         * the inset is added at the render site via the `--tabbar-h` custom
         * property in globals.css, because Tailwind cannot express `env()`
         * arithmetic in a token and a hard-coded 64px would put the tab labels
         * under an iPhone's home indicator.
         *
         * 52 -> 72 (redesign v2, round 1), and MEASURED rather than reasoned.
         *
         * The frames give each tab its own filled cell with real gaps. The
         * bar's own padding went 4px to 8px, and the cell gained `py-2` — which
         * pushes it past the 44px target floor to 56px (20px icon + 2px gap +
         * the label + 16px padding). 8 + 56 + 8 = 72.
         *
         * The first attempt at this number was 60, arrived at by assuming the
         * cell stayed at its `min-h-11` floor. It did not. THREE things read
         * this value — the page wrapper's bottom padding, the game page's
         * fixed claim bar, and the bar itself — so the spec asserting that the
         * claim bar's bottom edge MEETS the bar's top edge caught the 12px
         * gap, twice. Measure this in the browser when the bar changes; do not
         * add up the classes.
         */
        tabbar: "72px",
      },
      /*
       * --- Radius: six become three -----------------------------------
       *
       * Two of the three survive BY NAME and change value, which makes
       * them silent deltas exactly like `hairline-strong`, and neither is
       * in the analysis:
       *
       *   control  8px -> 14px   every button, input and day box
       *   card    16px -> 18px   cards, panels, sheets, the claim bar
       *
       * `control` nearly doubles and is the most visible single change in
       * the whole token layer. At the Stage 0 strip review it will read as
       * "the redesign looks different" rather than as "a token moved",
       * which is the correct impression and the wrong explanation.
       *
       * `pill` is new and takes chips, the spots pill, the nav capsule and
       * the level badge. A 5px chip corner becoming fully round is the
       * largest single jump in the migration map.
       */
      borderRadius: {
        pill: "999px",
        control: "14px",
        card: "18px",

        // RETIRING -> pill / control. Removed in Phase 17.
        chip: "999px",
        badge: "999px",
        cta: "14px",
      },
      /*
       * --- Elevation: one shadow ------------------------------------
       *
       * The claim bar and the nav pill cast UPWARD, so content scrolling
       * under them reads as under rather than as cut off. That is the only
       * shadow in the product.
       *
       * `volt-glow` and `volt-glow-lg` are DELETED, not aliased, under the
       * same rule as `font-condensed`: absence produces the intended result.
       * A glow on everything is the same problem as a border on everything,
       * and its four call sites simply stop glowing — which is the
       * retirement. The dead class strings are swept in Phase 17.
       */
      boxShadow: {
        lift: "0 -8px 24px rgba(0,0,0,.6)",
        card: "0 1px 2px rgba(16,44,64,.10), 0 10px 26px rgba(16,44,64,.14)",
      },
      backgroundImage: {
        "page-vignette":
          "radial-gradient(120% 90% at 50% 0%,transparent 55%,rgba(0,0,0,.5) 100%)",
        "map-vignette":
          "radial-gradient(130% 110% at 50% 45%,transparent 50%,rgba(6,6,6,.6) 100%)",
        /*
         * Grain. THE ONE BACKGROUND ELEMENT THAT IS AN EXTENSION rather than a
         * port: the reference ships a `drift` keyframe (background-position
         * 0 0 → 60px 60px) with nothing wired to it, which is the tile this
         * animates. A 60px dot lattice at 2% white, drifting one full tile —
         * it reads as film grain over the flat black and gives the fixed
         * layers something to sit on. Sized to match the keyframe's travel, so
         * the loop is seamless.
         */
        grain:
          "radial-gradient(rgba(255,255,255,.02) 1px,transparent 1px)",
        instagram: "linear-gradient(45deg,#F9CE34,#EE2A7B,#6228D7)",
      },
      keyframes: {
        heroDrift: {
          "0%": { transform: "scale(1) translate3d(0,0,0)" },
          "100%": { transform: "scale(1.07) translate3d(-1.5%,-1%,0)" },
        },
        pulseRing: {
          "0%": { transform: "scale(.6)", opacity: ".7" },
          "100%": { transform: "scale(2.3)", opacity: "0" },
        },
        blink: {
          "0%,90%,100%": { opacity: "1" },
          "94%": { opacity: ".25" },
        },
        drift: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "60px 60px" },
        },
        floatY: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(7px)" },
        },
      },
      animation: {
        "hero-drift": "heroDrift 24s ease-in-out infinite alternate",
        blink: "blink 3s infinite",
        drift: "drift 6s linear infinite",
        floatY: "floatY 2.4s ease-in-out infinite",
        pulseRing: "pulseRing 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
