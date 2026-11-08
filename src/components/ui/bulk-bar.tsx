"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface BulkBarProps {
    count: number;
    onCancel: () => void;
    children: React.ReactNode; // the action buttons
    className?: string;
}

/** Floating action bar for selected table rows. Solid, pinned to the bottom of the screen, never covers rows. */
export function BulkBar({ count, onCancel, children, className }: BulkBarProps) {
    if (count === 0 || typeof document === "undefined") return null;
    return createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6">
            <div
                role="toolbar"
                aria-label="Bulk actions"
                className={cn("pointer-events-auto flex w-full max-w-2xl flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-2xl ring-1 ring-primary/20 animate-fade-up", className)}
            >
                <p className="text-sm font-semibold tabular">{count} selected</p>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {children}
                    <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
                </div>
            </div>
        </div>,
        document.body,
    );
}