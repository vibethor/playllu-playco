"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/locale/actions";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALE_LABELS, SERVED_LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * THE WEBSITE LANGUAGE (Playco rebrand): a visible two-way toggle, "EN | ไทย", instead of HrajFotbal's dropdown of
 * four emoji flags. It changes the language of the site; the flags on a game card say which languages are spoken AT
 * the game, which is a different thing.
 *
 * Each option is a real button that submits the existing `setLocale` action, so it works the same with a keyboard
 * and a screen reader. `aria-pressed` marks the current language.
 */
export function LanguageSwitcher() {
  const active = useLocale();
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === active) return;
    const form = new FormData();
    form.set("locale", locale);
    startTransition(() => {
      void setLocale(form);
    });
  }

  return (
    <div
      role="group"
      aria-label="Language / ภาษา"
      data-testid="locale-switcher"
      className={`inline-flex shrink-0 overflow-hidden rounded-pill border border-hairline-strong text-[12px] font-semibold ${
        pending ? "opacity-60" : ""
      }`}
    >
      {SERVED_LOCALES.map((locale) => {
        const isActive = locale === active;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            data-testid={`locale-${locale}`}
            aria-pressed={isActive}
            onClick={() => choose(locale)}
            className={`min-h-8 px-2.5 transition-colors ${
              isActive ? "bg-ink text-cloud" : "text-bone hover:bg-surface-raised"
            }`}
          >
            {LOCALE_LABELS[locale].short}
          </button>
        );
      })}
    </div>
  );
}
