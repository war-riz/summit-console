"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { APP_NAME } from "@/lib/constants";
import { useMe } from "@/hooks/use-me";
import { useApplications } from "@/features/applications/hooks";
import { useUnreadCount } from "@/features/notifications/hooks";
import { Avatar } from "@/components/ui/avatar";
import { BrandMark } from "./brand-mark";
import { NAV, isActive } from "./nav";

interface SidebarProps { collapsed?: boolean; onToggle?: () => void; onNavigate?: () => void }

export function Sidebar({ collapsed, onToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: me } = useMe();
  const pending = useApplications({ status: "pending", page_size: 1 }, !!me?.permissions.includes("applications:read"));
  const unread = useUnreadCount();
  const badges = { pending: pending.data?.pagination.total_items ?? 0, unread: unread.data ?? 0, security: me && !me.mfa_enabled ? 1 : 0 };

  return (
    <div className="relative flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-linear-to-b from-sidebar to-sidebar-deep text-sidebar-foreground">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand-sky/20 blur-3xl" />
      <div className={cn("relative flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4", collapsed && "justify-center px-0")}>
        <BrandMark className="size-9" />
        {!collapsed && (<div className="min-w-0 leading-tight"><p className="truncate text-[15px] font-semibold">{APP_NAME}</p><p className="truncate text-[11px] text-sidebar-muted">D-OLF Hydrometric</p></div>)}
      </div>

      <nav aria-label="Main" className="relative flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV.map((section) => {
          const items = section.items.filter((i) => !i.permission || me?.permissions.includes(i.permission));
          if (!items.length) return null;
          return (
            <div key={section.label}>
              {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">{section.label}</p>}
              <ul className="space-y-1">
                {items.map(({ href, label, icon: Icon, badge, permission }) => {
                  const active = isActive(pathname, href);
                  const count = badge ? badges[badge] : 0;
                  const locked = !!permission && !!me?.locked_permissions.includes(permission);
                  return (
                    <li key={href}>
                      <Link href={href} onClick={onNavigate} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined}
                        className={cn("group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", collapsed && "justify-center px-0",
                          active ? "bg-sidebar-active text-sidebar-active-foreground shadow-[inset_0_0_0_1px_var(--sidebar-border)]" : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground")}>
                        {active && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-sky" />}
                        <Icon className="size-4.5 shrink-0" />
                        {!collapsed && <span className="flex-1 truncate">{label}</span>}
                        {!collapsed && locked && <Lock className="size-3.5 opacity-70" />}
                        {count > 0 && !collapsed && (
                          <span className={cn("min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular", badge === "security" ? "bg-danger text-white" : "bg-brand-sky text-[#04122a]")}>
                            {badge === "security" ? "!" : count > 99 ? "99+" : count}
                          </span>
                        )}
                        {count > 0 && collapsed && <span className={cn("absolute right-2.5 top-2 size-2 rounded-full", badge === "security" ? "bg-danger" : "bg-brand-sky")} />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="relative shrink-0 border-t border-sidebar-border p-3">
        {me && (
          <div className={cn("flex items-center gap-3 rounded-xl bg-sidebar-hover p-2.5", collapsed && "justify-center bg-transparent p-0")}>
            <Avatar name={me.name} size="md" />
            {!collapsed && (<div className="min-w-0 leading-tight"><p className="truncate text-[13px] font-medium">{me.name}</p><p className="truncate text-[11px] capitalize text-sidebar-muted">{me.role.replace("_", " ")}</p></div>)}
          </div>
        )}
        {onToggle && (
          <button onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("mt-2 hidden w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground lg:flex", collapsed && "justify-center px-0")}>
            {collapsed ? <PanelLeftOpen className="size-4" /> : <><PanelLeftClose className="size-4" />Collapse</>}
          </button>
        )}
      </div>
    </div>
  );
}