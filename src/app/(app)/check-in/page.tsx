import type { Metadata } from "next";
import { CheckinPage } from "@/features/checkin/checkin-page";

export const metadata: Metadata = { title: "Check-in" };
export default function Page() { return <CheckinPage />; }