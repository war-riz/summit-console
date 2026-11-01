"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface OtpInputProps { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; length?: number; disabled?: boolean; invalid?: boolean; autoFocus?: boolean }

/** Six boxes, full paste support, auto-advance and auto-submit. */
export function OtpInput({ value, onChange, onComplete, length = 6, disabled, invalid, autoFocus = true }: OtpInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, " ").split("").slice(0, length);

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  return (
    <div className="flex justify-center gap-2.5" role="group" aria-label="One-time code">
      {digits.map((d, i) => (
        <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"} maxLength={1}
          autoFocus={autoFocus && i === 0} disabled={disabled} aria-label={`Digit ${i + 1}`} aria-invalid={invalid || undefined}
          value={d.trim()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) return;
            const arr = value.padEnd(length, " ").split("");
            arr[i] = v.slice(-1);
            commit(arr.join("").replace(/ /g, ""));
            focus(i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              const arr = value.padEnd(length, " ").split("");
              if (arr[i].trim()) arr[i] = " "; else { arr[Math.max(0, i - 1)] = " "; focus(i - 1); }
              onChange(arr.join("").replace(/ /g, ""));
            }
            if (e.key === "ArrowLeft") focus(i - 1);
            if (e.key === "ArrowRight") focus(i + 1);
          }}
          onPaste={(e) => { e.preventDefault(); commit(e.clipboardData.getData("text")); focus(length - 1); }}
          onFocus={(e) => e.target.select()}
          className={cn("size-12 rounded-xl border border-input bg-card text-center text-xl font-semibold tabular shadow-sm transition-all focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15 disabled:opacity-60 sm:size-14",
            d.trim() && "border-primary/60", invalid && "border-danger focus:ring-danger/15")} />
      ))}
    </div>
  );
}
