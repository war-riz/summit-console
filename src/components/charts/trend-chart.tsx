"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDayMonth } from "@/lib/format";

interface Point { date: string; members: number; sponsors: number; total: number }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs shadow-(--shadow-pop)">
      <p className="mb-1.5 font-semibold">{label ? formatDayMonth(label) : ""}</p>
      {payload.map((p) => (<p key={p.name} className="flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}<span className="ml-auto font-semibold tabular text-foreground">{p.value}</span></p>))}
    </div>
  );
}

export function TrendChart({ data }: { data: Point[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="g-members" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand-sky)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--brand-sky)" stopOpacity={0.02} /></linearGradient>
            <linearGradient id="g-sponsors" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6d5cf0" stopOpacity={0.4} /><stop offset="100%" stopColor="#6d5cf0" stopOpacity={0.02} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
                    <XAxis dataKey="date" tickFormatter={formatDayMonth} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={32} tickMargin={8} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1.5 }} />
          <Area type="monotone" dataKey="members" name="Members" stackId="1" stroke="var(--brand-sky)" strokeWidth={2.5} fill="url(#g-members)" />
          <Area type="monotone" dataKey="sponsors" name="Sponsors" stackId="1" stroke="#6d5cf0" strokeWidth={2.5} fill="url(#g-sponsors)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
