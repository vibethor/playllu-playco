/**
 * Dev helper: prints every player-facing English string that a translation overlay must cover, as flat JSON
 * (`key -> English`). Mirrors the rules of lib/i18n/__tests__/i18n.test.ts. Run with vite-node.
 */
import { writeFileSync } from "node:fs";
import { strings } from "@/lib/strings";

const SECTIONS = ["meta","nav","siteFooter","legal","notFound","landing","auth","games","booking","purchase","emails","payment","account","profile","consent","errors","common","faq","toast","pass","notifications","story"];
const out: Record<string, string> = {};
function walk(value: unknown, prefix: string): void {
  if (typeof value === "string") { if (/\p{L}/u.test(value)) out[prefix] = value; return; }
  if (Array.isArray(value)) { value.forEach((v, i) => walk(v, `${prefix}[${i}]`)); return; }
  if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, prefix ? `${prefix}.${k}` : k);
}
for (const s of SECTIONS) walk((strings as Record<string, unknown>)[s], s);
writeFileSync(process.argv[2] ?? "/dev/stdout", JSON.stringify(out, null, 1));
