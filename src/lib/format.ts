const TZ = "Africa/Lagos";

const dateTime = new Intl.DateTimeFormat("en-NG", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dateOnly = new Intl.DateTimeFormat("en-NG", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" });
const dayMonth = new Intl.DateTimeFormat("en-NG", { timeZone: TZ, day: "2-digit", month: "short" });

export const formatDateTime = (iso?: string | null) => (iso ? dateTime.format(new Date(iso)) : "—");
export const formatDate = (iso?: string | null) => (iso ? dateOnly.format(new Date(iso)) : "—");
export const formatDayMonth = (iso: string) => dayMonth.format(new Date(iso + "T12:00:00Z"));
export const formatNumber = (n: number) => new Intl.NumberFormat("en-NG").format(n);

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;

export function timeAgo(iso?: string | null): string {
  if (!iso) return "—";
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return "just now";
  if (seconds < 3600) return plural(Math.max(1, Math.round(seconds / 60)), "minute");
  if (seconds < 86400) return plural(Math.round(seconds / 3600), "hour");
  if (seconds < 604800) return plural(Math.round(seconds / 86400), "day");
  return formatDate(iso);
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
}

export function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export function humanize(value: string): string {
  return value.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
