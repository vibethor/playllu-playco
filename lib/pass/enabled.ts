/**
 * PLAYCO, PHASE F: passes (credit packs) are not sold at launch (CLAUDE.md §3). Every entry point — the bottom tab,
 * the games-page panel, the upsells and the `/pass` page itself — checks this one switch. The tables, RPCs and tests
 * stay, so passes can come back by flipping it (and setting Bangkok pass tiers).
 */
export const PASSES_ENABLED = false;
