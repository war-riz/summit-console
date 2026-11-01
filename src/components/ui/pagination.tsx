"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { Select } from "./input";
import type { Pagination as P } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

interface Props { pagination: P; onPage: (page: number) => void; onPageSize?: (size: number) => void }

export function Pagination({ pagination, onPage, onPageSize }: Props) {
  const { page, page_size, total_items, total_pages } = pagination;
  const from = total_items === 0 ? 0 : (page - 1) * page_size + 1;
  const to = Math.min(page * page_size, total_items);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-[13px] text-muted-foreground sm:flex-row">
      <p className="tabular">Showing <span className="font-medium text-foreground">{from}–{to}</span> of <span className="font-medium text-foreground">{formatNumber(total_items)}</span></p>
      <div className="flex items-center gap-3">
        {onPageSize && (
          <div className="w-28"><Select aria-label="Rows per page" value={page_size} onChange={(e) => onPageSize(Number(e.target.value))} className="h-8 text-[13px]">
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </Select></div>
        )}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon-sm" disabled={!pagination.has_prev} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></Button>
          <span className="min-w-20 text-center tabular">Page {page} of {Math.max(1, total_pages)}</span>
          <Button variant="outline" size="icon-sm" disabled={!pagination.has_next} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></Button>
        </div>
      </div>
    </div>
  );
}
