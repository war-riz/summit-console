import * as React from "react";
import { Activity, Bell, ClipboardCheck, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_NAME, EVENT_NAME } from "@/lib/constants";

const points = [
  { icon: ClipboardCheck, title: "Review in one place", text: "Members and sponsors, searchable, with one-click decisions." },
  { icon: Bell, title: "Live notifications", text: "New applications and email issues appear the moment they happen." },
  { icon: ShieldCheck, title: "Protected by design", text: "Two-factor sign-in and a full audit trail of every action." },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative flex min-h-dvh flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5"><BrandMark className="size-9" /><span className="text-[15px] font-semibold">{APP_NAME}</span></div>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-105 flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} D-OLF Hydrometric Nigeria Limited · Internal use only</p>
      </div>

      <aside className="relative hidden overflow-hidden bg-linear-to-br from-brand-navy via-[#1b2a78] to-brand-deep text-white lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-60" />
        <div aria-hidden className="absolute -right-24 -top-24 size-112 animate-float rounded-full bg-brand-sky/40 blur-[90px]" />
        <div aria-hidden className="absolute -bottom-32 -left-16 size-104 animate-float rounded-full bg-[#3a4bd8]/40 blur-[100px] [animation-delay:-6s]" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium backdrop-blur"><Activity className="size-3.5" />Management console</p>
        </div>
        <div className="relative max-w-lg">
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">Run the <span className="text-gradient">summit</span> from one place.</h2>
          <p className="mt-4 text-base text-white/75">{EVENT_NAME}</p>
          <ul className="mt-10 space-y-5">
            {points.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 backdrop-blur"><Icon className="size-5" /></span>
                <div><p className="font-medium">{title}</p><p className="text-sm text-white/65">{text}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/50">3–4 December 2026 · IITA Conference Center, Ibadan</p>
      </aside>
    </div>
  );
}
