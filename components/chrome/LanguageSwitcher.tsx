"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ComponentType,
} from "react";
import { setLocale } from "@/app/locale/actions";
import { Icon } from "@/components/Icon";
import { useLocale } from "@/components/LocaleProvider";
import { FlagGB, FlagTH } from "@/components/flags/Flags";
import { RoundFlag } from "@/components/flags/RoundFlag";
import { LOCALE_LABELS, SERVED_LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * THE WEBSITE LANGUAGE, AS A DROPDOWN (owner, 17 Nov 2026: "use the globe visual and the flags that we use on the
 * game card, make it a drop down"). Closed: the game card's language pill (globe, divider, round flag) plus a
 * chevron. Open: one row per served language, its flag and its own name, the current one ticked.
 *
 * Only served locales are listed (`SERVED_LOCALES`: English and Thai). A locale with no flag here falls back to its
 * short code, so adding a language never renders an empty row.
 */
const LOCALE_FLAG: Partial<
  Record<Locale, ComponentType<{ cover?: boolean; className?: string }>>
> = {
  en: FlagGB,
  th: FlagTH,
};

function LocaleMark({ locale, testId }: { locale: Locale; testId?: string }) {
  const Flag = LOCALE_FLAG[locale];
  if (!Flag)
    return (
      <span className="text-[12px] font-semibold">
        {LOCALE_LABELS[locale].short}
      </span>
    );
  return <RoundFlag Flag={Flag} testId={testId} code={locale} />;
}

export function LanguageSwitcher() {
  const active = useLocale();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Close on a tap outside or on Escape, the two ways people dismiss a menu.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(locale: Locale) {
    setOpen(false);
    if (locale === active) return;
    const form = new FormData();
    form.set("locale", locale);
    startTransition(() => {
      void setLocale(form);
    });
  }

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      data-testid="locale-switcher"
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Language / ภาษา: ${LOCALE_LABELS[active].full}`}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-pill border border-hairline-strong bg-page/60 pl-2.5 pr-2 transition-colors hover:border-hairline-accent ${
          pending ? "opacity-60" : ""
        }`}
      >
        <span data-testid="locale-globe" className="inline-flex">
          <Icon name="globe" className="h-4 w-4 text-bone" />
        </span>
        <span aria-hidden className="h-3.5 w-px bg-hairline-strong" />
        <LocaleMark locale={active} testId="locale-current-flag" />
        <svg
          aria-hidden
          viewBox="0 0 12 8"
          className={`h-2 w-3 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M1 1.5 6 6.5 11 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Language / ภาษา"
          className="absolute right-0 top-full z-40 mt-2 min-w-[168px] overflow-hidden rounded-control border border-hairline-strong bg-surface p-1 shadow-card"
        >
          {SERVED_LOCALES.map((locale) => {
            const isActive = locale === active;
            return (
              <button
                key={locale}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                lang={locale}
                data-testid={`locale-${locale}`}
                onClick={() => choose(locale)}
                className={`flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-surface-raised ${
                  isActive ? "font-semibold text-bone" : "text-muted"
                }`}
              >
                <LocaleMark locale={locale} />
                <span className="flex-1">{LOCALE_LABELS[locale].full}</span>
                {isActive && (
                  <svg
                    aria-hidden
                    viewBox="0 0 16 16"
                    className="h-4 w-4 text-accent"
                  >
                    <path
                      d="M3 8.5 6.5 12 13 4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
