"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CalendarDays, CheckCircle2, ChevronRight, Download, Lock, Search, SearchX, X, XCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { CategoryBadge, EmailStateBadge, StatusBadge } from "./badges";
import { useApplications, useBulkDecide } from "./hooks";
import { useCan } from "@/hooks/use-me";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlState } from "@/hooks/use-url-state";
import { useConfirm } from "@/providers/confirm-provider";
import { ApiError, api } from "@/lib/api/client";
import type { Decision } from "@/lib/api/types";
import { formatDateTime, timeAgo } from "@/lib/format";

const DEFAULTS = { q: "", category: "", status: "", date_from: "", date_to: "", sort: "-submitted_at", page: "1", page_size: "20" };

export function ApplicationsPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { state, set } = useUrlState(DEFAULTS);
  const decide = useCan("applications:decide");
  const exporter = useCan("applications:export");
  const bulk = useBulkDecide();

  const [search, setSearch] = React.useState(state.q);
  const [seenQ, setSeenQ] = React.useState(state.q);
  if (state.q !== seenQ) { setSeenQ(state.q); setSearch(state.q); } // URL changed elsewhere (top bar search, clear filters)
  const debounced = useDebounce(search, 350);
  React.useEffect(() => { if (debounced !== state.q) set({ q: debounced }); }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = { ...state, page: Number(state.page), page_size: Number(state.page_size) };
  const { data, isLoading, isError, isFetching, error, refetch } = useApplications(query);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const filterKey = JSON.stringify(query);
  const [seenKey, setSeenKey] = React.useState(filterKey);
  if (filterKey !== seenKey) { setSeenKey(filterKey); setSelected(new Set()); } // a new page or filter clears the selection

  const items = data?.items ?? [];
  const allSelected = items.length > 0 && items.every((a) => selected.has(a.reference));
  const hasFilters = !!(state.q || state.category || state.status || state.date_from || state.date_to);
  const toggle = (ref: string) => setSelected((s) => { const n = new Set(s); if (n.has(ref)) n.delete(ref); else n.add(ref); return n; });

  const runBulk = async (decision: Decision) => {
    const refs = [...selected];
    const accept = decision === "accept";
    const { confirmed, note } = await confirm({
      title: `${accept ? "Accept" : "Reject"} ${refs.length} application${refs.length === 1 ? "" : "s"}?`,
      description: `Each applicant will receive a${accept ? "n acceptance" : " rejection"} email. Applications that already have a decision are skipped.`,
      tone: accept ? "success" : "danger", confirmLabel: accept ? "Accept all" : "Reject all", note: { label: "Internal note" },
    });
    if (!confirmed) return;
    try {
      const r = await bulk.mutateAsync({ references: refs, decision, note });
      if (r.failed.length === 0) toast.success(`${r.succeeded.length} application${r.succeeded.length === 1 ? "" : "s"} ${accept ? "accepted" : "rejected"}`);
      else toast.warning(`${r.succeeded.length} done, ${r.failed.length} skipped`, { description: r.failed.slice(0, 3).map((f) => `${f.reference}: ${f.message}`).join("\n"), duration: 9000 });
      setSelected(new Set());
    } catch (e) { toast.error((e as ApiError).message); }
  };

  const exportCsv = () => {
    if (exporter.locked) {
      toast.error("Export is locked until two-factor authentication is on", { action: { label: "Set up 2FA", onClick: () => router.push("/security?setup=1") } });
      return;
    }
    const { page: _p, page_size: _s, ...filters } = state; void _p; void _s;
    toast.promise(api.download("/admin/applications/export.csv", filters, "applications.csv"), { loading: "Preparing export…", success: "Export downloaded", error: (e) => (e as ApiError).message });
  };

  return (
    <>
      <PageHeader title="Applications" description="Review, search and decide on every member and sponsor application."
        actions={exporter.allowed && <Button variant="outline" onClick={exportCsv}>{exporter.locked ? <Lock className="size-4" /> : <Download className="size-4" />}Export CSV</Button>} />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search />} placeholder="Search name, email, reference…" aria-label="Search applications" />
          <Select aria-label="Applicant type" value={state.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">All types</option><option value="member">Members</option><option value="sponsor">Sponsors</option>
          </Select>
          <Input type="date" aria-label="Submitted from" value={state.date_from} max={state.date_to || undefined} onChange={(e) => set({ date_from: e.target.value })} icon={<CalendarDays />} className="pr-2 text-[13px]" />
          <Input type="date" aria-label="Submitted until" value={state.date_to} min={state.date_from || undefined} onChange={(e) => set({ date_to: e.target.value })} icon={<CalendarDays />} className="pr-2 text-[13px]" />
          <Select aria-label="Sort" value={state.sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="-submitted_at">Newest first</option><option value="submitted_at">Oldest first</option><option value="applicant_name">Name A–Z</option><option value="-applicant_name">Name Z–A</option><option value="status">Status</option>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Tabs value={state.status || "all"} onChange={(v) => set({ status: v === "all" ? "" : v })}
            items={[{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "accepted", label: "Accepted" }, { value: "rejected", label: "Rejected" }]} />
          {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); set({ q: "", category: "", status: "", date_from: "", date_to: "" }); }}><X className="size-4" />Clear filters</Button>}
        </div>
      </Card>

      {isError && <Banner tone="danger" className="mb-4" title="Couldn't load applications" action={<Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>}>{(error as ApiError)?.message}</Banner>}

      <Card className={isFetching && !isLoading ? "opacity-80 transition-opacity" : "transition-opacity"}>
        {selected.size > 0 && decide.allowed && (
          <div className="sticky top-16 z-10 flex flex-wrap items-center gap-3 border-b border-primary/20 bg-accent px-4 py-2.5 animate-fade-in">
            <p className="text-sm font-medium text-accent-foreground">{selected.size} selected</p>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="success" loading={bulk.isPending} onClick={() => runBulk("accept")}><CheckCircle2 className="size-4" />Accept</Button>
              <Button size="sm" variant="danger" loading={bulk.isPending} onClick={() => runBulk("reject")}><XCircle className="size-4" />Reject</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Cancel</Button>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : items.length === 0 ? (
          hasFilters ? <EmptyState icon={<SearchX />} title="No applications match these filters" description="Try a different search or clear the filters." action={<Button variant="outline" onClick={() => { setSearch(""); set({ q: "", category: "", status: "", date_from: "", date_to: "" }); }}>Clear filters</Button>} />
            : <EmptyState icon={<Building2 />} title="No applications yet" description="They will appear here as soon as someone submits the registration form." />
        ) : (
          <>
            <TableWrap>
              <Table>
                <thead><tr>
                  {decide.allowed && <Th className="w-10"><Checkbox aria-label="Select all on this page" checked={allSelected} indeterminate={!allSelected && selected.size > 0} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((a) => a.reference)))} /></Th>}
                  <Th>Applicant</Th><Th>Type</Th><Th>Status</Th><Th>Contact</Th><Th>Submitted</Th><Th>Emails</Th><Th className="w-8"><span className="sr-only">Open</span></Th>
                </tr></thead>
                <tbody>
                  {items.map((a) => (
                    <Tr key={a.id} clickable onClick={() => router.push(`/applications/${a.reference}`)} className={selected.has(a.reference) ? "bg-accent/40" : undefined}>
                      {decide.allowed && <Td onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Select ${a.applicant_name}`} checked={selected.has(a.reference)} onChange={() => toggle(a.reference)} /></Td>}
                      <Td><div className="flex items-center gap-3"><Avatar name={a.applicant_name} /><div className="min-w-0"><p className="truncate font-medium">{a.applicant_name}</p><p className="truncate text-xs text-muted-foreground">{a.contact_name ?? a.organisation ?? a.reference}{a.contact_name || a.organisation ? ` · ${a.reference}` : ""}</p></div></div></Td>
                      <Td><CategoryBadge value={a.category} /></Td>
                      <Td><StatusBadge value={a.status} />{a.decided_by_name && <p className="mt-1 text-[11px] text-muted-foreground">by {a.decided_by_name}</p>}</Td>
                      <Td><p className="max-w-52.5 truncate">{a.email}</p><p className="text-xs text-muted-foreground">{a.phone}</p></Td>
                      <Td className="whitespace-nowrap"><p title={formatDateTime(a.submitted_at)}>{timeAgo(a.submitted_at)}</p><p className="text-xs text-muted-foreground">{formatDateTime(a.submitted_at)}</p></Td>
                      <Td><div className="flex flex-col gap-1"><EmailStateBadge value={a.email_status.received} label="Receipt" /><EmailStateBadge value={a.email_status.decision} label="Decision" /></div></Td>
                      <Td><ChevronRight className="size-4 text-muted-foreground" /></Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
            {data && <Pagination pagination={data.pagination} onPage={(p) => set({ page: String(p) })} onPageSize={(n) => set({ page_size: String(n) })} />}
          </>
        )}
      </Card>
    </>
  );
}
