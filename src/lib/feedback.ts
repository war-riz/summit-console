let ctx: AudioContext | null = null;

/** Short beep + vibration so volunteers can work without staring at the screen. */
export function feedback(kind: "success" | "warn" | "error", sound = true) {
  try { navigator.vibrate?.(kind === "success" ? 70 : [120, 60, 120]); } catch { /* not supported */ }
  if (!sound) return;
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.frequency.value = kind === "success" ? 880 : kind === "warn" ? 520 : 220;
    osc.type = kind === "success" ? "sine" : "square";
    gain.gain.setValueAtTime(0.08, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (kind === "success" ? 0.16 : 0.32));
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.35);
  } catch { /* audio blocked */ }
}