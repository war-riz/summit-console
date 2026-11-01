import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const palettes = [
  "from-[#10a0e0] to-[#184080]", "from-[#184080] to-[#202060]", "from-[#0fa07a] to-[#0a6e8a]", "from-[#7c5cff] to-[#202060]", "from-[#e08a10] to-[#b0457a]",
];

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const dims = { sm: "size-8 text-[11px]", md: "size-9 text-xs", lg: "size-14 text-lg" }[size];
  return (
    <span aria-hidden className={cn("inline-grid shrink-0 place-items-center rounded-full bg-linear-to-br font-semibold text-white shadow-sm", palettes[hash % palettes.length], dims, className)}>
      {initials(name)}
    </span>
  );
}
