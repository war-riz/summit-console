"use client";

import * as React from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";
import { ConfirmProvider } from "./confirm-provider";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster position="top-right" closeButton theme={(resolvedTheme as "light" | "dark") ?? "light"} offset={20}
      style={{ "--normal-bg": "var(--card)", "--normal-text": "var(--foreground)", "--normal-border": "var(--border)", "--border-radius": "14px",
        "--success-bg": "var(--success-soft)", "--success-text": "var(--success)", "--success-border": "var(--success)",
        "--error-bg": "var(--danger-soft)", "--error-text": "var(--danger)", "--error-border": "var(--danger)",
        "--warning-bg": "var(--warning-soft)", "--warning-text": "var(--warning)", "--warning-border": "var(--warning)",
        "--info-bg": "var(--info-soft)", "--info-text": "var(--info)", "--info-border": "var(--info)" } as React.CSSProperties} />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
        <ThemedToaster />
      </QueryProvider>
    </ThemeProvider>
  );
}
