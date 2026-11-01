/**
 * Backend-for-frontend proxy.
 *
 * The browser never sees access or refresh tokens: they live in httpOnly cookies set here.
 * - attaches the access token from the cookie (or forwards an explicit Authorization header, used by the
 *   short-lived mfa/onboarding tokens)
 * - on 401 it silently rotates the refresh token once (single-flight) and retries
 * - whenever the API returns tokens (sign-in, 2FA verify, onboarding) they are moved into cookies
 */
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/constants";

export const dynamic = "force-dynamic";

const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const PREFIX = "/api/v1";
const ALLOWED_ROOTS = new Set(["auth", "admin"]);
const BLOCKED = new Set(["auth/token/refresh"]);
const secure = process.env.NODE_ENV === "production";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

interface Tokens { access_token: string; refresh_token: string; expires_in: number }
const inflight = new Map<string, Promise<Tokens | null>>();

function forwardHeaders(req: NextRequest, authorization?: string): Headers {
  const h = new Headers();
  for (const name of ["content-type", "accept", "user-agent", "x-request-id"]) {
    const v = req.headers.get(name);
    if (v) h.set(name, v);
  }
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) h.set("x-forwarded-for", forwardedFor);
  if (authorization) h.set("authorization", authorization);
  return h;
}

async function refreshTokens(refreshToken: string): Promise<Tokens | null> {
  const existing = inflight.get(refreshToken);
  if (existing) return existing;
  const job = (async () => {
    try {
      const res = await fetch(`${API_URL}${PREFIX}/auth/token/refresh`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refresh_token: refreshToken }), cache: "no-store",
      });
      if (!res.ok) return null;
      const json = await res.json();
      return (json?.data?.tokens as Tokens) ?? null;
    } catch {
      return null;
    } finally {
      setTimeout(() => inflight.delete(refreshToken), 10_000); // let parallel requests reuse the rotated pair
    }
  })();
  inflight.set(refreshToken, job);
  return job;
}

function setTokenCookies(res: NextResponse, t: Tokens) {
  res.cookies.set(COOKIE_ACCESS, t.access_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: Math.max(60, t.expires_in - 30) });
  res.cookies.set(COOKIE_REFRESH, t.refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: REFRESH_MAX_AGE });
}
function clearCookies(res: NextResponse) {
  res.cookies.set(COOKIE_ACCESS, "", { path: "/", maxAge: 0 });
  res.cookies.set(COOKIE_REFRESH, "", { path: "/", maxAge: 0 });
}

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const joined = path.join("/");
  if (!ALLOWED_ROOTS.has(path[0]) || BLOCKED.has(joined)) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Not found.", details: null } }, { status: 404 });

  const target = `${API_URL}${PREFIX}/${joined}${req.nextUrl.search}`;
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer();
  const explicitAuth = req.headers.get("authorization") ?? undefined;
  const accessCookie = req.cookies.get(COOKIE_ACCESS)?.value;
  const refreshCookie = req.cookies.get(COOKIE_REFRESH)?.value;

  const send = (authorization?: string) =>
    fetch(target, { method: req.method, headers: forwardHeaders(req, authorization), body, cache: "no-store", redirect: "manual" });

  let rotated: Tokens | null = null;
  let upstream: Response;
  if (explicitAuth) {
    upstream = await send(explicitAuth);
  } else {
    let token = accessCookie;
    if (!token && refreshCookie) {
      rotated = await refreshTokens(refreshCookie);
      token = rotated?.access_token;
    }
    upstream = await send(token ? `Bearer ${token}` : undefined);
    if (upstream.status === 401 && refreshCookie && !rotated) {
      rotated = await refreshTokens(refreshCookie);
      if (rotated) upstream = await send(`Bearer ${rotated.access_token}`);
    }
  }

  const type = upstream.headers.get("content-type") ?? "";
  let response: NextResponse;
  if (type.includes("application/json")) {
    const json = await upstream.json().catch(() => null);
    const tokens = json?.data?.tokens as Tokens | undefined;
    if (tokens && json?.data) delete json.data.tokens; // never expose tokens to page JavaScript
    response = NextResponse.json(json, { status: upstream.status });
    if (tokens) setTokenCookies(response, tokens);
  } else {
    const headers = new Headers();
    for (const name of ["content-type", "content-disposition", "retry-after"]) {
      const v = upstream.headers.get(name);
      if (v) headers.set(name, v);
    }
    response = new NextResponse(upstream.body, { status: upstream.status, headers });
  }

  if (rotated && upstream.status !== 401) setTokenCookies(response, rotated);
  if (upstream.status === 401 && !explicitAuth && !path[0].startsWith("auth")) clearCookies(response);
  if (joined === "auth/logout") clearCookies(response);
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) response.headers.set("retry-after", retryAfter);
  response.headers.set("cache-control", "no-store");
  return response;
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
