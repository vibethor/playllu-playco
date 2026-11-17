import type { ComponentType } from "react";

/** The round flag the game card's language pill draws, and the language menu reuses (one look for "language"). */
export const ROUND_FLAG_PX = 18;

export function RoundFlag({
  Flag,
  size = ROUND_FLAG_PX,
  testId,
  code,
}: {
  Flag: ComponentType<{ cover?: boolean; className?: string }>;
  size?: number;
  testId?: string;
  code?: string;
}) {
  return (
    <span
      data-testid={testId}
      data-flag={code}
      className="relative shrink-0 overflow-hidden rounded-full ring-1 ring-cloud/60"
      // Dynamic size, so an inline style rather than a class per size.
      style={{ width: size, height: size }}
    >
      <Flag cover className="absolute inset-0 h-full w-full" />
    </span>
  );
}
