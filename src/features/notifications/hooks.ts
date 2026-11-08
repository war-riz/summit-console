"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AppNotification } from "@/lib/api/types";
import { qk } from "@/lib/query-keys";

export function useNotifications(unreadOnly: boolean, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...qk.notifications(unreadOnly, page), pageSize], placeholderData: keepPreviousData,
    queryFn: () => api.page<AppNotification>("/admin/notifications", { unread_only: unreadOnly, page, page_size: pageSize }),
  });
}

export function useUnreadCount() {
  return useQuery({ queryKey: qk.unread, queryFn: () => api.get<{ unread: number }>("/admin/notifications/unread-count").then((r) => r.unread), refetchInterval: 60_000 });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.post("/admin/notifications/read-all"), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.delete(`/admin/notifications/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}

export function useClearRead() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.delete<{ deleted: number }>("/admin/notifications"), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });
}
