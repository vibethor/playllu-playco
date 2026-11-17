/**
 * PLAYCO: game passes are on (Jachym, 16 Nov 2026): 5 / 10 / 20 games for 1,150 / 2,200 / 4,000 THB, credits valid
 * 60 days, one credit per spot in any game, guests included. The tiers are rows in `pass_tiers`
 * (migration 20261117120000). Every entry point (the games-page panel, the account page, the booking confirmation,
 * the checkout upsell and the `/pass` page itself) checks this one switch, so passes can be turned off again by
 * setting it to false.
 */
export const PASSES_ENABLED = true;
