"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckCircle2, ExternalLink, FileSearch, Globe, Mail, MapPin, Phone, QrCode, RotateCw, Send, StickyNote, User, XCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge, EmailStateBadge, StatusBadge } from "./badges";
import { useAddNote, useApplication, useApplicationEmails, useApplicationTimeline, useDecide } from "./hooks";
import { describeAudit } from "@/features/audit/describe";
import { useCan } from "@/hooks/use-me";
import { useConfirm } from "@/providers/confirm-provider";
import { ApiError, api } from "@/lib/api/client";
import type { ApplicationDetail, Decision } from "@/lib/api/types";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/cn";
import { formatDateTime, humanize, timeAgo } from "@/lib/format";

function Info({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground [&_svg]:size-3.5">{icon}{label}</dt>
      <dd className="wrap-break-word text-sm font-medium">{children || <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

const toneCls = { info: "bg-info-soft text-info", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger", neutral: "bg-muted text-muted-foreground" } as const;

export function ApplicationDetailView({ reference }: { reference: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { data: app, isLoading, error, refetch } = useApplication(reference);
  const canAudit = useCan("audit:read").allowed;
  const canNote = useCan("applications:note").allowed;
  const canRetry = useCan("email_logs:retry").allowed;
  const canDecide = useCan("applications:decide").allowed;
  const decide = useDecide(reference);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-28" /><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-96" /></div></div>;
  if (error || !app) {
    const e = error as ApiError | null;
    return <Banner tone={e?.status === 404 ? "warning" : "danger"} title={e?.status === 404 ? "Application not found" : "Couldn't load this application"} action={<><Button variant="outline" size="sm" onClick={() => router.push("/applications")}>Back to list</Button>{e?.status !== 404 && <Button size="sm" className="ml-2" onClick={() => refetch()}>Retry</Button>}</>}>{e?.message}</Banner>;
  }

  const act = async (decision: Decision) => {
    const accept = decision === "accept";
    const reversal = app.status !== "pending";
    const { confirmed, note } = await confirm({
      title: `${reversal ? "Change decision to " : ""}${accept ? "Accept" : "Reject"} ${app.applicant_name}?`,
      description: <>A{accept ? "n acceptance" : " rejection"} email will be sent to <span className="font-medium text-foreground">{app.email}</span>.{reversal && " This replaces the earlier decision and is recorded in the audit log."}</>,
      tone: accept ? "success" : "danger", confirmLabel: accept ? "Accept & send email" : "Reject & send email", note: { label: "Internal note" },
    });
    if (!confirmed) return;
    try { await decide.mutateAsync({ decision, note, confirm_reversal: reversal }); toast.success(`Application ${accept ? "accepted" : "rejected"}`, { description: "The email is being sent." }); }
    catch (e) {
      const err = e as ApiError;
      if (err.code === "ALREADY_DECIDED" || err.code === "CONFLICT") { toast.warning(err.message); refetch(); } else toast.error(err.message);
    }
  };

  const isSponsor = app.category === "sponsor";
  return (
    <>
      <nav className="mb-4 flex items-center gap-1 text-[13px] text-muted-foreground"><Link href="/applications" className="hover:text-foreground hover:underline">Applications</Link><span>/</span><span className="text-foreground">{app.reference}</span></nav>

      <Card spotlight className="mb-4 animate-fade-up p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={app.applicant_name} size="lg" />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{app.applicant_name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge value={app.status} /><CategoryBadge value={app.category} />
                <span className="inline-flex items-center gap-0.5 rounded-lg bg-muted px-2 py-0.5 font-mono text-xs">{app.reference}<CopyButton value={app.reference} label="Copy reference" className="size-6" /></span></div>
              <p className="mt-2 text-xs text-muted-foreground">Submitted {formatDateTime(app.submitted_at)} · {timeAgo(app.submitted_at)}</p>
            </div>
          </div>
          {app.available_actions.length > 0 && (
            <div className="flex shrink-0 flex-wrap gap-2">
              {app.available_actions.includes("reject") && <Button variant="outline" className="border-danger/40 text-danger hover:bg-danger-soft" loading={decide.isPending} onClick={() => act("reject")}><XCircle className="size-4" />Reject</Button>}
              {app.available_actions.includes("accept") && <Button variant="success" loading={decide.isPending} onClick={() => act("accept")}><CheckCircle2 className="size-4" />Accept</Button>}
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card><CardHeader><div><CardTitle>{isSponsor ? "Company & contact" : "Applicant"}</CardTitle><CardDescription>Everything submitted on the form</CardDescription></div></CardHeader>
            <CardContent><dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {isSponsor && <Info icon={<Building2 />} label="Organisation">{app.applicant_name}</Info>}
              <Info icon={<User />} label={isSponsor ? "Contact person" : "Full name"}>{isSponsor ? app.contact_name : app.applicant_name}</Info>
              <Info icon={<Mail />} label="Email"><a href={`mailto:${app.email}`} className="text-primary hover:underline">{app.email}</a></Info>
              <Info icon={<Phone />} label="Phone"><a href={`tel:${app.phone}`} className="hover:underline">{app.phone}</a></Info>
              {app.job_title && <Info icon={<User />} label="Job title">{app.job_title}</Info>}
              {!isSponsor && <Info icon={<Building2 />} label="Organisation">{app.organisation}</Info>}
              <Info icon={<MapPin />} label={isSponsor ? "Company address" : "Location"}>{app.location}</Info>
              {app.website && <Info icon={<Globe />} label="Website"><a href={app.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary hover:underline">{app.website.replace(/^https?:\/\//, "")}<ExternalLink className="size-3" /></a></Info>}
              {app.how_did_you_hear && <Info label="Heard about us via">{app.how_did_you_hear}</Info>}
            </dl></CardContent></Card>

          {(app.sponsorship_interest || app.message || Object.keys(app.additional_answers).length > 0) && (
            <Card><CardHeader><CardTitle>{isSponsor ? "Sponsorship interest" : "Additional answers"}</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {app.sponsorship_interest && <div><p className="mb-1 text-xs font-medium text-muted-foreground">Interested in</p><Badge tone="info">{app.sponsorship_interest}</Badge></div>}
                {app.message && <div><p className="mb-1 text-xs font-medium text-muted-foreground">Message</p><p className="whitespace-pre-wrap text-sm leading-relaxed">{app.message}</p></div>}
                {Object.entries(app.additional_answers).map(([q, a]) => <div key={q}><p className="mb-1 text-xs font-medium text-muted-foreground">{q}</p><p className="text-sm">{a}</p></div>)}
              </CardContent></Card>
          )}

          <Notes app={app} canNote={canNote} />
        </div>

        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Decision</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Status</span><StatusBadge value={app.status} /></div>
              {app.decided_at ? (<>
                <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Decided by</span><span className="font-medium">{app.decided_by_name}</span></div>
                <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">On</span><span className="text-right font-medium">{formatDateTime(app.decided_at)}</span></div>
                {app.decision_note && <div className="rounded-xl bg-muted/60 p-3 text-[13px]"><p className="mb-0.5 text-xs font-medium text-muted-foreground">Internal note</p>{app.decision_note}</div>}
              </>) : <p className="text-[13px] text-muted-foreground">Waiting for a decision. The applicant gets an email as soon as you accept or reject.</p>}
            </CardContent></Card>
          {app.status === "accepted" && <AttendanceCard app={app} canResend={canDecide} />}
          <EmailPanel reference={reference} canRetry={canRetry} />
          {canAudit && <Timeline reference={reference} />}
        </div>
      </div>
    </>
  );
}

function Notes({ app, canNote }: { app: ApplicationDetail; canNote: boolean }) {
  const [text, setText] = React.useState("");
  const add = useAddNote(app.reference);
  const submit = async () => {
    if (!text.trim()) return;
    try { await add.mutateAsync(text.trim()); setText(""); toast.success("Note added"); } catch (e) { toast.error((e as ApiError).message); }
  };
  return (
    <Card>
      <CardHeader><div><CardTitle>Internal notes</CardTitle><CardDescription>Visible to administrators only. Never emailed.</CardDescription></div><StickyNote className="size-4 text-muted-foreground" /></CardHeader>
      <CardContent className="space-y-4">
        {canNote && (
          <div className="space-y-2">
            <Textarea value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} placeholder="Add a note for your team…" aria-label="New note" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(); }} />
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Ctrl/⌘ + Enter to save</span><Button size="sm" loading={add.isPending} disabled={!text.trim()} onClick={submit}><Send className="size-4" />Add note</Button></div>
          </div>
        )}
        {app.notes.length === 0 ? <p className="py-2 text-center text-sm text-muted-foreground">No notes yet.</p> : (
          <ul className="space-y-3">{[...app.notes].reverse().map((n) => (
            <li key={n.id} className="flex gap-3"><Avatar name={n.author_name} size="sm" /><div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-muted/60 px-3.5 py-2.5">
              <p className="text-xs"><span className="font-semibold">{n.author_name}</span><span className="text-muted-foreground"> · {timeAgo(n.created_at)}</span></p><p className="mt-0.5 whitespace-pre-wrap text-sm">{n.text}</p></div></li>))}</ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmailPanel({ reference, canRetry }: { reference: string; canRetry: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useApplicationEmails(reference);
  const retry = useMutation({
    mutationFn: (id: string) => api.post(`/admin/email-logs/${id}/retry`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk.appEmails(reference) }); qc.invalidateQueries({ queryKey: qk.application(reference) }); },
  });
  return (
    <Card><CardHeader><div><CardTitle>Email delivery</CardTitle><CardDescription>Confirmation and decision emails</CardDescription></div></CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <Skeleton className="h-20" /> : !data?.length ? <p className="text-[13px] text-muted-foreground">No emails yet.</p> : data.map((l) => (
          <div key={l.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-medium">{humanize(l.kind.replace("application_", ""))}</p><EmailStateBadge value={l.status} /></div>
            <p className="mt-0.5 text-xs text-muted-foreground">{l.sent_at ? `Sent ${timeAgo(l.sent_at)}` : `Created ${timeAgo(l.created_at)}`} · {l.attempts} attempt{l.attempts === 1 ? "" : "s"}</p>
            {l.last_error && <p className="mt-2 rounded-lg bg-danger-soft px-2.5 py-1.5 text-xs text-danger">{l.last_error}</p>}
            {canRetry && (l.status === "dead" || l.status === "failed") && l.retryable && (
              <Button size="sm" variant="outline" className="mt-2.5 w-full" loading={retry.isPending && retry.variables === l.id}
                onClick={async () => { try { const r = await retry.mutateAsync(l.id); toast.success((r as { status?: string })?.status === "sent" ? "Email sent" : "Retry queued"); } catch (e) { toast.error((e as ApiError).message); } }}><RotateCw className="size-4" />Retry now</Button>
            )}
          </div>))}
      </CardContent></Card>
  );
}

function Timeline({ reference }: { reference: string }) {
  const { data, isLoading } = useApplicationTimeline(reference, true);
  const events = (data ?? []).filter((e) => e.action !== "application.viewed");
  return (
    <Card><CardHeader><div><CardTitle>Activity</CardTitle><CardDescription>Audit trail for this application</CardDescription></div><FileSearch className="size-4 text-muted-foreground" /></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-32" /> : events.length === 0 ? <p className="text-[13px] text-muted-foreground">No activity recorded.</p> : (
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-border">
            {events.map((e) => { const { Icon, tone, text } = describeAudit(e); return (
              <li key={e.id} className="relative flex gap-3"><span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-card", toneCls[tone])}><Icon className="size-4" /></span>
                <div className="min-w-0 pt-0.5"><p className="text-[13px] leading-snug">{text}</p><p className="text-[11px] text-muted-foreground" title={formatDateTime(e.created_at)}>{timeAgo(e.created_at)}</p></div></li>); })}
          </ol>
        )}
      </CardContent></Card>
  );
}

function AttendanceCard({ app, canResend }: { app: ApplicationDetail; canResend: boolean }) {
  const days = Object.entries(app.check_ins ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const resend = useMutation({ mutationFn: () => api.post(`/admin/checkin/${app.reference}/resend-pass`) });
  return (
    <Card><CardHeader><div><CardTitle>Entry pass &amp; attendance</CardTitle><CardDescription>QR pass is in the acceptance email</CardDescription></div><QrCode className="size-4 text-muted-foreground" /></CardHeader>
      <CardContent className="space-y-3">
        {days.length === 0 ? <p className="text-[13px] text-muted-foreground">Not checked in yet.</p> : (
          <ul className="space-y-2">{days.map(([day, c]) => (
            <li key={day} className="flex items-center justify-between rounded-xl bg-success-soft px-3 py-2 text-[13px]"><span className="font-medium text-success">{day}</span><span className="text-muted-foreground">{formatDateTime(c.at)}{c.by_name ? ` · ${c.by_name}` : ""}</span></li>))}</ul>
        )}
        {canResend && <Button variant="outline" size="sm" className="w-full" loading={resend.isPending}
          onClick={async () => { try { await resend.mutateAsync(); toast.success("Entry pass emailed again"); } catch (e) { toast.error((e as ApiError).message); } }}><Send className="size-4" />Email entry pass again</Button>}
      </CardContent></Card>
  );
}
