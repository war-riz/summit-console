"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export function CopyButton({ value, label = "Copy", className }: { value: string; label?: string; className?: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button type="button" aria-label={label} title={label}
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); toast.success("Copied to clipboard"); setTimeout(() => setDone(false), 1400); }
        catch { toast.error("Could not copy. Select the text and copy manually."); }
      }}
      className={cn("grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", className)}>
      {done ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
    </button>
  );
}
