"use client";

import * as React from "react";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** SSR-safe boolean persisted in localStorage (no setState-in-effect, no hydration mismatch). */
export function useStoredFlag(key: string, fallback = false): [boolean, (v: boolean) => void] {
  const value = React.useSyncExternalStore(
    (cb) => { listeners.add(cb); window.addEventListener("storage", cb); return () => { listeners.delete(cb); window.removeEventListener("storage", cb); }; },
    () => { const v = localStorage.getItem(key); return v === null ? fallback : v === "1"; },
    () => fallback,
  );
  const set = React.useCallback((v: boolean) => { localStorage.setItem(key, v ? "1" : "0"); emit(); }, [key]);
  return [value, set];
}

const noop = () => () => {};
/** True after hydration; use to render theme-dependent UI without a mismatch. */
export function useMounted(): boolean {
  return React.useSyncExternalStore(noop, () => true, () => false);
}
