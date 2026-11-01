"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/cn";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> { indeterminate?: boolean }

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ className, indeterminate, checked, ...props }, ref) {
  return (
    <span className={cn("relative inline-grid size-4.5 place-items-center", className)}>
      <input ref={ref} type="checkbox" checked={checked} className="peer absolute inset-0 m-0 size-full cursor-pointer appearance-none rounded-md border border-input bg-card transition-colors checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary hover:border-primary/60"
        {...props} data-indeterminate={indeterminate || undefined} />
      {indeterminate ? <Minus className="pointer-events-none relative size-3 text-primary-foreground" strokeWidth={3} />
        : <Check className="pointer-events-none relative size-3 scale-0 text-primary-foreground transition-transform peer-checked:scale-100" strokeWidth={3} />}
    </span>
  );
});
