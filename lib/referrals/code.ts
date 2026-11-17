/**
 * Referral codes (Jachym, 17 Nov 2026): six random characters from an alphabet without 0/O and 1/I/L, so a code
 * read aloud or copied by hand cannot be mistaken. The database owns the codes (players.referral_code, migration
 * 20261117140000); this only cleans up what someone typed into the sign-up form.
 */
export const REFERRAL_CODE_LENGTH = 6;
export const REFERRAL_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const SHAPE = new RegExp(`^[${REFERRAL_ALPHABET}]{${REFERRAL_CODE_LENGTH}}$`);

export type ReferralCodeInput = { ok: true; code: string | null } | { ok: false };

/** Empty is "no code"; otherwise uppercase, without spaces or dashes, and the right shape or refused. */
export function normaliseReferralCode(raw: string | null | undefined): ReferralCodeInput {
  const cleaned = (raw ?? "").replace(/[\s-]/g, "").toUpperCase();
  if (cleaned === "") return { ok: true, code: null };
  return SHAPE.test(cleaned) ? { ok: true, code: cleaned } : { ok: false };
}
