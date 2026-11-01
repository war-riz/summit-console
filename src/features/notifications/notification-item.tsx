import { CircleCheck, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NotificationSeverity } from "@/lib/api/types";

const map = {
  info: { Icon: Info, cls: "bg-info-soft text-info" },
  success: { Icon: CircleCheck, cls: "bg-success-soft text-success" },
  warning: { Icon: TriangleAlert, cls: "bg-warning-soft text-warning" },
  critical: { Icon: OctagonAlert, cls: "bg-danger-soft text-danger" },
} as const;

export function NotificationIcon({ severity }: { severity: NotificationSeverity }) {
  const { Icon, cls } = map[severity] ?? map.info;
  return <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", cls)}><Icon className="size-4.5" /></span>;
}
