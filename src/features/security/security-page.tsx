"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CircleCheck, KeyRound, Laptop, Lock, LogOut, ShieldAlert, ShieldCheck, Smartphone } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { OtpInput } from "@/components/ui/otp-input";
import { PageHeader } from "@/components/ui/page-header";
import { PasswordChecklist, passwordIsStrong } from "@/components/ui/password-checklist";
import { Skeleton } from "@/components/ui/skeleton";
import { MfaSetup } from "./mfa-setup";
import { useMe } from "@/hooks/use-me";
import { useConfirm } from "@/providers/confirm-provider";
import { ApiError, api } from "@/lib/api/client";
import type { MfaConfirmResult, MfaSetupInit, SessionInfo } from "@/lib/api/types";
import { qk } from "@/lib/query-keys";
import { daysUntil, formatDate, formatDateTime, timeAgo } from "@/lib/format";

function describeDevice(ua: string | null): { label: string; mobile: boolean } {
  if (!ua) return { label: "Unknown device", mobile: false };
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "device";
  return { label: `${browser} on ${os}`, mobile: /Android|iPhone|iPad|Mobile/.test(ua) };
}

export function SecurityPage() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me, isLoading } = useMe();
  const [manualOpen, setManualOpen] = React.useState(false);
  const [skipped, setSkipped] = React.useState(false);
  const [codesOpen, setCodesOpen] = React.useState(false);

  const fromBanner = params.get("setup") === "1" && !!me && !me.mfa_enabled && !skipped; // opened from the banner link
  const setupOpen = manualOpen || fromBanner;
  const closeSetup = () => { setManualOpen(false); setSkipped(true); if (params.get("setup")) router.replace("/security"); };
  const days = me?.mfa_required_by ? daysUntil(me.mfa_required_by) : null;

  return (
    <>
      <PageHeader title="Security" description="Protect your account: two-factor authentication, password and signed-in devices." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card spotlight>
            <CardHeader><div><CardTitle>Two-factor authentication</CardTitle><CardDescription>A code from your phone, on top of your password.</CardDescription></div>
              {me && (me.mfa_enabled ? <Badge tone="success"><CircleCheck className="size-3" />On</Badge> : <Badge tone="warning"><ShieldAlert className="size-3" />Not set up</Badge>)}</CardHeader>
            <CardContent>
              {isLoading || !me ? <Skeleton className="h-24" /> : me.mfa_enabled ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-success-soft text-success"><ShieldCheck className="size-6" /></span>
                    <p className="text-sm text-muted-foreground">Your account is protected. Exports and administrator tools are unlocked.</p></div>
                  <Button variant="outline" onClick={() => setCodesOpen(true)}><KeyRound className="size-4" />New backup codes</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl bg-warning-soft p-4"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
                    <div className="text-sm"><p className="font-semibold">{days !== null && days > 0 ? `Required in ${days} day${days === 1 ? "" : "s"} (${formatDate(me.mfa_required_by)})` : "Required from your next sign-in"}</p>
                      <p className="mt-1 text-muted-foreground">Until it is on, exporting data and managing administrators are locked.</p></div></div>
                  <Button size="lg" onClick={() => { setSkipped(false); setManualOpen(true); }}><Smartphone className="size-4" />Set up two-factor authentication</Button>
                </div>
              )}
            </CardContent>
          </Card>
          <PasswordCard />
          <Sessions />
        </div>

        <Card className="h-fit"><CardContent className="space-y-4">
          {me ? (<>
            <div className="flex items-center gap-4"><Avatar name={me.name} size="lg" /><div className="min-w-0"><p className="truncate text-lg font-semibold">{me.name}</p><p className="truncate text-sm text-muted-foreground">{me.email}</p><Badge tone="navy" className="mt-1.5 capitalize">{me.role.replace("_", " ")}</Badge></div></div>
            <div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">What you can do</p>
              <ul className="space-y-1.5 text-[13px]">{me.permissions.map((p) => { const locked = me.locked_permissions.includes(p); return (
                <li key={p} className="flex items-center gap-2">{locked ? <Lock className="size-3.5 text-warning" /> : <CircleCheck className="size-3.5 text-success" />}<span className={locked ? "text-muted-foreground" : ""}>{p.replace(":", " · ").replace(/_/g, " ")}</span>{locked && <span className="ml-auto text-[11px] text-warning">needs 2FA</span>}</li>); })}</ul></div>
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">Last sign-in: {formatDateTime(me.last_login_at)}</p>
          </>) : <Skeleton className="h-64" />}
        </CardContent></Card>
      </div>

      <Modal open={setupOpen} onOpenChange={(o) => !o && closeSetup()} title="Set up two-factor authentication" icon={<Smartphone />} size="md" dismissible={false}
        description="Scan the code, enter the 6-digit number, and store your backup codes.">
        {setupOpen && <div className="pb-3"><MfaSetup doneLabel="Done"
          init={() => api.post<MfaSetupInit>("/auth/2fa/setup/init")}
          confirm={async (code) => { const r = await api.post<MfaConfirmResult>("/auth/2fa/setup/confirm", { code }); qc.invalidateQueries({ queryKey: qk.me }); return r.backup_codes; }}
          onDone={closeSetup} /></div>}
        <button type="button" onClick={closeSetup} className="mx-auto mb-3 block text-xs text-muted-foreground hover:text-foreground hover:underline">I&apos;ll do this later</button>
      </Modal>
      <BackupCodesModal open={codesOpen} onClose={() => setCodesOpen(false)} />
    </>
  );
}

const pwSchema = z.object({ current: z.string().min(1, "Enter your current password"), password: z.string().refine(passwordIsStrong, "Password does not meet all requirements"), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

function PasswordCard() {
  const { register, handleSubmit, control, reset, setError, formState: { errors, isSubmitting } } = useForm<z.infer<typeof pwSchema>>({ resolver: zodResolver(pwSchema), defaultValues: { current: "", password: "", confirm: "" } });
  const value = useWatch({ control, name: "password" });
  const submit = handleSubmit(async (v) => {
    try { await api.post("/auth/password/change", { current_password: v.current, new_password: v.password }); toast.success("Password changed", { description: "Your other devices were signed out." }); reset(); }
    catch (e) {
      const err = e as ApiError;
      if (err.code === "INVALID_CREDENTIALS") setError("current", { message: "That is not your current password" });
      else setError("password", { message: err.details?.[0]?.message ?? err.message });
    }
  });
  return (
    <Card><CardHeader><div><CardTitle>Change password</CardTitle><CardDescription>Changing it signs out all your other devices.</CardDescription></div></CardHeader>
      <CardContent><form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Current password" htmlFor="cur" error={errors.current?.message}><PasswordInput id="cur" autoComplete="current-password" invalid={!!errors.current} {...register("current")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password" htmlFor="new" error={errors.password?.message}><PasswordInput id="new" autoComplete="new-password" invalid={!!errors.password} {...register("password")} /></Field>
          <Field label="Confirm new password" htmlFor="conf" error={errors.confirm?.message}><PasswordInput id="conf" autoComplete="new-password" invalid={!!errors.confirm} {...register("confirm")} /></Field>
        </div>
        {value && <PasswordChecklist value={value} />}
        <div className="flex justify-end"><Button type="submit" loading={isSubmitting}>Update password</Button></div>
      </form></CardContent></Card>
  );
}

function Sessions() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data, isLoading } = useQuery({ queryKey: qk.sessions, queryFn: () => api.get<SessionInfo[]>("/auth/sessions") });
  const revoke = useMutation({ mutationFn: (id: string) => api.delete(`/auth/sessions/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: qk.sessions }) });
  const others = (data ?? []).filter((s) => !s.is_current);
  const signOutOthers = async () => {
    const { confirmed } = await confirm({ title: "Sign out all other devices?", description: "You stay signed in here. Everywhere else will need to sign in again.", tone: "danger", confirmLabel: "Sign out others" });
    if (!confirmed) return;
    try { await api.delete("/auth/sessions"); qc.invalidateQueries({ queryKey: qk.sessions }); toast.success("Other devices signed out"); } catch (e) { toast.error((e as ApiError).message); }
  };
  return (
    <Card><CardHeader><div><CardTitle>Where you&apos;re signed in</CardTitle><CardDescription>Devices with an active session.</CardDescription></div>
      {others.length > 0 && <Button variant="outline" size="sm" onClick={signOutOthers}><LogOut className="size-4" />Sign out others</Button>}</CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-24" /> : (
          <ul className="divide-y divide-border">{data?.map((s) => { const d = describeDevice(s.user_agent); return (
            <li key={s.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">{d.mobile ? <Smartphone className="size-5" /> : <Laptop className="size-5" />}</span>
              <div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-sm font-medium">{d.label}{s.is_current && <Badge tone="success">This device</Badge>}</p>
                <p className="truncate text-xs text-muted-foreground">{s.ip ?? "Unknown IP"} · active {timeAgo(s.last_used_at)}</p></div>
              {!s.is_current && <Button variant="ghost" size="sm" loading={revoke.isPending && revoke.variables === s.id} onClick={() => revoke.mutate(s.id, { onSuccess: () => toast.success("Session ended") })}>Revoke</Button>}
            </li>); })}</ul>
        )}
      </CardContent></Card>
  );
}

function BackupCodesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <BackupCodesDialog onClose={onClose} /> : null;
}

function BackupCodesDialog({ onClose }: { onClose: () => void }) {
  const open = true;
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [codes, setCodes] = React.useState<string[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const submit = async (value = code) => {
    if (!password || value.length !== 6 || busy) return;
    setBusy(true); setError(null);
    try { const r = await api.post<{ backup_codes: string[] }>("/auth/2fa/backup-codes", { password, code: value }); setCodes(r.backup_codes); }
    catch (e) { setError((e as ApiError).message); setCode(""); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onOpenChange={(o) => !o && (codes ? saved && onClose() : onClose())} dismissible={!codes} title={codes ? "Your new backup codes" : "Generate new backup codes"} icon={<KeyRound />} size="sm"
      description={codes ? "Your old codes no longer work. These are shown only once." : "Confirm it's you. This invalidates your current backup codes."}
      footer={codes ? <Button disabled={!saved} onClick={onClose}>Done</Button> : <><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={!password || code.length !== 6} onClick={() => submit()}>Generate</Button></>}>
      <div className="space-y-4 pb-3">
        {codes ? (<>
          <ul className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/50 p-4 font-mono text-sm">{codes.map((c) => <li key={c} className="tabular rounded-md bg-card px-3 py-1.5 text-center shadow-sm">{c}</li>)}</ul>
          <Button variant="outline" className="w-full" onClick={async () => { await navigator.clipboard.writeText(codes.join("\n")); toast.success("Codes copied"); }}>Copy all</Button>
          <label className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox checked={saved} onChange={(e) => setSaved(e.target.checked)} />I have stored these codes safely</label>
        </>) : (<>
          <Field label="Your password" htmlFor="bc-pw"><PasswordInput id="bc-pw" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <div className="space-y-2"><p className="text-[13px] font-medium">Code from your authenticator app</p><OtpInput value={code} onChange={setCode} onComplete={submit} autoFocus={false} invalid={!!error} disabled={busy} /></div>
          {error && <p role="alert" className="text-center text-sm font-medium text-danger">{error}</p>}
        </>)}
      </div>
    </Modal>
  );
}
