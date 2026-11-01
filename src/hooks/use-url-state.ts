"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Patch<T> = Partial<Record<keyof T, string | undefined>>;

/** Keeps list filters in the URL so they survive refresh, back/forward and sharing. Changing any filter resets to page 1. */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [defs] = React.useState(defaults);

  const state = React.useMemo(() => {
    const out = { ...defs } as Record<string, string>;
    for (const key of Object.keys(defs)) { const v = params.get(key); if (v !== null) out[key] = v; }
    return out as T;
  }, [params, defs]);

  const set = React.useCallback((patch: Patch<T>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "" || v === defs[k]) next.delete(k); else next.set(k, v as string);
    }
    if (Object.keys(patch).some((k) => k !== "page")) { if (!("page" in patch)) next.delete("page"); }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router, defs]);

  return { state, set };
}
