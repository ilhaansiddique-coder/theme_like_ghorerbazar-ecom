"use client";

/**
 * Order history — theme-local, persisted, reactive. Checkout saves a record here
 * on a successful order so the account "My Orders" tab and Track-Order page can
 * show real data in the preview. In production these come from the engine API;
 * keep the shape and the account UI works unchanged.
 */

import { createPersistentStore } from "./store";

export type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderLine {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantLabel?: string;
}

export interface Order {
  token: string;
  date: string; // ISO
  status: OrderStatus;
  items: OrderLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  payment?: string;
  notes?: string;
  coupon?: string;
}

const store = createPersistentStore<Order[]>("tpl_orders", []);

export function saveOrder(order: Order): void {
  store.update((list) => [order, ...list.filter((o) => o.token !== order.token)]);
}

export function findOrder(token: string): Order | undefined {
  return store.read().find((o) => o.token.toLowerCase() === token.toLowerCase());
}

export function useOrders() {
  const orders = store.useStore();
  return { orders, save: saveOrder };
}
