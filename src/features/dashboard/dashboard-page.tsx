"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, Clock3, Hourglass, Mail, RefreshCw, Users, XCircle, Handshake } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { StatusDonut } from "@/components/charts/status-donut";
import { TrendChart } from "@/components/charts/trend-chart";
import { CategoryBadge, EmailStateBadge, StatusBadge } from "@/features/applications/badges";
import { describeAudit } from "@/features/audit/describe";
import { useDashboardStats } from "./hooks";
import { useMe } from "@/hooks/use-me";
import { cn } from "@/lib/cn";
import { greeting, timeAgo } from "@/lib/format";

const toneCls = { info: "bg-info-soft text-info", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger", neutral: "bg-muted text-muted-foreground" } as const;

export function DashboardPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const [days, setDays] = React.useState(14);
  const allowed = !!me?.permissions.includes("dashboard:read");
  const { data, isLoading, isError, isFetching, refetch } = useDashboardStats(days, allowed);
  React.useEffect(() => { // event-day volunteers have no dashboard: send them to their own page
    if (me && !allowed) router.replace(me.permissions.includes("checkin:operate") ? "/check-in" : "/security");
  }, [me, allowed, router]);
  const canSeeApps = !!me?.permissions.includes("applications:read");
  const first = me?.name.split(" ")[0] ?? "";

  if (isError) return <Banner tone="danger" title="Couldn't load the dashboard" action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}>The server did not respond. If the API was idle it can take about 30 seconds to wake up.</Banner>;
  const c = data?.cards;

  return (
    <>
      <PageHeader title={<>{greeting()}{first && <>, <span className="text-gradient">{first}</span></>}</>} description="Here's what's happening with summit applications."
        actions={<>
          <Tabs value={String(days)} onChange={(v) => setDays(Number(v))} items={[{ value: "7", label: "7d" }, { value: "14", label: "14d" }, { value: "30", label: "30d" }, { value: "90", label: "90d" }]} />
          <Button variant="outline" size="icon" aria-label="Refresh" onClick={() => refetch()}><RefreshCw className={cn("size-4", isFetching && "animate-spin")} /></Button>
        </>} />

      {data && data.decisions.pending_over_48h > 0 && canSeeApps && (
        <Banner tone="warning" className="mb-6" title={`${data.decisions.pending_over_48h} application${data.decisions.pending_over_48h === 1 ? " has" : "s have"} been waiting more than 48 hours`}
          action={<Button asChild variant="outline" size="sm"><Link href="/applications?status=pending&sort=submitted_at">Review oldest first<ArrowRight className="size-4" /></Link></Button>}>Applicants are waiting for a decision.</Banner>
      )}

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={c?.total} loading={isLoading} icon={<Building2 />} tone="navy" href="/applications" delay={0}
          hint={c && <span className="inline-flex items-center gap-3"><span className="inline-flex items-center gap-1"><Users className="size-3.5" />{c.members} members</span><span className="inline-flex items-center gap-1"><Handshake className="size-3.5" />{c.sponsors} sponsors</span></span>} />
        <StatCard label="Awaiting decision" value={c?.pending} loading={isLoading} icon={<Hourglass />} tone="warning" href="/applications?status=pending" delay={60} hint="Pending review" />
        <StatCard label="Accepted" value={c?.accepted} loading={isLoading} icon={<CheckCircle2 />} tone="success" href="/applications?status=accepted" delay={120}
          hint={data?.decisions.acceptance_rate != null ? `${data.decisions.acceptance_rate}% of decided` : "No decisions yet"} />
        <StatCard label="Rejected" value={c?.rejected} loading={isLoading} icon={<XCircle />} tone="danger" href="/applications?status=rejected" delay={180} hint="Notified by email" />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><div><CardTitle>Submissions over time</CardTitle><CardDescription>Daily new applications, last {days} days</CardDescription></div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-sky" />Members</span><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#6d5cf0]" />Sponsors</span></div></CardHeader>
          <CardContent>{data ? <TrendChart data={data.trend} /> : <Skeleton className="h-72" />}</CardContent>
        </Card>
        <Card>
          <CardHeader><div><CardTitle>Decision status</CardTitle><CardDescription>All applications</CardDescription></div></CardHeader>
          <CardContent className="flex min-h-72 items-center justify-center">{c ? <StatusDonut pending={c.pending} accepted={c.accepted} rejected={c.rejected} /> : <Skeleton className="size-44 rounded-full" />}</CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card padded>
          <div className="flex items-center justify-between"><CardTitle>Email delivery</CardTitle><Mail className="size-4 text-muted-foreground" /></div>
          {data ? (
            <>
              <p className="mt-4 text-4xl font-semibold tabular">{data.email_health.delivery_rate !== null ? `${data.email_health.delivery_rate}%` : "—"}</p>
              <p className="text-[13px] text-muted-foreground">delivered successfully</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success transition-all duration-700" style={{ width: `${data.email_health.delivery_rate ?? 0}%` }} /></div>
              <dl className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                {([["Sent", data.email_health.sent, "text-success"], ["Queued", data.email_health.queued, "text-info"], ["Retrying", data.email_health.failed, "text-warning"], ["Failed", data.email_health.dead, "text-danger"]] as const).map(([l, v, cls]) => (
                  <div key={l} className="rounded-lg bg-muted/60 py-2"><dt className="text-muted-foreground">{l}</dt><dd className={cn("text-base font-semibold tabular", v > 0 && cls)}>{v}</dd></div>))}
              </dl>
              {data.email_health.dead > 0 && <Button asChild variant="soft" size="sm" className="mt-4 w-full"><Link href="/email-log?status=dead">Review failed emails</Link></Button>}
            </>
          ) : <Skeleton className="mt-4 h-40" />}
        </Card>
        <Card padded>
          <div className="flex items-center justify-between"><CardTitle>Decision speed</CardTitle><Clock3 className="size-4 text-muted-foreground" /></div>
          {data ? (
            <>
              <p className="mt-4 text-4xl font-semibold tabular">{data.decisions.average_hours_to_decision !== null ? `${data.decisions.average_hours_to_decision}h` : "—"}</p>
              <p className="text-[13px] text-muted-foreground">average time to decide</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li className="flex justify-between"><span className="text-muted-foreground">Acceptance rate</span><span className="font-semibold tabular">{data.decisions.acceptance_rate !== null ? `${data.decisions.acceptance_rate}%` : "—"}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">Waiting over 48h</span><Badge tone={data.decisions.pending_over_48h ? "warning" : "success"}>{data.decisions.pending_over_48h}</Badge></li>
              </ul>
            </>
          ) : <Skeleton className="mt-4 h-40" />}
        </Card>
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="pt-3">
            {!data ? <Skeleton className="h-40" /> : data.recent_activity.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nothing yet.</p> : (
              <ul className="space-y-3.5">
                {data.recent_activity.slice(0, 6).map((e) => {
                  const { Icon, tone, text } = describeAudit(e);
                  return (<li key={e.id} className="flex items-start gap-3"><span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", toneCls[tone])}><Icon className="size-4" /></span>
                    <div className="min-w-0"><p className="text-[13px] leading-snug">{text}</p><p className="text-[11px] text-muted-foreground">{timeAgo(e.created_at)}</p></div></li>);
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {canSeeApps && (
        <Card className="mt-4">
          <CardHeader><div><CardTitle>Latest applications</CardTitle><CardDescription>The most recent submissions</CardDescription></div>
            <Button asChild variant="ghost" size="sm"><Link href="/applications">View all<ArrowRight className="size-4" /></Link></Button></CardHeader>
          <div className="mt-3">
            {!data ? <div className="space-y-2 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div> : data.recent_applications.length === 0 ? (
              <EmptyState icon={<Building2 />} title="No applications yet" description="They will appear here as soon as someone submits the registration form." />
            ) : (
              <TableWrap><Table>
                <thead><tr><Th>Applicant</Th><Th>Type</Th><Th>Status</Th><Th>Email</Th><Th>Submitted</Th></tr></thead>
                <tbody>
                  {data.recent_applications.map((a) => (
                    <Tr key={a.id} clickable onClick={() => router.push(`/applications/${a.reference}`)}>
                      <Td><div className="flex items-center gap-3"><Avatar name={a.applicant_name} size="sm" /><div className="min-w-0"><p className="truncate font-medium">{a.applicant_name}</p><p className="truncate text-xs text-muted-foreground">{a.reference}</p></div></div></Td>
                      <Td><CategoryBadge value={a.category} /></Td><Td><StatusBadge value={a.status} /></Td>
                      <Td><EmailStateBadge value={a.email_status.received} /></Td><Td className="whitespace-nowrap text-muted-foreground">{timeAgo(a.submitted_at)}</Td>
                    </Tr>))}
                </tbody>
              </Table></TableWrap>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
