import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/constants";
import { cn } from "@/lib/cn";

export const passwordIsStrong = (v: string) => PASSWORD_RULES.every((r) => r.test(v));

export function PasswordChecklist({ value }: { value: string }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(value)).length;
  return (
    <div className="space-y-2.5 rounded-xl bg-muted/60 p-3.5">
      <div className="flex gap-1" aria-hidden>
        {PASSWORD_RULES.map((r, i) => (
          <span key={r.id} className={cn("h-1 flex-1 rounded-full bg-border transition-colors", i < passed && (passed >= 5 ? "bg-success" : passed >= 3 ? "bg-warning" : "bg-danger"))} />
        ))}
      </div>
      <ul className="grid gap-1 text-[13px] sm:grid-cols-2">
        {PASSWORD_RULES.map((r) => {
          const ok = r.test(value);
          return (
            <li key={r.id} className={cn("flex items-center gap-2", ok ? "text-foreground" : "text-muted-foreground")}>
              {ok ? <Check className="size-3.5 text-success" strokeWidth={3} /> : <Circle className="size-3.5" />}{r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
