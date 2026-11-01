"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api/client";
import { Avatar } from "@/components/ui/avatar";
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown-menu";
import { useMe } from "@/hooks/use-me";

export function UserMenu() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  if (!me) return <div className="skeleton size-9 rounded-full" />;

  const signOut = async () => {
    try { await api.post("/auth/logout"); } catch { /* the cookies are cleared either way */ }
    qc.clear();
    toast.success("You've been signed out");
    router.replace("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownTrigger className="group flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-muted" aria-label="Account menu">
        <Avatar name={me.name} size="md" />
        <ChevronDown className="hidden size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 sm:block" />
      </DropdownTrigger>
      <DropdownContent className="w-64">
        <div className="px-2.5 pb-2 pt-1.5">
          <p className="truncate text-sm font-semibold">{me.name}</p>
          <p className="truncate text-xs text-muted-foreground">{me.email}</p>
        </div>
        <DropdownSeparator />
        <DropdownLabel>Account</DropdownLabel>
        <DropdownItem asChild><Link href="/security"><ShieldCheck />Security settings</Link></DropdownItem>
        <DropdownItem asChild><Link href="/notifications"><Bell />Notifications</Link></DropdownItem>
        <DropdownSeparator />
        <DropdownItem danger onSelect={signOut}><LogOut />Sign out</DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}
