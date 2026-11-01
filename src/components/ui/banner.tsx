import * as React from "react";
import { CircleCheck, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

const tones = {
  info: { box: "border-info/25 bg-info-soft", icon: "text-info", Icon: Info },
  success: { box: "border-success/25 bg-success-soft", icon: "text-success", Icon: CircleCheck },
  warning: { box: "border-warning/30 bg-warning-soft", icon: "text-warning", Icon: TriangleAlert },
  danger: { box: "border-danger/30 bg-danger-soft", icon: "text-danger", Icon: OctagonAlert },
} as const;

interface BannerProps { tone?: keyof typeof tones; title: string; children?: React.ReactNode; action?: React.ReactNode; className?: string }

export function Banner({ tone = "info", title, children, action, className }: BannerProps) {
  const { box, icon, Icon } = tones[tone];
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn("flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center", box, className)}>
      <Icon className={cn("size-5 shrink-0", icon)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {children && <div className="mt-0.5 text-[13px] text-muted-foreground">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
