"use client";

/**
 * Theme-local bilingual store (English / বাংলা).
 *
 * Why theme-local instead of the engine's `@/lib/LanguageContext`? Each theme
 * slot (navbar, home, product, footer …) is mounted by the engine as an
 * independent React tree, so a normal Context provider in one slot can't reach
 * the others. This store lives at module scope and notifies every slot through
 * a window event, so a toggle in the navbar instantly re-renders the home feed,
 * product CTAs and footer alike. State is persisted to localStorage.
 *
 * Usage:
 *   const { lang, setLang } = useLang();
 *   <span>{t(lang, "Add to cart", "কার্টে যোগ করুন")}</span>
 */

import { useSyncExternalStore } from "react";

export type Lang = "en" | "bn";

const KEY = "tpl-lang";
const EVT = "tpl-lang-change";

function read(): Lang {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(KEY) === "bn" ? "bn" : "en";
}

export function setLang(next: Lang): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, next);
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVT, cb);
  // Sync across tabs too.
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Reactive current language. Re-renders the calling component on toggle. */
export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  const lang = useSyncExternalStore(subscribe, read, () => "en" as Lang);
  return { lang, setLang };
}

/** Pick the string for the active language. */
export function t(lang: Lang, en: string, bn: string): string {
  return lang === "bn" ? bn : en;
}
