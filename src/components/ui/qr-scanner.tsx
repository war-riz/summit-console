"use client";

import * as React from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface QrScannerProps { onScan: (text: string) => void; paused?: boolean; className?: string }
type State = "idle" | "starting" | "ready" | "denied" | "nocamera" | "busy" | "error" | "insecure" | "unsupported";
type Failure = Exclude<State, "idle" | "starting" | "ready">;

const LOCK_MS = 1800;          // how long the frame freezes after a successful read
const DEDUPE_MS = 6000;        // ignore the same QR while it is still held in front of the camera
const MIN_STARTING_MS = 600;   // so "Try again" always gives visible feedback

const MESSAGES: Record<Failure, { title: string; body: string; retry: boolean; reload: boolean }> = {
    denied: { title: "Camera is blocked", body: "Tap the lock icon in the address bar, set Camera to Allow, then tap Try again. If it still fails, reload the page.", retry: true, reload: true },
    busy: { title: "Camera is in use", body: "Another app or browser tab is using the camera (Zoom, Teams, another tab). Close it, then tap Try again.", retry: true, reload: false },
    nocamera: { title: "No camera found", body: "This device has no usable camera. Use a phone, or check people in from the Manual tab.", retry: true, reload: false },
    error: { title: "Couldn't start the camera", body: "Something unexpected happened. Tap Try again, or reload the page.", retry: true, reload: true },
    insecure: { title: "Camera needs a secure page", body: "Open this page over https:// (or localhost). Camera access is not allowed on plain http.", retry: false, reload: false },
    unsupported: { title: "Camera not supported", body: "This browser cannot open the camera. Try Chrome or Safari, or use the Manual tab.", retry: false, reload: false },
};

// Scoped keyframes so no change to globals.css is needed.
const SCAN_CSS = `
@keyframes qr-sweep { 0% { top: 3%; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { top: 97%; opacity: 0; } }
.qr-sweep { animation: qr-sweep 2.2s ease-in-out infinite alternate; }
@media (prefers-reduced-motion: reduce) { .qr-sweep { animation: none; top: 50%; } }
`;

async function openCamera(): Promise<MediaStream> {
    try {
        return await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    } catch (e) {
        const name = (e as DOMException)?.name;
        if (name === "OverconstrainedError" || name === "NotFoundError") return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        throw e;
    }
}

function classify(name: string): Failure {
    if (name === "NotAllowedError" || name === "SecurityError") return "denied";
    if (name === "NotFoundError" || name === "OverconstrainedError") return "nocamera";
    if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "busy";
    return "error";
}

/** Live camera QR reader (jsQR). Starts on tap so the browser's permission prompt always appears; auto-starts once permission is granted. */
export function QrScanner({ onScan, paused, className }: QrScannerProps) {
    const video = React.useRef<HTMLVideoElement>(null);
    const canvas = React.useRef<HTMLCanvasElement>(null);
    const onScanRef = React.useRef(onScan);
    const pausedRef = React.useRef(paused);
    const lockedRef = React.useRef(false);
    const stateRef = React.useRef<State>("idle");
    const lastHit = React.useRef({ text: "", at: 0 });
    const unlockTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
    const [state, setState] = React.useState<State>("idle");
    const [detail, setDetail] = React.useState("");
    const [locked, setLocked] = React.useState(false);
    const [attempt, setAttempt] = React.useState(0);
    React.useEffect(() => { onScanRef.current = onScan; pausedRef.current = paused; stateRef.current = state; });

    // If the user flips Camera to "Allow" in the browser's site settings, start without another tap.
    React.useEffect(() => {
        let cancelled = false;
        let status: PermissionStatus | undefined;
        const onChange = () => {
            if (status?.state === "granted" && stateRef.current !== "ready" && stateRef.current !== "starting") setAttempt((n) => n + 1);
        };
        navigator.permissions?.query({ name: "camera" as PermissionName })
            .then((s) => { if (cancelled) return; status = s; s.addEventListener("change", onChange); })
            .catch(() => { /* Safari: no camera permission query */ });
        return () => { cancelled = true; status?.removeEventListener("change", onChange); };
    }, []);

    React.useEffect(() => {
        let stream: MediaStream | undefined;
        let raf = 0;
        let stopped = false;
        let last = 0;

        const handleHit = (text: string) => {
            const t = Date.now();
            if (lastHit.current.text === text && t - lastHit.current.at < DEDUPE_MS) return;
            lastHit.current = { text, at: t };
            lockedRef.current = true;
            setLocked(true);
            video.current?.pause(); // freeze the last frame so the user sees it was read
            onScanRef.current(text);
            clearTimeout(unlockTimer.current);
            unlockTimer.current = setTimeout(() => {
                lockedRef.current = false;
                setLocked(false);
                video.current?.play().catch(() => { /* ignore */ });
            }, LOCK_MS);
        };

        const tick = (now: number) => {
            if (stopped) return;
            const v = video.current, c = canvas.current;
            if (v && c && !pausedRef.current && !lockedRef.current && v.readyState >= 2 && v.videoWidth > 0 && now - last > 110) { // about 9 reads per second
                last = now;
                const scale = Math.min(1, 640 / v.videoWidth);
                c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
                const g = c.getContext("2d", { willReadFrequently: true });
                if (g) {
                    g.drawImage(v, 0, 0, c.width, c.height);
                    const img = g.getImageData(0, 0, c.width, c.height);
                    const hit = jsQR(img.data, c.width, c.height, { inversionAttempts: "dontInvert" });
                    if (hit?.data) handleHit(hit.data);
                }
            }
            raf = requestAnimationFrame(tick);
        };

        (async () => {
            lockedRef.current = false;
            setLocked(false); // reset the green "scanned" state on every (re)start

            if (!window.isSecureContext) return setState("insecure");
            if (!navigator.mediaDevices?.getUserMedia) return setState("unsupported");

            if (attempt === 0) { // first load: only auto-start if the browser already remembers "allow"
                let granted = false;
                try { granted = (await navigator.permissions.query({ name: "camera" as PermissionName })).state === "granted"; } catch { /* Safari */ }
                if (stopped) return;
                if (!granted) return setState("idle");
            }

            setState("starting");
            setDetail("");
            const began = Date.now();
            try {
                stream = await openCamera();
                if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
                const v = video.current!;
                v.srcObject = stream;
                await v.play();
                if (stopped) return;
                setState("ready");
                raf = requestAnimationFrame(tick);
            } catch (e) {
                stream?.getTracks().forEach((t) => t.stop());
                if (stopped) return;
                const wait = MIN_STARTING_MS - (Date.now() - began);
                if (wait > 0) await new Promise((r) => setTimeout(r, wait));
                if (stopped) return;
                const name = (e as DOMException)?.name ?? "";
                setDetail(name);
                setState(classify(name));
            }
        })();

        return () => {
            stopped = true;
            cancelAnimationFrame(raf);
            clearTimeout(unlockTimer.current);
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, [attempt]);

    const msg = state in MESSAGES ? MESSAGES[state as Failure] : null;
    const frozen = locked || !!paused;

    return (
        <div className={cn("relative aspect-square w-full overflow-hidden rounded-2xl bg-[#04061c]", className)}>
            <style>{SCAN_CSS}</style>
            <video ref={video} playsInline muted autoPlay className="size-full object-cover" />
            <canvas ref={canvas} className="hidden" />

            {state === "ready" && (
                <div aria-hidden className="pointer-events-none absolute inset-[14%]">
                    {["left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl", "right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl"].map((c) => (
                        <span key={c} className={cn("absolute size-10 transition-colors duration-200", locked ? "border-success" : "border-white/90", c)} />))}
                    <span
                        className={cn("qr-sweep absolute inset-x-2 h-0.5 rounded-full", locked ? "bg-success" : "bg-brand-sky/90 shadow-[0_0_12px_var(--brand-sky)]")}
                        style={{ animationPlayState: frozen ? "paused" : "running" }}
                    />
                    {locked && (
                        <span className="absolute inset-0 grid place-items-center">
                            <span className="grid size-16 place-items-center rounded-full bg-success text-white shadow-lg"><CircleCheck className="size-9" /></span>
                        </span>
                    )}
                </div>
            )}

            {state !== "ready" && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
                    {state === "starting" ? <p className="text-sm text-white/70" role="status">Starting camera…</p>
                        : state === "idle" ? (
                            <div className="max-w-xs space-y-3"><Camera className="mx-auto size-8 text-white/70" />
                                <p className="font-medium">Ready to scan</p>
                                <p className="text-sm text-white/70">Your browser will ask to use the camera. Tap Allow.</p>
                                <Button onClick={() => setAttempt((n) => n + 1)}><Camera className="size-4" />Start camera</Button></div>
                        ) : msg && (
                            <div className="max-w-xs space-y-2"><CameraOff className="mx-auto size-8 text-white/70" />
                                <p className="font-medium">{msg.title}</p>
                                <p className="text-sm text-white/70">{msg.body}</p>
                                {(msg.retry || msg.reload) && (
                                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                                        {msg.retry && <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}
                                        {msg.reload && <Button variant="outline" onClick={() => window.location.reload()}>Reload page</Button>}
                                    </div>
                                )}
                                {detail && <p className="pt-1 font-mono text-[11px] text-white/40">{detail}</p>}
                                <p className="pt-1 text-xs text-white/50">You can still check people in from the Manual tab.</p></div>
                        )}
                </div>
            )}
        </div>
    );
}