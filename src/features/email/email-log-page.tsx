"use client";

import * as React from "react";
import Link from "next/link";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, RotateCw, Search } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { EmailStateBadge } from "@/features/applications/badges";
import { useCan } from "@/hooks/use-me";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { useConfirm } from "@/providers/confirm-provider";
import { api, type ApiError } from "@/lib/api/client";
import type { EmailLog } from "@/lib/api/types";
import { qk } from "@/lib/query-keys";
import { formatDateTime, humanize, timeAgo } from "@/lib/format";

const DEFAULTS = { status: "", kind: "", q: "", page: "1", page_size: "20" };

export function EmailLogPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const canRetry = useCan("email_logs:retry").allowed;
  const { state, set } = useUrlState(DEFAULTS);
  const [search, setSearch] = React.useState(state.q);
  const debounced = useDebounce(search, 400);
  React.useEffect(() => { if (debounced !== state.q) set({ q: debounced }); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps
  const query = { ...state, page: Number(state.page), page_size: Number(state.page_size) };
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: qk.emailLogs(query), placeholderData: keepPreviousData, refetchInterval: 30_000,
    queryFn: ({ signal }) => api.page<EmailLog>("/admin/email-logs", query, signal),
  });
  const retry = useMutation({ mutationFn: (id: string) => api.post<EmailLog>(`/admin/email-logs/${id}/retry`), onSuccess: () => qc.invalidateQueries({ queryKey: ["email-logs"] }) });

  const doRetry = async (log: EmailLog) => {
    const { confirmed } = await confirm({ title: "Retry this email?", description: `${humanize(log.kind)} to ${log.to_email}. Already-delivered emails can never be re-sent, so there is no risk of a duplicate.`, confirmLabel: "Retry now" });
    if (!confirmed) return;
    try { const r = await retry.mutateAsync(log.id); if (r.status === "sent") toast.success("Email sent"); else toast.warning(`Still ${r.status}`, { description: r.last_error ?? undefined }); }
    catch (e) { toast.error((e as ApiError).message); }
  };

  return (
    <>
      <PageHeader title="Email delivery" description="Every email the system sends, with its delivery state. Temporary failures retry automatically." />
      <Card className="mb-4 space-y-5 p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search />} placeholder="Search by recipient email" aria-label="Search recipient" />
          <Select aria-label="Email type" value={state.kind} onChange={(e) => set({ kind: e.target.value })}>
            <option value="">All email types</option><option value="application_received">Receipt confirmation</option><option value="application_accepted">Acceptance</option><option value="application_rejected">Rejection</option>
            <option value="entry_pass">Entry pass</option><option value="admin_welcome">Admin welcome</option><option value="password_reset">Password reset</option><option value="password_changed">Password changed</option>
          </Select>
        </div>
        <Tabs value={state.status || "all"} onChange={(v) => set({ status: v === "all" ? "" : v })}
          items={[{ value: "all", label: "All" }, { value: "queued", label: "Queued" }, { value: "sent", label: "Sent" }, { value: "failed", label: "Retrying" }, { value: "dead", label: "Failed" }]} />
      </Card>
      {isError && <Banner tone="danger" className="mb-4" title="Couldn't load email logs" action={<Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>}>{(error as ApiError).message}</Banner>}
      <Card>
        {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          : !data?.items.length ? <EmptyState icon={<Mail />} title="No emails found" description="Try a different filter." />
            : (<>
              <TableWrap><Table>
                <thead><tr><Th>Recipient</Th><Th>Email</Th><Th>Status</Th><Th>Attempts</Th><Th>Application</Th><Th>When</Th>{canRetry && <Th className="text-right">Action</Th>}</tr></thead>
                <tbody>{data.items.map((l) => (
                  <Tr key={l.id}>
                    <Td><p className="max-w-55 truncate font-medium">{l.to_name ?? l.to_email}</p>{l.to_name && <p className="max-w-55 truncate text-xs text-muted-foreground">{l.to_email}</p>}</Td>
                    <Td><p className="text-[13px]">{humanize(l.kind)}</p><p className="max-w-60 truncate text-xs text-muted-foreground">{l.subject}</p></Td>
                    <Td><EmailStateBadge value={l.status} />{l.last_error && <p className="mt-1 max-w-65 truncate text-[11px] text-danger" title={l.last_error}>{l.last_error}</p>}</Td>
                    <Td className="tabular">{l.attempts}/{l.max_attempts}</Td>
                    <Td>{l.application_reference ? <Link href={`/applications/${l.application_reference}`} className="font-mono text-xs text-primary hover:underline">{l.application_reference}</Link> : <span className="text-muted-foreground">—</span>}</Td>
                    <Td className="whitespace-nowrap text-[13px]" ><span title={formatDateTime(l.created_at)}>{timeAgo(l.sent_at ?? l.created_at)}</span></Td>
                    {canRetry && <Td className="text-right">{(l.status === "dead" || l.status === "failed") && l.retryable ? <Button size="sm" variant="outline" onClick={() => doRetry(l)} loading={retry.isPending && retry.variables === l.id}><RotateCw className="size-4" />Retry</Button> : null}</Td>}
                  </Tr>))}</tbody>
              </Table></TableWrap>
              <Pagination pagination={data.pagination} onPage={(p) => set({ page: String(p) })} onPageSize={(n) => set({ page_size: String(n) })} />
            </>)}
      </Card>
    </>
  );
}
