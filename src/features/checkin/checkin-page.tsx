"use client";

import * as React from "react";
import { CircleCheck, OctagonAlert, QrCode, ScanLine, Search, TriangleAlert, Undo2, Users, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { QrScanner } from "@/components/ui/qr-scanner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { CategoryBadge } from "@/features/applications/badges";
import { useAttendees, useCheckin, useCheckinStats, useUndoCheckin } from "./hooks";
import { useCan } from "@/hooks/use-me";
import { useDebounce } from "@/hooks/use-debounce";
import { ApiError } from "@/lib/api/client";
import type { Attendee } from "@/lib/api/types";
import { feedback } from "@/lib/feedback";
import { cn } from "@/lib/cn";
import { formatDateTime, formatNumber, timeAgo } from "@/lib/format";

type Outcome = { tone: "success" | "warn" | "error"; title: string; detail?: string; attendee?: Pick<Attendee, "applicant_name" | "category" | "organisation" | "job_title" | "reference"> };

const tones = {
    success: { box: "border-success/40 bg-success-soft", icon: "bg-success text-white", Icon: CircleCheck },
    warn: { box: "border-warning/40 bg-warning-soft", icon: "bg-warning text-white", Icon: TriangleAlert },
    error: { box: "border-danger/40 bg-danger-soft", icon: "bg-danger text-white", Icon: OctagonAlert },
} as const;

/** Turns an API refusal into something a volunteer can act on in one second. */
function explain(e: unknown): Outcome {
    if (!(e instanceof ApiError)) return { tone: "error", title: "Something went wrong", detail: "Check the connection and try again." };
    const f = Object.fromEntries((e.details ?? []).map((d) => [d.field, d.message]));
    const attendee = f.applicant_name ? { applicant_name: f.applicant_name, reference: f.reference ?? "", category: "member" as const, organisation: null, job_title: null } : undefined;
    switch (e.code) {
        case "ALREADY_CHECKED_IN": return { tone: "warn", title: "Already checked in", detail: e.message, attendee };
        case "NOT_ACCEPTED": return { tone: "error", title: "Not accepted", detail: `${e.message} Send them to the registration desk.`, attendee };
        case "PASS_INVALID": return { tone: "error", title: "Not a valid pass", detail: "This QR code was not issued by the summit system." };
        case "PASS_NOT_FOUND": return { tone: "error", title: "No matching registration", detail: e.message };
        default: return { tone: "error", title: "Couldn't check in", detail: e.message };
    }
}

export function CheckinPage() {
    const stats = useCheckinStats();
    const checkin = useCheckin();
    const canUndo = useCan("applications:decide").allowed;
    const undo = useUndoCheckin();
    const [tab, setTab] = React.useState<"scan" | "manual">("scan");
    const [outcome, setOutcome] = React.useState<Outcome | null>(null);
    const [sound, setSound] = React.useState(true);
    const [pausedUntil, setPausedUntil] = React.useState(0);
    const lastCode = React.useRef({ code: "", at: 0 });
    const clear = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    const run = React.useCallback(async (code: string, method: "scan" | "manual") => {
        clearTimeout(clear.current);
        let result: Outcome;
        try {
            const r = await checkin.mutateAsync({ code, method });
            result = { tone: "success", title: "Checked in", attendee: r.attendee, detail: r.attendee.job_title ?? undefined };
        } catch (e) { result = explain(e); }
        setOutcome(result); feedback(result.tone, sound);
        clear.current = setTimeout(() => setOutcome(null), 6000);
    }, [checkin, sound]);

    const onScan = React.useCallback((text: string) => {
        const now = Date.now();
        if (now < pausedUntil || checkin.isPending) return;
        if (lastCode.current.code === text && now - lastCode.current.at < 4000) return; // same QR still in view
        lastCode.current = { code: text, at: now };
        setPausedUntil(now + 1800);
        run(text, "scan");
    }, [checkin.isPending, pausedUntil, run]);

    const s = stats.data;
    const pct = s && s.expected ? Math.round((s.checked_in / s.expected) * 100) : 0;
    const o = outcome && tones[outcome.tone];

    return (
        <>
            <PageHeader title="Check-in" description={!s ? "Scan entry passes at the door." : s.mode === "event" ? "Each person is checked in once for the whole event." : `Entry for ${new Date(s.day + "T12:00:00Z").toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}. Each person can be checked in once per day.`}
                actions={<Button variant="outline" size="icon" aria-label={sound ? "Mute sounds" : "Turn sounds on"} onClick={() => setSound((v) => !v)}>{sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}</Button>} />

            <Card spotlight className="mb-4 p-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div><p className="text-[13px] font-medium text-muted-foreground">{s?.mode === "event" ? "Checked in" : "Checked in today"}</p>
                        <p className="text-4xl font-semibold tabular">{s ? formatNumber(s.checked_in) : "–"}<span className="text-xl text-muted-foreground"> / {s ? formatNumber(s.expected) : "–"}</span></p></div>
                    <div className="flex gap-6 text-sm">{s && Object.entries(s.by_category).map(([c, v]) => (
                        <div key={c}><p className="text-xs capitalize text-muted-foreground">{c}s</p><p className="font-semibold tabular">{v.checked_in}<span className="font-normal text-muted-foreground"> / {v.expected}</span></p></div>))}
                        <div><p className="text-xs text-muted-foreground">Still to arrive</p><p className="font-semibold tabular">{s?.remaining ?? "–"}</p></div></div>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-linear-to-r from-brand-sky to-success transition-all duration-700" style={{ width: `${pct}%` }} /></div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-5">
                <div className="space-y-4 lg:col-span-3">
                    <Tabs value={tab} onChange={setTab} items={[{ value: "scan", label: "Scan QR" }, { value: "manual", label: "Manual" }]} />
                    {o && outcome && (
                        <div role="status" aria-live="assertive" className={cn("flex animate-fade-up items-center gap-4 rounded-2xl border-2 p-4", o.box)}>
                            <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl", o.icon)}><o.Icon className="size-8" /></span>
                            <div className="min-w-0 flex-1"><p className="text-lg font-semibold leading-tight">{outcome.title}</p>
                                {outcome.attendee && <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">{outcome.attendee.applicant_name}</span>{outcome.tone === "success" && <CategoryBadge value={outcome.attendee.category} />}</p>}
                                {outcome.tone === "success" && outcome.attendee?.organisation && <p className="text-[13px] text-muted-foreground">{outcome.attendee.organisation}</p>}
                                {outcome.detail && <p className="mt-0.5 text-[13px] text-muted-foreground">{outcome.detail}</p>}</div>
                        </div>
                    )}
                    {tab === "scan" ? (
                        <Card className="mx-auto max-w-md p-3"><QrScanner onScan={onScan} paused={checkin.isPending} />
                            <p className="px-2 pb-1 pt-3 text-center text-[13px] text-muted-foreground"><ScanLine className="mr-1 inline size-4" />Point the camera at the guest&apos;s QR code</p></Card>
                    ) : <Manual onCheckin={(ref) => run(ref, "manual")} busy={checkin.isPending} canUndo={canUndo} onUndo={(ref) => undo.mutate(ref, { onSuccess: () => toast.success("Check-in undone") })} />}
                </div>

                <Card className="lg:col-span-2">
                    <CardHeader><div><CardTitle>Recent check-ins</CardTitle><CardDescription>Latest arrivals today</CardDescription></div><Users className="size-4 text-muted-foreground" /></CardHeader>
                    <CardContent>{!s ? <Skeleton className="h-48" /> : s.recent.length === 0 ? <EmptyState icon={<QrCode />} title="No one yet" description="Arrivals appear here as they are scanned." className="py-8" /> : (
                        <ul className="space-y-3">{s.recent.map((r) => (
                            <li key={r.reference + r.checked_in_at} className="flex items-center gap-3"><Avatar name={r.applicant_name} size="sm" />
                                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.applicant_name}</p><p className="truncate text-xs text-muted-foreground" title={formatDateTime(r.checked_in_at)}>{timeAgo(r.checked_in_at)}{r.checked_in_by_name ? ` · ${r.checked_in_by_name}` : ""}</p></div>
                                {r.method === "manual" && <Badge tone="outline">manual</Badge>}</li>))}</ul>)}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function Manual({ onCheckin, busy, canUndo, onUndo }: { onCheckin: (ref: string) => void; busy: boolean; canUndo: boolean; onUndo: (ref: string) => void }) {
    const [q, setQ] = React.useState("");
    const debounced = useDebounce(q.trim(), 300);
    const { data, isLoading } = useAttendees(debounced, undefined);
    const looksLikeReference = /^SWF-[MS]-[A-Z0-9]{6}$/i.test(q.trim());
    return (
        <Card className="p-4"><div className="space-y-3">
            <form onSubmit={(e) => { e.preventDefault(); if (looksLikeReference) { onCheckin(q.trim()); setQ(""); } }}>
                <Input value={q} onChange={(e) => setQ(e.target.value)} icon={<Search />} placeholder="Type a name, or a reference like SWF-M-7K3QX9" aria-label="Search attendees" autoFocus />
                {looksLikeReference && <Button type="submit" className="mt-3 w-full" loading={busy}>Check in {q.trim().toUpperCase()}</Button>}
            </form>
            {isLoading ? <Skeleton className="h-40" /> : !data?.items.length ? <p className="py-6 text-center text-sm text-muted-foreground">No accepted attendee matches.</p> : (
                <ul className="divide-y divide-border">{data.items.map((a) => (
                    <li key={a.reference} className="flex items-center gap-3 py-3"><Avatar name={a.applicant_name} />
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.applicant_name}</p><p className="truncate text-xs text-muted-foreground">{a.organisation ?? a.reference}</p></div>
                        {a.checked_in_at ? (<><Badge tone="success"><CircleCheck className="size-3" />In</Badge>{canUndo && <Button size="icon-sm" variant="ghost" aria-label={`Undo check-in for ${a.applicant_name}`} onClick={() => onUndo(a.reference)}><Undo2 className="size-4" /></Button>}</>)
                            : <Button size="sm" loading={busy} onClick={() => onCheckin(a.reference)}>Check in</Button>}</li>))}</ul>)}
        </div></Card>
    );
}