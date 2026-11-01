"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div><h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">An unexpected error occurred. Try again, and if it keeps happening share this code with the developer: <code className="rounded bg-muted px-1.5 py-0.5">{error.digest ?? "n/a"}</code></p>
        <Button className="mt-6" onClick={reset}>Try again</Button></div>
    </div>
  );
}
