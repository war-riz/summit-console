import { CheckCircle2, Clock3, Mail, MailCheck, MailWarning, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Category, EmailState, Status } from "@/lib/api/types";
import { cn } from "@/lib/cn";

const status = { pending: { tone: "warning", label: "Pending", Icon: Clock3 }, accepted: { tone: "success", label: "Accepted", Icon: CheckCircle2 }, rejected: { tone: "danger", label: "Rejected", Icon: XCircle } } as const;

export function StatusBadge({ value }: { value: Status }) {
  const { tone, label, Icon } = status[value];
  return <Badge tone={tone}><Icon className="size-3" />{label}</Badge>;
}

export function CategoryBadge({ value }: { value: Category }) {
  return <Badge tone={value === "sponsor" ? "navy" : "info"}>{value === "sponsor" ? "Sponsor" : "Member"}</Badge>;
}

const email = {
  queued: { cls: "text-muted-foreground", label: "Queued", Icon: Mail }, sending: { cls: "text-info", label: "Sending", Icon: Mail },
  sent: { cls: "text-success", label: "Sent", Icon: MailCheck }, failed: { cls: "text-warning", label: "Retrying", Icon: MailWarning }, dead: { cls: "text-danger", label: "Failed", Icon: MailWarning },
} as const;

export function EmailStateBadge({ value, label }: { value: EmailState | null; label?: string }) {
  if (!value) return <span className="text-xs text-muted-foreground/60">—</span>;
  const { cls, label: text, Icon } = email[value];
  return <span className={cn("inline-flex items-center gap-1 text-xs font-medium", cls)} title={`${label ? label + ": " : ""}${text}`}><Icon className="size-3.5" />{text}</span>;
}
