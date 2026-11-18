import { LEGAL_JURISDICTION, SITE_NAME } from "@/lib/city/default";
import type { LegalDraft, LegalSection } from "@/lib/content/legalDraft";
import {
  LEGAL_EFFECTIVE_DATE,
  MINIMUM_ACCOUNT_AGE,
  OPERATOR_CONTACT,
  PRIVACY_VERSION,
} from "@/lib/legal";

/**
 * PLAYCO'S PRIVACY POLICY, IN ENGLISH (Jachym, 18 Nov 2026), on the logic of HrajFotbal's Czech policy 2.0 and under
 * Thailand's PDPA. NOT REVIEWED BY A LAWYER.
 *
 * WHO SEES WHAT IS THE CODE'S, NOT A GUESS (CLAUDE.md §1): organisers reach only their games; a city manager sees the
 * phone numbers of players who booked in their city while they hold the role; email never leaves platform admin;
 * Playllu HQ reads bookings and payments without email, phone or auth ids. Google Analytics and Meta appear only
 * while a GTM container is configured — the same switch that shows the cookie banner (`gtmEnabled()`).
 */

/** Days within which a data request is answered (PDPA section 30 sets 30 days for access). */
export const DATA_REQUEST_REPLY_DAYS = 30;
/** Years accounting and tax records are kept. */
export const ACCOUNTING_RETENTION_YEARS = 5;
/** Years account and payment records are kept after an account is closed, to answer claims. */
export const CLAIMS_RETENTION_YEARS = 5;
/** Years records of reported incidents and measures are kept. */
export const INCIDENT_RETENTION_YEARS = 2;
/** Months sign-in and security logs are kept. */
export const SECURITY_LOG_RETENTION_MONTHS = 6;

export interface PrivacyFacts {
  /** Whether analytics and marketing cookies run (`gtmEnabled()`). */
  analytics: boolean;
}

export function privacyDraft({ analytics }: PrivacyFacts): LegalDraft {
  const site = SITE_NAME;
  const law = LEGAL_JURISDICTION;
  const privacy = OPERATOR_CONTACT.privacyEmail;

  const measurement: LegalSection[] = analytics
    ? [
        {
          id: "measurement",
          heading: "Analytics and advertising measurement",
          paragraphs: [
            "Only if you accept analytics cookies, we use Google Analytics (Google) to count visits and see how the Site is used.",
            "Only if you accept marketing cookies, we use the Meta Pixel (Meta Platforms) to measure whether our ads lead to sign-ups and bookings. Our server then also tells Meta when you sign up or pay, with a one-way scrambled version of your account number, the page address, your IP address and browser details — never your name, email or phone number.",
            "You can change your choice at any time with “Cookie settings” at the bottom of every page. Details are in our cookie policy.",
          ],
        },
      ]
    : [];

  const providers = [
    "Supabase: our database and sign-in;",
    "Vercel: hosting of the Site, and visit counts without cookies;",
    "Stripe: card and PromptPay payments (Stripe also acts as an independent controller, for example to prevent fraud, under its own privacy policy);",
    "Resend: sending our emails;",
    "Google: “Sign in with Google”, if you choose it;",
    ...(analytics
      ? [
          "Google Analytics and Meta: measurement, only with your consent (see above).",
        ]
      : []),
  ];

  const sections: LegalSection[] = [
    {
      id: "who",
      heading: "Who we are",
      paragraphs: [
        `${site} (“${site}”, “we”) is the data controller for the personal data described here. We run pickup team-sports games in ${law.country}, as part of Playllu, a group that runs pickup games in several cities.`,
        `For anything about your personal data, email ${privacy}. For everything else, ${OPERATOR_CONTACT.email}.`,
        `We follow ${law.dataProtectionLaw}. Words such as “game”, “spot” and “organiser” mean what they mean in our terms and conditions.`,
      ],
    },
    {
      id: "what",
      heading: "What we collect",
      paragraphs: [
        "Most of it comes from you. Some is created as you use the Site.",
      ],
      items: [
        "Account details: email address, nickname, phone number, country, the level you choose, and your password (stored only in scrambled form). If you sign in with Google, we receive your name, email address and profile photo from Google.",
        "Profile: profile photo, level, and statistics that update after each game (games played, hours on court, how many players you have played with).",
        "Bookings and credit: your bookings, cancellations, no-shows, waitlists, wallet credit, game passes and their expiry, and the referral code you entered or shared.",
        "Payments: what you bought, when and how much. Card details are handled by Stripe; we never see your full card number.",
        "Messages: emails, complaints and reports you send us, and our replies.",
        "Incidents: reports of rule-breaking and the measures taken. If you tell us about an injury, a short description and only the health details needed.",
        "Photos and videos taken at games.",
        "Technical data: IP address, device and browser details, sign-in and security records, and cookies as described in our cookie policy.",
        "Guests: the name or nickname a player gives us for a guest they book for.",
      ],
    },
    {
      id: "why",
      heading: "Why we use it and on what basis",
      paragraphs: [],
      items: [
        "To run your account, take bookings and payments, keep your wallet and passes, manage waitlists and send service emails (confirmations, reminders, changes and cancellations) — because it is necessary to perform our contract with you.",
        "To show your nickname, photo, level and statistics to other players — as part of the service you signed up for.",
        "To keep accounting and tax records — because the law requires it.",
        "To keep the community safe, look into reports, act on rule-breaking and prevent misuse of accounts, credit and payments — for our legitimate interest in a safe, working service.",
        "To defend or pursue legal claims, including records of reported injuries — for our legitimate interest, and for health details because it is necessary for legal claims.",
        `To take and publish photos and videos of games to promote ${site} — for our legitimate interest, as described in the terms; you can opt out at any time.`,
        "To send news and offers by email — only with your consent, which you can withdraw at any time with the link in every email or in your account.",
        "To improve the Site and measure our advertising — only with your consent to analytics or marketing cookies.",
      ],
    },
    {
      id: "required",
      heading: "What you have to give us",
      paragraphs: [
        "The details asked for at sign-up are needed to provide the service; without them we cannot create your account or take bookings. A profile photo and marketing emails are your choice.",
        "We do not ask for health information. If you report an injury, please only tell us what is needed.",
        "We do not make decisions about you by automated means that have legal or similarly significant effects. Your level is your own choice.",
      ],
    },
    {
      id: "sharing",
      heading: "Who sees your data",
      paragraphs: ["We share personal data only as far as needed:"],
      items: [
        "Other players see your nickname, profile photo, level and statistics, for example in game line-ups.",
        "The organiser of a game you book sees the line-up of that game.",
        `The city manager of the city where you booked a game sees your phone number while they hold that role, so they can contact you about games. Your email address is seen only by ${site}'s platform administrators.`,
        "Playllu's founders see booking and payment figures for running the business, without your email address or phone number.",
        "The venue operator, only when needed to let you in or to look into an incident.",
        "Our service providers, under contract, only to provide their service to us:",
        ...providers,
        "Authorities, lawyers and insurers, when the law requires it or it is needed for a legal claim.",
        "Photos and videos we publish on social media are also processed by those networks (for example Meta for Instagram and Facebook) under their own policies. If you join our WhatsApp community, other members can see your phone number, and WhatsApp processes your data under its own policy; joining is optional.",
      ],
    },
    ...measurement,
    {
      id: "abroad",
      heading: "Data stored outside the country",
      paragraphs: [
        `Our database is hosted in ${law.databaseRegion}. Some of our providers also process data in the United States, Japan, the European Union and other countries. We only use providers that protect personal data to a standard the PDPA accepts, or under contractual safeguards. Ask us at ${privacy} for details.`,
      ],
    },
    {
      id: "retention",
      heading: "How long we keep it",
      paragraphs: [],
      items: [
        "Account, profile, bookings and credit: while your account is open.",
        `Payment and account records: for ${CLAIMS_RETENTION_YEARS} years after your account is closed, to answer claims; longer if a dispute is ongoing.`,
        `Accounting and tax records: ${ACCOUNTING_RETENTION_YEARS} years, or longer if the law requires.`,
        `Reports and measures: while a measure lasts and ${INCIDENT_RETENTION_YEARS} years after; sign-in and security records: ${SECURITY_LOG_RETENTION_MONTHS} months.`,
        "Marketing emails: until you unsubscribe or withdraw consent.",
        `Photos and videos: while we use them to promote ${site}, or until you opt out.`,
        "When you delete your account, your name, email, phone and photos are removed; past games and payments stay in anonymised form.",
      ],
    },
    {
      id: "rights",
      heading: "Your rights",
      paragraphs: ["Under the PDPA you have the right to:"],
      items: [
        "access your personal data and get a copy;",
        "have inaccurate data corrected;",
        "have your data deleted, anonymised or its use restricted when we no longer need it or use it unlawfully;",
        "receive data you gave us in a commonly used format and have it sent to someone else;",
        "object to our use of your data based on legitimate interest, including photos, videos and direct marketing;",
        "withdraw your consent at any time, without affecting what we did before;",
        `complain to ${law.dataProtectionAuthority}.`,
      ],
    },
    {
      id: "requests",
      heading: "How we handle requests",
      paragraphs: [
        `Email ${privacy}. We answer within ${DATA_REQUEST_REPLY_DAYS} days and may first check that the request comes from you.`,
      ],
    },
    {
      id: "age",
      heading: "Age",
      paragraphs: [
        `Accounts are for people aged ${MINIMUM_ACCOUNT_AGE} or over. If we find that a younger person has opened an account, we close it and delete their data unless the law or a legal claim requires us to keep it.`,
      ],
    },
    {
      id: "security",
      heading: "Security",
      paragraphs: [
        "We protect your data with reasonable technical and organisational measures, including encrypted connections, access controls by role, backups and confidentiality obligations. Only people who need your data for their work can see it.",
      ],
    },
    {
      id: "changes",
      heading: "Changes",
      paragraphs: [
        "We may update this policy. We tell you about important changes by email or on the Site. The current version is always published on the Site.",
      ],
    },
  ];

  return {
    meta: `Effective from ${LEGAL_EFFECTIVE_DATE}, version ${PRIVACY_VERSION}`,
    // Numbered here, because the measurement section exists only while analytics runs.
    sections: sections.map((section, index) => ({
      ...section,
      heading: `${index + 1}. ${section.heading}`,
    })),
  };
}
