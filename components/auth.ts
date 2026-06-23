"use client";

/**
 * Customer session — theme-local, persisted, reactive across every slot.
 *
 * This is a CLIENT-SIDE demo session (no password is verified against a backend).
 * In production, replace `login` / `register` with calls to the engine's auth API
 * and keep the same store shape so the navbar / account UI need no changes.
 */

import { createPersistentStore } from "./store";

export interface AuthUser {
  name: string;
  email: string;
  phone?: string;
  since: string; // ISO date the session/account was created
}

const store = createPersistentStore<AuthUser | null>("tpl_auth", null);

function nameFromEmail(email: string): string {
  const base = email.split("@")[0] || "Customer";
  return base.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function login(email: string, _password: string): AuthUser {
  const user: AuthUser = { name: nameFromEmail(email), email, since: new Date().toISOString() };
  store.set(user);
  return user;
}

export function register(name: string, email: string, phone?: string): AuthUser {
  const user: AuthUser = { name: name.trim() || nameFromEmail(email), email, phone: phone || undefined, since: new Date().toISOString() };
  store.set(user);
  return user;
}

export function logout(): void { store.set(null); }

export function updateProfile(patch: Partial<AuthUser>): void {
  store.update((u) => (u ? { ...u, ...patch } : u));
}

export function useAuth() {
  const user = store.useStore();
  return { user, isAuthed: !!user, login, register, logout, updateProfile };
}
