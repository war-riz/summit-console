"use client";

import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-local-storage";
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from "@/components/ui/dropdown-menu";

const options = [{ value: "light", label: "Light", Icon: Sun }, { value: "dark", label: "Dark", Icon: Moon }, { value: "system", label: "System", Icon: Monitor }] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  return (
    <DropdownMenu>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <Sun className="size-4.5 scale-100 dark:scale-0" /><Moon className="absolute size-4.5 scale-0 dark:scale-100" />
        </Button>
      </DropdownTrigger>
      <DropdownContent className="min-w-40">
        {options.map(({ value, label, Icon }) => (
          <DropdownItem key={value} onSelect={() => setTheme(value)}><Icon />{label}{mounted && theme === value && <Check className="ml-auto text-primary!" />}</DropdownItem>
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}
