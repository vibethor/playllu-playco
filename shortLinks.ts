/**
 * SHORT LINKS FOR MARKETING CHANNELS (Jachym, 20 Nov 2026).
 *
 * `playco.live/reclub` reads better in a Reclub listing, an Instagram bio or a WhatsApp group description than a
 * 120-character address full of `utm_` tags. Each short path redirects to the games list WITH the tags, so GA4 and
 * HQ still attribute the visit to its channel (HQ → Settings → Tracked links lists the same links).
 *
 * TEMPORARY REDIRECTS (307), deliberately. A permanent one is cached by phones for good, so the day a channel should
 * land somewhere else, people who tapped it before would keep going to the old place.
 *
 * Kept at the repo root, beside `next.config.ts`, rather than in `lib/`: this is marketing configuration read only at
 * build time, and the campaign name follows the HQ UTM convention (`<city>_<sport>_<purpose>`), which names a city.
 * Adding a channel is one entry here plus its row in HQ.
 */

type Utm = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
};

type ShortLink = {
  /** The short path people see, e.g. `/reclub`. Must not be a page of the app (a test checks). */
  path: string;
  /** Where it lands, before the tags are added. */
  landing: string;
  utm: Utm;
};

const GAMES_LIST = "/games";
const BANGKOK_VOLLEYBALL_LAUNCH = "bkk_volleyball_launch";

export const SHORT_LINKS: readonly ShortLink[] = [
  {
    path: "/reclub",
    landing: GAMES_LIST,
    utm: { source: "reclub", medium: "referral", campaign: BANGKOK_VOLLEYBALL_LAUNCH, content: "listing" },
  },
  {
    path: "/ig",
    landing: GAMES_LIST,
    utm: { source: "instagram", medium: "social", campaign: BANGKOK_VOLLEYBALL_LAUNCH, content: "bio" },
  },
  {
    path: "/wa",
    landing: GAMES_LIST,
    utm: { source: "whatsapp", medium: "messaging", campaign: BANGKOK_VOLLEYBALL_LAUNCH, content: "group_desc" },
  },
];

function taggedDestination({ landing, utm }: ShortLink): string {
  const tags = new URLSearchParams({
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign,
    utm_content: utm.content,
  });
  return `${landing}?${tags.toString()}`;
}

/** The entries `next.config.ts` adds to `redirects()`. */
export function shortLinkRedirects() {
  return SHORT_LINKS.map((link) => ({
    source: link.path,
    destination: taggedDestination(link),
    permanent: false,
  }));
}
