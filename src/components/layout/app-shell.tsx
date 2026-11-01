"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MfaBanner } from "./mfa-banner";
import { useMe } from "@/hooks/use-me";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { cn } from "@/lib/cn";

export const SIDEBAR_COOKIE = "summit.sidebar.collapsed";

export function AppShell({ children, defaultCollapsed = false }: { children: React.ReactNode; defaultCollapsed?: boolean }) {
  const router = useRouter();
  const { data: me } = useMe();
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const [drawer, setDrawer] = React.useState(false);
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };
  useNotificationStream(!!me, (link) => router.push(link));

  return (
    <div className="min-h-dvh">
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block", collapsed ? "w-19" : "w-68")}>
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </aside>
      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-[#04061c]/60 backdrop-blur-sm lg:hidden" />
          <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-71.25 max-w-[85vw] animate-slide-in focus:outline-none lg:hidden">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title><Dialog.Description className="sr-only">Main navigation</Dialog.Description>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-19" : "lg:pl-68")}>
        <Topbar onMenu={() => setDrawer(true)} />
        <main id="main" className="mx-auto w-full max-w-350 px-4 py-6 sm:px-6 lg:px-8"><MfaBanner />{children}</main>
      </div>
    </div>
  );
}