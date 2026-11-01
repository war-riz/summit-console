# Summit Console (internal dashboard)

Management dashboard for the Southwest Regional Stakeholder Summit. Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · light/dark mode.
Talks to the **swfpv-summit-api** FastAPI backend.

## Run it locally
```bash
npm install
cp .env.example .env.local        # Windows: copy .env.example .env.local
npm run dev                       # http://localhost:3000
```
Set `API_URL` and `NEXT_PUBLIC_API_URL` in `.env.local` (local API: `http://localhost:8000`).
The API's `CORS_ORIGINS` must contain this dashboard's address (needed for the live notification stream).

Checks: `npm run typecheck` · `npm run lint` · `npm run build`

## What's inside
| Area | Pages |
|---|---|
| Sign-in | Password → authenticator code (or backup code) → first-sign-in password change, 2FA set-up, forgot/reset password |
| Dashboard | Greeting, 4 live stat cards (count-up), submissions chart, status donut, email-delivery health, decision speed, activity feed, latest applications |
| Applications | Search, type/status/date filters, sorting, pagination (all kept in the URL), bulk accept/reject, CSV export, detail page with decisions, notes, email delivery + retry, audit timeline |
| Notifications | Bell dropdown, full page, live pop-up toasts (Server-Sent Events) |
| Audit log · Email delivery · Administrators | Filterable tables, retry failed emails, create/edit/deactivate admins, reset 2FA, send new temporary password |
| Security | Enable 2FA (QR + backup codes), regenerate backup codes, change password, active sessions |
| Priority banner | Shown on every page until 2FA is on, with the deadline and a "Set up now" button |

## How sign-in is kept safe
* The browser never sees access or refresh tokens: they live in **httpOnly cookies** set by `src/app/api/proxy/[...path]/route.ts`.
* That route also refreshes the access token silently and forwards only `/auth` and `/admin` calls.
* `src/proxy.ts` redirects visitors without a session to `/login`. The API still enforces every permission.
* The UI hides what a role can't do, using `GET /auth/me` → `permissions` and `locked_permissions`.

## Structure
```
src/
├── app/            routes: (auth) public pages, (app) dashboard pages, api/proxy
├── components/
│   ├── ui/         reusable building blocks: Button, Input, Modal, Card, Badge, Table, Pagination, Tabs, StatCard, Banner…
│   ├── layout/     app shell, sidebar, top bar, bell, user menu, theme toggle, 2FA banner
│   └── charts/     trend chart, status donut
├── features/       one folder per area (applications, auth, audit, email, admins, notifications, security, dashboard)
├── providers/      theme, React Query, confirm-dialog (await confirm({...}))
├── hooks/          useMe/useCan, useUrlState, useDebounce, useCountUp, notification stream
└── lib/            typed API client, formatting, query keys, constants
```
Colours come from the logo (`navy #202060`, `deep blue #184080`, `sky #10A0E0`) and live as tokens at the top of `src/app/globals.css`: change them there and the whole app follows.
Swap `src/components/layout/brand-mark.tsx` and `src/app/icon.svg` for the real logo SVG when you have it (`public/dolf-logo.jpg` is included).

## Deploy (Docker, e.g. on Lightsail)
```bash
docker build -t summit-console \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com .
docker run -d --restart unless-stopped -p 3000:3000 -e API_URL=https://api.yourdomain.com summit-console
```
Put Nginx or Caddy in front for HTTPS (cookies are `Secure` in production, so HTTPS is required).
Also set on the API: `CORS_ORIGINS` (add the dashboard origin), `DASHBOARD_URL` (used in password-reset emails) and `TRUST_PROXY_HEADERS=true`.

## Using ReactBits
The cursor spotlight on cards and the count-up numbers are small in-house versions of ReactBits effects, so there is no extra dependency or licence to track.
To add more (Aurora, Aurora text, etc.), copy the component from reactbits.dev into `src/components/ui/` and import it where needed.
