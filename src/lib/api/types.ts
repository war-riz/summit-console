// Hand-written mirror of the backend response models (see the API's /developer-docs).
export type Category = "member" | "sponsor";
export type Status = "pending" | "accepted" | "rejected";
export type Role = "super_admin" | "admin" | "viewer" | "gate_staff";
export type EmailState = "queued" | "sending" | "sent" | "failed" | "dead";
export type Decision = "accept" | "reject";

export interface Pagination { page: number; page_size: number; total_items: number; total_pages: number; has_next: boolean; has_prev: boolean }
export interface Paged<T> { items: T[]; pagination: Pagination }

export interface AdminUser {
  id: string; name: string; email: string; role: Role; is_active: boolean; mfa_enabled: boolean; must_change_password: boolean;
  mfa_required_by: string | null; last_login_at: string | null; created_at: string;
}
export interface CurrentAdmin extends AdminUser { permissions: string[]; locked_permissions: string[] }

export type LoginStatus = "authenticated" | "mfa_required" | "onboarding_required";
export interface LoginResult {
  status: LoginStatus; mfa_token?: string | null; onboarding_token?: string | null; onboarding_steps?: string[] | null; user?: AdminUser | null;
}
export interface MfaSetupInit { secret: string; otpauth_uri: string; qr_svg_data_uri: string }
export interface MfaConfirmResult { backup_codes: string[]; user: AdminUser }
export interface SessionInfo { id: string; ip: string | null; user_agent: string | null; created_at: string; last_used_at: string; is_current: boolean }

export interface EmailStatusSummary { received: EmailState | null; decision: EmailState | null }
export interface ApplicationSummary {
  id: string; reference: string; category: Category; status: Status; applicant_name: string; organisation: string | null; contact_name: string | null;
  email: string; phone: string; location: string; submitted_at: string; decided_at: string | null; decided_by_name: string | null; email_status: EmailStatusSummary;
}
export interface ApplicationNote { id: string; author_id: string; author_name: string; text: string; created_at: string }
export interface ApplicationDetail extends ApplicationSummary {
  job_title: string | null; website: string | null; sponsorship_interest: string | null; message: string | null; how_did_you_hear: string | null;
  additional_answers: Record<string, string>; consent_accepted_at: string | null; decided_by_id: string | null; decision_note: string | null;
  decision_version: number; check_ins: Record<string, { at: string; by_name?: string; method?: string }>; notes: ApplicationNote[]; 
  updated_at: string | null; available_actions: Decision[];
}
export interface BulkResult { succeeded: string[]; failed: { reference: string; code: string; message: string }[] }

export interface StatusCounts { pending: number; accepted: number; rejected: number; total: number }
export interface AuditEvent {
  id: string; action: string; outcome: "success" | "failure"; actor_id: string | null; actor_name: string | null; actor_email: string | null;
  actor_role: string | null; target_type: string | null; target_id: string | null; target_label: string | null;
  before: Record<string, unknown> | null; after: Record<string, unknown> | null; metadata: Record<string, unknown>; ip: string | null;
  user_agent: string | null; request_id: string | null; created_at: string;
}
export interface DashboardStats {
  cards: { total: number; members: number; sponsors: number; pending: number; accepted: number; rejected: number };
  by_category: Record<Category, StatusCounts>;
  trend: { date: string; members: number; sponsors: number; total: number }[];
  email_health: { sent: number; queued: number; failed: number; dead: number; delivery_rate: number | null };
  decisions: { acceptance_rate: number | null; average_hours_to_decision: number | null; pending_over_48h: number };
  recent_applications: ApplicationSummary[]; recent_activity: AuditEvent[]; timezone: string;
}
export interface EmailLog {
  id: string; kind: string; status: EmailState; to_email: string; to_name: string | null; subject: string; application_reference: string | null;
  category: Category | null; attempts: number; max_attempts: number; retryable: boolean; provider: string | null; last_error: string | null;
  next_retry_at: string | null; created_at: string; last_attempt_at: string | null; sent_at: string | null;
}
export type NotificationSeverity = "info" | "success" | "warning" | "critical";
export interface AppNotification {
  id: string; type: string; severity: NotificationSeverity; title: string; body: string; link: string | null; data: Record<string, unknown>;
  is_read: boolean; created_at: string; read_at: string | null;
}
export interface Attendee { reference: string; applicant_name: string; category: Category; organisation: string | null; job_title: string | null; checked_in_at: string | null }
export interface CheckinResult { attendee: Attendee; day: string; method: "scan" | "manual" }
export interface CheckinStats {
  day: string; expected: number; checked_in: number; remaining: number; by_category: Record<string, { expected: number; checked_in: number }>;
  per_day: { day: string; checked_in: number }[];
  recent: { reference: string; applicant_name: string; category: Category; checked_in_at: string; checked_in_by_name: string | null; method: string }[];
}