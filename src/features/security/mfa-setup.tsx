"use client";

import * as React from "react";
import Image from "next/image";
import { Check, Download, KeyRound, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { OtpInput } from "@/components/ui/otp-input";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import type { MfaSetupInit } from "@/lib/api/types";

interface MfaSetupProps {
  init: () => Promise<MfaSetupInit>;
  confirm: (code: string) => Promise<string[]>;
  onDone: () => void;
  doneLabel?: string;
}

/** Scan QR → enter first code → save backup codes. Used on the sign-in flow and on the Security page. */
export function MfaSetup({ init, confirm, onDone, doneLabel = "Finish" }: MfaSetupProps) {
  const [setup, setSetup] = React.useState<MfaSetupInit | null>(null);
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [backup, setBackup] = React.useState<string[] | null>(null);
  const [saved, setSaved] = React.useState(false);
  const started = React.useRef(false);

  React.useEffect(() => {
    if (started.current) return;
    started.current = true;
    init().then(setSetup).catch((e: ApiError) => setError(e.message));
  }, [init]);

  const submit = async (value: string) => {
    if (value.length !== 6 || busy) return;
    setBusy(true); setError(null);
    try { setBackup(await confirm(value)); toast.success("Two-factor authentication is on"); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Something went wrong"); setCode(""); }
    finally { setBusy(false); }
  };

  if (backup) {
    const text = `Summit Console backup codes\nEach code works once. Keep them somewhere safe.\n\n${backup.join("\n")}\n`;
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl bg-warning-soft p-3.5 text-[13px]"><KeyRound className="mt-0.5 size-4 shrink-0 text-warning" />
          <p><span className="font-semibold">Save these backup codes now.</span> They are shown only once. Each one signs you in once if you lose your phone.</p></div>
        <ul className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/50 p-4 font-mono text-sm">
          {backup.map((c) => <li key={c} className="tabular rounded-md bg-card px-3 py-1.5 text-center shadow-sm">{c}</li>)}
        </ul>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={async () => { await navigator.clipboard.writeText(backup.join("\n")); toast.success("Codes copied"); }}>Copy all</Button>
          <Button variant="outline" className="flex-1" onClick={() => {
            const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([text], { type: "text/plain" })), download: "summit-backup-codes.txt" });
            a.click(); URL.revokeObjectURL(a.href);
          }}><Download className="size-4" />Download</Button>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm"><Checkbox checked={saved} onChange={(e) => setSaved(e.target.checked)} />I have stored these codes safely</label>
        <Button className="w-full" size="lg" disabled={!saved} onClick={onDone}><Check className="size-4" />{doneLabel}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="space-y-1 text-[13px] text-muted-foreground">
        <li className="flex gap-2"><Smartphone className="mt-0.5 size-4 shrink-0" />Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password) and scan the code.</li>
      </ol>
      <div className="mx-auto grid size-52 place-items-center rounded-2xl border border-border bg-white p-3 shadow-sm">
        {setup ? <Image src={setup.qr_svg_data_uri} alt="QR code for your authenticator app" width={190} height={190} unoptimized /> : <Skeleton className="size-44" />}
      </div>
      {setup && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3.5 py-2.5 text-xs">
          <span className="text-muted-foreground">Can&apos;t scan? Enter this key:</span>
          <span className="flex items-center gap-1 font-mono font-medium tracking-wider">{setup.secret.match(/.{1,4}/g)?.join(" ")}<CopyButton value={setup.secret} label="Copy key" /></span>
        </div>
      )}
      <div className="space-y-3">
        <p className="text-center text-sm font-medium">Enter the 6-digit code from the app</p>
        <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={!setup || busy} invalid={!!error} />
        {error && <p role="alert" className="text-center text-sm font-medium text-danger">{error}</p>}
      </div>
      <Button className="w-full" size="lg" loading={busy} disabled={!setup || code.length !== 6} onClick={() => submit(code)}>Verify and enable</Button>
    </div>
  );
}
