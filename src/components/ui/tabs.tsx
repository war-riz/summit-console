"use client";

import { cn } from "@/lib/cn";

interface TabItem<T extends string> { value: T; label: string; count?: number }

/** Segmented control used for quick filters. */
export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: TabItem<T>[]; className?: string }) {
  return (
    <div role="tablist" className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1", className)}>
      {items.map((item) => (
        <button key={item.value} role="tab" aria-selected={value === item.value} onClick={() => onChange(item.value)}
          className={cn("inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all",
            value === item.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
          {item.label}
          {item.count !== undefined && <span className={cn("rounded-md px-1.5 text-[11px] tabular", value === item.value ? "bg-accent text-accent-foreground" : "bg-card/60")}>{item.count}</span>}
        </button>
      ))}
    </div>
  );
}
