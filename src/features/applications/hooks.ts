"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ApplicationDetail, ApplicationNote, ApplicationSummary, AuditEvent, BulkResult, Decision, EmailLog } from "@/lib/api/types";
import type { Query } from "@/lib/types-shared";
import { qk } from "@/lib/query-keys";

export function useApplications(filters: Query, enabled = true) {
  return useQuery({
    queryKey: qk.applications(filters), enabled, placeholderData: keepPreviousData,
    queryFn: ({ signal }) => api.page<ApplicationSummary>("/admin/applications", filters, signal),
  });
}

export function useApplication(reference: string) {
  return useQuery({ queryKey: qk.application(reference), queryFn: () => api.get<ApplicationDetail>(`/admin/applications/${reference}`), retry: false });
}

export function useApplicationTimeline(reference: string, enabled: boolean) {
  return useQuery({
    queryKey: qk.timeline(reference), enabled, retry: false,
    queryFn: () => api.page<AuditEvent>(`/admin/applications/${reference}/timeline`, { page_size: 30 }).then((r) => r.items),
  });
}

export function useApplicationEmails(reference: string) {
  return useQuery({ queryKey: qk.appEmails(reference), queryFn: () => api.get<EmailLog[]>(`/admin/applications/${reference}/email-logs`), retry: false });
}

function useRefresh() {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: ["applications"] }), qc.invalidateQueries({ queryKey: ["application"] }),
    qc.invalidateQueries({ queryKey: ["stats"] }), qc.invalidateQueries({ queryKey: ["audit"] }),
  ]);
}

export function useDecide(reference: string) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { decision: Decision; note?: string; confirm_reversal?: boolean }) =>
      api.post<ApplicationDetail>(`/admin/applications/${reference}/${v.decision}`, { note: v.note, confirm_reversal: v.confirm_reversal ?? false }),
    onSuccess: refresh,
  });
}

export function useBulkDecide() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (v: { references: string[]; decision: Decision; note?: string }) => api.post<BulkResult>("/admin/applications/bulk-decision", v),
    onSuccess: refresh,
  });
}

export function useAddNote(reference: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api.post<ApplicationNote>(`/admin/applications/${reference}/notes`, { text }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.application(reference) }),
  });
}
