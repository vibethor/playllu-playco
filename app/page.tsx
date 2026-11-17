import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { CommunityPanel } from "@/components/home/CommunityPanel";
import { FaqPanel } from "@/components/home/FaqPanel";
import { PlayerOfMonthPanel } from "@/components/home/PlayerOfMonthPanel";

import { GameCard } from "@/components/game/GameCard";
import { getHomeContent } from "@/lib/home/queries";
import {
  listPitchNamesByGame,
  listVenueImagesByGame,
  listRostersByGame,
  listUpcomingGames,
} from "@/lib/games/queries";
import { DayHeading } from "@/components/game/DayHeading";
import { groupByDay } from "@/lib/games/days";
import { getLocale } from "@/lib/i18n/server";
import { siteUrl } from "@/lib/site";
import { homeStructuredData } from "@/lib/seo/site";
import { getStrings } from "@/lib/i18n/server";

/** PLAYCO, PHASE F: the community panel still links to HrajFotbal's groups; off until Playco has its own. */
const COMMUNITY_LINKS_READY = false;


export async function generateMetadata(): Promise<Metadata> {
  const t = await getStrings();
  const url = await siteUrl();
  return {
    title: t.meta.title,
    description: t.meta.description,
    // The one address a result should show — the old Vercel alias forwards here.
    alternates: { canonical: `${url}/` },
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
    },
  };
}

// The next-match block reflects live capacity, so this page renders per
// request rather than being statically cached at build time.
export const dynamic = "force-dynamic";


export default async function LandingPage() {
  const t = await getStrings();
  const { landing } = t;
  const locale = await getLocale();
  const structuredData = homeStructuredData(await siteUrl());

  /*
   * THREE GAMES, NOT ONE (v1.2 §6). This page showed a single "NEXT MATCH"
   * card: a venue photo, a countdown, overlapping avatars and a claim button,
   * about 400px of one game. It could only ever answer "is there a game", and
   * the question a visitor arrives with is "is there a game I CAN MAKE" — which
   * a single card answers "no" to as often as not, on a Tuesday, for a game on
   * Thursday that they cannot do.
   *
   * So: the next three, in the same compact row the games list uses. Not a
   * similar row — the SAME component, so the price stays off it, the format
   * stays on it and the spots-left ladder cannot drift between the two
   * surfaces. Three of them fit in less height than the one card did.
   */
  // `now` comes back FROM the query layer, which is where the clock is read —
  // so the pills and the list agree about what "Today" means even across a
  // Prague midnight.
  /*
   * TWO TIERS, NOT FOUR (round 37, item 2).
   *
   * ~~Four sequential awaits.~~ This page made `listUpcomingGames`,
   * `listRostersByGame`, a pair, and `getHomeContent` wait for each other in a
   * line, and only the last pair was parallel — so a render cost FOUR database
   * round trips end to end where it needs TWO. Measured before the change at a
   * 1.40s median TTFB against 0.50s for `/games`, which does the same work in
   * two tiers; the gap was the waterfall, not the work.
   *
   * WHAT ACTUALLY DEPENDS ON WHAT. Only the three follow-up reads need the game
   * ids, so only they belong behind `listUpcomingGames`. `getHomeContent` reads
   * `site_settings` and knows nothing about which games are on — it was waiting
   * for three reads it has no relationship with, purely because of where the
   * line was written.
   */
  const homeContent = getHomeContent();
  const { games, now } = await listUpcomingGames(3);
  const gameIds = games.map(({ game }) => game.id);
  const gameRows = games.map(({ game }) => game);
  const [rosters, pitchNames, venueImages, home] = await Promise.all([
    // The canonical card carries an avatar stack (§2.1, ruling D), so the home
    // preview needs the same roster read the list does — one round trip for all
    // three games rather than one apiece.
    listRostersByGame(gameIds),
    // Pitch names, live from `venues` — see `listPitchNamesByGame`.
    listPitchNamesByGame(gameRows),
    // The venue's own photograph, where it has one (round 13, item 24).
    listVenueImagesByGame(gameRows),
    // Admin-editable content (§6). Every read behind this is anon-legal,
    // because this page is what a shared WhatsApp link opens for someone with
    // no account. STARTED ABOVE, awaited here: it is in the list so that a
    // rejection is still awaited on the same tick as the others, rather than
    // becoming an unhandled rejection if one of its neighbours throws first.
    homeContent,
  ]);
  // Storage origin for the Player-of-the-Month photo (§4a). Absent, the panel
  // falls back to initials, which is the ordinary case rather than a failure.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  return (
    <>
      {/*
        THE SITE'S NAME AND LOGO FOR SEARCH (2026-11-06) — see
        `lib/seo/site.ts`. Every value is a constant, but the payload goes
        through the same `<` escape the game page's JSON-LD uses, so a later
        edit cannot open a `</script>`.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      {/* Pitch, grain and vignette are the shared SiteBackground, mounted once
          from the root layout. This route is what puts it at full strength —
          see components/SiteBackground.tsx. */}

      {/* NAV is the shared `chrome/Header`, rendered once from the root layout. */}

      {/*
        THE HERO (rebrand). A full-bleed venue photograph, slowly drifting, under a navy scrim, with Jachym's copy:
        eyebrow, "Play volleyball. Anytime. Anywhere.", one sentence, one action. A dark island (`theme-dark`), so
        `text-bone` is Cloud White and `text-accent` is lime here. The photo is a volleyball spike at the net
        (owner, 17 Nov 2026: "an action volleyball play", in place of the hall photo that read as a basketball court),
        generated for Playco, so it needs no credit line, and graded into the brand colours (navy shadows, lime ball, cool
        court; `scripts/grade-hero-photo.py`). A background video may replace it later (TODO.md).
      */}
      <section data-testid="home-hero" className="theme-dark relative isolate overflow-hidden">
        <Image
          src="/hero-default.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 animate-hero-drift object-cover motion-reduce:animate-none"
        />
        <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/50 via-ink/65 to-page" />
        <div className="mx-auto flex max-w-shell flex-col items-start gap-4 px-gutter pb-10 pt-[calc(theme(spacing.nav)+40px)] md:pb-16 md:pt-[calc(theme(spacing.nav)+96px)]">
          <p className="m-0 text-eyebrow font-semibold uppercase tracking-eyebrow text-muted">{landing.heroEyebrow}</p>
          <h1 data-testid="hero-headline" className="m-0 font-display text-[clamp(40px,9vw,72px)] font-extrabold leading-[1.02] tracking-tight text-bone">
            {landing.heroLead} <span className="text-accent">{landing.heroSport}</span>
            <br />
            {landing.heroLine2}
          </h1>
          <p className="m-0 max-w-[34ch] text-body-lg text-muted">{landing.heroSub}</p>
          <Link
            href="/games"
            data-testid="hero-cta"
            className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-pill bg-volt px-6 text-body-lg font-bold text-ink no-underline transition-colors hover:bg-volt-dim"
          >
            {landing.heroCta}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
      <div className="relative z-10 mx-auto w-full max-w-shell px-gutter">
        {/*
          HERO — SIZED TO ITS CONTENT (ruling J: at least 25% shorter).

          It was `min-h-[100svh]` with the content centred inside, so the hero
          was a full screen whatever it contained and the three step cards
          could never clear the fold — which is the whole thing ruling J is
          about. Type carried part of the reduction in Stage 0 (`hero` dropped
          from clamp(58,12.5vw,124) to clamp(44,10vw,88)); this is the rest of
          it, and it is the larger half.

          The scroll hint goes with it. It existed to tell a reader there was
          something below a screen-filling hero; once the steps are visible it
          is an arrow pointing at what is already on screen.
        */}
        {/* `pt-24` matches `/games` and the frames: p01 leaves ~40px between
            the header's hairline and the headline's cap line, and `pt-20`
            left 21. */}
        {/*
          `pb-4`, NOT `pb-10` (round 24, item 4). Together with the `pt-nav`
          below it, the distance from the slogan to the first game roughly
          halves — 104px of stacked padding becomes 48.

          IT IS TWO PADDINGS, WHICH IS WHY ONE OF THEM LOOKED FINE. This
          section's bottom and the games block's top were each defensible
          alone; the space between them is their sum, and nothing named it. The
          hero also lost its own CTA in round 23, so `pb-10` was sized for a
          button that is no longer there.
        */}
        <section className="flex flex-col pb-4 pt-8 text-center">
          

          {/*
            HOW IT WORKS — BACK WHERE IT WAS, closing the hero.

            Phase 17 moved this to the top of the second screen on the reading
            of §6 that it belongs "above fold-two content". Reverted on review:
            the strip is part of the hero's rhythm, and lifting it out left the
            first screen ending on a scroll hint with nothing under the fold
            line to explain the product. The equipment line stays attached to
            it, which is the part of §6 that was actually load-bearing —
            "what do I bring" is the second question anyone asks.
          */}
          {/*
            ONE PANEL, THREE DIVIDED ROWS (redesign v2, round 3, p01).

            It was three separate `lifted` cards in a wrapping flex row. The
            frame draws one panel with hairline rules between the steps, and
            the difference is not decoration: three cards are three objects
            that happen to be adjacent, and 01 → 02 → 03 is a SEQUENCE. A
            divided list says so; three boxes say the reader may start
            anywhere.

            It is also what makes the numbers work. In the frame they are
            Anton in volt at the size of a heading — a display numeral, which
            is R5's narrow widening exactly ("large counters, never body-size
            figures"). At 14px bold on a card of its own, `01` read as a
            label.

            AN ORDERED LIST, because it is one. `<ol>` was `<div>`s, and the
            steps are numbered in the copy — a screen reader should not have
            to infer the order from three strings that happen to start with a
            digit. The visible numerals are `aria-hidden`; the list marker is
            suppressed because they are drawn.
          */}
        </section>

        {/*
          BELOW THE HERO — ruling J's order, as amended 2026-08-10:
          upcoming games, active-players banner, community, FAQ, Player of the
          Month, footer.

          NO `min-h-[100svh]` AND NO FLEX SPACERS. This was a second full
          screen with `flex-1` gaps pushing its contents to the vertical
          middle, which is what made the page read as two slides rather than
          as a page. With the hero sized to its content there is nothing left
          to pad against — the sections simply follow one another.
        */}
        {/*
          `pt-8`, NOT `pt-nav` (round 24, item 4). `nav` is 64px and names the
          height of the tab bar — it was borrowed here as a round number, and
          the games do not sit under the nav.
        */}
        <div id="next-match" className="flex flex-col pt-8">
          <section className="pb-3 pt-[10px]">
            <div className="mb-[14px] flex items-baseline justify-between gap-3">
              <h2 className="m-0 font-display text-[22px] font-bold tracking-tight text-bone">
                {landing.nextMatchesLabel}
              </h2>
              <Link
                href="/games"
                data-testid="next-matches-all"
                className="text-small font-semibold text-bone underline underline-offset-4 hover:text-accent"
              >
                {landing.nextMatchesAll}
              </Link>
            </div>

            {/*
              DAY HEADINGS ABOVE THE PILLS, as on the games page (Section 3,
              item 5). The pills no longer carry a date, so home needs the same
              structure or its three cards would say only a time — `18:30` with
              nothing to anchor it to a day.

              `groupByDay` is the games page's own helper, so the two surfaces
              label a day identically and cannot disagree about which evening a
              game belongs to.
            */}
            {games.length > 0 ? (
              <div data-testid="next-matches" className="flex flex-col gap-5">
                {groupByDay(games, ({ game }) => game.starts_at, now, t, locale).map(
                  (day, dayIndex) => (
                    <section key={day.key} data-testid="day-group" data-day={day.key}>
                      {/*
                        ~~An 11px uppercase eyebrow.~~ Round 14 item 4 replaced
                        that on the games page and left this one behind, so the
                        owner reported the same thing twice about two pages.
                        Both read `DayHeading` now — see the component for why
                        the duplication was the actual defect.
                      */}
                      <DayHeading>{day.label}</DayHeading>
                      <div className="flex flex-col gap-3">
                        {day.items.map(({ game, bookedCount, inProgress }, cardIndex) => (
                          <GameCard
                            key={game.id}
                            game={game}
                            bookedCount={bookedCount}
                    live={inProgress}
                            /* The LCP image on this page — see GameCard. */
                            priority={dayIndex === 0 && cardIndex === 0}
                            roster={rosters.get(game.id) ?? []}
                            supabaseUrl={supabaseUrl}
                            pitchName={pitchNames.get(game.id)}
                            venueImagePath={venueImages.get(game.id) ?? null}
                          />
                        ))}
                      </div>
                    </section>
                  ),
                )}
              </div>
            ) : (
              /*
                ZERO UPCOMING GAMES — the §2.9 empty state with the WhatsApp
                action, which ruling J names specifically. It replaced a
                centred grey sentence in a box: "No games on the board right
                now" is a dead end on the first screen a visitor sees, and the
                WhatsApp group is the one thing they can actually do about it.
              */
              <EmptyState
                title={t.games.emptyTitle}
                body={t.games.emptyBody}
                ctaLabel={t.games.emptyCta}
                ctaHref={t.landing.community.whatsappUrl}
              />
            )}

            {/*
              `All games` AS A PRIMARY BUTTON AT THE SECTION'S BOTTOM (ruling
              J), not an eyebrow link in the heading row.

              It was a 10px tracked-caps link sitting to the right of the
              section title — read before the cards rather than after them,
              and styled as a label rather than as the action it is. At the
              bottom it is the natural next step for someone who has just read
              three cards and wants the rest.

              IT RENDERS AT ZERO TOO, and that is deliberate: ruling J says
              the button stays whether the section shows three games, one, or
              none. A visitor who arrives on an empty week should still be
              able to reach the board.
            */}
            {/*
              THE PAGE'S ONE ACTION, IN THE HERO BUTTON'S CLOTHES (round 23,
              item 4). It inherits the removed "Find a game" pill's dimensions
              and treatment exactly — `rounded-pill`, `text-cta`,
              `font-extrabold`, `px-[26px] py-[15px]`, `text-ink` on volt —
              and keeps its own label. A capsule sized to its label is what the
              frame draws for the one thing it wants pressed, and there is now
              only one such thing on this page.

              IT STILL RENDERS AT ZERO, which ruling J requires: a visitor who
              arrives on an empty week must still be able to reach the board.
            */}
            
          </section>

          {/*
            HOW IT WORKS — NOW *UNDER* THE GAMES (round 23, item 4).

            ~~Part of the hero's rhythm, closing the first screen.~~ Reversed
            on the owner's instruction, and the reasoning is about what the
            page is FOR: somebody arriving from a WhatsApp link wants to know
            whether there is a game on Thursday, and the answer was three
            scrolls down behind an explanation of a product they had already
            decided to look at. Open the site, see the games lined up; scroll
            to learn how it works.

            The strip itself is untouched — same panel, same divided rows, same
            Anton numerals. Only its position moved, and nothing else on the
            page reordered.
          */}
          <ol
            data-testid="how-it-works"
            className="lifted m-0 mt-[26px] list-none rounded-card p-0"
          >
            {landing.steps.map((step) => (
              <li
                key={step.index}
                className="flex items-start gap-4 border-b border-hairline px-[18px] py-[15px] text-left last:border-b-0"
              >
                <div
                  aria-hidden
                  className="font-display text-[26px] leading-none text-accent"
                >
                  {step.index}
                </div>
                <div>
                  <div className="text-[18px] font-bold tracking-[.3px]">
                    {step.title}
                  </div>
                  <div className="mt-[3px] text-[13px] leading-[1.45] text-muted">
                    {step.body}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {/*
            ~~The lawyer's item 1.4 note under the three steps~~ — removed by
            the owner on 2026-10-27, with every other "we don't organise the
            games / own risk" line outside the terms: "we have it in the ToS,
            that's enough" (Obchodní podmínky 3.2 and 12).
          */}

          {/*
            COMMUNITY (now carrying the numbers) beside PLAYER OF THE MONTH,
            then the FAQ full width beneath — which is the SWAP of item 10.

            THE FAQ IS THE WIDE ONE. It holds six entries and was competing for
            a third of a row with a panel holding a name and a face; they have
            exchanged places, and the FAQ's six dropdowns sit 3 + 3 in two
            columns above `md`.

            THE STANDALONE STATS BOX IS GONE (item 8) — its two numbers moved
            into the community panel, which is where the invitation they
            support already lived.

            PLAYER OF THE MONTH SURVIVES RULING J by the amendment of
            2026-08-10, and keeps the hours-on-pitch stat that earns it the
            space the original ruling said it had not.
          */}
          <section className="pt-4">
            {/* `items-start`, so a panel is as tall as its own contents. */}
            <div className="flex flex-wrap items-start gap-4">
              {/* PLAYCO, PHASE F: hidden until Playco has its own WhatsApp / Instagram links (TODO.md). */}
              {COMMUNITY_LINKS_READY && (
                <CommunityPanel
                  gamesPerWeek={home.gamesPerWeek}
                  activePlayers={home.activePlayers}
                />
              )}
              <PlayerOfMonthPanel
                player={home.playerOfMonth}
                supabaseUrl={supabaseUrl}
              />
            </div>

            <div className="mt-4">
              <FaqPanel />
            </div>
          </section>

          {/*
            FOOTER — MARK AND CITY ONLY.

            The tagline is gone from here because the HERO owns the slogan
            now: `heroSub` is the product's one slogan, and this printed the
            same sentence in tracked capitals two screens below it.
            One line said twice on one page is not emphasis, it is a page that
            has forgotten it already said it — and the hero is where a first-
            time visitor meets it.

            The links and the copyright are the SHARED `chrome/Footer` beneath
            this one, so "minimal footer: mark, links, ©" is satisfied across
            the two rather than by duplicating them here.
          */}
          <footer className="flex flex-wrap items-center gap-2 border-t border-hairline pb-6 pt-5">
            {/*
              WHITE, NOT GREY (item 11) — the volt accent on `FOTBAL` stays.
              The mark reading `muted` made the brand the quietest thing in
              its own footer.
            */}
            <Logo size={13} />
            <span className="text-small font-semibold tracking-wide text-muted">{landing.footer.city}</span>
          </footer>
        </div>
      </div>
    </>
  );
}
