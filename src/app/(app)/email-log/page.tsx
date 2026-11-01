import { Suspense } from "react";
import type { Metadata } from "next";
import { EmailLogPage } from "@/features/email/email-log-page";

export const metadata: Metadata = { title: "Email delivery" };
export default function Page() { return <Suspense><EmailLogPage /></Suspense>; }
