"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/use-me";
import { cn } from "@/lib/cn";
import { daysUntil, formatDate } from "@/lib/format";

/** Priority banner shown on every page until two-factor authentication is switched on. */
export function MfaBanner() {
  const { data: me } = useMe();
  if (!me || me.mfa_enabled) return null;
  const days = me.mfa_required_by ? daysUntil(me.mfa_required_by) : null;
  const urgent = days !== null && days <= 2;
  return (
    <div role="alert" className={cn("mb-6 flex animate-fade-up flex-col gap-3 overflow-hidden rounded-2xl border p-4 sm:flex-row sm:items-center",
      urgent ? "border-danger/40 bg-danger-soft" : "border-warning/40 bg-warning-soft")}>
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-white", urgent ? "bg-danger" : "bg-warning")}><ShieldAlert className="size-6" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Protect your account: set up two-factor authentication</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {days === null ? "It will be required soon. " : days <= 0 ? "It is required from your next sign-in. " : `It becomes mandatory on ${formatDate(me.mfa_required_by)} (${days} day${days === 1 ? "" : "s"} left). `}
          Exporting data and managing administrators stay locked until it is on. It takes about a minute.
        </p>
      </div>
      <Button asChild variant={urgent ? "danger" : "primary"} className="shrink-0"><Link href="/security?setup=1">Set up now</Link></Button>
    </div>
  );
}
