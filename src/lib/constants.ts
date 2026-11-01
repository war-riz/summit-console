export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Summit Console";
export const EVENT_NAME = process.env.NEXT_PUBLIC_EVENT_NAME ?? "Southwest Regional Stakeholder Summit";
export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const COOKIE_ACCESS = "swf_at";
export const COOKIE_REFRESH = "swf_rt";

export const PASSWORD_RULES = [
  { id: "len", label: "At least 12 characters", test: (v: string) => v.length >= 12 },
  { id: "lower", label: "A lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { id: "upper", label: "An uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "digit", label: "A number", test: (v: string) => /\d/.test(v) },
  { id: "symbol", label: "A symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;
