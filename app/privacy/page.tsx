import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { publicPageMetadata } from "@/lib/seo/pageMetadata";
import { LegalPage } from "@/components/legal/LegalPage";
import { getStrings } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getStrings();
  return publicPageMetadata({
    site: await siteUrl(),
    path: "/privacy",
    title: t.legal.privacyTitle,
    description: t.meta.privacyDescription,
  });
}

/**
 * `/privacy` — Zásady zpracování osobních údajů, version 2.0.
 *
 * The real policy, replacing the DRAFT placeholder that stood here since
 * Phase 27. Signup's data-processing line and the account page's deletion
 * request both point here, so this is the page those consents now rest on.
 */
export default function PrivacyPage() {
  return <LegalPage name="privacy" />;
}
