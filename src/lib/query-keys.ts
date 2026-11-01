import type { Query } from "@/lib/types-shared";

export const qk = {
  me: ["me"] as const,
  stats: (days: number) => ["stats", days] as const,
  applications: (filters: Query) => ["applications", filters] as const,
  application: (ref: string) => ["application", ref] as const,
  timeline: (ref: string) => ["application", ref, "timeline"] as const,
  appEmails: (ref: string) => ["application", ref, "emails"] as const,
  notifications: (unread: boolean, page: number) => ["notifications", "list", unread, page] as const,
  unread: ["notifications", "unread-count"] as const,
  audit: (filters: Query) => ["audit", filters] as const,
  emailLogs: (filters: Query) => ["email-logs", filters] as const,
  admins: ["admins"] as const,
  sessions: ["sessions"] as const,
};
