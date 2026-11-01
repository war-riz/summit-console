import { Ban, CheckCircle2, Download, Eye, FileText, KeyRound, LogIn, LogOut, Mail, MailWarning, ShieldAlert, ShieldCheck, StickyNote, UserCog, XCircle, type LucideIcon } from "lucide-react";
import type { AuditEvent } from "@/lib/api/types";

interface Described { Icon: LucideIcon; tone: "info" | "success" | "warning" | "danger" | "neutral"; text: string }

const MAP: Record<string, { Icon: LucideIcon; tone: Described["tone"]; verb: string }> = {
  "auth.login_success": { Icon: LogIn, tone: "info", verb: "signed in" },
  "auth.login_failed": { Icon: ShieldAlert, tone: "danger", verb: "had a failed sign-in" },
  "auth.account_locked": { Icon: Ban, tone: "danger", verb: "was locked after failed attempts" },
  "auth.mfa_failed": { Icon: ShieldAlert, tone: "warning", verb: "entered a wrong 2FA code" },
  "auth.mfa_enabled": { Icon: ShieldCheck, tone: "success", verb: "enabled two-factor authentication" },
  "auth.backup_code_used": { Icon: KeyRound, tone: "warning", verb: "used a backup code" },
  "auth.backup_codes_regenerated": { Icon: KeyRound, tone: "info", verb: "regenerated backup codes" },
  "auth.logout": { Icon: LogOut, tone: "neutral", verb: "signed out" },
  "auth.session_revoked": { Icon: LogOut, tone: "neutral", verb: "revoked a session" },
  "auth.token_reuse_detected": { Icon: ShieldAlert, tone: "danger", verb: "triggered a token-reuse alert" },
  "auth.password_changed": { Icon: KeyRound, tone: "info", verb: "changed their password" },
  "auth.password_reset_requested": { Icon: KeyRound, tone: "neutral", verb: "requested a password reset" },
  "auth.password_reset_completed": { Icon: KeyRound, tone: "info", verb: "completed a password reset" },
  "admin.created": { Icon: UserCog, tone: "info", verb: "created administrator" },
  "admin.updated": { Icon: UserCog, tone: "info", verb: "updated administrator" },
  "admin.mfa_reset": { Icon: ShieldAlert, tone: "warning", verb: "reset two-factor for" },
  "admin.password_issued": { Icon: KeyRound, tone: "warning", verb: "issued a new temporary password to" },
  "application.submitted": { Icon: FileText, tone: "info", verb: "was submitted" },
  "application.spam_blocked": { Icon: Ban, tone: "neutral", verb: "A spam submission was blocked" },
  "application.viewed": { Icon: Eye, tone: "neutral", verb: "viewed" },
  "application.accepted": { Icon: CheckCircle2, tone: "success", verb: "accepted" },
  "application.rejected": { Icon: XCircle, tone: "danger", verb: "rejected" },
  "application.note_added": { Icon: StickyNote, tone: "neutral", verb: "added a note to" },
  "application.exported": { Icon: Download, tone: "info", verb: "exported applications" },
  "email.retried": { Icon: Mail, tone: "info", verb: "retried an email for" },
  "email.delivery_failed": { Icon: MailWarning, tone: "danger", verb: "Email delivery failed for" },
};

export function describeAudit(e: AuditEvent): Described {
  const m = MAP[e.action] ?? { Icon: FileText, tone: "neutral" as const, verb: e.action };
  const actor = e.actor_name ?? (e.action === "application.submitted" ? null : "Someone");
  const target = e.target_label ?? "";
  let text: string;
  if (e.action === "application.submitted") text = `${target || "An application"} ${m.verb}`;
  else if (e.action === "application.spam_blocked" || e.action === "email.delivery_failed") text = `${m.verb} ${target}`.trim();
  else text = `${actor} ${m.verb}${target ? ` ${target}` : ""}`;
  return { Icon: m.Icon, tone: m.tone, text };
}

export const AUDIT_GROUPS = [
  { value: "", label: "All activity" }, { value: "auth.", label: "Sign-in & security" }, { value: "application.", label: "Applications" },
  { value: "admin.", label: "Administrators" }, { value: "email.", label: "Email" },
];
