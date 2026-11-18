/**
 * Why a checkout payment became credit, from `checkout_sessions.attention_reason` as `settle_checkout_session` writes
 * it. Only one other reason exists today: the player already held a spot (the PromptPay double payment, 18 Nov 2026).
 * An unrecorded reason keeps the long-standing "the game filled" receipt.
 */
const ALREADY_HELD_MARKER = "already holding a spot";

export function creditedBecauseGameFilled(attentionReason: string | null): boolean {
  return !(attentionReason ?? "").includes(ALREADY_HELD_MARKER);
}
