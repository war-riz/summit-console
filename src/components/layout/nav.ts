import { Bell, Building2, LayoutDashboard, Mail, ScrollText, ShieldCheck, Users, QrCode, type LucideIcon } from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; permission?: string; badge?: "pending" | "unread" | "security" }
export interface NavSection { label: string; items: NavItem[] }

export const NAV: NavSection[] = [
  { label: "Overview", items: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/applications", label: "Applications", icon: Building2, permission: "applications:read", badge: "pending" },
    { href: "/check-in", label: "Check-in", icon: QrCode, permission: "checkin:operate" },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: "unread" },
  ] },
  { label: "Monitoring", items: [
    { href: "/audit-log", label: "Audit log", icon: ScrollText, permission: "audit:read" },
    { href: "/email-log", label: "Email delivery", icon: Mail, permission: "email_logs:read" },
  ] },
  { label: "Administration", items: [
    { href: "/administrators", label: "Administrators", icon: Users, permission: "admins:manage" },
    { href: "/security", label: "Security", icon: ShieldCheck, badge: "security" },
  ] },
];

export const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
