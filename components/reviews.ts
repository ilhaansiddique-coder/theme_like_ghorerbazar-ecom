"use client";

/**
 * Product reviews — theme-local, persisted, reactive, keyed by product id.
 * The product page submits here optimistically (no approval queue in the demo);
 * the rating summary, distribution bars and count all derive from this store.
 * In production, seed from `product.reviews` (engine) and POST new ones to the API.
 */

import { createPersistentStore } from "./store";

export interface Review {
  id: string;
  rating: number; // 1–5
  text: string;
  author: string;
  date: string; // ISO
}

type ReviewMap = Record<string, Review[]>;

const store = createPersistentStore<ReviewMap>("tpl_reviews", {});

export function addReview(productId: number, review: { rating: number; text: string; author: string }): void {
  store.update((map) => {
    const key = String(productId);
    const entry: Review = {
      ...review,
      id: `${key}-${Date.now().toString(36)}`,
      date: new Date().toISOString(),
    };
    return { ...map, [key]: [entry, ...(map[key] || [])] };
  });
}

export function useReviews(productId: number) {
  const map = store.useStore();
  const list = map[String(productId)] || [];
  const count = list.length;
  const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  // Count per star (index 0 → 5★, index 4 → 1★) and % recommended (4★+).
  const dist = [5, 4, 3, 2, 1].map((star) => list.filter((r) => r.rating === star).length);
  const recommended = count ? Math.round((list.filter((r) => r.rating >= 4).length / count) * 100) : 0;
  return { list, count, average, dist, recommended };
}
