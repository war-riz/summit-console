"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarDays, ScrollText, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { AUDIT_GROUPS, describeAudit } from "./describe";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { api, type ApiError } from "@/lib/api/client";
import type { AuditEvent } from "@/lib/api/types";
import { qk } from "@/lib/query-keys";
import { cn } from "@/lib/cn";
import { formatDateTime, timeAgo } from "@/lib/format";

const DEFAULTS = { action: "", outcome: "", target: "", date_from: "", date_to: "", page: "1", page_size: "20" };
const toneCls = { info: "bg-info-soft text-info", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger", neutral: "bg-muted text-muted-foreground" } as const;

export function AuditPage() {
  const { state, set } = useUrlState(DEFAULTS);
  const [target, setTarget] = React.useState(state.target);
  const debounced = useDebounce(target, 400);
  React.useEffect(() => { if (debounced !== state.target) set({ target: debounced }); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = React.useState<AuditEvent | null>(null);
  const query = { ...state, page: Number(state.page), page_size: Number(state.page_size) };
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.audit(query), placeholderData: keepPreviousData,
    queryFn: ({ signal }) => api.page<AuditEvent>("/admin/audit-logs", query, signal),
  });
  const hasFilters = !!(state.action || state.outcome || state.target || state.date_from || state.date_to);

  return (
    <>
      <PageHeader title="Audit log" description="A permanent record of sign-ins, decisions, exports and security events. Entries cannot be edited or deleted." />
      <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(2,minmax(0,1fr))_minmax(0,1.3fr)_repeat(2,minmax(0,1fr))_auto]">
        <Select aria-label="Event type" value={state.action} onChange={(e) => set({ action: e.target.value })}>{AUDIT_GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</Select>
        <Select aria-label="Outcome" value={state.outcome} onChange={(e) => set({ outcome: e.target.value })}><option value="">Any outcome</option><option value="success">Success</option><option value="failure">Failure</option></Select>
        <Input value={target} onChange={(e) => setTarget(e.target.value)} icon={<Search />} placeholder="Application reference" aria-label="Application reference" />
        <Input type="date" aria-label="From" icon={<CalendarDays />} value={state.date_from} onChange={(e) => set({ date_from: e.target.value })} className="pr-2 text-[13px]" />
        <Input type="date" aria-label="Until" icon={<CalendarDays />} value={state.date_to} onChange={(e) => set({ date_to: e.target.value })} className="pr-2 text-[13px]" />
        {hasFilters && <Button variant="ghost" className="col-span-full justify-self-end lg:col-span-1 lg:justify-self-auto" onClick={() => { setTarget(""); set({ action: "", outcome: "", target: "", date_from: "", date_to: "" }); }}><X className="size-4" />Clear</Button>}
      </Card>

      {isError && <Banner tone="danger" className="mb-4" title="Couldn't load the audit log" action={<Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>}>{(error as ApiError).message}</Banner>}
      <Card>
        {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          : !data?.items.length ? <EmptyState icon={<ScrollText />} title="No events found" description={hasFilters ? "Try widening the filters." : "Activity will be recorded here."} />
            : (<>
              <TableWrap><Table>
                <thead><tr><Th>Event</Th><Th>Who</Th><Th>Target</Th><Th>IP address</Th><Th>When</Th></tr></thead>
                <tbody>{data.items.map((e) => {
                  const { Icon, tone, text } = describeAudit(e); return (
                    <Tr key={e.id} clickable onClick={() => setOpen(e)}>
                      <Td><div className="flex items-center gap-3"><span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", toneCls[tone])}><Icon className="size-4" /></span>
                        <div className="min-w-0"><p className="truncate text-[13px] font-medium">{text}</p><p className="font-mono text-[11px] text-muted-foreground">{e.action}{e.outcome === "failure" && <Badge tone="danger" className="ml-2 py-0!">failed</Badge>}</p></div></div></Td>
                      <Td>{e.actor_name ? <><p className="text-[13px]">{e.actor_name}</p><p className="text-xs capitalize text-muted-foreground">{e.actor_role?.replace("_", " ")}</p></> : <span className="text-muted-foreground">System / public</span>}</Td>
                      <Td className="font-mono text-xs">{e.target_label ?? "—"}</Td><Td className="font-mono text-xs text-muted-foreground">{e.ip ?? "—"}</Td>
                      <Td className="whitespace-nowrap"><p title={formatDateTime(e.created_at)}>{timeAgo(e.created_at)}</p><p className="text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p></Td>
                    </Tr>);
                })}</tbody>
              </Table></TableWrap>
              <Pagination pagination={data.pagination} onPage={(p) => set({ page: String(p) })} onPageSize={(n) => set({ page_size: String(n) })} />
            </>)}
      </Card>

      <Modal open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open ? describeAudit(open).text : ""} description={open ? formatDateTime(open.created_at) : undefined} size="lg">
        {open && (
          <div className="space-y-4 pb-3 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              {([["Action", open.action], ["Outcome", open.outcome], ["Actor", open.actor_email ?? "—"], ["Role", open.actor_role ?? "—"], ["IP address", open.ip ?? "—"], ["Request ID", open.request_id ?? "—"]] as const).map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-all font-mono text-[13px]">{v}</dd></div>))}
            </dl>
            {open.user_agent && <div><p className="text-xs text-muted-foreground">Device</p><p className="wrap-break-word text-[13px]">{open.user_agent}</p></div>}
            {(["before", "after", "metadata"] as const).map((k) => {
              const v = open[k]; return v && Object.keys(v).length ? (
                <div key={k}><p className="mb-1 text-xs font-medium capitalize text-muted-foreground">{k}</p><pre className="overflow-x-auto rounded-xl bg-muted/60 p-3 font-mono text-xs">{JSON.stringify(v, null, 2)}</pre></div>) : null;
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
