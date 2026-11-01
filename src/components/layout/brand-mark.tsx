import Image from "next/image";
import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-block size-9 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-black/10", className)}>
      <Image src="/dolf-logo.jpg" alt="D-OLF Hydrometric" fill sizes="96px" priority className="object-contain p-0.5" />
    </span>
  );
}