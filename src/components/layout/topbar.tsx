"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const router = useRouter();
  const ref = React.useRef<HTMLInputElement>(null);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) { e.preventDefault(); ref.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu className="size-5" /></Button>
      <form className="relative max-w-md flex-1" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/applications?q=${encodeURIComponent(q.trim())}`); }}>
        <Input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} icon={<Search />} placeholder="Search applications by name, email or reference" aria-label="Search applications" className="bg-muted/60 pr-10" />
        <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:block"><Kbd>/</Kbd></span>
      </form>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle /><NotificationBell /><span className="mx-1 hidden h-6 w-px bg-border sm:block" /><UserMenu />
      </div>
    </header>
  );
}
