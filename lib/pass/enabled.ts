/**
 * PLAYCO: game passes are on (Jachym, 16 Nov 2026). Since 19 Nov 2026: 5 / 8 / 12 / 20 games for 1,400 / 2,080 /
 * 2,880 / 4,400 THB, valid 30 / 45 / 60 / 90 days, one credit per spot in any game, guests included. The tiers are rows
 * in `pass_tiers` (migration 20261119100000). Every entry point (the games-page panel, the account page, the booking confirmation,
 * the checkout upsell and the `/pass` page itself) checks this one switch, so passes can be turned off again by
 * setting it to false.
 */
export const PASSES_ENABLED = true;
