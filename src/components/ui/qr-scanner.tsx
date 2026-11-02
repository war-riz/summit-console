"use client";

import * as React from "react";
import jsQR from "jsqr";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface QrScannerProps { onScan: (text: string) => void; paused?: boolean; className?: string }
type State = "idle" | "starting" | "ready" | "denied" | "nocamera" | "insecure" | "unsupported";

const MESSAGES: Record<Exclude<State, "idle" | "starting" | "ready">, { title: string; body: string; retry: boolean }> = {
    denied: { title: "Camera is blocked", body: "Tap the lock icon in the address bar, set Camera to Allow, then tap Try again.", retry: true },
    nocamera: { title: "No camera found", body: "This device has no usable camera. Use a phone, or check people in from the Manual tab.", retry: true },
    insecure: { title: "Camera needs a secure page", body: "Open this page over https:// (or localhost). Camera access is not allowed on plain http.", retry: false },
    unsupported: { title: "Camera not supported", body: "This browser cannot open the camera. Try Chrome or Safari, or use the Manual tab.", retry: false },
};

/** Live camera QR reader (jsQR). Starts on tap so the browser's permission prompt always appears; auto-starts once permission is granted. */
export function QrScanner({ onScan, paused, className }: QrScannerProps) {
    const video = React.useRef<HTMLVideoElement>(null);
    const canvas = React.useRef<HTMLCanvasElement>(null);
    const onScanRef = React.useRef(onScan);
    const pausedRef = React.useRef(paused);
    const [state, setState] = React.useState<State>("idle");
    const [attempt, setAttempt] = React.useState(0);
    React.useEffect(() => { onScanRef.current = onScan; pausedRef.current = paused; });

    React.useEffect(() => {
        let stream: MediaStream | undefined;
        let raf = 0;
        let stopped = false;
        let last = 0;

        const tick = (now: number) => {
            if (stopped) return;
            const v = video.current, c = canvas.current;
            if (v && c && !pausedRef.current && v.readyState >= 2 && now - last > 110) { // about 9 reads per second
                last = now;
                const scale = Math.min(1, 640 / v.videoWidth);
                c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
                const g = c.getContext("2d", { willReadFrequently: true });
                if (g) {
                    g.drawImage(v, 0, 0, c.width, c.height);
                    const img = g.getImageData(0, 0, c.width, c.height);
                    const hit = jsQR(img.data, c.width, c.height, { inversionAttempts: "dontInvert" });
                    if (hit?.data) onScanRef.current(hit.data);
                }
            }
            raf = requestAnimationFrame(tick);
        };

        (async () => {
            if (!window.isSecureContext) return setState("insecure");
            if (!navigator.mediaDevices?.getUserMedia) return setState("unsupported");

            if (attempt === 0) { // first load: only auto-start if the browser already remembers "allow"
                let granted = false;
                try { granted = (await navigator.permissions.query({ name: "camera" as PermissionName })).state === "granted"; } catch { /* Safari: no camera permission query */ }
                if (stopped) return;
                if (!granted) return setState("idle");
            }

            setState("starting");
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
                if (stopped) return stream.getTracks().forEach((t) => t.stop());
                const v = video.current!;
                v.srcObject = stream;
                await v.play();
                setState("ready");
                raf = requestAnimationFrame(tick);
            } catch (e) {
                const name = (e as DOMException)?.name;
                setState(name === "NotFoundError" || name === "OverconstrainedError" ? "nocamera" : "denied");
            }
        })();

        return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
    }, [attempt]);

    const msg = state in MESSAGES ? MESSAGES[state as keyof typeof MESSAGES] : null;

    return (
        <div className={cn("relative aspect-square w-full overflow-hidden rounded-2xl bg-[#04061c]", className)}>
            <video ref={video} playsInline muted className="size-full object-cover" />
            <canvas ref={canvas} className="hidden" />
            {state === "ready" && (
                <div aria-hidden className="pointer-events-none absolute inset-[14%]">
                    {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map((c) => (
                        <span key={c} className={cn("absolute size-10 border-white/90", c)} />))}
                    <span className="absolute inset-x-2 top-1/2 h-0.5 animate-pulse bg-brand-sky/80 shadow-[0_0_12px_var(--brand-sky)]" />
                </div>
            )}
            {state !== "ready" && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                    {state === "starting" ? <p className="text-sm text-white/70">Starting camera…</p>
                        : state === "idle" ? (
                            <div className="max-w-xs space-y-3"><Camera className="mx-auto size-8 text-white/70" />
                                <p className="font-medium">Ready to scan</p>
                                <p className="text-sm text-white/70">Your browser will ask to use the camera. Tap Allow.</p>
                                <Button onClick={() => setAttempt((n) => n + 1)}><Camera className="size-4" />Start camera</Button></div>
                        ) : msg && (
                            <div className="max-w-xs space-y-2"><CameraOff className="mx-auto size-8 text-white/70" />
                                <p className="font-medium">{msg.title}</p>
                                <p className="text-sm text-white/70">{msg.body}</p>
                                {msg.retry && <Button variant="outline" className="mt-2" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}
                                <p className="pt-1 text-xs text-white/50">You can still check people in from the Manual tab.</p></div>
                        )}
                </div>
            )}
        </div>
    );
}