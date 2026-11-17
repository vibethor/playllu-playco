import { CONSENT_COOKIE } from "@/lib/consent";
import { LOCALE_COOKIE } from "@/lib/i18n/locales";
import { OPERATOR_CONTACT } from "@/lib/legal";
import { PENDING_PURCHASE_COOKIE } from "@/lib/payments/pendingPurchase";
import { SITE_NAME } from "@/lib/city/default";

/**
 * PLAYCO'S COOKIE POLICY, AN ENGLISH DRAFT (Jachym, 17 Nov 2026: "generate a cookie text in English for now, and
 * just put it on the website. I will have my lawyer review it later, but so there is a draft at least").
 *
 * NOT LEGAL ADVICE AND NOT REVIEWED. Written plainly from what the code actually sets, so the lawyer reviews facts
 * rather than guesses. The page says it is a draft. Terms and privacy keep their review notice (`LegalPage`).
 *
 * THE TABLE FOLLOWS THE CODE. The first-party names are the constants the code uses, so a renamed cookie fails the
 * test instead of leaving the policy wrong. Analytics and marketing rows appear only while a GTM container is
 * configured — the same switch that shows the consent banner (`gtmEnabled()`).
 */

export const COOKIE_POLICY_DRAFT_DATE = "17 November 2026";

export interface CookieRow {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
}

export interface CookieCategory {
  id: "necessary" | "analytics" | "marketing";
  title: string;
  basis: string;
  cookies: readonly CookieRow[];
}

export interface PolicySection {
  id: string;
  heading: string;
  paragraphs: readonly string[];
}

export interface CookiePolicyDraft {
  status: string;
  intro: readonly PolicySection[];
  categories: readonly CookieCategory[];
  outro: readonly PolicySection[];
}

const NECESSARY: CookieCategory = {
  id: "necessary",
  title: "Necessary cookies",
  basis: "Always on. The site cannot work without them, so they do not need your consent.",
  cookies: [
    {
      name: "sb-…-auth-token",
      provider: `${SITE_NAME} (Supabase)`,
      purpose: "Keeps you signed in and protects your account.",
      duration: "Until you sign out, at most 400 days",
    },
    {
      name: LOCALE_COOKIE,
      provider: SITE_NAME,
      purpose: "Remembers the language you chose.",
      duration: "1 year",
    },
    {
      name: CONSENT_COOKIE,
      provider: SITE_NAME,
      purpose: "Remembers your cookie choice, so we do not ask again on every page.",
      duration: "1 year",
    },
    {
      name: PENDING_PURCHASE_COOKIE,
      provider: SITE_NAME,
      purpose: "Remembers what you are paying for while you complete the payment.",
      duration: "2 hours",
    },
    {
      name: "__stripe_mid",
      provider: "Stripe",
      purpose: "Set by our payment provider during checkout to prevent fraud.",
      duration: "1 year",
    },
    {
      name: "__stripe_sid",
      provider: "Stripe",
      purpose: "Set by our payment provider for the current payment session.",
      duration: "30 minutes",
    },
  ],
};

const ANALYTICS: CookieCategory = {
  id: "analytics",
  title: "Analytics cookies",
  basis: "Only with your consent. Off until you turn them on.",
  cookies: [
    {
      name: "_ga",
      provider: "Google Analytics (Google)",
      purpose:
        "Tells visits apart, so we can count visitors and see how the site is used — which pages are opened, where visitors come from and whether a booking was completed.",
      duration: "2 years",
    },
    {
      name: "_ga_…",
      provider: "Google Analytics (Google)",
      purpose: "Keeps track of the current visit for the same purpose.",
      duration: "2 years",
    },
  ],
};

const MARKETING: CookieCategory = {
  id: "marketing",
  title: "Marketing cookies",
  basis: "Only with your consent. Off until you turn them on.",
  cookies: [
    {
      name: "_fbp",
      provider: "Meta Pixel (Meta Platforms)",
      purpose: "Measures whether our ads on Facebook and Instagram lead to sign-ups and bookings, and helps us show them to the right people.",
      duration: "90 days",
    },
    {
      name: "_fbc",
      provider: "Meta Pixel (Meta Platforms)",
      purpose: "Remembers that you arrived from one of our ads, for the same measurement.",
      duration: "90 days",
    },
  ],
};

export function cookiePolicyDraft({ analytics }: { analytics: boolean }): CookiePolicyDraft {
  const optional = analytics ? [ANALYTICS, MARKETING] : [];
  return {
    status: `Draft of ${COOKIE_POLICY_DRAFT_DATE}, awaiting legal review. It describes the cookies this site uses today; the reviewed version may change its wording.`,
    intro: [
      {
        id: "what",
        heading: "What cookies are",
        paragraphs: [
          "Cookies are small text files a website stores in your browser. Some are needed for the site to work; others help us understand how it is used or measure our advertising.",
        ],
      },
      {
        id: "who",
        heading: "Who we are",
        paragraphs: [
          `${SITE_NAME} is run by Playllu. Questions about this policy or your personal data: ${OPERATOR_CONTACT.privacyEmail}. Anything else: ${OPERATOR_CONTACT.email}.`,
        ],
      },
    ],
    categories: [NECESSARY, ...optional],
    outro: [
      {
        id: "choices",
        heading: "Your choices",
        paragraphs: analytics
          ? [
              "When you first visit, we ask whether you accept analytics and marketing cookies. You can accept all, reject all, or choose in Settings; rejecting has no effect on booking or paying.",
              "You can change your choice at any time with “Cookie settings” at the bottom of every page. You can also delete cookies in your browser’s settings.",
            ]
          : [
              "We currently use only the necessary cookies above, so there is nothing to choose. You can delete cookies in your browser’s settings at any time; you will then be signed out.",
            ],
      },
      ...(analytics
        ? [
            {
              id: "server",
              heading: "Measurement from our server",
              paragraphs: [
                "If you accept marketing cookies, our server also tells Meta when you sign up or pay, so the same event is not lost when a browser blocks the Pixel. We send a one-way scrambled version of your account number, the page address, your browser’s IP address and user agent, and the Pixel cookies above — never your name, email or phone number.",
              ],
            },
          ]
        : []),
      {
        id: "anonymous",
        heading: "Visit counts without cookies",
        paragraphs: [
          "Our hosting provider, Vercel, counts page views without cookies and without identifying you.",
        ],
      },
      {
        id: "changes",
        heading: "Changes",
        paragraphs: [
          "If we start using a new kind of cookie, we will update this page and ask for your consent again where it is needed.",
        ],
      },
    ],
  };
}
