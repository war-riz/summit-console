"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, PasswordInput } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { PasswordChecklist, passwordIsStrong } from "@/components/ui/password-checklist";
import { MfaSetup } from "@/features/security/mfa-setup";
import { ApiError, api, bearer } from "@/lib/api/client";
import type { LoginResult, MfaConfirmResult, MfaSetupInit } from "@/lib/api/types";

type Step = "credentials" | "mfa" | "set-password" | "enroll";

const credentialsSchema = z.object({ email: z.string().min(1, "Enter your email").email("Enter a valid email address"), password: z.string().min(1, "Enter your password") });
const passwordSchema = z.object({ password: z.string().refine(passwordIsStrong, "Password does not meet all requirements"), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

function Heading({ icon, title, text }: { icon: React.ReactNode; title: string; text?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground [&_svg]:size-6">{icon}</div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {text && <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function LoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const [step, setStep] = React.useState<Step>("credentials");
  const [creds, setCreds] = React.useState({ email: "", password: "" });
  const [mfaToken, setMfaToken] = React.useState("");
  const [onboardingToken, setOnboardingToken] = React.useState("");

  const finish = React.useCallback((message?: string) => {
    qc.clear();
    if (message) toast.success(message);
    const next = params.get("next");
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }, [params, qc, router]);

  /** Shared by the first sign-in and the automatic re-sign-in after a password change. */
  const route = React.useCallback((r: LoginResult, welcome?: string) => {
    if (r.status === "authenticated") return finish(welcome ?? "Welcome back");
    if (r.status === "mfa_required") { setMfaToken(r.mfa_token ?? ""); return setStep("mfa"); }
    setOnboardingToken(r.onboarding_token ?? "");
    setStep(r.onboarding_steps?.includes("change_password") ? "set-password" : "enroll");
  }, [finish]);

  const signIn = React.useCallback((email: string, password: string) => api.post<LoginResult>("/auth/login", { email, password }), []);

  if (step === "credentials") return <CredentialsStep onSubmit={async (v) => { setCreds(v); route(await signIn(v.email, v.password)); }} />;
  if (step === "mfa") return <MfaStep mfaToken={mfaToken} onBack={() => setStep("credentials")} onDone={() => finish("Welcome back")} />;
  if (step === "set-password") {
    return <SetPasswordStep token={onboardingToken} onDone={async (newPassword) => {
      try { route(await signIn(creds.email, newPassword), "Password updated. You're in."); }
      catch { toast.success("Password updated. Please sign in again."); setStep("credentials"); }
    }} />;
  }
  return (
    <>
      <Heading icon={<ShieldCheck />} title="Set up two-factor authentication" text="Your grace period has ended, so two-factor authentication is required before you continue." />
      <MfaSetup
        init={() => api.post<MfaSetupInit>("/auth/onboarding/2fa/init", {}, bearer(onboardingToken))}
        confirm={async (code) => (await api.post<MfaConfirmResult>("/auth/onboarding/2fa/confirm", { code }, bearer(onboardingToken))).backup_codes}
        onDone={() => finish("Two-factor authentication is on")} doneLabel="Continue to dashboard" />
    </>
  );
}

function CredentialsStep({ onSubmit }: { onSubmit: (v: z.infer<typeof credentialsSchema>) => Promise<void> }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<z.infer<typeof credentialsSchema>>({ resolver: zodResolver(credentialsSchema) });
  const submit = handleSubmit(async (v) => {
    try { await onSubmit(v); }
    catch (e) {
      const err = e as ApiError;
      if (err.code === "INVALID_CREDENTIALS") setError("password", { message: "Incorrect email or password" });
      else toast.error(err.message);
    }
  });
  return (
    <form onSubmit={submit} noValidate className="animate-fade-up">
      <Heading icon={<Lock />} title="Welcome back" text="Sign in to manage applications, emails and notifications." />
      <div className="space-y-4">
        <Field label="Work email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="username" autoFocus placeholder="you@dolfhydrometric.com" icon={<Mail />} invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}
          action={<Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>}>
          <PasswordInput id="password" autoComplete="current-password" placeholder="••••••••••••" invalid={!!errors.password} {...register("password")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Sign in</Button>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">New administrator? Use the temporary password from your welcome email.</p>
    </form>
  );
}

function MfaStep({ mfaToken, onBack, onDone }: { mfaToken: string; onBack: () => void; onDone: () => void }) {
  const [code, setCode] = React.useState("");
  const [backup, setBackup] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const verify = async (value: string) => {
    if (busy || !value) return;
    setBusy(true); setError(null);
    try { await api.post("/auth/2fa/verify", { mfa_token: mfaToken, code: value }); onDone(); }
    catch (e) {
      const err = e as ApiError;
      setError(err.code === "INVALID_TOKEN" ? "This sign-in expired. Please start again." : err.message);
      setCode("");
      if (err.code === "INVALID_TOKEN") onBack();
    } finally { setBusy(false); }
  };

  return (
    <div className="animate-fade-up">
      <button onClick={onBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back</button>
      <Heading icon={<ShieldCheck />} title="Two-step verification" text={backup ? "Enter one of your backup codes. Each code works once." : "Enter the 6-digit code from your authenticator app."} />
      <div className="space-y-5">
        {backup ? (
          <Field label="Backup code" htmlFor="backup"><Input id="backup" autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCDE-FGH23" className="text-center font-mono tracking-widest" icon={<KeyRound />} invalid={!!error} /></Field>
        ) : (
          <OtpInput value={code} onChange={setCode} onComplete={verify} disabled={busy} invalid={!!error} />
        )}
        {error && <p role="alert" className="text-center text-sm font-medium text-danger">{error}</p>}
        <Button size="lg" className="w-full" loading={busy} disabled={backup ? code.length < 8 : code.length !== 6} onClick={() => verify(code)}>Verify</Button>
        <button type="button" className="mx-auto block text-sm font-medium text-primary hover:underline" onClick={() => { setBackup((b) => !b); setCode(""); setError(null); }}>
          {backup ? "Use my authenticator app" : "Lost your phone? Use a backup code"}
        </button>
      </div>
    </div>
  );
}

function SetPasswordStep({ token, onDone }: { token: string; onDone: (password: string) => Promise<void> }) {
  const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema), defaultValues: { password: "", confirm: "" } });
  const value = useWatch({ control, name: "password" });
  const submit = handleSubmit(async (v) => {
    try { await api.post("/auth/onboarding/password", { new_password: v.password }, bearer(token)); await onDone(v.password); }
    catch (e) {
      const err = e as ApiError;
      if (err.code === "WEAK_PASSWORD" || err.status === 422) setError("password", { message: err.details?.[0]?.message ?? err.message });
      else toast.error(err.message);
    }
  });
  return (
    <form onSubmit={submit} noValidate className="animate-fade-up">
      <Heading icon={<KeyRound />} title="Choose your own password" text="Replace the temporary password from your welcome email. This is the only time it works." />
      <div className="space-y-4">
        <Field label="New password" htmlFor="np" error={errors.password?.message}><PasswordInput id="np" autoComplete="new-password" autoFocus invalid={!!errors.password} {...register("password")} /></Field>
        <PasswordChecklist value={value} />
        <Field label="Confirm new password" htmlFor="cp" error={errors.confirm?.message}><PasswordInput id="cp" autoComplete="new-password" invalid={!!errors.confirm} {...register("confirm")} /></Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Save password and continue</Button>
      </div>
    </form>
  );
}
