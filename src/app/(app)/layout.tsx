import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const collapsed = (await cookies()).get("summit.sidebar.collapsed")?.value === "1";
  return <AppShell defaultCollapsed={collapsed}>{children}</AppShell>;
}