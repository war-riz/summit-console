import { Suspense } from "react";
import type { Metadata } from "next";
import { SecurityPage } from "@/features/security/security-page";

export const metadata: Metadata = { title: "Security" };
export default function Page() { return <Suspense><SecurityPage /></Suspense>; }
