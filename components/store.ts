"use client";

/**
 * Tiny persistent, cross-slot reactive store — the same module-scope + window
 * event pattern as `lang.ts`. The engine mounts each theme slot (navbar, home,
 * product, account …) as an INDEPENDENT React tree, so a normal Context provider
 * in one slot can't reach the others. A module-scoped store broadcast through a
 * window event lets a wishlist toggle in a product card instantly update the
 * navbar badge, the account page and everything else. State persists to
 * localStorage and syncs across tabs.
 *
 *   const cart = createPersistentStore<Item[]>("tpl_x", []);
 *   cart.update((list) => [...list, item]);   // anywhere
 *   const items = cart.useStore();            // reactive, in any slot
 */

import { useSyncExternalStore } from "react";

export interface PersistentStore<T> {
  read: () => T;
  set: (next: T) => void;
  update: (fn: (prev: T) => T) => void;
  subscribe: (cb: () => void) => () => void;
  useStore: () => T;
}

export function createPersistentStore<T>(key: string, initial: T): PersistentStore<T> {
  const EVT = `tpl-store:${key}`;
  let cache: T = initial;
  let lastRaw: string | null = null;
  let primed = false;

  // Returns a STABLE reference between writes (required by useSyncExternalStore)
  // and only re-parses when the underlying localStorage string actually changes.
  function read(): T {
    if (typeof window === "undefined") return initial;
    let raw: string | null = null;
    try { raw = window.localStorage.getItem(key); } catch { /* ignore */ }
    if (!primed || raw !== lastRaw) {
      lastRaw = raw;
      primed = true;
      try { cache = raw ? (JSON.parse(raw) as T) : initial; } catch { cache = initial; }
    }
    return cache;
  }

  function set(next: T): void {
    cache = next;
    primed = true;
    if (typeof window === "undefined") return;
    try {
      const raw = JSON.stringify(next);
      window.localStorage.setItem(key, raw);
      lastRaw = raw;
    } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVT));
  }

  function update(fn: (prev: T) => T): void { set(fn(read())); }

  function subscribe(cb: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    window.addEventListener(EVT, cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener(EVT, cb);
      window.removeEventListener("storage", cb);
    };
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, read, () => initial);
  }

  return { read, set, update, subscribe, useStore };
}
