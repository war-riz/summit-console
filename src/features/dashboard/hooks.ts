"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { DashboardStats } from "@/lib/api/types";
import { qk } from "@/lib/query-keys";

export function useDashboardStats(days: number) {
  return useQuery({ queryKey: qk.stats(days), queryFn: () => api.get<DashboardStats>("/admin/dashboard/stats", { trend_days: days }), placeholderData: keepPreviousData, refetchInterval: 60_000 });
}
