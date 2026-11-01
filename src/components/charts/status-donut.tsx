"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatNumber } from "@/lib/format";

const COLORS = { pending: "var(--warning)", accepted: "var(--success)", rejected: "var(--danger)" } as const;

export function StatusDonut({ pending, accepted, rejected }: { pending: number; accepted: number; rejected: number }) {
  const total = pending + accepted + rejected;
  const data = [{ key: "pending", label: "Pending", value: pending }, { key: "accepted", label: "Accepted", value: accepted }, { key: "rejected", label: "Rejected", value: rejected }] as const;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center lg:flex-col xl:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={total ? [...data] : [{ key: "empty", label: "", value: 1 }]} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={total ? 3 : 0} cornerRadius={6} stroke="none" startAngle={90} endAngle={-270}>
              {(total ? data : [{ key: "empty" }]).map((d) => <Cell key={d.key} fill={d.key === "empty" ? "var(--muted)" : COLORS[d.key as keyof typeof COLORS]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-3xl font-semibold tabular">{formatNumber(total)}</p><p className="text-xs text-muted-foreground">applications</p></div></div>
      </div>
      <ul className="w-full max-w-55 space-y-3">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-3 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: COLORS[d.key] }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-semibold tabular">{d.value}</span>
            <span className="w-10 text-right text-xs text-muted-foreground tabular">{total ? Math.round((d.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
