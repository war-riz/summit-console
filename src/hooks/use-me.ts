"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { CurrentAdmin } from "@/lib/api/types";
import { qk } from "@/lib/query-keys";

export function useMe() {
  return useQuery({ queryKey: qk.me, queryFn: () => api.get<CurrentAdmin>("/auth/me"), staleTime: 60_000, retry: false });
}

/** `allowed`: the role has it. `locked`: the role has it but 2FA must be enabled first. */
export function useCan(permission: string) {
  const { data } = useMe();
  return { allowed: !!data?.permissions.includes(permission), locked: !!data?.locked_permissions.includes(permission), ready: !!data };
}
