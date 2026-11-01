import type { Metadata } from "next";
import { ApplicationDetailView } from "@/features/applications/application-detail";

export const metadata: Metadata = { title: "Application" };

export default async function Page({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return <ApplicationDetailView reference={decodeURIComponent(reference)} />;
}
