import type { Metadata } from "next";
import { AdministratorsPage } from "@/features/admins/administrators-page";

export const metadata: Metadata = { title: "Administrators" };
export default function Page() { return <AdministratorsPage />; }
