import { DISPLAY_TIME_ZONE } from "@/lib/format";

/**
 * The game form's start time, read and written in the CITY's time zone (owner bug, 18 Nov 2026).
 *
 * WHY NOT THE BROWSER'S ZONE. The form used `new Date(value)` and `date.getHours()`, which mean "whatever zone this
 * code runs in". The page is rendered on Vercel in UTC and hydrated in the organiser's browser in Bangkok, so the two
 * drew different text ("Every Sunday at 10:00" vs "at 17:00"). React threw the server HTML away and regenerated the
 * tree, and after a save React's form reset left every dropdown on its first option — venue "—", 60 min, no game type.
 * Reading the box in the city's zone gives the server and the browser the same answer, and it is also the zone every
 * other surface shows a game's time in (`lib/format.ts`).
 */

/** `YYYY-MM-DDTHH:mm`, the value a `datetime-local` box holds. */
const INPUT_VALUE_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const MS_PER_MINUTE = 60_000;

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
}

function parseInstant(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function wallClockInCity(date: Date): WallClock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(part("year")),
    month: Number(part("month")),
    day: Number(part("day")),
    hour: Number(part("hour")),
    minute: Number(part("minute")),
    weekday: part("weekday"),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** An instant → the city's wall clock, as a `datetime-local` value. Empty for anything that is not a date. */
export function cityInputValue(startsAt: string): string {
  const date = parseInstant(startsAt);
  if (!date) return "";
  const clock = wallClockInCity(date);
  return `${clock.year}-${pad(clock.month)}-${pad(clock.day)}T${pad(clock.hour)}:${pad(clock.minute)}`;
}

/**
 * A `datetime-local` value read as the city's wall clock → the absolute instant (ISO, UTC). Null when the box is empty
 * or malformed. Two passes of "how far is the city from UTC at this moment", so a zone with daylight saving lands on
 * the right side of the change.
 */
export function instantFromCityInput(value: string): string | null {
  const match = INPUT_VALUE_RE.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const asIfUtc = Date.UTC(y, mo - 1, d, h, mi);
  const check = new Date(asIfUtc);
  if (
    check.getUTCFullYear() !== y ||
    check.getUTCMonth() !== mo - 1 ||
    check.getUTCDate() !== d ||
    check.getUTCHours() !== h ||
    check.getUTCMinutes() !== mi
  ) {
    return null;
  }

  const offsetAt = (instant: number) => {
    const clock = wallClockInCity(new Date(instant));
    return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute) - instant;
  };

  let instant = asIfUtc - offsetAt(asIfUtc);
  instant = asIfUtc - offsetAt(instant);
  return new Date(Math.round(instant / MS_PER_MINUTE) * MS_PER_MINUTE).toISOString();
}

/** "Sunday" and "17:00" for "Every Sunday at 17:00", in the city. Null without a valid start. */
export function weeklyRepeatLabel(startsAt: string): { weekday: string; time: string } | null {
  const date = parseInstant(startsAt);
  if (!date) return null;
  const clock = wallClockInCity(date);
  return { weekday: clock.weekday, time: `${pad(clock.hour)}:${pad(clock.minute)}` };
}
