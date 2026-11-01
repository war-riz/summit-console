"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" } as const;

interface ModalProps {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: React.ReactNode; size?: keyof typeof sizes;
  children?: React.ReactNode; footer?: React.ReactNode; dismissible?: boolean; icon?: React.ReactNode;
}

export function Modal({ open, onOpenChange, title, description, size = "md", children, footer, dismissible = true, icon }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => (dismissible || o) && onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-[#04061c]/60 backdrop-blur-sm" />
        <Dialog.Content
          onInteractOutside={(e) => !dismissible && e.preventDefault()} onEscapeKeyDown={(e) => !dismissible && e.preventDefault()}
          className={cn("fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-2rem)] animate-pop flex-col rounded-2xl border border-border bg-card shadow-(--shadow-modal) focus:outline-none", sizes[size])}>
          <div className="flex items-start gap-3.5 px-6 pb-3 pt-6">
            {icon && <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-5">{icon}</div>}
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-base font-semibold tracking-tight">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm text-muted-foreground">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
            </div>
            {dismissible && (
              <Dialog.Close aria-label="Close" className="-mr-2 -mt-1 grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></Dialog.Close>
            )}
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-3">{children}</div>}
          {footer && <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
