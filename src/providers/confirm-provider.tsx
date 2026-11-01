"use client";

import * as React from "react";
import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

interface ConfirmOptions {
  title: string; description?: React.ReactNode; confirmLabel?: string; cancelLabel?: string; tone?: "default" | "danger" | "success" | "warning";
  note?: { label: string; placeholder?: string; required?: boolean; maxLength?: number };
}
type Result = { confirmed: boolean; note?: string };
type Confirm = (options: ConfirmOptions) => Promise<Result>;

const ConfirmContext = React.createContext<Confirm | null>(null);

/** Promise-based confirmation modal: `const { confirmed, note } = await confirm({ ... })`. */
export function useConfirm(): Confirm {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = React.useState<ConfirmOptions | null>(null);
  const [note, setNote] = React.useState("");
  const resolver = React.useRef<((r: Result) => void) | null>(null);

  const confirm = React.useCallback<Confirm>((options) => new Promise<Result>((resolve) => {
    resolver.current = resolve; setNote(""); setOpts(options);
  }), []);

  const close = (confirmed: boolean) => {
    resolver.current?.({ confirmed, note: confirmed ? note.trim() || undefined : undefined });
    resolver.current = null; setOpts(null);
  };
  const tone = opts?.tone ?? "default";
  const Icon = tone === "success" ? CircleCheck : tone === "danger" ? OctagonAlert : TriangleAlert;
  const needsNote = !!opts?.note?.required && !note.trim();

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!opts} onOpenChange={(o) => !o && close(false)} title={opts?.title ?? ""} description={opts?.description} size="sm" icon={<Icon />}
        footer={<>
          <Button variant="outline" onClick={() => close(false)}>{opts?.cancelLabel ?? "Cancel"}</Button>
          <Button variant={tone === "danger" ? "danger" : tone === "success" ? "success" : "primary"} disabled={needsNote} onClick={() => close(true)}>{opts?.confirmLabel ?? "Confirm"}</Button>
        </>}>
        {opts?.note && (
          <Field label={opts.note.label} htmlFor="confirm-note" hint={opts.note.required ? undefined : "Optional. Visible to administrators only."}>
            <Textarea id="confirm-note" autoFocus value={note} maxLength={opts.note.maxLength ?? 1000} onChange={(e) => setNote(e.target.value)} placeholder={opts.note.placeholder} />
          </Field>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}
