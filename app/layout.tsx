import { profilePhotoVersion } from "@/lib/storage/photoVersions";
import { PreviewBar } from "@/components/chrome/PreviewBar";
import type { Metadata, Viewport } from "next";
import { Anuphan, Archivo, IBM_Plex_Sans_Thai, JetBrains_Mono, Montserrat } from "next/font/google";
import { NavPill } from "@/components/chrome/NavPill";
import { LocaleProvider } from "@/components/LocaleProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { Suspense } from "react";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { GoogleTagManager } from "@next/third-parties/google";
import { Footer } from "@/components/chrome/Footer";
import { CookieConsent } from "@/components/consent/CookieConsent";
import { SignUpEvent } from "@/components/analytics/SignUpEvent";
import { consentBootstrapScript, gtmContainerId } from "@/lib/analytics/gtm";
import { Header } from "@/components/chrome/Header";
import { EMPTY_BELL, getBellState } from "@/lib/notifications/queries";
import { getCurrentPlayer } from "@/lib/auth/session";
import { getLocale, getStrings } from "@/lib/i18n/server";
import { strings } from "@/lib/strings";
import { BRAND } from "@/lib/brand/palette";
import { SITE_NAME } from "@/lib/city/default";
import "./globals.css";


/** Display face for the hero and section titles. */
/*
 * PLAYCO TYPE. Display: Archivo, a wide athletic grotesque, run semi-expanded (`.font-display` in globals.css).
 * Thai has no glyphs in Archivo, so the stacks fall through to Anuphan (drawn to sit with Latin). Text: IBM Plex
 * Sans Thai, which carries Thai and Latin in one family. Logo: Montserrat, the typeface of the existing wordmark.
 */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext", "vietnamese"],
  axes: ["wdth"],
  display: "swap",
});

const anuphan = Anuphan({
  variable: "--font-anuphan",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-plex-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/**
 * `generateMetadata` rather than a static `metadata` object: the title and
 * description are copy, and copy is now per-request. A module-level constant
 * is evaluated once at build time and would pin every language's tab title and
 * every shared link's description to English.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getStrings();

  return {
    /**
     * Base for resolving relative Open Graph and Twitter image URLs.
     *
     * WhatsApp and every other unfurler fetch `og:image` as an absolute URL and
     * will not resolve a relative path. Without this, Next falls back to
     * `http://localhost:3000`, which produces preview cards that render locally
     * and silently show no image once deployed — the failure appears only in
     * production, in someone else's chat window.
     *
     * Resolved from NEXT_PUBLIC_SITE_URL, the same variable the magic-link
     * origin uses, so both agree by construction.
     */
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000",
    ),
    /**
     * Every page sets its own bare title ("Games", "My account") and the
     * template hangs the brand off it, so a tab strip or a shared link reads as
     * this product rather than as six unrelated pages. `default` covers routes
     * that set none. The brand itself is not translated — it is a name.
     */
    title: {
      default: t.meta.title,
      template: `%s — ${SITE_NAME}`,
    },
    description: t.meta.description,
    applicationName: "Playco",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Playco",
    },
  };
}

/**
 * `themeColor` paints the mobile browser chrome and the standalone splash. It
 * belongs on `viewport`, not `metadata` — Next warns and drops it otherwise.
 */
export const viewport: Viewport = {
  themeColor: BRAND.navy,
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolved server-side and passed down for DISPLAY only. Route protection
  // lives in lib/auth/session.ts and authorization lives inside the RPCs —
  // see the note in components/SessionProvider.tsx.
  const player = await getCurrentPlayer();

  // The language, decided once per request. Server components read the same
  // table through `getStrings()`; client components get it from
  // `LocaleProvider`, so the two can never disagree and hydrate a flash of the
  // wrong language.
  const [locale, t] = await Promise.all([getLocale(), getStrings()]);

  /*
   * GOOGLE TAG MANAGER, AND EVERYTHING THAT COMES WITH IT (round 40), only
   * while `NEXT_PUBLIC_GTM_ID` is set: the consent defaults, the container,
   * the lawyer's banner and the sign-up event. Without a container there is
   * nothing to consent to, so none of it renders (Texty pro web 9.1).
   */
  const gtmId = gtmContainerId();

  return (
    <html
      lang={locale}
      className={`${archivo.variable} ${anuphan.variable} ${plexThai.variable} ${montserrat.variable} ${jetbrainsMono.variable} h-full`}
    >
      {/*
        CONSENT MODE BEFORE THE CONTAINER, AND INSIDE <head>. `beforeInteractive`
        lands in the initial HTML and runs before any bundle, so every signal is
        "denied" — or the stored choice — by the time GTM's own script reads
        them. Rendered as a direct child of <html> it is invalid markup and a
        hydration error (React says so in dev), hence the explicit <head>.
      */}
      <head>
        {gtmId && (
          <Script id="consent-default" strategy="beforeInteractive">
            {consentBootstrapScript()}
          </Script>
        )}
      </head>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body className="min-h-full flex flex-col">
        <PreviewBar />
        <LocaleProvider locale={locale} t={t}>
          <SessionProvider
            value={{
              isAuthenticated: player !== null,
              nickname: player?.nickname ?? null,
              isAdmin: player?.is_admin ?? false,
            }}
          >
            <Header
              /*
                THE BELL'S ROWS (round 7, item 5). Fetched only for a signed-in
                player: `my_notifications` resolves the caller from
                `auth.uid()`, so calling it anonymously is a round trip that
                can only return an empty list.
              */
              bell={player ? await getBellState({ joinedAt: player.created_at }) : EMPTY_BELL}
              nickname={player?.nickname ?? null}
              isAdmin={player?.is_admin ?? false}
              photoPath={player?.photo_path ?? null}
              /* `created_at` moves when the row does, which is when the photo
                 bytes changed — the same cache-busting value `/account` uses. */
              photoVersion={player ? await profilePhotoVersion(player.photo_path) : null}
            />
            {/*
              `--tabbar-h` is the bottom bar's footprint including the iPhone
              home indicator, and 0 at `md` where the bar is not rendered. One
              number, read here and by the game page's fixed CTA, so the last
              line of a page can never end up permanently behind the bar — see
              app/globals.css.
            */}
            {/*
              THE READING COLUMN. Full width below `md`, capped at 720px and
              centred at and above it.

              Imposed here rather than on each page because every page already
              opens with `mx-auto w-full max-w-shell px-gutter`, and editing
              twenty of them to say a different number is twenty chances to
              miss one — the missed one then being the single screen that
              stretches to 1280px while the rest do not.

              The gutter stays on the pages. This wrapper adds no padding, so
              nothing is padded twice.
            */}
            <div
              className="mx-auto w-full flex-1 md:max-w-content"
              style={{ paddingBottom: "var(--tabbar-h)" }}
            >
              {children}
              <Footer />
              {/*
                THE LAWYER'S BANNER (Texty pro web 9.2–9.3), back with the
                first script that needs it — and only while that script is
                configured. With no container the site sets only necessary
                cookies and, per 9.1, shows no banner at all.
              */}
              {gtmId && <CookieConsent />}
              {gtmId && (
                <Suspense fallback={null}>
                  <SignUpEvent />
                </Suspense>
              )}
            </div>

            {/* Phone widths only. On a desktop this would be a phone
                affordance pinned to the bottom of a large screen, miles from
                anything — the header's link row carries navigation there, and
                the two are mutually exclusive at every width. */}
            <NavPill />
          </SessionProvider>
        </LocaleProvider>
        {/*
          VERCEL WEB ANALYTICS — ALWAYS ON, OUTSIDE THE CONSENT GATE (2026-11-06,
          the owner's choice). It stores nothing on the visitor's device: no
          cookie, no local storage — page views counted by a same-origin script
          (`/_vercel/insights`). The banner above governs what DOES store
          something (GTM: GA4 and the Meta Pixel), and this does not. The
          published privacy policy does not name it; that is flagged in
          docs/REQUESTS.md, not edited here — the legal text is verbatim.
        */}
        <Analytics />
      </body>
    </html>
  );
}
