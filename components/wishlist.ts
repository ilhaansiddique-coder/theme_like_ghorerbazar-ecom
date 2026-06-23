"use client";

/**
 * Wishlist — theme-local, persisted, reactive across every slot (see store.ts).
 * Stores the full product so the wishlist view can render a standard ProductCard
 * without an extra fetch. Toggle from any product card or the product page; the
 * navbar heart badge and the account wishlist tab update instantly.
 */

import type { Product } from "@/data/products";
import { createPersistentStore } from "./store";

const store = createPersistentStore<Product[]>("tpl_wishlist", []);

export function toggleWishlist(p: Product): void {
  store.update((list) =>
    list.some((i) => i.id === p.id) ? list.filter((i) => i.id !== p.id) : [p, ...list],
  );
}

export function removeWishlist(id: number): void {
  store.update((list) => list.filter((i) => i.id !== id));
}

export function clearWishlist(): void { store.set([]); }

export function useWishlist() {
  const items = store.useStore();
  return {
    items,
    count: items.length,
    has: (id: number) => items.some((i) => i.id === id),
    toggle: toggleWishlist,
    remove: removeWishlist,
    clear: clearWishlist,
  };
}
