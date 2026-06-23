"use client";

/**
 * Address book — theme-local, persisted, reactive. Powers the account "Addresses"
 * tab and can prefill checkout. Demo storage; swap for the engine API in prod.
 */

import { createPersistentStore } from "./store";

export interface Address {
  id: string;
  label: string;   // "Home", "Office" …
  name: string;
  phone: string;
  line: string;
  city: string;
  isDefault?: boolean;
}

const store = createPersistentStore<Address[]>("tpl_addresses", []);

export function saveAddress(addr: Omit<Address, "id"> & { id?: string }): void {
  store.update((list) => {
    const id = addr.id || `addr-${Date.now().toString(36)}`;
    const next = list.some((a) => a.id === id)
      ? list.map((a) => (a.id === id ? { ...a, ...addr, id } : a))
      : [...list, { ...addr, id }];
    // Keep a single default.
    if (addr.isDefault) return next.map((a) => ({ ...a, isDefault: a.id === id }));
    return next;
  });
}

export function removeAddress(id: string): void {
  store.update((list) => list.filter((a) => a.id !== id));
}

export function useAddresses() {
  const addresses = store.useStore();
  return { addresses, save: saveAddress, remove: removeAddress };
}
