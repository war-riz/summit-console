"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Attendee, CheckinResult, CheckinStats } from "@/lib/api/types";

export function useCheckinStats() {
  return useQuery({ queryKey: ["checkin", "stats"], queryFn: () => api.get<CheckinStats>("/admin/checkin/stats"), refetchInterval: 15_000 });
}

export function useAttendees(q: string, checkedIn: boolean | undefined) {
  return useQuery({
    queryKey: ["checkin", "attendees", q, checkedIn], placeholderData: keepPreviousData,
    queryFn: () => api.page<Attendee>("/admin/checkin/attendees", { q, checked_in: checkedIn, page_size: 20 }),
  });
}

export function useCheckin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { code: string; method: "scan" | "manual" }) => api.post<CheckinResult>("/admin/checkin", v),
    onSettled: () => qc.invalidateQueries({ queryKey: ["checkin"] }),
  });
}

export function useUndoCheckin() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (reference: string) => api.post(`/admin/checkin/${reference}/undo`), onSuccess: () => qc.invalidateQueries({ queryKey: ["checkin"] }) });
}