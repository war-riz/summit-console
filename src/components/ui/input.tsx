"use client";

import * as React from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/70 hover:border-muted-foreground/40 focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { icon?: React.ReactNode; invalid?: boolean }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({ className, icon, invalid, ...props }, ref) {
  return (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">{icon}</span>}
      <input ref={ref} aria-invalid={invalid || undefined} className={cn(base, "h-10", icon && "pl-10", className)} {...props} />
    </div>
  );
});

export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(function PasswordInput({ className, invalid, ...props }, ref) {
  const [shown, setShown] = React.useState(false);
  return (
    <div className="relative">
      <input ref={ref} type={shown ? "text" : "password"} aria-invalid={invalid || undefined} className={cn(base, "h-10 pr-11", className)} {...props} />
      <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
        {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, ...props }, ref) {
    return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(base, "min-h-24 resize-y py-2.5", className)} {...props} />;
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(base, "h-10 appearance-none pr-9", className)} {...props}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
});
