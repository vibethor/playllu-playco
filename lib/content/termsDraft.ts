import { LEGAL_JURISDICTION, SITE_NAME } from "@/lib/city/default";
import type { LegalDraft } from "@/lib/content/legalDraft";
import {
  LEGAL_EFFECTIVE_DATE,
  MINIMUM_ACCOUNT_AGE,
  OPERATOR_CONTACT,
  OPERATOR_NAME,
  TERMS_RULES_ANCHOR,
  TERMS_VERSION,
} from "@/lib/legal";
import { policy } from "@/lib/policy";

/**
 * PLAYCO'S TERMS AND CONDITIONS, IN ENGLISH (Jachym, 18 Nov 2026: "write the terms and conditions ... in English and
 * customize it to Playco, but use the similar logic as the ones in Czech ... I will have it reviewed by a lawyer later").
 *
 * NOT REVIEWED BY A LAWYER. The structure follows HrajFotbal's Czech terms 2.0 (`content/legal/original/`); the rules
 * are Playco's as the code enforces them (CLAUDE.md §3): pay per game or with a pass, cancel any time, refund to the
 * wallet up to the cutoff, wallet credit that never expires, pass credits that do, an organiser at the game.
 *
 * THE NUMBERS ARE NOT TYPED IN. The refund cutoff is the one `cancel_booking` enforces, read from the database by the
 * page and passed in; validity and extension come from `lib/policy.ts`, which the database mirrors. Tests hold them.
 */

/** Days within which published photos of a player who opts out are taken down (terms 11). */
export const PHOTO_REMOVAL_DAYS = 30;
/** Days a player has to object to an action against their account (terms 13). */
export const OBJECTION_DAYS = 30;
/** Days within which a complaint is answered (terms 14). */
export const COMPLAINT_REPLY_DAYS = 30;
/** Days of notice before changed terms take effect (terms 16). */
export const TERMS_CHANGE_NOTICE_DAYS = 14;

export interface TermsFacts {
  /** `cancellation_refund_cutoff_hours()`, via `lib/policy/refundCutoff.ts`. */
  refundCutoffHours: number;
}

export function termsDraft({ refundCutoffHours }: TermsFacts): LegalDraft {
  const site = SITE_NAME;
  const law = LEGAL_JURISDICTION;
  const support = OPERATOR_CONTACT.email;
  const passDays = policy.credits.validityDays;
  const extensionDays = policy.credits.cancelledGameExtensionDays;
  const cutoff = `at least ${refundCutoffHours} hours before the start`;

  return {
    meta: `Effective from ${LEGAL_EFFECTIVE_DATE}, version ${TERMS_VERSION}`,
    sections: [
      {
        id: "about",
        heading: "1. About these terms",
        paragraphs: [
          `${site} is operated by ${OPERATOR_NAME}, trading as ${site} in ${law.country} (“${site}”, “we”, “us”). ${site} is part of Playllu, a group that runs pickup games in several cities.`,
          `These terms apply between ${site} and everyone who uses the ${site} website (the “Site”), creates an account, books a spot in a game or buys a game pass (“you”).`,
          `You accept these terms when you create an account, and again each time you book or pay. The version in force at that moment applies to that booking or purchase.`,
          `You can reach us at ${support}. We answer in English and Thai.`,
        ],
      },
      {
        id: "definitions",
        heading: "2. Words we use",
        paragraphs: [],
        items: [
          "Game: a recreational pickup game of a team sport, at a set time and venue, published on the Site.",
          "Venue: the court or field where a game is played, with its changing rooms and facilities, run by a third party (the venue operator).",
          "Organiser: the person who runs a game for us on the day. A city manager looks after the games in one city.",
          "Spot: one place in one game. A booking is one or more spots in one game, paid in full.",
          "Wallet credit: money held on your account, for example from a cancelled booking, that you can spend on games.",
          "Game pass: a pack of pass credits bought at a discount. One pass credit pays for one spot.",
        ],
      },
      {
        id: "service",
        heading: `3. What ${site} does`,
        paragraphs: [
          `${site} publishes games, takes bookings and payments, keeps your account, wallet and waitlists, rents the court from the venue for each game, makes sure basic game equipment is there, and tells you about changes and cancellations.`,
          `An organiser is usually at the game to welcome players, split the teams and keep time. The organiser is not a referee, coach, lifeguard or medical professional, and does not supervise players. ${site} does not provide first aid or medical services, does not look after your belongings, and does not insure you.`,
          `Players are responsible for how the game is played and for how they treat each other. The community and game rules in the annex to these terms apply to every game.`,
          `The venue is run by its operator. You must follow the venue's rules and its staff's instructions.`,
        ],
      },
      {
        id: "account",
        heading: "4. Your account",
        paragraphs: [
          `You must be at least ${MINIMUM_ACCOUNT_AGE} years old to create an account. If you are under ${law.ageOfMajority}, the age of majority in ${law.country}, you confirm that your parent or guardian agrees to these terms and to your bookings.`,
          "Give true and complete details and keep them up to date. One account per person; an account cannot be transferred. Keep your password safe: you are responsible for what is done with your account. Tell us straight away if you think someone else is using it.",
          "Your nickname, profile photo, level and game statistics are shown to other players, for example in the line-up of a game you book. The level is your own estimate: it is shown, not checked or enforced.",
          "Each account has a referral code you can share with friends. A code entered at sign-up is recorded; it does not earn a reward unless we announce one.",
          "Using an account is free. You can close it at any time in your account settings or by email. Closing it cancels your future bookings, and any wallet credit and pass credits left on it lapse. The Site warns you before you confirm.",
        ],
      },
      {
        id: "booking",
        heading: "5. Booking and paying",
        paragraphs: [
          "To book, choose a game on the Site and pay for your spot. You can pay by card or PromptPay through our payment provider, Stripe, with wallet credit, or with pass credits. We never see your full card details.",
          "A spot exists only once it is paid. The booking is confirmed when the Site shows it as confirmed; we also send you an email. There is no paying in cash at the game.",
          "You may book extra spots for guests where the Site allows it. You are the party to that booking, and you make sure your guests know these terms and the rules.",
          "Each game has a limited number of spots. When a game is full you can join its waitlist. If a spot opens, we tell everyone on the waitlist and the first person to book it gets it.",
          "The price shown just before you pay is final and includes any taxes that apply. Prices can change, but a change never affects a spot you have already paid for. Prices are not personalised by automated decision-making.",
          "A booking is for a leisure service on a specific date and time, so once confirmed it cannot be withdrawn from. Cancelling works as described in section 7.",
        ],
      },
      {
        id: "credits",
        heading: "6. Game passes and wallet credit",
        paragraphs: [
          `A game pass is added to your account as pass credits as soon as you pay. One pass credit pays for one spot in any game, guests included. Pass credits are valid for ${passDays} days from the day you buy the pass; the expiry date is shown in your account. Unused pass credits expire after that date without refund.`,
          "Wallet credit comes from refunds, for example when you cancel in time or we cancel a game. It does not expire while your account is open.",
          "Pass credits and wallet credit can only be spent on games on the Site. They are not money, cannot be transferred to another person and cannot be exchanged for cash, except for a refund under section 7.",
          "We may add free credit, for example as a goodwill gesture. Free credit is valid for the period we tell you when we add it.",
        ],
      },
      {
        id: "cancelling",
        heading: "7. Cancelling a booking",
        paragraphs: [
          `You can cancel a booking on the Site at any time before the game starts. If you cancel ${cutoff}, you get a full refund to your account: what you paid by card or PromptPay becomes wallet credit, and pass credits go back to your pass with their original expiry date.`,
          "If you cancel later, or you do not show up, you get no refund, unless we decide otherwise because of exceptional circumstances. Arriving late or leaving early does not give a right to a refund.",
          `If you would rather have wallet credit that came from a card or PromptPay payment paid back to you, email ${support}. The game's organiser or the city manager reviews the request, and an approved refund goes back to the original payment method.`,
        ],
      },
      {
        id: "changes-to-games",
        heading: "8. When we change or cancel a game",
        paragraphs: [
          "We may cancel a game, in particular if too few players have booked, if weather or the condition of the court makes play impossible or unsafe, if the venue cancels or cannot provide the court, or for another serious reason.",
          "We tell everyone who booked by email and on the Site. A game goes ahead unless the Site shows it as cancelled.",
          `When we cancel a game you get a full refund to your account: card and PromptPay payments as wallet credit, and pass credits back to your pass with their validity extended by ${extensionDays} days. If you would rather have your money back, email ${support} and we will refund what you paid by card or PromptPay to the original payment method.`,
          "If we change a game's time or venue, we tell you as soon as we can. If the change does not suit you, you can cancel up to the start with the same full refund as a game we cancel.",
        ],
      },
      {
        id: "safety",
        heading: "9. Playing safely and responsibility",
        paragraphs: ["When you play, you must:"],
        items: [
          "arrive on time and follow the community and game rules, the venue's rules and the organiser's instructions;",
          "only play if you are fit and healthy enough for a physically demanding team sport;",
          "wear suitable shoes and clothing for the surface and use any protective gear you need;",
          "not play under the influence of alcohol or drugs;",
          "treat the equipment and the venue with care.",
        ],
      },
      {
        id: "risk",
        heading: "10. Risk and liability",
        paragraphs: [
          "Team sports carry a risk of injury, sometimes serious, and of damage to or loss of belongings. You take part voluntarily and at your own risk. We recommend personal accident and liability insurance.",
          "Each player is responsible for harm they cause to other players, other people, the venue or us. A player who damages equipment or the venue on purpose or through gross negligence pays for the damage; a ball lost in normal play is not damage. The venue operator is responsible for the condition and running of the venue.",
          `In an emergency call ${law.emergencyNumber}. Please also tell the organiser, and you can report an injury or incident to us at ${support}.`,
          "To the extent the law allows, we are not liable for injury or other harm suffered during or in connection with a game, for other players' conduct, for the condition of the venue, or for belongings lost, stolen or damaged at the venue.",
          "Nothing in these terms excludes or limits liability that cannot be excluded or limited by law, including liability for death or personal injury caused by our negligence, or for fraud.",
        ],
      },
      {
        id: "photos",
        heading: "11. Photos and videos",
        paragraphs: [
          `Games may be photographed and filmed. By accepting these terms you allow ${site} to take photos and videos of you at games and to use them, free of charge, on the Site, on our social media and in our marketing.`,
          `If you do not want to appear, email ${OPERATOR_CONTACT.privacyEmail}. We will not publish new photos or videos in which you are the main subject, and we will remove those already published on channels we manage within ${PHOTO_REMOVAL_DAYS} days. We cannot remove copies others have already shared.`,
          "Players who film or photograph a game do so on their own responsibility and must respect other players' privacy.",
        ],
      },
      {
        id: "conduct",
        heading: "12. Behaviour, suspension and closing accounts",
        paragraphs: [
          "You must not post anything on the Site that is unlawful, offensive, discriminatory or that infringes someone else's rights.",
          `Anyone can report content or behaviour they think breaks the law, these terms or the rules to ${support}. Please include what happened, where (for example a link to a profile), and your name and email. We confirm we have received it, look into it fairly, and tell you what we decided. Decisions are always made by a person.`,
          "We may remove content, warn you, stop you booking for a time, suspend your account or close it if you:",
        ],
        items: [
          "break these terms or the rules, in particular through violence, harassment, discrimination, insults, threats, cheating or deliberately dangerous play, or by turning up under the influence of alcohol or drugs;",
          "repeatedly do not show up without cancelling in time;",
          "misuse your account, a payment method or credit, or give false details.",
        ],
      },
      {
        id: "conduct-decisions",
        heading: "13. If we take action against your account",
        paragraphs: [
          `We tell you what we did and why, how long it lasts, and how to object. You can object within ${OBJECTION_DAYS} days by email to ${support}.`,
          "If we close your account under section 12, your future bookings are cancelled and any credit left on it lapses. Past games and payments stay in our records.",
        ],
      },
      {
        id: "complaints",
        heading: "14. Complaints",
        paragraphs: [
          `If something was not as it should have been, email ${support} with what went wrong, the game or order it concerns and what you would like us to do. We confirm we have received your complaint and answer within ${COMPLAINT_REPLY_DAYS} days.`,
          `If we cannot resolve it, you can contact ${law.consumerAuthority}.`,
        ],
      },
      {
        id: "privacy",
        heading: "15. Your personal data",
        paragraphs: [
          "How we handle your personal data is explained in our privacy policy and cookie policy, both published on the Site.",
        ],
      },
      {
        id: "changes",
        heading: "16. Changes to these terms",
        paragraphs: [
          `We may change these terms, for example because the law changes, we add or change features, or for security reasons. We tell you by email and on the Site at least ${TERMS_CHANGE_NOTICE_DAYS} days before a change takes effect.`,
          "If you do not agree, you can close your account before the change takes effect. A change never affects spots, passes or credit you already have.",
        ],
      },
      {
        id: "final",
        heading: "17. Final provisions",
        paragraphs: [
          `These terms and every booking and purchase are governed by ${law.governingLaw}, and disputes go to ${law.courts}. This does not take away any protection that consumer law gives you and that cannot be waived.`,
          "We send notices to the email address on your account or through the Site.",
          "If any part of these terms is found invalid, the rest still applies.",
          "The community and game rules below are part of these terms.",
        ],
      },
      {
        id: TERMS_RULES_ANCHOR,
        heading: "Annex: Community and game rules",
        paragraphs: [
          "Fair play. Play for fun. Respect every player whatever their level, gender, background or anything else. Violence, harassment, discrimination, insults, threats, cheating and deliberately dangerous play are not allowed. We play by the commonly known rules of the sport; settle disputes calmly together.",
          `Safety. Do not play under the influence of alcohol or drugs, or if your health does not allow it. Wear shoes suited to the surface and take off jewellery and watches. If someone is hurt, stop the game and help. In an emergency call ${law.emergencyNumber}.`,
          "Reliability. If you cannot come, cancel in time so someone on the waitlist can play. Arrive on time so the game can start and finish when the court is booked.",
          "Venue and equipment. Follow the venue's rules and its staff's instructions. Treat the balls and equipment with care and put them back after the game.",
          `Reporting. You can report bad behaviour to the organiser or to ${support}. Breaking these rules can lead to the measures in section 12.`,
        ],
      },
    ],
  };
}
