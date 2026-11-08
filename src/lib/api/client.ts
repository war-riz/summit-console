import type { Query } from "@/lib/types-shared";
import type { Pagination } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public details: { field: string | null; message: string }[] | null = null,
    public requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
  /** Backend field errors as { field: message }, ready for react-hook-form's setError. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries((this.details ?? []).filter((d) => d.field).map((d) => [d.field as string, d.message]));
  }
}

interface Envelope<T> {
  success: boolean; message: string; data: T; pagination?: Pagination;
  error?: { code: string; message: string; details: ApiError["details"] }; request_id?: string;
}
interface Options { query?: Query; body?: unknown; headers?: Record<string, string>; signal?: AbortSignal }

function qs(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : "";
}

let redirecting = false;

async function call<T>(method: string, path: string, opts: Options = {}): Promise<Envelope<T>> {
  let res: Response;
  try {
    res = await fetch(`/api/proxy${path}${qs(opts.query)}`, {
      method,
      headers: { Accept: "application/json", ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}), ...opts.headers },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
      signal: opts.signal,
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0, "NETWORK_ERROR");
  }

  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !json?.success) {
    const err = json?.error;
    const error = new ApiError(err?.message ?? `Request failed (${res.status})`, res.status, err?.code ?? "UNKNOWN", err?.details ?? null, json?.request_id ?? null);
    if (res.status === 401 && !path.startsWith("/auth/") && typeof window !== "undefined" && !redirecting) {
      redirecting = true; // the session is gone: the proxy already tried to refresh it
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload on purpose: wipes all cached data
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    }
    throw error;
  }
  return json;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => call<T>("GET", path, { query, signal }).then((r) => r.data),
  page: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    call<T[]>("GET", path, { query, signal }).then((r) => ({ items: r.data, pagination: r.pagination! })),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) => call<T>("POST", path, { body: body ?? {}, headers }).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) => call<T>("PATCH", path, { body: body ?? {} }).then((r) => r.data),
  delete: <T>(path: string, query?: Query) => call<T>("DELETE", path, { query }).then((r) => r.data),
  /** Download a file (e.g. the CSV export) through the authenticated proxy. */
  async download(path: string, query: Query | undefined, filename: string) {
    const res = await fetch(`/api/proxy${path}${qs(query)}`, { credentials: "same-origin", cache: "no-store" });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new ApiError(json?.error?.message ?? "Download failed", res.status, json?.error?.code ?? "UNKNOWN");
    }
    const blob = await res.blob();
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
