import { cn } from "@/lib/cn";

/** Simple lightning-and-wave mark echoing the D-OLF Hydrometric logo. Replace with the real logo SVG when available. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#22b6f4" /><stop offset="1" stopColor="#184080" /></linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#bm-g)" />
      <path d="M22.5 7 11 22.5h7L16.5 33 29 16.5h-7.2z" fill="#fff" />
      <path d="M5 31c3.5-3 6.5-3 10 0s6.5 3 10 0 6.5-3 10 0" stroke="#fff" strokeOpacity=".55" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
