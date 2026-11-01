"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationIcon } from "@/features/notifications/notification-item";
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from "@/features/notifications/hooks";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/format";

export function NotificationBell() {
  const router = useRouter();
  const { data: unread = 0 } = useUnreadCount();
  const list = useNotifications(false, 1, 6);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative">
          <Bell className="size-4.5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-background tabular">{unread > 9 ? "9+" : unread}</span>}
        </Button>
      </DropdownTrigger>
      <DropdownContent className="w-[min(92vw,24rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Button variant="ghost" size="sm" disabled={!unread} loading={markAll.isPending} onClick={() => markAll.mutate()}><CheckCheck className="size-4" />Mark all read</Button>
        </div>
        <div className="max-h-88 overflow-y-auto p-1.5">
          {list.isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="m-1.5 h-14" />)}
          {list.data?.items.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>}
          {list.data?.items.map((n) => (
            <button key={n.id} onClick={() => { if (!n.is_read) markRead.mutate(n.id); if (n.link) router.push(n.link); }}
              className={cn("flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted", !n.is_read && "bg-accent/50")}>
              <NotificationIcon severity={n.severity} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2"><span className="truncate text-[13px] font-medium">{n.title}</span>{!n.is_read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground/80">{timeAgo(n.created_at)}</span>
              </span>
            </button>
          ))}
        </div>
        <Link href="/notifications" className="block border-t border-border px-4 py-3 text-center text-[13px] font-medium text-primary hover:bg-muted">View all notifications</Link>
      </DropdownContent>
    </DropdownMenu>
  );
}
