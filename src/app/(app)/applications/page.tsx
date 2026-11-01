import { Suspense } from "react";
import type { Metadata } from "next";
import { ApplicationsPage } from "@/features/applications/applications-page";

export const metadata: Metadata = { title: "Applications" };
export default function Page() { return <Suspense><ApplicationsPage /></Suspense>; }
