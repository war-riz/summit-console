"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { NotificationIcon } from "./notification-item";
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from "./hooks";
import { cn } from "@/lib/cn";
import { formatDateTime, timeAgo } from "@/lib/format";

export function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<"all" | "unread">("all");
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useNotifications(tab === "unread", page, 20);
  const { data: unread = 0 } = useUnreadCount();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  return (
    <>
      <PageHeader title="Notifications" description="New applications, decisions by your colleagues, email problems and security events."
        actions={<Button variant="outline" disabled={!unread} loading={markAll.isPending} onClick={() => markAll.mutate()}><CheckCheck className="size-4" />Mark all as read</Button>} />
      <Tabs className="mb-4" value={tab} onChange={(v) => { setTab(v); setPage(1); }} items={[{ value: "all", label: "All" }, { value: "unread", label: "Unread", count: unread }]} />
      <Card>
        {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          : !data?.items.length ? <EmptyState icon={<BellOff />} title={tab === "unread" ? "You're all caught up" : "No notifications yet"} description="New activity will show up here, and as a pop-up while you work." />
          : (<>
            <ul className="divide-y divide-border">
              {data.items.map((n) => (
                <li key={n.id}>
                  <button onClick={() => { if (!n.is_read) markRead.mutate(n.id); if (n.link) router.push(n.link); }}
                    className={cn("flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/60", !n.is_read && "bg-accent/40")}>
                    <NotificationIcon severity={n.severity} />
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-sm font-semibold">{n.title}</span>{!n.is_read && <span className="size-2 rounded-full bg-primary" />}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span></span>
                    <span className="shrink-0 text-right text-xs text-muted-foreground" title={formatDateTime(n.created_at)}>{timeAgo(n.created_at)}</span>
                  </button>
                </li>))}
            </ul>
            <Pagination pagination={data.pagination} onPage={setPage} />
          </>)}
      </Card>
    </>
  );
}
