"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, CircleCheck, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, PasswordInput } from "@/components/ui/input";
import { PasswordChecklist, passwordIsStrong } from "@/components/ui/password-checklist";
import { ApiError, api } from "@/lib/api/client";

const back = <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to sign in</Link>;

export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().email("Enter a valid email address") })) });
  const submit = handleSubmit(async ({ email }) => {
    try { await api.post("/auth/password/forgot", { email }); setSent(email); } catch (e) { toast.error((e as ApiError).message); }
  });
  if (sent) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-success-soft text-success"><CircleCheck className="size-7" /></div>
        <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">If <span className="font-medium text-foreground">{sent}</span> belongs to an administrator, a reset link is on its way. It expires in 30 minutes.</p>
        <Button asChild variant="outline" className="mt-8 w-full"><Link href="/login">Back to sign in</Link></Button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="animate-fade-up">
      {back}
      <div className="mb-8"><h1 className="text-2xl font-semibold tracking-tight">Forgot your password?</h1><p className="mt-1.5 text-sm text-muted-foreground">Enter your email and we&apos;ll send you a link to choose a new one.</p></div>
      <div className="space-y-4">
        <Field label="Work email" htmlFor="email" error={errors.email?.message}><Input id="email" type="email" autoFocus icon={<Mail />} invalid={!!errors.email} {...register("email")} /></Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Send reset link</Button>
      </div>
    </form>
  );
}

const schema = z.object({ password: z.string().refine(passwordIsStrong, "Password does not meet all requirements"), confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [done, setDone] = React.useState(false);
  const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });
  const value = useWatch({ control, name: "password" });
  const submit = handleSubmit(async (v) => {
    try { await api.post("/auth/password/reset", { token, new_password: v.password }); setDone(true); }
    catch (e) {
      const err = e as ApiError;
      if (err.code === "INVALID_TOKEN") toast.error("This reset link is invalid or has expired. Request a new one.");
      else setError("password", { message: err.details?.[0]?.message ?? err.message });
    }
  });
  if (!token) return <div className="animate-fade-up text-center"><h1 className="text-2xl font-semibold">Reset link missing</h1><p className="mt-2 text-sm text-muted-foreground">Open the link from your email, or request a new one.</p><Button asChild className="mt-6"><Link href="/forgot-password">Request a new link</Link></Button></div>;
  if (done) {
    return (
      <div className="animate-fade-up text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-success-soft text-success"><CircleCheck className="size-7" /></div>
        <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
        <p className="mt-2 text-sm text-muted-foreground">All devices were signed out. You&apos;ll need your authenticator code to sign in.</p>
        <Button asChild size="lg" className="mt-8 w-full"><Link href="/login">Continue to sign in</Link></Button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="animate-fade-up">
      {back}
      <div className="mb-8"><div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground"><KeyRound className="size-6" /></div><h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1></div>
      <div className="space-y-4">
        <Field label="New password" htmlFor="np" error={errors.password?.message}><PasswordInput id="np" autoComplete="new-password" autoFocus invalid={!!errors.password} {...register("password")} /></Field>
        <PasswordChecklist value={value} />
        <Field label="Confirm new password" htmlFor="cp" error={errors.confirm?.message}><PasswordInput id="cp" autoComplete="new-password" invalid={!!errors.confirm} {...register("confirm")} /></Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Update password</Button>
      </div>
    </form>
  );
}
