import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div><BrandMark className="mx-auto mb-6 size-14" /><p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-muted-foreground">The link may be wrong or the page was moved.</p>
        <Button asChild size="lg" className="mt-8"><Link href="/">Back to dashboard</Link></Button></div>
    </div>
  );
}
