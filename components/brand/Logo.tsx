import { SITE_NAME } from "@/lib/city/default";

/**
 * THE PLAYCO LOGO — "court corners" (rebrand, option 08 chosen by Jachym).
 *
 * The name in uppercase Montserrat, widely spaced, framed by two court corners. The corners use `border-accent`, so
 * they are Electric Lime on a dark island and Midnight Navy on the light page — lime on Cloud White would vanish.
 * The text uses `text-bone` for the same reason. Sized in `em` from the font size, so one prop scales everything.
 *
 * Decorative by default (`aria-hidden`): the link or heading around it carries the name.
 */
export function Logo({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      data-testid="brand-logo"
      className={`relative inline-flex items-center font-logo font-extrabold uppercase leading-none tracking-[0.12em] text-bone ${className}`}
      style={{ fontSize: `${size}px`, padding: "0.5em 0.62em 0.5em 0.7em" }}
    >
      <span className="absolute left-0 top-0 h-[0.62em] w-[0.62em] border-l-[0.1em] border-t-[0.1em] border-accent" />
      {SITE_NAME}
      <span className="absolute bottom-0 right-0 h-[0.62em] w-[0.62em] border-b-[0.1em] border-r-[0.1em] border-accent" />
    </span>
  );
}

/** The square mark (court corners and the ball), for places where the wordmark does not fit. */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 512 512" className={className}>
      <rect width="512" height="512" rx="112" className="fill-ink" />
      <path
        d="M120 232V120h112M392 280v112H280"
        fill="none"
        className="stroke-lime"
        strokeWidth="36"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="256" cy="256" r="42" className="fill-cloud" />
    </svg>
  );
}
