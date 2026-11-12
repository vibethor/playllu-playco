#!/usr/bin/env node
/**
 * Playco's one mechanical difference from HrajFotbal: the currency is THB, so every identifier that names CZK names THB.
 *
 *   node scripts/fork/rename-currency.mjs            # whole repo (git-tracked text files)
 *   node scripts/fork/rename-currency.mjs <files…>   # only these — how an upstream fix is ported: copy it, then run this on it
 *
 * Idempotent. Rewrites file contents and renames files whose name contains czk. It renames NAMES only: amounts
 * (180 → 250), Czech payment wording (QR platba, variabilní symbol, Kč) and the Czech QR format are changed by hand in
 * the Bangkok commits, because they are decisions, not spelling.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { isUtf8 } from "node:buffer";

/** HrajFotbal's history, kept verbatim, and binary or generated content where "czk" can appear inside random text. */
const SKIP = [/^docs\/upstream\//, /^public\/flags\//, /package-lock\.json$/, /\.(png|jpe?g|webp|ico|gif|woff2?|pdf|ttf|otf)$/i, /^scripts\/fork\//];

/** Order matters only in that every rule is anchored, so none can produce input for another. */
export const RULES = [
  [/_czk\b/g, "_thb"], //                       price_czk, p_amount_czk, credit_seat_price_czk()
  [/_CZK\b/g, "_THB"], //                       PASS_REFERENCE_PRICE_CZK
  [/\bCZK\b/g, "THB"], //                       display text, ISO codes
  [/\bczk\b/g, "thb"], //                       {czk} placeholders, metadata keys
  [/\bczk(?=[A-Z])/g, "thb"], //                czkFromCredits
  [/([a-z0-9])Czk(?![a-z])/g, "$1Thb"], //      priceCzk, formatSignedCzk, minorUnitsToCzk
];

export function renameText(text) {
  return RULES.reduce((t, [re, to]) => t.replace(re, to), text);
}

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
}

function main() {
  const args = process.argv.slice(2);
  const files = (args.length ? args : trackedFiles()).filter((f) => !SKIP.some((re) => re.test(f)) && existsSync(f));
  let changed = 0;
  let moved = 0;
  for (const file of files) {
    const before = readFileSync(file);
    if (!isUtf8(before)) continue; // binary (a NUL alone is not: a sanitiser test carries them on purpose)
    const text = before.toString("utf8");
    const after = renameText(text);
    if (after !== text) {
      writeFileSync(file, after);
      changed += 1;
    }
    const target = renameText(file);
    if (target !== file) {
      if (args.length === 0) execFileSync("git", ["mv", file, target]);
      else renameSync(file, target);
      moved += 1;
    }
  }
  process.stdout.write(`rename-currency: ${changed} files rewritten, ${moved} renamed\n`);
}

main();
