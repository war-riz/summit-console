"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "./card";
import { Skeleton } from "./skeleton";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

const tones = {
  brand: "bg-accent text-accent-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  navy: "bg-brand-navy text-white dark:bg-brand-deep",
} as const;

interface StatCardProps { label: string; value?: number; icon: React.ReactNode; tone?: keyof typeof tones; hint?: React.ReactNode; href?: string; loading?: boolean; suffix?: string; delay?: number }

function Value({ value, suffix }: { value: number; suffix?: string }) {
  const shown = useCountUp(value);
  return <span className="tabular">{formatNumber(shown)}{suffix}</span>;
}

export function StatCard({ label, value, icon, tone = "brand", hint, href, loading, suffix, delay = 0 }: StatCardProps) {
  const body = (
    <Card spotlight className="h-full animate-fade-up p-5 transition-shadow hover:shadow-(--shadow-pop)" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className={cn("grid size-10 place-items-center rounded-xl [&_svg]:size-5", tones[tone])}>{icon}</div>
        {href && <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100" />}
      </div>
      <p className="mt-4 text-[13px] font-medium text-muted-foreground">{label}</p>
      {loading || value === undefined ? <Skeleton className="mt-1.5 h-8 w-20" /> : <p className="mt-0.5 text-3xl font-semibold tracking-tight"><Value value={value} suffix={suffix} /></p>}
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
  return href ? <Link href={href} className="block rounded-2xl focus-visible:outline-offset-4">{body}</Link> : body;
}
