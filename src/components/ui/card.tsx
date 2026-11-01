"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { spotlight?: boolean; padded?: boolean }

/** Surface with an optional cursor-following spotlight (inspired by ReactBits' SpotlightCard). */
export function Card({ className, spotlight, padded, children, onMouseMove, ...props }: CardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(e);
    const r = ref.current?.getBoundingClientRect();
    if (spotlight && r && ref.current) {
      ref.current.style.setProperty("--x", `${e.clientX - r.left}px`);
      ref.current.style.setProperty("--y", `${e.clientY - r.top}px`);
    }
  };
  return (
    <div ref={ref} onMouseMove={move}
      className={cn("group/card relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-(--shadow-card)", padded && "p-5", className)} {...props}>
      {spotlight && (
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
          style={{ background: "radial-gradient(260px circle at var(--x,50%) var(--y,50%), color-mix(in srgb, var(--brand-sky) 16%, transparent), transparent 70%)" }} />
      )}
      {spotlight ? <div className="relative">{children}</div> : children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3 px-5 pt-5", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[15px] font-semibold tracking-tight", className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-0.5 text-[13px] text-muted-foreground", className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
