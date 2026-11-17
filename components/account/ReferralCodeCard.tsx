"use client";

import { useEffect, useState } from "react";
import { useStrings } from "@/components/LocaleProvider";

/** How long "Copied" stays on the button before it reads "Copy" again. */
const COPIED_FEEDBACK_MS = 2000;

type Copied = "code" | "link" | "failed" | null;

/**
 * YOUR REFERRAL CODE (owner, 17 Nov 2026): "displayed in your profile, you can copy to clipboard with one click".
 * The code is the player's `players.referral_code`; the invite link is `/signup?ref=CODE`, which pre-fills the
 * optional box on the sign-up form. No reward yet (TODO.md).
 */
export function ReferralCodeCard({
  code,
  inviteUrl,
}: {
  code: string;
  inviteUrl: string;
}) {
  const t = useStrings();
  const [copied, setCopied] = useState<Copied>(null);

  useEffect(() => {
    if (copied === null) return;
    const timer = window.setTimeout(() => setCopied(null), COPIED_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy(text: string, what: "code" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      // No clipboard permission (or an old browser): say so, and the code is selectable to copy by hand.
      setCopied("failed");
    }
  }

  const button =
    "inline-flex min-h-11 items-center justify-center rounded-pill px-5 text-[14px] font-semibold transition-colors";

  return (
    <section
      data-testid="referral-card"
      className="rounded-card bg-surface p-5 shadow-card"
    >
      <h2 className="m-0 text-[13px] font-semibold uppercase tracking-[2px] text-muted">
        {t.account.referralTitle}
      </h2>
      <p
        data-testid="referral-code"
        className="m-0 mt-2 select-all font-mono text-[32px] font-semibold tracking-[0.25em] text-bone"
      >
        {code}
      </p>
      <p className="m-0 mt-1 text-[14px] text-muted">
        {t.account.referralBody}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="referral-copy-code"
          onClick={() => copy(code, "code")}
          className={`${button} bg-volt text-ink hover:bg-volt-dim`}
        >
          {copied === "code"
            ? t.account.referralCopied
            : t.account.referralCopy}
        </button>
        <button
          type="button"
          data-testid="referral-copy-link"
          onClick={() => copy(inviteUrl, "link")}
          className={`${button} border border-hairline-strong text-bone hover:border-hairline-accent`}
        >
          {copied === "link"
            ? t.account.referralCopied
            : t.account.referralCopyLink}
        </button>
      </div>
      {copied === "failed" && (
        <p role="alert" className="m-0 mt-2 text-[12px] text-danger">
          {t.account.referralCopyFailed}
        </p>
      )}
    </section>
  );
}
