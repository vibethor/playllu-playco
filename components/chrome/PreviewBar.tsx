import { strings } from "@/lib/strings";

/**
 * PLAYCO, PHASE F: a thin bar on every page while the site runs on Stripe test keys, so nobody mistakes the preview
 * for the real thing. On when `NEXT_PUBLIC_PREVIEW=1` (inlined at build time — change it, then redeploy).
 */
export function PreviewBar() {
  if (process.env.NEXT_PUBLIC_PREVIEW !== "1") return null;
  return (
    <div
      role="status"
      data-testid="preview-bar"
      className="w-full bg-volt px-4 py-1 text-center text-[12px] font-bold text-ink"
    >
      {strings.preview.bar}
    </div>
  );
}
