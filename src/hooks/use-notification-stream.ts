"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { AppNotification } from "@/lib/api/types";
import { PUBLIC_API_URL } from "@/lib/constants";

/**
 * Live notifications over Server-Sent Events. Exchanges the session for a 60-second ticket
 * (EventSource cannot send headers), reconnects with back-off, and pops a toast for each event.
 */
export function useNotificationStream(enabled: boolean, onOpen?: (link: string) => void) {
  const qc = useQueryClient();
  const open = React.useRef(onOpen);
  React.useEffect(() => { open.current = onOpen; });

  React.useEffect(() => {
    if (!enabled || !PUBLIC_API_URL) return;
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let delay = 3000;
    let stopped = false;

    const connect = async () => {
      try {
        const { ticket } = await api.post<{ ticket: string }>("/admin/notifications/stream-ticket");
        if (stopped) return;
        source = new EventSource(`${PUBLIC_API_URL}/api/v1/admin/notifications/stream?ticket=${encodeURIComponent(ticket)}`);
        source.onopen = () => { delay = 3000; };
        source.addEventListener("notification", (e) => {
          const n = JSON.parse((e as MessageEvent).data) as AppNotification;
          const fn = n.severity === "success" ? toast.success : n.severity === "warning" ? toast.warning : n.severity === "critical" ? toast.error : toast.info;
          fn(n.title, { description: n.body, action: n.link ? { label: "View", onClick: () => open.current?.(n.link!) } : undefined, duration: 8000 });
          qc.invalidateQueries({ queryKey: ["notifications"] });
          qc.invalidateQueries({ queryKey: ["applications"] });
          qc.invalidateQueries({ queryKey: ["stats"] });
        });
        source.onerror = () => { source?.close(); schedule(); };
      } catch { schedule(); }
    };
    const schedule = () => { if (stopped) return; timer = setTimeout(connect, delay); delay = Math.min(delay * 2, 60_000); };

    connect();
    return () => { stopped = true; clearTimeout(timer); source?.close(); };
  }, [enabled, qc]);
}
