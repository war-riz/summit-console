import * as React from "react";
import { cn } from "@/lib/cn";

interface FieldProps { label: string; htmlFor?: string; hint?: React.ReactNode; error?: string; required?: boolean; className?: string; children: React.ReactNode; action?: React.ReactNode }

export function Field({ label, htmlFor, hint, error, required, className, children, action }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
          {label}{required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
        </label>
        {action}
      </div>
      {children}
      {error ? <p role="alert" className="text-xs font-medium text-danger">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
