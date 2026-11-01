import * as React from "react";
import { cn } from "@/lib/cn";

export function TableWrap({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full overflow-x-auto", className)} {...props} />;
}
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-160 border-collapse text-sm", className)} {...props} />;
}
export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("whitespace-nowrap border-b border-border bg-muted/50 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground first:rounded-tl-xl last:rounded-tr-xl", className)} {...props} />;
}
export function Tr({ className, clickable, ...props }: React.HTMLAttributes<HTMLTableRowElement> & { clickable?: boolean }) {
  return <tr className={cn("border-b border-border/70 transition-colors last:border-0", clickable && "cursor-pointer hover:bg-muted/50", className)} {...props} />;
}
export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
